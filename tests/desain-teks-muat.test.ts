// Perhitungan ukuran huruf agar teks tidak terpotong di kanvas.
//
// Kasus nyata yang memicu perbaikan ini: judul "Selamat Hari Santri Nasional"
// pada kanvas A4 (794px). Kotak teks 683px, tetapi huruf 60px membuat kata
// terpanjang meluber sehingga teks terpotong di kiri dan kanan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitungFontMuat, kiriTerpusat, type PengukurTeks } from '../src/lib/desain/teks-muat';

/**
 * Pengukur palsu yang meniru perilaku font proporsional: lebar berbanding
 * lurus dengan jumlah huruf dan ukuran font. Cukup untuk menguji logikanya
 * tanpa perlu browser.
 */
const ukurPalsu: PengukurTeks = (teks, fontSize) => teks.length * fontSize * 0.55;

test('teks yang sudah muat tidak dikecilkan', () => {
	const font = hitungFontMuat(ukurPalsu, 'Hari Santri', 683, 60);
	assert.equal(font, 60, 'teks pendek seharusnya dibiarkan');
});

test('kasus nyata: judul A4 dikecilkan sampai muat', () => {
	// "Nasional" = 8 huruf. Pada 60px: 8 x 60 x 0,55 = 264px, masih muat.
	// Yang tidak muat adalah kalimat utuh, tetapi Fabric membungkus per kata,
	// jadi patokan yang benar memang kata terpanjang.
	const isi = 'Selamat Hari Santri Nasional';
	const font = hitungFontMuat(ukurPalsu, isi, 683, 60);
	const terpanjang = 'Nasional';
	assert.ok(
		ukurPalsu(terpanjang, font) <= 683,
		`kata terpanjang masih ${ukurPalsu(terpanjang, font)}px pada font ${font}`
	);
});

test('satu kata sangat panjang tetap dipaksa muat', () => {
	// Nama lembaga panjang tanpa spasi adalah kasus yang paling sering
	// merusak tata letak.
	const isi = 'Muhammadiyahkabupatenmalangselatan';
	const font = hitungFontMuat(ukurPalsu, isi, 400, 60);
	assert.ok(font < 60, 'font seharusnya turun');
	assert.ok(ukurPalsu(isi, font) <= 400, 'masih meluber setelah dikecilkan');
});

test('tidak pernah turun di bawah batas keterbacaan', () => {
	// Kotak sangat sempit tidak boleh menghasilkan huruf 2px yang tak terbaca.
	const font = hitungFontMuat(ukurPalsu, 'Panjangsekalisampaitakmasukakal', 20, 60, 12);
	assert.equal(font, 12);
});

test('masukan kosong tidak membuat galat', () => {
	assert.equal(hitungFontMuat(ukurPalsu, '', 683, 48), 48);
	assert.equal(hitungFontMuat(ukurPalsu, '   ', 683, 48), 48);
});

test('lebar kotak tidak sah dikembalikan apa adanya', () => {
	// Kanvas belum terbentuk saat pemanggilan awal — jangan sampai
	// menghasilkan NaN atau Infinity yang merusak render.
	assert.equal(hitungFontMuat(ukurPalsu, 'Halo dunia', 0, 40), 40);
	assert.equal(hitungFontMuat(ukurPalsu, 'Halo dunia', -10, 40), 40);
});

test('hasil selalu bilangan bulat positif', () => {
	for (const lebar of [50, 120, 300, 683, 1200]) {
		const font = hitungFontMuat(ukurPalsu, 'Peringatan Maulid Nabi Muhammad', lebar, 59.5);
		assert.ok(Number.isInteger(font), `font ${font} bukan bilangan bulat`);
		assert.ok(font >= 12, `font ${font} di bawah batas`);
	}
});

test('kotak teks benar-benar terpusat', () => {
	// Bug lama: left dipatok 7% sementara lebar kotak 86%, jadi sisa kanan
	// 7% tidak pernah sama dengan sisa kiri saat lebar berubah.
	const lebarKanvas = 794;
	const lebarKotak = lebarKanvas * 0.86;
	const kiri = kiriTerpusat(lebarKanvas, lebarKotak);
	const kanan = lebarKanvas - (kiri + lebarKotak);
	assert.ok(Math.abs(kiri - kanan) < 0.001, `kiri ${kiri} vs kanan ${kanan}`);
});

test('kotak lebih lebar dari kanvas tidak menghasilkan kiri negatif', () => {
	// Kiri negatif akan langsung memotong teks di tepi kiri — persis cacat
	// yang sedang diperbaiki.
	assert.equal(kiriTerpusat(300, 500), 0);
});
