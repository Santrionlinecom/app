import { json, error } from '@sveltejs/kit';
import { generateId } from 'lucia';
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

const ensureCalendarTable = async (db: D1Database) => {
	await db.prepare(
		`CREATE TABLE IF NOT EXISTS calendar_notes (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id),
			role TEXT,
			title TEXT NOT NULL,
			content TEXT,
			event_date TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`
	).run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_calendar_notes_event_date ON calendar_notes(event_date)').run();
};

const fetchSchema = async (db: D1Database) => {
	const { results } = (await db.prepare(`PRAGMA table_info('calendar_notes')`).all()) ?? {};
	return (results ?? []) as { name: string; type: string }[];
};

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const { db, user } = requireUser(locals);
		const start = url.searchParams.get('start');
		const end = url.searchParams.get('end');

		if (!start || !end) {
			throw error(400, 'start dan end harus diisi (YYYY-MM-DD)');
		}

		await ensureCalendarTable(db);

		const { orgId, isSystemAdmin } = getOrgScope(user);
		const baseSelect = `SELECT cn.id,
					        cn.user_id as userId,
					        cn.role,
					        cn.title,
					        cn.content,
					        cn.event_date as eventDate,
					        cn.created_at as createdAt,
					        cn.updated_at as updatedAt
					   FROM calendar_notes cn`;
		const conditions = ['cn.event_date BETWEEN ? AND ?'];
		const params: (string | number)[] = [start, end];

		let query = `${baseSelect} WHERE ${conditions.join(' AND ')}`;
		if (user.role === 'admin') {
			if (!isSystemAdmin) {
				query = `${baseSelect} JOIN users u ON u.id = cn.user_id WHERE ${conditions.join(
					' AND '
				)} AND u.org_id = ?`;
				params.push(orgId ?? '');
			}
		} else {
			query = `${baseSelect} WHERE ${conditions.join(' AND ')} AND cn.user_id = ?`;
			params.push(user.id);
		}

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

		await ensureCalendarTable(db);
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

		return json({
			note: {
				id: insertedId,
				userId: user.id,
				role: user.role,
				title,
				content,
				eventDate,
				createdAt: now,
				updatedAt: now
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
