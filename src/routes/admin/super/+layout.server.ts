import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperAdminUser } from '$lib/auth/session-user';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isSuperAdminUser(locals.user)) {
		throw error(403, 'Tidak memiliki akses');
	}
	return {
		user: locals.user
	};
};
