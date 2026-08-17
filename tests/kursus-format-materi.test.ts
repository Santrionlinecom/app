import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	deteksiFormat,
	siapkanUntukTampil,
	bersihkanHtml
} from '../src/lib/server/domains/kursus/format-materi';

/**
 * Materi kursus punya dua asal:
 *  - seed awal: markdown sederhana
 *  - hasil suntingan superadmin lewat editor TipTap: HTML
 *
 * Keduanya harus bisa hidup berdampingan tanpa merusak materi lama.
 */

test('markdown dikenali sebagai markdown', () => {
	assert.equal(deteksiFormat('## Judul\n\nIsi biasa.'), 'markdown');
	assert.equal(deteksiFormat('Teks biasa tanpa tanda apa pun.'), 'markdown');
	assert.equal(deteksiFormat('- daftar\n- kedua'), 'markdown');
});

test('HTML dikenali sebagai HTML', () => {
	assert.equal(deteksiFormat('<p>Halo</p>'), 'html');
	assert.equal(deteksiFormat('<h2>Judul</h2><p>Isi</p>'), 'html');
	assert.equal(deteksiFormat('  <ul><li>satu</li></ul>  '), 'html');
});

test('format tersimpan dipakai lebih dahulu daripada tebakan', () => {
	// Materi yang sudah ditandai html tidak boleh ditebak ulang.
	const hasil = siapkanUntukTampil('<p>sudah html</p>', 'html');
	assert.equal(hasil.format, 'html');
	assert.equal(hasil.html.includes('<p>sudah html</p>'), true);
});

test('markdown lama tetap tampil benar tanpa kolom format', () => {
	const hasil = siapkanUntukTampil('## Judul\n\nParagraf.', null);
	assert.equal(hasil.format, 'markdown');
	assert.equal(hasil.html, '## Judul\n\nParagraf.', 'markdown diteruskan apa adanya ke klien');
});

test('skrip dibuang dari HTML', () => {
	const kotor = '<p>aman</p><script>alert(1)</script>';
	const bersih = bersihkanHtml(kotor);
	assert.equal(bersih.includes('<script'), false, 'tag script wajib dibuang');
	assert.equal(bersih.includes('aman'), true, 'isi sah tetap dipertahankan');
});

test('penangan kejadian sebaris dibuang', () => {
	const kotor = '<p onclick="curi()">teks</p><img src=x onerror="jahat()">';
	const bersih = bersihkanHtml(kotor);
	assert.equal(/\son\w+\s*=/i.test(bersih), false, 'atribut on* wajib dibuang');
	assert.equal(bersih.includes('teks'), true);
});

test('tautan javascript: dibuang', () => {
	const bersih = bersihkanHtml('<a href="javascript:jahat()">klik</a>');
	assert.equal(/javascript:/i.test(bersih), false, 'skema javascript wajib dibuang');
});

test('iframe dan objek asing dibuang', () => {
	const bersih = bersihkanHtml('<iframe src="//jahat"></iframe><p>sah</p>');
	assert.equal(bersih.includes('<iframe'), false);
	assert.equal(bersih.includes('sah'), true);
});

test('format tak dikenal jatuh ke markdown, bukan HTML mentah', () => {
	// Nilai aneh dari basis data tidak boleh membuat teks dianggap HTML
	// tepercaya lalu dirender mentah.
	const hasil = siapkanUntukTampil('<p>x</p>', 'entah-apa');
	assert.equal(hasil.format, 'markdown');
});
