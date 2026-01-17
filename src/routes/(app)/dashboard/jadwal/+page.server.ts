import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	assertFeature,
	assertLoggedIn,
	assertOrgMember,
	assertOrgRoleAllowed
} from '$lib/server/auth/rbac';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { listTarawihSchedule } from '$lib/server/tarawih';
import { listImamSchedule } from '$lib/server/jadwal-imam';
import { listKhotibSchedule } from '$lib/server/jadwal-khotib';
import * as XLSX from 'xlsx';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);
const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const getDayName = (isoDate: string) => {
	const [year, month, day] = isoDate.split('-').map(Number);
	if (!year || !month || !day) return null;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (Number.isNaN(date.getTime())) return null;
	return dayNames[date.getUTCDay()] ?? null;
};

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

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const pickMapValue = (map: Map<string, unknown>, keys: string[]) => {
	for (const key of keys) {
		if (map.has(key)) return map.get(key);
	}
	return null;
};

const dateKeys = ['tanggal', 'tgl', 'date'];
const dayKeys = ['hari', 'day'];
const timeKeys = ['waktu', 'sholat', 'shalat', 'salat', 'waktusholat', 'waktusalat'];
const imamKeys = ['imam'];
const noteKeys = ['catatan', 'keterangan', 'notes', 'note'];

const requireScheduleContext = async (locals: App.Locals) => {
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
	const { db, orgId, org } = await requireScheduleContext(locals);

	const [tarawihSchedule, imamSchedule, khotibSchedule] = await Promise.all([
		listTarawihSchedule(db, orgId),
		listImamSchedule(db, orgId),
		listKhotibSchedule(db, orgId)
	]);

	let nextTarawihUrut = 1;
	for (const row of tarawihSchedule) {
		if (row.urut >= nextTarawihUrut) {
			nextTarawihUrut = row.urut + 1;
		}
	}

	return {
		org,
		imamSchedule,
		khotibSchedule,
		tarawihSchedule,
		nextTarawihUrut
	};
};

export const actions: Actions = {
	addImam: async ({ request, locals }) => {
		const { db, orgId, role, org, user } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const waktu = `${data.get('waktu') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const catatan = `${data.get('catatan') ?? ''}`.trim();

		const tanggal = normalizeDateInput(tanggalRaw);
		if (!tanggal) return fail(400, { error: 'Tanggal tidak valid' });
		if (!waktu || !imam) return fail(400, { error: 'Data jadwal belum lengkap' });

		const hari = getDayName(tanggal);

		try {
			const existing = await db
				.prepare(
					'SELECT id FROM jadwal_imam WHERE organization_id = ? AND tanggal = ? AND waktu = ?'
				)
				.bind(orgId, tanggal, waktu)
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Jadwal sudah ada untuk tanggal dan waktu ini' });
			}

			await db
				.prepare(
					`INSERT INTO jadwal_imam (id, organization_id, tanggal, hari, waktu, imam, catatan, created_by, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					crypto.randomUUID(),
					orgId,
					tanggal,
					hari,
					waktu,
					imam,
					catatan || null,
					user.id,
					Date.now()
				)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal imam belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	updateImam: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const waktu = `${data.get('waktu') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const catatan = `${data.get('catatan') ?? ''}`.trim();

		if (!id) return fail(400, { error: 'Jadwal tidak ditemukan' });

		const tanggal = normalizeDateInput(tanggalRaw);
		if (!tanggal) return fail(400, { error: 'Tanggal tidak valid' });
		if (!waktu || !imam) return fail(400, { error: 'Data jadwal belum lengkap' });

		const hari = getDayName(tanggal);

		try {
			const existing = await db
				.prepare(
					'SELECT id FROM jadwal_imam WHERE organization_id = ? AND tanggal = ? AND waktu = ? AND id != ?'
				)
				.bind(orgId, tanggal, waktu, id)
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Jadwal sudah ada untuk tanggal dan waktu ini' });
			}

			const result = await db
				.prepare(
					`UPDATE jadwal_imam
					 SET tanggal = ?, hari = ?, waktu = ?, imam = ?, catatan = ?, updated_at = ?
					 WHERE id = ? AND organization_id = ?`
				)
				.bind(tanggal, hari, waktu, imam, catatan || null, Date.now(), id, orgId)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal imam belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	deleteImam: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		if (!id) {
			return fail(400, { error: 'Jadwal tidak valid' });
		}

		try {
			const result = await db
				.prepare('DELETE FROM jadwal_imam WHERE id = ? AND organization_id = ?')
				.bind(id, orgId)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal imam belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	importImam: async ({ request, locals }) => {
		const { db, orgId, role, org, user } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

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
			console.error('Import jadwal imam error', err);
			return fail(400, { error: 'File Excel tidak dapat dibaca' });
		}

		const items: {
			tanggal: string;
			hari: string | null;
			waktu: string;
			imam: string;
			catatan: string | null;
		}[] = [];

		for (const row of rows) {
			const map = new Map<string, unknown>();
			for (const [key, value] of Object.entries(row)) {
				const normalized = normalizeHeader(key);
				if (normalized) map.set(normalized, value);
			}

			const tanggal = normalizeDateValue(pickMapValue(map, dateKeys));
			const hariRaw = `${pickMapValue(map, dayKeys) ?? ''}`.trim();
			const waktu = `${pickMapValue(map, timeKeys) ?? ''}`.trim();
			const imam = `${pickMapValue(map, imamKeys) ?? ''}`.trim();
			const catatan = `${pickMapValue(map, noteKeys) ?? ''}`.trim();

			if (!tanggal || !waktu || !imam) {
				continue;
			}

			items.push({
				tanggal,
				hari: hariRaw || getDayName(tanggal),
				waktu,
				imam,
				catatan: catatan || null
			});
		}

		if (items.length === 0) {
			return fail(400, { error: 'Tidak ada data valid di file Excel' });
		}

		const now = Date.now();
		try {
			await db.batch(
				items.map((item) =>
					db
						.prepare(
							`INSERT INTO jadwal_imam (id, organization_id, tanggal, hari, waktu, imam, catatan, created_by, created_at, updated_at)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
							 ON CONFLICT(organization_id, tanggal, waktu) DO UPDATE SET
							   hari = excluded.hari,
							   imam = excluded.imam,
							   catatan = excluded.catatan,
							   updated_at = excluded.updated_at`
						)
						.bind(
							crypto.randomUUID(),
							orgId,
							item.tanggal,
							item.hari,
							item.waktu,
							item.imam,
							item.catatan,
							user.id,
							now,
							now
						)
				)
			);
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal imam belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	addTarawih: async ({ request, locals }) => {
		const { db, orgId, role, org, user } = await requireScheduleContext(locals);
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
		const { db, orgId, role, org } = await requireScheduleContext(locals);
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
				.bind(Math.floor(urut), hari, tanggal, imam, bilal || null, Date.now(), id, orgId)
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
		const { db, orgId, role, org } = await requireScheduleContext(locals);
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
	},
	addKhotib: async ({ request, locals }) => {
		const { db, orgId, role, org, user } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const khotib = `${data.get('khotib') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const catatan = `${data.get('catatan') ?? ''}`.trim();

		const tanggal = normalizeDateInput(tanggalRaw);
		if (!tanggal) return fail(400, { error: 'Tanggal tidak valid' });
		if (!khotib) return fail(400, { error: 'Nama khotib wajib diisi' });

		const hari = getDayName(tanggal) ?? 'Jumat';

		try {
			const existing = await db
				.prepare('SELECT id FROM jadwal_khotib_jumat WHERE organization_id = ? AND tanggal = ?')
				.bind(orgId, tanggal)
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Jadwal khotib untuk tanggal ini sudah ada' });
			}

			await db
				.prepare(
					`INSERT INTO jadwal_khotib_jumat (id, organization_id, tanggal, hari, khotib, imam, catatan, created_by, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					crypto.randomUUID(),
					orgId,
					tanggal,
					hari,
					khotib,
					imam || null,
					catatan || null,
					user.id,
					Date.now()
				)
				.run();
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal khotib belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	updateKhotib: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const khotib = `${data.get('khotib') ?? ''}`.trim();
		const imam = `${data.get('imam') ?? ''}`.trim();
		const catatan = `${data.get('catatan') ?? ''}`.trim();

		if (!id) return fail(400, { error: 'Jadwal tidak ditemukan' });
		const tanggal = normalizeDateInput(tanggalRaw);
		if (!tanggal) return fail(400, { error: 'Tanggal tidak valid' });
		if (!khotib) return fail(400, { error: 'Nama khotib wajib diisi' });

		const hari = getDayName(tanggal) ?? 'Jumat';

		try {
			const existing = await db
				.prepare(
					'SELECT id FROM jadwal_khotib_jumat WHERE organization_id = ? AND tanggal = ? AND id != ?'
				)
				.bind(orgId, tanggal, id)
				.first<{ id: string }>();
			if (existing) {
				return fail(400, { error: 'Jadwal khotib untuk tanggal ini sudah ada' });
			}

			const result = await db
				.prepare(
					`UPDATE jadwal_khotib_jumat
					 SET tanggal = ?, hari = ?, khotib = ?, imam = ?, catatan = ?, updated_at = ?
					 WHERE id = ? AND organization_id = ?`
				)
				.bind(tanggal, hari, khotib, imam || null, catatan || null, Date.now(), id, orgId)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal khotib belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	deleteKhotib: async ({ request, locals }) => {
		const { db, orgId, role, org } = await requireScheduleContext(locals);
		assertFeature(org.type, role, 'jadwal_kegiatan');

		const data = await request.formData();
		const id = `${data.get('id') ?? ''}`.trim();
		if (!id) {
			return fail(400, { error: 'Jadwal tidak valid' });
		}

		try {
			const result = await db
				.prepare('DELETE FROM jadwal_khotib_jumat WHERE id = ? AND organization_id = ?')
				.bind(id, orgId)
				.run();

			if ((result?.meta?.changes ?? 0) === 0) {
				return fail(404, { error: 'Jadwal tidak ditemukan' });
			}
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel jadwal khotib belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	}
};
