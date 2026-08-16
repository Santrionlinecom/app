import { error, fail, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { assertCanAddLembaga, getLembagaCapacity } from '$lib/server/addons';
import { grantMembership } from '$lib/server/active-org';
import { seedHafalanDefault } from '$lib/server/domains/tpq/db-hafalan';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/domains/tpq/seed-hafalan-default';
import { isEducationalOrgType } from '$lib/server/utils';
import { ensureUniqueSlug, slugify, type OrgType } from '$lib/server/organizations';
import type { Actions, PageServerLoad } from './$types';

type FormErrors = {
	name?: string;
	type?: string;
	address?: string;
	error?: string;
};

const allowedTypes = new Set<OrgType>([
	'tpq',
	'pondok',
	'masjid',
	'musholla',
	'rumah-tahfidz'
]);

const nanoid = () => generateId(15);

const readString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	const capacity = await getLembagaCapacity(locals.db, locals.user.id);
	return { capacity };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, {
				errors: { error: 'Silakan login terlebih dahulu.' } satisfies FormErrors
			});
		}

		if (!locals.db) {
			return fail(500, {
				errors: { error: 'Layanan data tidak tersedia.' } satisfies FormErrors
			});
		}

		const formData = await request.formData();
		const name = readString(formData, 'name');
		const type = readString(formData, 'type') as OrgType | '';
		const address = readString(formData, 'address');
		const values = { name, type, address };
		const errors: FormErrors = {};

		if (!name) {
			errors.name = 'Nama lembaga wajib diisi.';
		}

		if (!type) {
			errors.type = 'Pilih tipe lembaga terlebih dahulu.';
		} else if (!allowedTypes.has(type as OrgType)) {
			errors.type = 'Tipe lembaga tidak valid.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values });
		}

		const capacity = await assertCanAddLembaga(locals.db, locals.user.id);
		if (!capacity.canAdd) {
			return fail(403, {
				errors: {
					error:
						capacity.error ??
						'Batas 1 lembaga gratis tercapai. Aktifkan addon Lembaga Tambahan di /addon.'
				} satisfies FormErrors,
				values
			});
		}

		const baseSlug = slugify(name);
		if (!baseSlug) {
			return fail(400, {
				errors: { name: 'Nama lembaga tidak bisa dipakai sebagai slug.' } satisfies FormErrors,
				values
			});
		}

		const orgType = type as OrgType;
		const slug = await ensureUniqueSlug(locals.db, orgType, baseSlug);
		const now = Date.now();
		const orgId = nanoid();

		await locals.db
			.prepare(
				`INSERT INTO organizations (
					id,
					name,
					type,
					slug,
					address,
					akun_admin_id,
					status,
					is_aktif,
					created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(orgId, name, orgType, slug, address || null, locals.user.id, 'active', 1, now)
			.run();

		// Pembuat lembaga wajib langsung menjadi anggota berperan admin.
		// Tanpa baris ini lembaga berdiri tanpa pengurus dan pembuatnya sendiri
		// ditolak 403 di dashboard — penyebab 7 lembaga kosong di produksi.
		await grantMembership(locals.db, {
			id: nanoid(),
			userId: locals.user.id,
			orgId,
			orgType,
			role: 'admin'
		});

		// Akun yang belum terhubung ke lembaga mana pun disetel ke lembaga baru
		// ini agar kode lama yang masih membaca users.org_id tetap bekerja.
		if (!locals.user.orgId) {
			await locals.db
				.prepare(`UPDATE users SET role = ?, org_id = ?, org_status = ? WHERE id = ?`)
				.bind('admin', orgId, 'active', locals.user.id)
				.run();
		}

		// Lembaga pendidikan diberi target hafalan bawaan supaya dashboard tidak
		// tampak kosong dan pengurus tidak mengira fiturnya tidak berfungsi.
		if (isEducationalOrgType(orgType)) {
			await seedHafalanDefault(locals.db, orgId, SEED_HAFALAN_DEFAULT);
		}

		throw redirect(303, '/lembaga');
	}
};
