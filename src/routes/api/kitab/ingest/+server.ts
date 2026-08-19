import { json, error } from '@sveltejs/kit';

import {
	cariJawaban,
	ensureKitabReferenceSchema,
	generateEmbedding,
	insertDokumenBatch,
	markKitabCorpusFailed,
	reconcileIndexingKitabRows,
	reserveKitabCorpus,
	EMBEDDING_MODEL,
	type KitabChunkInput
} from '$lib/server/rag';
import { normalizeKitabSlug } from '$lib/kitab';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

import type { RequestHandler } from './$types';

const MAX_CHUNKS_PER_BATCH = 15;
const MAX_TEXT_CHARS = 2000;
const RATE_LIMIT = { scope: 'kitab:ingest', limit: 60, windowMs: 10 * 60 * 1000 };

type IngestAction = 'init' | 'batch' | 'finalize' | 'debug-query';

type IngestBody = {
	action?: IngestAction;
	kitabSlug?: string;
	corpusKey?: string;
	judul?: string;
	indexRevision?: string;
	expectedChunks?: number;
	pertanyaan?: string;
	chunks?: Array<{ text?: string; metadata?: Record<string, unknown>; id?: string | null }>;
};

const timingSafeEqual = (a: string, b: string) => {
	const encoder = new TextEncoder();
	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);
	if (bufA.byteLength !== bufB.byteLength) return false;
	let diff = 0;
	for (let i = 0; i < bufA.byteLength; i += 1) diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
	return diff === 0;
};

const assertSecret = (platform: App.Platform | undefined, request: Request) => {
	const expected = platform?.env?.KITAB_INGEST_SECRET?.trim();
	if (!expected) throw error(503, 'Ingest belum dikonfigurasi');
	const provided = request.headers.get('x-ingest-secret')?.trim() ?? '';
	if (!provided || !timingSafeEqual(provided, expected)) {
		throw error(401, 'Secret ingest tidak valid');
	}
};

export const POST: RequestHandler = async ({ platform, request, getClientAddress }) => {
	assertSecret(platform, request);
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Layanan data tidak tersedia');

	const rate = await consumeApiRateLimit({
		db,
		scope: RATE_LIMIT.scope,
		key: getClientAddress(),
		limit: RATE_LIMIT.limit,
		windowMs: RATE_LIMIT.windowMs
	});
	if (!rate.allowed) {
		return json(
			{ ok: false, pesan: 'Terlalu banyak permintaan ingest, coba lagi nanti.' },
			{ status: 429, headers: buildRateLimitHeaders(rate) }
		);
	}

	let body: IngestBody;
	try {
		body = (await request.json()) as IngestBody;
	} catch {
		throw error(400, 'Body harus JSON');
	}

	const action = body.action;

	if (action === 'debug-query') {
		const pertanyaan = (body.pertanyaan ?? '').trim();
		if (!pertanyaan) throw error(400, 'pertanyaan wajib diisi');
		const ai = platform?.env?.AI;
		const index = platform?.env?.VECTORIZE_INDEX;
		if (!ai || !index) throw error(500, 'Binding AI/Vectorize tidak tersedia');
		const vector = await generateEmbedding(ai, pertanyaan);
		const res = await index.query(vector, { topK: 8, returnValues: false, returnMetadata: 'none' } as any);
		const raw = (res.matches ?? []).map((m: any) => ({ id: m.id, score: m.score }));
		const ids = raw.map((m: { id: string }) => m.id).filter(Boolean);
		let joinRows: unknown[] = [];
		if (ids.length) {
			const placeholders = ids.map(() => '?').join(',');
			const { results } = await db
				.prepare(
					`SELECT r.id, r.kitab_slug, r.status, r.embedding_model, r.index_revision,
						c.status AS corpus_status, c.index_revision AS corpus_revision
					 FROM kitab_referensi r
					 LEFT JOIN kitab_corpora c ON c.kitab_slug = r.kitab_slug
					 WHERE r.id IN (${placeholders})`
				)
				.bind(...ids)
				.all();
			joinRows = results ?? [];
		}
		const hasil = await cariJawaban(platform as App.Platform, pertanyaan);
		return json({
			ok: true,
			embeddingModel: EMBEDDING_MODEL,
			rawMatches: raw,
			joinRows,
			jawaban: hasil.jawaban,
			referensiCount: hasil.referensi.length
		});
	}

	const kitabSlug = normalizeKitabSlug(body.kitabSlug ?? '');
	const corpusKey = (body.corpusKey ?? '').trim();
	const indexRevision = (body.indexRevision ?? '').trim();
	if (!kitabSlug) throw error(400, 'kitabSlug wajib diisi');
	if (!corpusKey) throw error(400, 'corpusKey wajib diisi');

	await ensureKitabReferenceSchema(db);

	if (action === 'init') {
		const expectedChunks = Number(body.expectedChunks);
		if (!Number.isInteger(expectedChunks) || expectedChunks < 1 || expectedChunks > 500) {
			throw error(400, 'expectedChunks harus 1-500');
		}
		const revision = crypto.randomUUID();
		const reserved = await reserveKitabCorpus(db, {
			kitabSlug,
			corpusKey,
			indexRevision: revision,
			expectedChunks
		});
		if (!reserved) {
			throw error(409, 'Corpus sedang diproses atau sudah terindeks; hapus/ulang dulu bila perlu');
		}
		return json({ ok: true, indexRevision: revision });
	}

	if (action === 'batch') {
		if (!indexRevision) throw error(400, 'indexRevision wajib untuk batch');
		const rawChunks = Array.isArray(body.chunks) ? body.chunks : [];
		if (!rawChunks.length) throw error(400, 'chunks kosong');
		if (rawChunks.length > MAX_CHUNKS_PER_BATCH) {
			throw error(400, `Maksimal ${MAX_CHUNKS_PER_BATCH} chunk per batch`);
		}
		const chunks: KitabChunkInput[] = rawChunks.map((chunk, position) => {
			const text = String(chunk.text ?? '').trim();
			if (!text || text.length > MAX_TEXT_CHARS) {
				throw error(400, `Chunk ${position}: teks kosong atau > ${MAX_TEXT_CHARS} karakter`);
			}
			const metadata = (chunk.metadata ?? {}) as Record<string, unknown>;
			return {
				text,
				id: typeof chunk.id === 'string' ? chunk.id : null,
				metadata: {
					judul_kitab: String(metadata.judul_kitab ?? body.judul ?? kitabSlug),
					halaman: metadata.halaman == null ? null : String(metadata.halaman),
					jilid: metadata.jilid == null ? null : String(metadata.jilid),
					kitab_slug: kitabSlug,
					source_type: String(metadata.source_type ?? 'llamaparse-agentic'),
					source_ref: metadata.source_ref == null ? null : String(metadata.source_ref),
					source_note: metadata.source_note == null ? null : String(metadata.source_note),
					chapter: metadata.chapter == null ? null : String(metadata.chapter),
					section_title: metadata.section_title == null ? null : String(metadata.section_title),
					chunk_index:
						metadata.chunk_index == null ? null : Number.parseInt(String(metadata.chunk_index), 10),
					author: metadata.author == null ? null : String(metadata.author),
					category: metadata.category == null ? null : String(metadata.category),
					madhhab: metadata.madhhab == null ? null : String(metadata.madhhab),
					corpus_key: corpusKey
				}
			};
		});

		try {
			const stored = await insertDokumenBatch(platform as App.Platform, chunks, {
				ensureSchema: false,
				indexRevision,
				requireReservation: true
			});
			return json({ ok: true, stored: stored.length });
		} catch (err) {
			await markKitabCorpusFailed(db, kitabSlug, indexRevision, err);
			const message = err instanceof Error ? err.message : 'Gagal menyimpan batch';
			throw error(500, message);
		}
	}

	if (action === 'finalize') {
		if (!indexRevision) throw error(400, 'indexRevision wajib untuk finalize');
		// Vectorize eventual-consistent: reconcile menandai indexed saat vector terlihat
		let reconciled = 0;
		for (let attempt = 0; attempt < 5; attempt += 1) {
			reconciled += await reconcileIndexingKitabRows(platform as App.Platform, {
				ensureSchema: false
			});
			const row = await db
				.prepare(
					`SELECT status, expected_chunks AS expectedChunks,
						(SELECT COUNT(*) FROM kitab_referensi r
						 WHERE r.kitab_slug = kitab_corpora.kitab_slug
							AND r.index_revision = kitab_corpora.index_revision
							AND r.status = 'indexed') AS indexedChunks
					 FROM kitab_corpora WHERE kitab_slug = ? AND index_revision = ?`
				)
				.bind(kitabSlug, indexRevision)
				.first<{ status: string; expectedChunks: number; indexedChunks: number }>();
			if (!row) throw error(404, 'Corpus tidak ditemukan untuk revision ini');
			if (row.status === 'indexed') {
				return json({ ok: true, status: 'indexed', chunks: row.indexedChunks, reconciled });
			}
			await new Promise((resolve) => setTimeout(resolve, 1500));
		}
		const pending = await db
			.prepare(
				`SELECT status,
					(SELECT COUNT(*) FROM kitab_referensi r
					 WHERE r.kitab_slug = kitab_corpora.kitab_slug
						AND r.index_revision = kitab_corpora.index_revision
						AND r.status = 'indexed') AS indexedChunks,
					expected_chunks AS expectedChunks
				 FROM kitab_corpora WHERE kitab_slug = ? AND index_revision = ?`
			)
			.bind(kitabSlug, indexRevision)
			.first<{ status: string; indexedChunks: number; expectedChunks: number }>();
		return json({
			ok: true,
			status: pending?.status ?? 'indexing',
			chunks: pending?.indexedChunks ?? 0,
			expected: pending?.expectedChunks ?? 0,
			pesan: 'Vectorize masih sinkronisasi; panggil finalize lagi beberapa saat lagi.'
		});
	}

	throw error(400, "action harus 'init', 'batch', atau 'finalize'");
};
