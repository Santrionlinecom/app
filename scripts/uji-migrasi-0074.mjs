// scripts/uji-migrasi-0074.mjs
// Menguji migrasi 0074 (kolom consent) di SQLite bersih.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

// Skema users sesuai PRODUKSI (diverifikasi 21 Agustus 2026).
db.exec(`
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  gender TEXT,
  role TEXT NOT NULL DEFAULT 'santri',
  googleId TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
  whatsapp TEXT, balance INTEGER NOT NULL DEFAULT 0, org_id TEXT,
  org_status TEXT NOT NULL DEFAULT 'active', avatar_url TEXT,
  public_handle TEXT, bio TEXT, work_status TEXT, expertise TEXT
);
`);

// Akun lama, dibuat SEBELUM migrasi — harus selamat.
db.exec(`INSERT INTO users (id,email,username) VALUES ('lama','lama@x.c','Akun Lama')`);

db.exec(readFileSync(new URL('../migrations/0074_consent_pdp.sql', import.meta.url), 'utf8'));

const gagal = [];
const cek = (nama, ok, detail = '') => {
	if (!ok) gagal.push(nama);
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};
const kolom = db.prepare(`PRAGMA table_info(users)`).all().map((r) => r.name);

cek('kolom consent_at lahir', kolom.includes('consent_at'));
cek('kolom consent_versi lahir', kolom.includes('consent_versi'));

const lama = db.prepare(`SELECT * FROM users WHERE id='lama'`).get();
cek('akun lama tidak hilang', Boolean(lama));
cek('akun lama consent_at NULL (belum menyetujui)', lama.consent_at === null);
cek('data akun lama utuh', lama.email === 'lama@x.c' && lama.username === 'Akun Lama');

// Akun baru menyimpan jejak.
const now = Date.now();
db.exec(
	`INSERT INTO users (id,email,consent_at,consent_versi)
	 VALUES ('baru','baru@x.c',${now},'2026-08-21')`
);
const baru = db.prepare(`SELECT consent_at, consent_versi FROM users WHERE id='baru'`).get();
cek('akun baru menyimpan waktu persetujuan', Number(baru.consent_at) === now);
cek('akun baru menyimpan versi dokumen', baru.consent_versi === '2026-08-21');

// Bisa membedakan siapa yang belum menyetujui.
const belum = db.prepare(`SELECT COUNT(*) n FROM users WHERE consent_at IS NULL`).get();
cek('akun tanpa persetujuan bisa dihitung', Number(belum.n) === 1, `${belum.n} akun`);

const idx = db
	.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_consent'`)
	.get();
cek('indeks consent dibuat', Boolean(idx));

console.log(gagal.length === 0 ? '\nSEMUA LULUS' : `\nGAGAL: ${gagal.join(', ')}`);
process.exit(gagal.length === 0 ? 0 : 1);
