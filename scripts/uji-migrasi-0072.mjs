// scripts/uji-migrasi-0072.mjs
// Menguji migrasi 0072 di SQLite bersih: bangun tabel prasyarat sesuai skema
// PRODUKSI, jalankan 0072, lalu pastikan kolom & indeks benar-benar lahir.
// Tujuannya menangkap SQL yang salah SEBELUM menyentuh database produksi.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

// Prasyarat minimal, disalin dari skema produksi (diverifikasi 2026-08-21).
db.exec(`
CREATE TABLE users (
  id TEXT PRIMARY KEY, username TEXT, email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'santri'
);
CREATE TABLE organizations (
  id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL,
  slug TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE organization_memberships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL, org_id TEXT NOT NULL, org_type TEXT NOT NULL,
  role TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1,
  invited_by TEXT, joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  role_level INTEGER NOT NULL DEFAULT 0, secondary_roles TEXT, role_expires_at INTEGER,
  UNIQUE(user_id, org_id, role),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  santri_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ustadz_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL, description TEXT, issued_at TEXT NOT NULL,
  duration_days INTEGER, total_hifz_ayat INTEGER DEFAULT 0,
  total_doa INTEGER DEFAULT 0, total_sessions INTEGER DEFAULT 0,
  certificate_url TEXT
);
`);

const sql = readFileSync(new URL('../migrations/0072_wali_santri_rapor.sql', import.meta.url), 'utf8');
db.exec(sql);

const gagal = [];
const cek = (nama, kondisi) => {
	if (!kondisi) gagal.push(nama);
	console.log(`${kondisi ? '✓' : '✘'} ${nama}`);
};

const kolom = (tabel) =>
	db.prepare(`PRAGMA table_info(${tabel})`).all().map((r) => r.name);
const adaTabel = (nama) =>
	Boolean(db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(nama));
const adaIndeks = (nama) =>
	Boolean(db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`).get(nama));

cek('tabel wali_santri lahir', adaTabel('wali_santri'));
cek('tabel wali_undangan lahir', adaTabel('wali_undangan'));
cek('organization_memberships punya is_primary', kolom('organization_memberships').includes('is_primary'));

for (const k of ['org_id', 'jenis', 'periode_mulai', 'periode_selesai', 'slug', 'is_public', 'payload']) {
	cek(`certificates punya ${k}`, kolom('certificates').includes(k));
}

cek('indeks slug sertifikat ada', adaIndeks('idx_certificates_slug'));
cek('indeks wali per-wali ada', adaIndeks('idx_wali_santri_wali'));

// Aturan bisnis harus benar-benar ditegakkan, bukan sekadar tertulis.
db.exec(`INSERT INTO users (id,email) VALUES ('u1','a@b.c'),('u2','d@e.f')`);

db.exec(`INSERT INTO wali_santri (id,wali_user_id,santri_user_id,hubungan,created_at)
         VALUES ('r1','u1','u2','ayah',unixepoch())`);

let tolakGanda = false;
try {
	db.exec(`INSERT INTO wali_santri (id,wali_user_id,santri_user_id,hubungan,created_at)
	         VALUES ('r2','u1','u2','ibu',unixepoch())`);
} catch {
	tolakGanda = true;
}
cek('relasi wali-santri ganda ditolak UNIQUE', tolakGanda);

let tolakHubungan = false;
try {
	db.exec(`INSERT INTO wali_santri (id,wali_user_id,santri_user_id,hubungan,created_at)
	         VALUES ('r3','u2','u1','paman',unixepoch())`);
} catch {
	tolakHubungan = true;
}
cek('hubungan di luar ayah/ibu/wali ditolak CHECK', tolakHubungan);

db.exec(`INSERT INTO certificates (id,santri_id,title,issued_at,slug)
         VALUES ('c1','u2','Rapor','2026-08-21','tpq-zaid-7f3k')`);
let tolakSlug = false;
try {
	db.exec(`INSERT INTO certificates (id,santri_id,title,issued_at,slug)
	         VALUES ('c2','u2','Rapor2','2026-08-21','tpq-zaid-7f3k')`);
} catch {
	tolakSlug = true;
}
cek('slug sertifikat ganda ditolak', tolakSlug);

// slug NULL boleh berkali-kali (partial index) — sertifikat privat tanpa slug.
db.exec(`INSERT INTO certificates (id,santri_id,title,issued_at) VALUES ('c3','u2','A','2026-08-21')`);
db.exec(`INSERT INTO certificates (id,santri_id,title,issued_at) VALUES ('c4','u2','B','2026-08-21')`);
cek('beberapa sertifikat tanpa slug tetap boleh', true);

console.log(gagal.length === 0 ? '\nSEMUA LULUS' : `\nGAGAL: ${gagal.join(', ')}`);
process.exit(gagal.length === 0 ? 0 : 1);
