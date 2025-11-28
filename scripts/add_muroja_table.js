import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'tahfidz.db');

const db = new Database(dbPath);

console.log('Adding muroja_tracking table...');

try {
	db.exec(`
		CREATE TABLE IF NOT EXISTS muroja_tracking (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		  surah_number INTEGER NOT NULL,
		  ayah_start INTEGER NOT NULL,
		  ayah_end INTEGER NOT NULL,
		  quality TEXT NOT NULL CHECK (quality IN ('lancar', 'kurang_lancar', 'belum_lancar')),
		  notes TEXT,
		  muroja_date TEXT NOT NULL,
		  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
		);
		
		CREATE INDEX IF NOT EXISTS idx_muroja_tracking_user ON muroja_tracking(user_id);
		CREATE INDEX IF NOT EXISTS idx_muroja_tracking_date ON muroja_tracking(muroja_date);
	`);

	console.log('✅ muroja_tracking table created successfully!');
} catch (error) {
	console.error('❌ Error creating table:', error);
	process.exit(1);
}

db.close();
