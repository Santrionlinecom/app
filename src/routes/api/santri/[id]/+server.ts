import { json, error } from '@sveltejs/kit';
import { Scrypt } from 'oslo/password';
import type { RequestHandler } from './$types';

const allowedRoles = ['santri', 'ustadz', 'ustadzah', 'admin'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	ensureAuth(locals);
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');
	const id = params.id;
	if (!id) throw error(400, 'ID tidak valid');

	const body = await request.json().catch(() => ({}));
	const username = typeof body.username === 'string' ? body.username.trim() : undefined;
	const email = typeof body.email === 'string' ? body.email.trim() : undefined;
	const role =
		typeof body.role === 'string' && allowedRoles.includes(body.role) ? body.role : undefined;
	const password = typeof body.password === 'string' ? body.password : undefined;

	if (!username && !email && !role && !password) {
		throw error(400, 'Tidak ada data yang diubah');
	}

	let passwordHash: string | null = null;
	if (password) {
		if (password.length < 6) throw error(400, 'Password minimal 6 karakter');
		passwordHash = await new Scrypt().hash(password);
	}

	try {
		const fields: string[] = [];
		const values: any[] = [];

		if (username !== undefined) {
			fields.push('username = ?');
			values.push(username || null);
		}
		if (email !== undefined) {
			fields.push('email = ?');
			values.push(email);
		}
		if (role !== undefined) {
			fields.push('role = ?');
			values.push(role);
		}
		if (passwordHash) {
			fields.push('password_hash = ?');
			values.push(passwordHash);
		}

		values.push(id);

		await db
			.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
			.bind(...values)
			.run();
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT') {
			throw error(400, 'Email sudah terdaftar');
		}
		throw error(500, 'Gagal memperbarui santri');
	}

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	ensureAuth(locals);
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');
	const id = params.id;
	if (!id) throw error(400, 'ID tidak valid');

	await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

	return json({ ok: true });
};
