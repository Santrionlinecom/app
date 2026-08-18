import type { D1Database } from '@cloudflare/workers-types';

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensurePondokAsramaSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS pondok_asrama (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				name TEXT NOT NULL,
				capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity > 0 AND capacity <= 40),
				notes TEXT,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_pondok_asrama_org ON pondok_asrama(organization_id, created_at DESC)'
		)
		.run();
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS pondok_asrama_santri (
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				room_id TEXT NOT NULL REFERENCES pondok_asrama(id) ON DELETE CASCADE,
				santri_id TEXT NOT NULL,
				assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				PRIMARY KEY (organization_id, santri_id)
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_pondok_asrama_santri_room ON pondok_asrama_santri(room_id)')
		.run();
};

export const assertPondokAsramaTables = async (db: D1Database) => {
	try {
		await db.prepare('SELECT id FROM pondok_asrama LIMIT 1').first();
		await db.prepare('SELECT santri_id FROM pondok_asrama_santri LIMIT 1').first();
	} catch (err) {
		if (isMissingTableError(err)) {
			await ensurePondokAsramaSchema(db);
			return;
		}
		throw err;
	}
};
