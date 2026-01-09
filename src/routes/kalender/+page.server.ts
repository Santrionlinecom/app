import { fail } from '@sveltejs/kit';
import { getOrgScope } from '$lib/server/organizations';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user ?? null;
	if (!locals.db || !currentUser) {
		return {
			notes: [],
			tasks: [],
			isAdmin: false,
			currentUser
		};
	}

	const isAdmin = currentUser.role === 'admin' || currentUser.role === 'SUPER_ADMIN';
	const { orgId, isSystemAdmin } = getOrgScope(currentUser);
	const db = locals.db!;

	// Admin melihat semua, user lain hanya miliknya
	const query = isAdmin
		? isSystemAdmin
			? 'SELECT * FROM calendar_notes ORDER BY event_date DESC'
			: `SELECT cn.* FROM calendar_notes cn JOIN users u ON u.id = cn.user_id WHERE u.org_id = ? ORDER BY cn.event_date DESC`
		: 'SELECT * FROM calendar_notes WHERE user_id = ? ORDER BY event_date DESC';

	const { results } = isAdmin
		? isSystemAdmin
			? await db.prepare(query).all()
			: await db.prepare(query).bind(orgId).all()
		: await db.prepare(query).bind(locals.user.id).all();

	return {
		notes: results || [],
		tasks: [],
		isAdmin,
		currentUser
	};
};

export const actions: Actions = {
	addNote: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
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
			locals.user.id,
			locals.user.role,
			title,
			content || '',
			eventDate,
			Date.now(),
			Date.now()
		).run();

		return { success: true };
	},

	updateNote: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
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

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		// Pastikan user hanya bisa update miliknya sendiri (kecuali admin)
		const condition = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? 'WHERE id = ?'
				: 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
			: 'WHERE id = ? AND user_id = ?';

		const params = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? [title, content || '', eventDate, Date.now(), id]
				: [title, content || '', eventDate, Date.now(), id, orgId]
			: [title, content || '', eventDate, Date.now(), id, locals.user.id];

		await db.prepare(`
			UPDATE calendar_notes 
			SET title = ?, content = ?, event_date = ?, updated_at = ?
			${condition}
		`).bind(...params).run();

		return { success: true };
	},

	deleteNote: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;
		const data = await request.formData();
		const id = data.get('id') as string;

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		const condition = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? 'WHERE id = ?'
				: 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
			: 'WHERE id = ? AND user_id = ?';

		const params = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? [id]
				: [id, orgId]
			: [id, locals.user.id];

		await db.prepare(`DELETE FROM calendar_notes ${condition}`).bind(...params).run();

		return { success: true };
	}
};
