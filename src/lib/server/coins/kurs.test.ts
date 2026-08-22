// src/lib/server/coins/kurs.test.ts
// Penjaga kurs coin.
//
// LATAR BELAKANG (22 Agustus 2026):
//
// Ada dua sumber kurs yang hidup bersamaan di kode:
//
//   coin-packages.ts     BASE_RUPIAH_PER_COIN = 10   ← dipakai topup
//   coin-operations.ts   rupiahToCoin() = 1:1        ← dipakai checkout toko
//
// Keduanya tidak pernah bertabrakan HANYA karena kolom `digital_products.price`
// ternyata sudah berisi COIN, bukan rupiah — sehingga `rupiahToCoin(12900)`
// yang 1:1 kebetulan mengembalikan angka yang benar.
//
// Itu bukan desain, itu keberuntungan. Bahayanya nyata: siapa pun yang
// membaca `coin-operations.ts` akan melihat komentar "1 Rupiah = 1 Coin,
// you can adjust the conversion rate here" lalu memperbaikinya menjadi
// kurs asli 10:1 — dan seketika seluruh produk toko dijual sepersepuluh
// harga.
//
// Tes ini mengunci kedua hal: kurs resminya, dan fakta bahwa harga produk
// TIDAK boleh dikonversi lagi saat checkout.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	RUPIAH_PER_COIN,
	rupiahKeCoin,
	coinKeRupiah,
	hargaProdukDalamCoin
} from './kurs.ts';

// ——— KURS RESMI ———

test('kurs resmi adalah 10 rupiah = 1 coin', () => {
	assert.equal(RUPIAH_PER_COIN, 10);
});

test('rupiah dikonversi ke coin dengan kurs 10:1', () => {
	assert.equal(rupiahKeCoin(10_000), 1_000);
	assert.equal(rupiahKeCoin(100_000), 10_000);
	assert.equal(rupiahKeCoin(129_000), 12_900);
});

test('coin dikonversi kembali ke rupiah', () => {
	assert.equal(coinKeRupiah(1_000), 10_000);
	assert.equal(coinKeRupiah(12_900), 129_000);
});

test('konversi bolak-balik tidak menggeser nilai', () => {
	for (const rupiah of [10_000, 25_000, 50_000, 100_000, 250_000]) {
		assert.equal(coinKeRupiah(rupiahKeCoin(rupiah)), rupiah, `gagal pada Rp${rupiah}`);
	}
});

test('coin selalu bilangan bulat — tidak ada pecahan coin', () => {
	// Rp10.005 bukan kelipatan kurs. Dibulatkan ke bawah supaya pengguna
	// tidak pernah menerima coin yang tidak dibayar.
	assert.equal(rupiahKeCoin(10_005), 1_000);
	assert.ok(Number.isInteger(rupiahKeCoin(99_999)));
});

test('nilai tidak masuk akal ditolak, bukan menghasilkan angka aneh', () => {
	for (const buruk of [-1, NaN, Infinity, -0.5]) {
		assert.throws(() => rupiahKeCoin(buruk as number), /tidak valid/i, `${buruk} lolos`);
		assert.throws(() => coinKeRupiah(buruk as number), /tidak valid/i, `${buruk} lolos`);
	}
});

// ——— HARGA PRODUK: SUDAH COIN, JANGAN DIKONVERSI ———

test('harga produk toko dipakai apa adanya — TIDAK dikonversi lagi', () => {
	/*
	 * Kolom `digital_products.price` menyimpan COIN, bukan rupiah.
	 * SantriPrint Pro = 12.900 coin (setara Rp129.000).
	 *
	 * Kalau nilai ini dilewatkan fungsi konversi, harganya jatuh menjadi
	 * 1.290 coin — pembeli membayar Rp12.900 untuk produk Rp129.000.
	 */
	assert.equal(hargaProdukDalamCoin(12_900), 12_900);
	assert.equal(hargaProdukDalamCoin(6_900), 6_900);
	assert.equal(hargaProdukDalamCoin(19_900), 19_900);
});

test('harga produk menolak nilai tidak sah', () => {
	for (const buruk of [-1, NaN, Infinity, 1.5]) {
		assert.throws(() => hargaProdukDalamCoin(buruk as number), /tidak valid/i);
	}
});

test('produk gratis (0 coin) diperbolehkan', () => {
	assert.equal(hargaProdukDalamCoin(0), 0);
});

// ——— PENJAGA STRUKTURAL ———

const checkout = readFileSync(
	fileURLToPath(new URL('../../../routes/(app)/digital-store/[slug]/+page.server.ts', import.meta.url)),
	'utf8'
);

test('checkout toko TIDAK memakai fungsi konversi rupiah pada harga produk', () => {
	/*
	 * Ini penjaga terpenting di berkas ini.
	 *
	 * `rupiahToCoin` yang lama bernilai 1:1, jadi memanggilnya pada harga
	 * yang sudah coin kebetulan tidak merusak apa-apa. Tetapi begitu
	 * seseorang memperbaiki fungsi itu ke kurs asli 10:1 — yang wajar
	 * dilakukan karena komentarnya sendiri mengundang — semua produk
	 * langsung terjual sepersepuluh harga tanpa ada yang sadar.
	 */
	assert.doesNotMatch(
		checkout,
		/rupiahToCoin\s*\(/,
		'harga produk sudah dalam coin; melewatkannya ke konversi rupiah adalah bom waktu'
	);
});

test('checkout memakai helper harga yang eksplisit', () => {
	assert.match(
		checkout,
		/hargaProdukDalamCoin\s*\(/,
		'pakai helper bernama jelas supaya satuannya tidak ambigu'
	);
});

const paket = readFileSync(
	fileURLToPath(new URL('../coin-packages.ts', import.meta.url)),
	'utf8'
);

test('paket topup memakai kurs terpusat, bukan angka sendiri', () => {
	// Sebelumnya `BASE_RUPIAH_PER_COIN = 10` ditulis ulang di berkas ini.
	// Dua tempat mendefinisikan kurs = dua tempat bisa berbeda diam-diam.
	assert.match(paket, /RUPIAH_PER_COIN/, 'paket topup harus mengimpor kurs terpusat');
	assert.doesNotMatch(
		paket,
		/const\s+BASE_RUPIAH_PER_COIN\s*=\s*\d+/,
		'kurs tidak boleh didefinisikan ulang di sini'
	);
});

test('setiap paket topup konsisten dengan kurs dasar', async () => {
	const { getCoinTopupPackages } = await import('../coin-packages.ts');
	for (const p of getCoinTopupPackages()) {
		// baseCoin = nilai sebelum bonus. Harus persis hasil kurs dasar.
		assert.equal(
			p.baseCoin,
			rupiahKeCoin(p.amountRupiah),
			`paket ${p.id}: baseCoin tidak cocok dengan kurs`
		);
		// Bonus boleh nol atau positif, tetapi tidak boleh negatif —
		// itu berarti pengguna dirugikan diam-diam.
		assert.ok(p.bonusCoin >= 0, `paket ${p.id}: bonus negatif (${p.bonusCoin})`);
	}
});

test('paket yang lebih besar tidak boleh lebih mahal per coin', async () => {
	const { getCoinTopupPackages } = await import('../coin-packages.ts');
	const paketUrut = getCoinTopupPackages().sort((a, b) => a.amountRupiah - b.amountRupiah);
	for (let i = 1; i < paketUrut.length; i += 1) {
		assert.ok(
			paketUrut[i].effectiveRupiahPerCoin <= paketUrut[i - 1].effectiveRupiahPerCoin,
			`paket ${paketUrut[i].id} lebih mahal per coin daripada paket yang lebih kecil`
		);
	}
});
