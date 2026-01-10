import { fail } from '@sveltejs/kit';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = assertLoggedIn({ locals });
	if (!locals.db) {
		return {
			notes: [],
			tasks: [],
			isAdmin: false,
			currentUser
		};
	}
	const orgId = assertOrgMember(currentUser);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		return {
			notes: [],
			tasks: [],
			isAdmin: false,
			currentUser
		};
	}
	assertFeature(org.type, currentUser.role, 'kalender');

	const isAdmin = currentUser.role === 'admin' || currentUser.role === 'SUPER_ADMIN';
	const { isSystemAdmin } = getOrgScope(currentUser);
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
		: await db.prepare(query).bind(currentUser.id).all();

	return {
		notes: results || [],
		tasks: [],
		isAdmin,
		currentUser
	};
};

export const actions: Actions = {
	addNote: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const orgId = assertOrgMember(user);
		const org = await getOrganizationById(locals.db, orgId);
		if (!org) return fail(404, { error: 'Lembaga tidak ditemukan' });
		assertFeature(org.type, user.role, 'kalender');

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
		const orgId = assertOrgMember(user);
		const org = await getOrganizationById(db, orgId);
		if (!org) return fail(404, { error: 'Lembaga tidak ditemukan' });
		assertFeature(org.type, user.role, 'kalender');
		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const eventDate = data.get('eventDate') as string;

		if (!id || !title || !eventDate) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const { isSystemAdmin } = getOrgScope(user);
		// Pastikan user hanya bisa update miliknya sendiri (kecuali admin)
		const condition = user.role === 'admin' || user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? 'WHERE id = ?'
				: 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
			: 'WHERE id = ? AND user_id = ?';

		const params = user.role === 'admin' || user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? [title, content || '', eventDate, Date.now(), id]
				: [title, content || '', eventDate, Date.now(), id, orgId]
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
		const orgId = assertOrgMember(user);
		const org = await getOrganizationById(db, orgId);
		if (!org) return fail(404, { error: 'Lembaga tidak ditemukan' });
		assertFeature(org.type, user.role, 'kalender');
		const data = await request.formData();
		const id = data.get('id') as string;

		const { isSystemAdmin } = getOrgScope(user);
		const condition = user.role === 'admin' || user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? 'WHERE id = ?'
				: 'WHERE id = ? AND user_id IN (SELECT id FROM users WHERE org_id = ?)'
			: 'WHERE id = ? AND user_id = ?';

		const params = user.role === 'admin' || user.role === 'SUPER_ADMIN'
			? isSystemAdmin
				? [id]
				: [id, orgId]
			: [id, user.id];

		await db.prepare(`DELETE FROM calendar_notes ${condition}`).bind(...params).run();

		return { success: true };
	}
};
