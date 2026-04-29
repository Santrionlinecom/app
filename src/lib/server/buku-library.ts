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

export const normalizeBukuSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

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
