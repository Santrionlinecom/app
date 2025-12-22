import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationBySlug } from '$lib/server/organizations';

export const ssr = true;
export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}
	const slug = params.slug;
	const org = await getOrganizationBySlug(db, slug, 'masjid');
	if (!org) {
		throw error(404, 'Masjid tidak ditemukan');
	}

	return { org, typePath: 'masjid' };
};
