// src/lib/server/coins/paket-tools.test.ts
// Penjaga paket topup: pastikan pembeli Tools tidak terjebak kurang coin.
//
// MASALAH YANG DIPERBAIKI (22 Agustus 2026):
//
// SantriPrint Pro berharga 12.900 coin. Paket topup terbesar sebelum
// Ultimate hanya memberi 12.000 coin — KURANG 900.
//
// Akibatnya pengguna membayar Rp100.000, membuka toko, lalu diberi tahu
// saldonya masih kurang. Dia harus topup lagi hanya untuk menutup 900 coin.
// Kebanyakan orang berhenti di titik itu.
//
// Tes ini mengunci aturannya: untuk setiap produk yang dijual, harus ada
// paket yang menutupi harganya dalam SATU kali topup.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getCoinTopupPackages,
	getCoinTopupPackageById,
	pilihPaketMencukupi
} from '../coin-packages.ts';
import { rupiahKeCoin, RUPIAH_PER_COIN } from './kurs.ts';

/** Harga produk toko yang benar-benar dijual, dalam coin. */
const HARGA_PRODUK = {
	'santriprint-promo': 6_900,
	'santriprint-pro': 12_900,
	'santriprint-bantuan': 19_900
} as const;

test('setiap produk bisa dibeli dengan SATU kali topup', () => {
	const paket = getCoinTopupPackages();

	for (const [nama, harga] of Object.entries(HARGA_PRODUK)) {
		const cukup = paket.filter((p) => p.coinAmount >= harga);
		assert.ok(
			cukup.length > 0,
			`Tidak ada satu pun paket yang menutupi ${nama} (${harga} coin). ` +
				`Pembeli terpaksa topup dua kali.`
		);
	}
});

test('SantriPrint Pro punya paket yang pas — tidak memaksa beli jauh lebih banyak', () => {
	const harga = HARGA_PRODUK['santriprint-pro'];
	const paket = getCoinTopupPackages().filter((p) => p.coinAmount >= harga);
	const terkecil = paket.sort((a, b) => a.coinAmount - b.coinAmount)[0];

	// Sebelumnya pengguna harus lompat ke paket Rp250.000 (35.714 coin)
	// hanya untuk membeli produk seharga 12.900 coin — hampir 3x lipat.
	const kelebihan = terkecil.coinAmount - harga;
	assert.ok(
		kelebihan <= harga,
		`Paket terkecil yang cukup memberi ${terkecil.coinAmount} coin untuk produk ` +
			`${harga} coin (kelebihan ${kelebihan}). Terlalu jauh — pengguna merasa dipaksa.`
	);
});

test('paket khusus Tools ada dan menutupi SantriPrint Pro', () => {
	const paket = getCoinTopupPackageById('santri_tools');
	assert.ok(paket, 'paket santri_tools tidak ditemukan');
	assert.ok(
		paket!.coinAmount >= HARGA_PRODUK['santriprint-pro'],
		`paket Tools hanya ${paket!.coinAmount} coin, kurang untuk SantriPrint Pro`
	);
});

test('paket Tools tidak lebih mahal per coin daripada paket di bawahnya', () => {
	const semua = getCoinTopupPackages().sort((a, b) => a.amountRupiah - b.amountRupiah);
	const idx = semua.findIndex((p) => p.id === 'santri_tools');
	assert.ok(idx > 0, 'paket Tools harus berada di tengah daftar, bukan paling murah');

	assert.ok(
		semua[idx].effectiveRupiahPerCoin <= semua[idx - 1].effectiveRupiahPerCoin,
		'paket yang lebih besar tidak boleh lebih mahal per coin — itu menghukum pembeli besar'
	);
});

// ——— ATURAN UMUM YANG TIDAK BOLEH RUSAK ———

test('semua paket tetap konsisten dengan kurs terpusat', () => {
	for (const p of getCoinTopupPackages()) {
		assert.equal(
			p.baseCoin,
			rupiahKeCoin(p.amountRupiah),
			`paket ${p.id}: baseCoin menyimpang dari kurs`
		);
		assert.ok(p.bonusCoin >= 0, `paket ${p.id}: bonus negatif`);
		assert.ok(Number.isInteger(p.coinAmount), `paket ${p.id}: coin harus bulat`);
		assert.ok(p.amountRupiah > 0, `paket ${p.id}: harga harus positif`);
	}
});

test('urutan paket makin besar makin hemat per coin', () => {
	const urut = getCoinTopupPackages().sort((a, b) => a.amountRupiah - b.amountRupiah);
	for (let i = 1; i < urut.length; i += 1) {
		assert.ok(
			urut[i].effectiveRupiahPerCoin <= urut[i - 1].effectiveRupiahPerCoin,
			`${urut[i].id} lebih mahal per coin daripada ${urut[i - 1].id}`
		);
	}
});

test('id paket unik — tidak ada yang saling menimpa', () => {
	const id = getCoinTopupPackages().map((p) => p.id);
	assert.equal(new Set(id).size, id.length, 'ada id paket yang kembar');
});

test('paket lama tidak hilang — pengguna lama tetap bisa memakainya', () => {
	// Menghapus paket yang pernah ada akan membuat tautan/kebiasaan lama
	// rusak tanpa peringatan.
	for (const id of [
		'santri_starter',
		'santri_plus',
		'santri_pro',
		'santri_premium',
		'santri_ultimate'
	]) {
		assert.ok(getCoinTopupPackageById(id), `paket lama ${id} hilang`);
	}
});

test('petunjuk pembelian Tools menyebut jumlah yang benar', () => {
	const paket = getCoinTopupPackageById('santri_tools')!;
	// Petunjuk harus jujur: kalau cukup untuk 1 Tools, jangan bilang belum cukup.
	assert.doesNotMatch(
		paket.toolPurchaseHint,
		/belum cukup/i,
		'paket Tools justru bilang belum cukup — membingungkan'
	);
});

test('paket tidak diketahui dijawab null, bukan melempar galat', () => {
	assert.equal(getCoinTopupPackageById('tidak-ada'), null);
	assert.equal(getCoinTopupPackageById(null), null);
	assert.equal(getCoinTopupPackageById(undefined), null);
});

test('kurs dipakai konsisten: Rp per coin efektif tidak pernah di atas kurs dasar', () => {
	for (const p of getCoinTopupPackages()) {
		assert.ok(
			p.effectiveRupiahPerCoin <= RUPIAH_PER_COIN,
			`paket ${p.id} lebih mahal (${p.effectiveRupiahPerCoin}) daripada kurs dasar ` +
				`${RUPIAH_PER_COIN} — pengguna rugi dibanding topup biasa`
		);
	}
});

// ——— SARAN PAKET SAAT SALDO KURANG ———
//
// Saat pengguna menekan "Top Up Coin" dari halaman produk, halaman topup
// memilihkan paket untuknya. Logika pemilihan itu diuji di sini, bukan
// dibiarkan tersembunyi di dalam `load` yang sulit dijangkau tes.

test('paket yang disarankan CUKUP menutupi kebutuhan', () => {
	for (const butuh of [900, 6_900, 12_900, 19_900]) {
		const pilihan = pilihPaketMencukupi(butuh);
		assert.ok(pilihan, `tidak ada paket untuk kebutuhan ${butuh} coin`);
		assert.ok(
			pilihan!.coinAmount >= butuh,
			`paket ${pilihan!.id} (${pilihan!.coinAmount}) tidak menutupi ${butuh}`
		);
	}
});

test('paket yang disarankan adalah yang TERKECIL di antara yang cukup', () => {
	// Kalau memilih paket terbesar, pengguna merasa dipaksa membeli jauh
	// lebih banyak daripada yang dia butuhkan.
	const pilihan = pilihPaketMencukupi(12_900)!;
	const semuaYangCukup = getCoinTopupPackages().filter((p) => p.coinAmount >= 12_900);
	const terkecil = semuaYangCukup.sort((a, b) => a.coinAmount - b.coinAmount)[0];
	assert.equal(pilihan.id, terkecil.id);
});

test('kebutuhan kecil tidak dilempar ke paket besar', () => {
	// Kurang 900 coin cukup ditutup paket Starter (1.000 coin).
	const pilihan = pilihPaketMencukupi(900)!;
	assert.equal(pilihan.id, 'santri_starter', `malah menyarankan ${pilihan.id}`);
});

test('kebutuhan melebihi semua paket dijawab null, bukan paket yang kurang', () => {
	const terbesar = Math.max(...getCoinTopupPackages().map((p) => p.coinAmount));
	assert.equal(
		pilihPaketMencukupi(terbesar + 1),
		null,
		'menyarankan paket yang tidak mencukupi lebih buruk daripada tidak menyarankan'
	);
});

test('kebutuhan tidak masuk akal dijawab null', () => {
	for (const buruk of [0, -1, 1.5, NaN, Infinity]) {
		assert.equal(pilihPaketMencukupi(buruk as number), null, `${buruk} lolos`);
	}
});
