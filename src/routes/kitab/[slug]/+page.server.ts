import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureKitabCatalogSchema, getKitabItemBySlug } from '$lib/server/kitab-catalog';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureKitabCatalogSchema(db);
	const item = await getKitabItemBySlug(db, params.slug, { publishedOnly: true });

	if (!item) {
		throw error(404, 'Kitab tidak ditemukan');
	}

	return {
		item
	};
};
