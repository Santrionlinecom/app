import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';
import { getInstitutionComingSoonLoad } from '$lib/server/institution-guards';

export const load: PageServerLoad = async ({ locals }) => {
	getInstitutionComingSoonLoad('pondok');

	const db = locals.db;
	if (!db) {
		return { orgs: [] };
	}

	const orgs = await listOrganizations(db, { type: 'pondok', status: 'all' });
	return {
		orgs,
		title: 'Pondok Pesantren',
		subtitle: 'Daftar pondok pesantren yang sudah terverifikasi.',
		typePath: 'pondok'
	};
};
