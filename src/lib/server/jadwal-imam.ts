import type { D1Database } from '@cloudflare/workers-types';

export type ImamScheduleRow = {
	id: string;
	organizationId: string;
	tanggal: string;
	hari: string | null;
	waktu: string;
	imam: string;
	catatan: string | null;
	createdBy: string;
	createdAt: number;
	updatedAt: number | null;
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensureImamScheduleTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS jadwal_imam (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				tanggal TEXT NOT NULL,
				hari TEXT,
				waktu TEXT NOT NULL,
				imam TEXT NOT NULL,
				catatan TEXT,
				created_by TEXT NOT NULL REFERENCES users(id),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				updated_at INTEGER
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_jadwal_imam_org ON jadwal_imam(organization_id, tanggal)')
		.run();
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_imam_org_tanggal_waktu ON jadwal_imam(organization_id, tanggal, waktu)'
		)
		.run();
};

export const listImamSchedule = async (
	db: D1Database,
	orgId: string
): Promise<ImamScheduleRow[]> => {
	try {
		const { results } = await db
			.prepare(
				`SELECT id,
					organization_id as organizationId,
					tanggal,
					hari,
					waktu,
					imam,
					catatan,
					created_by as createdBy,
					created_at as createdAt,
					updated_at as updatedAt
				FROM jadwal_imam
				WHERE organization_id = ?
				ORDER BY tanggal ASC, waktu ASC, created_at ASC`
			)
			.bind(orgId)
			.all<ImamScheduleRow>();

		return (results ?? []) as ImamScheduleRow[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};
