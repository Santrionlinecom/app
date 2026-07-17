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
}) =>
	`kitab:${normalizeChunkIdPart(input.kitabSlug)}:${stableHash(
		`${input.kitabSlug.normalize('NFKC').toLowerCase()}|${input.corpusKey ?? input.kitabSlug}`
	)}:p${Math.max(0, Math.trunc(input.pageNumber))
		.toString()
		.padStart(4, '0')}:c${Math.max(0, Math.trunc(input.chunkIndex)).toString().padStart(4, '0')}`;

type VectorMetadataValue = string | number | boolean | string[];

const toVectorMetadata = (metadata: KitabMetadata): Record<string, VectorMetadataValue> => {
	const normalized: Record<string, VectorMetadataValue> = { embedding_model: EMBEDDING_MODEL };
	for (const [key, value] of Object.entries({
		kitab_slug: metadata.kitab_slug,
		corpus_key: metadata.corpus_key
	})) {
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			normalized[key] = value;
		}
	}

	return normalized;
};

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
			`SELECT DISTINCT kitab_slug FROM kitab_referensi
			 WHERE status = 'indexed' AND kitab_slug IN (${placeholders})`
		)
		.bind(...uniqueSlugs)
		.all<{ kitab_slug: string }>();
	return new Set((results ?? []).map((row) => row.kitab_slug));
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
	options: { ensureSchema?: boolean } = {}
) => {
	if (!chunks.length) return [];
	if (chunks.length > 16) throw new Error('Maksimal 16 chunk per batch pada Workers Free');

	const { ai, index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Layanan data tidak tersedia');
	if (options.ensureSchema !== false) await ensureKitabReferenceSchema(db);

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

	await db.batch(
		records.map((record) =>
			db
				.prepare(
					`INSERT INTO kitab_referensi (
						id, judul, halaman, jilid, isi_teks, kitab_slug, source_type, source_ref,
						source_note, chapter, section_title, chunk_index, author, category, madhhab,
						corpus_key, embedding_model, status, index_error, indexed_at, created_at, updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'indexing', NULL, NULL, datetime('now'), datetime('now'))
					ON CONFLICT(id) DO UPDATE SET
						judul = excluded.judul,
						halaman = excluded.halaman,
						jilid = excluded.jilid,
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
						status = 'indexing',
						index_error = NULL,
						indexed_at = NULL,
						updated_at = datetime('now')`
				)
				.bind(
					record.id,
					record.metadata.judul_kitab,
					record.metadata.halaman == null ? null : String(record.metadata.halaman),
					record.metadata.jilid == null ? null : String(record.metadata.jilid),
					record.text,
					record.metadata.kitab_slug ?? null,
					record.metadata.source_type ?? null,
					record.metadata.source_ref ?? null,
					record.metadata.source_note ?? null,
					record.metadata.chapter ?? null,
					record.metadata.section_title ?? null,
					record.chunkIndex,
					record.metadata.author ?? null,
					record.metadata.category ?? null,
					record.metadata.madhhab ?? null,
					record.metadata.corpus_key ?? null,
					EMBEDDING_MODEL
				)
		)
	);

	try {
		const embeddings = await generateEmbeddings(
			ai,
			records.map((record) => record.text)
		);
		await index.upsert(
			records.map((record, indexPosition) => ({
				id: record.id,
				values: embeddings[indexPosition],
				metadata: toVectorMetadata(record.metadata)
			}))
		);
	} catch (error) {
		const message = errorMessage(error);
		try {
			await db.batch(
				records.map((record) =>
					db
						.prepare(
							"UPDATE kitab_referensi SET status = 'failed', index_error = ?, indexed_at = NULL, updated_at = datetime('now') WHERE id = ?"
						)
						.bind(message, record.id)
				)
			);
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
			`SELECT id FROM kitab_referensi
			 WHERE status = 'indexing' AND embedding_model = ?
			 ORDER BY updated_at ASC LIMIT 16`
		)
		.bind(EMBEDDING_MODEL)
		.all<{ id: string }>();
	const ids = (pending.results ?? []).map((row) => row.id);
	if (!ids.length) return 0;

	const visible = await index.getByIds(ids);
	const visibleIds = new Set(visible.map((vector) => vector.id).filter((id) => ids.includes(id)));
	if (!visibleIds.size) return 0;

	await db.batch(
		[...visibleIds].map((id) =>
			db
				.prepare(
					"UPDATE kitab_referensi SET status = 'indexed', index_error = NULL, indexed_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'indexing' AND embedding_model = ?"
				)
				.bind(id, EMBEDDING_MODEL)
		)
	);
	return visibleIds.size;
};

export const insertDokumen = async (
	platform: App.Platform,
	text: string,
	metadata: Omit<KitabMetadata, 'text'>,
	options: { id?: string | null } = {}
) => {
	const [stored] = await insertDokumenBatch(platform, [{ text, metadata, id: options.id }]);
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
				`SELECT id, judul, halaman, jilid, isi_teks, kitab_slug, source_type, source_ref,
					source_note, chapter, section_title, chunk_index, author, category, madhhab,
					corpus_key, embedding_model
				 FROM kitab_referensi
				 WHERE status = 'indexed' AND embedding_model = ? AND id IN (${placeholders})`
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
