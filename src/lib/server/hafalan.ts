import type { D1Database } from '@cloudflare/workers-types';

const getColumns = async (db: D1Database, table: string) => {
	const { results } = (await db.prepare(`PRAGMA table_info('${table}')`).all<{ name: string }>()) ?? {};
	return results ?? [];
};

const ensureColumn = async (db: D1Database, table: string, name: string, definition: string) => {
	const cols = await getColumns(db, table);
	if (!cols.some((c) => c.name === name)) {
		await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
	}
};

export const ensureHafalanTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS hafalan_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        surah_number INTEGER NOT NULL,
        ayah_number INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('belum','setor','disetujui')),
        tanggal_setor TEXT,
        tanggal_approve TEXT,
        quality_status TEXT,
        notes TEXT,
        reviewed_at TEXT
      )`
		)
		.run();

	await ensureColumn(db, 'hafalan_progress', 'quality_status', 'quality_status TEXT');
	await ensureColumn(db, 'hafalan_progress', 'notes', 'notes TEXT');
	await ensureColumn(db, 'hafalan_progress', 'reviewed_at', 'reviewed_at TEXT');
	await ensureColumn(db, 'hafalan_progress', 'tanggal_setor', 'tanggal_setor TEXT');
	await ensureColumn(db, 'hafalan_progress', 'tanggal_approve', 'tanggal_approve TEXT');
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_hafalan_user_surah_ayah ON hafalan_progress(user_id, surah_number, ayah_number)'
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_hafalan_user_status ON hafalan_progress(user_id, status)')
		.run();
};

export const ensureHafalanSurahChecksTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS hafalan_surah_checks (
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				surah_number INTEGER NOT NULL,
				checked_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				PRIMARY KEY (user_id, surah_number)
			)`
		)
		.run();
};
