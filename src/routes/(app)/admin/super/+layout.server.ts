import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperAdminUser, isImpersonatingUser } from '$lib/auth/session-user';
import { clearImpersonatedOrgId } from '$lib/server/auth/impersonation';
import { ACTIVE_ORG_COOKIE } from '$lib/server/active-org';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isSuperAdminUser(locals.user)) {
		throw error(403, 'Tidak memiliki akses');
	}

	// Panel super admin selalu berjalan dalam identitas asli. Cookie sisa dari
	// sesi lama (mode impersonate atau lembaga-aktif) dibersihkan di server
	// supaya pengguna tidak perlu menghapus cache/cookies manual, lalu halaman
	// dimuat ulang agar seluruh request ter-resolve sebagai SUPER_ADMIN murni.
	// Tanpa ini, layout menganggap pengguna admin lembaga sementara halaman
	// menuntut super admin — kombinasi yang berakhir error 500 "Halaman belum siap".
	const hasStaleActiveOrg = Boolean(cookies.get(ACTIVE_ORG_COOKIE));
	if (isImpersonatingUser(locals.user) || hasStaleActiveOrg) {
		clearImpersonatedOrgId(cookies);
		cookies.delete(ACTIVE_ORG_COOKIE, { path: '/' });
		throw redirect(302, url.pathname + url.search);
	}

	return {
		user: locals.user
	};
};
