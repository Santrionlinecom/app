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
};

type RetrievedMatch = {
	text: string;
	metadata: KitabMetadata;
	score?: number;
};

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const CHAT_MODEL = '@cf/meta/llama-3-8b-instruct';

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

type VectorMetadataValue = string | number | boolean | string[];

const toVectorMetadata = (metadata: KitabMetadata): Record<string, VectorMetadataValue> => {
	const normalized: Record<string, VectorMetadataValue> = {};

	for (const [key, value] of Object.entries(metadata)) {
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			normalized[key] = value;
		}
	}

	return normalized;
};

export const ensureKitabReferenceSchema = async (db: D1Database) => {
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

export const generateEmbedding = async (ai: Ai, text: string) => {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Teks kosong');

	const res = await ai.run(EMBEDDING_MODEL, { text: trimmed } as any);
	const vector = Array.isArray((res as any)?.data?.[0])
		? (res as any).data[0]
		: Array.isArray((res as any)?.data)
			? (res as any).data
			: null;

	if (!vector || !Array.isArray(vector)) {
		throw new Error('Gagal membuat embedding');
	}
	return vector as number[];
};

export const insertDokumen = async (
	platform: App.Platform,
	text: string,
	metadata: Omit<KitabMetadata, 'text'>,
	options: { id?: string | null } = {}
) => {
	const { ai, index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Layanan data tidak tersedia');

	await ensureKitabReferenceSchema(db);

	const id = options.id?.trim() || randomId();
	const enriched: KitabMetadata = { ...metadata, text };
	const parsedChunkIndex =
		enriched.chunk_index == null ? null : Number.parseInt(String(enriched.chunk_index), 10);
	const chunkIndex = Number.isFinite(parsedChunkIndex) ? parsedChunkIndex : null;

	try {
		await db
			.prepare(
				`INSERT INTO kitab_referensi (
					id,
					judul,
					halaman,
					jilid,
					isi_teks,
					kitab_slug,
					source_type,
					source_ref,
					source_note,
					chapter,
					section_title,
					chunk_index,
					author,
					category,
					madhhab,
					created_at,
					updated_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
					updated_at = datetime('now')`
			)
			.bind(
				id,
				enriched.judul_kitab,
				enriched.halaman == null ? null : String(enriched.halaman),
				enriched.jilid == null ? null : String(enriched.jilid),
				text,
				enriched.kitab_slug ?? null,
				enriched.source_type ?? null,
				enriched.source_ref ?? null,
				enriched.source_note ?? null,
				enriched.chapter ?? null,
				enriched.section_title ?? null,
				chunkIndex,
				enriched.author ?? null,
				enriched.category ?? null,
				enriched.madhhab ?? null
			)
			.run();
	} catch (err) {
		console.error('Gagal simpan referensi kitab', err);
		throw new Error('Gagal menyimpan data');
	}

	const embedding = await generateEmbedding(ai, text);

	await index.upsert([
		{
			id,
			values: embedding,
			metadata: toVectorMetadata(enriched)
		}
	]);

	return enriched;
};

export const cariJawaban = async (platform: App.Platform, pertanyaan: string) => {
	const { ai, index } = assertBindings(platform);
	const queryVector = await generateEmbedding(ai, pertanyaan);

	const queryRes = await index.query({
		topK: 3,
		vector: queryVector,
		returnValues: false,
		returnMetadata: true
	} as any);

	const matches: RetrievedMatch[] =
		(queryRes.matches ?? []).map((m: any) => ({
			text: m?.metadata?.text ?? '',
			metadata: {
				judul_kitab: m?.metadata?.judul_kitab ?? 'Tidak diketahui',
				halaman: m?.metadata?.halaman ?? '-',
				jilid: m?.metadata?.jilid,
				text: m?.metadata?.text ?? '',
				kitab_slug: m?.metadata?.kitab_slug ?? null,
				source_type: m?.metadata?.source_type ?? null,
				source_ref: m?.metadata?.source_ref ?? null,
				source_note: m?.metadata?.source_note ?? null,
				chapter: m?.metadata?.chapter ?? null,
				section_title: m?.metadata?.section_title ?? null,
				chunk_index: m?.metadata?.chunk_index ?? null,
				author: m?.metadata?.author ?? null,
				category: m?.metadata?.category ?? null,
				madhhab: m?.metadata?.madhhab ?? null
			},
			score: m?.score
		})) ?? [];

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
		'Anda adalah asisten pesantren yang sopan. Jawab dalam Bahasa Indonesia, ringkas dan jelas. ' +
		'WAJIB sertakan referensi berdasarkan konteks yang diberikan; gunakan nama kitab, halaman/jilid, atau penanda sumber bab/chunk bila tersedia. ' +
		'Jika konteks tidak cukup, katakan belum ditemukan dan minta pengguna memperjelas.';

	const userPrompt = `Pertanyaan: ${pertanyaan}\n\nKonteks:\n${context}`;

	const completion = await ai.run(CHAT_MODEL, {
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	} as any);

	const jawaban = (completion as any)?.response ?? (completion as any)?.result ?? '';
	return {
		jawaban,
		referensi: matches.map((m) => m.metadata)
	};
};
