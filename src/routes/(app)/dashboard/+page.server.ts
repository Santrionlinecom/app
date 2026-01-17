import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPendingSubmissions, getAllStudentsProgress, getSantriChecklist, getSantriStats, getDailySeries } from '$lib/server/progress';
import { getSantriTeacherId, listOrgTeachers } from '$lib/server/santri-ustadz';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import type { D1Database } from '@cloudflare/workers-types';
import { SURAH_DATA } from '$lib/surah-data';
import { getOrgFinanceSummary } from '$lib/server/ummah';
import { isCommunityOrgType, isEducationalOrgType } from '$lib/server/utils';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';
import { assertLoggedIn, assertOrgMember, assertOrgRoleAllowed } from '$lib/server/auth/rbac';
import { listOrgAssets } from '$lib/server/org-assets';
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

const parseInteger = (value: unknown) => {
	if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
	const cleaned = `${value ?? ''}`.replace(/[^0-9.-]/g, '');
	if (!cleaned) return null;
	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? Math.floor(parsed) : null;
};

const assetNameKeys = ['name', 'nama', 'aset', 'asset'];
const assetCategoryKeys = ['category', 'kategori'];
const assetQuantityKeys = ['quantity', 'jumlah', 'qty', 'unit'];
const assetConditionKeys = ['condition', 'kondisi'];
const assetLocationKeys = ['location', 'lokasi'];
const assetNotesKeys = ['notes', 'catatan', 'keterangan'];
const assetDateKeys = ['acquiredat', 'acquired', 'tanggal', 'tgl', 'date', 'perolehan', 'tanggalperolehan'];

const fetchSurahs = async (db: D1Database) => {
	// Coba beberapa variasi kolom agar tidak error jika skema lama berbeda (prioritas pakai "nama","total_ayat")
	const queries = [
		'SELECT number, nama as name, total_ayat as total_ayah FROM surah ORDER BY number',
		'SELECT number, name as name, COALESCE(total_ayah, totalAyat, total_ayat) as total_ayah FROM surah ORDER BY number'
	];
	for (const q of queries) {
		try {
			const { results } = await db
				.prepare(q)
				.all<{ number: number; name: string; total_ayah: number }>();
			const rows = (results ?? []).filter((r) => r.number != null);
			if (rows.length) return rows as { number: number; name: string; total_ayah: number }[];
		} catch (err) {
			// lanjut ke query berikutnya
		}
	}
	// fallback ke SURAH_DATA jika tabel tidak lengkap
	return SURAH_DATA.map((s) => ({
		number: s.number,
		name: s.name,
		total_ayah: s.totalAyah
	}));
};

const fetchKasWeeklyIn = async (db: D1Database, orgId: string) => {
	const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
	const { results } = await db
		.prepare(
			`SELECT SUM(nominal) as totalNominal
			 FROM kas_masjid
			 WHERE organization_id = ? AND tipe = 'masuk' AND tanggal >= ?`
		)
		.bind(orgId, weekStart)
		.all<{ totalNominal: number | null }>();
	return results?.[0]?.totalNominal ?? 0;
};

type CommunityScheduleItem = {
	id: string;
	title: string;
	content: string | null;
	eventDate: string;
	createdAt: number;
};

const fetchCommunitySchedule = async (
	db: D1Database,
	user: { id: string; role: string },
	orgId: string | null,
	isSystemAdmin: boolean
) => {
	const start = new Date();
	const end = new Date();
	end.setDate(end.getDate() + 14);
	const startDate = toISODate(start);
	const endDate = toISODate(end);

	const baseSelect = `SELECT cn.id,
		cn.title,
		cn.content,
		cn.event_date as eventDate,
		cn.created_at as createdAt
	FROM calendar_notes cn`;
	const conditions = ['cn.event_date BETWEEN ? AND ?'];
	const params: (string | number)[] = [startDate, endDate];

	let query = `${baseSelect} WHERE ${conditions.join(' AND ')}`;
	if (user.role === 'admin' && !isSystemAdmin && orgId) {
		query = `${baseSelect} JOIN users u ON u.id = cn.user_id WHERE ${conditions.join(' AND ')} AND u.org_id = ?`;
		params.push(orgId);
	} else if (user.role !== 'admin') {
		query = `${baseSelect} WHERE ${conditions.join(' AND ')} AND cn.user_id = ?`;
		params.push(user.id);
	}

	const { results } = await db
		.prepare(`${query} ORDER BY cn.event_date ASC, cn.created_at ASC LIMIT 5`)
		.bind(...params)
		.all<CommunityScheduleItem>();

	return results ?? [];
};

const requireCommunityContext = async (locals: App.Locals) => {
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

const loadCommunityManagerData = async (db: D1Database, orgId: string) => {
	const assets = await listOrgAssets(db, orgId);
	return { assets };
};

export const load: PageServerLoad = async ({ locals, request, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (locals.user.role === 'SUPER_ADMIN') {
		throw redirect(302, '/admin/super/overview');
	}

	const db = locals.db!;
	const user = locals.user;
	const role = user.role;
	logSystemActivity(db, 'VIEW_PAGE', {
		userId: user.id,
		userEmail: user.email ?? null,
		ipAddress: getRequestIp(request),
		metadata: { path: '/dashboard', role },
		waitUntil: platform?.context?.waitUntil
	});
	const { orgId, isSystemAdmin } = getOrgScope(user);
	const scopedOrgId = isSystemAdmin ? null : orgId;
	const orgProfile = orgId ? await getOrganizationById(db, orgId) : null;
	const orgType = orgProfile?.type ?? null;
	const isEducationalOrg = isEducationalOrgType(orgType);
	const isCommunityOrg = isCommunityOrgType(orgType);
	const isCommunityMember = isCommunityOrg || role === 'jamaah';
	const canManageCommunity = isCommunityOrg && allowedRoles.has(role);
	const communityManagerData =
		canManageCommunity && orgId
			? await loadCommunityManagerData(db, orgId)
			: { assets: [] };

	const loadCommunityWidgets = async () => {
		if (!isCommunityMember || !orgId) {
			return { finance: null, kasWeeklyIn: 0, communitySchedule: [] as CommunityScheduleItem[] };
		}
		try {
			const [finance, kasWeeklyIn, communitySchedule] = await Promise.all([
				getOrgFinanceSummary(db, orgId),
				fetchKasWeeklyIn(db, orgId),
				fetchCommunitySchedule(db, user, orgId, isSystemAdmin)
			]);
			return { finance, kasWeeklyIn, communitySchedule };
		} catch (err) {
			console.error('dashboard community widgets error', err);
			return { finance: null, kasWeeklyIn: 0, communitySchedule: [] as CommunityScheduleItem[] };
		}
	};

	// Load data based on user role
	if (role === 'admin' || role === 'SUPER_ADMIN') {
		// Admin: list all users + santri & surah options
		const baseQuery = 'SELECT id, username, email, role, created_at FROM users';
		const { results } = await (scopedOrgId
			? db.prepare(`${baseQuery} WHERE org_id = ? ORDER BY created_at DESC`).bind(scopedOrgId)
			: db.prepare(`${baseQuery} ORDER BY created_at DESC`)
		).all<{ id: string; username: string | null; email: string; role: string; created_at: string }>();

		let orgs: Array<{
			id: string;
			type: string;
			name: string;
			slug: string;
			status: string;
			createdAt: number;
		}> = [];
		if (role === 'SUPER_ADMIN') {
			const { results: orgResults } = await db
				.prepare(
					`SELECT id, type, name, slug, status, created_at as createdAt
					 FROM organizations
					 ORDER BY created_at DESC`
				)
				.all();
			orgs = (orgResults ?? []) as typeof orgs;
		}

		const basePayload = {
			role,
			currentUser: locals.user,
			org: orgProfile,
			isEducationalOrg,
			isCommunityOrg,
			users: (results ?? []) as {
				id: string;
				username: string | null;
				email: string;
				role: string;
				created_at: string;
			}[]
		};

		if (isCommunityOrg) {
			const communityWidgets = await loadCommunityWidgets();
			return {
				...basePayload,
				orgs,
				canManageCommunity,
				...communityWidgets,
				...communityManagerData
			};
		}

		const surahs = await fetchSurahs(db);
		return {
			...basePayload,
			surahs,
			orgs,
			canManageCommunity,
			...communityManagerData,
			students: await getAllStudentsProgress(db, { orgId: scopedOrgId }),
			pending: await getPendingSubmissions(db, { orgId: scopedOrgId })
		};
	} else if (role === 'ustadz' || role === 'ustadzah') {
		// Ustadz: pending submissions and student progress
		if (isCommunityOrg) {
			const communityWidgets = await loadCommunityWidgets();
			return {
				role,
				currentUser: locals.user,
				org: orgProfile,
				isEducationalOrg,
				isCommunityOrg,
				canManageCommunity,
				...communityWidgets,
				...communityManagerData
			};
		}

		const surahs = await fetchSurahs(db);
		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			isEducationalOrg,
			isCommunityOrg,
			canManageCommunity,
			...communityManagerData,
			pending: await getPendingSubmissions(db, { orgId: scopedOrgId, ustadzId: locals.user.id }),
			students: await getAllStudentsProgress(db, { orgId: scopedOrgId, ustadzId: locals.user.id }),
			surahs
		};
	} else if (role === 'santri' || role === 'alumni') {
		// Santri/Alumni: personal progress and checklist
		const checklist = await getSantriChecklist(db, locals.user.id);
		const stats = await getSantriStats(db, locals.user.id);
		const series = await getDailySeries(db, locals.user.id, 7);
		const teacherOptions =
			role === 'santri' && isEducationalOrg && orgId ? await listOrgTeachers(db, orgId) : [];
		const selectedTeacherId =
			role === 'santri' && isEducationalOrg && orgId ? await getSantriTeacherId(db, locals.user.id) : null;

		const totalAyah = checklist.reduce((sum, row) => sum + row.totalAyah, 0);
		const percentage = totalAyah ? (stats.approved / totalAyah) * 100 : 0;

		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			isEducationalOrg,
			isCommunityOrg,
			canManageCommunity,
			...communityManagerData,
			checklist,
			stats,
			series,
			percentage: Math.round(percentage * 100) / 100,
			totalAyah: stats.approved, // approved ayat count
			teacherOptions,
			selectedTeacherId
		};
	}
	// Role lainnya: tetap izinkan masuk dengan data kosong
	const communityWidgets = isCommunityMember
		? await loadCommunityWidgets()
		: { finance: null, kasWeeklyIn: 0, communitySchedule: [] };
	return {
		role,
		currentUser: locals.user,
		org: orgProfile,
		isEducationalOrg,
		isCommunityOrg,
		canManageCommunity,
		...communityManagerData,
		checklist: [],
		stats: { approved: 0, submitted: 0, todayApproved: 0 },
		series: [],
		percentage: 0,
		totalAyah: 0,
		...communityWidgets
	};
};

export const actions: Actions = {
	importAssets: async ({ request, locals }) => {
		const { db, orgId, user } = await requireCommunityContext(locals);

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
			console.error('Import aset error', err);
			return fail(400, { error: 'File Excel tidak dapat dibaca' });
		}

		const items: {
			name: string;
			category: string | null;
			quantity: number;
			condition: string | null;
			location: string | null;
			notes: string | null;
			acquiredAt: string | null;
		}[] = [];

		for (const row of rows) {
			const map = new Map<string, unknown>();
			for (const [key, value] of Object.entries(row)) {
				const normalized = normalizeHeader(key);
				if (normalized) map.set(normalized, value);
			}

			const name = `${pickMapValue(map, assetNameKeys) ?? ''}`.trim();
			const quantity = parseInteger(pickMapValue(map, assetQuantityKeys));
			if (!name || !Number.isFinite(quantity ?? NaN) || (quantity ?? 0) <= 0) {
				continue;
			}

			const category = `${pickMapValue(map, assetCategoryKeys) ?? ''}`.trim();
			const condition = `${pickMapValue(map, assetConditionKeys) ?? ''}`.trim();
			const location = `${pickMapValue(map, assetLocationKeys) ?? ''}`.trim();
			const notes = `${pickMapValue(map, assetNotesKeys) ?? ''}`.trim();
			const acquiredAt = normalizeDateValue(pickMapValue(map, assetDateKeys));

			items.push({
				name,
				category: category || null,
				quantity: Math.floor(quantity ?? 1),
				condition: condition || null,
				location: location || null,
				notes: notes || null,
				acquiredAt: acquiredAt || null
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
							`INSERT INTO org_assets (id, organization_id, name, category, quantity, condition, location, notes, acquired_at, created_by, created_at)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
						)
						.bind(
							crypto.randomUUID(),
							orgId,
							item.name,
							item.category,
							item.quantity,
							item.condition,
							item.location,
							item.notes,
							item.acquiredAt,
							user.id,
							now
						)
				)
			);
		} catch (err) {
			if (isMissingTableError(err)) {
				return fail(500, { error: 'Tabel aset belum siap. Jalankan migrasi.' });
			}
			throw err;
		}

		return { success: true };
	},
	addAsset: async ({ request, locals }) => {
		const { db, orgId, user } = await requireCommunityContext(locals);

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
		const { db, orgId } = await requireCommunityContext(locals);

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
		const { db, orgId } = await requireCommunityContext(locals);

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
	}
};
