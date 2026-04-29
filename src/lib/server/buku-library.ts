import type { D1Database } from '@cloudflare/workers-types';

export const BUKU_BOOK_STATUSES = ['draft', 'pending', 'published', 'rejected', 'archived'] as const;
export const BUKU_CHAPTER_STATUSES = ['draft', 'published'] as const;

export type BukuBookStatus = (typeof BUKU_BOOK_STATUSES)[number];
export type BukuChapterStatus = (typeof BUKU_CHAPTER_STATUSES)[number];

export type BukuBook = {
	id: string;
	authorId: string;
	title: string;
	slug: string;
	description: string | null;
	coverUrl: string | null;
	category: string | null;
	status: BukuBookStatus;
	freeChapterLimit: number;
	pricePerChapter: number;
	adminNote: string | null;
	createdAt: string;
	updatedAt: string;
};

export type BukuChapter = {
	id: string;
	bookId: string;
	chapterNumber: number;
	title: string;
	content: string;
	status: BukuChapterStatus;
	createdAt: string;
	updatedAt: string;
};

export type BukuBookListItem = BukuBook & {
	publishedChapterCount: number;
};

export type BukuChapterPreview = Omit<BukuChapter, 'content'>;

export type BukuChapterNavigation = BukuChapterPreview | null;

export const normalizeBukuSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

const BUKU_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BUKU_CHAPTER_PARAM_PATTERN = /^[1-9]\d{0,4}$/;

export const isValidBukuSlug = (value: string) => BUKU_SLUG_PATTERN.test(value);

export const parseBukuChapterParam = (value: string) => {
	if (!BUKU_CHAPTER_PARAM_PATTERN.test(value)) return null;
	const chapterNumber = Number(value);
	return Number.isSafeInteger(chapterNumber) ? chapterNumber : null;
};

const toBukuBook = (row: any): BukuBook => ({
	id: row.id,
	authorId: row.authorId,
	title: row.title,
	slug: row.slug,
	description: row.description ?? null,
	coverUrl: row.coverUrl ?? null,
	category: row.category ?? null,
	status: row.status,
	freeChapterLimit: Number(row.freeChapterLimit ?? 0),
	pricePerChapter: Number(row.pricePerChapter ?? 0),
	adminNote: row.adminNote ?? null,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt
});

const toBukuBookListItem = (row: any): BukuBookListItem => ({
	...toBukuBook(row),
	publishedChapterCount: Number(row.publishedChapterCount ?? 0)
});

const toBukuChapter = (row: any): BukuChapter => ({
	id: row.id,
	bookId: row.bookId,
	chapterNumber: Number(row.chapterNumber ?? 0),
	title: row.title,
	content: row.content,
	status: row.status,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt
});

const toBukuChapterPreview = (row: any): BukuChapterPreview => ({
	id: row.id,
	bookId: row.bookId,
	chapterNumber: Number(row.chapterNumber ?? 0),
	title: row.title,
	status: row.status,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt
});

const clampLimit = (value: number, fallback = 48) => {
	if (!Number.isFinite(value)) return fallback;
	return Math.min(Math.max(Math.trunc(value), 1), 100);
};

const BOOK_SELECT = `
	b.id,
	b.author_id as authorId,
	b.title,
	b.slug,
	b.description,
	b.cover_url as coverUrl,
	b.category,
	b.status,
	b.free_chapter_limit as freeChapterLimit,
	b.price_per_chapter as pricePerChapter,
	b.admin_note as adminNote,
	b.created_at as createdAt,
	b.updated_at as updatedAt
`;

const CHAPTER_PREVIEW_SELECT = `
	id,
	book_id as bookId,
	chapter_number as chapterNumber,
	title,
	status,
	created_at as createdAt,
	updated_at as updatedAt
`;

export async function listPublishedBukuBooks(db: D1Database, limit = 48) {
	const { results } = await db
		.prepare(
			`SELECT
				${BOOK_SELECT},
				COUNT(c.id) as publishedChapterCount
			FROM buku_books b
			LEFT JOIN buku_chapters c ON c.book_id = b.id AND c.status = 'published'
			WHERE b.status = 'published'
			GROUP BY b.id
			ORDER BY b.updated_at DESC, b.created_at DESC
			LIMIT ?`
		)
		.bind(clampLimit(limit))
		.all<any>();

	return (results ?? []).map(toBukuBookListItem);
}

export async function getPublishedBukuBookBySlug(db: D1Database, slug: string) {
	const row = await db
		.prepare(
			`SELECT
				${BOOK_SELECT},
				COUNT(c.id) as publishedChapterCount
			FROM buku_books b
			LEFT JOIN buku_chapters c ON c.book_id = b.id AND c.status = 'published'
			WHERE b.status = 'published' AND b.slug = ?
			GROUP BY b.id
			LIMIT 1`
		)
		.bind(slug)
		.first<any>();

	return row ? toBukuBookListItem(row) : null;
}

export async function listPublishedBukuChapters(db: D1Database, bookId: string) {
	const { results } = await db
		.prepare(
			`SELECT ${CHAPTER_PREVIEW_SELECT}
			FROM buku_chapters
			WHERE book_id = ? AND status = 'published'
			ORDER BY chapter_number ASC`
		)
		.bind(bookId)
		.all<any>();

	return (results ?? []).map(toBukuChapterPreview);
}

export async function getPublishedBukuChapterByNumber(
	db: D1Database,
	bookId: string,
	chapterNumber: number
) {
	const row = await db
		.prepare(
			`SELECT
				id,
				book_id as bookId,
				chapter_number as chapterNumber,
				title,
				content,
				status,
				created_at as createdAt,
				updated_at as updatedAt
			FROM buku_chapters
			WHERE book_id = ? AND chapter_number = ? AND status = 'published'
			LIMIT 1`
		)
		.bind(bookId, chapterNumber)
		.first<any>();

	return row ? toBukuChapter(row) : null;
}

export async function getAdjacentPublishedBukuChapters(
	db: D1Database,
	bookId: string,
	chapterNumber: number
) {
	const previousRow = await db
		.prepare(
			`SELECT ${CHAPTER_PREVIEW_SELECT}
			FROM buku_chapters
			WHERE book_id = ? AND status = 'published' AND chapter_number < ?
			ORDER BY chapter_number DESC
			LIMIT 1`
		)
		.bind(bookId, chapterNumber)
		.first<any>();

	const nextRow = await db
		.prepare(
			`SELECT ${CHAPTER_PREVIEW_SELECT}
			FROM buku_chapters
			WHERE book_id = ? AND status = 'published' AND chapter_number > ?
			ORDER BY chapter_number ASC
			LIMIT 1`
		)
		.bind(bookId, chapterNumber)
		.first<any>();

	return {
		previousChapter: previousRow ? toBukuChapterPreview(previousRow) : null,
		nextChapter: nextRow ? toBukuChapterPreview(nextRow) : null
	};
}

export async function ensureBukuLibrarySchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_books (
				id TEXT PRIMARY KEY,
				author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title TEXT NOT NULL,
				slug TEXT NOT NULL UNIQUE,
				description TEXT,
				cover_url TEXT,
				category TEXT,
				status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
				free_chapter_limit INTEGER NOT NULL DEFAULT 7,
				price_per_chapter INTEGER NOT NULL DEFAULT 300,
				admin_note TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_chapters (
				id TEXT PRIMARY KEY,
				book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
				chapter_number INTEGER NOT NULL,
				title TEXT NOT NULL,
				content TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(book_id, chapter_number)
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_books_author ON buku_books(author_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_books_slug ON buku_books(slug)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_books_status ON buku_books(status)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_chapters_book ON buku_chapters(book_id)').run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_chapters_book_number ON buku_chapters(book_id, chapter_number)')
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_chapters_status ON buku_chapters(status)').run();
}
