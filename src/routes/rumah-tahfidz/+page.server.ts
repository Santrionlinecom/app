import type { PageServerLoad } from './$types';
import { listOrganizations } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	if (!db) {
		return { orgs: [] };
	}

	const orgs = await listOrganizations(db, { type: 'rumah-tahfidz', status: 'all' });
	return {
		orgs,
		title: 'Rumah Tahfidz',
		subtitle: 'Daftar Rumah Tahfidz yang sudah terverifikasi.',
		typePath: 'rumah-tahfidz'
	};
};
