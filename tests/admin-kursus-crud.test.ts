import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const halaman = readFileSync(
	join(root, 'src/routes/(app)/admin/kursus/+page.svelte'),
	'utf8'
);
const server = readFileSync(
	join(root, 'src/routes/(app)/admin/kursus/+page.server.ts'),
	'utf8'
);

/**
 * Aplikasi ini tidak mengaktifkan darkMode di tailwind.config.ts, sehingga
 * varian `dark:` mengikuti prefers-color-scheme milik HP. Di perangkat yang
 * memakai mode gelap, `dark:text-white` membuat judul putih di atas latar
 * terang aplikasi -- teks jadi tidak terbaca.
 */
test('halaman kelola kursus tidak memakai varian dark: yang menghilangkan teks', () => {
	// Hanya periksa markup, bukan komentar penjelas di blok <script>.
	const markup = halaman.slice(halaman.indexOf('</script>'));
	assert.doesNotMatch(
		markup,
		/\bdark:[a-z-]/,
		'markup tidak boleh memakai varian dark: karena darkMode tidak dikonfigurasi'
	);
});

test('tabel kursus dapat digeser mendatar di layar sempit', () => {
	assert.match(
		halaman,
		/overflow-x-auto/,
		'pembungkus tabel harus overflow-x-auto agar kolom kanan tetap terjangkau di HP'
	);
});

test('daftar kursus punya tampilan kartu khusus layar kecil', () => {
	assert.match(
		halaman,
		/md:hidden/,
		'harus ada tampilan kartu untuk layar kecil'
	);
	assert.match(
		halaman,
		/class="hidden[^"]*\bmd:(block|table)\b/,
		'tabel harus disembunyikan di layar kecil'
	);
});

test('CRUD lengkap: ada tombol tambah dan hapus kursus', () => {
	assert.match(halaman, /\?\/buat/, 'harus ada form aksi buat kursus');
	assert.match(halaman, /\?\/hapus/, 'harus ada form aksi hapus kursus');
});

test('server menyediakan aksi buat dan hapus', () => {
	assert.match(server, /export const actions/, 'server harus punya actions');
	assert.match(server, /\bbuat:\s*async/, 'harus ada action buat');
	assert.match(server, /\bhapus:\s*async/, 'harus ada action hapus');
});

test('aksi tulis dijaga izin CMS, bukan hanya load', () => {
	const jumlahPenjagaan = server.match(/canManageCms/g)?.length ?? 0;
	assert.ok(
		jumlahPenjagaan >= 3,
		`canManageCms harus dipakai di load + setiap action tulis, ditemukan ${jumlahPenjagaan}`
	);
});

test('hapus kursus menolak jika sudah ada peserta terdaftar', () => {
	assert.match(
		server,
		/kursus_pendaftaran/,
		'aksi hapus harus memeriksa kursus_pendaftaran agar riwayat koin peserta tidak hilang'
	);
});
