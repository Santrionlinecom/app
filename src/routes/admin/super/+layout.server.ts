import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	return {
		user: locals.user
	};
};
