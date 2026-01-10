import { json, error } from '@sveltejs/kit';
import { updateUserRole } from '$lib/server/progress';
import { isSystemAdmin, type OrgRole } from '$lib/server/auth/rbac';
import type { RequestHandler } from './$types';

const allowedRoles: OrgRole[] = [
	'admin',
	'ustadz',
	'ustadzah',
	'santri',
	'alumni',
	'jamaah',
	'tamir',
	'bendahara'
];

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	const currentRole = locals.user.role ?? '';
	if (currentRole !== 'admin' && !isSystemAdmin(currentRole)) {
		throw error(403, 'Forbidden');
	}
	const systemAdmin = isSystemAdmin(currentRole);
	const body = await request.json().catch(() => ({}));
	const { action, userId, role: nextRole } = body as { action?: string; userId?: string; role?: string };
	if (!userId) throw error(400, 'userId wajib diisi');
	if (!systemAdmin) {
		if (!locals.user.orgId) {
			throw error(403, 'Akun belum terhubung ke lembaga.');
		}
		const target = await locals.db!
			.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
			.bind(userId)
			.first<{ orgId: string | null }>();
		if (target?.orgId && target.orgId !== locals.user.orgId) {
			throw error(403, 'Tidak boleh mengubah user lembaga lain');
		}
	}

	if (action === 'delete') {
		if (userId === locals.user.id) throw error(400, 'Tidak boleh hapus akun sendiri');
		// bersihkan hafalan terkait
		await locals.db!.prepare('DELETE FROM hafalan_progress WHERE user_id = ?').bind(userId).run();
		await locals.db!.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
		await locals.db!.prepare('DELETE FROM google_accounts WHERE user_id = ?').bind(userId).run();
		await locals.db!.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
		return json({ ok: true });
	}

	if (action === 'role') {
		if (!nextRole || !allowedRoles.includes(nextRole as OrgRole)) {
			throw error(400, 'Role tidak valid');
		}
		if (userId === locals.user.id && nextRole !== 'admin') {
			throw error(400, 'Tidak boleh menurunkan peran admin sendiri');
		}
		await updateUserRole(locals.db!, { id: userId, role: nextRole });
		return json({ ok: true });
	}

	throw error(400, 'Action tidak dikenal');
};
