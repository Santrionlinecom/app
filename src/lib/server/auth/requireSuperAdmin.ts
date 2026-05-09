import { error } from '@sveltejs/kit';
import { isSuperAdminUser } from '$lib/auth/session-user';

const normalizeSystemRole = (role?: string | null) =>
	role?.trim().replace(/-/g, '_').toUpperCase();

export const isSuperAdminRole = (role?: string | null) =>
	normalizeSystemRole(role) === 'SUPER_ADMIN';

export const requireSuperAdmin = (locals: App.Locals) => {
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		throw error(403, 'Tidak memiliki akses super admin');
	}
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}
	return {
		user: locals.user,
		db: locals.db
	};
};
