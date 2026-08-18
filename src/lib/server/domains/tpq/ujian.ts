import type { D1Database } from '@cloudflare/workers-types';

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensureTahfidzUjianSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS tahfidz_ujian (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				santri_id TEXT NOT NULL,
				judul TEXT NOT NULL,
				surah TEXT NOT NULL,
				ayat_from INTEGER NOT NULL CHECK (ayat_from > 0),
				ayat_to INTEGER NOT NULL CHECK (ayat_to > 0),
				nilai INTEGER NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
				catatan TEXT,
				created_by TEXT,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				CHECK (ayat_from <= ayat_to)
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_tahfidz_ujian_org ON tahfidz_ujian(organization_id, created_at DESC)'
		)
		.run();
};

export const assertTahfidzUjianTables = async (db: D1Database) => {
	try {
		await db.prepare('SELECT id FROM tahfidz_ujian LIMIT 1').first();
	} catch (err) {
		if (isMissingTableError(err)) {
			await ensureTahfidzUjianSchema(db);
			return;
		}
		throw err;
	}
};
