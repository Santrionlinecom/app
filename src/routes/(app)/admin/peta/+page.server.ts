import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { getLembagaMapData } from '$lib/server/lembaga-map';

export const load: PageServerLoad = async ({ locals }) => {
	const { db } = requireSuperAdmin(locals);
	return getLembagaMapData(db);
};
