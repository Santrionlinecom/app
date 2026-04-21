import type { D1Database } from '@cloudflare/workers-types';
import { getKitabCategoryMeta } from '$lib/data/kitab-categories';
import type { CuratedKitabMaterial } from '$lib/data/kitab-curated';
import { getCuratedKitabBySlug, getCuratedKitabSeries } from '$lib/data/kitab-curated';
import {
	ensureKitabCatalogSchema,
	getKitabItemBySlug,
	type KitabListItem
} from '$lib/server/kitab-catalog';

const mergeCuratedWithCatalog = (
	curated: CuratedKitabMaterial,
	catalogItem?: KitabListItem | null
): CuratedKitabMaterial => {
	if (!catalogItem) return curated;
	return {
		...curated,
		category: getKitabCategoryMeta(catalogItem.category)?.value ?? curated.category,
		sourceType: catalogItem.sourceType,
		sourceUrl: catalogItem.sourceUrl || curated.sourceUrl,
		updatedAt: catalogItem.updatedAt || curated.updatedAt
	};
};

export const loadCuratedKitabContext = async (
	slug: string,
	db?: D1Database | null
) => {
	let item: KitabListItem | null = null;

	if (db) {
		await ensureKitabCatalogSchema(db);
		item = await getKitabItemBySlug(db, slug, { publishedOnly: true });
	}

	const curatedItem = getCuratedKitabBySlug(slug);

	if (!curatedItem) {
		return {
			item,
			curatedItem: null,
			curatedSeries: []
		};
	}

	const baseSeries = getCuratedKitabSeries(curatedItem.seriesKey);
	const curatedSeries = db
		? await Promise.all(
				baseSeries.map(async (seriesItem) =>
					mergeCuratedWithCatalog(
						seriesItem,
						await getKitabItemBySlug(db, seriesItem.slug, { publishedOnly: true })
					)
				)
			)
		: baseSeries;

	return {
		item,
		curatedItem: mergeCuratedWithCatalog(curatedItem, item),
		curatedSeries
	};
};
