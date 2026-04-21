import type { D1Database } from '@cloudflare/workers-types';
import type { KitabSourceType, KitabStatus } from '$lib/kitab';

type KitabRow = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	cover_url: string | null;
	category: string | null;
	source_type: KitabSourceType;
	source_url: string;
	storage_key: string | null;
	mime_type: string | null;
	file_size: number | null;
	page_count: number | null;
	status: KitabStatus;
	featured: number | boolean | null;
	created_at: number;
	updated_at: number;
};

export type KitabListItem = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	coverUrl: string | null;
	category: string | null;
	sourceType: KitabSourceType;
	sourceUrl: string;
	storageKey: string | null;
	mimeType: string | null;
	fileSize: number | null;
	pageCount: number | null;
	status: KitabStatus;
	featured: boolean;
	createdAt: number;
	updatedAt: number;
};

export type KitabOverview = {
	stats: {
		totalItems: number;
		publishedItems: number;
		draftItems: number;
		featuredItems: number;
	};
	items: KitabListItem[];
};

const mapKitab = (row: KitabRow): KitabListItem => ({
	id: row.id,
	title: row.title,
	slug: row.slug,
	summary: row.summary,
	description: row.description,
	coverUrl: row.cover_url,
	category: row.category,
	sourceType: row.source_type,
	sourceUrl: row.source_url,
	storageKey: row.storage_key,
	mimeType: row.mime_type,
	fileSize: row.file_size,
	pageCount: row.page_count,
	status: row.status,
	featured: Boolean(row.featured),
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

export async function ensureKitabCatalogSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS kitab_catalog (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				slug TEXT NOT NULL UNIQUE,
				summary TEXT,
				description TEXT,
				cover_url TEXT,
				category TEXT,
				source_type TEXT NOT NULL DEFAULT 'pdf',
				source_url TEXT NOT NULL,
				storage_key TEXT,
				mime_type TEXT,
				file_size INTEGER,
				page_count INTEGER,
				status TEXT NOT NULL DEFAULT 'draft',
				featured INTEGER NOT NULL DEFAULT 0,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL,
				CHECK (source_type IN ('pdf', 'drive')),
				CHECK (status IN ('draft', 'published', 'archived'))
			)`
		)
		.run();

	const { results } = await db.prepare(`PRAGMA table_info('kitab_catalog')`).all<{ name: string }>();
	const columns = new Set((results ?? []).map((column) => column.name));
	if (!columns.has('category')) {
		await db.prepare('ALTER TABLE kitab_catalog ADD COLUMN category TEXT').run();
	}

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kitab_catalog_slug ON kitab_catalog(slug)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kitab_catalog_status ON kitab_catalog(status)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kitab_catalog_updated_at ON kitab_catalog(updated_at DESC)').run();
}

export async function listKitabItems(db: D1Database): Promise<KitabListItem[]> {
	const { results } = await db
		.prepare(
			`SELECT *
			 FROM kitab_catalog
			 ORDER BY
			 	CASE status
					WHEN 'published' THEN 0
					WHEN 'draft' THEN 1
					ELSE 2
				END,
				featured DESC,
				updated_at DESC`
		)
		.all<KitabRow>();

	return (results ?? []).map((row) => mapKitab(row));
}

export async function listPublishedKitabItems(db: D1Database): Promise<KitabListItem[]> {
	const { results } = await db
		.prepare(
			`SELECT *
			 FROM kitab_catalog
			 WHERE status = 'published'
			 ORDER BY featured DESC, updated_at DESC`
		)
		.all<KitabRow>();

	return (results ?? []).map((row) => mapKitab(row));
}

export async function getKitabItemById(db: D1Database, id: string): Promise<KitabListItem | null> {
	const row = await db.prepare('SELECT * FROM kitab_catalog WHERE id = ?').bind(id).first<KitabRow>();
	return row ? mapKitab(row) : null;
}

export async function getKitabItemBySlug(
	db: D1Database,
	slug: string,
	options?: { publishedOnly?: boolean }
): Promise<KitabListItem | null> {
	const row = options?.publishedOnly
		? await db
				.prepare("SELECT * FROM kitab_catalog WHERE slug = ? AND status = 'published'")
				.bind(slug)
				.first<KitabRow>()
		: await db.prepare('SELECT * FROM kitab_catalog WHERE slug = ?').bind(slug).first<KitabRow>();

	return row ? mapKitab(row) : null;
}

export async function getKitabOverview(db: D1Database): Promise<KitabOverview> {
	const [items, stats] = await Promise.all([
		listKitabItems(db),
		db
			.prepare(
				`SELECT
					COUNT(1) as totalItems,
					COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) as publishedItems,
					COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) as draftItems,
					COALESCE(SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END), 0) as featuredItems
				 FROM kitab_catalog`
			)
			.first<{
				totalItems: number | null;
				publishedItems: number | null;
				draftItems: number | null;
				featuredItems: number | null;
			}>()
	]);

	return {
		stats: {
			totalItems: Number(stats?.totalItems ?? 0),
			publishedItems: Number(stats?.publishedItems ?? 0),
			draftItems: Number(stats?.draftItems ?? 0),
			featuredItems: Number(stats?.featuredItems ?? 0)
		},
		items
	};
}

export async function upsertKitabItem(
	db: D1Database,
	input: {
		id?: string | null;
		title: string;
		slug: string;
	summary?: string | null;
	description?: string | null;
	coverUrl?: string | null;
	category?: string | null;
	sourceType: KitabSourceType;
	sourceUrl: string;
	storageKey?: string | null;
	mimeType?: string | null;
		fileSize?: number | null;
		pageCount?: number | null;
		status: KitabStatus;
		featured?: boolean;
	}
) {
	const now = Date.now();
	const id = input.id?.trim() || crypto.randomUUID();

	if (input.id?.trim()) {
		await db
			.prepare(
			`UPDATE kitab_catalog
				 SET title = ?, slug = ?, summary = ?, description = ?, cover_url = ?, category = ?, source_type = ?, source_url = ?, storage_key = ?, mime_type = ?, file_size = ?, page_count = ?, status = ?, featured = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				input.title.trim(),
				input.slug.trim(),
				input.summary?.trim() || null,
				input.description?.trim() || null,
				input.coverUrl?.trim() || null,
				input.category?.trim() || null,
				input.sourceType,
				input.sourceUrl.trim(),
				input.storageKey?.trim() || null,
				input.mimeType?.trim() || null,
				input.fileSize ?? null,
				input.pageCount ?? null,
				input.status,
				input.featured ? 1 : 0,
				now,
				id
			)
			.run();
		return id;
	}

	await db
		.prepare(
			`INSERT INTO kitab_catalog
				(id, title, slug, summary, description, cover_url, category, source_type, source_url, storage_key, mime_type, file_size, page_count, status, featured, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			input.title.trim(),
			input.slug.trim(),
			input.summary?.trim() || null,
			input.description?.trim() || null,
			input.coverUrl?.trim() || null,
			input.category?.trim() || null,
			input.sourceType,
			input.sourceUrl.trim(),
			input.storageKey?.trim() || null,
			input.mimeType?.trim() || null,
			input.fileSize ?? null,
			input.pageCount ?? null,
			input.status,
			input.featured ? 1 : 0,
			now,
			now
		)
		.run();
	return id;
}

export async function deleteKitabItem(db: D1Database, id: string) {
	await db.prepare('DELETE FROM kitab_catalog WHERE id = ?').bind(id).run();
}
