import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { createOrganization, ensureUniqueSlug, slugify } from '$lib/server/organizations';
import { generateId } from 'lucia';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, platform }) => {
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;

		const formData = await request.formData();
		const orgName = formData.get('orgName');
		const orgSlug = formData.get('orgSlug');
		const orgAddress = formData.get('orgAddress');
		const orgCity = formData.get('orgCity');
		const orgPhone = formData.get('orgPhone');
		const adminName = formData.get('adminName');
		const adminEmail = formData.get('adminEmail');
		const adminPassword = formData.get('adminPassword');
		const isLoggedIn = !!locals.user;

		if (
			typeof orgName !== 'string' ||
			(!isLoggedIn &&
				(typeof adminName !== 'string' || typeof adminEmail !== 'string' || typeof adminPassword !== 'string'))
		) {
			return fail(400, { error: 'Semua kolom wajib diisi.' });
		}

		if (!isLoggedIn && typeof adminPassword === 'string' && adminPassword.length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter.' });
		}

		const baseSlug = slugify(typeof orgSlug === 'string' && orgSlug.trim() ? orgSlug : orgName);
		if (!baseSlug) {
			return fail(400, { error: 'Slug tidak valid.' });
		}

		if (!isLoggedIn) {
			const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(adminEmail).first();
			if (existing) {
				return fail(400, { error: 'Email admin sudah terdaftar.' });
			}
		} else if (locals.user?.orgId) {
			return fail(400, { error: 'Akun sudah terhubung ke lembaga.' });
		}

		const uniqueSlug = await ensureUniqueSlug(db, 'tpq', baseSlug);
		const orgId = await createOrganization(db, {
			type: 'tpq',
			name: orgName.trim(),
			slug: uniqueSlug,
			address: typeof orgAddress === 'string' ? orgAddress.trim() : '',
			city: typeof orgCity === 'string' ? orgCity.trim() : '',
			contactPhone: typeof orgPhone === 'string' ? orgPhone.trim() : ''
		});

		if (isLoggedIn && locals.user) {
			await db
				.prepare('UPDATE users SET role = ?, org_id = ?, org_status = ? WHERE id = ?')
				.bind('admin', orgId, 'active', locals.user.id)
				.run();
		} else {
			const userId = generateId(15);
			const hashed = await new Scrypt().hash(adminPassword as string);
			await db
				.prepare(
					`INSERT INTO users (id, username, email, password_hash, role, org_id, org_status, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(userId, (adminName as string).trim(), (adminEmail as string).trim(), hashed, 'admin', orgId, 'active', Date.now())
				.run();

			await logActivity(db, {
				userId,
				action: 'REGISTER',
				metadata: { orgId, orgName: orgName.trim(), orgType: 'tpq', source: 'tpq/daftar' }
			});
			logSystemActivity(db, 'REGISTER', {
				userId,
				userEmail: (adminEmail as string).trim(),
				ipAddress: getRequestIp(request),
				metadata: { orgId, orgName: orgName.trim(), orgType: 'tpq', role: 'admin', source: 'tpq/daftar' },
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
				metadata: { method: 'password', source: 'tpq/daftar' }
			});
		}

		throw redirect(302, '/menunggu');
	}
};
