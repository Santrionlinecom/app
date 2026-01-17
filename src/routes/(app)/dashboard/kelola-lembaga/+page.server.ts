import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	assertFeature,
	assertLoggedIn,
	assertOrgMember,
	assertOrgRoleAllowed
} from '$lib/server/auth/rbac';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { listTarawihSchedule } from '$lib/server/tarawih';
import { listOrgAssets } from '$lib/server/org-assets';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);
const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const requireOrgContext = async (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const orgId = assertOrgMember(user);
	const { isSystemAdmin } = getOrgScope(user);
	const role = user.role ?? '';
	if (!isSystemAdmin && !allowedRoles.has(role)) {
		throw error(403, 'Tidak memiliki akses');
	}

	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertOrgRoleAllowed(org.type, role);
	if (org.type !== 'masjid' && org.type !== 'musholla') {
		throw error(400, 'Fitur ini hanya untuk masjid atau musholla');
	}

	return { db: locals.db, orgId, user, org, role };
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw redirect(302, '/dashboard');

	if (user.role === 'SUPER_ADMIN') {
		const { results } = await locals.db!
			.prepare(
				`SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
				 FROM organizations
				 ORDER BY created_at DESC`
			)
			.all();

		return {
			mode: 'super',
			orgs: results ?? [],
			org: null,
			assets: [],
			tarawihSchedule: [],
			nextTarawihUrut: 1
		};
	}

	const { orgId, org } = await requireOrgContext(locals);

	const assets = await listOrgAssets(locals.db, orgId);
	const tarawihSchedule = await listTarawihSchedule(locals.db, orgId);
	let nextTarawihUrut = 1;
	for (const row of tarawihSchedule) {
		if (row.urut >= nextTarawihUrut) {
			nextTarawihUrut = row.urut + 1;
		}
	}

	return {
		mode: 'org',
		org,
		orgs: [],
		assets,
		tarawihSchedule,
		nextTarawihUrut
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!
			.prepare('UPDATE organizations SET status = ? WHERE id = ?')
			.bind('active', orgId)
			.run();

		return { success: true };
	},
	reject: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!
			.prepare('UPDATE organizations SET status = ? WHERE id = ?')
			.bind('rejected', orgId)
			.run();

		return { success: true };
	},
	remove: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!.prepare('DELETE FROM users WHERE org_id = ?').bind(orgId).run();
		await locals.db!.prepare('DELETE FROM organizations WHERE id = ?').bind(orgId).run();

		return { success: true };
	},
	addAsset: async ({ request, locals }) => {
		const { db, orgId, user } = await requireOrgContext(locals);

		const data = await request.formData();
		const name = `${data.get('name') ?? ''}`.trim();
		const category = `${data.get('category') ?? ''}`.trim();
		const quantityRaw = `${data.get('quantity') ?? ''}`.trim();
		const condition = `${data.get('condition') ?? ''}`.trim();
		const location = `${data.get('location') ?? ''}`.trim();
		const notes = `${data.get('notes') ?? ''}`.trim();
		const acquiredAtRaw = `${data.get('acquiredAt') ?? ''}`.trim();

		const quantity = Number(quantityRaw);
		const acquiredAt = acquiredAtRaw || null;
		const parsedDate = acquiredAt ? Date.parse(`${acquiredAt}T00:00:00`) : null;

		if (!name) return fail(400, { error: 'Nama aset wajib diisi' });
		if (!Number.isFinite(quantity) || quantity <= 0) {
			return fail(400, { error: 'Jumlah harus lebih dari 0' });
		}
		if (acquiredAt && !Number.isFinite(parsedDate)) {
			return fail(400, { error: 'Tanggal perolehan tidak valid' });
		}

		try {
			await db
				.prepare(
					`INSERT INTO org_assets (id, organization_id, name, category, quantity, condition, location, notes, acquired_at, created_by, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					crypto.randomUUID(),
					orgId,
					name,
					category || null,
					Math.floor(quantity),
					condition || null,
					location || null,
					notes || null,
					acquiredAt,
					user.id,
					Date.now()
				)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel aset belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	updateAsset: async ({ request, locals }) => {
		const { db, orgId } = await requireOrgContext(locals);

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		const name = `${data.get('name') ?? ''}`.trim();
		const category = `${data.get('category') ?? ''}`.trim();
		const quantityRaw = `${data.get('quantity') ?? ''}`.trim();
		const condition = `${data.get('condition') ?? ''}`.trim();
		const location = `${data.get('location') ?? ''}`.trim();
		const notes = `${data.get('notes') ?? ''}`.trim();
		const acquiredAtRaw = `${data.get('acquiredAt') ?? ''}`.trim();

		const quantity = Number(quantityRaw);
		const acquiredAt = acquiredAtRaw || null;
		const parsedDate = acquiredAt ? Date.parse(`${acquiredAt}T00:00:00`) : null;

		if (!id) return fail(400, { error: 'Aset tidak ditemukan' });
		if (!name) return fail(400, { error: 'Nama aset wajib diisi' });
		if (!Number.isFinite(quantity) || quantity <= 0) {
			return fail(400, { error: 'Jumlah harus lebih dari 0' });
		}
		if (acquiredAt && !Number.isFinite(parsedDate)) {
			return fail(400, { error: 'Tanggal perolehan tidak valid' });
		}

		let result;
		try {
			result = await db
				.prepare(
					`UPDATE org_assets
					 SET name = ?, category = ?, quantity = ?, condition = ?, location = ?, notes = ?, acquired_at = ?
					 WHERE id = ? AND organization_id = ?`
				)
				.bind(
					name,
					category || null,
					Math.floor(quantity),
					condition || null,
					location || null,
					notes || null,
					acquiredAt,
					id,
					orgId
				)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel aset belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		if ((result?.meta?.changes ?? 0) === 0) {
			return fail(404, { error: 'Aset tidak ditemukan' });
		}

		return { success: true };
	},
	deleteAsset: async ({ request, locals }) => {
		const { db, orgId } = await requireOrgContext(locals);

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		if (!id) {
			return fail(400, { error: 'Aset tidak valid' });
		}

		let result;
		try {
			result = await db
				.prepare('DELETE FROM org_assets WHERE id = ? AND organization_id = ?')
				.bind(id, orgId)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel aset belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		if ((result?.meta?.changes ?? 0) === 0) {
			return fail(404, { error: 'Aset tidak ditemukan' });
		}

		return { success: true };
	},
	addTarawih: async ({ request, locals }) => {
		const { db, orgId, role, org, user } = await requireOrgContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const urutRaw = `${data.get('urut') ?? ''}`.trim();
		const hari = `${data.get('hari') ?? ''}`.trim();
		const tanggal = `${data.get('tanggal') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const bilal = `${data.get('bilal') ?? ''}`.trim();

		const urut = Number(urutRaw);
		if (!Number.isFinite(urut) || urut < 1 || !Number.isInteger(urut)) {
			return fail(400, { error: 'Nomor urut harus angka bulat' });
		}
		if (!hari || !tanggal || !imam) {
			return fail(400, { error: 'Data jadwal belum lengkap' });
		}

		try {
			const existing = await db
				.prepare('SELECT id FROM jadwal_tarawih WHERE organization_id = ? AND urut = ?')
				.bind(orgId, Math.floor(urut))
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Nomor urut sudah digunakan' });
			}

			await db
				.prepare(
					`INSERT INTO jadwal_tarawih (id, organization_id, urut, hari, tanggal, imam, bilal, created_by, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					crypto.randomUUID(),
					orgId,
					Math.floor(urut),
					hari,
					tanggal,
					imam,
					bilal || null,
					user.id,
					Date.now()
				)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal tarawih belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	updateTarawih: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireOrgContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		const urutRaw = `${data.get('urut') ?? ''}`.trim();
		const hari = `${data.get('hari') ?? ''}`.trim();
		const tanggal = `${data.get('tanggal') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const bilal = `${data.get('bilal') ?? ''}`.trim();

		const urut = Number(urutRaw);
		if (!id) {
			return fail(400, { error: 'Jadwal tidak ditemukan' });
		}
		if (!Number.isFinite(urut) || urut < 1 || !Number.isInteger(urut)) {
			return fail(400, { error: 'Nomor urut harus angka bulat' });
		}
		if (!hari || !tanggal || !imam) {
			return fail(400, { error: 'Data jadwal belum lengkap' });
		}

		try {
			const existing = await db
				.prepare(
					'SELECT id FROM jadwal_tarawih WHERE organization_id = ? AND urut = ? AND id != ?'
				)
				.bind(orgId, Math.floor(urut), id)
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Nomor urut sudah digunakan' });
			}

			const result = await db
				.prepare(
					`UPDATE jadwal_tarawih
					 SET urut = ?, hari = ?, tanggal = ?, imam = ?, bilal = ?, updated_at = ?
					 WHERE id = ? AND organization_id = ?`
				)
				.bind(
					Math.floor(urut),
					hari,
					tanggal,
					imam,
					bilal || null,
					Date.now(),
					id,
					orgId
				)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal tarawih belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	deleteTarawih: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireOrgContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		if (!id) {
			return fail(400, { error: 'Jadwal tidak valid' });
		}

		try {
			const result = await db
				.prepare('DELETE FROM jadwal_tarawih WHERE id = ? AND organization_id = ?')
				.bind(id, orgId)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal tarawih belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	}
};
