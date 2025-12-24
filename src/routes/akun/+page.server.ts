import { fail, redirect } from '@sveltejs/kit';
import { Scrypt } from '$lib/server/password';
import {
	createOrganization,
	ensureOrgSchema,
	ensureUniqueSlug,
	getOrganizationById,
	slugify
} from '$lib/server/organizations';
import { listOrgMedia } from '$lib/server/org-media';
import { ensureUserOptionalColumns } from '$lib/server/users';
import type { Actions, PageServerLoad } from './$types';

const allowedOrgTypes = ['pondok', 'masjid', 'musholla', 'tpq', 'rumah-tahfidz'] as const;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw redirect(302, '/auth');
	}

	const { db, user } = { db: locals.db!, user: locals.user };
	await ensureUserOptionalColumns(db);
	await ensureOrgSchema(db);
	const profile =
		(await db
			.prepare(
				'SELECT id, email, username, role, gender, whatsapp, org_id as orgId, org_status as orgStatus, created_at as createdAt FROM users WHERE id = ?'
			)
			.bind(user.id)
			.first<{
				id: string;
				email: string;
				username: string | null;
				role: string;
				gender: string | null;
				whatsapp: string | null;
				orgId: string | null;
				orgStatus: string | null;
				createdAt: number;
			}>())
		?? null;

	const org = profile?.orgId ? await getOrganizationById(db, profile.orgId) : null;
	const orgMedia = org ? await listOrgMedia(db, org.id) : [];

	return {
		profile,
		org,
		orgMedia
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated' });
		const form = await request.formData();
		const displayName = form.get('displayName');
		const handle = form.get('handle');
		const gender = form.get('gender');

		if (typeof displayName !== 'string') {
			return fail(400, { message: 'Nama tidak valid' });
		}
		if (typeof handle !== 'string') {
			return fail(400, { message: 'ID tidak valid' });
		}
		if (typeof gender !== 'string') {
			return fail(400, { message: 'Jenis kelamin tidak valid' });
		}

		const trimmedHandle = handle.trim();
		if (!trimmedHandle) return fail(400, { message: 'ID wajib diisi' });
		if (!/^[a-zA-Z0-9._-]{3,32}$/.test(trimmedHandle)) {
			return fail(400, { message: 'ID hanya huruf/angka/._- (3-32 karakter)' });
		}

		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;

		try {
			await ensureUserOptionalColumns(locals.db!);

			await locals.db!
				.prepare('UPDATE users SET username = ?, id = ?, gender = ? WHERE id = ?')
				.bind(displayName.trim(), trimmedHandle, genderValue, locals.user.id)
				.run();

			// perbarui sesi lokal agar tetap sinkron
			locals.user = {
				...locals.user,
				id: trimmedHandle,
				username: displayName.trim(),
				gender: genderValue ?? undefined
			} as typeof locals.user;
		} catch (err: any) {
			const msg = err?.code === 'SQLITE_CONSTRAINT' ? 'ID sudah dipakai, pilih yang lain.' : 'Gagal memperbarui profil';
			return fail(400, { message: msg });
		}

		return { success: true, message: 'Profil diperbarui' };
	},

	updateWhatsapp: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'whatsapp' });

		const form = await request.formData();
		const whatsapp = form.get('whatsapp');

		if (typeof whatsapp !== 'string') {
			return fail(400, { message: 'Nomor WhatsApp tidak valid', type: 'whatsapp' });
		}

		const sanitized = whatsapp.replace(/[\s-]/g, '').trim();
		if (!sanitized) {
			return fail(400, { message: 'Nomor WhatsApp wajib diisi', type: 'whatsapp' });
		}
		if (!/^\+?\d{9,15}$/.test(sanitized)) {
			return fail(400, {
				message: 'Gunakan 9-15 digit angka, boleh diawali +62',
				type: 'whatsapp'
			});
		}

		await ensureUserOptionalColumns(locals.db!);

		await locals.db!
			.prepare('UPDATE users SET whatsapp = ? WHERE id = ?')
			.bind(sanitized, locals.user.id)
			.run();

		locals.user = { ...locals.user, whatsapp: sanitized } as typeof locals.user;

		return { success: true, message: 'Nomor WhatsApp tersimpan', type: 'whatsapp' };
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated' });
		const form = await request.formData();
		const password = form.get('password');
		const confirm = form.get('confirm');

		if (typeof password !== 'string' || typeof confirm !== 'string') {
			return fail(400, { message: 'Password tidak valid', type: 'password' });
		}
		if (password.length < 6) {
			return fail(400, { message: 'Password minimal 6 karakter', type: 'password' });
		}
		if (password !== confirm) {
			return fail(400, { message: 'Konfirmasi password tidak sama', type: 'password' });
		}

		const hashed = await new Scrypt().hash(password);
		await locals.db!
			.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
			.bind(hashed, locals.user.id)
			.run();

		return { success: true, message: 'Password diperbarui', type: 'password' };
	},

	registerOrg: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'org' });
		if (!locals.db) return fail(500, { message: 'Database tidak tersedia', type: 'org' });

		const db = locals.db!;
		await ensureOrgSchema(db);
		await ensureUserOptionalColumns(db);

		if (locals.user.orgId) {
			return fail(400, { message: 'Akun sudah terhubung ke lembaga.', type: 'org' });
		}

		const formData = await request.formData();
		const orgType = formData.get('orgType');
		const orgName = formData.get('orgName');
		const orgSlug = formData.get('orgSlug');
		const orgAddress = formData.get('orgAddress');
		const orgCity = formData.get('orgCity');
		const orgPhone = formData.get('orgPhone');
		const adminName = formData.get('adminName');
		const adminEmail = formData.get('adminEmail');

		if (
			typeof orgType !== 'string' ||
			typeof orgName !== 'string' ||
			typeof adminName !== 'string' ||
			typeof adminEmail !== 'string'
		) {
			return fail(400, { message: 'Semua kolom wajib diisi.', type: 'org' });
		}

		if (!allowedOrgTypes.includes(orgType as typeof allowedOrgTypes[number])) {
			return fail(400, { message: 'Tipe lembaga tidak valid.', type: 'org' });
		}

		if (adminEmail.trim().toLowerCase() !== locals.user.email.toLowerCase()) {
			return fail(400, { message: 'Email admin harus sama dengan akun yang login.', type: 'org' });
		}

		const baseSlug = slugify(typeof orgSlug === 'string' && orgSlug.trim() ? orgSlug : orgName);
		if (!baseSlug) {
			return fail(400, { message: 'Slug tidak valid.', type: 'org' });
		}

		const uniqueSlug = await ensureUniqueSlug(db, orgType as typeof allowedOrgTypes[number], baseSlug);
		const orgId = await createOrganization(db, {
			type: orgType as typeof allowedOrgTypes[number],
			name: orgName.trim(),
			slug: uniqueSlug,
			address: typeof orgAddress === 'string' ? orgAddress.trim() : '',
			city: typeof orgCity === 'string' ? orgCity.trim() : '',
			contactPhone: typeof orgPhone === 'string' ? orgPhone.trim() : ''
		});

		await db
			.prepare('UPDATE users SET username = ?, role = ?, org_id = ?, org_status = ? WHERE id = ?')
			.bind(adminName.trim(), 'admin', orgId, 'active', locals.user.id)
			.run();

		locals.user = {
			...locals.user,
			username: adminName.trim(),
			role: 'admin',
			orgId,
			orgStatus: 'active'
		} as typeof locals.user;

		return {
			success: true,
			message: 'Lembaga berhasil didaftarkan. Menunggu verifikasi admin sistem.',
			type: 'org'
		};
	}
};
