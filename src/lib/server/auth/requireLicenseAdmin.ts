import { error } from '@sveltejs/kit';
import { isSuperAdminUser } from '$lib/auth/session-user';

/**
 * Akses halaman lisensi produk digital.
 *
 * - SUPER_ADMIN  -> akses penuh, generate unlimited.
 * - admin        -> admin lembaga; boleh membuka generator dengan kuota bonus
 *                   1x gratis per produk (dicatat di admin_license_grants).
 * - lainnya      -> ditolak.
 */
export const requireLicenseAdmin = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(403, 'Silakan login terlebih dahulu.');
	}
	const isSuper = isSuperAdminUser(locals.user);
	const role = (locals.user.role ?? '').trim().toLowerCase();
	if (!isSuper && role !== 'admin') {
		throw error(403, 'Tidak memiliki akses ke lisensi produk.');
	}
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}
	return {
		user: locals.user,
		db: locals.db,
		isSuper
	};
};
