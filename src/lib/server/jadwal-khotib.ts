import type { D1Database } from '@cloudflare/workers-types';

export type KhotibScheduleRow = {
	id: string;
	organizationId: string;
	tanggal: string;
	hari: string | null;
	khotib: string;
	imam: string | null;
	catatan: string | null;
	createdBy: string;
	createdAt: number;
	updatedAt: number | null;
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensureKhotibScheduleTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS jadwal_khotib_jumat (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				tanggal TEXT NOT NULL,
				hari TEXT,
				khotib TEXT NOT NULL,
				imam TEXT,
				catatan TEXT,
				created_by TEXT NOT NULL REFERENCES users(id),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				updated_at INTEGER
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_jadwal_khotib_org ON jadwal_khotib_jumat(organization_id, tanggal)'
		)
		.run();
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_khotib_org_tanggal ON jadwal_khotib_jumat(organization_id, tanggal)'
		)
		.run();
};

export const listKhotibSchedule = async (
	db: D1Database,
	orgId: string
): Promise<KhotibScheduleRow[]> => {
	try {
		const { results } = await db
			.prepare(
				`SELECT id,
					organization_id as organizationId,
					tanggal,
					hari,
					khotib,
					imam,
					catatan,
					created_by as createdBy,
					created_at as createdAt,
					updated_at as updatedAt
				FROM jadwal_khotib_jumat
				WHERE organization_id = ?
				ORDER BY tanggal ASC, created_at ASC`
			)
			.bind(orgId)
			.all<KhotibScheduleRow>();

		return (results ?? []) as KhotibScheduleRow[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};
