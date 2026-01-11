import { json, error } from '@sveltejs/kit';
import { generateId } from 'lucia';
import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';
import { getOrgScope } from '$lib/server/organizations';
import { assertLoggedIn } from '$lib/server/auth/rbac';

const requireDb = (locals: App.Locals) => {
	if (!locals.db) {
		throw error(500, 'Database not available');
	}
	return locals.db!;
};

const requireUser = (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	return { user: user as NonNullable<App.Locals['user']>, db: requireDb(locals) };
};

const fetchSchema = async (db: D1Database) => {
	const { results } = (await db.prepare(`PRAGMA table_info('calendar_notes')`).all()) ?? {};
	return (results ?? []) as { name: string; type: string }[];
};

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const start = url.searchParams.get('start');
		const end = url.searchParams.get('end');

		if (!start || !end) {
			throw error(400, 'start dan end harus diisi (YYYY-MM-DD)');
		}
		if (!locals.db) {
			return json({ notes: [] });
		}
		const db = locals.db!;
		const user = locals.user;
		if (!user) {
			return json({ notes: [] });
		}
		const { isSystemAdmin } = getOrgScope(user);
		const isAdmin = user.role === 'admin' || user.role === 'SUPER_ADMIN';
		const orgId = user.orgId ?? null;

		const baseSelect = `SELECT cn.id,
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
					   LEFT JOIN organizations o ON o.id = u.org_id`;
		const conditions = ['cn.event_date BETWEEN ? AND ?'];
		const params: (string | number)[] = [start, end];
		if (!isSystemAdmin) {
			if (isAdmin && orgId) {
				conditions.push('u.org_id = ?');
				params.push(orgId);
			} else {
				conditions.push('cn.user_id = ?');
				params.push(user.id);
			}
		}

		const query = `${baseSelect} WHERE ${conditions.join(' AND ')}`;

		const { results } = (await db.prepare(`${query} ORDER BY cn.event_date ASC, cn.created_at ASC`).bind(...params).all()) ?? {};

		return json({ notes: results ?? [] });
	} catch (err) {
		console.error('GET /api/notes error', err);
		return json({ error: 'Internal Error: pastikan tabel calendar_notes sudah ada (jalankan /api/setup-db).' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		const { db, user } = requireUser(locals);
		const body = await request.json().catch(() => ({}));
		const { title, content = '', eventDate } = body as {
			title?: string;
			content?: string;
			eventDate?: string;
		};

		if (!title || !eventDate) {
			throw error(400, 'title dan eventDate wajib diisi');
		}

		const schema = await fetchSchema(db);
		const idColumn = schema.find((c) => c.name === 'id');
		const idIsInt = idColumn?.type?.toLowerCase().includes('int');

		const id = generateId(15);
		const now = Date.now();

		let insertedId = id;
		if (idIsInt) {
			const res = await db
				.prepare(
					`INSERT INTO calendar_notes (user_id, role, title, content, event_date, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(user.id, user.role, title, content, eventDate, now, now)
				.run();
			// D1 run meta has last_row_id
			insertedId = String((res as any)?.meta?.last_row_id ?? id);
		} else {
			await db
				.prepare(
					`INSERT INTO calendar_notes (id, user_id, role, title, content, event_date, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(id, user.id, user.role, title, content, eventDate, now, now)
				.run();
		}

		const orgMeta = user.orgId
			? await db
					.prepare('SELECT name as orgName, slug as orgSlug, type as orgType FROM organizations WHERE id = ?')
					.bind(user.orgId)
					.first<{ orgName: string | null; orgSlug: string | null; orgType: string | null }>()
			: null;

		return json({
			note: {
				id: insertedId,
				userId: user.id,
				role: user.role,
				title,
				content,
				eventDate,
				createdAt: now,
				updatedAt: now,
				orgId: user.orgId ?? null,
				orgName: orgMeta?.orgName ?? null,
				orgSlug: orgMeta?.orgSlug ?? null,
				orgType: orgMeta?.orgType ?? null
			}
		});
	} catch (err: any) {
		console.error('POST /api/notes error', err);
		const msg =
			typeof err?.message === 'string' && err.message.includes('datatype mismatch')
				? 'Tipe kolom tidak sesuai. Coba hapus tabel calendar_notes lama agar recreate otomatis.'
				: typeof err?.message === 'string'
					? err.message
					: 'Gagal menyimpan catatan';
		return json({ error: msg }, { status: 500 });
	}
};
