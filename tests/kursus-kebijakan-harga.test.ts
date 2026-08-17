import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	KATEGORI_ILMU_AGAMA,
	wajibGratis,
	periksaHargaKursus
} from '../src/lib/server/domains/kursus/kebijakan-harga';

/**
 * Kebijakan tetap SantriOnline: ilmu agama tidak dijual.
 *
 * Aqidah, fiqih, hadits, tafsir, sirah, akhlak, adab, dan Al-Qur'an wajib
 * gratis selamanya. Ini bukan keputusan sekali jalan melainkan aturan yang
 * ditegakkan kode, sehingga kursus agama berbayar tidak bisa lolos diam-diam
 * di kemudian hari.
 */

test('kategori ilmu agama wajib gratis', () => {
	for (const kategori of [
		'Aqidah',
		'Fiqih',
		'Hadits',
		'Tafsir',
		'Sirah',
		'Akhlak',
		'Adab & Akhlak',
		"Al-Qur'an"
	]) {
		assert.equal(wajibGratis(kategori), true, `${kategori} seharusnya wajib gratis`);
	}
});

test('penulisan bebas huruf besar-kecil dan spasi tetap terdeteksi', () => {
	assert.equal(wajibGratis('  aqidah  '), true);
	assert.equal(wajibGratis('AQIDAH'), true);
	assert.equal(wajibGratis('Aqidah Aswaja'), true, 'kategori turunan ikut terjaring');
	assert.equal(wajibGratis('akidah'), true, 'ejaan alternatif wajib terjaring');
	assert.equal(wajibGratis('fikih'), true, 'ejaan alternatif fiqih');
	assert.equal(wajibGratis('quran'), true);
});

test('kategori non-agama boleh berbayar', () => {
	for (const kategori of [
		'Teknologi & Platform',
		'Panduan Platform',
		'Keterampilan',
		'Bahasa Inggris',
		'Kewirausahaan'
	]) {
		assert.equal(wajibGratis(kategori), false, `${kategori} seharusnya boleh berbayar`);
	}
});

test('kategori kosong tidak dianggap agama', () => {
	assert.equal(wajibGratis(null), false);
	assert.equal(wajibGratis(''), false);
	assert.equal(wajibGratis(undefined), false);
});

test('harga kursus agama dipaksa nol', () => {
	const hasil = periksaHargaKursus('Aqidah', 150);
	assert.equal(hasil.harga, 0, 'harga wajib jadi nol');
	assert.equal(hasil.dipaksaGratis, true);
	assert.match(hasil.alasan ?? '', /ilmu agama/i);
});

test('harga kursus non-agama dibiarkan apa adanya', () => {
	const hasil = periksaHargaKursus('Teknologi & Platform', 150);
	assert.equal(hasil.harga, 150);
	assert.equal(hasil.dipaksaGratis, false);
});

test('harga tidak wajar tetap dinormalkan', () => {
	assert.equal(periksaHargaKursus('Keterampilan', -50).harga, 0, 'minus jadi nol');
	assert.equal(periksaHargaKursus('Keterampilan', 12.9).harga, 12, 'pecahan dibulatkan ke bawah');
	assert.equal(periksaHargaKursus('Keterampilan', Number.NaN).harga, 0);
});

test('daftar kategori agama tidak boleh kosong', () => {
	// Penjaga terhadap penghapusan tak sengaja yang akan melumpuhkan aturan.
	assert.ok(KATEGORI_ILMU_AGAMA.length >= 8, 'daftar kategori agama menyusut mencurigakan');
});
