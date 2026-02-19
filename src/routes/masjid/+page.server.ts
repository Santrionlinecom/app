import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';
import { getInstitutionComingSoonLoad } from '$lib/server/institution-guards';

export const load: PageServerLoad = async ({ locals }) => {
	getInstitutionComingSoonLoad('masjid');

	const db = locals.db;
	if (!db) {
		return { orgs: [] };
	}

	const orgs = await listOrganizations(db, { type: 'masjid', status: 'all' });
	return {
		orgs,
		title: 'Masjid',
		subtitle: 'Daftar masjid yang sudah terverifikasi.',
		typePath: 'masjid'
	};
};
