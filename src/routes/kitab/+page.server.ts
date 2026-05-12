import type { PageServerLoad } from './$types';
import { ensureKitabCatalogSchema, listPublishedKitabItems } from '$lib/server/kitab-catalog';
import { featuredCuratedKitab } from '$lib/data/kitab-curated';
import { getKitabStats } from '$lib/kitab';

const normalizeKitabCollectionKey = (value: string | null | undefined) =>
	(value ?? '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const catalogIdentity = (item: { slug: string; title: string }) =>
	normalizeKitabCollectionKey(item.title) || normalizeKitabCollectionKey(item.slug);

const dedupePublishedCatalog = <T extends { slug: string; title: string; updatedAt: number }>(
	items: readonly T[]
) => {
	const newestByIdentity = new Map<string, T>();

	for (const item of items) {
		const identity = catalogIdentity(item);
		if (!identity) continue;
		const current = newestByIdentity.get(identity);
		if (!current || item.updatedAt > current.updatedAt) {
			newestByIdentity.set(identity, item);
		}
	}

	return items.filter((item) => newestByIdentity.get(catalogIdentity(item)) === item);
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return {
			curatedItems: featuredCuratedKitab,
			items: [],
			stats: {
				totalItems: 0,
				featuredItems: 0,
				pdfItems: 0,
				driveItems: 0
			}
		};
	}

	await ensureKitabCatalogSchema(db);
	const items = dedupePublishedCatalog(await listPublishedKitabItems(db));
	const publishedBySlug = new Map(items.map((item) => [item.slug, item]));
	const publishedIdentities = new Set(items.map((item) => catalogIdentity(item)));
	const curatedItems = featuredCuratedKitab.filter((item) => {
		if (publishedBySlug.has(item.slug)) return false;
		return !publishedIdentities.has(catalogIdentity(item));
	});
	const stats = getKitabStats(items);

	return {
		curatedItems,
		items,
		stats: {
			totalItems: stats.publishedItems,
			featuredItems: stats.featuredItems,
			pdfItems: stats.pdfItems,
			driveItems: stats.driveItems
		}
	};
};
