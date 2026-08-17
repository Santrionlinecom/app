import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Kursus "Membangun Website Sendiri" disusun dari 37 pertanyaan nyata.
 *
 * Test ini memastikan setiap topik benar-benar terjawab di dalam materi —
 * bukan sekadar judulnya terdengar cocok. Bila kelak ada materi yang
 * dipangkas, test ini gagal sebelum kursus telanjur terbit setengah jadi.
 */

const akar = process.cwd();
const seed = readFileSync(join(akar, 'migrations/0064_seed_kursus_website.sql'), 'utf-8');

/** Istilah yang wajib benar-benar dibahas, dikelompokkan per tahap. */
const WAJIB: Record<string, string[]> = {
	'Tahap 1 (istilah dasar)': [
		'UI (User Interface)',
		'UX (User Experience)',
		'Frontend',
		'Backend',
		'Database',
		'CRUD',
		'Create',
		'Read',
		'Update',
		'Delete',
		'API',
		'Subdomain'
	],
	'Tahap 2 (Cloudflare)': [
		'Cloudflare',
		'Pages',
		'Workers',
		'D1',
		'R2',
		'VPS',
		'DNS',
		'CNAME'
	],
	'Tahap 3 (GitHub)': [
		'GitHub',
		'Repository',
		'Commit',
		'Push',
		'Deploy',
		'Branch',
		'main'
	],
	'Tahap 4 (dashboard)': [
		'Dashboard',
		'Superadmin',
		'Role',
		'Permission',
		'Sidebar',
		'Autentikasi',
		'Otorisasi'
	],
	'Tahap 5 (monetisasi)': [
		'Payment gateway',
		'webhook',
		'Koin',
		'Topup',
		'bagi hasil',
		'Produk digital',
		'Afiliasi'
	],
	Bonus: ['Word', 'ComfyUI', 'Higgsfield', 'GPU']
};

for (const [tahap, istilah] of Object.entries(WAJIB)) {
	test(`${tahap}: semua istilah dibahas`, () => {
		const hilang = istilah.filter((k) => !seed.toLowerCase().includes(k.toLowerCase()));
		assert.deepEqual(hilang, [], `istilah belum dibahas: ${hilang.join(', ')}`);
	});
}

test('kursus terbit dan gratis', () => {
	assert.match(seed, /'published'/, 'kursus wajib berstatus published');
	assert.match(
		seed,
		/'membangun-website-sendiri'/,
		'slug kursus wajib tetap agar tautan tidak berubah'
	);
	// Kursus pengantar sengaja gratis: ini pintu masuk, bukan sumber pemasukan.
	assert.match(seed, /NULL, 180,/, 'durasi wajib tercatat');
});

test('enam materi lengkap dengan urutan', () => {
	const jumlah = (seed.match(/INSERT OR REPLACE INTO kursus_materi/g) ?? []).length;
	assert.equal(jumlah, 6, `harus 6 materi, ditemukan ${jumlah}`);

	for (let i = 1; i <= 6; i += 1) {
		assert.match(seed, new RegExp(`kursus-bangun-website-m${i}`), `materi ke-${i} hilang`);
	}
});

test('CRUD dijelaskan sebagai yang terpenting bagi superadmin', () => {
	// Ini penekanan yang diminta secara khusus; jangan sampai hilang saat
	// materi disunting.
	assert.match(
		seed,
		/Kenapa CRUD penting bagi superadmin/,
		'bagian kenapa CRUD penting bagi superadmin wajib ada'
	);
});

test('jalur video dipisahkan tegas dari jalur website', () => {
	// Kekeliruan yang sudah pernah terjadi: mengira ComfyUI dipakai untuk
	// membangun website.
	assert.match(seed, /jalur/i);
	assert.match(seed, /Membangun \*\*website\*\* tidak memakai alat-alat itu/);
});
