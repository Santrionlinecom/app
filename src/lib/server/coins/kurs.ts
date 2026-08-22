// src/lib/server/coins/kurs.ts
// Satu-satunya sumber kebenaran kurs coin SantriOnline.
//
// MENGAPA BERKAS INI ADA
//
// Sebelumnya kurs hidup di dua tempat sekaligus:
//
//   coin-packages.ts     BASE_RUPIAH_PER_COIN = 10   ← topup
//   coin-operations.ts   rupiahToCoin() = 1:1        ← checkout toko
//
// Keduanya tidak pernah bertabrakan hanya karena kolom
// `digital_products.price` ternyata sudah berisi COIN, sehingga konversi
// 1:1 kebetulan mengembalikan angka yang benar.
//
// Itu keberuntungan, bukan desain. Komentar di fungsi lama bahkan
// mengundang orang mengubahnya ("you can adjust the conversion rate
// here") — dan begitu diubah ke kurs asli 10:1, seluruh produk toko
// akan terjual sepersepuluh harga tanpa ada yang menyadarinya.
//
// SATUAN — dibaca sekali, diingat selamanya:
//
//   digital_products.price   → COIN   (12.900 = Rp129.000)
//   coin_wallets.balance     → COIN
//   coin_topup_requests
//     .amount_rupiah         → RUPIAH (yang dibayar pengguna)
//     .coin_amount           → COIN   (yang diterima pengguna)

/** Kurs resmi: 10 rupiah menjadi 1 coin. */
export const RUPIAH_PER_COIN = 10;

const pastikanAngkaWajar = (nilai: number, nama: string) => {
	if (!Number.isFinite(nilai) || nilai < 0) {
		throw new Error(`Nilai ${nama} tidak valid: ${nilai}`);
	}
};

/**
 * Mengubah rupiah menjadi coin.
 *
 * Dibulatkan KE BAWAH supaya pengguna tidak pernah menerima coin yang
 * tidak dibayarkan. Selisih pecahan lebih baik hangus daripada menjadi
 * kebocoran nilai yang tak terlacak.
 */
export function rupiahKeCoin(rupiah: number): number {
	pastikanAngkaWajar(rupiah, 'rupiah');
	return Math.floor(rupiah / RUPIAH_PER_COIN);
}

/** Mengubah coin kembali menjadi rupiah. */
export function coinKeRupiah(coin: number): number {
	pastikanAngkaWajar(coin, 'coin');
	return Math.round(coin * RUPIAH_PER_COIN);
}

/**
 * Harga produk toko, dalam coin.
 *
 * Kolom `digital_products.price` SUDAH menyimpan coin. Fungsi ini sengaja
 * tidak melakukan konversi apa pun — tugasnya hanya memastikan nilainya
 * masuk akal, dan membuat satuannya terbaca jelas di tempat pemanggilan
 * sehingga tidak ada yang tergoda mengonversinya lagi.
 */
export function hargaProdukDalamCoin(hargaTersimpan: number): number {
	if (!Number.isSafeInteger(hargaTersimpan) || hargaTersimpan < 0) {
		throw new Error(`Harga produk tidak valid: ${hargaTersimpan}`);
	}
	return hargaTersimpan;
}

/** Menampilkan harga coin beserta padanan rupiahnya, untuk antarmuka. */
export function labelHarga(coin: number): string {
	const rupiah = coinKeRupiah(coin);
	return `${coin.toLocaleString('id-ID')} Coin (Rp${rupiah.toLocaleString('id-ID')})`;
}
