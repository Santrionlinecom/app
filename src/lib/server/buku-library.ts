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

export type BukuAuthorBookListItem = BukuBookListItem & {
	totalChapterCount: number;
	draftChapterCount: number;
};

export type BukuChapterPreview = Omit<BukuChapter, 'content'>;

export type BukuChapterNavigation = BukuChapterPreview | null;

export type BukuBookAuthorStatus = 'draft' | 'published';

export type BukuBookFormValues = {
	title: string;
	description: string;
	category: string;
	coverUrl: string;
	freeChapterLimit: number;
	pricePerChapter: number;
	status: BukuBookAuthorStatus;
};

export type BukuChapterFormValues = {
	chapterNumber: number;
	title: string;
	content: string;
	status: BukuChapterStatus;
};

export type BukuFormResult<T> =
	| { ok: true; values: T }
	| { ok: false; error: string; values: Partial<T> };

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

const toBukuAuthorBookListItem = (row: any): BukuAuthorBookListItem => ({
	...toBukuBookListItem(row),
	totalChapterCount: Number(row.totalChapterCount ?? 0),
	draftChapterCount: Number(row.draftChapterCount ?? 0)
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

const formText = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '');

const parseIntegerField = (value: FormDataEntryValue | null, fallback: number) => {
	if (typeof value !== 'string' || !value.trim()) return fallback;
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : Number.NaN;
};

const normalizeOptionalUrl = (value: string) => {
	if (!value) return '';
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
	} catch (_) {
		return '';
	}
};

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

export function parseBukuBookForm(formData: FormData, defaultStatus: BukuBookAuthorStatus): BukuFormResult<BukuBookFormValues> {
	const values: BukuBookFormValues = {
		title: formText(formData.get('title')),
		description: formText(formData.get('description')),
		category: formText(formData.get('category')),
		coverUrl: formText(formData.get('coverUrl')),
		freeChapterLimit: parseIntegerField(formData.get('freeChapterLimit'), 7),
		pricePerChapter: parseIntegerField(formData.get('pricePerChapter'), 300),
		status: defaultStatus
	};
	const requestedStatus = formText(formData.get('status'));
	if (requestedStatus === 'draft' || requestedStatus === 'published') {
		values.status = requestedStatus;
	}

	if (values.title.length < 3 || values.title.length > 140) {
		return { ok: false, error: 'Judul buku harus 3-140 karakter.', values };
	}
	if (values.description.length > 5000) {
		return { ok: false, error: 'Sinopsis maksimal 5000 karakter.', values };
	}
	if (values.category.length > 80) {
		return { ok: false, error: 'Kategori maksimal 80 karakter.', values };
	}
	if (values.coverUrl) {
		const normalizedUrl = normalizeOptionalUrl(values.coverUrl);
		if (!normalizedUrl) {
			return { ok: false, error: 'Cover URL harus berupa URL http/https yang valid.', values };
		}
		values.coverUrl = normalizedUrl;
	}
	if (!Number.isInteger(values.freeChapterLimit) || values.freeChapterLimit < 0 || values.freeChapterLimit > 200) {
		return { ok: false, error: 'Jumlah bab gratis harus angka 0-200.', values };
	}
	if (!Number.isInteger(values.pricePerChapter) || values.pricePerChapter < 0 || values.pricePerChapter > 1_000_000) {
		return { ok: false, error: 'Harga per bab harus angka 0-1.000.000 coin.', values };
	}

	return { ok: true, values };
}

export function parseBukuChapterForm(formData: FormData): BukuFormResult<BukuChapterFormValues> {
	const values: BukuChapterFormValues = {
		chapterNumber: parseIntegerField(formData.get('chapterNumber'), 1),
		title: formText(formData.get('title')),
		content: formText(formData.get('content')),
		status: 'draft'
	};
	const requestedStatus = formText(formData.get('status'));
	if (requestedStatus === 'draft' || requestedStatus === 'published') {
		values.status = requestedStatus;
	}

	if (!Number.isInteger(values.chapterNumber) || values.chapterNumber < 1 || values.chapterNumber > 10000) {
		return { ok: false, error: 'Nomor bab harus angka 1-10000.', values };
	}
	if (values.title.length < 2 || values.title.length > 160) {
		return { ok: false, error: 'Judul bab harus 2-160 karakter.', values };
	}
	if (values.content.length < 1) {
		return { ok: false, error: 'Konten bab wajib diisi.', values };
	}
	if (values.content.length > 500000) {
		return { ok: false, error: 'Konten bab terlalu panjang.', values };
	}

	return { ok: true, values };
}

async function createUniqueBukuSlug(db: D1Database, title: string, excludeBookId?: string) {
	const base = normalizeBukuSlug(title) || 'buku';
	for (let index = 0; index < 50; index += 1) {
		const candidate = index === 0 ? base : `${base}-${index + 1}`;
		const existing = excludeBookId
			? await db
					.prepare('SELECT id FROM buku_books WHERE slug = ? AND id <> ? LIMIT 1')
					.bind(candidate, excludeBookId)
					.first<{ id: string }>()
			: await db
					.prepare('SELECT id FROM buku_books WHERE slug = ? LIMIT 1')
					.bind(candidate)
					.first<{ id: string }>();
		if (!existing) return candidate;
	}

	return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

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

export async function listAuthorBukuBooks(db: D1Database, authorId: string) {
	const { results } = await db
		.prepare(
			`SELECT
				${BOOK_SELECT},
				COUNT(c.id) as totalChapterCount,
				SUM(CASE WHEN c.status = 'published' THEN 1 ELSE 0 END) as publishedChapterCount,
				SUM(CASE WHEN c.status = 'draft' THEN 1 ELSE 0 END) as draftChapterCount
			FROM buku_books b
			LEFT JOIN buku_chapters c ON c.book_id = b.id
			WHERE b.author_id = ?
			GROUP BY b.id
			ORDER BY b.updated_at DESC, b.created_at DESC`
		)
		.bind(authorId)
		.all<any>();

	return (results ?? []).map(toBukuAuthorBookListItem);
}

export async function getAuthorBukuBookById(db: D1Database, authorId: string, id: string) {
	const row = await db
		.prepare(
			`SELECT
				${BOOK_SELECT},
				COUNT(c.id) as totalChapterCount,
				SUM(CASE WHEN c.status = 'published' THEN 1 ELSE 0 END) as publishedChapterCount,
				SUM(CASE WHEN c.status = 'draft' THEN 1 ELSE 0 END) as draftChapterCount
			FROM buku_books b
			LEFT JOIN buku_chapters c ON c.book_id = b.id
			WHERE b.author_id = ? AND b.id = ?
			GROUP BY b.id
			LIMIT 1`
		)
		.bind(authorId, id)
		.first<any>();

	return row ? toBukuAuthorBookListItem(row) : null;
}

export async function createBukuBook(db: D1Database, authorId: string, values: BukuBookFormValues) {
	const id = crypto.randomUUID();
	const slug = await createUniqueBukuSlug(db, values.title);

	await db
		.prepare(
			`INSERT INTO buku_books (
				id, author_id, title, slug, description, cover_url, category, status, free_chapter_limit, price_per_chapter
			) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
		)
		.bind(
			id,
			authorId,
			values.title,
			slug,
			values.description || null,
			values.coverUrl || null,
			values.category || null,
			values.freeChapterLimit,
			values.pricePerChapter
		)
		.run();

	return { id, slug };
}

export async function updateAuthorBukuBook(
	db: D1Database,
	authorId: string,
	id: string,
	values: BukuBookFormValues
) {
	const slug = await createUniqueBukuSlug(db, values.title, id);
	const result = await db
		.prepare(
			`UPDATE buku_books
			SET title = ?,
				slug = ?,
				description = ?,
				cover_url = ?,
				category = ?,
				status = ?,
				free_chapter_limit = ?,
				price_per_chapter = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND author_id = ?`
		)
		.bind(
			values.title,
			slug,
			values.description || null,
			values.coverUrl || null,
			values.category || null,
			values.status,
			values.freeChapterLimit,
			values.pricePerChapter,
			id,
			authorId
		)
		.run();

	return Number(result.meta?.changes ?? 0) > 0;
}

export async function listAuthorBukuChapters(db: D1Database, bookId: string) {
	const { results } = await db
		.prepare(
			`SELECT ${CHAPTER_PREVIEW_SELECT}
			FROM buku_chapters
			WHERE book_id = ?
			ORDER BY chapter_number ASC`
		)
		.bind(bookId)
		.all<any>();

	return (results ?? []).map(toBukuChapterPreview);
}

export async function getAuthorBukuChapterById(db: D1Database, bookId: string, chapterId: string) {
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
			WHERE book_id = ? AND id = ?
			LIMIT 1`
		)
		.bind(bookId, chapterId)
		.first<any>();

	return row ? toBukuChapter(row) : null;
}

export async function getNextBukuChapterNumber(db: D1Database, bookId: string) {
	const row = await db
		.prepare('SELECT MAX(chapter_number) as maxChapterNumber FROM buku_chapters WHERE book_id = ?')
		.bind(bookId)
		.first<{ maxChapterNumber: number | null }>();
	return Number(row?.maxChapterNumber ?? 0) + 1;
}

export async function createBukuChapter(db: D1Database, bookId: string, values: BukuChapterFormValues) {
	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO buku_chapters (id, book_id, chapter_number, title, content, status)
			VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(id, bookId, values.chapterNumber, values.title, values.content, values.status)
		.run();

	return { id };
}

export async function updateBukuChapter(
	db: D1Database,
	bookId: string,
	chapterId: string,
	values: BukuChapterFormValues
) {
	const result = await db
		.prepare(
			`UPDATE buku_chapters
			SET chapter_number = ?,
				title = ?,
				content = ?,
				status = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND book_id = ?`
		)
		.bind(values.chapterNumber, values.title, values.content, values.status, chapterId, bookId)
		.run();

	return Number(result.meta?.changes ?? 0) > 0;
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
