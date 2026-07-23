import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperAdminUser } from '$lib/auth/session-user';

export const load: PageServerLoad = async ({ locals }) => {
	// Proteksi halaman memakai auth lama dari hooks.server.ts.
	// Ganti sumber locals.user di hooks jika nanti auth dipindah ke Supabase/Firebase.
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		throw redirect(302, '/login');
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email ?? 'super-admin@santrionline.local',
			role: 'super_admin'
		}
	};
};
