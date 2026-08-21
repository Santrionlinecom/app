import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password';
import { createOrganization, ensureUniqueSlug, slugify } from '$lib/server/organizations';
import { generateId } from 'lucia';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';
import { getInstitutionActionBlock, getInstitutionComingSoonLoad } from '$lib/server/institution-guards';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';
import { grantMembership } from '$lib/server/active-org';
import { bacaConsent, kolomConsent, PESAN_CONSENT_WAJIB } from '$lib/server/legal/consent';

export const load: PageServerLoad = async () => {
	getInstitutionComingSoonLoad('pondok');

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, platform }) => {
		const blockedAction = getInstitutionActionBlock('pondok');
		if (blockedAction) {
			return blockedAction;
		}

		if (!locals.db) return fail(500, { error: 'Layanan data tidak tersedia' });
		const db = locals.db!;

		const formData = await request.formData();

		// Persetujuan Kebijakan Privasi & Syarat Ketentuan (UU 27/2022).
		// Diperiksa sebelum akun dibuat — bukan setelahnya.
		if (!bacaConsent(formData).ok) {
			return fail(400, { error: PESAN_CONSENT_WAJIB });
		}
		const ip = getRequestIp(request) ?? undefined;
		const turnstile = await verifyTurnstileFormData(formData, ip);
		if (!turnstile.success) {
			return fail(400, { error: TURNSTILE_FAILURE_MESSAGE });
		}

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

		const uniqueSlug = await ensureUniqueSlug(db, 'pondok', baseSlug);
		const orgId = await createOrganization(db, {
			type: 'pondok',
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

			// Catat keanggotaan agar lembaga ini muncul di pemilih lembaga dan
			// tetap bisa dibuka meski pengguna memegang lembaga lain.
			await grantMembership(db, {
				id: generateId(15),
				userId: locals.user.id,
				orgId,
				orgType: 'pondok',
				role: 'admin'
			});
		} else {
			const userId = generateId(15);
			const hashed = await new Scrypt().hash(adminPassword as string);
			await db
				.prepare(
					`INSERT INTO users (id, username, email, password_hash, role, org_id, org_status, created_at, consent_at, consent_versi)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(userId, (adminName as string).trim(), (adminEmail as string).trim(), hashed, 'admin', orgId, 'active', Date.now(), ...kolomConsent())
				.run();

			await grantMembership(db, {
				id: generateId(15),
				userId,
				orgId,
				orgType: 'pondok',
				role: 'admin'
			});

			await logActivity(db, {
				userId,
				action: 'REGISTER',
				metadata: { orgId, orgName: orgName.trim(), orgType: 'pondok', source: 'pondok/daftar' }
			});
			logSystemActivity(db, 'REGISTER', {
				userId,
				userEmail: (adminEmail as string).trim(),
				ipAddress: ip ?? null,
				metadata: { orgId, orgName: orgName.trim(), orgType: 'pondok', role: 'admin', source: 'pondok/daftar' },
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
				metadata: { method: 'password', source: 'pondok/daftar' }
			});
		}

		throw redirect(302, '/menunggu');
	}
};
