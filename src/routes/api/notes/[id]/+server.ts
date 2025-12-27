import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';
import { getOrgScope } from '$lib/server/organizations';

const requireUser = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'Database not available');
	}
	return { user: locals.user as NonNullable<App.Locals['user']>, db: locals.db! };
};

const canEdit = (user: NonNullable<App.Locals['user']>, ownerId: string) =>
	user.role === 'admin' || user.id === ownerId;

const fetchNote = async (db: D1Database, id: string) => {
	return (
		(await db
			.prepare(
				`SELECT id,
				        user_id as userId,
				        role,
				        title,
				        content,
				        event_date as eventDate,
				        created_at as createdAt,
				        updated_at as updatedAt
				   FROM calendar_notes
				  WHERE id = ?`
			)
			.bind(id)
			.first<{
				id: string;
				userId: string;
				role: string;
				title: string;
				content: string | null;
				eventDate: string;
				createdAt: number;
				updatedAt: number;
			}>()) ?? null
	);
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	try {
		const { user, db } = requireUser(locals);
		const note = await fetchNote(db, params.id);
		if (!note) throw error(404, 'Note tidak ditemukan');
		if (!canEdit(user, note.userId)) throw error(403, 'Tidak boleh mengedit');
		const { orgId, isSystemAdmin } = getOrgScope(user);
		if (user.role === 'admin' && !isSystemAdmin) {
			const ownerOrg = await db
				.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
				.bind(note.userId)
				.first<{ orgId: string | null }>();
			if (ownerOrg?.orgId && ownerOrg.orgId !== orgId) {
				throw error(403, 'Tidak boleh mengedit catatan lembaga lain');
			}
		}

		const body = await request.json().catch(() => ({}));
		const { title, content = '', eventDate } = body as {
			title?: string;
			content?: string;
			eventDate?: string;
		};

		if (!title || !eventDate) throw error(400, 'title dan eventDate wajib diisi');

		const now = Date.now();
		await db
			.prepare(
				`UPDATE calendar_notes
				    SET title = ?, content = ?, event_date = ?, updated_at = ?
				  WHERE id = ?`
			)
			.bind(title, content, eventDate, now, params.id)
			.run();

		return json({ note: { ...note, title, content, eventDate, updatedAt: now } });
	} catch (err: any) {
		const msg = typeof err?.message === 'string' && err.message.includes('calendar_notes')
			? 'Tabel calendar_notes belum ada. Jalankan /api/setup-db atau migrasi DB.'
			: err?.message || 'Gagal memperbarui catatan';
		console.error('PUT /api/notes/[id] error', err);
		return json({ error: msg }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		const { user, db } = requireUser(locals);
		const note = await fetchNote(db, params.id);
		if (!note) throw error(404, 'Note tidak ditemukan');
		if (!canEdit(user, note.userId)) throw error(403, 'Tidak boleh menghapus');
		const { orgId, isSystemAdmin } = getOrgScope(user);
		if (user.role === 'admin' && !isSystemAdmin) {
			const ownerOrg = await db
				.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
				.bind(note.userId)
				.first<{ orgId: string | null }>();
			if (ownerOrg?.orgId && ownerOrg.orgId !== orgId) {
				throw error(403, 'Tidak boleh menghapus catatan lembaga lain');
			}
		}

		await db.prepare('DELETE FROM calendar_notes WHERE id = ?').bind(params.id).run();

		return json({ ok: true });
	} catch (err: any) {
		const msg = typeof err?.message === 'string' && err.message.includes('calendar_notes')
			? 'Tabel calendar_notes belum ada. Jalankan /api/setup-db atau migrasi DB.'
			: err?.message || 'Gagal menghapus catatan';
		console.error('DELETE /api/notes/[id] error', err);
		return json({ error: msg }, { status: 500 });
	}
};
