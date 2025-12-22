import { json, error } from '@sveltejs/kit';
import { updateUserRole } from '$lib/server/progress';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}
	const isSystemAdmin = locals.user.role === 'admin' && !locals.user.orgId;
	const body = await request.json().catch(() => ({}));
	const { action, userId, role } = body as { action?: string; userId?: string; role?: string };
	if (!userId) throw error(400, 'userId wajib diisi');
	if (!isSystemAdmin) {
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
		if (!role || !['admin', 'ustadz', 'ustadzah', 'santri', 'alumni', 'jamaah', 'tamir', 'bendahara'].includes(role)) {
			throw error(400, 'Role tidak valid');
		}
		if (userId === locals.user.id && role !== 'admin') {
			throw error(400, 'Tidak boleh menurunkan peran admin sendiri');
		}
		await updateUserRole(locals.db!, { id: userId, role });
		return json({ ok: true });
	}

	throw error(400, 'Action tidak dikenal');
};
