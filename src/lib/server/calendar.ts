import type { D1Database } from '@cloudflare/workers-types';

export const ensureCalendarTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS calendar_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT,
        title TEXT NOT NULL,
        content TEXT,
        event_date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_calendar_notes_event_date ON calendar_notes(event_date)').run();
};

export const ensureMurojaTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS muroja_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        surah_number INTEGER NOT NULL,
        ayah_start INTEGER NOT NULL,
        ayah_end INTEGER NOT NULL,
        quality TEXT NOT NULL CHECK (quality IN ('lancar', 'kurang_lancar', 'belum_lancar')),
        notes TEXT,
        muroja_date TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
      )`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_muroja_tracking_user ON muroja_tracking(user_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_muroja_tracking_date ON muroja_tracking(muroja_date)').run();
};
