import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Kursus adalah pilar keempat setelah lembaga, buku, dan produk digital.
 * Test ini menjaga agar halaman, API, dan menunya tidak hilang diam-diam.
 */

const akar = process.cwd();
const layout = readFileSync(join(akar, 'src/routes/+layout.svelte'), 'utf-8');

test('halaman kursus tersedia', () => {
	for (const berkas of [
		'src/routes/kursus/+page.server.ts',
		'src/routes/kursus/+page.svelte',
		'src/routes/kursus/[slug]/+page.server.ts',
		'src/routes/kursus/[slug]/+page.svelte',
		'src/routes/api/kursus/daftar/+server.ts'
	]) {
		assert.equal(existsSync(join(akar, berkas)), true, `${berkas} tidak ada`);
	}
});

test('kursus muncul di menu Belajar', () => {
	assert.match(layout, /href: '\/kursus'/, 'menu kursus wajib ada di navigasi');
});

test('rute kursus menyalakan penanda menu aktif', () => {
	assert.match(
		layout,
		/path\.startsWith\('\/kursus'\)/,
		'membuka /kursus wajib menyorot menu Belajar'
	);
});

test('migrasi kursus ada dan memakai ulang dompet koin', () => {
	const migrasi = readFileSync(join(akar, 'migrations/0062_kursus.sql'), 'utf-8');
	for (const tabel of ['kursus', 'kursus_materi', 'kursus_pendaftaran', 'kursus_progres']) {
		assert.match(migrasi, new RegExp(`CREATE TABLE IF NOT EXISTS ${tabel}\\b`), `tabel ${tabel} kurang`);
	}

	// Kursus tidak boleh membuat tabel saldo sendiri — dompet koin sudah ada.
	assert.equal(
		/CREATE TABLE[^;]*kursus_(saldo|wallet|dompet)/i.test(migrasi),
		false,
		'kursus wajib memakai coin_wallets yang sudah ada, bukan saldo terpisah'
	);
});

test('modul pendaftaran memakai deductCoins, bukan menulis dompet langsung', () => {
	const modul = readFileSync(join(akar, 'src/lib/server/domains/kursus/pendaftaran.ts'), 'utf-8');
	assert.match(modul, /deductCoins/, 'pemotongan koin wajib lewat deductCoins');
	assert.equal(
		/UPDATE\s+coin_wallets/i.test(modul),
		false,
		'jangan menulis coin_wallets langsung — pakai deductCoins agar transaksi tercatat'
	);
});

test('materi kursus berbayar tidak ikut terkirim sebelum mendaftar', () => {
	const server = readFileSync(join(akar, 'src/routes/kursus/[slug]/+page.server.ts'), 'utf-8');
	assert.match(
		server,
		/boleh \? ', isi' : ''/,
		'kolom isi hanya boleh diambil untuk yang sudah terdaftar'
	);
});
