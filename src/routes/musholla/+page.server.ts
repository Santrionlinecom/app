import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
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
