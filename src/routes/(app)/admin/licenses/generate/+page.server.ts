import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	requireSuperAdmin(locals);
	return {};
};
