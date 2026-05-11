import type { D1Database } from '@cloudflare/workers-types';
import {
	getKitabStats,
	getPublishedKitabs,
	normalizeKitabStatus,
	type KitabSourceType,
	type KitabStatus
} from '$lib/kitab';

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
	status: string | null;
	featured: number | boolean | string | null;
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
		archivedItems: number;
		featuredItems: number;
	};
	items: KitabListItem[];
};

const statusRank: Record<KitabStatus, number> = {
	published: 0,
	draft: 1,
	archived: 2
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
	status: normalizeKitabStatus(row.status),
	featured: row.featured === true || row.featured === 1 || row.featured === '1',
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

const sortKitabItems = (items: KitabListItem[]) =>
	[...items].sort((left, right) => {
		const statusDelta = statusRank[left.status] - statusRank[right.status];
		if (statusDelta !== 0) return statusDelta;
		if (left.featured !== right.featured) return left.featured ? -1 : 1;
		return right.updatedAt - left.updatedAt;
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
			 ORDER BY updated_at DESC`
		)
		.all<KitabRow>();

	return sortKitabItems((results ?? []).map((row) => mapKitab(row)));
}

export async function listPublishedKitabItems(db: D1Database): Promise<KitabListItem[]> {
	return getPublishedKitabs(await listKitabItems(db));
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
	const row = await db.prepare('SELECT * FROM kitab_catalog WHERE slug = ?').bind(slug).first<KitabRow>();
	const item = row ? mapKitab(row) : null;

	if (options?.publishedOnly && item?.status !== 'published') return null;
	return item;
}

export async function getKitabOverview(db: D1Database): Promise<KitabOverview> {
	const items = await listKitabItems(db);
	const stats = getKitabStats(items);

	return {
		stats: {
			totalItems: stats.totalItems,
			publishedItems: stats.publishedItems,
			draftItems: stats.draftItems,
			archivedItems: stats.archivedItems,
			featuredItems: stats.featuredItems
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
				normalizeKitabStatus(input.status),
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
			normalizeKitabStatus(input.status),
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
