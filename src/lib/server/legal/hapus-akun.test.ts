// src/lib/server/legal/hapus-akun.test.ts
// Penjaga penghapusan akun mandiri (hak subjek data, UU 27/2022).
//
// Yang dijaga di sini adalah hal-hal yang kalau salah, akibatnya tidak bisa
// dibatalkan: identitas benar-benar hilang, tetapi data milik ORANG LAIN
// tidak ikut rusak.

import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { hapusAkunMandiri, ALASAN_TOLAK } from './hapus-akun.ts';

/** DB uji berisi struktur seperlunya untuk menguji perilaku penghapusan. */
function buatDb() {
	const db = new DatabaseSync(':memory:');
	db.exec(`
		CREATE TABLE users (
			id TEXT PRIMARY KEY, username TEXT, email TEXT UNIQUE NOT NULL,
			password_hash TEXT, googleId TEXT, whatsapp TEXT, avatar_url TEXT,
			public_handle TEXT, bio TEXT, role TEXT NOT NULL DEFAULT 'santri',
			org_id TEXT, org_status TEXT DEFAULT 'active', balance INTEGER DEFAULT 0,
			consent_at INTEGER, consent_versi TEXT,
			dihapus_at INTEGER, created_at INTEGER DEFAULT 0
		);
		CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
		CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT, akun_admin_id TEXT);
		CREATE TABLE hafalan_progress (id TEXT PRIMARY KEY, user_id TEXT, surah TEXT);
		CREATE TABLE coin_transactions (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER);
		CREATE TABLE tpq_setoran (
			id TEXT PRIMARY KEY, santri_user_id TEXT, ustadz_user_id TEXT, status TEXT
		);
		CREATE TABLE activity_logs (
			id TEXT PRIMARY KEY, user_id TEXT, action TEXT, metadata TEXT, created_at INTEGER
		);
	`);
	return db;
}

/** Adaptor kecil agar DatabaseSync bisa dipakai seperti binding D1. */
function d1(db: DatabaseSync) {
	return {
		prepare(sql: string) {
			let terikat: unknown[] = [];
			const api = {
				bind(...args: unknown[]) {
					terikat = args;
					return api;
				},
				async first<T>() {
					return (db.prepare(sql).get(...(terikat as never[])) ?? null) as T | null;
				},
				async all<T>() {
					return { results: db.prepare(sql).all(...(terikat as never[])) as T[] };
				},
				async run() {
					db.prepare(sql).run(...(terikat as never[]));
					return { success: true };
				}
			};
			return api;
		}
	};
}

function siapkanSantri(db: DatabaseSync) {
	db.exec(`
		INSERT INTO users (id, username, email, password_hash, whatsapp, bio, public_handle, role, consent_at)
		VALUES ('u-santri', 'Zaid', 'zaid@contoh.test', 'hash-rahasia', '08123456789',
		        'Santri TPQ Al-Hidayah', 'zaid', 'santri', 1700000000000);
		INSERT INTO sessions (id, user_id) VALUES ('s1', 'u-santri'), ('s2', 'u-santri');
		INSERT INTO hafalan_progress (id, user_id, surah) VALUES ('h1', 'u-santri', 'An-Naba');
		INSERT INTO coin_transactions (id, user_id, amount) VALUES ('c1', 'u-santri', 500);
	`);
}

test('email konfirmasi salah → penghapusan DITOLAK', async () => {
	const db = buatDb();
	siapkanSantri(db);

	const hasil = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'salah@contoh.test'
	});

	assert.equal(hasil.ok, false);
	assert.equal(hasil.alasan, ALASAN_TOLAK.EMAIL_TIDAK_COCOK);

	const u = db.prepare(`SELECT email FROM users WHERE id='u-santri'`).get() as { email: string };
	assert.equal(u.email, 'zaid@contoh.test', 'akun tidak boleh tersentuh saat konfirmasi salah');
});

test('email konfirmasi benar → identitas benar-benar hilang', async () => {
	const db = buatDb();
	siapkanSantri(db);

	const hasil = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});
	assert.equal(hasil.ok, true);

	const u = db.prepare(`SELECT * FROM users WHERE id='u-santri'`).get() as Record<string, unknown>;

	// Tidak ada sisa yang bisa menunjuk orangnya.
	assert.doesNotMatch(String(u.email), /zaid@contoh\.test/);
	assert.equal(u.username, null);
	assert.equal(u.whatsapp, null);
	assert.equal(u.bio, null);
	assert.equal(u.public_handle, null);
	assert.equal(u.password_hash, null, 'password harus dihapus agar tidak bisa login lagi');
	assert.equal(u.googleId, null, 'googleId harus dihapus agar Google tidak menghidupkan akun');
	assert.ok(u.dihapus_at, 'waktu penghapusan harus tercatat');
});

test('email konfirmasi tidak peduli besar-kecil huruf dan spasi', async () => {
	const db = buatDb();
	siapkanSantri(db);

	const hasil = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: '  ZAID@Contoh.Test  '
	});
	assert.equal(hasil.ok, true, 'pengguna mengetik ulang emailnya, bukan menyalin byte demi byte');
});

test('semua sesi dicabut supaya akun langsung logout', async () => {
	const db = buatDb();
	siapkanSantri(db);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});

	const sisa = db.prepare(`SELECT COUNT(*) n FROM sessions WHERE user_id='u-santri'`).get() as {
		n: number;
	};
	assert.equal(Number(sisa.n), 0, 'sesi tersisa berarti akun masih bisa dipakai');
});

test('riwayat belajar & keuangan TIDAK ikut terhapus', async () => {
	const db = buatDb();
	siapkanSantri(db);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});

	const h = db.prepare(`SELECT COUNT(*) n FROM hafalan_progress`).get() as { n: number };
	const c = db.prepare(`SELECT COUNT(*) n FROM coin_transactions`).get() as { n: number };

	// Identitasnya sudah hilang di tabel users, jadi baris ini tidak lagi
	// menunjuk orang tertentu. Menghapusnya justru merusak rekap lembaga
	// dan catatan keuangan yang wajib disimpan.
	assert.equal(Number(h.n), 1, 'progres hafalan lembaga tidak boleh hilang');
	assert.equal(Number(c.n), 1, 'riwayat transaksi wajib tersimpan untuk audit');
});

test('penilaian ustadz atas setoran santri lain tidak ikut rusak', async () => {
	const db = buatDb();
	siapkanSantri(db);
	db.exec(`
		INSERT INTO users (id, username, email, role) VALUES ('u-ustadz', 'Ustadz A', 'ustadz@contoh.test', 'ustadz');
		INSERT INTO tpq_setoran (id, santri_user_id, ustadz_user_id, status)
		VALUES ('st1', 'u-santri', 'u-ustadz', 'approved'),
		       ('st2', 'u-lain', 'u-ustadz', 'approved');
	`);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-ustadz',
		konfirmasiEmail: 'ustadz@contoh.test'
	});

	const n = db.prepare(`SELECT COUNT(*) n FROM tpq_setoran`).get() as { n: number };
	assert.equal(
		Number(n.n),
		2,
		'menghapus ustadz tidak boleh menghapus setoran santri — itu data milik santri'
	);
});

test('admin satu-satunya sebuah lembaga DITOLAK menghapus akun', async () => {
	const db = buatDb();
	db.exec(`
		INSERT INTO users (id, username, email, role, org_id)
		VALUES ('u-admin', 'Admin', 'admin@contoh.test', 'admin', 'org-1');
		INSERT INTO organizations (id, name, akun_admin_id) VALUES ('org-1', 'TPQ Al-Hidayah', 'u-admin');
	`);

	const hasil = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-admin',
		konfirmasiEmail: 'admin@contoh.test'
	});

	assert.equal(hasil.ok, false);
	assert.equal(hasil.alasan, ALASAN_TOLAK.ADMIN_TUNGGAL);

	const u = db.prepare(`SELECT email FROM users WHERE id='u-admin'`).get() as { email: string };
	assert.equal(u.email, 'admin@contoh.test', 'lembaga tidak boleh ditinggalkan tanpa admin');
});

test('akun yang sudah dihapus tidak bisa dihapus dua kali', async () => {
	const db = buatDb();
	siapkanSantri(db);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});
	const kedua = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});

	assert.equal(kedua.ok, false, 'penghapusan kedua harus ditolak');
});

test('akun tidak dikenal ditolak tanpa membocorkan keberadaannya', async () => {
	const db = buatDb();
	const hasil = await hapusAkunMandiri(d1(db) as never, {
		userId: 'tidak-ada',
		konfirmasiEmail: 'apa@saja.test'
	});
	assert.equal(hasil.ok, false);
	assert.equal(hasil.alasan, ALASAN_TOLAK.EMAIL_TIDAK_COCOK);
});

test('penghapusan tercatat sebagai jejak audit', async () => {
	const db = buatDb();
	siapkanSantri(db);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});

	const log = db
		.prepare(`SELECT action, metadata FROM activity_logs WHERE user_id='u-santri'`)
		.get() as { action: string; metadata: string } | undefined;

	assert.ok(log, 'penghapusan akun wajib meninggalkan jejak audit');
	assert.match(log.action, /HAPUS_AKUN/);
	// Jejak audit TIDAK boleh menyimpan ulang email yang baru saja dihapus.
	assert.doesNotMatch(log.metadata ?? '', /zaid@contoh\.test/);
});

test('email pengganti unik agar tidak bentrok saat banyak akun dihapus', async () => {
	const db = buatDb();
	siapkanSantri(db);
	db.exec(
		`INSERT INTO users (id, username, email) VALUES ('u-dua', 'Dua', 'dua@contoh.test')`
	);

	await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-santri',
		konfirmasiEmail: 'zaid@contoh.test'
	});
	const kedua = await hapusAkunMandiri(d1(db) as never, {
		userId: 'u-dua',
		konfirmasiEmail: 'dua@contoh.test'
	});

	assert.equal(kedua.ok, true, 'akun kedua harus tetap bisa dihapus (email UNIQUE)');

	const semua = db.prepare(`SELECT email FROM users`).all() as { email: string }[];
	const unik = new Set(semua.map((r) => r.email));
	assert.equal(unik.size, semua.length, 'email pengganti harus unik per akun');
});
