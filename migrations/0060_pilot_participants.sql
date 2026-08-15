-- Pilot Habit System: daftar peserta pilot (3 santri + orang tua) untuk dashboard monitoring.
CREATE TABLE IF NOT EXISTS pilot_participants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,                              -- misal 'Santri 1 — TPQ'
  guardian_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- akun orang tua (opsional)
  start_date TEXT NOT NULL,                -- YYYY-MM-DD (WIB)
  end_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_pilot_participants_active ON pilot_participants(active, start_date);
CREATE INDEX IF NOT EXISTS idx_pilot_participants_user ON pilot_participants(user_id);
