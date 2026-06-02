import { fail, redirect } from '@sveltejs/kit';
import { Scrypt } from '$lib/server/password';
import {
	createOrganization,
	ensureUniqueSlug,
	getOrganizationById,
	slugify,
	type OrgType
} from '$lib/server/organizations';
import { listOrgMedia } from '$lib/server/org-media';
import { seedHafalanDefault } from '$lib/server/db-hafalan';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/seed-hafalan-default';
import { buildR2PublicUrl, requireR2Bucket } from '$lib/server/cloudflare';
import type { Actions, PageServerLoad } from './$types';

const allowedOrgTypes = ['tpq', 'pondok', 'masjid', 'musholla', 'rumah-tahfidz'] as const;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const avatarMimeToExt: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

type ManagedLembagaRow = {
	id: string;
	name: string;
	type: string;
	slug: string | null;
	status: string | null;
	address: string | null;
	city: string | null;
	logoUrl: string | null;
	isAktif: number | null;
	createdAt: number | null;
	activeAddonCount: number | null;
};

type AddonRow = {
	id: string;
	tipeAddon: string;
	status: string;
	berlakuHingga: number | null;
};

type OrgLocationFields = {
	kota: string | null;
	provinsi: string | null;
	latitude: number | null;
	longitude: number | null;
};

const isMissingMultiLembagaSchema = (err: unknown) => {
	const message = `${(err as Error)?.message ?? err}`.toLowerCase();
	return (
		message.includes('no such table: addon_lembaga') ||
		(message.includes('no such column') &&
			(message.includes('akun_admin_id') || message.includes('logo_url') || message.includes('is_aktif')))
	);
};

const listManagedLembaga = async (db: App.Locals['db'], userId: string, fallbackOrgId?: string | null) => {
	if (!db) return [];

	const nowMs = Date.now();
	const nowSeconds = Math.floor(nowMs / 1000);

	try {
		const { results } = await db
			.prepare(
				`SELECT
					o.id,
					o.name,
					o.type,
					o.slug,
					o.status,
					o.address,
					o.city,
					o.logo_url AS logoUrl,
					o.is_aktif AS isAktif,
					o.created_at AS createdAt,
					COUNT(a.id) AS activeAddonCount
				 FROM organizations o
				 LEFT JOIN addon_lembaga a
				   ON a.lembaga_id = o.id
				  AND a.status = 'aktif'
				  AND (
					a.berlaku_hingga IS NULL
					OR a.berlaku_hingga > ?
					OR (a.berlaku_hingga < 100000000000 AND a.berlaku_hingga > ?)
				  )
				 WHERE o.akun_admin_id = ?
				 GROUP BY
					o.id,
					o.name,
					o.type,
					o.slug,
					o.status,
					o.address,
					o.city,
					o.logo_url,
					o.is_aktif,
					o.created_at
				 ORDER BY COALESCE(o.is_aktif, 0) DESC, o.created_at DESC`
			)
			.bind(nowMs, nowSeconds, userId)
			.all<ManagedLembagaRow>();

		return results ?? [];
	} catch (err) {
		if (!isMissingMultiLembagaSchema(err)) throw err;
		if (!fallbackOrgId) return [];

		const org = await getOrganizationById(db, fallbackOrgId);
		return org
			? [
					{
						...org,
						logoUrl: null,
						isAktif: org.status === 'active' ? 1 : 0,
						activeAddonCount: 0
					}
				]
			: [];
	}
};

const listActiveAddons = async (db: App.Locals['db'], lembagaId?: string | null) => {
	if (!db || !lembagaId) return [];

	const nowMs = Date.now();
	const nowSeconds = Math.floor(nowMs / 1000);

	try {
		const { results } = await db
			.prepare(
				`SELECT
					id,
					tipe_addon AS tipeAddon,
					status,
					berlaku_hingga AS berlakuHingga
				 FROM addon_lembaga
				 WHERE lembaga_id = ?
				   AND status = 'aktif'
				   AND (
					berlaku_hingga IS NULL
					OR berlaku_hingga > ?
					OR (berlaku_hingga < 100000000000 AND berlaku_hingga > ?)
				   )
				 ORDER BY created_at DESC`
			)
			.bind(lembagaId, nowMs, nowSeconds)
			.all<AddonRow>();

		return results ?? [];
	} catch (err) {
		if (isMissingMultiLembagaSchema(err)) return [];
		throw err;
	}
};

const getOrgLocationFields = async (db: App.Locals['db'], orgId?: string | null) => {
	if (!db || !orgId) return null;

	return db
		.prepare(
			`SELECT
				kota,
				provinsi,
				latitude,
				longitude
			 FROM organizations
			 WHERE id = ?`
		)
		.bind(orgId)
		.first<OrgLocationFields>();
};

const parseNullableCoordinate = (formData: FormData, name: string) => {
	const raw = formData.get(name);
	if (typeof raw !== 'string') return { value: null, invalid: false };
	const trimmed = raw.trim();
	if (!trimmed) return { value: null, invalid: false };
	const parsed = Number.parseFloat(trimmed);
	return Number.isFinite(parsed) ? { value: parsed, invalid: false } : { value: null, invalid: true };
};

const isIndonesiaCoordinate = (latitude: number, longitude: number) =>
	latitude >= -11 && latitude <= 6 && longitude >= 95 && longitude <= 141;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw redirect(302, '/auth');
	}

	const { db, user } = { db: locals.db!, user: locals.user };
	const profile =
		(await db
			.prepare(
				'SELECT id, email, username, public_handle as publicHandle, role, gender, whatsapp, avatar_url as avatarUrl, org_id as orgId, org_status as orgStatus, created_at as createdAt FROM users WHERE id = ?'
			)
			.bind(user.id)
			.first<{
				id: string;
				email: string;
				username: string | null;
				publicHandle: string | null;
				role: string;
				gender: string | null;
				whatsapp: string | null;
				avatarUrl: string | null;
				orgId: string | null;
				orgStatus: string | null;
				createdAt: number;
			}>())
		?? null;

	const orgBase = profile?.orgId ? await getOrganizationById(db, profile.orgId) : null;
	const orgLocation = orgBase ? await getOrgLocationFields(db, orgBase.id) : null;
	const org = orgBase ? { ...orgBase, ...orgLocation } : null;
	const [orgMedia, managedLembaga, addonAktif] = await Promise.all([
		org ? listOrgMedia(db, org.id) : [],
		listManagedLembaga(db, user.id, profile?.orgId),
		listActiveAddons(db, profile?.orgId)
	]);

	return {
		profile,
		org,
		orgMedia,
		managedLembaga,
		addonAktif
	};
};

export const actions: Actions = {
	updateAvatar: async ({ request, locals, platform }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'avatar' });
		if (!locals.db) return fail(500, { message: 'Layanan data tidak tersedia', type: 'avatar' });

		const form = await request.formData();
		const file = form.get('avatar');
		if (!(file instanceof File)) {
			return fail(400, { message: 'Pilih foto profil terlebih dahulu.', type: 'avatar' });
		}
		if (file.size <= 0) {
			return fail(400, { message: 'File foto kosong.', type: 'avatar' });
		}
		if (file.size > MAX_AVATAR_BYTES) {
			return fail(413, { message: 'Ukuran foto maksimal 2MB.', type: 'avatar' });
		}
		if (!(file.type in avatarMimeToExt)) {
			return fail(415, { message: 'Gunakan gambar JPG, PNG, atau WebP.', type: 'avatar' });
		}

		const ext = avatarMimeToExt[file.type];
		const key = `avatars/${locals.user.id}/${crypto.randomUUID()}.${ext}`;

		try {
			const bucket = requireR2Bucket(platform);
			await bucket.put(key, await file.arrayBuffer(), {
				httpMetadata: {
					contentType: file.type,
					cacheControl: 'public, max-age=31536000, immutable'
				}
			});

			const avatarUrl = buildR2PublicUrl(key, platform);
			await locals.db
				.prepare('UPDATE users SET avatar_url = ? WHERE id = ?')
				.bind(avatarUrl, locals.user.id)
				.run();

			locals.user = { ...locals.user, avatarUrl } as typeof locals.user;
			return { success: true, message: 'Foto profil diperbarui', type: 'avatar' };
		} catch (err) {
			console.error('Update avatar error:', err);
			return fail(500, { message: 'Gagal mengunggah foto profil.', type: 'avatar' });
		}
	},

	removeAvatar: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'avatar' });
		if (!locals.db) return fail(500, { message: 'Layanan data tidak tersedia', type: 'avatar' });

		await locals.db.prepare('UPDATE users SET avatar_url = NULL WHERE id = ?').bind(locals.user.id).run();
		locals.user = { ...locals.user, avatarUrl: null } as typeof locals.user;

		return { success: true, message: 'Foto profil dihapus', type: 'avatar' };
	},

	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated' });
		if (!locals.db) return fail(500, { message: 'Layanan data tidak tersedia' });
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

		const trimmedHandle = handle.trim().toLowerCase();
		if (!trimmedHandle) return fail(400, { message: 'Username publik wajib diisi' });
		if (!/^[a-z0-9._-]{3,32}$/.test(trimmedHandle)) {
			return fail(400, { message: 'Username publik hanya huruf kecil/angka/._- (3-32 karakter)' });
		}

		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;

		try {
			const existingHandle = await locals.db
				.prepare(
					`SELECT id
					 FROM users
					 WHERE (id = ? OR public_handle = ?) AND id != ?
					 LIMIT 1`
				)
				.bind(trimmedHandle, trimmedHandle, locals.user.id)
				.first<{ id: string }>();
			if (existingHandle) {
				return fail(400, { message: 'Username publik sudah dipakai, pilih yang lain.' });
			}

			await locals.db
				.prepare('UPDATE users SET username = ?, public_handle = ?, gender = ? WHERE id = ?')
				.bind(displayName.trim(), trimmedHandle, genderValue, locals.user.id)
				.run();

			// perbarui sesi lokal agar tetap sinkron
			locals.user = {
				...locals.user,
				username: displayName.trim(),
				gender: genderValue ?? undefined
			} as typeof locals.user;
		} catch (err: any) {
			const msg =
				err?.code === 'SQLITE_CONSTRAINT'
					? 'Username publik sudah dipakai, pilih yang lain.'
					: 'Gagal memperbarui profil';
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

	updateOrgLocation: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'org-location' });
		if (!locals.db) return fail(500, { message: 'Layanan data tidak tersedia', type: 'org-location' });

		const formData = await request.formData();
		const orgId = `${formData.get('orgId') ?? ''}`.trim();
		const address = `${formData.get('address') ?? ''}`.trim();
		const kota = `${formData.get('kota') ?? ''}`.trim();
		const provinsi = `${formData.get('provinsi') ?? ''}`.trim();
		const latitudeResult = parseNullableCoordinate(formData, 'latitude');
		const longitudeResult = parseNullableCoordinate(formData, 'longitude');

		if (!orgId) {
			return fail(400, { message: 'Lembaga tidak valid', type: 'org-location' });
		}
		if (latitudeResult.invalid || longitudeResult.invalid) {
			return fail(400, { message: 'Format koordinat tidak valid', type: 'org-location' });
		}

		const latitude = latitudeResult.value;
		const longitude = longitudeResult.value;
		if ((latitude === null && longitude !== null) || (latitude !== null && longitude === null)) {
			return fail(400, { message: 'Latitude dan longitude harus diisi lengkap', type: 'org-location' });
		}
		if (latitude !== null && longitude !== null && !isIndonesiaCoordinate(latitude, longitude)) {
			return fail(400, { message: 'Koordinat di luar wilayah Indonesia', type: 'org-location' });
		}

		const target = await locals.db
			.prepare('SELECT id, akun_admin_id as akunAdminId FROM organizations WHERE id = ?')
			.bind(orgId)
			.first<{ id: string; akunAdminId: string | null }>();
		if (!target) {
			return fail(404, { message: 'Lembaga tidak ditemukan', type: 'org-location' });
		}

		const canUpdate = target.akunAdminId === locals.user.id || orgId === locals.user.orgId;
		if (!canUpdate) {
			return fail(403, { message: 'Tidak memiliki akses mengubah lembaga ini', type: 'org-location' });
		}

		const city = [kota, provinsi].filter(Boolean).join(', ');
		await locals.db
			.prepare(
				`UPDATE organizations
				 SET address = ?,
					city = ?,
					kota = ?,
					provinsi = ?,
					latitude = ?,
					longitude = ?
				 WHERE id = ?`
			)
			.bind(
				address || null,
				city || null,
				kota || null,
				provinsi || null,
				latitude,
				longitude,
				orgId
			)
			.run();

		return { success: true, message: 'Lokasi lembaga diperbarui', type: 'org-location' };
	},

	registerOrg: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated', type: 'org' });
		if (!locals.db) return fail(500, { message: 'Layanan data tidak tersedia', type: 'org' });

		const db = locals.db!;

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

		const typedOrgType = orgType as OrgType;
		const uniqueSlug = await ensureUniqueSlug(db, typedOrgType, baseSlug);
		const orgId = await createOrganization(db, {
			type: typedOrgType,
			name: orgName.trim(),
			slug: uniqueSlug,
			address: typeof orgAddress === 'string' ? orgAddress.trim() : '',
			city: typeof orgCity === 'string' ? orgCity.trim() : '',
			contactPhone: typeof orgPhone === 'string' ? orgPhone.trim() : ''
		});

		try {
			await db
				.prepare('UPDATE organizations SET akun_admin_id = ?, is_aktif = ? WHERE id = ?')
				.bind(locals.user.id, 1, orgId)
				.run();
		} catch (err) {
			if (!isMissingMultiLembagaSchema(err)) throw err;
		}
		await seedHafalanDefault(db, orgId, SEED_HAFALAN_DEFAULT);

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
