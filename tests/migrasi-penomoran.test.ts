import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Penjaga penomoran migrasi.
 *
 * Latar belakang (audit 2026-08-20): repo ini pernah punya 6 nomor migrasi
 * kembar. Nomor kembar berbahaya karena urutan eksekusi jadi bergantung pada
 * urutan abjad, bukan urutan yang dimaksud penulisnya — dan pada pembangunan
 * ulang database dari nol, migrasi bisa berjalan sebelum tabel yang
 * dibutuhkannya ada.
 *
 * Enam kembar lama SENGAJA dibiarkan apa adanya, karena namanya sudah
 * tercatat di tabel `d1_migrations` produksi. Mengganti namanya akan membuat
 * `wrangler d1 migrations apply` menganggapnya migrasi baru lalu
 * menjalankannya ulang di atas data yang sudah hidup.
 *
 * Yang dijaga tes ini: JANGAN SAMPAI BERTAMBAH.
 */

const DIR_MIGRASI = path.resolve('migrations');

/** Kembar warisan yang sudah tercatat di produksi. Daftar ini tidak boleh tumbuh. */
const KEMBAR_WARISAN = new Set(['0005', '0024', '0030', '0038', '0039', '0068']);

const berkasMigrasi = () =>
	readdirSync(DIR_MIGRASI)
		.filter((f) => f.endsWith('.sql'))
		.sort();

const prefiks = (nama: string) => nama.split('_')[0];

describe('penomoran migrasi', () => {
	it('tidak menambah nomor kembar baru di luar warisan yang sudah tercatat', () => {
		const perNomor = new Map<string, string[]>();
		for (const f of berkasMigrasi()) {
			const p = prefiks(f);
			if (!perNomor.has(p)) perNomor.set(p, []);
			perNomor.get(p)!.push(f);
		}

		const kembarBaru = [...perNomor.entries()]
			.filter(([nomor, daftar]) => daftar.length > 1 && !KEMBAR_WARISAN.has(nomor))
			.map(([nomor, daftar]) => `${nomor}: ${daftar.join(', ')}`);

		assert.deepEqual(
			kembarBaru,
			[],
			`Ada nomor migrasi kembar baru. Beri nomor unik berikutnya:\n${kembarBaru.join('\n')}`
		);
	});

	it('kembar warisan tidak berkurang maupun bertambah tanpa disadari', () => {
		const perNomor = new Map<string, number>();
		for (const f of berkasMigrasi()) {
			const p = prefiks(f);
			perNomor.set(p, (perNomor.get(p) ?? 0) + 1);
		}
		const kembarSekarang = new Set(
			[...perNomor.entries()].filter(([, n]) => n > 1).map(([nomor]) => nomor)
		);

		assert.deepEqual(
			[...kembarSekarang].sort(),
			[...KEMBAR_WARISAN].sort(),
			'Daftar kembar berubah. Bila sengaja merapikan nama, perbarui juga d1_migrations produksi dan daftar KEMBAR_WARISAN di tes ini.'
		);
	});

	it('setiap migrasi baru memakai nomor 4 digit', () => {
		const salahFormat = berkasMigrasi().filter((f) => {
			const p = prefiks(f);
			// 001/002/003 adalah tiga migrasi paling awal, sebelum konvensi 4 digit.
			if (['001', '002', '003'].includes(p)) return false;
			return !/^\d{4}$/.test(p);
		});

		assert.deepEqual(
			salahFormat,
			[],
			`Nama migrasi harus diawali 4 digit, contoh 0072_nama_migrasi.sql:\n${salahFormat.join('\n')}`
		);
	});

	it('nomor migrasi berikutnya belum terpakai', () => {
		const angka = berkasMigrasi()
			.map((f) => Number.parseInt(prefiks(f), 10))
			.filter((n) => Number.isFinite(n));
		const tertinggi = Math.max(...angka);
		const berikutnya = String(tertinggi + 1).padStart(4, '0');
		const bentrok = berkasMigrasi().filter((f) => prefiks(f) === berikutnya);

		assert.deepEqual(bentrok, [], `Nomor ${berikutnya} seharusnya masih kosong.`);
	});
});
