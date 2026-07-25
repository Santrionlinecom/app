#!/usr/bin/env node
/**
 * Offline multi-kitab ingest for priority books into production D1 + Vectorize.
 * Uses temporary remote worker /embed for Workers AI, then wrangler vectorize upsert + D1 SQL.
 *
 * Usage:
 *   node scripts/kitab/ingest-priority-books.mjs --smoke-url http://127.0.0.1:8789
 *   node scripts/kitab/ingest-priority-books.mjs --smoke-url http://127.0.0.1:8789 --book aqidatul-awam --replace
 *   node scripts/kitab/ingest-priority-books.mjs --smoke-url http://127.0.0.1:8789 --dry-run
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CHUNK_DIR = join(ROOT, 'data/kitab/priority/chunks');
const WORKDIR = join(ROOT, '.tmp/kitab-reingest');
const INDEX_NAME = 'santri_kitab_index';
const DB_NAME = 'db-app';
const EMBEDDING_MODEL = '@cf/google/embeddinggemma-300m';
const EMBED_BATCH = 15;

const args = process.argv.slice(2);
const getArg = (name) => {
	const idx = args.indexOf(name);
	return idx >= 0 ? args[idx + 1] : null;
};
const has = (name) => args.includes(name);
const DRY_RUN = has('--dry-run');
const REPLACE = has('--replace');
const SMOKE_URL = (getArg('--smoke-url') || process.env.SMOKE_URL || '').replace(/\/$/, '');
const ONLY_BOOK = getArg('--book');

if (!SMOKE_URL) {
	console.error('Need --smoke-url http://127.0.0.1:8789 (running wrangler dev --remote smoke worker)');
	process.exit(1);
}

const run = (command, commandArgs) => {
	const result = spawnSync(command, commandArgs, {
		cwd: ROOT,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024
	});
	if (result.status !== 0) {
		throw new Error(`${command} ${commandArgs.join(' ')}\n${result.stdout}\n${result.stderr}`);
	}
	return result.stdout ?? '';
};

const runJsonish = (command, commandArgs) => {
	const stdout = run(command, commandArgs);
	// Prefer the last JSON value in noisy wrangler output.
	const matches = [...stdout.matchAll(/(\{[\s\S]*\}|\[[\s\S]*\])/g)];
	if (!matches.length) throw new Error(`No JSON:\n${stdout.slice(0, 400)}`);
	let lastError = null;
	for (let i = matches.length - 1; i >= 0; i -= 1) {
		try {
			return JSON.parse(matches[i][0]);
		} catch (error) {
			lastError = error;
		}
	}
	throw new Error(`JSON parse failed: ${lastError}`);
};

const d1 = (sql) => {
	const payload = runJsonish('npx', [
		'wrangler',
		'd1',
		'execute',
		DB_NAME,
		'--remote',
		'--json',
		'--command',
		sql
	]);
	const first = Array.isArray(payload) ? payload[0] : payload;
	if (!first?.success) throw new Error(`D1 fail: ${JSON.stringify(first)}`);
	return first.results ?? [];
};

const esc = (value) => String(value ?? '').replace(/'/g, "''");

const chunk = (items, size) => {
	const out = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
};

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const embedBatch = async (texts) => {
	const res = await fetch(`${SMOKE_URL}/embed`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ texts })
	});
	const body = await res.json();
	if (!res.ok || !body?.ok) throw new Error(`embed failed: ${JSON.stringify(body)}`);
	if (!Array.isArray(body.vectors) || body.vectors.length !== texts.length) {
		throw new Error('embed vector count mismatch');
	}
	return body.vectors;
};

const activeSlugs = new Set(
	d1(`SELECT kitab_slug FROM kitab_corpora WHERE status = 'indexed'`).map((r) => r.kitab_slug)
);

const files = readdirSync(CHUNK_DIR)
	.filter((name) => name.endsWith('.chunks.json') && name !== 'summary.json')
	.filter((name) => (ONLY_BOOK ? name.startsWith(`${ONLY_BOOK}.`) : true));

if (!files.length) throw new Error(`No chunk files in ${CHUNK_DIR}`);

mkdirSync(WORKDIR, { recursive: true });
const report = { ok: true, dryRun: DRY_RUN, books: [], smokeUrl: SMOKE_URL };

for (const file of files) {
	const rows = JSON.parse(readFileSync(join(CHUNK_DIR, file), 'utf8'));
	if (!Array.isArray(rows) || !rows.length) continue;
	const slug = rows[0].kitabSlug;
	const corpusKey = rows[0].corpusKey;
	const title = rows[0].title;
	const indexRevision = randomUUID();

	if (activeSlugs.has(slug) && !REPLACE) {
		report.books.push({ slug, skipped: true, reason: 'already active/indexed (pass --replace)' });
		console.log(JSON.stringify({ phase: 'skip_active', slug }));
		continue;
	}

	console.log(
		JSON.stringify({
			phase: 'book_start',
			slug,
			chunks: rows.length,
			indexRevision,
			title,
			replace: REPLACE && activeSlugs.has(slug)
		})
	);

	if (DRY_RUN) {
		report.books.push({ slug, dryRun: true, chunks: rows.length, sampleId: rows[0].id, replace: REPLACE });
		continue;
	}

	// On replace: delete old vectors + D1 rows for this slug first.
	if (REPLACE) {
		const oldIds = d1(`SELECT id FROM kitab_referensi WHERE kitab_slug = '${esc(slug)}'`).map((r) => r.id);
		console.log(JSON.stringify({ phase: 'replace_cleanup', slug, oldIds: oldIds.length }));
		for (const idBatch of chunk(oldIds, 20)) {
			if (!idBatch.length) continue;
			const delOut = run('npx', [
				'wrangler',
				'vectorize',
				'delete-vectors',
				INDEX_NAME,
				'--ids',
				...idBatch
			]);
			console.log(
				JSON.stringify({
					phase: 'deleted_vectors',
					slug,
					count: idBatch.length,
					out: delOut.trim().slice(0, 180)
				})
			);
		}
		d1(`DELETE FROM kitab_referensi WHERE kitab_slug = '${esc(slug)}'`);
	}

	// Reserve corpus registry (production column: error_message)
	d1(
		`INSERT INTO kitab_corpora (
			kitab_slug, corpus_key, index_revision, expected_chunks, status, error_message, created_at, updated_at
		) VALUES (
			'${esc(slug)}', '${esc(corpusKey)}', '${esc(indexRevision)}', ${rows.length},
			'indexing', NULL, datetime('now'), datetime('now')
		)
		ON CONFLICT(kitab_slug) DO UPDATE SET
			corpus_key = excluded.corpus_key,
			index_revision = excluded.index_revision,
			expected_chunks = excluded.expected_chunks,
			status = 'indexing',
			error_message = NULL,
			updated_at = datetime('now')`
	);

	const reserved = d1(
		`SELECT status, index_revision FROM kitab_corpora WHERE kitab_slug = '${esc(slug)}'`
	)[0];
	if (!reserved || reserved.status !== 'indexing' || reserved.index_revision !== indexRevision) {
		report.books.push({ slug, skipped: true, reason: 'could not reserve', reserved });
		continue;
	}

	const vectorsOut = [];
	try {
		for (const [batchIdx, batch] of chunk(rows, EMBED_BATCH).entries()) {
			const texts = batch.map((r) => r.chunkText);
			const vectors = await embedBatch(texts);
			const valueSql = [];
			for (let i = 0; i < batch.length; i += 1) {
				const row = batch[i];
				const values = vectors[i];
				if (!Array.isArray(values) || values.length !== 768) {
					throw new Error(`bad dims for ${row.id}`);
				}
				vectorsOut.push({
					id: row.id,
					values,
					metadata: {
						embedding_model: EMBEDDING_MODEL,
						index_revision: indexRevision
					}
				});
				valueSql.push(
					`('${esc(row.id)}', '${esc(row.title)}', NULL, NULL, '${esc(row.chunkText)}',
					'${esc(row.kitabSlug)}', '${esc(row.sourceType)}', '${esc(row.sourceRef)}',
					'${esc(row.sourceNote)}', ${row.chapter ? `'${esc(row.chapter)}'` : 'NULL'}, ${
						row.sectionTitle ? `'${esc(row.sectionTitle)}'` : 'NULL'
					}, ${Number(row.chunkIndex)},
					'${esc(row.author)}', '${esc(row.category)}', '${esc(row.madhhab)}',
					'${esc(row.corpusKey)}', '${esc(EMBEDDING_MODEL)}', '${esc(indexRevision)}',
					'indexing', NULL, NULL, datetime('now'), datetime('now'))`
				);
			}
			// One D1 round-trip per embed batch (max 15 rows).
			d1(
				`INSERT INTO kitab_referensi (
					id, judul, halaman, jilid, isi_teks, kitab_slug, source_type, source_ref,
					source_note, chapter, section_title, chunk_index, author, category, madhhab,
					corpus_key, embedding_model, index_revision, status, index_error, indexed_at,
					created_at, updated_at
				) VALUES ${valueSql.join(',\n')}
				ON CONFLICT(id) DO UPDATE SET
					judul = excluded.judul,
					isi_teks = excluded.isi_teks,
					kitab_slug = excluded.kitab_slug,
					source_type = excluded.source_type,
					source_ref = excluded.source_ref,
					source_note = excluded.source_note,
					chapter = excluded.chapter,
					section_title = excluded.section_title,
					chunk_index = excluded.chunk_index,
					author = excluded.author,
					category = excluded.category,
					madhhab = excluded.madhhab,
					corpus_key = excluded.corpus_key,
					embedding_model = excluded.embedding_model,
					index_revision = excluded.index_revision,
					status = 'indexing',
					index_error = NULL,
					indexed_at = NULL,
					updated_at = datetime('now')`
			);
			console.log(JSON.stringify({ phase: 'embedded', slug, batchIdx, count: batch.length }));
			sleep(400);
		}

		// Upsert vectors in parts of 50
		for (const [partIdx, part] of chunk(vectorsOut, 50).entries()) {
			const partPath = join(WORKDIR, `priority-${slug}-${indexRevision}-${partIdx}.ndjson`);
			writeFileSync(partPath, part.map((v) => JSON.stringify(v)).join('\n') + '\n');
			const out = run('npx', [
				'wrangler',
				'vectorize',
				'upsert',
				INDEX_NAME,
				'--file',
				partPath,
				'--batch-size',
				'50'
			]);
			console.log(
				JSON.stringify({
					phase: 'upserted',
					slug,
					partIdx,
					count: part.length,
					out: out.trim().slice(0, 220)
				})
			);
		}

		// Verify sample then mark indexed
		const sampleId = rows[0].id;
		let visible = false;
		for (let attempt = 1; attempt <= 20; attempt += 1) {
			try {
				const sample = runJsonish('npx', [
					'wrangler',
					'vectorize',
					'get-vectors',
					INDEX_NAME,
					'--ids',
					sampleId
				]);
				const vector = Array.isArray(sample) ? sample[0] : null;
				const meta = vector?.metadata ?? null;
				console.log(JSON.stringify({ phase: 'verify', slug, attempt, meta, hasValues: Boolean(vector?.values?.length) }));
				if (meta?.index_revision === indexRevision) {
					visible = true;
					break;
				}
			} catch (error) {
				console.log(
					JSON.stringify({
						phase: 'verify_error',
						slug,
						attempt,
						error: error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160)
					})
				);
			}
			sleep(3000);
		}
		if (!visible) throw new Error(`vector not visible for ${sampleId}`);

		d1(
			`UPDATE kitab_referensi
			 SET status = 'indexed', index_error = NULL, indexed_at = datetime('now'), updated_at = datetime('now')
			 WHERE kitab_slug = '${esc(slug)}' AND index_revision = '${esc(indexRevision)}'`
		);
		d1(
			`UPDATE kitab_corpora
			 SET status = 'indexed', error_message = NULL, updated_at = datetime('now')
			 WHERE kitab_slug = '${esc(slug)}' AND index_revision = '${esc(indexRevision)}'`
		);

		const count = d1(
			`SELECT COUNT(*) AS n FROM kitab_referensi WHERE kitab_slug = '${esc(slug)}' AND status = 'indexed'`
		)[0]?.n;
		report.books.push({
			slug,
			ok: true,
			chunks: rows.length,
			indexed: count,
			indexRevision,
			sampleId
		});
		activeSlugs.add(slug);
		console.log(JSON.stringify({ phase: 'book_done', slug, indexed: count }));
	} catch (error) {
		const message = error instanceof Error ? error.message.slice(0, 400) : String(error).slice(0, 400);
		d1(
			`UPDATE kitab_referensi
			 SET status = 'failed', index_error = '${esc(message)}', updated_at = datetime('now')
			 WHERE kitab_slug = '${esc(slug)}' AND index_revision = '${esc(indexRevision)}'`
		);
		d1(
			`UPDATE kitab_corpora
			 SET status = 'failed', error_message = '${esc(message)}', updated_at = datetime('now')
			 WHERE kitab_slug = '${esc(slug)}' AND index_revision = '${esc(indexRevision)}'`
		);
		report.books.push({ slug, ok: false, error: message, indexRevision });
		console.error(JSON.stringify({ phase: 'book_failed', slug, error: message }));
	}
}

const finalCounts = d1(
	`SELECT kitab_slug, status, COUNT(*) AS n FROM kitab_referensi GROUP BY kitab_slug, status ORDER BY kitab_slug`
);
const corpora = d1(
	`SELECT kitab_slug, status, expected_chunks, index_revision FROM kitab_corpora ORDER BY kitab_slug`
);
report.finalCounts = finalCounts;
report.corpora = corpora;
const reportPath = join(WORKDIR, `priority-ingest-report-${Date.now()}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath }, null, 2));
