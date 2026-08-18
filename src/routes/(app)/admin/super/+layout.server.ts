import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperAdminUser, isImpersonatingUser } from '$lib/auth/session-user';
import { clearImpersonatedOrgId } from '$lib/server/auth/impersonation';
import { clearActiveOrgCookie } from '$lib/server/active-org';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isSuperAdminUser(locals.user)) {
		throw error(403, 'Tidak memiliki akses');
	}

	// Panel super admin selalu berjalan dalam identitas asli. Cookie impersonate
	// dan sisa pilihan lembaga dibersihkan dengan atribut yang sama saat disetel,
	// supaya browser benar-benar menghapusnya.
	// Cookie so_lembaga_aktif saja TIDAK boleh memicu redirect: Super Admin
	// sudah diabaikan di hooks, dan delete yang gagal sebelumnya membuat
	// /admin/super/overview berputar sampai error 500 "Halaman belum siap".
	const impersonating = isImpersonatingUser(locals.user);
	const alreadyReset = url.searchParams.get('so_reset') === '1';
	clearImpersonatedOrgId(cookies);
	clearActiveOrgCookie(cookies);

	if (impersonating && !alreadyReset) {
		const next = new URL(url);
		next.searchParams.set('so_reset', '1');
		throw redirect(302, `${next.pathname}${next.search}`);
	}

	return {
		user: locals.user
	};
};
