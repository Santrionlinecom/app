/**
 * Aturan apa yang boleh disimpan di perangkat oleh service worker.
 *
 * Dipisah dari service-worker.ts supaya bisa diuji: berkas service worker
 * mengimpor modul virtual `$service-worker` yang tidak bisa dimuat di luar
 * proses build.
 *
 * Prinsip yang dipegang:
 *
 * 1. Balasan API TIDAK PERNAH disimpan. Aplikasi ini memakai sesi login, dan
 *    satu perangkat bisa dipakai bergantian (santri, ustadz, orang tua).
 *    Menyimpan balasan API berarti data akun sebelumnya bisa tersaji ke akun
 *    berikutnya, bahkan setelah keluar.
 * 2. Halaman HTML tidak disimpan, karena halaman berisi data pribadi hasil
 *    render server dan bisa menampilkan materi kedaluwarsa tanpa disadari.
 * 3. Yang disimpan hanya berkas statis yang sama untuk semua orang: hasil
 *    build ber-hash, font, ikon, gambar, dan bendera.
 */

/** Awalan yang isinya sama untuk semua pengguna, aman disimpan. */
const AWALAN_AMAN = [
	'/_app/immutable/',
	'/fonts/',
	'/flags/',
	'/icons/',
	'/quran/',
	'/templates/'
];

/** Berkas lepas yang aman disimpan. */
const BERKAS_AMAN = new Set([
	'/favicon.ico',
	'/favicon.png',
	'/logo.png',
	'/logo-santri.png',
	'/manifest.json',
	'/pwa-192x192.png',
	'/pwa-512x512.png',
	'/santrionline.png'
]);

/** Jalur yang tidak boleh disimpan meski cocok aturan lain. */
const AWALAN_TERLARANG = ['/api/', '/auth', '/logout', '/admin/'];

/**
 * Menentukan boleh atau tidaknya satu URL disimpan di cache perangkat.
 * Menerima URL lengkap agar permintaan lintas domain ikut tersaring.
 */
export const bolehDisimpanDiCache = (urlLengkap: string, asalAplikasi: string): boolean => {
	let url: URL;
	let asal: URL;
	try {
		url = new URL(urlLengkap);
		asal = new URL(asalAplikasi);
	} catch {
		return false;
	}

	// Hanya berkas milik aplikasi sendiri. Aset pihak ketiga dibiarkan
	// diurus browser agar kebijakan kedaluwarsanya tidak kita timpa.
	if (url.origin !== asal.origin) return false;

	// Permintaan dengan query string biasanya dinamis.
	if (url.search) return false;

	const jalur = url.pathname;

	if (AWALAN_TERLARANG.some((awalan) => jalur.startsWith(awalan))) return false;
	if (BERKAS_AMAN.has(jalur)) return true;
	if (AWALAN_AMAN.some((awalan) => jalur.startsWith(awalan))) return true;

	return false;
};

/**
 * Berkas hasil build memakai nama ber-hash, sehingga isinya tidak pernah
 * berubah. Aman dilayani dari perangkat tanpa menanya jaringan lebih dulu.
 */
export const bersifatKekal = (urlLengkap: string): boolean => {
	try {
		return new URL(urlLengkap).pathname.startsWith('/_app/immutable/');
	} catch {
		return false;
	}
};
