import type { PageServerLoad } from './$types';
import { ensureKitabCatalogSchema, listPublishedKitabItems } from '$lib/server/kitab-catalog';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return {
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

	return {
		items,
		stats: {
			totalItems: items.length,
			featuredItems: items.filter((item) => item.featured).length,
			pdfItems: items.filter((item) => item.sourceType === 'pdf').length,
			driveItems: items.filter((item) => item.sourceType === 'drive').length
		}
	};
};
