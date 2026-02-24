import { error } from '@sveltejs/kit';

export const isSuperAdminRole = (role?: string | null) =>
	role === 'SUPER_ADMIN' || role === 'super_admin';

export const requireSuperAdmin = (locals: App.Locals) => {
	if (!locals.user || !isSuperAdminRole(locals.user.role)) {
		throw error(403, 'Tidak memiliki akses super admin');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	return {
		user: locals.user,
		db: locals.db
	};
};
