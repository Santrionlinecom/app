import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadCuratedKitabContext } from '$lib/server/curated-kitab';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	const { item, curatedItem, curatedSeries } = await loadCuratedKitabContext(params.slug, db);

	let adaVersiBaca = false;
	try {
		const bucket = platform?.env?.BUCKET;
		if (bucket) {
			const head = await bucket.head(`kitab-markdown/${params.slug}.md`);
			adaVersiBaca = Boolean(head);
		}
	} catch {
		// versi baca opsional
	}

	if (curatedItem) {
		return { item, curatedItem, curatedSeries, adaVersiBaca };
	}

	if (item) {
		return {
			item,
			curatedItem: null,
			curatedSeries: [],
			adaVersiBaca
		};
	}

	throw error(404, 'Kitab tidak ditemukan');
};
