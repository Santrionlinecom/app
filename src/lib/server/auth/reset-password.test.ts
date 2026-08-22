// src/lib/server/auth/reset-password.test.ts
// Penjaga reset password.
//
// Yang dijaga adalah hal-hal yang membuat tautan reset AMAN, bukan sekadar
// berfungsi. Tautan reset adalah kunci cadangan sebuah akun — kalau bocor,
// penyerang tidak perlu tahu password lama sama sekali.

import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import {
	mintaResetPassword,
	pakaiTokenReset,
	hashToken,
	MENIT_BERLAKU,
	PESAN_NETRAL
} from './reset-password.ts';

function buatDb() {
	const db = new DatabaseSync(':memory:');
	db.exec(`
		CREATE TABLE users (
			id TEXT PRIMARY KEY, username TEXT, email TEXT UNIQUE NOT NULL,
			password_hash TEXT, googleId TEXT, role TEXT DEFAULT 'santri',
			dihapus_at INTEGER
		);
		CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER);
		CREATE TABLE password_reset_tokens (
			token_hash TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at INTEGER NOT NULL,
			dipakai_at INTEGER,
			dibuat_at INTEGER NOT NULL,
			ip TEXT
		);
	`);
	db.exec(`
		INSERT INTO users (id, username, email, password_hash)
		VALUES ('u1', 'Zaid', 'zaid@contoh.test', 'hash-lama');
		INSERT INTO sessions (id, user_id, expires_at) VALUES ('s1','u1',9999999999), ('s2','u1',9999999999);
	`);
	return db;
}

function d1(db: DatabaseSync) {
	return {
		prepare(sql: string) {
			let terikat: unknown[] = [];
			const api = {
				bind(...a: unknown[]) {
					terikat = a;
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

const hashBaru = async (kata: string) => `hashed:${kata}`;

// ——— PENERBITAN TOKEN ———

test('email terdaftar menerbitkan token', async () => {
	const db = buatDb();
	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	assert.equal(hasil.kirim, true);
	assert.ok(hasil.token && hasil.token.length >= 32, 'token harus panjang & acak');
	assert.equal(hasil.email, 'zaid@contoh.test');
});

test('token ASLI tidak pernah disimpan di database', async () => {
	const db = buatDb();
	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	const baris = db.prepare(`SELECT token_hash FROM password_reset_tokens`).all() as {
		token_hash: string;
	}[];
	assert.equal(baris.length, 1);

	// Inti perlindungan: kalau database bocor, isinya tidak bisa dipakai.
	assert.notEqual(baris[0].token_hash, hasil.token);
	assert.equal(baris[0].token_hash, await hashToken(hasil.token!));
});

test('email TIDAK terdaftar dijawab sama, tanpa menerbitkan token', async () => {
	const db = buatDb();
	const hasil = await mintaResetPassword(d1(db) as never, { email: 'entah@siapa.test' });

	assert.equal(hasil.kirim, false, 'tidak ada email yang dikirim');
	assert.equal(hasil.pesan, PESAN_NETRAL, 'pesan harus sama dengan email terdaftar');

	const n = db.prepare(`SELECT COUNT(*) n FROM password_reset_tokens`).get() as { n: number };
	assert.equal(Number(n.n), 0);
});

test('pesan untuk email terdaftar dan tidak terdaftar PERSIS SAMA', async () => {
	const db = buatDb();
	const ada = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	const tiada = await mintaResetPassword(d1(db) as never, { email: 'entah@siapa.test' });

	// Kalau berbeda, halaman ini bisa dipakai memetakan siapa saja yang punya akun.
	assert.equal(ada.pesan, tiada.pesan);
});

test('akun yang sudah dihapus tidak bisa direset', async () => {
	const db = buatDb();
	db.exec(`UPDATE users SET dihapus_at = 123 WHERE id='u1'`);

	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	assert.equal(hasil.kirim, false);
	assert.equal(hasil.pesan, PESAN_NETRAL, 'jawaban tetap netral, tidak membocorkan status akun');
});

test('akun Google tanpa password tetap dijawab netral', async () => {
	const db = buatDb();
	db.exec(`UPDATE users SET password_hash = NULL, googleId = 'g-123' WHERE id='u1'`);

	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	assert.equal(hasil.pesan, PESAN_NETRAL);
});

test('email dinormalkan (huruf besar & spasi)', async () => {
	const db = buatDb();
	const hasil = await mintaResetPassword(d1(db) as never, { email: '  ZAID@Contoh.Test ' });
	assert.equal(hasil.kirim, true);
});

test('token berlaku 60 menit, tidak lebih', async () => {
	const db = buatDb();
	await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	const baris = db.prepare(`SELECT expires_at, dibuat_at FROM password_reset_tokens`).get() as {
		expires_at: number;
		dibuat_at: number;
	};
	const menit = (Number(baris.expires_at) - Number(baris.dibuat_at)) / 60_000;
	assert.equal(Math.round(menit), MENIT_BERLAKU);
	assert.ok(MENIT_BERLAKU <= 60, 'masa berlaku tidak boleh lebih dari 60 menit');
});

test('permintaan baru membatalkan token lama', async () => {
	const db = buatDb();
	const satu = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	// Token lama harus mati — kalau tidak, tautan di email lama tetap bisa dipakai.
	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: satu.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});
	assert.equal(hasil.ok, false, 'token lama harus hangus setelah minta ulang');
});

// ——— PEMAKAIAN TOKEN ———

test('token sah mengganti password', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});

	assert.equal(hasil.ok, true);
	const u = db.prepare(`SELECT password_hash FROM users WHERE id='u1'`).get() as {
		password_hash: string;
	};
	assert.equal(u.password_hash, 'hashed:passwordbaru123');
});

test('token hanya bisa dipakai SEKALI', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});
	const kedua = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'dibajak999',
		hashPassword: hashBaru
	});

	assert.equal(kedua.ok, false, 'token bekas harus ditolak');
	const u = db.prepare(`SELECT password_hash FROM users WHERE id='u1'`).get() as {
		password_hash: string;
	};
	assert.equal(u.password_hash, 'hashed:passwordbaru123', 'password tidak boleh berubah lagi');
});

test('token kedaluwarsa ditolak', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	db.exec(`UPDATE password_reset_tokens SET expires_at = ${Date.now() - 1000}`);

	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});
	assert.equal(hasil.ok, false);
});

test('token karangan ditolak', async () => {
	const db = buatDb();
	await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: 'token-karangan-penyerang',
		passwordBaru: 'dibajak999',
		hashPassword: hashBaru
	});
	assert.equal(hasil.ok, false);
});

test('password baru terlalu pendek ditolak', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: '123',
		hashPassword: hashBaru
	});
	assert.equal(hasil.ok, false);

	// Token TIDAK boleh hangus karena kesalahan ketik pengguna sendiri.
	const lagi = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});
	assert.equal(lagi.ok, true, 'token harus masih bisa dipakai setelah password terlalu pendek');
});

test('semua sesi dicabut setelah password berganti', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});

	// Kalau akun sempat diambil alih, penyusup ikut terlempar keluar.
	const n = db.prepare(`SELECT COUNT(*) n FROM sessions WHERE user_id='u1'`).get() as { n: number };
	assert.equal(Number(n.n), 0);
});

test('reset mengembalikan email pemilik untuk pemberitahuan', async () => {
	const db = buatDb();
	const minta = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	const hasil = await pakaiTokenReset(d1(db) as never, {
		token: minta.token!,
		passwordBaru: 'passwordbaru123',
		hashPassword: hashBaru
	});

	// Pemilik akun wajib diberi tahu bila password berubah — supaya dia
	// tahu kalau bukan dia pelakunya.
	assert.equal(hasil.ok, true);
	assert.equal(hasil.ok && hasil.email, 'zaid@contoh.test');
});

test('token dua akun berbeda tidak tertukar', async () => {
	const db = buatDb();
	db.exec(
		`INSERT INTO users (id, username, email, password_hash) VALUES ('u2','Dua','dua@contoh.test','hash-dua')`
	);
	const a = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
	const b = await mintaResetPassword(d1(db) as never, { email: 'dua@contoh.test' });

	assert.notEqual(a.token, b.token);

	await pakaiTokenReset(d1(db) as never, {
		token: b.token!,
		passwordBaru: 'passworddua123',
		hashPassword: hashBaru
	});

	const u1 = db.prepare(`SELECT password_hash FROM users WHERE id='u1'`).get() as {
		password_hash: string;
	};
	assert.equal(u1.password_hash, 'hash-lama', 'akun lain tidak boleh ikut berubah');
});

test('setiap token unik antar permintaan', async () => {
	const db = buatDb();
	const kumpulan = new Set<string>();
	for (let i = 0; i < 20; i += 1) {
		db.exec(`DELETE FROM password_reset_tokens`);
		const h = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
		kumpulan.add(h.token!);
	}
	assert.equal(kumpulan.size, 20, 'token tidak boleh dapat ditebak/berulang');
});

// ——— AKUN GOOGLE & SUPER ADMIN ———
//
// 27 dari 41 akun produksi masuk lewat Google tanpa password sama sekali.
// Untuk mereka, reset password bukan sekadar tidak berguna — bisa
// menyesatkan: mereka membuat password baru, lalu tetap tidak bisa masuk
// dengannya. Halaman harus jujur soal ini.

test('akun Super Admin ditolak reset — password memang tidak dipakai untuk masuk', async () => {
	const db = buatDb();
	db.exec(`UPDATE users SET role = 'SUPER_ADMIN', googleId = 'g-1' WHERE id='u1'`);

	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	// Jawaban tetap netral supaya tidak membocorkan siapa Super Admin,
	// tetapi tidak ada token yang diterbitkan dan tidak ada email dikirim.
	assert.equal(hasil.kirim, false, 'jangan terbitkan token yang percuma');
	assert.equal(hasil.pesan, PESAN_NETRAL, 'jawaban tetap tidak membocorkan peran akun');

	const n = db.prepare(`SELECT COUNT(*) n FROM password_reset_tokens`).get() as { n: number };
	assert.equal(Number(n.n), 0);
});

test('akun Google biasa TETAP boleh reset — password jadi cara masuk kedua', async () => {
	const db = buatDb();
	db.exec(`UPDATE users SET password_hash = NULL, googleId = 'g-2', role = 'santri' WHERE id='u1'`);

	const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });

	// Santri/ustadz/admin yang selama ini pakai Google boleh menambahkan
	// password, misalnya karena akun Google-nya bermasalah.
	assert.equal(hasil.kirim, true, 'akun Google biasa harus tetap bisa membuat password');
});

test('varian penulisan role Super Admin ikut ditolak', async () => {
	for (const peran of ['SUPER_ADMIN', 'SUPERADMIN', 'super-admin', 'Super Admin']) {
		const db = buatDb();
		db.exec(`UPDATE users SET role = '${peran}' WHERE id='u1'`);

		const hasil = await mintaResetPassword(d1(db) as never, { email: 'zaid@contoh.test' });
		assert.equal(hasil.kirim, false, `role "${peran}" seharusnya ditolak`);
	}
});
