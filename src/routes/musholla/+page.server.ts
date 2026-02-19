import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';
import { getInstitutionComingSoonLoad } from '$lib/server/institution-guards';

export const load: PageServerLoad = async ({ locals }) => {
	getInstitutionComingSoonLoad('musholla');

	const db = locals.db;
	if (!db) {
		return { orgs: [] };
	}

	const orgs = await listOrganizations(db, { type: 'musholla', status: 'all' });
	return {
		orgs,
		title: 'Musholla',
		subtitle: 'Daftar musholla yang sudah terverifikasi.',
		typePath: 'musholla'
	};
};
