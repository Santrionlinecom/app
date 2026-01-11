import { fail } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user ?? null;
	const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'SUPER_ADMIN';
	return {
		notes: [],
		tasks: [],
		isAdmin: Boolean(isAdmin),
		currentUser
	};
};

export const actions: Actions = {
	addNote: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const db = locals.db!;
		const data = await request.formData();
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const eventDate = data.get('eventDate') as string;

		if (!title || !eventDate) {
			return fail(400, { error: 'Judul dan tanggal harus diisi' });
		}

		await db.prepare(`
			INSERT INTO calendar_notes (id, user_id, role, title, content, event_date, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			crypto.randomUUID(),
			user.id,
			user.role,
			title,
			content || '',
			eventDate,
			Date.now(),
			Date.now()
		).run();

		return { success: true };
	},

	updateNote: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;
		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const eventDate = data.get('eventDate') as string;

		if (!id || !title || !eventDate) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const isSuperAdmin = user.role === 'SUPER_ADMIN';
		const isAdmin = user.role === 'admin' || isSuperAdmin;
		const condition = isSuperAdmin
			? 'WHERE id = ?'
			: user.role === 'admin'
				? user.orgId
					? 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
					: 'WHERE id = ? AND user_id = ?'
				: 'WHERE id = ? AND user_id = ?';

		const params = isSuperAdmin
			? [title, content || '', eventDate, Date.now(), id]
			: user.role === 'admin'
				? user.orgId
					? [title, content || '', eventDate, Date.now(), id, user.orgId]
					: [title, content || '', eventDate, Date.now(), id, user.id]
				: [title, content || '', eventDate, Date.now(), id, user.id];

		await db.prepare(`
			UPDATE calendar_notes 
			SET title = ?, content = ?, event_date = ?, updated_at = ?
			${condition}
		`).bind(...params).run();

		return { success: true };
	},

	deleteNote: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;
		const data = await request.formData();
		const id = data.get('id') as string;

		const isSuperAdmin = user.role === 'SUPER_ADMIN';
		const condition = isSuperAdmin
			? 'WHERE id = ?'
			: user.role === 'admin'
				? user.orgId
					? 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
					: 'WHERE id = ? AND user_id = ?'
				: 'WHERE id = ? AND user_id = ?';

		const params = isSuperAdmin
			? [id]
			: user.role === 'admin'
				? user.orgId
					? [id, user.orgId]
					: [id, user.id]
				: [id, user.id];

		await db.prepare(`DELETE FROM calendar_notes ${condition}`).bind(...params).run();

		return { success: true };
	}
};
