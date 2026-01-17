import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertLoggedIn, assertOrgMember, assertOrgRoleAllowed } from '$lib/server/auth/rbac';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
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
			assets: []
		};
	}

	const { orgId, org } = await requireOrgContext(locals);

	const assets = await listOrgAssets(locals.db, orgId);

	return {
		mode: 'org',
		org,
		orgs: [],
		assets
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
	importAssets: async ({ request, locals }) => {
		const { db, orgId, user } = await requireOrgContext(locals);

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
	}
};
