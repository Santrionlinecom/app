import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (locals.user.role !== 'admin') throw redirect(302, '/dashboard');

	const { results } = await locals.db.prepare(`
		SELECT id, username, email, role, gender, created_at 
		FROM users 
		ORDER BY created_at DESC
	`).all();

	return { users: results || [] };
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newRole = data.get('newRole') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const validRoles = ['admin', 'ustadz', 'ustadzah', 'santri', 'alumni'];
		if (!validRoles.includes(newRole)) {
			return fail(400, { error: 'Role tidak valid' });
		}

		const { results } = await locals.db.prepare('SELECT role, gender FROM users WHERE id = ?').bind(userId).all();
		const user = results?.[0] as any;
		
		if (!user) {
			return fail(404, { error: 'User tidak ditemukan' });
		}

		const normalizedRole =
			newRole === 'ustadz' || newRole === 'ustadzah'
				? user.gender === 'wanita'
					? 'ustadzah'
					: 'ustadz'
				: newRole;

		await locals.db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(normalizedRole, userId).run();

		await locals.db.prepare(`
			INSERT INTO user_role_history (id, user_id, old_role, new_role, changed_by)
			VALUES (?, ?, ?, ?, ?)
		`).bind(
			crypto.randomUUID(),
			userId,
			user.role,
			normalizedRole,
			locals.user.id
		).run();

		return { success: true };
	}
};
