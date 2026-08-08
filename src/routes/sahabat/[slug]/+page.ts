import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getSahabatBySlug, allSahabatDetailed } from '$lib/data/sahabat';

export const load: PageLoad = ({ params }) => {
	const record = getSahabatBySlug(params.slug);
	if (!record) throw error(404, 'Sahabat tidak ditemukan');
	return { sahabat: record, list: allSahabatDetailed };
};
