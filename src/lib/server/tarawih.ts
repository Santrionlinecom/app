import type { D1Database } from '@cloudflare/workers-types';

export type TarawihScheduleRow = {
	id: string;
	organizationId: string;
	urut: number;
	hari: string;
	tanggal: string;
	imam: string;
	bilal: string | null;
	createdBy: string;
	createdAt: number;
	updatedAt: number | null;
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensureTarawihScheduleTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS jadwal_tarawih (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				urut INTEGER NOT NULL,
				hari TEXT NOT NULL,
				tanggal TEXT NOT NULL,
				imam TEXT NOT NULL,
				bilal TEXT,
				created_by TEXT NOT NULL REFERENCES users(id),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				updated_at INTEGER
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_jadwal_tarawih_org ON jadwal_tarawih(organization_id)')
		.run();
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_tarawih_org_urut ON jadwal_tarawih(organization_id, urut)'
		)
		.run();
};

export const listTarawihSchedule = async (
	db: D1Database,
	orgId: string
): Promise<TarawihScheduleRow[]> => {
	try {
		const { results } = await db
			.prepare(
				`SELECT id,
					organization_id as organizationId,
					urut,
					hari,
					tanggal,
					imam,
					bilal,
					created_by as createdBy,
					created_at as createdAt,
					updated_at as updatedAt
				 FROM jadwal_tarawih
				 WHERE organization_id = ?
				 ORDER BY urut ASC, created_at ASC`
			)
			.bind(orgId)
			.all<TarawihScheduleRow>();

		return (results ?? []) as TarawihScheduleRow[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};
