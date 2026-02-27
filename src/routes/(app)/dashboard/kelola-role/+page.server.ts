import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { isSuperAdminRole, requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (!isSuperAdminRole(locals.user.role)) throw redirect(302, '/dashboard');

	const { db } = requireSuperAdmin(locals);
	const baseQuery = `
		SELECT id, username, email, role, gender, org_id as orgId, org_status as orgStatus, created_at 
		FROM users`;
	const { results } = await db.prepare(`${baseQuery} ORDER BY created_at DESC`).all();

	return { users: results || [] };
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		let db: NonNullable<App.Locals['db']>;
		let actor: NonNullable<App.Locals['user']>;
		try {
			const access = requireSuperAdmin(locals);
			db = access.db;
			actor = access.user;
		} catch {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newRole = data.get('newRole') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const validRoles = [
			'admin',
			'ustadz',
			'ustadzah',
			'santri',
			'alumni',
			'jamaah',
			'tamir',
			'bendahara',
			'SUPER_ADMIN'
		];
		const requestedRole =
			newRole.trim().replace(/-/g, '_').toUpperCase() === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : newRole;
		if (!validRoles.includes(requestedRole)) {
			return fail(400, { error: 'Role tidak valid' });
		}

		const { results } = await db
			.prepare('SELECT role, gender, org_id as orgId FROM users WHERE id = ?')
			.bind(userId)
			.all();
		const user = results?.[0] as any;
		
		if (!user) {
			return fail(404, { error: 'User tidak ditemukan' });
		}

		const normalizedRole =
			requestedRole === 'ustadz' || requestedRole === 'ustadzah'
				? user.gender === 'wanita'
					? 'ustadzah'
					: 'ustadz'
				: requestedRole;

		await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(normalizedRole, userId).run();

		await db.prepare(`
			INSERT INTO user_role_history (id, user_id, old_role, new_role, changed_by)
			VALUES (?, ?, ?, ?, ?)
		`).bind(
			crypto.randomUUID(),
			userId,
			user.role,
			normalizedRole,
			actor.id
		).run();

		return { success: true };
	}
};
