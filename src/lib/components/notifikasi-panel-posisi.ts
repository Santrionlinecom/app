/**
 * Penghitung posisi panel notifikasi.
 *
 * Dipisah dari komponen supaya bisa diuji tanpa browser.
 *
 * Masalah yang diselesaikan: tombol lonceng berada dekat tepi kanan layar,
 * sedangkan panel selebar ~22rem. Bila panel sekadar dirapatkan ke kanan
 * tombol (CSS `right-0`), pada layar HP tepi kirinya jatuh ke koordinat
 * negatif sehingga judul dan isi notifikasi terpotong keluar layar.
 *
 * Solusinya menghitung posisi dalam koordinat viewport: panel menyempit
 * mengikuti lebar layar bila perlu, lalu digeser agar selalu berada di dalam
 * margin kiri dan kanan.
 */

export type MasukanPosisiPanel = {
	/** Lebar viewport. */
	lebarLayar: number;
	/** Tepi kiri tombol lonceng, relatif viewport. */
	tombolKiri: number;
	/** Tepi kanan tombol lonceng, relatif viewport. */
	tombolKanan: number;
	/** Tepi bawah tombol lonceng, relatif viewport. */
	tombolBawah: number;
	/** Lebar panel yang diinginkan bila ruang mencukupi. */
	lebarPanelDiinginkan: number;
	/** Jarak minimum panel dari tepi layar. */
	margin: number;
	/** Jarak vertikal antara tombol dan panel. */
	jarak?: number;
};

export type PosisiPanel = {
	kiri: number;
	atas: number;
	lebar: number;
};

export const hitungPosisiPanel = ({
	lebarLayar,
	tombolKiri,
	tombolKanan,
	tombolBawah,
	lebarPanelDiinginkan,
	margin,
	jarak = 8
}: MasukanPosisiPanel): PosisiPanel => {
	// Panel tidak boleh lebih lebar dari ruang yang tersisa setelah margin.
	const ruangTersedia = Math.max(0, lebarLayar - margin * 2);
	const lebar = Math.min(lebarPanelDiinginkan, ruangTersedia);

	// Posisi ideal: tepi kanan panel sejajar tepi kanan tombol.
	let kiri = tombolKanan - lebar;

	// Jangan menembus tepi kiri.
	if (kiri < margin) kiri = margin;

	// Jangan menembus tepi kanan (terjadi bila tombol berada di ujung kiri).
	const batasKanan = lebarLayar - margin - lebar;
	if (kiri > batasKanan) kiri = batasKanan;

	// Layar yang lebih sempit dari dua margin sekalipun tidak boleh
	// menghasilkan koordinat negatif.
	if (kiri < 0) kiri = 0;

	// tombolKiri sengaja tidak dipakai untuk menghitung posisi akhir, tetapi
	// tetap diterima agar pemanggil bisa mengirim seluruh kotak tombol apa
	// adanya tanpa memilah-milah field.
	void tombolKiri;

	return { kiri, atas: tombolBawah + jarak, lebar };
};
