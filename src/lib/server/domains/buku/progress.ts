import type { D1Database } from '@cloudflare/workers-types';

export type BukuReadingProgress = {
	id: string;
	userId: string;
	bookId: string;
	chapterId: string;
	chapterNumber: number;
	progressPercent: number;
	lastReadAt: string;
	createdAt: string;
	updatedAt: string;
	bookTitle: string;
	bookSlug: string;
	bookCoverUrl: string | null;
	bookCategory: string | null;
	chapterTitle: string;
};

export type BukuBookmark = {
	id: string;
	userId: string;
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

type PublishedBookmarkTarget = {
	bookId: string;
	chapterId: string | null;
	chapterNumber: number | null;
};

const clampProgressPercent = (value: number) => {
	if (!Number.isFinite(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
};

const normalizeId = (value: string) => value.trim();

const normalizeOptionalId = (value?: string | null) => {
	const normalized = typeof value === 'string' ? value.trim() : '';
	return normalized || null;
};

const toReadingProgress = (row: any): BukuReadingProgress => ({
	id: row.id,
	userId: row.userId,
	bookId: row.bookId,
	chapterId: row.chapterId,
	chapterNumber: Number(row.chapterNumber ?? 0),
	progressPercent: Number(row.progressPercent ?? 0),
	lastReadAt: row.lastReadAt,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
	bookTitle: row.bookTitle,
	bookSlug: row.bookSlug,
	bookCoverUrl: row.bookCoverUrl ?? null,
	bookCategory: row.bookCategory ?? null,
	chapterTitle: row.chapterTitle
});

const toBookmark = (row: any): BukuBookmark => ({
	id: row.id,
	userId: row.userId,
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

const getPublishedChapterTarget = async (db: D1Database, bookId: string, chapterId: string) => {
	return await db
		.prepare(
			`SELECT
				b.id as bookId,
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
		.first<PublishedBookmarkTarget>();
};

const getPublishedBookmarkTarget = async (
	db: D1Database,
	bookId: string,
	chapterId?: string | null
): Promise<PublishedBookmarkTarget | null> => {
	const normalizedBookId = normalizeId(bookId);
	const normalizedChapterId = normalizeOptionalId(chapterId);

	if (!normalizedBookId) return null;

	if (!normalizedChapterId) {
		const book = await db
			.prepare("SELECT id as bookId FROM buku_books WHERE id = ? AND status = 'published' LIMIT 1")
			.bind(normalizedBookId)
			.first<{ bookId: string }>();
		return book ? { bookId: book.bookId, chapterId: null, chapterNumber: null } : null;
	}

	const chapter = await getPublishedChapterTarget(db, normalizedBookId, normalizedChapterId);
	return chapter
		? {
				bookId: chapter.bookId,
				chapterId: chapter.chapterId,
				chapterNumber: Number(chapter.chapterNumber ?? 0)
			}
		: null;
};

const READING_PROGRESS_SELECT = `
	rp.id,
	rp.user_id as userId,
	rp.book_id as bookId,
	rp.chapter_id as chapterId,
	rp.chapter_number as chapterNumber,
	rp.progress_percent as progressPercent,
	rp.last_read_at as lastReadAt,
	rp.created_at as createdAt,
	rp.updated_at as updatedAt,
	b.title as bookTitle,
	b.slug as bookSlug,
	b.cover_url as bookCoverUrl,
	b.category as bookCategory,
	c.title as chapterTitle
`;

const BOOKMARK_SELECT = `
	bm.id,
	bm.user_id as userId,
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
`;

export async function ensureBukuProgressSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_reading_progress (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
				chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
				chapter_number INTEGER NOT NULL,
				progress_percent INTEGER NOT NULL DEFAULT 0,
				last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, book_id)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_bookmarks (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
				chapter_id TEXT REFERENCES buku_chapters(id) ON DELETE CASCADE,
				note TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, book_id, chapter_id)
			)`
		)
		.run();

	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_user ON buku_reading_progress(user_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_book ON buku_reading_progress(book_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_last_read ON buku_reading_progress(last_read_at)')
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_bookmarks_user ON buku_bookmarks(user_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_bookmarks_book ON buku_bookmarks(book_id)').run();
}

export async function getUserReadingProgress(db: D1Database, userId: string) {
	await ensureBukuProgressSchema(db);
	const { results } = await db
		.prepare(
			`SELECT ${READING_PROGRESS_SELECT}
			FROM buku_reading_progress rp
			JOIN buku_books b ON b.id = rp.book_id AND b.status = 'published'
			JOIN buku_chapters c ON c.id = rp.chapter_id AND c.book_id = rp.book_id AND c.status = 'published'
			WHERE rp.user_id = ?
			ORDER BY rp.last_read_at DESC
			LIMIT 8`
		)
		.bind(userId)
		.all<any>();

	return (results ?? []).map(toReadingProgress);
}

export async function getBookReadingProgress(db: D1Database, userId: string, bookId: string) {
	await ensureBukuProgressSchema(db);
	const row = await db
		.prepare(
			`SELECT ${READING_PROGRESS_SELECT}
			FROM buku_reading_progress rp
			JOIN buku_books b ON b.id = rp.book_id AND b.status = 'published'
			JOIN buku_chapters c ON c.id = rp.chapter_id AND c.book_id = rp.book_id AND c.status = 'published'
			WHERE rp.user_id = ? AND rp.book_id = ?
			LIMIT 1`
		)
		.bind(userId, bookId)
		.first<any>();

	return row ? toReadingProgress(row) : null;
}

export async function saveReadingProgress(
	db: D1Database,
	userId: string,
	bookId: string,
	chapterId: string,
	chapterNumber: number,
	progressPercent: number
) {
	await ensureBukuProgressSchema(db);

	const target = await getPublishedChapterTarget(db, normalizeId(bookId), normalizeId(chapterId));
	if (!target) return null;

	const normalizedChapterNumber = Number(target.chapterNumber ?? 0);
	const requestedChapterNumber = Math.trunc(Number(chapterNumber));
	if (requestedChapterNumber !== normalizedChapterNumber) return null;

	await db
		.prepare(
			`INSERT INTO buku_reading_progress (
				id,
				user_id,
				book_id,
				chapter_id,
				chapter_number,
				progress_percent
			) VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(user_id, book_id) DO UPDATE SET
				chapter_id = excluded.chapter_id,
				chapter_number = excluded.chapter_number,
				progress_percent = CASE
					WHEN buku_reading_progress.chapter_id = excluded.chapter_id
						THEN MAX(buku_reading_progress.progress_percent, excluded.progress_percent)
					ELSE excluded.progress_percent
				END,
				last_read_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP`
		)
		.bind(
			crypto.randomUUID(),
			userId,
			target.bookId,
			target.chapterId,
			normalizedChapterNumber,
			clampProgressPercent(progressPercent)
		)
		.run();

	return await getBookReadingProgress(db, userId, target.bookId);
}

export async function listUserBookmarks(db: D1Database, userId: string) {
	await ensureBukuProgressSchema(db);
	const { results } = await db
		.prepare(
			`SELECT ${BOOKMARK_SELECT}
			FROM buku_bookmarks bm
			JOIN buku_books b ON b.id = bm.book_id AND b.status = 'published'
			LEFT JOIN buku_chapters c ON c.id = bm.chapter_id AND c.book_id = bm.book_id AND c.status = 'published'
			WHERE bm.user_id = ?
				AND (bm.chapter_id IS NULL OR c.id IS NOT NULL)
			ORDER BY bm.created_at DESC
			LIMIT 100`
		)
		.bind(userId)
		.all<any>();

	return (results ?? []).map(toBookmark);
}

const getBookmarkByScope = async (
	db: D1Database,
	userId: string,
	bookId: string,
	chapterId?: string | null
) => {
	const normalizedChapterId = normalizeOptionalId(chapterId);
	const row = await db
		.prepare(
			`SELECT ${BOOKMARK_SELECT}
			FROM buku_bookmarks bm
			JOIN buku_books b ON b.id = bm.book_id AND b.status = 'published'
			LEFT JOIN buku_chapters c ON c.id = bm.chapter_id AND c.book_id = bm.book_id AND c.status = 'published'
			WHERE bm.user_id = ?
				AND bm.book_id = ?
				AND ((? IS NULL AND bm.chapter_id IS NULL) OR bm.chapter_id = ?)
				AND (bm.chapter_id IS NULL OR c.id IS NOT NULL)
			LIMIT 1`
		)
		.bind(userId, bookId, normalizedChapterId, normalizedChapterId)
		.first<any>();

	return row ? toBookmark(row) : null;
};

export async function addBookmark(
	db: D1Database,
	userId: string,
	bookId: string,
	chapterId?: string | null
) {
	await ensureBukuProgressSchema(db);
	const target = await getPublishedBookmarkTarget(db, bookId, chapterId);
	if (!target) return null;

	const existing = await getBookmarkByScope(db, userId, target.bookId, target.chapterId);
	if (existing) return existing;

	await db
		.prepare(
			`INSERT INTO buku_bookmarks (id, user_id, book_id, chapter_id, note)
			SELECT ?, ?, ?, ?, NULL
			WHERE NOT EXISTS (
				SELECT 1
				FROM buku_bookmarks
				WHERE user_id = ?
					AND book_id = ?
					AND ((? IS NULL AND chapter_id IS NULL) OR chapter_id = ?)
			)`
		)
		.bind(
			crypto.randomUUID(),
			userId,
			target.bookId,
			target.chapterId,
			userId,
			target.bookId,
			target.chapterId,
			target.chapterId
		)
		.run();

	return await getBookmarkByScope(db, userId, target.bookId, target.chapterId);
}

export async function removeBookmark(
	db: D1Database,
	userId: string,
	bookId: string,
	chapterId?: string | null
) {
	await ensureBukuProgressSchema(db);
	const target = await getPublishedBookmarkTarget(db, bookId, chapterId);
	if (!target) return false;

	const result = await db
		.prepare(
			`DELETE FROM buku_bookmarks
			WHERE user_id = ?
				AND book_id = ?
				AND ((? IS NULL AND chapter_id IS NULL) OR chapter_id = ?)`
		)
		.bind(userId, target.bookId, target.chapterId, target.chapterId)
		.run();

	return Number(result.meta?.changes ?? 0) > 0;
}
