import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { allowedRolesByType, getMemberReferralRole, getOrganizationBySlug } from '$lib/server/organizations';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { generateId } from 'lucia';

const roleLabel = (value: string) => {
	if (value === 'ustadzah') return 'Ustadzah';
	if (value === 'jamaah') return 'Jamaah';
	if (value === 'tamir') return "Ta'mir";
	if (value === 'bendahara') return 'Bendahara';
	return value.charAt(0).toUpperCase() + value.slice(1);
};

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	const org = await getOrganizationBySlug(locals.db!, params.slug, 'masjid');
	if (!org) {
		throw error(404, 'Masjid tidak ditemukan');
	}
	const lockedRoleValue = getMemberReferralRole('masjid', url);

	return {
		org,
		lockedRole: lockedRoleValue ? { value: lockedRoleValue, label: roleLabel(lockedRoleValue) } : null,
		roles: allowedRolesByType.masjid.filter((role) => role !== 'ustadzah').map((role) => ({
			value: role,
			label: roleLabel(role)
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, params, url }) => {
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;
		const org = await getOrganizationBySlug(db, params.slug, 'masjid');
		if (!org) {
			return fail(404, { error: 'Masjid tidak ditemukan' });
		}
		if (org.status !== 'active') {
			return fail(400, { error: 'Masjid belum aktif' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const email = formData.get('email');
		const password = formData.get('password');
		const role = formData.get('role');
		const gender = formData.get('gender');
		const roleValue = getMemberReferralRole('masjid', url) ?? (typeof role === 'string' ? role : '');

		if (
			typeof name !== 'string' ||
			typeof email !== 'string' ||
			typeof password !== 'string' ||
			typeof gender !== 'string' ||
			!roleValue
		) {
			return fail(400, { error: 'Semua kolom wajib diisi.' });
		}
		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;
		if (!genderValue) {
			return fail(400, { error: 'Jenis kelamin tidak valid.' });
		}
		if (!allowedRolesByType.masjid.includes(roleValue as any)) {
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
			roleValue === 'ustadz' || roleValue === 'ustadzah'
				? genderValue === 'wanita'
					? 'ustadzah'
					: 'ustadz'
				: roleValue;

		const userId = generateId(15);
		const hashed = await new Scrypt().hash(password);
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
