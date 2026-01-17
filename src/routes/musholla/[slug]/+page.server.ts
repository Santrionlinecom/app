import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationBySlug, listPublicOrgMembers } from '$lib/server/organizations';
import { getOrgFinanceSummary } from '$lib/server/ummah';
import { listOrgMedia } from '$lib/server/org-media';
import { listTarawihSchedule } from '$lib/server/tarawih';
import { listOrgAssets } from '$lib/server/org-assets';
import { listImamSchedule } from '$lib/server/jadwal-imam';
import { listKhotibSchedule } from '$lib/server/jadwal-khotib';

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
	const assets = await listOrgAssets(db, org.id);
	const finance = await getOrgFinanceSummary(db, org.id);
	const members = await listPublicOrgMembers(db, org.id);
	const tarawihSchedule = await listTarawihSchedule(db, org.id);
	const imamSchedule = await listImamSchedule(db, org.id);
	const khotibSchedule = await listKhotibSchedule(db, org.id);
	return {
		org,
		typePath: 'musholla',
		finance,
		media,
		members,
		tarawihSchedule,
		imamSchedule,
		khotibSchedule,
		assets
	};
};
