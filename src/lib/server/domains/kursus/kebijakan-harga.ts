/**
 * Kebijakan tetap SantriOnline: **ilmu agama tidak dijual.**
 *
 * Aqidah, fiqih, hadits, tafsir, sirah, akhlak, adab, dan Al-Qur'an wajib
 * gratis selamanya. Ilmu agama adalah amanah dakwah, bukan barang dagangan.
 *
 * Aturan ini ditegakkan di kode — bukan sekadar dicatat sebagai niat — agar
 * kursus agama berbayar tidak bisa lolos diam-diam ketika kelak ada yang
 * menambah kursus baru, baik lewat seed maupun lewat panel superadmin.
 *
 * Yang BOLEH berbayar: keterampilan dunia (teknologi, bahasa, kewirausahaan),
 * karya kreatif (novel, cerita), dan perangkat lunak. Penulis dan pembuatnya
 * berhak atas hasil karyanya.
 */

/**
 * Kata kunci kategori yang menandakan ilmu agama.
 *
 * Dicocokkan sebagai bagian kata, sehingga "Aqidah Aswaja" dan
 * "Fiqih Ibadah" ikut terjaring tanpa perlu didaftarkan satu per satu.
 * Ejaan alternatif yang lazim di Indonesia (akidah, fikih) turut dimuat.
 */
export const KATEGORI_ILMU_AGAMA = [
	'aqidah',
	'akidah',
	'tauhid',
	'fiqih',
	'fikih',
	'fiqh',
	'hadits',
	'hadis',
	'tafsir',
	'sirah',
	'akhlak',
	'adab',
	'quran',
	"qur'an",
	'tajwid',
	'tahfidz',
	'tasawuf',
	'ushul',
	'nahwu',
	'shorof',
	'dakwah',
	'keislaman',
	'islam'
] as const;

/** Apakah kategori ini termasuk ilmu agama yang wajib gratis. */
export const wajibGratis = (kategori: string | null | undefined): boolean => {
	const teks = (kategori ?? '').trim().toLowerCase();
	if (!teks) return false;
	return KATEGORI_ILMU_AGAMA.some((kata) => teks.includes(kata));
};

export type HasilPeriksaHarga = {
	harga: number;
	dipaksaGratis: boolean;
	alasan?: string;
};

/**
 * Menentukan harga akhir sebuah kursus.
 *
 * Selain menegakkan aturan ilmu agama, nilai minus dan pecahan ikut
 * dinormalkan — keduanya berbahaya bila diteruskan ke pemotongan koin.
 */
export const periksaHargaKursus = (
	kategori: string | null | undefined,
	hargaDiminta: number
): HasilPeriksaHarga => {
	const normal =
		Number.isFinite(hargaDiminta) && hargaDiminta > 0 ? Math.floor(hargaDiminta) : 0;

	if (wajibGratis(kategori)) {
		return {
			harga: 0,
			dipaksaGratis: normal > 0,
			alasan:
				'Kursus ilmu agama wajib gratis di SantriOnline. Harga disetel menjadi 0.'
		};
	}

	return { harga: normal, dipaksaGratis: false };
};
