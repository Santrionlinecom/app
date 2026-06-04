import type { D1Database } from '@cloudflare/workers-types';
import type { SeedHafalanDefault } from '$lib/server/domains/tpq/seed-hafalan-default';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';
import { canAccessPermission } from '$lib/server/auth/rbac';
import { isTeacherForSantri } from '$lib/server/domains/tpq/santri-ustadz';

export const HAFALAN_RAPOR_STATUSES = ['belum', 'proses', 'lulus', 'perlu_perbaikan'] as const;
export type HafalanRaporStatus = (typeof HAFALAN_RAPOR_STATUSES)[number];

export type HafalanKategoriRow = {
	kategoriId: number;
	kategoriNama: string;
	icon: string | null;
	urutan: number;
	itemId: number | null;
	itemNama: string | null;
	fadhilah: string | null;
	level: string | null;
	itemUrutan: number | null;
};

export type HafalanPencapaianRow = {
	itemId: number;
	status: HafalanRaporStatus;
	nilai: number;
	catatan: string | null;
	tanggalSetor: string | null;
	tanggalLulus: string | null;
	guruNama: string | null;
};

export type HafalanSantriOption = {
	id: string;
	nama: string;
	email: string | null;
};

export type HafalanRekapRow = {
	santriId: string;
	santriNama: string;
	email: string | null;
	totalItem: number;
	totalItemDiisi: number;
	totalLulus: number;
	totalProses: number;
	totalPerbaikan: number;
	persenLulus: number;
};

const isAllowedStatus = (value: string): value is HafalanRaporStatus =>
	HAFALAN_RAPOR_STATUSES.includes(value as HafalanRaporStatus);

export const normalizeHafalanStatus = (value: FormDataEntryValue | null): HafalanRaporStatus => {
	const status = typeof value === 'string' ? value.trim() : '';
	return isAllowedStatus(status) ? status : 'belum';
};

export const ensureHafalanRaporSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS hafalan_kategori (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				org_id TEXT NOT NULL,
				nama TEXT NOT NULL,
				icon TEXT,
				urutan INTEGER DEFAULT 0,
				created_at TEXT DEFAULT (datetime('now')),
				FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
			)`
		)
		.run();
	await db
		.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_hafalan_kategori_org_nama ON hafalan_kategori(org_id, nama)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_kategori_org_urutan ON hafalan_kategori(org_id, urutan)')
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS hafalan_item (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				kategori_id INTEGER NOT NULL,
				nama TEXT NOT NULL,
				fadhilah TEXT,
				level TEXT DEFAULT 'wajib',
				urutan INTEGER DEFAULT 0,
				created_at TEXT DEFAULT (datetime('now')),
				FOREIGN KEY (kategori_id) REFERENCES hafalan_kategori(id) ON DELETE CASCADE
			)`
		)
		.run();
	await db
		.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_hafalan_item_kategori_nama ON hafalan_item(kategori_id, nama)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_item_kategori_urutan ON hafalan_item(kategori_id, urutan)')
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS hafalan_pencapaian (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				santri_id TEXT NOT NULL,
				item_id INTEGER NOT NULL,
				guru_id TEXT NOT NULL,
				status TEXT DEFAULT 'belum',
				nilai INTEGER DEFAULT 0,
				catatan TEXT,
				tanggal_setor TEXT,
				tanggal_lulus TEXT,
				created_at TEXT DEFAULT (datetime('now')),
				updated_at TEXT DEFAULT (datetime('now')),
				UNIQUE(santri_id, item_id),
				FOREIGN KEY (santri_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (item_id) REFERENCES hafalan_item(id) ON DELETE CASCADE,
				FOREIGN KEY (guru_id) REFERENCES users(id)
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_santri ON hafalan_pencapaian(santri_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_item_status ON hafalan_pencapaian(item_id, status)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_guru ON hafalan_pencapaian(guru_id)')
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS rapor_periode (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				org_id TEXT NOT NULL,
				nama TEXT NOT NULL,
				tanggal_mulai TEXT NOT NULL,
				tanggal_selesai TEXT NOT NULL,
				is_aktif INTEGER DEFAULT 0,
				created_at TEXT DEFAULT (datetime('now')),
				FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_rapor_periode_org_aktif ON rapor_periode(org_id, is_aktif)')
		.run();
};

export async function getKategoriByOrg(db: D1Database, orgId: string) {
	await ensureHafalanRaporSchema(db);
	const { results } = await db
		.prepare(
			`SELECT
				k.id AS kategoriId,
				k.nama AS kategoriNama,
				k.icon,
				k.urutan,
				i.id AS itemId,
				i.nama AS itemNama,
				i.fadhilah,
				i.level,
				i.urutan AS itemUrutan
			 FROM hafalan_kategori k
			 LEFT JOIN hafalan_item i ON i.kategori_id = k.id
			 WHERE k.org_id = ?
			 ORDER BY k.urutan ASC, k.id ASC, i.urutan ASC, i.id ASC`
		)
		.bind(orgId)
		.all<HafalanKategoriRow>();
	return (results ?? []) as HafalanKategoriRow[];
}

export async function getPencapaianBySantri(db: D1Database, santriId: string) {
	await ensureHafalanRaporSchema(db);
	const { results } = await db
		.prepare(
			`SELECT
				p.item_id AS itemId,
				p.status,
				p.nilai,
				p.catatan,
				p.tanggal_setor AS tanggalSetor,
				p.tanggal_lulus AS tanggalLulus,
				COALESCE(u.username, u.email) AS guruNama
			 FROM hafalan_pencapaian p
			 LEFT JOIN users u ON u.id = p.guru_id
			 WHERE p.santri_id = ?`
		)
		.bind(santriId)
		.all<HafalanPencapaianRow>();
	return (results ?? []) as HafalanPencapaianRow[];
}

export async function upsertPencapaian(
	db: D1Database,
	santriId: string,
	itemId: number,
	guruId: string,
	status: HafalanRaporStatus,
	catatan = ''
) {
	await ensureHafalanRaporSchema(db);
	const tanggalLulus = status === 'lulus' ? new Date().toISOString() : null;
	const tanggalSetor = status === 'belum' ? null : new Date().toISOString();
	const nilai = status === 'lulus' ? 100 : status === 'proses' ? 60 : status === 'perlu_perbaikan' ? 40 : 0;

	return db
		.prepare(
			`INSERT INTO hafalan_pencapaian
				(santri_id, item_id, guru_id, status, nilai, catatan, tanggal_setor, tanggal_lulus, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
			 ON CONFLICT(santri_id, item_id) DO UPDATE SET
				status = excluded.status,
				nilai = excluded.nilai,
				catatan = excluded.catatan,
				guru_id = excluded.guru_id,
				tanggal_setor = COALESCE(excluded.tanggal_setor, hafalan_pencapaian.tanggal_setor),
				tanggal_lulus = excluded.tanggal_lulus,
				updated_at = datetime('now')`
		)
		.bind(santriId, itemId, guruId, status, nilai, catatan.trim() || null, tanggalSetor, tanggalLulus)
		.run();
}

export async function getRekap(db: D1Database, orgId: string) {
	await ensureHafalanRaporSchema(db);
	const { results } = await db
		.prepare(
			`WITH total_items AS (
				SELECT COUNT(i.id) AS total
				FROM hafalan_item i
				JOIN hafalan_kategori k ON k.id = i.kategori_id
				WHERE k.org_id = ?
			 )
			 SELECT
				u.id AS santriId,
				COALESCE(u.username, u.email) AS santriNama,
				u.email,
				COALESCE(t.total, 0) AS totalItem,
				COUNT(p.id) AS totalItemDiisi,
				SUM(CASE WHEN p.status = 'lulus' THEN 1 ELSE 0 END) AS totalLulus,
				SUM(CASE WHEN p.status = 'proses' THEN 1 ELSE 0 END) AS totalProses,
				SUM(CASE WHEN p.status = 'perlu_perbaikan' THEN 1 ELSE 0 END) AS totalPerbaikan
			 FROM users u
			 CROSS JOIN total_items t
			 LEFT JOIN hafalan_pencapaian p
				ON p.santri_id = u.id
			   AND p.item_id IN (
					SELECT i.id
					FROM hafalan_item i
					JOIN hafalan_kategori k ON k.id = i.kategori_id
					WHERE k.org_id = ?
			   )
			 WHERE u.org_id = ?
			   AND (u.org_status IS NULL OR u.org_status = 'active')
			   AND u.role IN ('santri', 'alumni')
			 GROUP BY u.id, u.username, u.email, t.total
			 ORDER BY totalLulus DESC, santriNama ASC`
		)
		.bind(orgId, orgId, orgId)
		.all<Omit<HafalanRekapRow, 'persenLulus'>>();

	return ((results ?? []) as Omit<HafalanRekapRow, 'persenLulus'>[]).map((row) => ({
		...row,
		totalItem: Number(row.totalItem ?? 0),
		totalItemDiisi: Number(row.totalItemDiisi ?? 0),
		totalLulus: Number(row.totalLulus ?? 0),
		totalProses: Number(row.totalProses ?? 0),
		totalPerbaikan: Number(row.totalPerbaikan ?? 0),
		persenLulus: Number(row.totalItem ?? 0)
			? Math.round((Number(row.totalLulus ?? 0) / Number(row.totalItem ?? 1)) * 10000) / 100
			: 0
	}));
}

export async function getDaftarSantriForRapor(
	db: D1Database,
	params: { orgId: string; userId: string; role: string | null | undefined }
) {
	await ensureHafalanRaporSchema(db);
	const role = params.role ?? '';
	const needsTeachingScope =
		canAccessPermission(role, 'hafalan.input') && !canAccessPermission(role, 'hafalan.review');
	const statement = needsTeachingScope
		? db
				.prepare(
					`SELECT u.id, COALESCE(u.username, u.email) AS nama, u.email
					 FROM santri_ustadz su
					 JOIN users u ON u.id = su.santri_id
					 WHERE su.org_id = ?
					   AND su.ustadz_id = ?
					   AND (u.org_status IS NULL OR u.org_status = 'active')
					   AND u.role IN ('santri', 'alumni')
					 ORDER BY nama ASC
					 LIMIT 1000`
				)
				.bind(params.orgId, params.userId)
		: db
				.prepare(
					`SELECT id, COALESCE(username, email) AS nama, email
					 FROM users
					 WHERE org_id = ?
					   AND (org_status IS NULL OR org_status = 'active')
					   AND role IN ('santri', 'alumni')
					 ORDER BY nama ASC
					 LIMIT 1000`
				)
				.bind(params.orgId);

	const { results } = await statement.all<HafalanSantriOption>();
	return (results ?? []) as HafalanSantriOption[];
}

export async function assertCanAccessRaporSantri(
	db: D1Database,
	params: { user: NonNullable<App.Locals['user']>; orgId: string; santriId: string; write?: boolean }
) {
	if (isSuperAdminRole(params.user.role)) return;
	if (params.user.id === params.santriId && !params.write) return;

	const role = params.user.role ?? '';
	if (canAccessPermission(role, 'hafalan.review')) {
		const target = await db
			.prepare('SELECT org_id AS orgId FROM users WHERE id = ? AND role IN (\'santri\', \'alumni\')')
			.bind(params.santriId)
			.first<{ orgId: string | null }>();
		if (!target?.orgId || target.orgId !== params.orgId) {
			throw new Error('Santri tidak berada di lembaga ini.');
		}
		return;
	}

	if (canAccessPermission(role, 'hafalan.input')) {
		const allowed = await isTeacherForSantri(db, {
			santriId: params.santriId,
			ustadzId: params.user.id
		});
		if (allowed) return;
	}

	throw new Error('Tidak memiliki akses rapor santri ini.');
}

export async function seedHafalanDefault(db: D1Database, orgId: string, data: SeedHafalanDefault) {
	await ensureHafalanRaporSchema(db);

	for (const kategori of data) {
		const existing = await db
			.prepare('SELECT id FROM hafalan_kategori WHERE org_id = ? AND nama = ?')
			.bind(orgId, kategori.nama)
			.first<{ id: number }>();

		let kategoriId = existing?.id ?? null;
		if (!kategoriId) {
			const result = await db
				.prepare('INSERT INTO hafalan_kategori (org_id, nama, icon, urutan) VALUES (?, ?, ?, ?)')
				.bind(orgId, kategori.nama, kategori.icon, kategori.urutan)
				.run();
			kategoriId = Number(result.meta.last_row_id);
		} else {
			await db
				.prepare('UPDATE hafalan_kategori SET icon = ?, urutan = ? WHERE id = ?')
				.bind(kategori.icon, kategori.urutan, kategoriId)
				.run();
		}

		for (const item of kategori.items) {
			await db
				.prepare(
					`INSERT INTO hafalan_item (kategori_id, nama, fadhilah, level, urutan)
					 VALUES (?, ?, ?, ?, ?)
					 ON CONFLICT(kategori_id, nama) DO UPDATE SET
						fadhilah = excluded.fadhilah,
						level = excluded.level,
						urutan = excluded.urutan`
				)
				.bind(kategoriId, item.nama, item.fadhilah, item.level, item.urutan)
				.run();
		}
	}
}
