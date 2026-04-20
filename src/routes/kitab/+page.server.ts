import type { PageServerLoad } from './$types';
import { ensureKitabCatalogSchema, listPublishedKitabItems } from '$lib/server/kitab-catalog';
import { featuredCuratedKitab } from '$lib/data/kitab-curated';

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
	const curatedSlugs = new Set(featuredCuratedKitab.map((item) => item.slug));
	const curatedItems = featuredCuratedKitab.map((item) => {
		const mirrored = publishedBySlug.get(item.slug);
		if (!mirrored) return item;
		return {
			...item,
			sourceType: mirrored.sourceType,
			sourceUrl: mirrored.sourceUrl || item.sourceUrl,
			updatedAt: mirrored.updatedAt || item.updatedAt
		};
	});
	const publicItems = items.filter((item) => !curatedSlugs.has(item.slug));

	return {
		curatedItems,
		items: publicItems,
		stats: {
			totalItems: items.length,
			featuredItems: items.filter((item) => item.featured).length,
			pdfItems: items.filter((item) => item.sourceType === 'pdf').length,
			driveItems: items.filter((item) => item.sourceType === 'drive').length
		}
	};
};
