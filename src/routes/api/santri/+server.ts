import { json, error } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
import { getOrgScope } from '$lib/server/organizations';
import type { RequestHandler } from './$types';

const allowedRoles = ['santri', 'ustadz', 'ustadzah', 'jamaah', 'tamir', 'bendahara', 'admin'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	ensureAuth(locals);
	if (locals.user?.role !== 'admin') {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const baseQuery =
		'SELECT id, username, email, role, org_id as orgId, org_status as orgStatus, created_at as createdAt FROM users';
	const rows =
		(await (isSystemAdmin
			? db.prepare(`${baseQuery} ORDER BY created_at DESC`)
			: db.prepare(`${baseQuery} WHERE org_id = ? ORDER BY created_at DESC`).bind(orgId))
			.all<{
				id: string;
				username: string | null;
				email: string;
				role: string;
				orgId: string | null;
				orgStatus: string | null;
				createdAt: number;
			}>()) ?? [];

	return json({ santri: rows });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	ensureAuth(locals);
	if (locals.user?.role !== 'admin') {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const body = await request.json().catch(() => ({}));

	const username = typeof body.username === 'string' ? body.username.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	const role = typeof body.role === 'string' && allowedRoles.includes(body.role) ? body.role : 'santri';
	const genderRaw = typeof body.gender === 'string' ? body.gender.trim() : '';
	const gender = genderRaw === 'pria' || genderRaw === 'wanita' ? genderRaw : null;
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const targetOrgId = isSystemAdmin
		? typeof body.orgId === 'string'
			? body.orgId
			: null
		: orgId;

	if (!targetOrgId) {
		throw error(400, 'Organisasi belum ditentukan');
	}

	if (!email || !password) {
		throw error(400, 'Email dan password wajib diisi');
	}
	if (password.length < 6) {
		throw error(400, 'Password minimal 6 karakter');
	}

	const userId = generateId(15);
	const hashedPassword = await new Scrypt().hash(password);
	const normalizedRole =
		role === 'ustadz' || role === 'ustadzah'
			? gender === 'wanita'
				? 'ustadzah'
				: 'ustadz'
			: role;

	try {
		await db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, gender, org_id, org_status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				userId,
				username || null,
				email,
				hashedPassword,
				normalizedRole,
				gender,
				targetOrgId,
				'active',
				Date.now()
			)
			.run();
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT') {
			throw error(400, 'Email sudah terdaftar');
		}
		throw error(500, 'Gagal membuat santri');
	}

	return json(
		{ id: userId, username, email, role: normalizedRole },
		{
			status: 201
		}
	);
};
