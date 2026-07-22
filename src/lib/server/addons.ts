import type { D1Database } from '@cloudflare/workers-types';
import { isSystemAdmin, normalizeRole } from '$lib/server/auth/rbac';

export const ADDON_GROUP_WA_PATH = '/r/groupwa';
export const ADDON_GROUP_WA_URL = 'https://app.santrionline.com/r/groupwa';

export const ADDON_PRICES = {
	santri_unlimited: 0,
	raport_premium: 0,
	modul_masjid: 0,
	modul_tahfidz: 0,
	modul_musholla: 0,
	lembaga_tambahan: 0
} as const;

export const ADDON_NAMES = {
	santri_unlimited: 'Santri Unlimited',
	raport_premium: 'Raport PDF Premium',
	modul_masjid: 'Modul Masjid',
	modul_tahfidz: 'Modul Rumah Tahfidz',
	modul_musholla: 'Modul Musholla',
	lembaga_tambahan: 'Lembaga Tambahan'
} as const;

export const ADDON_DESCRIPTIONS = {
	santri_unlimited: 'Hapus batas 30 santri aktif per lembaga.',
	raport_premium: 'Template raport premium dan pengiriman ke wali.',
	modul_masjid: 'Fitur zakat, qurban, dan agenda jamaah masjid.',
	modul_tahfidz: 'Halaqoh detail, ujian, dan ijazah tahfidz.',
	modul_musholla: 'Kas musholla dan kegiatan rutin komunitas.',
	lembaga_tambahan: 'Tambah lembaga kedua dan seterusnya di satu akun.'
} as const;

export const ADDON_FEATURES = {
	santri_unlimited: ['Hapus batas 30 santri aktif', 'Cocok untuk lembaga yang berkembang'],
	raport_premium: ['Template custom', 'Kirim ke wali via WhatsApp'],
	modul_masjid: ['Zakat & infaq', 'Qurban', 'Agenda jamaah'],
	modul_tahfidz: ['Halaqoh detail', 'Ujian', 'Ijazah'],
	modul_musholla: ['Kas musholla', 'Kegiatan rutin'],
	lembaga_tambahan: ['Tambah lembaga ke-2', 'Kelola multi-lembaga dari satu akun']
} as const;

export type AddonTipe = keyof typeof ADDON_PRICES;

// Migration 0037 only allows status: aktif, expired, trial.
// trial = request/pending until superadmin approves.
export const ADDON_REQUEST_STATUS = 'trial' as const;
export type AddonDbStatus = 'aktif' | 'expired' | 'trial';

export type AddonRow = {
	id: string;
	lembagaId: string;
	tipeAddon: string;
	status: string;
	berlakuHingga: number | null;
	createdAt: number | null;
};

export const isAddonTipe = (value: string): value is AddonTipe => value in ADDON_PRICES;

export const addonLabel = (tipe: string) =>
	ADDON_NAMES[tipe as AddonTipe] ?? tipe.replace(/_/g, ' ');

export const normalizeExpiryMs = (value: number | null | undefined) => {
	if (value == null || !Number.isFinite(value)) return null;
	// values under ~year 2286 in seconds are treated as unix seconds
	return value < 100_000_000_000 ? value * 1000 : value;
};

export const isAddonActiveRow = (
	status: string,
	berlakuHingga: number | null | undefined,
	nowMs = Date.now()
) => {
	if (status !== 'aktif') return false;
	const expiry = normalizeExpiryMs(berlakuHingga);
	return expiry == null || expiry > nowMs;
};

export const canManageAddonForOrg = (user: {
	id: string;
	role?: string | null;
	orgId?: string | null;
}, org: { id: string; akunAdminId?: string | null }) => {
	if (isSystemAdmin(user.role)) return true;
	if (org.akunAdminId && org.akunAdminId === user.id) return true;
	const role = normalizeRole(user.role);
	if (role === 'admin' && user.orgId && user.orgId === org.id) return true;
	return false;
};

const mapAddonRow = (row: {
	id: string;
	lembagaId?: string;
	lembaga_id?: string;
	tipeAddon?: string;
	tipe_addon?: string;
	status: string;
	berlakuHingga?: number | null;
	berlaku_hingga?: number | null;
	createdAt?: number | null;
	created_at?: number | null;
}): AddonRow => ({
	id: row.id,
	lembagaId: row.lembagaId ?? row.lembaga_id ?? '',
	tipeAddon: row.tipeAddon ?? row.tipe_addon ?? '',
	status: row.status,
	berlakuHingga: row.berlakuHingga ?? row.berlaku_hingga ?? null,
	createdAt: row.createdAt ?? row.created_at ?? null
});

export const listAddonsForLembaga = async (db: D1Database, lembagaId: string) => {
	const { results } = await db
		.prepare(
			`SELECT
				id,
				lembaga_id AS lembagaId,
				tipe_addon AS tipeAddon,
				status,
				berlaku_hingga AS berlakuHingga,
				created_at AS createdAt
			 FROM addon_lembaga
			 WHERE lembaga_id = ?
			 ORDER BY created_at DESC`
		)
		.bind(lembagaId)
		.all<{
			id: string;
			lembagaId: string;
			tipeAddon: string;
			status: string;
			berlakuHingga: number | null;
			createdAt: number | null;
		}>();

	return (results ?? []).map(mapAddonRow);
};

export const FREE_SANTRI_LIMIT = 30;
export const FREE_LEMBAGA_LIMIT = 1;

export const getActiveAddon = async (
	db: D1Database,
	lembagaId: string,
	tipeAddon: AddonTipe,
	nowMs = Date.now()
) => {
	const row = await db
		.prepare(
			`SELECT
				id,
				lembaga_id AS lembagaId,
				tipe_addon AS tipeAddon,
				status,
				berlaku_hingga AS berlakuHingga,
				created_at AS createdAt
			 FROM addon_lembaga
			 WHERE lembaga_id = ? AND tipe_addon = ? AND status = 'aktif'
			 LIMIT 1`
		)
		.bind(lembagaId, tipeAddon)
		.first<{
			id: string;
			lembagaId: string;
			tipeAddon: string;
			status: string;
			berlakuHingga: number | null;
			createdAt: number | null;
		}>();

	if (!row) return null;
	const mapped = mapAddonRow(row);
	return isAddonActiveRow(mapped.status, mapped.berlakuHingga, nowMs) ? mapped : null;
};

export const hasActiveAddon = async (
	db: D1Database,
	lembagaId: string,
	tipeAddon: AddonTipe,
	nowMs = Date.now()
) => Boolean(await getActiveAddon(db, lembagaId, tipeAddon, nowMs));

export const countActiveSantriForLembaga = async (db: D1Database, lembagaId: string) => {
	const row = await db
		.prepare(
			`SELECT COUNT(1) AS total
			 FROM users
			 WHERE org_id = ?
			   AND LOWER(TRIM(COALESCE(role, ''))) IN ('santri', 'jamaah', 'murid')
			   AND LOWER(TRIM(COALESCE(org_status, 'active'))) = 'active'`
		)
		.bind(lembagaId)
		.first<{ total: number | null }>();
	return Number(row?.total ?? 0);
};

export const countManagedLembagaForUser = async (db: D1Database, userId: string) => {
	const row = await db
		.prepare(
			`SELECT COUNT(1) AS total
			 FROM organizations
			 WHERE akun_admin_id = ?
			   AND COALESCE(is_aktif, 1) = 1`
		)
		.bind(userId)
		.first<{ total: number | null }>();
	return Number(row?.total ?? 0);
};

export const getSantriCapacity = async (db: D1Database, lembagaId: string) => {
	const unlimited = await hasActiveAddon(db, lembagaId, 'santri_unlimited');
	const used = await countActiveSantriForLembaga(db, lembagaId);
	return {
		unlimited,
		limit: unlimited ? null : FREE_SANTRI_LIMIT,
		used,
		remaining: unlimited ? null : Math.max(FREE_SANTRI_LIMIT - used, 0),
		canAdd: unlimited || used < FREE_SANTRI_LIMIT
	};
};

export const getLembagaCapacity = async (db: D1Database, userId: string) => {
	const used = await countManagedLembagaForUser(db, userId);
	// lembaga_tambahan is account-level in product copy, but stored per-lembaga.
	// Treat any active lembaga_tambahan owned by this admin as unlock.
	const unlockRow = await db
		.prepare(
			`SELECT a.id, a.status, a.berlaku_hingga AS berlakuHingga
			 FROM addon_lembaga a
			 INNER JOIN organizations o ON o.id = a.lembaga_id
			 WHERE o.akun_admin_id = ?
			   AND a.tipe_addon = 'lembaga_tambahan'
			   AND a.status = 'aktif'
			 ORDER BY a.created_at DESC
			 LIMIT 1`
		)
		.bind(userId)
		.first<{ id: string; status: string; berlakuHingga: number | null }>();

	const unlimited = Boolean(
		unlockRow && isAddonActiveRow(unlockRow.status, unlockRow.berlakuHingga)
	);

	return {
		unlimited,
		limit: unlimited ? null : FREE_LEMBAGA_LIMIT,
		used,
		remaining: unlimited ? null : Math.max(FREE_LEMBAGA_LIMIT - used, 0),
		canAdd: unlimited || used < FREE_LEMBAGA_LIMIT
	};
};

export const assertCanAddSantri = async (db: D1Database, lembagaId: string) => {
	const capacity = await getSantriCapacity(db, lembagaId);
	return {
		...capacity,
		error: capacity.canAdd
			? null
			: `Batas gratis ${FREE_SANTRI_LIMIT} santri aktif tercapai. Aktifkan addon Santri Unlimited di /addon.`
	};
};

export const assertCanAddLembaga = async (db: D1Database, userId: string) => {
	const capacity = await getLembagaCapacity(db, userId);
	return {
		...capacity,
		error: capacity.canAdd
			? null
			: 'Batas 1 lembaga gratis tercapai. Aktifkan addon Lembaga Tambahan di /addon sebelum menambah lembaga baru.'
	};
};

export const getPendingAddon = async (db: D1Database, lembagaId: string, tipeAddon: AddonTipe) => {
	const row = await db
		.prepare(
			`SELECT
				id,
				lembaga_id AS lembagaId,
				tipe_addon AS tipeAddon,
				status,
				berlaku_hingga AS berlakuHingga,
				created_at AS createdAt
			 FROM addon_lembaga
			 WHERE lembaga_id = ? AND tipe_addon = ? AND status = ?
			 LIMIT 1`
		)
		.bind(lembagaId, tipeAddon, ADDON_REQUEST_STATUS)
		.first<{
			id: string;
			lembagaId: string;
			tipeAddon: string;
			status: string;
			berlakuHingga: number | null;
			createdAt: number | null;
		}>();
	return row ? mapAddonRow(row) : null;
};

export const upsertAddonRequest = async (
	db: D1Database,
	params: { lembagaId: string; tipeAddon: AddonTipe; requestedBy?: string | null }
) => {
	const now = Date.now();
	const existing = await db
		.prepare(
			`SELECT id, status FROM addon_lembaga
			 WHERE lembaga_id = ? AND tipe_addon = ?
			 LIMIT 1`
		)
		.bind(params.lembagaId, params.tipeAddon)
		.first<{ id: string; status: string }>();

	if (existing) {
		await db
			.prepare(
				`UPDATE addon_lembaga
				 SET status = ?, berlaku_hingga = NULL, created_at = ?
				 WHERE id = ?`
			)
			.bind(ADDON_REQUEST_STATUS, now, existing.id)
			.run();
		return { id: existing.id, created: false as const };
	}

	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO addon_lembaga (
				id, lembaga_id, tipe_addon, status, berlaku_hingga, created_at
			) VALUES (?, ?, ?, ?, NULL, ?)`
		)
		.bind(id, params.lembagaId, params.tipeAddon, ADDON_REQUEST_STATUS, now)
		.run();
	return { id, created: true as const, requestedBy: params.requestedBy ?? null };
};

export const setAddonStatus = async (
	db: D1Database,
	params: {
		id: string;
		status: AddonDbStatus;
		berlakuHingga?: number | null;
	}
) => {
	const now = Date.now();
	const berlaku =
		params.status === 'aktif'
			? params.berlakuHingga ?? null
			: params.status === 'expired'
				? params.berlakuHingga ?? now
				: null;

	await db
		.prepare(
			`UPDATE addon_lembaga
			 SET status = ?, berlaku_hingga = ?, created_at = ?
			 WHERE id = ?`
		)
		.bind(params.status, berlaku, now, params.id)
		.run();
};

export const cancelAddonRequest = async (db: D1Database, id: string) => {
	// cancel pending by marking expired with timestamp now
	await setAddonStatus(db, { id, status: 'expired', berlakuHingga: Date.now() });
};

export const getOrganizationForAddon = async (db: D1Database, lembagaId: string) => {
	return db
		.prepare(
			`SELECT
				id,
				name,
				slug,
				type,
				status,
				akun_admin_id AS akunAdminId
			 FROM organizations
			 WHERE id = ?
			 LIMIT 1`
		)
		.bind(lembagaId)
		.first<{
			id: string;
			name: string;
			slug: string | null;
			type: string | null;
			status: string | null;
			akunAdminId: string | null;
		}>();
};

export const manageHrefForAddon = (
	tipe: AddonTipe,
	opts: { lembagaSlug?: string | null; lembagaType?: string | null } = {}
) => {
	const orgSlug = opts.lembagaSlug ? encodeURIComponent(opts.lembagaSlug) : '';
	switch (tipe) {
		case 'santri_unlimited':
			return '/dashboard/kelola-santri';
		case 'raport_premium':
			return opts.lembagaType === 'tpq' ? '/tpq/hafalan-rapor' : '/dashboard/rapor-hafalan';
		case 'modul_masjid':
		case 'modul_musholla':
			return orgSlug ? `/org/${orgSlug}/ummah` : '/keuangan';
		case 'modul_tahfidz':
			return '/dashboard/halaqoh';
		case 'lembaga_tambahan':
			return '/lembaga/tambah';
		default:
			return '/dashboard';
	}
};
