import type { PageServerLoad } from './$types';
import { getKitabCategoryMeta } from '$lib/data/kitab-categories';
import { ensureKitabCatalogSchema, listPublishedKitabItems } from '$lib/server/kitab-catalog';
import { featuredCuratedKitab } from '$lib/data/kitab-curated';
import { getKitabStats } from '$lib/kitab';

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
	const items = await listPublishedKitabItems(db);
	const publishedBySlug = new Map(items.map((item) => [item.slug, item]));
	const curatedItems = featuredCuratedKitab.map((item) => {
		const mirrored = publishedBySlug.get(item.slug);
		if (!mirrored) return item;
		return {
			...item,
			category: getKitabCategoryMeta(mirrored.category)?.value ?? item.category,
			sourceType: mirrored.sourceType,
			sourceUrl: mirrored.sourceUrl || item.sourceUrl,
			updatedAt: mirrored.updatedAt || item.updatedAt
		};
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
