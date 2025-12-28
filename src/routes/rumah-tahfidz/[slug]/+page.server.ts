import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationBySlug, listPublicOrgMembers } from '$lib/server/organizations';
import { listOrgMedia } from '$lib/server/org-media';

export const ssr = true;
export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}
	const slug = params.slug;
	const org = await getOrganizationBySlug(db, slug, 'rumah-tahfidz');
	if (!org) {
		throw error(404, 'Rumah Tahfidz tidak ditemukan');
	}

	const media = await listOrgMedia(db, org.id);

	const members = await listPublicOrgMembers(db, org.id);

	return { org, typePath: 'rumah-tahfidz', media, members };
};
