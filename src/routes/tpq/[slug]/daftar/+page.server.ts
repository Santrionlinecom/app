import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { allowedRolesByType, getDefaultMemberRole, getMemberReferralRole, getOrganizationBySlug } from '$lib/server/organizations';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { generateId } from 'lucia';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';

const roleLabel = (value: string) => {
	if (value === 'ustadzah') return 'Ustadzah';
	if (value === 'santri') return 'Santri';
	return value.charAt(0).toUpperCase() + value.slice(1);
};

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	const org = await getOrganizationBySlug(locals.db!, params.slug, 'tpq');
	if (!org) {
		throw error(404, 'TPQ tidak ditemukan');
	}
	const lockedRoleValue = getMemberReferralRole('tpq', url);

	return {
		org,
		lockedRole: lockedRoleValue ? { value: lockedRoleValue, label: roleLabel(lockedRoleValue) } : null,
		roles: allowedRolesByType.tpq.filter((role) => role !== 'ustadzah').map((role) => ({
			value: role,
			label: roleLabel(role)
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, params, url, platform }) => {
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
		const fallbackRole = getDefaultMemberRole('tpq');
		const roleValue = getMemberReferralRole('tpq', url) ?? (typeof role === 'string' ? role : '') || fallbackRole;

		if (
			typeof name !== 'string' ||
			typeof email !== 'string' ||
			typeof password !== 'string' ||
			typeof gender !== 'string'
		) {
			return fail(400, { error: 'Semua kolom wajib diisi.' });
		}
		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;
		if (!genderValue) {
			return fail(400, { error: 'Jenis kelamin tidak valid.' });
		}
		if (!allowedRolesByType.tpq.includes(roleValue as any)) {
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

		await logActivity(db, {
			userId,
			action: 'REGISTER',
			metadata: { orgId: org.id, orgName: org.name, orgType: 'tpq', source: 'tpq/member' }
		});
		logSystemActivity(db, 'REGISTER', {
			userId,
			userEmail: email.trim(),
			ipAddress: getRequestIp(request),
			metadata: { orgId: org.id, orgName: org.name, orgType: 'tpq', role: normalizedRole, source: 'tpq/member' },
			waitUntil: platform?.context?.waitUntil
		});

		const lucia = initializeLucia(db);
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		await logActivity(db, {
			userId,
			action: 'LOGIN',
			metadata: { method: 'password', source: 'tpq/member' }
		});

		throw redirect(302, '/menunggu');
	}
};
