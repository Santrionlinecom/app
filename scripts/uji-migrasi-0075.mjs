// scripts/uji-migrasi-0075.mjs
// Menguji migrasi 0075 (kolom dihapus_at) di SQLite bersih.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

// Skema users setelah 0074 (sesuai produksi).
db.exec(`
CREATE TABLE users (
  id TEXT PRIMARY KEY, username TEXT, email TEXT UNIQUE NOT NULL,
  password_hash TEXT, gender TEXT, role TEXT NOT NULL DEFAULT 'santri',
  googleId TEXT, created_at INTEGER NOT NULL DEFAULT 0,
  whatsapp TEXT, balance INTEGER NOT NULL DEFAULT 0, org_id TEXT,
  org_status TEXT NOT NULL DEFAULT 'active', avatar_url TEXT,
  public_handle TEXT, bio TEXT, work_status TEXT, expertise TEXT,
  consent_at INTEGER, consent_versi TEXT
);
`);
db.exec(
	`INSERT INTO users (id,email,username,whatsapp,consent_at)
	 VALUES ('aktif','aktif@x.c','Pengguna Aktif','08123',1700000000000)`
);

db.exec(readFileSync(new URL('../migrations/0075_hapus_akun_mandiri.sql', import.meta.url), 'utf8'));

const gagal = [];
const cek = (nama, ok, detail = '') => {
	if (!ok) gagal.push(nama);
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};

const kolom = db.prepare(`PRAGMA table_info(users)`).all().map((r) => r.name);
cek('kolom dihapus_at lahir', kolom.includes('dihapus_at'));

const aktif = db.prepare(`SELECT * FROM users WHERE id='aktif'`).get();
cek('akun lama selamat', Boolean(aktif));
cek('akun lama dianggap AKTIF (dihapus_at NULL)', aktif.dihapus_at === null);
cek('data akun lama utuh', aktif.email === 'aktif@x.c' && aktif.whatsapp === '08123');
cek('persetujuan dari 0074 tidak hilang', Number(aktif.consent_at) === 1700000000000);

// Anonimisasi seperti yang dilakukan service.
const t = Date.now();
db.exec(`UPDATE users SET
   email='dihapus-aktif@dihapus.invalid', username=NULL, whatsapp=NULL,
   password_hash=NULL, googleId=NULL, dihapus_at=${t} WHERE id='aktif'`);

const sesudah = db.prepare(`SELECT * FROM users WHERE id='aktif'`).get();
cek('identitas benar-benar kosong', sesudah.username === null && sesudah.whatsapp === null);
cek('email tidak lagi menunjuk orang', !String(sesudah.email).includes('aktif@x.c'));
cek('waktu penghapusan tercatat', Number(sesudah.dihapus_at) === t);
cek('baris TIDAK hilang (riwayat terkait selamat)', Boolean(sesudah));

// Dua akun terhapus tidak boleh bentrok (email UNIQUE).
db.exec(`INSERT INTO users (id,email) VALUES ('dua','dua@x.c')`);
let bentrok = false;
try {
	db.exec(`UPDATE users SET email='dihapus-dua@dihapus.invalid', dihapus_at=${t} WHERE id='dua'`);
} catch {
	bentrok = true;
}
cek('dua akun terhapus tidak bentrok email', !bentrok);

const aktifSisa = db.prepare(`SELECT COUNT(*) n FROM users WHERE dihapus_at IS NULL`).get();
cek('akun aktif bisa dibedakan dari yang dihapus', Number(aktifSisa.n) === 0, `${aktifSisa.n} aktif`);

const idx = db
	.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_dihapus'`)
	.get();
cek('indeks dihapus_at dibuat', Boolean(idx));

console.log(gagal.length === 0 ? '\nSEMUA LULUS' : `\nGAGAL: ${gagal.join(', ')}`);
process.exit(gagal.length === 0 ? 0 : 1);
