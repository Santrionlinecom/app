#!/usr/bin/env node
/**
 * Reingest / backfill for existing santri_kitab_index vectors.
 *
 * Why:
 * - Production currently has legacy Vectorize metadata (full text + many fields).
 * - Current rag.ts writes compact metadata only: { embedding_model, index_revision }.
 * - D1 rows still have null index_revision while kitab_corpora uses 'legacy'.
 *
 * What this does:
 * 1. Export all kitab_referensi rows from remote D1.
 * 2. Fetch existing vectors by ID (reuse values — same embedding model).
 * 3. Upsert compact metadata with a fresh index_revision.
 * 4. Patch D1 row + corpus registry to the same revision and indexed status.
 *
 * Safe defaults:
 * - Model must already be @cf/google/embeddinggemma-300m
 * - Does not delete vectors
 * - Idempotent if re-run with a new revision
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const EMBEDDING_MODEL = '@cf/google/embeddinggemma-300m';
const INDEX_NAME = 'santri_kitab_index';
const DB_NAME = 'db-app';
const WORKDIR = join(ROOT, '.tmp/kitab-reingest');
const BATCH = 20;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');

const run = (command, commandArgs, options = {}) => {
	const result = spawnSync(command, commandArgs, {
		cwd: ROOT,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		...options
	});
	if (result.status !== 0) {
		const detail = [result.stdout, result.stderr].filter(Boolean).join('\n');
		throw new Error(`${command} ${commandArgs.join(' ')} failed:\n${detail}`);
	}
	return result.stdout ?? '';
};

const runJsonish = (command, commandArgs) => {
	const stdout = run(command, commandArgs);
	const start = stdout.indexOf('[');
	const startObj = stdout.indexOf('{');
	let cut = -1;
	if (start >= 0 && (startObj < 0 || start < startObj)) cut = start;
	else if (startObj >= 0) cut = startObj;
	if (cut < 0) throw new Error(`No JSON in output for ${command} ${commandArgs.join(' ')}\n${stdout.slice(0, 500)}`);
	return JSON.parse(stdout.slice(cut));
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
	if (!first?.success) throw new Error(`D1 failed: ${JSON.stringify(first)}`);
	return first.results ?? [];
};

const chunk = (items, size) => {
	const out = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
};

const main = () => {
	mkdirSync(WORKDIR, { recursive: true });
	const indexRevision = process.env.INDEX_REVISION || randomUUID();
	const reportPath = join(WORKDIR, `report-${indexRevision}.json`);

	console.log(JSON.stringify({ phase: 'start', DRY_RUN, indexRevision, WORKDIR }, null, 2));

	const rows = d1(
		`SELECT id, judul, halaman, jilid, kitab_slug, source_type, source_ref, source_note,
		        chapter, section_title, chunk_index, author, category, madhhab, corpus_key,
		        embedding_model, index_revision, status, length(isi_teks) AS text_len
		 FROM kitab_referensi
		 ORDER BY kitab_slug, CAST(halaman AS INTEGER), chunk_index, id`
	);

	if (!rows.length) throw new Error('No rows in kitab_referensi');

	const badModel = rows.filter((row) => row.embedding_model && row.embedding_model !== EMBEDDING_MODEL);
	if (badModel.length && !FORCE) {
		throw new Error(
			`${badModel.length} rows have non-target embedding_model. Re-embed required or pass --force.`
		);
	}

	const bySlug = new Map();
	for (const row of rows) {
		const slug = row.kitab_slug || 'unknown';
		bySlug.set(slug, (bySlug.get(slug) || 0) + 1);
	}

	const ids = rows.map((row) => row.id);
	const compactVectors = [];
	const missing = [];

	for (const batch of chunk(ids, BATCH)) {
		const idArgs = batch.flatMap((id) => ['--ids', id]);
		const vectors = runJsonish('npx', ['wrangler', 'vectorize', 'get-vectors', INDEX_NAME, ...idArgs]);
		const found = new Map((Array.isArray(vectors) ? vectors : []).map((v) => [v.id, v]));
		for (const id of batch) {
			const vector = found.get(id);
			if (!vector?.values?.length) {
				missing.push(id);
				continue;
			}
			if (vector.values.length !== 768) {
				throw new Error(`Vector ${id} has ${vector.values.length} dims, expected 768`);
			}
			compactVectors.push({
				id,
				values: vector.values,
				metadata: {
					embedding_model: EMBEDDING_MODEL,
					index_revision: indexRevision
				}
			});
		}
		console.log(
			JSON.stringify({
				phase: 'fetched',
				batch: batch.length,
				collected: compactVectors.length,
				missing: missing.length
			})
		);
	}

	if (missing.length) {
		throw new Error(`Missing vectors for ${missing.length} D1 rows. Sample: ${missing.slice(0, 5).join(', ')}`);
	}
	if (compactVectors.length !== rows.length) {
		throw new Error(`Vector/row mismatch: vectors=${compactVectors.length} rows=${rows.length}`);
	}

	const ndjsonPath = join(WORKDIR, `compact-${indexRevision}.ndjson`);
	writeFileSync(ndjsonPath, compactVectors.map((v) => JSON.stringify(v)).join('\n') + '\n');
	console.log(JSON.stringify({ phase: 'ndjson_ready', path: ndjsonPath, count: compactVectors.length }));

	if (DRY_RUN) {
		const report = {
			ok: true,
			dryRun: true,
			indexRevision,
			rowCount: rows.length,
			bySlug: Object.fromEntries(bySlug),
			sampleIds: ids.slice(0, 3),
			ndjsonPath
		};
		writeFileSync(reportPath, JSON.stringify(report, null, 2));
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	// Upsert in smaller CLI batches for safer mutation progress.
	for (const [idx, batch] of chunk(compactVectors, 50).entries()) {
		const partPath = join(WORKDIR, `part-${indexRevision}-${idx}.ndjson`);
		writeFileSync(partPath, batch.map((v) => JSON.stringify(v)).join('\n') + '\n');
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
		console.log(JSON.stringify({ phase: 'upserted', part: idx, count: batch.length, out: out.trim().slice(0, 300) }));
	}

	// Wait briefly then verify a sample ID carries the new revision.
	const sampleId = ids[0];
	let verified = false;
	for (let attempt = 1; attempt <= 8; attempt += 1) {
		const sample = runJsonish('npx', [
			'wrangler',
			'vectorize',
			'get-vectors',
			INDEX_NAME,
			'--ids',
			sampleId
		]);
		const meta = Array.isArray(sample) ? sample[0]?.metadata : null;
		console.log(JSON.stringify({ phase: 'verify_attempt', attempt, meta }));
		if (meta?.index_revision === indexRevision && meta?.embedding_model === EMBEDDING_MODEL) {
			verified = true;
			break;
		}
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);
	}
	if (!verified) {
		throw new Error(`Vector metadata not visible yet for ${sampleId}; D1 not patched.`);
	}

	// Patch D1 rows + corpora registry.
	const slugs = [...bySlug.keys()];
	for (const slug of slugs) {
		const expected = bySlug.get(slug);
		const corpusKey =
			rows.find((r) => r.kitab_slug === slug)?.corpus_key || `${slug}:default`;
		d1(
			`UPDATE kitab_referensi
			 SET index_revision = '${indexRevision}',
			     embedding_model = '${EMBEDDING_MODEL}',
			     status = 'indexed',
			     index_error = NULL,
			     indexed_at = COALESCE(indexed_at, datetime('now')),
			     updated_at = datetime('now')
			 WHERE kitab_slug = '${slug.replace(/'/g, "''")}'`
		);
		// Production schema uses error_message (not last_error from newer code paths).
		d1(
			`INSERT INTO kitab_corpora (
				kitab_slug, corpus_key, index_revision, expected_chunks, status, error_message, created_at, updated_at
			) VALUES (
				'${slug.replace(/'/g, "''")}',
				'${String(corpusKey).replace(/'/g, "''")}',
				'${indexRevision}',
				${expected},
				'indexed',
				NULL,
				datetime('now'),
				datetime('now')
			)
			ON CONFLICT(kitab_slug) DO UPDATE SET
				corpus_key = excluded.corpus_key,
				index_revision = excluded.index_revision,
				expected_chunks = excluded.expected_chunks,
				status = 'indexed',
				error_message = NULL,
				updated_at = datetime('now')`
		);
		console.log(JSON.stringify({ phase: 'd1_patched', slug, expected, corpusKey }));
	}

	const statusCounts = d1('SELECT status, COUNT(*) AS n FROM kitab_referensi GROUP BY status');
	const revisionCounts = d1(
		`SELECT
			SUM(CASE WHEN index_revision = '${indexRevision}' THEN 1 ELSE 0 END) AS with_new_revision,
			SUM(CASE WHEN index_revision IS NULL OR index_revision = '' THEN 1 ELSE 0 END) AS null_revision,
			COUNT(*) AS total
		 FROM kitab_referensi`
	);
	const corpora = d1('SELECT kitab_slug, corpus_key, index_revision, expected_chunks, status FROM kitab_corpora');

	const report = {
		ok: true,
		dryRun: false,
		indexRevision,
		rowCount: rows.length,
		bySlug: Object.fromEntries(bySlug),
		statusCounts,
		revisionCounts,
		corpora,
		sampleId,
		ndjsonPath,
		reportPath
	};
	writeFileSync(reportPath, JSON.stringify(report, null, 2));
	console.log(JSON.stringify(report, null, 2));
};

try {
	main();
} catch (error) {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
}
