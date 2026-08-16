import { json, error, isHttpError, isRedirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';
import { getOrgScope } from '$lib/server/organizations';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';

const requireUser = (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}
	return { user: user as NonNullable<App.Locals['user']>, db: locals.db! };
};

const canEdit = (user: NonNullable<App.Locals['user']>, ownerId: string) =>
	user.role === 'admin' || isSuperAdminRole(user.role) || user.id === ownerId;

const fetchNote = async (db: D1Database, id: string) => {
	return (
		(await db
			.prepare(
				`SELECT cn.id,
				        cn.user_id as userId,
				        cn.role,
				        cn.title,
				        cn.content,
				        cn.event_date as eventDate,
				        cn.created_at as createdAt,
				        cn.updated_at as updatedAt,
				        u.org_id as orgId,
				        o.name as orgName,
				        o.slug as orgSlug,
				        o.type as orgType
				   FROM calendar_notes cn
				   LEFT JOIN users u ON u.id = cn.user_id
				   LEFT JOIN organizations o ON o.id = u.org_id
				  WHERE cn.id = ?`
			)
			.bind(id)
			.first<{
				id: string;
				userId: string;
				role: string | null;
				title: string;
				content: string | null;
				eventDate: string;
				createdAt: number;
				updatedAt: number;
				orgId: string | null;
				orgName: string | null;
				orgSlug: string | null;
				orgType: string | null;
			}>()) ?? null
	);
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	try {
		const { user, db } = requireUser(locals);
		const note = await fetchNote(db, params.id);
		if (!note) throw error(404, 'Note tidak ditemukan');
		if (!canEdit(user, note.userId)) throw error(403, 'Tidak boleh mengedit');
		const { isSystemAdmin } = getOrgScope(user);
		if (user.role === 'admin' && !isSystemAdmin) {
			if (!user.orgId && note.userId !== user.id) {
				throw error(403, 'Tidak boleh mengedit catatan lembaga lain');
			}
			const ownerOrg = await db
				.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
				.bind(note.userId)
				.first<{ orgId: string | null }>();
			if (ownerOrg?.orgId && ownerOrg.orgId !== user.orgId) {
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
		// assertLoggedIn() melempar redirect, bukan HttpError. Untuk endpoint
		// API, pengalihan tidak berguna — klien butuh 401 yang bisa ditangani.
		if (isRedirect(err)) {
			return json({ error: 'Sesi berakhir. Silakan masuk kembali.' }, { status: 401 });
		}
		// 404 (catatan tidak ada) dan 403 (bukan pemilik) harus sampai ke
		// pengguna dengan status aslinya, bukan berubah menjadi 500.
		if (isHttpError(err)) {
			return json({ error: err.body?.message ?? 'Permintaan tidak valid' }, { status: err.status });
		}
		console.error('PUT /api/notes/[id] error', err);
		return json(
			{ error: 'Layanan catatan kalender belum siap. Hubungi super admin.' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		const { user, db } = requireUser(locals);
		const note = await fetchNote(db, params.id);
		if (!note) throw error(404, 'Note tidak ditemukan');
		if (!canEdit(user, note.userId)) throw error(403, 'Tidak boleh menghapus');
		const { isSystemAdmin } = getOrgScope(user);
		if (user.role === 'admin' && !isSystemAdmin) {
			if (!user.orgId && note.userId !== user.id) {
				throw error(403, 'Tidak boleh menghapus catatan lembaga lain');
			}
			const ownerOrg = await db
				.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
				.bind(note.userId)
				.first<{ orgId: string | null }>();
			if (ownerOrg?.orgId && ownerOrg.orgId !== user.orgId) {
				throw error(403, 'Tidak boleh menghapus catatan lembaga lain');
			}
		}

		await db.prepare('DELETE FROM calendar_notes WHERE id = ?').bind(params.id).run();

		return json({ ok: true });
	} catch (err: any) {
		if (isRedirect(err)) {
			return json({ error: 'Sesi berakhir. Silakan masuk kembali.' }, { status: 401 });
		}
		if (isHttpError(err)) {
			return json({ error: err.body?.message ?? 'Permintaan tidak valid' }, { status: err.status });
		}
		console.error('DELETE /api/notes/[id] error', err);
		return json(
			{ error: 'Layanan catatan kalender belum siap. Hubungi super admin.' },
			{ status: 500 }
		);
	}
};
