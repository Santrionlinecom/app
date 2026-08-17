import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	daftarKursus,
	hitungHargaKursus,
	sudahTerdaftar,
	KURSUS_GRATIS
} from '../src/lib/server/domains/kursus/pendaftaran';

/**
 * Kursus memakai ulang dompet koin yang sudah ada (coin_wallets,
 * coin_transactions) lewat deductCoins — bukan membuat sistem saldo baru.
 *
 * Aturan:
 *  - harga 0 berarti gratis: langsung terdaftar tanpa menyentuh dompet
 *  - harga > 0 memotong koin, dan gagal bila saldo kurang
 *  - pendaftaran ganda tidak boleh memotong koin dua kali
 */

/** Basis data tiruan seperlunya. */
const buatDb = (opsi: {
	saldo?: number;
	sudahDaftar?: boolean;
	kursus?: Record<string, unknown> | null;
} = {}) => {
	const saldo = opsi.saldo ?? 0;
	const sql: string[] = [];
	const db = {
		prepare(teks: string) {
			sql.push(teks);
			const statement = {
				bind() {
					return statement;
				},
				async first() {
					if (teks.includes('FROM kursus_pendaftaran')) {
						return opsi.sudahDaftar ? { id: 'daftar-1' } : null;
					}
					if (teks.includes('FROM kursus')) {
						return opsi.kursus === undefined
							? { id: 'k-1', slug: 'uji', harga_koin: 0, status: 'published' }
							: opsi.kursus;
					}
					if (teks.includes('FROM coin_wallets')) return { balance: saldo };
					return null;
				},
				async run() {
					return { meta: { changes: 1 } };
				},
				async all() {
					return { results: [] };
				}
			};
			return statement;
		},
		async batch() {
			return [];
		}
	};
	return { db, sql };
};

test('kursus gratis langsung terdaftar tanpa menyentuh dompet', async () => {
	const { db, sql } = buatDb({ saldo: 0, kursus: { id: 'k-1', slug: 'dasar', harga_koin: 0, status: 'published' } });
	const hasil = await daftarKursus(db as never, 'u-1', 'dasar');

	assert.equal(hasil.status, 'terdaftar');
	assert.equal(
		sql.some((s) => s.includes('UPDATE coin_wallets')),
		false,
		'kursus gratis tidak boleh memotong koin'
	);
});

test('kursus berbayar memotong koin sesuai harga', async () => {
	const { db, sql } = buatDb({
		saldo: 500,
		kursus: { id: 'k-2', slug: 'lanjut', harga_koin: 200, status: 'published' }
	});
	const hasil = await daftarKursus(db as never, 'u-1', 'lanjut');

	assert.equal(hasil.status, 'terdaftar');
	assert.equal(
		sql.some((s) => s.includes('UPDATE coin_wallets')),
		true,
		'kursus berbayar wajib memotong koin'
	);
});

test('saldo kurang ditolak dan tidak mendaftarkan', async () => {
	const { db, sql } = buatDb({
		saldo: 50,
		kursus: { id: 'k-3', slug: 'mahal', harga_koin: 500, status: 'published' }
	});
	const hasil = await daftarKursus(db as never, 'u-1', 'mahal');

	assert.equal(hasil.status, 'saldo_kurang');
	assert.equal('kurang' in hasil && hasil.kurang, 450);
	assert.equal(
		sql.some((s) => s.includes('INSERT INTO kursus_pendaftaran')),
		false,
		'jangan mendaftarkan bila saldo kurang'
	);
});

test('pendaftaran ganda tidak memotong koin dua kali', async () => {
	const { db, sql } = buatDb({
		saldo: 1000,
		sudahDaftar: true,
		kursus: { id: 'k-4', slug: 'ulang', harga_koin: 300, status: 'published' }
	});
	const hasil = await daftarKursus(db as never, 'u-1', 'ulang');

	assert.equal(hasil.status, 'sudah_terdaftar');
	assert.equal(
		sql.some((s) => s.includes('UPDATE coin_wallets')),
		false,
		'jangan memotong koin untuk pendaftaran ulang'
	);
});

test('kursus tidak ditemukan ditolak dengan jelas', async () => {
	const { db } = buatDb({ saldo: 1000, kursus: null });
	const hasil = await daftarKursus(db as never, 'u-1', 'tidak-ada');
	assert.equal(hasil.status, 'tidak_ditemukan');
});

test('kursus draft tidak bisa didaftari', async () => {
	const { db } = buatDb({
		saldo: 1000,
		kursus: { id: 'k-5', slug: 'draf', harga_koin: 0, status: 'draft' }
	});
	const hasil = await daftarKursus(db as never, 'u-1', 'draf');
	assert.equal(hasil.status, 'tidak_ditemukan', 'kursus draft diperlakukan seperti tidak ada');
});

test('hitungHargaKursus menormalkan nilai tidak wajar', () => {
	assert.equal(hitungHargaKursus(0), KURSUS_GRATIS);
	assert.equal(hitungHargaKursus(-50), KURSUS_GRATIS, 'harga minus dianggap gratis');
	assert.equal(hitungHargaKursus(2.7), 2, 'pecahan dibulatkan ke bawah');
	assert.equal(hitungHargaKursus(150), 150);
});

test('sudahTerdaftar mengembalikan boolean, bukan baris mentah', async () => {
	const { db } = buatDb({ sudahDaftar: true });
	assert.equal(await sudahTerdaftar(db as never, 'u-1', 'k-1'), true);

	const kosong = buatDb({ sudahDaftar: false });
	assert.equal(await sudahTerdaftar(kosong.db as never, 'u-1', 'k-1'), false);
});
