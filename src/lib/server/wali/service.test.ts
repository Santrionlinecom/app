// src/lib/server/wali/service.test.ts
// Penjaga keamanan relasi wali↔santri.
//
// Yang dijaga tes ini adalah aturan yang kalau bocor berakibat serius:
// seorang wali membaca data anak orang lain. Karena itu jalur otorisasi
// diuji dengan D1 tiruan yang merekam SQL + parameter sebenarnya.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
	assertWaliBerhak,
	buatKodeUndangan,
	daftarAnak,
	tukarUndangan
} from './service.ts';

/** D1 tiruan minimal: mengembalikan baris yang sudah disiapkan per pola SQL. */
function buatDbTiruan(handler: (sql: string, params: unknown[]) => unknown) {
	const jejak: { sql: string; params: unknown[] }[] = [];

	const db = {
		jejak,
		prepare(sql: string) {
			let terikat: unknown[] = [];
			const stmt = {
				bind(...params: unknown[]) {
					terikat = params;
					return stmt;
				},
				async first<T>() {
					jejak.push({ sql, params: terikat });
					return (handler(sql, terikat) ?? null) as T | null;
				},
				async all<T>() {
					jejak.push({ sql, params: terikat });
					return { results: (handler(sql, terikat) ?? []) as T[] };
				},
				async run() {
					jejak.push({ sql, params: terikat });
					return { success: true };
				}
			};
			return stmt;
		},
		async batch(stmts: unknown[]) {
			return stmts.map(() => ({ success: true }));
		}
	};

	return db as unknown as Parameters<typeof daftarAnak>[0] & { jejak: typeof jejak };
}

test('kode undangan tidak memuat karakter yang mudah tertukar', () => {
	for (let i = 0; i < 200; i += 1) {
		const kode = buatKodeUndangan();
		assert.match(kode, /^WALI-[A-Z2-9]{6}$/, `kode tidak sesuai pola: ${kode}`);
		// 0/O dan 1/I sengaja dibuang agar tidak salah ketik saat dibacakan.
		assert.doesNotMatch(kode.slice(5), /[01OI]/);
	}
});

test('kode undangan tidak berulang dalam 500 pembuatan', () => {
	const kumpulan = new Set<string>();
	for (let i = 0; i < 500; i += 1) kumpulan.add(buatKodeUndangan());
	assert.equal(kumpulan.size, 500, 'kode undangan bertabrakan — entropi kurang');
});

test('assertWaliBerhak menolak wali yang tidak punya relasi aktif', async () => {
	const db = buatDbTiruan(() => null); // tidak ada baris relasi
	await assert.rejects(
		() => assertWaliBerhak(db, 'wali-asing', 'anak-orang-lain'),
		/WALI_TIDAK_BERHAK/
	);
});

test('assertWaliBerhak meloloskan wali dengan relasi aktif', async () => {
	const db = buatDbTiruan(() => ({ id: 'rel-1' }));
	await assert.doesNotReject(() => assertWaliBerhak(db, 'wali-1', 'anak-1'));
});

test('kueri otorisasi selalu menyaring status aktif dan kedua id', async () => {
	const db = buatDbTiruan(() => ({ id: 'rel-1' }));
	await assertWaliBerhak(db, 'wali-1', 'anak-1');

	const jejak = db.jejak.at(-1);
	assert.ok(jejak, 'tidak ada kueri yang tercatat');
	assert.match(jejak.sql, /status\s*=\s*'aktif'/, 'lupa menyaring status aktif');
	assert.match(jejak.sql, /wali_user_id\s*=\s*\?/);
	assert.match(jejak.sql, /santri_user_id\s*=\s*\?/);
	assert.deepEqual(jejak.params, ['wali-1', 'anak-1']);
});

test('daftarAnak hanya mengambil relasi milik wali yang bertanya', async () => {
	const db = buatDbTiruan((sql) =>
		sql.includes('FROM wali_santri')
			? [{ santri_user_id: 'anak-1', hubungan: 'ayah', nama: 'Zaid', lembaga_nama: 'TPQ Al-Hidayah' }]
			: []
	);

	const hasil = await daftarAnak(db, 'wali-1');
	assert.equal(hasil.length, 1);
	assert.equal(hasil[0].santriUserId, 'anak-1');

	const jejak = db.jejak.at(-1);
	assert.ok(jejak, 'tidak ada kueri yang tercatat');
	assert.match(jejak.sql, /status\s*=\s*'aktif'/);
	assert.deepEqual(jejak.params, ['wali-1']);
});

test('undangan kedaluwarsa ditolak', async () => {
	const kemarin = Math.floor(Date.now() / 1000) - 86_400;
	const db = buatDbTiruan(() => ({
		kode: 'WALI-ABC234',
		santri_user_id: 'anak-1',
		lembaga_id: null,
		hubungan: 'ayah',
		expires_at: kemarin,
		dipakai_oleh: null
	}));

	const hasil = await tukarUndangan(db, 'WALI-ABC234', 'wali-1');
	assert.deepEqual(hasil, { ok: false, alasan: 'kedaluwarsa' });
});

test('undangan yang sudah dipakai tidak bisa dipakai ulang', async () => {
	const besok = Math.floor(Date.now() / 1000) + 86_400;
	const db = buatDbTiruan(() => ({
		kode: 'WALI-ABC234',
		santri_user_id: 'anak-1',
		lembaga_id: null,
		hubungan: 'ayah',
		expires_at: besok,
		dipakai_oleh: 'wali-lain'
	}));

	const hasil = await tukarUndangan(db, 'WALI-ABC234', 'wali-1');
	assert.deepEqual(hasil, { ok: false, alasan: 'sudah_dipakai' });
});

test('kode asing ditolak tanpa membocorkan apakah santrinya ada', async () => {
	const db = buatDbTiruan(() => null);
	const hasil = await tukarUndangan(db, 'WALI-ZZZZZZ', 'wali-1');
	assert.deepEqual(hasil, { ok: false, alasan: 'tidak_ditemukan' });
});

test('santri tidak bisa menjadi wali bagi dirinya sendiri', async () => {
	const besok = Math.floor(Date.now() / 1000) + 86_400;
	const db = buatDbTiruan(() => ({
		kode: 'WALI-ABC234',
		santri_user_id: 'anak-1',
		lembaga_id: null,
		hubungan: 'ayah',
		expires_at: besok,
		dipakai_oleh: null
	}));

	const hasil = await tukarUndangan(db, 'WALI-ABC234', 'anak-1');
	assert.deepEqual(hasil, { ok: false, alasan: 'diri_sendiri' });
});

test('kode diterima tanpa peduli huruf besar-kecil dan spasi', async () => {
	const besok = Math.floor(Date.now() / 1000) + 86_400;
	let kodeTerkirim: unknown = null;

	const db = buatDbTiruan((sql, params) => {
		if (sql.includes('FROM wali_undangan')) {
			kodeTerkirim = params[0];
			return {
				kode: 'WALI-ABC234',
				santri_user_id: 'anak-1',
				lembaga_id: null,
				hubungan: 'ayah',
				expires_at: besok,
				dipakai_oleh: null
			};
		}
		return null; // belum ada relasi
	});

	const hasil = await tukarUndangan(db, '  wali-abc234  ', 'wali-1');
	assert.equal(kodeTerkirim, 'WALI-ABC234', 'kode harus dinormalkan sebelum dicari');
	assert.deepEqual(hasil, { ok: true, santriUserId: 'anak-1' });
});

test('pengecekan relasi ganda hanya menghitung relasi yang masih aktif', async () => {
	// Relasi yang sudah DICABUT tidak boleh menghalangi wali tersambung lagi.
	// Karena itu kuerinya wajib menyaring status='aktif' — bukan sekadar
	// mencari pasangan wali+santri apa pun.
	const besok = Math.floor(Date.now() / 1000) + 86_400;
	let sqlCekRelasi = '';

	const db = buatDbTiruan((sql) => {
		if (sql.includes('FROM wali_undangan')) {
			return {
				kode: 'WALI-ABC234',
				santri_user_id: 'anak-1',
				lembaga_id: null,
				hubungan: 'ayah',
				expires_at: besok,
				dipakai_oleh: null
			};
		}
		if (sql.includes('FROM wali_santri')) {
			sqlCekRelasi = sql;
			return null;
		}
		return null;
	});

	await tukarUndangan(db, 'WALI-ABC234', 'wali-1');

	assert.ok(sqlCekRelasi, 'tukarUndangan tidak memeriksa relasi yang sudah ada');
	assert.match(
		sqlCekRelasi,
		/status\s*=\s*'aktif'/,
		'cek relasi ganda wajib menyaring aktif — kalau tidak, relasi yang sudah dicabut memblokir penyambungan ulang'
	);
});
