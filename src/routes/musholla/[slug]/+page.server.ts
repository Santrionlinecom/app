import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationBySlug, listPublicOrgMembers } from '$lib/server/organizations';
import { getOrgFinanceSummary } from '$lib/server/ummah';
import { listOrgMedia } from '$lib/server/org-media';
import { listTarawihSchedule } from '$lib/server/tarawih';

export const ssr = true;
export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}
	const slug = params.slug;
	const org = await getOrganizationBySlug(db, slug, 'musholla');
	if (!org) {
		throw error(404, 'Musholla tidak ditemukan');
	}

	const media = await listOrgMedia(db, org.id);
	const finance = await getOrgFinanceSummary(db, org.id);
	const members = await listPublicOrgMembers(db, org.id);
	const tarawihSchedule = await listTarawihSchedule(db, org.id);
	return { org, typePath: 'musholla', finance, media, members, tarawihSchedule };
};
