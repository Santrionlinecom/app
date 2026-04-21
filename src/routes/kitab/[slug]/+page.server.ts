import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadCuratedKitabContext } from '$lib/server/curated-kitab';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	const { item, curatedItem, curatedSeries } = await loadCuratedKitabContext(params.slug, db);

	if (curatedItem) {
		return { item, curatedItem, curatedSeries };
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
