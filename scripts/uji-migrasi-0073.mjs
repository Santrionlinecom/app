// scripts/uji-migrasi-0073.mjs
// Menguji migrasi 0073 di SQLite bersih, termasuk aturan bisnisnya.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

// Prasyarat sesuai skema PRODUKSI (diverifikasi 2026-08-21).
db.exec(`
CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, email TEXT UNIQUE NOT NULL);
CREATE TABLE organizations (id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL);
CREATE TABLE tpq_halaqoh (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
);
CREATE TABLE certificates (
  id TEXT PRIMARY KEY, santri_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, issued_at TEXT NOT NULL
);
`);

db.exec(readFileSync(new URL('../migrations/0073_halaqah_anggota_rapor.sql', import.meta.url), 'utf8'));

const gagal = [];
const cek = (nama, ok) => {
	if (!ok) gagal.push(nama);
	console.log(`${ok ? '✓' : '✘'} ${nama}`);
};
const kolom = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((r) => r.name);
const adaTabel = (n) =>
	Boolean(db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(n));

cek('tabel halaqah_anggota lahir', adaTabel('halaqah_anggota'));
cek('tpq_halaqoh punya kapasitas', kolom('tpq_halaqoh').includes('kapasitas'));
cek('certificates punya diterbitkan_oleh', kolom('certificates').includes('diterbitkan_oleh'));
cek('certificates punya dicabut_at', kolom('certificates').includes('dicabut_at'));

const kapasitasBawaan = db
	.prepare(`SELECT dflt_value AS v FROM pragma_table_info('tpq_halaqoh') WHERE name='kapasitas'`)
	.get();
cek('kapasitas bawaan 12 (halaqah tetap kecil)', String(kapasitasBawaan?.v) === '12');

// Aturan bisnis
db.exec(`INSERT INTO users (id,email) VALUES ('ust','u@x.c'),('s1','a@x.c'),('s2','b@x.c')`);
db.exec(`INSERT INTO organizations (id,type,name,slug) VALUES ('o1','tpq','TPQ Uji','tpq-uji')`);
db.exec(`INSERT INTO tpq_halaqoh (id,institution_id,name,ustadz_user_id) VALUES ('h1','o1','Halaqah A','ust')`);

db.exec(`INSERT INTO halaqah_anggota (id,halaqoh_id,santri_user_id) VALUES ('a1','h1','s1')`);

let tolakGanda = false;
try {
	db.exec(`INSERT INTO halaqah_anggota (id,halaqoh_id,santri_user_id) VALUES ('a2','h1','s1')`);
} catch {
	tolakGanda = true;
}
cek('santri ganda di satu halaqah ditolak', tolakGanda);

let tolakStatus = false;
try {
	db.exec(`INSERT INTO halaqah_anggota (id,halaqoh_id,santri_user_id,status) VALUES ('a3','h1','s2','entah')`);
} catch {
	tolakStatus = true;
}
cek('status anggota di luar aktif/keluar ditolak', tolakStatus);

// Santri yang sama boleh ikut halaqah BERBEDA.
db.exec(`INSERT INTO tpq_halaqoh (id,institution_id,name,ustadz_user_id) VALUES ('h2','o1','Halaqah B','ust')`);
db.exec(`INSERT INTO halaqah_anggota (id,halaqoh_id,santri_user_id) VALUES ('a4','h2','s1')`);
cek('santri boleh ikut lebih dari satu halaqah', true);

console.log(gagal.length === 0 ? '\nSEMUA LULUS' : `\nGAGAL: ${gagal.join(', ')}`);
process.exit(gagal.length === 0 ? 0 : 1);
