-- Habit System pilot: 3 missions, 28-day window, private check-ins (no public worship leaderboard).

CREATE TABLE IF NOT EXISTS habit_missions (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS habit_pilot_runs (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT,
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  audience_note TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key TEXT NOT NULL REFERENCES habit_missions(key),
  local_date TEXT NOT NULL,
  status TEXT NOT NULL,
  detail_json TEXT,
  duration_bucket TEXT,
  optional_reflection TEXT,
  is_day_met INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, mission_key, local_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_user_date
  ON habit_checkins(user_id, local_date DESC);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_user_mission_date
  ON habit_checkins(user_id, mission_key, local_date DESC);

CREATE TABLE IF NOT EXISTS habit_streaks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key TEXT NOT NULL REFERENCES habit_missions(key),
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_met_date TEXT,
  restarted_at TEXT,
  PRIMARY KEY (user_id, mission_key)
);

CREATE TABLE IF NOT EXISTS habit_guardian_weekly (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guardian_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  confirmation TEXT NOT NULL CHECK (
    confirmation IN ('sesuai_pantauan', 'perlu_dibicarakan', 'belum_sempat')
  ),
  note TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, guardian_user_id, week_start)
);

CREATE TABLE IF NOT EXISTS habit_mentor_weekly (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, mentor_user_id, week_start)
);

INSERT OR IGNORE INTO habit_missions (key, title, description, sort_order, is_active)
VALUES
  (
    'shalat_wajib',
    'Jaga Shalat Wajib',
    'Menjaga lima shalat wajib sesuai kemampuan tahap usia. Check-in jujur, tanpa riya.',
    1,
    1
  ),
  (
    'quran_harian',
    'Bersama Al-Qur''an',
    'Minimal 10 menit membaca, menyimak, menghafal, atau murajaah setiap hari.',
    2,
    1
  ),
  (
    'amal_adab_harian',
    'Satu Kebaikan Hari Ini',
    'Satu amal/adab nyata per hari untuk keluarga, guru, teman, atau lingkungan.',
    3,
    1
  );
