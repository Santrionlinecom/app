import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { allowedRolesByType, getOrganizationBySlug } from '$lib/server/organizations';
import { ensureUserOptionalColumns } from '$lib/server/users';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { generateId } from 'lucia';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	const org = await getOrganizationBySlug(locals.db!, params.slug, 'tpq');
	if (!org) {
		throw error(404, 'TPQ tidak ditemukan');
	}

	return {
		org,
		roles: allowedRolesByType.tpq.filter((role) => role !== 'ustadzah').map((role) => ({
			value: role,
			label: role === 'ustadz' ? 'Ustadz' : role.charAt(0).toUpperCase() + role.slice(1)
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, params }) => {
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;
		const org = await getOrganizationBySlug(db, params.slug, 'tpq');
		if (!org) {
			return fail(404, { error: 'TPQ tidak ditemukan' });
		}
		if (org.status !== 'active') {
			return fail(400, { error: 'TPQ belum aktif' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const email = formData.get('email');
		const password = formData.get('password');
		const role = formData.get('role');
		const gender = formData.get('gender');

		if (
			typeof name !== 'string' ||
			typeof email !== 'string' ||
			typeof password !== 'string' ||
			typeof role !== 'string' ||
			typeof gender !== 'string'
		) {
			return fail(400, { error: 'Semua kolom wajib diisi.' });
		}
		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;
		if (!genderValue) {
			return fail(400, { error: 'Jenis kelamin tidak valid.' });
		}
		if (!allowedRolesByType.tpq.includes(role as any)) {
			return fail(400, { error: 'Role tidak valid.' });
		}
		if (password.length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter.' });
		}

		const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
		if (existing) {
			return fail(400, { error: 'Email sudah terdaftar.' });
		}

		const normalizedRole =
			role === 'ustadz' || role === 'ustadzah'
				? genderValue === 'wanita'
					? 'ustadzah'
					: 'ustadz'
				: role;

		const userId = generateId(15);
		const hashed = await new Scrypt().hash(password);
		await ensureUserOptionalColumns(db);
		await db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, gender, org_id, org_status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				userId,
				name.trim(),
				email.trim(),
				hashed,
				normalizedRole,
				genderValue,
				org.id,
				'pending',
				Date.now()
			)
			.run();

		const lucia = initializeLucia(db);
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		throw redirect(302, '/menunggu');
	}
};
