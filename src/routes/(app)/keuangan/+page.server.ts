import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	assertFeature,
	assertLoggedIn,
	assertOrgMember,
	assertOrgRoleAllowed
} from '$lib/server/auth/rbac';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import * as XLSX from 'xlsx';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);
const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const pickMapValue = (map: Map<string, unknown>, keys: string[]) => {
	for (const key of keys) {
		if (map.has(key)) return map.get(key);
	}
	return null;
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const normalizeDateInput = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
	const match = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
	if (!match) return null;
	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);
	if (!year || !month || !day) return null;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (Number.isNaN(date.getTime())) return null;
	return toISODate(date);
};

const normalizeDateValue = (value: unknown) => {
	if (!value) return null;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : toISODate(value);
	}
	if (typeof value === 'number') {
		const parsed = XLSX.SSF.parse_date_code(value);
		if (!parsed) return null;
		const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
		return Number.isNaN(date.getTime()) ? null : toISODate(date);
	}
	if (typeof value === 'string') {
		return normalizeDateInput(value);
	}
	return null;
};

const parseAmount = (value: unknown) => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	const cleaned = `${value ?? ''}`.replace(/[^0-9.-]/g, '');
	if (!cleaned) return null;
	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
};

const normalizeKasType = (value: string) => {
	const lower = value.trim().toLowerCase();
	if (!lower) return null;
	if (lower.includes('masuk') || lower.includes('pemasukan') || lower === 'in' || lower === 'debit') {
		return 'masuk';
	}
	if (lower.includes('keluar') || lower.includes('pengeluaran') || lower === 'out' || lower === 'kredit') {
		return 'keluar';
	}
	return null;
};

const kasDateKeys = ['tanggal', 'tgl', 'date'];
const kasTypeKeys = ['tipe', 'type', 'jenis'];
const kasCategoryKeys = ['kategori', 'category', 'cat'];
const kasNominalKeys = ['nominal', 'jumlah', 'amount', 'nilai'];
const kasNoteKeys = ['keterangan', 'catatan', 'notes', 'note', 'deskripsi'];

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
	importKas: async ({ request, locals }) => {
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
		const file = data.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'File Excel wajib diunggah' });
		}

		let rows: Record<string, unknown>[] = [];
		try {
			const buffer = await file.arrayBuffer();
			const workbook = XLSX.read(buffer, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			const sheet = sheetName ? workbook.Sheets[sheetName] : null;
			if (!sheet) {
				return fail(400, { error: 'Sheet Excel tidak ditemukan' });
			}
			rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true }) as Record<
				string,
				unknown
			>[];
		} catch (err) {
			console.error('Import kas error', err);
			return fail(400, { error: 'File Excel tidak dapat dibaca' });
		}

		const items: {
			tanggal: number;
			tipe: string;
			kategori: string;
			keterangan: string | null;
			nominal: number;
		}[] = [];

		for (const row of rows) {
			const map = new Map<string, unknown>();
			for (const [key, value] of Object.entries(row)) {
				const normalized = normalizeHeader(key);
				if (normalized) map.set(normalized, value);
			}

			const tanggalIso = normalizeDateValue(pickMapValue(map, kasDateKeys));
			const tipeRaw = `${pickMapValue(map, kasTypeKeys) ?? ''}`;
			const kategori = `${pickMapValue(map, kasCategoryKeys) ?? ''}`.trim();
			const nominal = parseAmount(pickMapValue(map, kasNominalKeys));
			const keterangan = `${pickMapValue(map, kasNoteKeys) ?? ''}`.trim();

			const tipe = normalizeKasType(tipeRaw);
			if (!tanggalIso || !tipe || !kategori || !Number.isFinite(nominal ?? NaN) || (nominal ?? 0) <= 0) {
				continue;
			}

			const tanggalValue = Date.parse(`${tanggalIso}T00:00:00`);
			if (!Number.isFinite(tanggalValue)) {
				continue;
			}

			items.push({
				tanggal: tanggalValue,
				tipe,
				kategori,
				keterangan: keterangan || null,
				nominal: nominal ?? 0
			});
		}

		if (items.length === 0) {
			return fail(400, { error: 'Tidak ada data valid di file Excel' });
		}

		const now = Date.now();
		try {
			await locals.db.batch(
				items.map((item) =>
					locals.db!
						.prepare(
							`INSERT INTO kas_masjid (id, organization_id, tanggal, tipe, kategori, keterangan, nominal, created_by, created_at)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
						)
						.bind(
							crypto.randomUUID(),
							orgId,
							item.tanggal,
							item.tipe,
							item.kategori,
							item.keterangan,
							item.nominal,
							user.id,
							now
						)
				)
			);
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel kas belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
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
