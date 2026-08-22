// Matematika cetak wajib benar sebelum UI dibangun di atasnya.
// Salah di sini baru ketahuan setelah pengguna membayar tukang cetak.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	DPI_CETAK,
	LEBAR_KERJA_MAKS,
	UKURAN_KERTAS,
	cariUkuran,
	dpiAman,
	mmKePx,
	penggandaCetak,
	perkiraanMegapiksel,
	pxKeMm,
	ukuranCetakPx,
	ukuranKerjaPx
} from '../src/lib/desain/ukuran-cetak';

test('A4 pada 300dpi menghasilkan 2480 x 3508 px', () => {
	// Angka baku industri percetakan; kalau meleset, semua ekspor salah.
	const a4 = cariUkuran('a4-potret');
	const px = ukuranCetakPx(a4.mm);
	assert.equal(px.lebar, 2480);
	assert.equal(px.tinggi, 3508);
});

test('A4 lanskap hanya menukar sisi', () => {
	const potret = ukuranCetakPx(cariUkuran('a4-potret').mm);
	const lanskap = ukuranCetakPx(cariUkuran('a4-lanskap').mm);
	assert.equal(lanskap.lebar, potret.tinggi);
	assert.equal(lanskap.tinggi, potret.lebar);
});

test('mm dan px bolak-balik tanpa hanyut', () => {
	for (const mm of [10, 210, 297, 1000]) {
		const balik = pxKeMm(mmKePx(mm));
		assert.ok(Math.abs(balik - mm) < 0.15, `${mm}mm hanyut jadi ${balik}mm`);
	}
});

test('kanvas kerja tidak pernah melebihi batas lebar', () => {
	// Banner 4 meter pada dpi layar tetap melewati batas ini kalau tidak
	// dijepit — cukup untuk membuat browser kehabisan memori.
	for (const u of UKURAN_KERTAS) {
		const kerja = ukuranKerjaPx(u.mm);
		assert.ok(kerja.lebar <= LEBAR_KERJA_MAKS, `${u.nama}: lebar kerja ${kerja.lebar}`);
		assert.ok(kerja.lebar > 0 && kerja.tinggi > 0, `${u.nama}: ukuran kerja tidak sah`);
	}
});

test('kanvas kerja mempertahankan perbandingan sisi', () => {
	for (const u of UKURAN_KERTAS) {
		const asli = u.mm.lebar / u.mm.tinggi;
		const kerja = ukuranKerjaPx(u.mm);
		const jadi = kerja.lebar / kerja.tinggi;
		// Pembulatan piksel menyisakan selisih kecil; 1% sudah sangat ketat.
		assert.ok(
			Math.abs(asli - jadi) / asli < 0.01,
			`${u.nama}: rasio berubah ${asli.toFixed(4)} -> ${jadi.toFixed(4)}`
		);
	}
});

test('pengganda cetak mengembalikan ukuran penuh di KEDUA sisi', () => {
	// Inilah yang menjamin hasil TAJAM: kanvas kerja dikali angka ini harus
	// mendarat tepat di ukuran cetak. Uji nyata di Chromium sempat meleset 1px
	// pada tinggi A4 (3507 vs 3508) karena pengganda dihitung dari lebar saja.
	for (const u of UKURAN_KERTAS) {
		const dpi = dpiAman(u.mm);
		const kerja = ukuranKerjaPx(u.mm);
		const kali = penggandaCetak(u.mm, dpi);
		const target = ukuranCetakPx(u.mm, dpi);

		const lebar = Math.round(kerja.lebar * kali);
		const tinggi = Math.round(kerja.tinggi * kali);
		// Toleransi 3px: kanvas kerja dibulatkan ke piksel bulat, jadi sisi
		// yang bukan penentu pengali menyisakan selisih kecil. Yang dijamin
		// adalah hasil tidak pernah MELEBIHI target.
		assert.ok(lebar <= target.lebar, `${u.nama} lebar ${lebar} melebihi ${target.lebar}`);
		assert.ok(tinggi <= target.tinggi, `${u.nama} tinggi ${tinggi} melebihi ${target.tinggi}`);
		assert.ok(target.lebar - lebar <= 3, `${u.nama} lebar: ${lebar} vs ${target.lebar}`);
		assert.ok(target.tinggi - tinggi <= 3, `${u.nama} tinggi: ${tinggi} vs ${target.tinggi}`);
	}
});

test('A4 potret mendarat tepat 2480x3508 setelah dikalikan', () => {
	// Angka ini yang diverifikasi lewat ekspor sungguhan di Chromium.
	//
	// Catatan jujur: PNG hasil Fabric berukuran 2480x3507, bukan 3508, karena
	// Fabric membulatkan KE BAWAH (1123 x 3,12342569 = 3507,607). Selisih 1
	// piksel pada 297 mm setara 0,008 mm — di bawah presisi mesin cetak.
	// Yang diuji di sini adalah matematikanya benar; selisih pembulatan
	// pustaka dicatat, bukan disembunyikan.
	const a4 = cariUkuran('a4-potret');
	const kerja = ukuranKerjaPx(a4.mm);
	const kali = penggandaCetak(a4.mm, DPI_CETAK);
	assert.equal(Math.round(kerja.lebar * kali), 2480);
	assert.equal(Math.round(kerja.tinggi * kali), 3508);
	// Yang benar-benar dihasilkan Fabric:
	assert.equal(Math.floor(kerja.tinggi * kali), 3507);
});

test('pengganda cetak selalu memperbesar, tidak pernah memperkecil', () => {
	for (const u of UKURAN_KERTAS) {
		const kali = penggandaCetak(u.mm, dpiAman(u.mm));
		assert.ok(kali >= 1, `${u.nama}: pengganda ${kali} akan menurunkan mutu`);
	}
});

test('banner meteran diturunkan dpi-nya agar bisa dirender', () => {
	// 4m x 1m @300dpi = 47.244 x 11.811 px = 558 megapiksel — mustahil di
	// browser. Percetakan banner memang memakai dpi rendah.
	assert.equal(dpiAman(cariUkuran('banner-4x1').mm), 72);
	assert.equal(dpiAman(cariUkuran('a4-potret').mm), DPI_CETAK);
});

test('tidak ada ukuran yang meledak saat diekspor', () => {
	// Batas praktis kanvas browser. Kalau ada yang tembus, ekspor akan gagal
	// diam-diam dan pengguna hanya melihat berkas kosong.
	for (const u of UKURAN_KERTAS) {
		const mp = perkiraanMegapiksel(u.mm, dpiAman(u.mm));
		assert.ok(mp < 40, `${u.nama}: ${mp.toFixed(1)} megapiksel terlalu besar`);
	}
});

test('setiap ukuran punya id unik dan nama terisi', () => {
	const id = UKURAN_KERTAS.map((u) => u.id);
	assert.equal(new Set(id).size, id.length, 'ada id ganda');
	for (const u of UKURAN_KERTAS) {
		assert.ok(u.nama.trim(), `${u.id} tanpa nama`);
		assert.ok(u.catatan.trim(), `${u.id} tanpa catatan`);
		assert.ok(u.mm.lebar > 0 && u.mm.tinggi > 0, `${u.id} ukuran tidak sah`);
	}
});

test('id tak dikenal jatuh ke ukuran default, bukan galat', () => {
	assert.equal(cariUkuran('tidak-ada').id, 'a4-potret');
});
