import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	assertFeature,
	assertLoggedIn,
	assertOrgMember,
	assertOrgRoleAllowed
} from '$lib/server/auth/rbac';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);
const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const safeAll = async <T>(promise: Promise<{ results: T[] | null | undefined }>) => {
	try {
		const { results } = await promise;
		return (results ?? []) as T[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	const { isSystemAdmin } = getOrgScope(user);
	const role = user.role ?? '';
	if (!isSystemAdmin && !allowedRoles.has(role)) {
		throw error(403, 'Tidak memiliki akses');
	}
	assertOrgRoleAllowed(org.type, role);
	assertFeature(org.type, user.role, 'kas_masjid');
	if (org.type !== 'masjid' && org.type !== 'musholla') {
		throw error(400, 'Fitur keuangan hanya untuk masjid atau musholla');
	}

	const kasSummary = { masuk: 0, keluar: 0, saldo: 0 };
	const kasSummaryRows = await safeAll(
		locals.db
			.prepare(
				`SELECT tipe,
					SUM(nominal) as totalNominal
				 FROM kas_masjid
				 WHERE organization_id = ?
				 GROUP BY tipe`
			)
			.bind(orgId)
			.all<{ tipe: string; totalNominal: number | null }>()
	);
	for (const row of kasSummaryRows ?? []) {
		const nominal = row.totalNominal ?? 0;
		if (row.tipe === 'masuk') {
			kasSummary.masuk = nominal;
		} else if (row.tipe === 'keluar') {
			kasSummary.keluar = nominal;
		}
	}
	kasSummary.saldo = kasSummary.masuk - kasSummary.keluar;

	const kasEntries = await safeAll(
		locals.db
			.prepare(
				`SELECT id,
					tanggal,
					tipe,
					kategori,
					keterangan,
					nominal,
					created_at as createdAt
				 FROM kas_masjid
				 WHERE organization_id = ?
				 ORDER BY tanggal DESC, created_at DESC
				 LIMIT 50`
			)
			.bind(orgId)
			.all<{
				id: string;
				tanggal: number;
				tipe: string;
				kategori: string;
				keterangan: string | null;
				nominal: number;
				createdAt: number;
			}>()
	);

	return { org, kasSummary, kasEntries };
};

export const actions: Actions = {
	addKas: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const orgId = assertOrgMember(user);
		const { isSystemAdmin } = getOrgScope(user);
		const role = user.role ?? '';
		if (!isSystemAdmin && !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationById(locals.db, orgId);
		if (!org) {
			return fail(404, { error: 'Lembaga tidak ditemukan' });
		}
		assertOrgRoleAllowed(org.type, role);
		assertFeature(org.type, role, 'kas_masjid');
		if (org.type !== 'masjid' && org.type !== 'musholla') {
			return fail(400, { error: 'Fitur keuangan hanya untuk masjid atau musholla' });
		}

		const data = await request.formData();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const tipe = `${data.get('tipe') ?? ''}`.trim();
		const kategori = `${data.get('kategori') ?? ''}`.trim();
		const keterangan = `${data.get('keterangan') ?? ''}`.trim();
		const nominalRaw = `${data.get('nominal') ?? ''}`.trim();

		const nominal = Number(nominalRaw);
		const tanggalValue = Date.parse(`${tanggalRaw}T00:00:00`);

		if (!tanggalRaw || !Number.isFinite(tanggalValue)) {
			return fail(400, { error: 'Tanggal tidak valid' });
		}
		if (tipe !== 'masuk' && tipe !== 'keluar') {
			return fail(400, { error: 'Tipe transaksi tidak valid' });
		}
		if (!kategori) {
			return fail(400, { error: 'Kategori wajib diisi' });
		}
		if (!Number.isFinite(nominal) || nominal <= 0) {
			return fail(400, { error: 'Nominal harus lebih dari 0' });
		}

		await locals.db
			.prepare(
				`INSERT INTO kas_masjid (id, organization_id, tanggal, tipe, kategori, keterangan, nominal, created_by, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				crypto.randomUUID(),
				orgId,
				tanggalValue,
				tipe,
				kategori,
				keterangan || null,
				nominal,
				user.id,
				Date.now()
			)
			.run();

		return { success: true };
	},

	updateKas: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const orgId = assertOrgMember(user);
		const { isSystemAdmin } = getOrgScope(user);
		const role = user.role ?? '';
		if (!isSystemAdmin && !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationById(locals.db, orgId);
		if (!org) {
			return fail(404, { error: 'Lembaga tidak ditemukan' });
		}
		assertOrgRoleAllowed(org.type, role);
		assertFeature(org.type, role, 'kas_masjid');
		if (org.type !== 'masjid' && org.type !== 'musholla') {
			return fail(400, { error: 'Fitur keuangan hanya untuk masjid atau musholla' });
		}

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const tipe = `${data.get('tipe') ?? ''}`.trim();
		const kategori = `${data.get('kategori') ?? ''}`.trim();
		const keterangan = `${data.get('keterangan') ?? ''}`.trim();
		const nominalRaw = `${data.get('nominal') ?? ''}`.trim();

		if (!id) {
			return fail(400, { error: 'Transaksi tidak ditemukan' });
		}

		const nominal = Number(nominalRaw);
		const tanggalValue = Date.parse(`${tanggalRaw}T00:00:00`);

		if (!tanggalRaw || !Number.isFinite(tanggalValue)) {
			return fail(400, { error: 'Tanggal tidak valid' });
		}
		if (tipe !== 'masuk' && tipe !== 'keluar') {
			return fail(400, { error: 'Tipe transaksi tidak valid' });
		}
		if (!kategori) {
			return fail(400, { error: 'Kategori wajib diisi' });
		}
		if (!Number.isFinite(nominal) || nominal <= 0) {
			return fail(400, { error: 'Nominal harus lebih dari 0' });
		}

		const result = await locals.db
			.prepare(
				`UPDATE kas_masjid
				 SET tanggal = ?, tipe = ?, kategori = ?, keterangan = ?, nominal = ?
				 WHERE id = ? AND organization_id = ?`
			)
			.bind(tanggalValue, tipe, kategori, keterangan || null, nominal, id, orgId)
			.run();

		if ((result?.meta?.changes ?? 0) === 0) {
			return fail(404, { error: 'Transaksi tidak ditemukan' });
		}

		return { success: true };
	},

	deleteKas: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const orgId = assertOrgMember(user);
		const { isSystemAdmin } = getOrgScope(user);
		const role = user.role ?? '';
		if (!isSystemAdmin && !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationById(locals.db, orgId);
		if (!org) {
			return fail(404, { error: 'Lembaga tidak ditemukan' });
		}
		assertOrgRoleAllowed(org.type, role);
		assertFeature(org.type, role, 'kas_masjid');
		if (org.type !== 'masjid' && org.type !== 'musholla') {
			return fail(400, { error: 'Fitur keuangan hanya untuk masjid atau musholla' });
		}

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		if (!id) {
			return fail(400, { error: 'Transaksi tidak valid' });
		}

		const result = await locals.db
			.prepare('DELETE FROM kas_masjid WHERE id = ? AND organization_id = ?')
			.bind(id, orgId)
			.run();

		if ((result?.meta?.changes ?? 0) === 0) {
			return fail(404, { error: 'Transaksi tidak ditemukan' });
		}

		return { success: true };
	}
};
