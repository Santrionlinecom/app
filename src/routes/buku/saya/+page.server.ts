import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { D1Database } from '@cloudflare/workers-types';
import { ensureBukuAccessSchema } from '$lib/server/buku-access';
import { ensureBukuLibrarySchema } from '$lib/server/buku-library';
import { ensureBukuProgressSchema } from '$lib/server/buku-progress';

type ReadingProgressItem = {
	id: string;
	bookId: string;
	chapterId: string;
	chapterNumber: number;
	progressPercent: number;
	lastReadAt: string;
	bookTitle: string;
	bookSlug: string;
	bookCoverUrl: string | null;
	bookCategory: string | null;
	chapterTitle: string;
};

type BookmarkItem = {
	id: string;
	bookId: string;
	chapterId: string | null;
	note: string | null;
	createdAt: string;
	bookTitle: string;
	bookSlug: string;
	bookCoverUrl: string | null;
	bookCategory: string | null;
	chapterNumber: number | null;
	chapterTitle: string | null;
};

type UnlockedChapterItem = {
	id: string;
	bookId: string;
	chapterId: string;
	coinSpent: number;
	createdAt: string;
	bookTitle: string;
	bookSlug: string;
	bookCoverUrl: string | null;
	bookCategory: string | null;
	bookStatus: string;
	chapterNumber: number;
	chapterTitle: string;
	chapterStatus: string;
	isAvailable: boolean;
};

const toReadingProgress = (row: any): ReadingProgressItem => ({
	id: row.id,
	bookId: row.bookId,
	chapterId: row.chapterId,
	chapterNumber: Number(row.chapterNumber ?? 0),
	progressPercent: Number(row.progressPercent ?? 0),
	lastReadAt: row.lastReadAt,
	bookTitle: row.bookTitle,
	bookSlug: row.bookSlug,
	bookCoverUrl: row.bookCoverUrl ?? null,
	bookCategory: row.bookCategory ?? null,
	chapterTitle: row.chapterTitle
});

const toBookmark = (row: any): BookmarkItem => ({
	id: row.id,
	bookId: row.bookId,
	chapterId: row.chapterId ?? null,
	note: row.note ?? null,
	createdAt: row.createdAt,
	bookTitle: row.bookTitle,
	bookSlug: row.bookSlug,
	bookCoverUrl: row.bookCoverUrl ?? null,
	bookCategory: row.bookCategory ?? null,
	chapterNumber: row.chapterNumber == null ? null : Number(row.chapterNumber),
	chapterTitle: row.chapterTitle ?? null
});

const toUnlockedChapter = (row: any): UnlockedChapterItem => {
	const bookStatus = row.bookStatus ?? 'unknown';
	const chapterStatus = row.chapterStatus ?? 'unknown';

	return {
		id: row.id,
		bookId: row.bookId,
		chapterId: row.chapterId,
		coinSpent: Number(row.coinSpent ?? 0),
		createdAt: row.createdAt,
		bookTitle: row.bookTitle ?? 'Buku tidak tersedia',
		bookSlug: row.bookSlug ?? '',
		bookCoverUrl: row.bookCoverUrl ?? null,
		bookCategory: row.bookCategory ?? null,
		bookStatus,
		chapterNumber: Number(row.chapterNumber ?? 0),
		chapterTitle: row.chapterTitle ?? 'Bab tidak tersedia',
		chapterStatus,
		isAvailable: bookStatus === 'published' && chapterStatus === 'published'
	};
};

async function listReadingProgress(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			`SELECT
				rp.id,
				rp.book_id as bookId,
				rp.chapter_id as chapterId,
				rp.chapter_number as chapterNumber,
				rp.progress_percent as progressPercent,
				rp.last_read_at as lastReadAt,
				b.title as bookTitle,
				b.slug as bookSlug,
				b.cover_url as bookCoverUrl,
				b.category as bookCategory,
				c.title as chapterTitle
			FROM buku_reading_progress rp
			JOIN buku_books b ON b.id = rp.book_id AND b.status = 'published'
			JOIN buku_chapters c ON c.id = rp.chapter_id AND c.book_id = rp.book_id AND c.status = 'published'
			WHERE rp.user_id = ?
			ORDER BY rp.last_read_at DESC`
		)
		.bind(userId)
		.all<any>();

	return (results ?? []).map(toReadingProgress);
}

async function listBookmarks(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			`SELECT
				bm.id,
				bm.book_id as bookId,
				bm.chapter_id as chapterId,
				bm.note,
				bm.created_at as createdAt,
				b.title as bookTitle,
				b.slug as bookSlug,
				b.cover_url as bookCoverUrl,
				b.category as bookCategory,
				c.chapter_number as chapterNumber,
				c.title as chapterTitle
			FROM buku_bookmarks bm
			JOIN buku_books b ON b.id = bm.book_id AND b.status = 'published'
			LEFT JOIN buku_chapters c ON c.id = bm.chapter_id AND c.book_id = bm.book_id AND c.status = 'published'
			WHERE bm.user_id = ?
				AND (bm.chapter_id IS NULL OR c.id IS NOT NULL)
			ORDER BY bm.created_at DESC`
		)
		.bind(userId)
		.all<any>();

	const bookmarks = (results ?? []).map(toBookmark);
	return {
		bookBookmarks: bookmarks.filter((bookmark) => !bookmark.chapterId),
		chapterBookmarks: bookmarks.filter((bookmark) => Boolean(bookmark.chapterId))
	};
}

async function listUnlockedChapters(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			`SELECT
				u.id,
				u.book_id as bookId,
				u.chapter_id as chapterId,
				u.coin_spent as coinSpent,
				u.created_at as createdAt,
				b.title as bookTitle,
				b.slug as bookSlug,
				b.cover_url as bookCoverUrl,
				b.category as bookCategory,
				b.status as bookStatus,
				c.chapter_number as chapterNumber,
				c.title as chapterTitle,
				c.status as chapterStatus
			FROM buku_unlocks u
			JOIN buku_books b ON b.id = u.book_id
			JOIN buku_chapters c ON c.id = u.chapter_id AND c.book_id = u.book_id
			WHERE u.user_id = ?
			ORDER BY u.created_at DESC`
		)
		.bind(userId)
		.all<any>();

	return (results ?? []).map(toUnlockedChapter);
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuProgressSchema(db);

	const [readingProgress, bookmarks, unlockedChapters] = await Promise.all([
		listReadingProgress(db, locals.user.id),
		listBookmarks(db, locals.user.id),
		listUnlockedChapters(db, locals.user.id)
	]);

	return {
		readingProgress,
		bookBookmarks: bookmarks.bookBookmarks,
		chapterBookmarks: bookmarks.chapterBookmarks,
		unlockedChapters,
		stats: {
			readingProgress: readingProgress.length,
			bookBookmarks: bookmarks.bookBookmarks.length,
			chapterBookmarks: bookmarks.chapterBookmarks.length,
			unlockedChapters: unlockedChapters.length
		}
	};
};
