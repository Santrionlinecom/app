import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isSuperAdminRole(locals.user.role)) {
		throw error(403, 'Tidak memiliki akses');
	}
	return {
		user: locals.user
	};
};
