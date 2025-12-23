import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { createOrganization, ensureOrgSchema, ensureUniqueSlug, slugify } from '$lib/server/organizations';
import { generateId } from 'lucia';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });
		const db = locals.db!;

		await ensureOrgSchema(db);

		const formData = await request.formData();
		const orgName = formData.get('orgName');
		const orgSlug = formData.get('orgSlug');
		const orgAddress = formData.get('orgAddress');
		const orgCity = formData.get('orgCity');
		const orgPhone = formData.get('orgPhone');
		const adminName = formData.get('adminName');
		const adminEmail = formData.get('adminEmail');
		const adminPassword = formData.get('adminPassword');

		if (
			typeof orgName !== 'string' ||
			typeof adminName !== 'string' ||
			typeof adminEmail !== 'string' ||
			typeof adminPassword !== 'string'
		) {
			return fail(400, { error: 'Semua kolom wajib diisi.' });
		}

		if (adminPassword.length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter.' });
		}

		const baseSlug = slugify(typeof orgSlug === 'string' && orgSlug.trim() ? orgSlug : orgName);
		if (!baseSlug) {
			return fail(400, { error: 'Slug tidak valid.' });
		}

		const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(adminEmail).first();
		if (existing) {
			return fail(400, { error: 'Email admin sudah terdaftar.' });
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

		const userId = generateId(15);
		const hashed = await new Scrypt().hash(adminPassword);
		await db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, org_id, org_status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(userId, adminName.trim(), adminEmail.trim(), hashed, 'admin', orgId, 'active', Date.now())
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
