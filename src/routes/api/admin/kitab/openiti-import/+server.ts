import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeKitabSlug } from '$lib/kitab';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import { insertDokumen } from '$lib/server/rag';

const MAX_OPENITI_ROWS = 1200;
const MAX_TEXT_LENGTH = 12000;
const IMPORT_RATE_LIMIT = {
	scope: 'admin:kitab:openiti-import',
	limit: 4,
	windowMs: 30 * 60 * 1000
};

type OpenitiChunkRow = {
	kitabSlug?: unknown;
	title?: unknown;
	author?: unknown;
	category?: unknown;
	madhhab?: unknown;
	madzhab?: unknown;
	sourceType?: unknown;
	sourceNote?: unknown;
	chunkIndex?: unknown;
	chapter?: unknown;
	sectionTitle?: unknown;
	pageNumber?: unknown;
	arabicText?: unknown;
	chunkText?: unknown;
	sourceRef?: unknown;
};

type NormalizedOpenitiChunk = {
	title: string;
	chunkText: string;
	kitabSlug: string;
	chunkIndex: number;
	sourceRef: string;
	sourceNote: string | null;
	chapter: string | null;
	sectionTitle: string | null;
	author: string | null;
	category: string | null;
	madhhab: string | null;
	pageNumber: string | null;
	importId: string;
};

const readString = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const readInteger = (value: unknown) => {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		const parsed = Number.parseInt(value.trim(), 10);
		return parsed > 0 ? parsed : null;
	}
	return null;
};

const readPageValue = (value: unknown) => {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return readString(value, 80) || null;
};

const importIdPart = (value: string) =>
	normalizeKitabSlug(value).slice(0, 120) || 'kitab-openiti';

const summarizeBooks = (counts: Map<string, { title: string; chunks: number }>) =>
	Array.from(counts.entries()).map(([slug, detail]) => ({
		slug,
		title: detail.title,
		chunks: detail.chunks
	}));

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { db, user } = requireSuperAdmin(locals);
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX || !platform?.env?.DB) {
		return json(
			{
				ok: false,
				error: 'Binding AI, Vectorize, atau D1 belum tersedia untuk import OpenITI.'
			},
			{ status: 500 }
		);
	}

	try {
		const rateLimit = await consumeApiRateLimit({
			db,
			scope: IMPORT_RATE_LIMIT.scope,
			key: `user:${user.id}`,
			limit: IMPORT_RATE_LIMIT.limit,
			windowMs: IMPORT_RATE_LIMIT.windowMs
		});

		if (!rateLimit.allowed) {
			return json(
				{
					ok: false,
					error: 'Import OpenITI terlalu sering. Coba lagi setelah jeda rate limit.',
					limit: rateLimit.limit,
					resetAt: rateLimit.resetAt
				},
				{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
			);
		}
	} catch (err) {
		console.warn('Rate limit import OpenITI gagal:', err);
	}

	const body = (await request.json().catch(() => null)) as
		| { rows?: unknown }
		| OpenitiChunkRow[]
		| null;
	const rows = Array.isArray(body) ? body : Array.isArray(body?.rows) ? body.rows : null;

	if (!rows) {
		return json({ ok: false, error: 'Payload import harus berisi array rows OpenITI.' }, { status: 400 });
	}
	if (rows.length === 0) {
		return json({ ok: false, error: 'File OpenITI tidak berisi chunk yang bisa diimpor.' }, { status: 400 });
	}
	if (rows.length > MAX_OPENITI_ROWS) {
		return json(
			{
				ok: false,
				error: `Import dibatasi maksimal ${MAX_OPENITI_ROWS} chunk per proses.`
			},
			{ status: 413 }
		);
	}

	const chunks: NormalizedOpenitiChunk[] = [];

	for (let index = 0; index < rows.length; index += 1) {
		const row = (rows[index] ?? {}) as OpenitiChunkRow;
		const title = readString(row.title, 240);
		const chunkText =
			readString(row.chunkText, MAX_TEXT_LENGTH) || readString(row.arabicText, MAX_TEXT_LENGTH);
		const sourceType = readString(row.sourceType, 40).toLowerCase();

		if (!title || !chunkText) {
			return json(
				{
					ok: false,
					error: `Chunk baris ${index + 1} wajib memiliki title dan chunkText/arabicText.`
				},
				{ status: 400 }
			);
		}
		if (sourceType && sourceType !== 'openiti') {
			return json(
				{
					ok: false,
					error: `Chunk baris ${index + 1} bukan bertipe OpenITI.`
				},
				{ status: 400 }
			);
		}

		const kitabSlug =
			normalizeKitabSlug(readString(row.kitabSlug, 160)) || normalizeKitabSlug(title) || 'kitab-openiti';
		const chunkIndex = readInteger(row.chunkIndex) ?? index + 1;
		const sourceRef = readString(row.sourceRef, 320);
		const sourceNote = readString(row.sourceNote, 500);
		const chapter = readString(row.chapter, 220) || null;
		const sectionTitle = readString(row.sectionTitle, 220) || null;
		const author = readString(row.author, 220) || null;
		const category = readString(row.category, 120) || null;
		const madhhab = readString(row.madhhab ?? row.madzhab, 120) || null;
		const pageNumber = readPageValue(row.pageNumber);
		const importId = `openiti-${importIdPart(kitabSlug)}-${String(chunkIndex).padStart(6, '0')}`;

		chunks.push({
			title,
			chunkText,
			kitabSlug,
			chunkIndex,
			sourceRef:
				sourceRef || [title, chapter, sectionTitle, `chunk ${chunkIndex}`].filter(Boolean).join(', '),
			sourceNote: sourceNote || null,
			chapter,
			sectionTitle,
			author,
			category,
			madhhab,
			pageNumber,
			importId
		});
	}

	const books = new Map<string, { title: string; chunks: number }>();

	try {
		for (const chunk of chunks) {
			await insertDokumen(
				platform as App.Platform,
				chunk.chunkText,
				{
					judul_kitab: chunk.title,
					halaman: chunk.pageNumber,
					kitab_slug: chunk.kitabSlug,
					source_type: 'openiti',
					source_ref: chunk.sourceRef,
					source_note: chunk.sourceNote,
					chapter: chunk.chapter,
					section_title: chunk.sectionTitle,
					chunk_index: chunk.chunkIndex,
					author: chunk.author,
					category: chunk.category,
					madhhab: chunk.madhhab
				},
				{ id: chunk.importId }
			);

			const existing = books.get(chunk.kitabSlug);
			books.set(chunk.kitabSlug, {
				title: chunk.title,
				chunks: (existing?.chunks ?? 0) + 1
			});
		}
	} catch (err) {
		console.error('Import OpenITI gagal:', err);
		return json(
			{
				ok: false,
				error: 'Import OpenITI gagal saat menyimpan chunk atau embedding.'
			},
			{ status: 500 }
		);
	}

	return json({
		ok: true,
		importedChunks: chunks.length,
		books: summarizeBooks(books)
	});
};
