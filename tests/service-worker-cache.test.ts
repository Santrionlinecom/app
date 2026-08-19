import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { bolehDisimpanDiCache, bersifatKekal } from '../src/lib/service-worker-policy';

const root = process.cwd();
const ASAL = 'https://app.santrionline.com';
const boleh = (jalur: string) => bolehDisimpanDiCache(`${ASAL}${jalur}`, ASAL);

// --- Keamanan: data pengguna tidak boleh mengendap di perangkat ---

test('balasan API tidak pernah disimpan', () => {
	for (const jalur of [
		'/api/admin/notifications',
		'/api/quran/1',
		'/api/push/subscribe',
		'/api/drm/serve-pdf'
	]) {
		assert.equal(boleh(jalur), false, `${jalur} tidak boleh disimpan`);
	}
});

test('halaman ber-sesi dan halaman admin tidak disimpan', () => {
	for (const jalur of ['/dashboard', '/akun', '/admin/kursus', '/auth', '/logout', '/keuangan']) {
		assert.equal(boleh(jalur), false, `${jalur} tidak boleh disimpan`);
	}
});

test('URL dengan query string tidak disimpan', () => {
	assert.equal(boleh('/flags/id.svg?v=2'), false);
});

test('aset domain lain tidak disimpan', () => {
	assert.equal(
		bolehDisimpanDiCache('https://files.santrionline.com/logo.png', ASAL),
		false,
		'aset lintas domain diurus browser, bukan service worker'
	);
});

test('URL rusak ditolak, bukan melempar galat', () => {
	assert.equal(bolehDisimpanDiCache('bukan-url', ASAL), false);
	assert.equal(bersifatKekal('bukan-url'), false);
});

// --- Manfaat: aset statis dilayani dari perangkat ---

test('hasil build, font, ikon, dan bendera disimpan', () => {
	for (const jalur of [
		'/_app/immutable/chunks/abc123.js',
		'/fonts/AmiriQuran.ttf',
		'/flags/id.svg',
		'/icons/icon-512.png',
		'/favicon.ico',
		'/manifest.json'
	]) {
		assert.equal(boleh(jalur), true, `${jalur} seharusnya disimpan`);
	}
});

test('hanya berkas build ber-hash yang dianggap kekal', () => {
	assert.equal(bersifatKekal(`${ASAL}/_app/immutable/chunks/abc123.js`), true);
	assert.equal(bersifatKekal(`${ASAL}/flags/id.svg`), false);
	assert.equal(bersifatKekal(`${ASAL}/api/quran/1`), false);
});

// --- Bentrokan service worker ---

test('hanya satu service worker yang dibangun', () => {
	const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8');
	// Buang komentar dulu supaya catatan sejarah tidak dianggap pemakaian.
	const kode = vite.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
	assert.doesNotMatch(
		kode,
		/SvelteKitPWA/,
		'SvelteKitPWA membangun sw.js kedua yang tidak pernah didaftarkan; ia justru menimpa manifest dan menambah berat build'
	);
});

test('service worker tetap menangani Web Push', () => {
	const sw = readFileSync(join(root, 'src/service-worker.ts'), 'utf8');
	assert.match(sw, /addEventListener\(\s*'push'/, 'penanganan push wajib dipertahankan');
	assert.match(sw, /notificationclick/, 'penanganan klik notifikasi wajib dipertahankan');
});

test('service worker memakai kebijakan cache bersama, bukan aturan sendiri', () => {
	const sw = readFileSync(join(root, 'src/service-worker.ts'), 'utf8');
	assert.match(sw, /service-worker-policy/, 'service worker harus memakai modul kebijakan yang diuji');
});

test('manifest PWA yang dirujuk HTML memang ada di static/', () => {
	const html = readFileSync(join(root, 'src/app.html'), 'utf8');
	const cocok = html.match(/rel="manifest"\s+href="([^"]+)"/);
	assert.ok(cocok, 'app.html harus merujuk satu manifest');
	const berkas = join(root, 'static', cocok![1].replace(/^\//, ''));
	assert.doesNotThrow(
		() => readFileSync(berkas),
		`manifest ${cocok![1]} dirujuk HTML tetapi tidak ada di static/`
	);
});
