import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCuratedKitabChaptersForModule,
	getCuratedKitabModuleIndex
} from '$lib/data/kitab-curated';
import { loadCuratedKitabContext } from '$lib/server/curated-kitab';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	const { item, curatedItem, curatedSeries } = await loadCuratedKitabContext(params.slug, db);

	if (!curatedItem) {
		throw error(404, 'Bab pembelajaran hanya tersedia untuk seri kitab kurasi');
	}

	const moduleIndex = getCuratedKitabModuleIndex(curatedItem, params.module);
	if (moduleIndex < 0) {
		throw error(404, 'Bab tidak ditemukan');
	}

	const moduleItem = curatedItem.modules[moduleIndex];

	return {
		item,
		curatedItem,
		curatedSeries,
		moduleItem,
		moduleIndex,
		moduleNumber: moduleIndex + 1,
		relatedChapters: getCuratedKitabChaptersForModule(curatedItem, moduleIndex),
		previousModule: moduleIndex > 0 ? curatedItem.modules[moduleIndex - 1] : null,
		nextModule:
			moduleIndex < curatedItem.modules.length - 1
				? curatedItem.modules[moduleIndex + 1]
				: null
	};
};
