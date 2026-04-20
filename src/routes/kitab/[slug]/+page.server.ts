import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureKitabCatalogSchema, getKitabItemBySlug } from '$lib/server/kitab-catalog';
import type { CuratedKitabMaterial } from '$lib/data/kitab-curated';
import { getCuratedKitabBySlug, getCuratedKitabSeries } from '$lib/data/kitab-curated';

const mergeCuratedWithCatalog = (
	curated: CuratedKitabMaterial,
	catalogItem?: Awaited<ReturnType<typeof getKitabItemBySlug>> | null
): CuratedKitabMaterial => {
	if (!catalogItem) return curated;
	return {
		...curated,
		sourceType: catalogItem.sourceType,
		sourceUrl: catalogItem.sourceUrl || curated.sourceUrl,
		updatedAt: catalogItem.updatedAt || curated.updatedAt
	};
};

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	let item = null;

	if (db) {
		await ensureKitabCatalogSchema(db);
		item = await getKitabItemBySlug(db, params.slug, { publishedOnly: true });
	}

	const curatedItem = getCuratedKitabBySlug(params.slug);

	if (curatedItem) {
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
	}

	if (item) {
		return {
			item,
			curatedItem: null,
			curatedSeries: []
		};
	}

	throw error(404, 'Kitab tidak ditemukan');
};
