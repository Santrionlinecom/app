import { redirect, fail } from '@sveltejs/kit';
import { ensureCalendarTable } from '$lib/server/calendar';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (!locals.db) throw redirect(302, '/auth');

	const isAdmin = locals.user.role === 'admin';
	const db = locals.db;

	await ensureCalendarTable(db);

	// Admin melihat semua, user lain hanya miliknya
	const query = isAdmin
		? 'SELECT * FROM calendar_notes ORDER BY event_date DESC'
		: 'SELECT * FROM calendar_notes WHERE user_id = ? ORDER BY event_date DESC';

	const { results } = isAdmin
		? await db.prepare(query).all()
		: await db.prepare(query).bind(locals.user.id).all();

	return {
		notes: results || [],
		tasks: [],
		isAdmin,
		currentUser: locals.user
	};
};

export const actions: Actions = {
	addNote: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const db = locals.db;
		await ensureCalendarTable(db);

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
		const db = locals.db;
		await ensureCalendarTable(db);

		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const eventDate = data.get('eventDate') as string;

		if (!id || !title || !eventDate) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		// Pastikan user hanya bisa update miliknya sendiri (kecuali admin)
		const condition = locals.user.role === 'admin'
			? 'WHERE id = ?'
			: 'WHERE id = ? AND user_id = ?';

		const params = locals.user.role === 'admin'
			? [title, content || '', eventDate, Date.now(), id]
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
		const db = locals.db;
		await ensureCalendarTable(db);

		const data = await request.formData();
		const id = data.get('id') as string;

		const condition = locals.user.role === 'admin'
			? 'WHERE id = ?'
			: 'WHERE id = ? AND user_id = ?';

		const params = locals.user.role === 'admin'
			? [id]
			: [id, locals.user.id];

		await db.prepare(`DELETE FROM calendar_notes ${condition}`).bind(...params).run();

		return { success: true };
	}
};
