// Sitemap hanya boleh memuat halaman yang bisa dibuka TANPA login.
//
// Latar: 22 Agu 2026 ditemukan 17 dari 55 URL non-blog (31%) membalas 302 ke
// /auth — /kitab, /kitab/quran, /desain, /desain/cetak, /digital-store, dan 12
// template desain. Google membuang URL yang mengalihkan ke login, dan sitemap
// yang menyodorkan halaman terkunci menurunkan kepercayaan crawl untuk seluruh
// situs, termasuk 1.001 artikel blog yang sehat.
//
// Tes ini memeriksa STRUKTUR RUTE di disk, bukan daftar hardcode, supaya rute
// baru yang lahir di dalam grup (app) ikut tertangkap tanpa perlu memperbarui
// tes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const AKAR = join(process.cwd(), 'src', 'routes');
const SUMBER = join(AKAR, 'sitemap.xml', '+server.ts');
const isi = readFileSync(SUMBER, 'utf8');

/** Ambil semua loc statis yang ditulis literal di sitemap. */
const locStatis = [...isi.matchAll(/loc:\s*'([^']+)'/g)]
	.map((m) => m[1])
	.filter((l) => l.startsWith('/') && !l.includes('${'));

/**
 * Sebuah URL wajib login bila berkas rutenya hanya ada di dalam grup (app).
 * Contoh: /kitab -> src/routes/(app)/kitab/+page.svelte  => terkunci
 *         /blog  -> src/routes/blog/+page.svelte         => publik
 */
const wajibLogin = (urlPath: string) => {
	const seg = urlPath.split('/').filter(Boolean);
	if (seg.length === 0) return false;
	const publik = join(AKAR, ...seg, '+page.svelte');
	const dalamApp = join(AKAR, '(app)', ...seg, '+page.svelte');
	return !existsSync(publik) && existsSync(dalamApp);
};

test('sitemap tidak memuat halaman yang wajib login', () => {
	const terkunci = locStatis.filter(wajibLogin);
	assert.deepEqual(
		terkunci,
		[],
		`URL ini ada di grup (app) sehingga tamu dialihkan ke /auth: ${terkunci.join(', ')}`
	);
});

test('rute yang pernah bocor kini sudah publik', () => {
	// Daftar spesifik dari insiden 22 Agu 2026. Semuanya dulu membalas 302
	// ke /auth karena berada di grup (app).
	//
	// /kitab dan /desain KEMUDIAN dipindahkan keluar grup (app) sehingga sah
	// masuk sitemap. Yang dijaga di sini bukan lagi "jangan didaftarkan",
	// melainkan "jangan kembali terkunci": kalau suatu saat foldernya
	// dipindah lagi ke dalam (app), tes pertama akan menangkapnya.
	for (const jalur of ['/kitab', '/kitab/quran', '/desain', '/desain/cetak']) {
		assert.ok(!wajibLogin(jalur), `${jalur} kembali masuk grup (app) — akan mengalihkan tamu ke /auth`);
	}

	// /digital-store memakai locals.user untuk kepemilikan produk, jadi
	// memang tetap terkunci dan tidak boleh masuk sitemap.
	assert.ok(
		!locStatis.includes('/digital-store'),
		'/digital-store mewajibkan login; jangan didaftarkan di sitemap'
	);
});

test('template desain didaftarkan dan rutenya publik', () => {
	// Dulu 12 URL /desain/[slug] dikeluarkan karena mengalihkan ke /auth.
	// Sesudah /desain jadi rute publik, mendaftarkannya justru benar — ini
	// aset SEO musiman. Yang dijaga: rutenya harus tetap publik.
	const kode = isi
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.split('\n')
		.filter((baris) => !baris.trim().startsWith('//'))
		.join('\n');

	assert.ok(/designTemplates/.test(kode), 'template desain tidak lagi didaftarkan di sitemap');
	assert.ok(
		existsSync(join(AKAR, 'desain', '[slug]', '+page.svelte')),
		'/desain/[slug] bukan rute publik; jangan didaftarkan massal'
	);
	assert.ok(
		!existsSync(join(AKAR, '(app)', 'desain')),
		'/desain kembali ke grup (app) — sitemap akan mendaftarkan URL terkunci'
	);
});

test('halaman publik utama tetap terdaftar', () => {
	// Jangan sampai perbaikan ini malah mengosongkan sitemap.
	for (const jalur of ['/', '/blog', '/buku', '/dinasti', '/tentang']) {
		assert.ok(locStatis.includes(jalur), `${jalur} hilang dari sitemap`);
	}
	assert.ok(locStatis.length >= 10, `sitemap statis terlalu sedikit: ${locStatis.length}`);
});

test('setiap loc statis benar-benar punya berkas rute', () => {
	// Menangkap salah ketik slug yang membuat sitemap menunjuk 404.
	const hilang = locStatis.filter((l) => {
		const seg = l.split('/').filter(Boolean);
		if (seg.length === 0) return false;
		// Lewati yang berasal dari data dinamis (blog dari D1).
		if (seg[0] === 'blog' && seg.length > 1) return false;
		return (
			!existsSync(join(AKAR, ...seg, '+page.svelte')) &&
			!existsSync(join(AKAR, '(app)', ...seg, '+page.svelte'))
		);
	});
	assert.deepEqual(hilang, [], `loc tanpa berkas rute: ${hilang.join(', ')}`);
});
