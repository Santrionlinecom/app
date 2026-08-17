import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Penyuntingan kursus mengikuti pola CMS artikel yang sudah ada:
 * penjagaan canManageCms, form action, dan komponen RichTextEditor
 * yang sama — bukan editor baru yang berdiri sendiri.
 */

const akar = process.cwd();
const editServer = readFileSync(
	join(akar, 'src/routes/(app)/admin/kursus/[slug]/edit/+page.server.ts'),
	'utf-8'
);
const editHalaman = readFileSync(
	join(akar, 'src/routes/(app)/admin/kursus/[slug]/edit/+page.svelte'),
	'utf-8'
);

test('halaman admin kursus tersedia', () => {
	for (const berkas of [
		'src/routes/(app)/admin/kursus/+page.server.ts',
		'src/routes/(app)/admin/kursus/+page.svelte',
		'src/routes/(app)/admin/kursus/[slug]/edit/+page.server.ts',
		'src/routes/(app)/admin/kursus/[slug]/edit/+page.svelte'
	]) {
		assert.equal(existsSync(join(akar, berkas)), true, `${berkas} tidak ada`);
	}
});

test('hanya superadmin yang boleh menyunting', () => {
	assert.match(editServer, /canManageCms/, 'wajib memakai penjaga canManageCms');

	// Penjagaan wajib ada di load DAN di setiap action: load saja tidak cukup,
	// karena form bisa dikirim langsung tanpa membuka halaman.
	const jumlahPenjaga = (editServer.match(/canManageCms/g) ?? []).length;
	assert.ok(
		jumlahPenjaga >= 3,
		`penjaga harus ada di load dan tiap action, ditemukan ${jumlahPenjaga}`
	);
});

test('memakai editor yang sama dengan CMS artikel', () => {
	assert.match(
		editHalaman,
		/RichTextEditor/,
		'wajib memakai komponen editor yang sudah ada, bukan bikin baru'
	);
});

test('isi dibersihkan sebelum disimpan', () => {
	assert.match(editServer, /bersihkanHtml/, 'HTML wajib dibersihkan sebelum masuk basis data');
});

test('materi tersimpan ditandai html', () => {
	assert.match(
		editServer,
		/format = 'html'/,
		'materi hasil suntingan wajib ditandai html agar dirender benar'
	);
});

test('penyunting terakhir dicatat', () => {
	assert.match(editServer, /updated_by/, 'jejak penyunting wajib disimpan');
});

test('halaman publik menghormati format materi', () => {
	const publik = readFileSync(
		join(akar, 'src/routes/(app)/kursus/[slug]/+page.server.ts'),
		'utf-8'
	);
	assert.match(publik, /siapkanUntukTampil/, 'format wajib ditentukan di server');

	const halaman = readFileSync(
		join(akar, 'src/routes/(app)/kursus/[slug]/+page.svelte'),
		'utf-8'
	);
	assert.match(
		halaman,
		/m\.format === 'html'/,
		'HTML dan markdown wajib dirender lewat jalur berbeda'
	);
});

test('migrasi menandai materi lama sebagai markdown', () => {
	const migrasi = readFileSync(join(akar, 'migrations/0065_kursus_materi_format.sql'), 'utf-8');
	assert.match(migrasi, /ADD COLUMN format TEXT/);
	assert.match(
		migrasi,
		/UPDATE kursus_materi SET format = 'markdown'/,
		'materi lama wajib ditandai agar tidak salah dirender'
	);
});
