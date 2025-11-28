import { json, error } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from 'oslo/password';
import type { RequestHandler } from './$types';

const allowedRoles = ['santri', 'ustadz', 'ustadzah', 'admin'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	ensureAuth(locals);
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');
	const rows =
		(await db
			.prepare(
				"SELECT id, username, email, role, created_at as createdAt FROM users WHERE role IN ('santri','ustadz') ORDER BY created_at DESC"
			)
			.all<{ id: string; username: string | null; email: string; role: string; createdAt: number }>()) ?? [];

	return json({ santri: rows });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	ensureAuth(locals);
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');
	const body = await request.json().catch(() => ({}));

	const username = typeof body.username === 'string' ? body.username.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	const role = typeof body.role === 'string' && allowedRoles.includes(body.role) ? body.role : 'santri';

	if (!email || !password) {
		throw error(400, 'Email dan password wajib diisi');
	}
	if (password.length < 6) {
		throw error(400, 'Password minimal 6 karakter');
	}

	const userId = generateId(15);
	const hashedPassword = await new Scrypt().hash(password);

	try {
		await db
			.prepare(
				'INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
			)
			.bind(userId, username || null, email, hashedPassword, role, Date.now())
			.run();
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT') {
			throw error(400, 'Email sudah terdaftar');
		}
		throw error(500, 'Gagal membuat santri');
	}

	return json(
		{ id: userId, username, email, role },
		{
			status: 201
		}
	);
};
