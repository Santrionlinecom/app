import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { hitungPosisiPanel } from '../src/lib/components/notifikasi-panel-posisi';

const root = process.cwd();
const baca = (p: string) => readFileSync(join(root, p), 'utf8');

// --- Posisi panel: tidak boleh keluar layar ---

/**
 * Di HP, tombol lonceng berada dekat tepi kanan sementara panel selebar ~22rem.
 * Bila panel sekadar dirapatkan ke kanan tombol (right-0), tepi kirinya jatuh
 * ke koordinat negatif dan judul "Notifikasi" ikut terpotong.
 */
test('panel tidak keluar tepi kiri pada layar HP sempit', () => {
	const posisi = hitungPosisiPanel({
		lebarLayar: 360,
		tombolKiri: 250,
		tombolKanan: 286,
		tombolBawah: 120,
		lebarPanelDiinginkan: 352,
		margin: 12
	});

	assert.ok(posisi.kiri >= 12, `tepi kiri panel ${posisi.kiri} menembus margin layar`);
	assert.ok(
		posisi.kiri + posisi.lebar <= 360 - 12,
		'tepi kanan panel menembus margin layar'
	);
});

test('panel menyempit mengikuti layar, bukan meluber', () => {
	const posisi = hitungPosisiPanel({
		lebarLayar: 360,
		tombolKiri: 250,
		tombolKanan: 286,
		tombolBawah: 120,
		lebarPanelDiinginkan: 352,
		margin: 12
	});

	assert.equal(posisi.lebar, 336, 'lebar panel harus 360 dikurangi margin kiri-kanan');
});

test('pada layar lebar panel tetap dirapatkan ke kanan tombol', () => {
	const posisi = hitungPosisiPanel({
		lebarLayar: 1440,
		tombolKiri: 1200,
		tombolKanan: 1240,
		tombolBawah: 64,
		lebarPanelDiinginkan: 352,
		margin: 12
	});

	assert.equal(posisi.lebar, 352, 'panel tidak perlu menyempit di layar lebar');
	assert.equal(posisi.kiri, 1240 - 352, 'tepi kanan panel sejajar tepi kanan tombol');
});

test('panel tidak keluar tepi kanan bila tombol berada di ujung kiri', () => {
	const posisi = hitungPosisiPanel({
		lebarLayar: 360,
		tombolKiri: 8,
		tombolKanan: 44,
		tombolBawah: 100,
		lebarPanelDiinginkan: 352,
		margin: 12
	});

	assert.ok(posisi.kiri >= 12);
	assert.ok(posisi.kiri + posisi.lebar <= 348);
});

test('panel dibuka tepat di bawah tombol', () => {
	const posisi = hitungPosisiPanel({
		lebarLayar: 360,
		tombolKiri: 250,
		tombolKanan: 286,
		tombolBawah: 120,
		lebarPanelDiinginkan: 352,
		margin: 12,
		jarak: 8
	});

	assert.equal(posisi.atas, 128);
});

// --- Menandai notifikasi sudah dibaca ---

test('endpoint tandai-dibaca ada dan dijaga superadmin', () => {
	const server = baca('src/routes/api/admin/notifications/+server.ts');
	assert.match(server, /export const POST/, 'butuh POST untuk menandai sudah dibaca');
	assert.match(server, /requireSuperAdmin/, 'endpoint wajib dijaga requireSuperAdmin');
	assert.match(
		server,
		/dismissSuperAdminNotification/,
		'harus memakai penyimpanan dismissal yang sudah ada'
	);
});

test('lonceng menandai notifikasi dibaca saat diklik', () => {
	const bell = baca('src/lib/components/SuperAdminBell.svelte');
	assert.match(bell, /method:\s*'POST'/, 'lonceng harus mengirim POST saat notifikasi dibuka');
	assert.match(bell, /Tandai semua/i, 'butuh tombol menandai semua sudah dibaca');
});

test('lonceng memakai penghitung posisi yang diuji, bukan right-0 mentah', () => {
	const bell = baca('src/lib/components/SuperAdminBell.svelte');
	assert.match(
		bell,
		/hitungPosisiPanel/,
		'panel harus memakai penghitung posisi agar tidak keluar layar'
	);
});
