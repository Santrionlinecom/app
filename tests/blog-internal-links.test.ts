import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	PARAGRAF_BACKLINK,
	PETA_TAUTAN,
	SITUS_UTAMA,
	hitungTautanInternal,
	sisipkanTautanInternal
} from '../src/lib/server/seo/internal-links';

/**
 * Penyisip ini berjalan di atas 2.000+ artikel yang sudah terbit. Kerusakan
 * kecil pun langsung tampil di publik, jadi yang diuji bukan hanya "tautannya
 * masuk" tetapi juga "tidak merusak apa pun".
 */

test('setiap artikel mendapat backlink ke situs utama', () => {
	const hasil = sisipkanTautanInternal('<p>Sebuah paragraf biasa.</p>');
	assert.ok(hasil.includes(SITUS_UTAMA), 'backlink wajib ada');
	assert.ok(hasil.includes(PARAGRAF_BACKLINK), 'paragraf penutup wajib utuh');
});

test('kata kunci berubah menjadi tautan internal', () => {
	const hasil = sisipkanTautanInternal('<p>Kisah para sahabat sangat menyentuh.</p>');
	assert.match(hasil, /<a href="\/sahabat"/);
	assert.equal(hitungTautanInternal(hasil), 1);
});

test('tidak menyisip di dalam tautan yang sudah ada', () => {
	const asli = '<p>Baca <a href="https://contoh.id/x">kisah sahabat di sini</a>.</p>';
	const hasil = sisipkanTautanInternal(asli);
	assert.equal(hitungTautanInternal(hasil), 0, 'tautan bersarang akan merusak HTML');
	assert.ok(hasil.includes('<a href="https://contoh.id/x">kisah sahabat di sini</a>'));
});

test('judul tidak ikut ditautkan', () => {
	const hasil = sisipkanTautanInternal('<h3>Peran ulama masa kini</h3><p>Isi singkat.</p>');
	assert.ok(!/<h3>[^<]*<a /.test(hasil), 'judul harus tetap bersih');
});

test('tidak merusak atribut di dalam tag', () => {
	const asli = '<p><img src="/foto-ulama.png" alt="ulama" /> Penjelasan.</p>';
	const hasil = sisipkanTautanInternal(asli);
	assert.ok(hasil.includes('<img src="/foto-ulama.png" alt="ulama" />'), 'atribut tidak boleh tersentuh');
});

test('satu kata kunci hanya dipakai sekali', () => {
	const hasil = sisipkanTautanInternal('<p>ulama dan ulama dan ulama lagi.</p>');
	assert.equal((hasil.match(/href="\/ulama"/g) ?? []).length, 1);
});

test('jumlah tautan dibatasi', () => {
	const padat = '<p>Rasulullah, sahabat, ulama, masjid, dinasti, ormas, tokoh, buku, tabiin.</p>';
	assert.ok(hitungTautanInternal(sisipkanTautanInternal(padat, 4)) <= 4);
	assert.ok(hitungTautanInternal(sisipkanTautanInternal(padat, 2)) <= 2);
});

test('idempoten: dijalankan dua kali hasilnya sama', () => {
	const sekali = sisipkanTautanInternal('<p>Para sahabat dan ulama.</p>');
	const duaKali = sisipkanTautanInternal(sekali);
	assert.equal(duaKali, sekali, 'penyisipan berlapis akan mengotori artikel');
});

test('hanya cocok pada kata utuh', () => {
	const hasil = sisipkanTautanInternal('<p>Kata ulamanya tidak boleh terpotong.</p>');
	assert.equal(hitungTautanInternal(hasil), 0);
	assert.ok(hasil.includes('ulamanya'));
});

test('semua tujuan adalah halaman publik, bukan yang butuh login', () => {
	// /kitab, /kitab/quran, dan /kursus membalas 302 ke halaman masuk.
	const berbayarLogin = ['/kitab', '/kitab/quran', '/kursus'];
	for (const entri of PETA_TAUTAN) {
		assert.ok(entri.href.startsWith('/'), `${entri.href} harus relatif`);
		assert.ok(
			!berbayarLogin.includes(entri.href),
			`${entri.href} meminta login — jangan ditaut dari artikel publik`
		);
	}
});

test('isi kosong tidak diproses', () => {
	assert.equal(sisipkanTautanInternal(''), '');
	assert.equal(sisipkanTautanInternal('   '), '   ');
});
