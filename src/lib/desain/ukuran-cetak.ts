// Matematika ukuran cetak: satu-satunya sumber kebenaran mm <-> piksel.
//
// Ini dipisah dari komponen editor supaya bisa diuji tanpa browser. Salah di
// sini berarti hasil cetak meleset secara fisik — dan itu baru ketahuan
// setelah pengguna membayar tukang cetak.

/** Resolusi cetak standar percetakan. */
export const DPI_CETAK = 300;

/** Resolusi layar; dipakai untuk kanvas kerja agar tidak berat. */
export const DPI_LAYAR = 96;

export type UkuranMm = { lebar: number; tinggi: number };

export type UkuranKertas = {
	id: string;
	nama: string;
	mm: UkuranMm;
	/** Keterangan singkat untuk pengguna awam. */
	catatan: string;
};

/**
 * Ukuran yang benar-benar dipakai lembaga: A4/A3 untuk sertifikat dan poster,
 * banner meteran untuk panggung, plus rasio media sosial.
 *
 * Media sosial memakai satuan mm hasil konversi dari piksel @72dpi supaya satu
 * rumus saja yang berlaku untuk semuanya.
 */
export const UKURAN_KERTAS: UkuranKertas[] = [
	{ id: 'a4-potret', nama: 'A4 Potret', mm: { lebar: 210, tinggi: 297 }, catatan: 'Sertifikat, piagam, formulir' },
	{ id: 'a4-lanskap', nama: 'A4 Lanskap', mm: { lebar: 297, tinggi: 210 }, catatan: 'Piagam lomba, sertifikat tahfidz' },
	{ id: 'a3-potret', nama: 'A3 Potret', mm: { lebar: 297, tinggi: 420 }, catatan: 'Poster mading, pengumuman' },
	{ id: 'banner-3x1', nama: 'Banner 3 x 1 m', mm: { lebar: 3000, tinggi: 1000 }, catatan: 'Spanduk panggung acara' },
	{ id: 'banner-4x1', nama: 'Banner 4 x 1 m', mm: { lebar: 4000, tinggi: 1000 }, catatan: 'Spanduk besar halaman masjid' },
	{ id: 'ig-feed', nama: 'Feed Instagram 1:1', mm: { lebar: 279.4, tinggi: 279.4 }, catatan: 'Unggahan persegi' },
	{ id: 'ig-story', nama: 'Story Instagram 9:16', mm: { lebar: 285.75, tinggi: 508 }, catatan: 'Story dan status WA' }
];

export const ukuranDefault = UKURAN_KERTAS[0];

export const cariUkuran = (id: string): UkuranKertas =>
	UKURAN_KERTAS.find((u) => u.id === id) ?? ukuranDefault;

/** Milimeter ke piksel pada dpi tertentu. 1 inci = 25,4 mm. */
export const mmKePx = (mm: number, dpi: number = DPI_CETAK): number =>
	Math.round((mm / 25.4) * dpi);

/** Piksel kembali ke milimeter. */
export const pxKeMm = (px: number, dpi: number = DPI_CETAK): number => (px * 25.4) / dpi;

/** Ukuran piksel penuh untuk ekspor cetak. */
export const ukuranCetakPx = (mm: UkuranMm, dpi: number = DPI_CETAK) => ({
	lebar: mmKePx(mm.lebar, dpi),
	tinggi: mmKePx(mm.tinggi, dpi)
});

/**
 * Kanvas kerja dibatasi lebarnya supaya banner 4 meter tidak membuat browser
 * kehabisan memori. Perbandingan sisi tetap dipertahankan persis.
 *
 * Tinggi dihitung LANGSUNG dari perbandingan mm, bukan dari hasil pembulatan
 * ukuran layar. Membulatkan dua kali (mm -> px layar -> px jepit) menggeser
 * rasio secukupnya untuk membuat ekspor A3 meleset 4 piksel.
 */
export const LEBAR_KERJA_MAKS = 1000;

export const ukuranKerjaPx = (mm: UkuranMm) => {
	const penuh = ukuranCetakPx(mm, DPI_LAYAR);
	if (penuh.lebar <= LEBAR_KERJA_MAKS) return penuh;
	return {
		lebar: LEBAR_KERJA_MAKS,
		tinggi: Math.round((LEBAR_KERJA_MAKS * mm.tinggi) / mm.lebar)
	};
};

/**
 * Pengali dari kanvas kerja ke resolusi cetak.
 *
 * Inilah inti ketajaman hasil: menggambar di kanvas kecil lalu memperbesar
 * gambar jadinya buram. Fabric memakai angka ini untuk merender ULANG seluruh
 * objek pada resolusi penuh, bukan menskalakan bitmap.
 *
 * Dipilih pengali TERKECIL dari kedua sisi. Kanvas kerja dibulatkan ke piksel
 * bulat sehingga rasionya sedikit bergeser; memakai pengali terkecil menjamin
 * hasil tidak pernah MELEBIHI ukuran cetak yang diminta — lebih baik meleset
 * kurang satu piksel daripada lebih, karena kelebihan piksel menggeser posisi
 * saat dipotong percetakan.
 *
 * Diverifikasi lewat ekspor sungguhan di Chromium: A4 menghasilkan PNG
 * 2480x3507 — lebar tepat, tinggi kurang 1 piksel dari 3508 karena Fabric
 * MEMBULATKAN KE BAWAH saat mengalikan kanvas (1123 x 3,12342569 = 3507,607).
 * Selisih 1 piksel pada 297 mm setara 0,008 mm, jauh di bawah presisi mesin
 * cetak mana pun, jadi dibiarkan apa adanya ketimbang menambah kerumitan.
 */
export const penggandaCetak = (mm: UkuranMm, dpi: number = DPI_CETAK): number => {
	const kerja = ukuranKerjaPx(mm);
	const cetak = ukuranCetakPx(mm, dpi);
	return Math.min(cetak.lebar / kerja.lebar, cetak.tinggi / kerja.tinggi);
};

/** Perkiraan berat berkas hasil ekspor, untuk memperingatkan pengguna. */
export const perkiraanMegapiksel = (mm: UkuranMm, dpi: number = DPI_CETAK): number => {
	const { lebar, tinggi } = ukuranCetakPx(mm, dpi);
	return (lebar * tinggi) / 1_000_000;
};

/**
 * Banner meteran pada 300dpi menghasilkan gambar yang mustahil dirender
 * browser (4 m x 1 m = 47.244 x 11.811 px = 558 megapiksel). Percetakan
 * banner memang memakai dpi rendah karena dilihat dari jauh.
 */
export const dpiAman = (mm: UkuranMm): number => {
	const sisiTerpanjangMm = Math.max(mm.lebar, mm.tinggi);
	if (sisiTerpanjangMm > 2000) return 72;
	if (sisiTerpanjangMm > 1000) return 150;
	return DPI_CETAK;
};
