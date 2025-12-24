import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	if (!db) {
		return { orgs: [] };
	}

	const orgs = await listOrganizations(db, { type: 'tpq', status: 'all' });
	return {
		orgs,
		title: 'TPQ',
		subtitle: 'Daftar TPQ yang sudah terverifikasi.',
		typePath: 'tpq'
	};
};
