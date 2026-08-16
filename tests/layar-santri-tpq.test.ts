import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Layar pendataan santri TPQ.
 *
 * Halaman `kelola-santri` yang lama membuat akun login (email + password) dan
 * dipakai bersama untuk jamaah masjid, sehingga tidak cocok untuk mendata anak
 * TPQ. Layar ini terpisah dan menulis ke tabel `santri` lewat
 * `/api/tpq/santri`.
 *
 * Tanpa layar ini rantainya putus: endpoint dan skema setoran sudah siap,
 * tetapi tidak ada cara memasukkan santri lewat antarmuka.
 */

const halaman = readFileSync(
	join(process.cwd(), 'src/routes/(app)/dashboard/santri-tpq/+page.svelte'),
	'utf-8'
);

const server = readFileSync(
	join(process.cwd(), 'src/routes/(app)/dashboard/santri-tpq/+page.server.ts'),
	'utf-8'
);

test('halaman memakai endpoint pendataan, bukan endpoint akun', () => {
	assert.match(halaman, /\/api\/tpq\/santri/, 'wajib memanggil endpoint pendataan');
	assert.equal(
		/['"`]\/api\/santri['"`]/.test(halaman),
		false,
		'tidak boleh memakai endpoint pembuat akun login'
	);
});

test('formulir mengisi kolom yang dibutuhkan pengurus TPQ', () => {
	for (const kolom of ['nama', 'nis', 'kelas', 'waliNama', 'waliHp']) {
		assert.match(halaman, new RegExp(kolom), `kolom ${kolom} wajib ada di formulir`);
	}
});

test('formulir tidak meminta email maupun password', () => {
	// Inti perbaikan: anak TPQ tidak perlu akun login.
	assert.equal(/type="email"/.test(halaman), false, 'tidak boleh meminta email');
	assert.equal(/type="password"/.test(halaman), false, 'tidak boleh meminta password');
});

test('halaman menampilkan daftar santri yang sudah didata', () => {
	assert.match(halaman, /\{#each/, 'wajib merender daftar santri');
});

test('halaman menangani kondisi kosong dan galat', () => {
	assert.match(halaman, /Belum ada/i, 'wajib ada pesan saat data kosong');
	assert.match(halaman, /error|Error/, 'wajib menampilkan pesan galat');
});

test('server memuat halaman hanya untuk anggota lembaga', () => {
	assert.match(server, /assertOrgMember|activeOrg/, 'wajib terikat lembaga aktif');
});

test('menu Data Santri TPQ terdaftar di navigasi', () => {
	const nav = readFileSync(join(process.cwd(), 'src/lib/config/app-navigation.ts'), 'utf-8');
	assert.match(nav, /santri-tpq/, 'menu wajib bisa dijangkau pengguna');
});
