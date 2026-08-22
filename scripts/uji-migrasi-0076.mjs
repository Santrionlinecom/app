// scripts/uji-migrasi-0076.mjs
// Menguji migrasi 0076 (tabel token reset password) di SQLite bersih.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
CREATE TABLE users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT,
  dihapus_at INTEGER
);
INSERT INTO users (id,email,password_hash) VALUES ('u1','satu@x.c','lama');
`);

db.exec(readFileSync(new URL('../migrations/0076_password_reset_tokens.sql', import.meta.url), 'utf8'));

const gagal = [];
const cek = (nama, ok, detail = '') => {
	if (!ok) gagal.push(nama);
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};

const kolom = db.prepare(`PRAGMA table_info(password_reset_tokens)`).all().map((r) => r.name);
cek('tabel lahir dengan kolom lengkap',
	['token_hash', 'user_id', 'expires_at', 'dipakai_at', 'dibuat_at', 'ip'].every((k) => kolom.includes(k)),
	kolom.join(','));

const pk = db.prepare(`PRAGMA table_info(password_reset_tokens)`).all().find((r) => r.pk === 1);
cek('kunci primer adalah token_hash (bukan token asli)', pk?.name === 'token_hash');

const now = Date.now();
db.exec(`INSERT INTO password_reset_tokens (token_hash,user_id,expires_at,dibuat_at)
         VALUES ('hash-abc','u1',${now + 3600000},${now})`);
cek('token bisa disimpan', Number(db.prepare(`SELECT COUNT(*) n FROM password_reset_tokens`).get().n) === 1);

// Hash yang sama tidak boleh dobel.
let dobel = false;
try {
	db.exec(`INSERT INTO password_reset_tokens (token_hash,user_id,expires_at,dibuat_at)
	         VALUES ('hash-abc','u1',${now + 3600000},${now})`);
} catch { dobel = true; }
cek('token_hash unik (tidak bisa dobel)', dobel);

// Token milik user yang tidak ada harus ditolak.
let asing = false;
try {
	db.exec(`INSERT INTO password_reset_tokens (token_hash,user_id,expires_at,dibuat_at)
	         VALUES ('hash-zzz','tidak-ada',${now},${now})`);
} catch { asing = true; }
cek('token wajib menunjuk akun yang ada', asing);

// Hapus akun → token ikut hilang (tidak ada token yatim).
db.exec(`DELETE FROM users WHERE id='u1'`);
cek('token ikut terhapus saat akun dihapus (CASCADE)',
	Number(db.prepare(`SELECT COUNT(*) n FROM password_reset_tokens`).get().n) === 0);

const idx = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_reset%'`).all();
cek('indeks user_id & expires_at dibuat', idx.length === 2, idx.map((i) => i.name).join(','));

console.log(gagal.length === 0 ? '\nSEMUA LULUS' : `\nGAGAL: ${gagal.join(', ')}`);
process.exit(gagal.length === 0 ? 0 : 1);
