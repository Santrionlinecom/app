// src/routes/halaman-berdata-wajib-server.test.ts
// Penjaga: halaman yang MENAMPILKAN DATA wajib punya +page.server.ts.
//
// Latar (2026-08-21): /dashboard/halaqoh dikirim ke produksi berisi strip
// "-" dan catatan "Integrasikan data halaqoh di sini", sementara datanya
// sebenarnya sudah ada di database. /dashboard/diniyah menyimpan 7 slug
// kitab langsung di komponen, sehingga tautannya diam-diam mati begitu
// sebuah kitab berganti slug.
//
// Angka palsu di dashboard lebih berbahaya daripada halaman kosong:
// pengurus menyimpulkan sistemnya belum jalan padahal datanya ada.
//
// Tes ini menolak halaman terdaftar yang kehilangan pemuat servernya.

import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const akar = fileURLToPath(new URL('./', import.meta.url));

/**
 * Halaman yang isinya bergantung pada database.
 * Menambah halaman berdata baru? Daftarkan di sini.
 */
const WAJIB_SERVER = [
	'(app)/wali',
	'(app)/wali/[santriId]',
	'(app)/halaqah',
	'(app)/rapor',
	'(app)/dashboard/halaqoh',
	'(app)/dashboard/diniyah',
	'(app)/dashboard/kotak-setoran',
	'(app)/dashboard/kelola-halaqah',
	'(app)/dashboard/terbitkan-rapor',
	'(app)/lembaga/undangan-wali',
	's/[slug]'
];

for (const rute of WAJIB_SERVER) {
	test(`halaman berdata ${rute} punya +page.server.ts`, () => {
		assert.ok(
			existsSync(`${akar}${rute}/+page.server.ts`),
			`${rute} menampilkan data tapi tidak punya +page.server.ts — isinya berisiko jadi angka mati yang menyesatkan`
		);
	});
}

test('halaman diniyah tidak lagi menyimpan slug kitab di komponen', async () => {
	const { readFileSync } = await import('node:fs');
	const komponen = readFileSync(`${akar}(app)/dashboard/diniyah/+page.svelte`, 'utf8');

	assert.ok(
		!komponen.includes('safinatun-najah-makna-perkata'),
		'slug kitab masih ditulis di komponen — tautan akan mati diam-diam saat slug berubah'
	);
});

test('halaman halaqoh tidak lagi menampilkan angka placeholder', async () => {
	const { readFileSync } = await import('node:fs');
	const komponen = readFileSync(`${akar}(app)/dashboard/halaqoh/+page.svelte`, 'utf8');

	assert.ok(
		!komponen.includes('Integrasikan data halaqoh'),
		'halaman masih berisi catatan placeholder'
	);
	assert.ok(
		komponen.includes('data.halaqahAktif'),
		'angka ringkasan harus datang dari server, bukan ditulis di komponen'
	);
});
