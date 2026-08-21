// src/lib/server/coins/topup-manual.test.ts
// Penjaga aturan uang pada top up manual.
//
// Yang dijaga di sini bukan tampilan, melainkan hal-hal yang kalau bocor
// berarti kerugian nyata: nominal dipalsukan klien, coin bertambah tanpa
// verifikasi, atau metode nonaktif dipakai.

import assert from 'node:assert/strict';
import test from 'node:test';
import { buatPermintaanManual, metodeManualAktif, JANJI_VERIFIKASI } from './topup-manual.ts';

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
					return { success: true, meta: { changes: 1 } };
				}
			};
			return stmt;
		}
	};
	return db as unknown as Parameters<typeof buatPermintaanManual>[0] & { jejak: typeof jejak };
}

/** Dua metode: satu aktif (BCA), satu nonaktif. */
const barisMetode = [
	{
		id: 'manual-bca-yogik',
		name: 'BCA TRANSFER',
		type: 'manual',
		account_name: 'Yogik Pratama Aprilian',
		account_number: '3314050695',
		instructions: 'Transfer lalu upload bukti.',
		is_active: 1,
		display_order: 1,
		asset_url: null,
		created_at: 1,
		updated_at: 1
	},
	{
		id: 'manual-nonaktif',
		name: 'Rekening Lama',
		type: 'manual',
		account_name: 'Lama',
		account_number: '000',
		instructions: null,
		is_active: 0,
		display_order: 2,
		asset_url: null,
		created_at: 1,
		updated_at: 1
	}
];

const PAKET = { id: 'coin-100', name: '100 Coin', amountRupiah: 25_000, coinAmount: 100 };

const dbDenganMetode = () =>
	buatDbTiruan((sql) => (sql.includes('digital_payment_methods') ? barisMetode : null));

test('janji verifikasi ditulis apa adanya, bukan janji instan', () => {
	assert.match(JANJI_VERIFIKASI, /1x24 jam/);
	assert.doesNotMatch(JANJI_VERIFIKASI.toLowerCase(), /instan|otomatis|langsung/);
});

test('hanya metode AKTIF yang boleh tampil', async () => {
	const metode = await metodeManualAktif(dbDenganMetode());
	assert.equal(metode.length, 1, 'metode nonaktif ikut bocor ke UI');
	assert.equal(metode[0].id, 'manual-bca-yogik');
	assert.equal(metode[0].nomorRekening, '3314050695');
});

test('NOMINAL diambil dari paket server, bukan dari klien', async () => {
	const db = dbDenganMetode();

	await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO coin_topup_requests'));
	assert.ok(insert, 'permintaan tidak tersimpan');

	// Urutan bind: id, user_id, amount_rupiah, coin_amount, ...
	assert.equal(insert.params[2], 25_000, 'nominal harus dari paket server');
	assert.equal(insert.params[3], 100, 'jumlah coin harus dari paket server');
});

test('permintaan manual TIDAK menambah saldo coin', async () => {
	const db = dbDenganMetode();

	await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	const menyentuhSaldo = db.jejak.some(
		(j) => /UPDATE\s+users/i.test(j.sql) || /balance/i.test(j.sql) || /wallet/i.test(j.sql)
	);
	assert.ok(
		!menyentuhSaldo,
		'top up manual tidak boleh menyentuh saldo — coin hanya bertambah setelah admin menyetujui'
	);
});

test('permintaan selalu berstatus pending', async () => {
	const db = dbDenganMetode();

	await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO coin_topup_requests'));
	assert.ok(insert);
	assert.match(insert.sql, /'pending'/, 'permintaan wajib pending');
	assert.doesNotMatch(insert.sql, /'approved'/, 'tidak boleh langsung disetujui');
});

test('bukti transfer wajib ada', async () => {
	const db = dbDenganMetode();

	const hasil = await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: '   '
	});

	assert.deepEqual(hasil, { ok: false, alasan: 'bukti_kosong' });
	assert.ok(
		!db.jejak.some((j) => j.sql.includes('INSERT INTO coin_topup_requests')),
		'tidak boleh tersimpan tanpa bukti'
	);
});

test('metode nonaktif ditolak meski id-nya benar', async () => {
	const db = dbDenganMetode();

	const hasil = await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-nonaktif',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	assert.deepEqual(hasil, { ok: false, alasan: 'metode_tidak_sah' });
});

test('metode karangan ditolak', async () => {
	const db = dbDenganMetode();

	const hasil = await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'rekening-penipu',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	assert.deepEqual(hasil, { ok: false, alasan: 'metode_tidak_sah' });
});

test('paket tidak dikenal ditolak sebelum menyentuh database', async () => {
	const db = dbDenganMetode();

	const hasil = await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: null,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg'
	});

	assert.deepEqual(hasil, { ok: false, alasan: 'paket_tidak_sah' });
	assert.equal(db.jejak.length, 0, 'tidak boleh ada kueri untuk paket tak dikenal');
});

test('catatan kelewat panjang ditolak', async () => {
	const db = dbDenganMetode();

	const hasil = await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg',
		catatan: 'a'.repeat(501)
	});

	assert.deepEqual(hasil, { ok: false, alasan: 'catatan_panjang' });
});

test('catatan pengguna diberi label metode agar mudah diverifikasi admin', async () => {
	const db = dbDenganMetode();

	await buatPermintaanManual(db, {
		userId: 'santri-1',
		paket: PAKET,
		metodeId: 'manual-bca-yogik',
		buktiUrl: 'https://files.santrionline.com/bukti.jpg',
		catatan: 'transfer a.n. Ahmad'
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO coin_topup_requests'));
	assert.ok(insert);
	const catatan = String(insert.params[5]);
	assert.match(catatan, /\[MANUAL\]/);
	assert.match(catatan, /BCA TRANSFER/);
	assert.match(catatan, /transfer a\.n\. Ahmad/);
});
