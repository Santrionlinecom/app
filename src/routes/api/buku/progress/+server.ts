import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureBukuAccessSchema, getBukuChapterAccess } from '$lib/server/buku-access';
import { ensureBukuLibrarySchema } from '$lib/server/buku-library';
import { ensureBukuProgressSchema, saveReadingProgress } from '$lib/server/buku-progress';

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeProgressPercent = (value: unknown) => {
	const parsed = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(parsed)) return 0;
	return Math.min(100, Math.max(0, Math.round(parsed)));
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database tidak tersedia.' }, { status: 500 });
	}

	const body = await request.json().catch(() => ({}));
	const bookId = readText((body as { bookId?: unknown }).bookId);
	const chapterId = readText((body as { chapterId?: unknown }).chapterId);
	const progressPercent = normalizeProgressPercent((body as { progressPercent?: unknown }).progressPercent);

	if (!bookId || !chapterId) {
		return json({ error: 'bookId dan chapterId wajib diisi.' }, { status: 400 });
	}

	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuProgressSchema(db);

	const target = await db
		.prepare(
			`SELECT
				b.id as bookId,
				b.free_chapter_limit as freeChapterLimit,
				c.id as chapterId,
				c.chapter_number as chapterNumber
			FROM buku_books b
			JOIN buku_chapters c ON c.book_id = b.id
			WHERE b.id = ?
				AND b.status = 'published'
				AND c.id = ?
				AND c.status = 'published'
			LIMIT 1`
		)
		.bind(bookId, chapterId)
		.first<{
			bookId: string;
			freeChapterLimit: number;
			chapterId: string;
			chapterNumber: number;
		}>();

	if (!target) {
		return json({ error: 'Buku atau bab tidak ditemukan.' }, { status: 404 });
	}

	const chapterNumber = Number(target.chapterNumber ?? 0);
	const access = await getBukuChapterAccess(db, {
		userId: locals.user.id,
		chapterId: target.chapterId,
		chapterNumber,
		freeChapterLimit: Number(target.freeChapterLimit ?? 0)
	});

	if (access === 'locked') {
		return json({ error: 'Bab terkunci belum bisa disimpan sebagai progress baca.' }, { status: 403 });
	}

	const progress = await saveReadingProgress(
		db,
		locals.user.id,
		target.bookId,
		target.chapterId,
		chapterNumber,
		progressPercent
	);

	if (!progress) {
		return json({ error: 'Progress tidak bisa disimpan.' }, { status: 400 });
	}

	return json({ progress });
};
