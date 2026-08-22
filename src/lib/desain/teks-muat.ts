// Menghitung ukuran huruf yang dijamin muat di dalam kotak teks.
//
// Dipisah dari komponen supaya bisa diuji tanpa browser: fungsi ini menerima
// alat ukur sebagai parameter, jadi tes bisa memasukkan pengukur palsu yang
// deterministik, sementara di browser dipakai CanvasRenderingContext2D.
//
// Latar: Fabric TIDAK mengecilkan huruf saat teks melebihi lebar Textbox. Ia
// membungkus per kata, dan satu KATA yang lebih lebar dari kotaknya akan
// meluber. Dengan textAlign 'center', luapan itu terbagi ke kiri dan kanan
// sehingga teks terpotong di KEDUA sisi — inilah yang terlihat pada judul
// "Selamat Hari Santri Nasional" di kanvas A4.

/** Mengukur lebar sepotong teks pada ukuran huruf tertentu. */
export type PengukurTeks = (teks: string, fontSize: number) => number;

/**
 * Ukuran huruf terbesar yang membuat KATA TERPANJANG tetap muat.
 *
 * Memakai penskalaan langsung, bukan perulangan coba-coba: lebar render teks
 * berbanding lurus dengan ukuran huruf, jadi satu kali bagi sudah cukup dan
 * hasilnya tidak bergantung jumlah putaran.
 */
export const hitungFontMuat = (
	ukur: PengukurTeks,
	isi: string,
	lebarKotak: number,
	fontAwal: number,
	fontMin = 12
): number => {
	const kata = isi.split(/\s+/).filter(Boolean);
	// Ukuran huruf selalu dibulatkan: pemanggil kerap mengirim angka pecahan
	// hasil perkalian lebar kanvas (mis. 794 x 0,075 = 59,55), dan pecahan
	// membuat perhitungan tata letak sulit diverifikasi.
	const awal = Math.max(fontMin, Math.round(fontAwal));
	if (kata.length === 0 || lebarKotak <= 0 || fontAwal <= 0) return awal;

	// Yang menentukan luapan adalah kata terpanjang, bukan seluruh kalimat:
	// kalimat panjang masih bisa dibungkus ke baris berikutnya, satu kata
	// tidak bisa.
	let lebarTerbesar = 0;
	for (const k of kata) {
		const w = ukur(k, awal);
		if (w > lebarTerbesar) lebarTerbesar = w;
	}

	if (lebarTerbesar <= lebarKotak) return awal;

	const disesuaikan = Math.floor(awal * (lebarKotak / lebarTerbesar));
	return Math.max(fontMin, disesuaikan);
};

/**
 * Posisi kiri agar kotak teks benar-benar terpusat di kanvas.
 *
 * Sebelumnya dipakai angka tetap (7% dari lebar) yang tidak pernah cocok
 * dengan lebar kotak 86%, sehingga kotaknya sedikit meleset ke kiri.
 */
export const kiriTerpusat = (lebarKanvas: number, lebarKotak: number): number =>
	Math.max(0, (lebarKanvas - lebarKotak) / 2);
