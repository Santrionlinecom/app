import type { Ai, D1Database, VectorizeIndex } from '@cloudflare/workers-types';

export type KitabMetadata = {
	judul_kitab: string;
	halaman?: string | number | null;
	jilid?: string | number | null;
	text: string;
	kitab_slug?: string | null;
	source_type?: string | null;
	source_ref?: string | null;
	source_note?: string | null;
	chapter?: string | null;
	section_title?: string | null;
	chunk_index?: number | string | null;
	author?: string | null;
	category?: string | null;
	madhhab?: string | null;
	corpus_key?: string | null;
	embedding_model?: string | null;
};

type RetrievedMatch = {
	text: string;
	metadata: KitabMetadata;
	score?: number;
};

export const EMBEDDING_MODEL = '@cf/google/embeddinggemma-300m';
export const CHAT_MODEL = '@cf/meta/llama-3.2-3b-instruct';
export const MAX_EVIDENCE_CHUNKS = 4;

const assertBindings = (platform: App.Platform) => {
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX) {
		throw new Error('Layanan pencarian kitab belum tersedia');
	}
	return {
		ai: platform.env.AI as Ai,
		index: platform.env.VECTORIZE_INDEX as VectorizeIndex
	};
};

const randomId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const normalizeChunkIdPart = (value: string) =>
	value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 20) || 'kitab';

const stableHashPart = (bytes: Uint8Array, seed: number) => {
	let hash = seed >>> 0;
	for (let index = 0; index < bytes.length; index += 1) {
		hash ^= bytes[index] ?? 0;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
};

const stableHash = (value: string) => {
	const bytes = new TextEncoder().encode(value);
	return `${stableHashPart(bytes, 0x811c9dc5)}${stableHashPart(bytes, 0x9e3779b9)}`;
};

export const buildKitabChunkId = (input: {
	kitabSlug: string;
	corpusKey?: string;
	pageNumber: number;
	chunkIndex: number;
}) => {
	const corpusIdentity = `${input.kitabSlug.normalize('NFKC').toLowerCase()}|${input.corpusKey ?? input.kitabSlug}`;
	const position = `${Number.isFinite(input.pageNumber) ? Math.max(0, Math.trunc(input.pageNumber)) : 0}|${Number.isFinite(input.chunkIndex) ? Math.max(0, Math.trunc(input.chunkIndex)) : 0}`;
	return `kitab:${normalizeChunkIdPart(input.kitabSlug)}:${stableHash(corpusIdentity)}:${stableHash(position)}`;
};

type VectorMetadataValue = string | number | boolean | string[];

const toVectorMetadata = (indexRevision: string): Record<string, VectorMetadataValue> => ({
	embedding_model: EMBEDDING_MODEL,
	index_revision: indexRevision
});

const schemaPromises = new WeakMap<object, Promise<void>>();

const initializeKitabReferenceSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS kitab_referensi (
				id TEXT PRIMARY KEY,
				judul TEXT NOT NULL,
				halaman TEXT,
				jilid TEXT,
				isi_teks TEXT NOT NULL,
				kitab_slug TEXT,
				source_type TEXT,
				source_ref TEXT,
				source_note TEXT,
				chapter TEXT,
				section_title TEXT,
				chunk_index INTEGER,
				author TEXT,
				category TEXT,
				madhhab TEXT,
				corpus_key TEXT,
				embedding_model TEXT,
				index_revision TEXT,
				status TEXT NOT NULL DEFAULT 'stale',
				index_error TEXT,
				indexed_at TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	const { results } = await db.prepare(`PRAGMA table_info('kitab_referensi')`).all<{ name: string }>();
	const columns = new Set((results ?? []).map((column) => column.name));
	const nullableColumns = [
		['kitab_slug', 'TEXT'],
		['source_type', 'TEXT'],
		['source_ref', 'TEXT'],
		['source_note', 'TEXT'],
		['chapter', 'TEXT'],
		['section_title', 'TEXT'],
		['chunk_index', 'INTEGER'],
		['author', 'TEXT'],
		['category', 'TEXT'],
		['madhhab', 'TEXT'],
		['corpus_key', 'TEXT'],
		['embedding_model', 'TEXT'],
		['index_revision', 'TEXT'],
		['status', "TEXT NOT NULL DEFAULT 'stale'"],
		['index_error', 'TEXT'],
		['indexed_at', 'TEXT'],
		['updated_at', 'TEXT']
	] as const;

	for (const [column, definition] of nullableColumns) {
		if (!columns.has(column)) {
			await db.prepare(`ALTER TABLE kitab_referensi ADD COLUMN ${column} ${definition}`).run();
		}
	}

	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_kitab_referensi_judul ON kitab_referensi(judul)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_kitab_referensi_slug_chunk ON kitab_referensi(kitab_slug, chunk_index)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_kitab_referensi_source_type ON kitab_referensi(source_type)'
		)
		.run();
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS kitab_corpora (
				kitab_slug TEXT PRIMARY KEY,
				corpus_key TEXT NOT NULL,
				index_revision TEXT NOT NULL,
				expected_chunks INTEGER NOT NULL,
				status TEXT NOT NULL DEFAULT 'indexing',
				last_error TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();
	await db
		.prepare(
			`INSERT OR IGNORE INTO kitab_corpora (
				kitab_slug, corpus_key, index_revision, expected_chunks, status
			)
			SELECT kitab_slug, COALESCE(MAX(corpus_key), kitab_slug), 'legacy', COUNT(*), 'indexed'
			FROM kitab_referensi
			WHERE status = 'indexed' AND kitab_slug IS NOT NULL AND kitab_slug != ''
			GROUP BY kitab_slug`
		)
		.run();
};

export const ensureKitabReferenceSchema = async (db: D1Database) => {
	const key = db as unknown as object;
	const existing = schemaPromises.get(key);
	if (existing) return existing;
	const pending = initializeKitabReferenceSchema(db).catch((error) => {
		schemaPromises.delete(key);
		throw error;
	});
	schemaPromises.set(key, pending);
	return pending;
};

export const findActiveKitabSlugs = async (db: D1Database, slugs: string[]) => {
	const uniqueSlugs = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
	if (!uniqueSlugs.length) return new Set<string>();
	if (uniqueSlugs.length > 16) throw new Error('Maksimal 16 slug per pemeriksaan');
	await ensureKitabReferenceSchema(db);
	const placeholders = uniqueSlugs.map(() => '?').join(',');
	const { results } = await db
		.prepare(
			`SELECT kitab_slug FROM kitab_corpora
			 WHERE status = 'indexed' AND kitab_slug IN (${placeholders})`
		)
		.bind(...uniqueSlugs)
		.all<{ kitab_slug: string }>();
	return new Set((results ?? []).map((row) => row.kitab_slug));
};

export const reserveKitabCorpus = async (
	db: D1Database,
	input: { kitabSlug: string; corpusKey: string; indexRevision: string; expectedChunks: number }
) => {
	await ensureKitabReferenceSchema(db);
	const result = await db
		.prepare(
			`INSERT INTO kitab_corpora (
				kitab_slug, corpus_key, index_revision, expected_chunks, status, last_error, created_at, updated_at
			) VALUES (?, ?, ?, ?, 'indexing', NULL, datetime('now'), datetime('now'))
			ON CONFLICT(kitab_slug) DO UPDATE SET
				corpus_key = excluded.corpus_key,
				index_revision = excluded.index_revision,
				expected_chunks = excluded.expected_chunks,
				status = 'indexing',
				last_error = NULL,
				updated_at = datetime('now')
			WHERE kitab_corpora.status = 'failed'`
		)
		.bind(input.kitabSlug, input.corpusKey, input.indexRevision, input.expectedChunks)
		.run();
	return (result.meta?.changes ?? 0) > 0;
};

export const markKitabCorpusFailed = async (
	db: D1Database,
	kitabSlug: string,
	indexRevision: string,
	error: unknown
) => {
	const message = errorMessage(error);
	await db.batch([
		db
			.prepare(
				`UPDATE kitab_referensi
				 SET status = 'failed', index_error = ?, indexed_at = NULL, updated_at = datetime('now')
				 WHERE kitab_slug = ? AND index_revision = ? AND status IN ('indexing', 'indexed')`
			)
			.bind(message, kitabSlug, indexRevision),
		db
			.prepare(
				`UPDATE kitab_corpora
				 SET status = 'failed', last_error = ?, updated_at = datetime('now')
				 WHERE kitab_slug = ? AND index_revision = ? AND status IN ('indexing', 'indexed')`
			)
			.bind(message, kitabSlug, indexRevision)
	]);
};

export const generateEmbeddings = async (ai: Ai, texts: string[]) => {
	const normalized = texts.map((text) => text.trim());
	if (!normalized.length || normalized.some((text) => !text)) throw new Error('Teks kosong');

	const res = await ai.run(EMBEDDING_MODEL, { text: normalized } as any);
	const vectors = Array.isArray((res as any)?.data) ? (res as any).data : null;
	if (
		!vectors ||
		vectors.length !== normalized.length ||
		vectors.some((vector: unknown) => !Array.isArray(vector))
	) {
		throw new Error('Gagal membuat embedding');
	}
	return vectors as number[][];
};

export const generateEmbedding = async (ai: Ai, text: string) => {
	const [vector] = await generateEmbeddings(ai, [text]);
	if (!vector) throw new Error('Gagal membuat embedding');
	return vector;
};

export type KitabChunkInput = {
	text: string;
	metadata: Omit<KitabMetadata, 'text'>;
	id?: string | null;
};

const resolveChunkId = (chunk: KitabChunkInput) => {
	const explicitId = chunk.id?.trim();
	if (explicitId) {
		if (new TextEncoder().encode(explicitId).byteLength > 64) {
			throw new Error('ID vector maksimal 64 byte');
		}
		return explicitId;
	}
	const pageNumber = Number.parseInt(String(chunk.metadata.halaman ?? ''), 10);
	const chunkIndex = Number.parseInt(String(chunk.metadata.chunk_index ?? ''), 10);
	if (chunk.metadata.kitab_slug && Number.isFinite(pageNumber) && Number.isFinite(chunkIndex)) {
		return buildKitabChunkId({
			kitabSlug: chunk.metadata.kitab_slug,
			corpusKey:
				chunk.metadata.corpus_key ??
				`${chunk.metadata.kitab_slug}:${chunk.metadata.jilid == null ? '' : chunk.metadata.jilid}`,
			pageNumber,
			chunkIndex
		});
	}
	return randomId();
};

const errorMessage = (error: unknown) =>
	error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);

export const insertDokumenBatch = async (
	platform: App.Platform,
	chunks: KitabChunkInput[],
	options: { ensureSchema?: boolean; indexRevision?: string; requireReservation?: boolean } = {}
) => {
	if (!chunks.length) return [];
	if (chunks.length > 15) throw new Error('Maksimal 15 chunk per batch pada Workers Free');

	const { ai, index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Layanan data tidak tersedia');
	if (options.ensureSchema !== false) await ensureKitabReferenceSchema(db);
	const indexRevision = options.indexRevision ?? randomId();

	const records = chunks.map((chunk) => {
		const text = chunk.text.trim();
		if (!text) throw new Error('Teks kosong');
		const metadata: KitabMetadata = {
			...chunk.metadata,
			text,
			embedding_model: EMBEDDING_MODEL
		};
		const parsedChunkIndex =
			metadata.chunk_index == null ? null : Number.parseInt(String(metadata.chunk_index), 10);
		return {
			id: resolveChunkId(chunk),
			text,
			metadata,
			chunkIndex: Number.isFinite(parsedChunkIndex) ? parsedChunkIndex : null
		};
	});
	const reservationSlugs = new Set(records.map((record) => record.metadata.kitab_slug ?? ''));
	const reservationKeys = new Set(records.map((record) => record.metadata.corpus_key ?? ''));
	if (
		options.requireReservation &&
		(reservationSlugs.size !== 1 || reservationKeys.size !== 1 || ![...reservationSlugs][0] || ![...reservationKeys][0])
	) {
		throw new Error('Batch reservation harus memiliki satu kitab_slug dan corpus_key');
	}
	const reservationSlug = [...reservationSlugs][0] ?? '';
	const reservationKey = [...reservationKeys][0] ?? '';

	const payload = JSON.stringify(
		records.map((record) => ({
			id: record.id,
			judul: record.metadata.judul_kitab,
			halaman: record.metadata.halaman == null ? null : String(record.metadata.halaman),
			jilid: record.metadata.jilid == null ? null : String(record.metadata.jilid),
			isi_teks: record.text,
			kitab_slug: record.metadata.kitab_slug ?? null,
			source_type: record.metadata.source_type ?? null,
			source_ref: record.metadata.source_ref ?? null,
			source_note: record.metadata.source_note ?? null,
			chapter: record.metadata.chapter ?? null,
			section_title: record.metadata.section_title ?? null,
			chunk_index: record.chunkIndex,
			author: record.metadata.author ?? null,
			category: record.metadata.category ?? null,
			madhhab: record.metadata.madhhab ?? null,
			corpus_key: record.metadata.corpus_key ?? null
		}))
	);
	const stageResult = await db
		.prepare(
			`WITH input AS (SELECT value FROM json_each(?))
			 INSERT INTO kitab_referensi (
				id, judul, halaman, jilid, isi_teks, kitab_slug, source_type, source_ref,
				source_note, chapter, section_title, chunk_index, author, category, madhhab,
				corpus_key, embedding_model, index_revision, status, index_error, indexed_at, created_at, updated_at
			 )
			 SELECT
				json_extract(value, '$.id'), json_extract(value, '$.judul'),
				json_extract(value, '$.halaman'), json_extract(value, '$.jilid'),
				json_extract(value, '$.isi_teks'), json_extract(value, '$.kitab_slug'),
				json_extract(value, '$.source_type'), json_extract(value, '$.source_ref'),
				json_extract(value, '$.source_note'), json_extract(value, '$.chapter'),
				json_extract(value, '$.section_title'), json_extract(value, '$.chunk_index'),
				json_extract(value, '$.author'), json_extract(value, '$.category'),
				json_extract(value, '$.madhhab'), json_extract(value, '$.corpus_key'),
				?, ?, 'indexing', NULL, NULL, datetime('now'), datetime('now')
			 FROM input
			 WHERE ? = 0 OR EXISTS (
				SELECT 1 FROM kitab_corpora
				WHERE index_revision = ? AND kitab_slug = ? AND corpus_key = ? AND status = 'indexing'
			 )
			 ON CONFLICT(id) DO UPDATE SET
				judul = excluded.judul, halaman = excluded.halaman, jilid = excluded.jilid,
				isi_teks = excluded.isi_teks, kitab_slug = excluded.kitab_slug,
				source_type = excluded.source_type, source_ref = excluded.source_ref,
				source_note = excluded.source_note, chapter = excluded.chapter,
				section_title = excluded.section_title, chunk_index = excluded.chunk_index,
				author = excluded.author, category = excluded.category, madhhab = excluded.madhhab,
				corpus_key = excluded.corpus_key, embedding_model = excluded.embedding_model,
				index_revision = excluded.index_revision, status = 'indexing', index_error = NULL,
				indexed_at = NULL, updated_at = datetime('now')`
		)
		.bind(
			payload,
			EMBEDDING_MODEL,
			indexRevision,
			options.requireReservation ? 1 : 0,
			indexRevision,
			reservationSlug,
			reservationKey
		)
		.run();
	if (options.requireReservation && Number(stageResult.meta?.changes ?? 0) < records.length) {
		throw new Error('Reservation corpus tidak lagi aktif');
	}

	try {
		const embeddings = await generateEmbeddings(
			ai,
			records.map((record) => record.text)
		);
		await index.upsert(
			records.map((record, indexPosition) => ({
				id: record.id,
				values: embeddings[indexPosition],
				metadata: toVectorMetadata(indexRevision)
			}))
		);
	} catch (error) {
		const message = errorMessage(error);
		try {
			await db
				.prepare(
					`UPDATE kitab_referensi
					 SET status = 'failed', index_error = ?, indexed_at = NULL, updated_at = datetime('now')
					 WHERE index_revision = ? AND id IN (SELECT value FROM json_each(?))`
				)
				.bind(message, indexRevision, JSON.stringify(records.map((record) => record.id)))
				.run();
		} catch (statusError) {
			console.error('Gagal menandai status indexing kitab', statusError);
		}
		throw error;
	}

	return records.map((record) => ({ id: record.id, metadata: record.metadata }));
};

export const reconcileIndexingKitabRows = async (
	platform: App.Platform,
	options: { ensureSchema?: boolean } = {}
) => {
	const { index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Layanan data tidak tersedia');
	if (options.ensureSchema !== false) await ensureKitabReferenceSchema(db);

	const pending = await db
		.prepare(
			`SELECT kr.id, kr.index_revision AS indexRevision
			 FROM kitab_referensi kr
			 JOIN kitab_corpora kc
				ON kc.kitab_slug = kr.kitab_slug
				AND kc.index_revision = kr.index_revision
				AND kc.status = 'indexing'
			 WHERE kr.status = 'indexing'
				AND kr.embedding_model = ?
				AND kr.index_revision IS NOT NULL
			 ORDER BY kr.updated_at ASC LIMIT 16`
		)
		.bind(EMBEDDING_MODEL)
		.all<{ id: string; indexRevision: string }>();
	const pendingRows = pending.results ?? [];
	const ids = pendingRows.map((row) => row.id);
	if (!ids.length) return 0;

	const expectedRevision = new Map(pendingRows.map((row) => [row.id, row.indexRevision]));
	const visible = await index.getByIds(ids);
	const visibleRows = visible.flatMap((vector) => {
		const revision = expectedRevision.get(vector.id);
		return revision && vector.metadata?.index_revision === revision
			? [{ id: vector.id, revision }]
			: [];
	});
	if (!visibleRows.length) return 0;

	await db.batch(
		visibleRows.map((row) =>
			db
				.prepare(
					"UPDATE kitab_referensi SET status = 'indexed', index_error = NULL, indexed_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND index_revision = ? AND status = 'indexing' AND embedding_model = ?"
				)
				.bind(row.id, row.revision, EMBEDDING_MODEL)
		)
	);
	await db
		.prepare(
			`UPDATE kitab_corpora
			 SET status = 'indexed', last_error = NULL, updated_at = datetime('now')
			 WHERE status = 'indexing' AND expected_chunks <= (
				SELECT COUNT(*) FROM kitab_referensi r
				WHERE r.kitab_slug = kitab_corpora.kitab_slug
					AND r.index_revision = kitab_corpora.index_revision
					AND r.status = 'indexed'
			 )`
		)
		.run();
	return visibleRows.length;
};

export const insertDokumen = async (
	platform: App.Platform,
	text: string,
	metadata: Omit<KitabMetadata, 'text'>,
	options: { id?: string | null; indexRevision?: string; requireReservation?: boolean } = {}
) => {
	const [stored] = await insertDokumenBatch(
		platform,
		[{ text, metadata, id: options.id }],
		{
			indexRevision: options.indexRevision,
			requireReservation: options.requireReservation
		}
	);
	if (!stored) throw new Error('Gagal menyimpan data');
	return stored.metadata;
};

type RawVectorMatch = {
	id?: string;
	score?: number;
	metadata?: Record<string, unknown>;
};

export const filterRelevantMatches = <T extends RawVectorMatch>(
	matches: T[],
	indexedIds: Set<string>,
	minimumScore = 0.35
) =>
	matches.filter(
		(match) =>
			typeof match.id === 'string' &&
			indexedIds.has(match.id) &&
			typeof match.score === 'number' &&
			match.score >= minimumScore
			);

export const cariJawaban = async (platform: App.Platform, pertanyaan: string) => {
	const { ai, index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Layanan data tidak tersedia');
	await ensureKitabReferenceSchema(db);
	await reconcileIndexingKitabRows(platform, { ensureSchema: false });
	const queryVector = await generateEmbedding(ai, pertanyaan);

	const queryRes = await index.query(queryVector, {
		topK: 8,
		returnValues: false,
		returnMetadata: 'none'
	} as any);

	const rawMatches = (queryRes.matches ?? []) as RawVectorMatch[];
	const candidateIds = rawMatches
		.map((match) => match.id)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	const evidenceById = new Map<string, KitabMetadata>();
	if (candidateIds.length) {
		const placeholders = candidateIds.map(() => '?').join(',');
		const { results } = await db
			.prepare(
				`SELECT r.id, r.judul, r.halaman, r.jilid, r.isi_teks, r.kitab_slug, r.source_type, r.source_ref,
					r.source_note, r.chapter, r.section_title, r.chunk_index, r.author, r.category, r.madhhab,
					r.corpus_key, r.embedding_model
				 FROM kitab_referensi r
				 JOIN kitab_corpora c ON c.kitab_slug = r.kitab_slug
					AND c.status = 'indexed'
					AND (c.index_revision = r.index_revision OR (r.index_revision IS NULL AND c.index_revision = 'legacy'))
				 WHERE r.status = 'indexed' AND r.embedding_model = ? AND r.id IN (${placeholders})`
			)
			.bind(EMBEDDING_MODEL, ...candidateIds)
			.all<Record<string, unknown>>();
		for (const row of results ?? []) {
			evidenceById.set(String(row.id), {
				judul_kitab: String(row.judul),
				halaman: row.halaman == null ? null : String(row.halaman),
				jilid: row.jilid == null ? null : String(row.jilid),
				text: String(row.isi_teks),
				kitab_slug: row.kitab_slug == null ? null : String(row.kitab_slug),
				source_type: row.source_type == null ? null : String(row.source_type),
				source_ref: row.source_ref == null ? null : String(row.source_ref),
				source_note: row.source_note == null ? null : String(row.source_note),
				chapter: row.chapter == null ? null : String(row.chapter),
				section_title: row.section_title == null ? null : String(row.section_title),
				chunk_index: row.chunk_index == null ? null : Number(row.chunk_index),
				author: row.author == null ? null : String(row.author),
				category: row.category == null ? null : String(row.category),
				madhhab: row.madhhab == null ? null : String(row.madhhab),
				corpus_key: row.corpus_key == null ? null : String(row.corpus_key),
				embedding_model: String(row.embedding_model)
			});
		}
	}
	const relevantMatches = filterRelevantMatches(rawMatches, new Set(evidenceById.keys())).slice(
		0,
		MAX_EVIDENCE_CHUNKS
	);

	const matches: RetrievedMatch[] =
		relevantMatches.flatMap((match) => {
			const metadata = match.id ? evidenceById.get(match.id) : null;
			return metadata ? [{ text: metadata.text, metadata, score: match.score }] : [];
		}) ?? [];

	if (!matches.length) {
		return {
			jawaban: 'Maaf, belum ada data kitab yang relevan untuk menjawab pertanyaan ini.',
			referensi: [] as KitabMetadata[]
		};
	}

	const context = matches
		.map((m, idx) => {
			const location =
				m.metadata.source_ref ||
				[
					m.metadata.jilid ? `jilid ${m.metadata.jilid}` : '',
					m.metadata.halaman ? `hal ${m.metadata.halaman}` : '',
					m.metadata.chapter ?? '',
					m.metadata.section_title ?? ''
				]
					.filter(Boolean)
					.join(', ') ||
				'posisi tidak tersedia';

			return `[${idx + 1}] (${m.metadata.judul_kitab}, ${location})\n${m.text}`;
		})
		.join('\n\n');

	const systemPrompt =
		'Anda adalah asisten pesantren yang sopan. Jawab dalam Bahasa Indonesia, maksimal tiga paragraf, ringkas dan jelas. ' +
		'Gunakan hanya fakta dari konteks yang diberikan; jangan menambah fatwa, dalil, atau klaim dari pengetahuan sendiri. ' +
		'Jika konteks tidak cukup, katakan belum ditemukan dan minta pengguna memperjelas. ' +
		'Jangan menulis baris sumber karena sistem akan menambahkan sitasi terverifikasi.';

	const userPrompt = `Pertanyaan: ${pertanyaan}\n\nKonteks:\n${context}`;

	const completion = await ai.run(CHAT_MODEL, {
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		max_tokens: 400
	} as any);

	const rawJawaban = (completion as any)?.response ?? (completion as any)?.result ?? '';
	const cleanedJawaban = String(rawJawaban)
		.replace(/\n+\s*Sumber\s*:.*$/is, '')
		.trim();
	const citationGroups = new Map<string, Set<string>>();
	for (const match of matches) {
		const title = match.metadata.judul_kitab || 'Kitab tidak diketahui';
		const locations = citationGroups.get(title) ?? new Set<string>();
		const location =
			match.metadata.source_ref?.trim() ||
			[
				match.metadata.jilid ? `jilid ${match.metadata.jilid}` : '',
				match.metadata.halaman ? `halaman ${match.metadata.halaman}` : '',
				match.metadata.chapter?.trim() ?? '',
				match.metadata.section_title?.trim() ?? '',
				match.metadata.chunk_index != null ? `bagian ${match.metadata.chunk_index}` : ''
			]
				.filter(Boolean)
				.join(', ');
		if (location) locations.add(location);
		citationGroups.set(title, locations);
	}
	const citation = [...citationGroups.entries()]
		.map(([title, locations]) =>
			locations.size ? `${title}, ${[...locations].join('; ')}` : title
		)
		.join('; ');
	const jawaban = `${cleanedJawaban || 'Maaf, jawaban belum dapat disusun dari konteks yang tersedia.'}\n\nSumber: ${citation}.`;
	return {
		jawaban,
		referensi: matches.map((m) => m.metadata)
	};
};
