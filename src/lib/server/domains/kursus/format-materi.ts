/**
 * Materi kursus punya dua asal:
 *
 *  - seed awal ditulis dalam markdown sederhana
 *  - suntingan superadmin lewat editor TipTap menghasilkan HTML
 *
 * Keduanya harus hidup berdampingan: materi lama tidak boleh rusak hanya
 * karena editor HTML ditambahkan.
 */

export type FormatMateri = 'markdown' | 'html';

/**
 * Menebak format bila kolom `format` belum terisi (materi lama).
 *
 * Tebakan sengaja konservatif: hanya dianggap HTML bila benar-benar
 * dibuka dengan tag. Salah menebak markdown sebagai HTML jauh lebih
 * berbahaya daripada sebaliknya, karena HTML dirender mentah.
 */
export const deteksiFormat = (isi: string): FormatMateri => {
	const teks = (isi ?? '').trim();
	return /^<(p|h[1-6]|ul|ol|div|blockquote|table|figure|img|pre)\b/i.test(teks)
		? 'html'
		: 'markdown';
};

/** Tag yang boleh muncul di materi. Selebihnya dibuang seluruhnya. */
const TAG_BERBAHAYA = /<\/?(script|iframe|object|embed|form|input|style|link|meta|base)\b[^>]*>/gi;

/**
 * Membersihkan HTML sebelum disimpan.
 *
 * Editor hanya bisa dipakai superadmin, tetapi pembersihan tetap dilakukan:
 * isi bisa datang dari salin-tempel halaman lain, dan materi ini dirender
 * mentah ke setiap peserta kursus.
 */
export const bersihkanHtml = (html: string): string => {
	let bersih = html ?? '';

	// Buang elemen berbahaya beserta isinya untuk yang berpasangan.
	bersih = bersih.replace(
		/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi,
		''
	);
	bersih = bersih.replace(TAG_BERBAHAYA, '');

	// Buang penangan kejadian sebaris: onclick, onerror, onload, dan sejenisnya.
	bersih = bersih.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
	bersih = bersih.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
	bersih = bersih.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

	// Buang skema tautan yang bisa menjalankan kode.
	bersih = bersih.replace(/(href|src)\s*=\s*"(?:javascript|data|vbscript):[^"]*"/gi, '$1="#"');
	bersih = bersih.replace(/(href|src)\s*=\s*'(?:javascript|data|vbscript):[^']*'/gi, "$1='#'");

	return bersih.trim();
};

/**
 * Menyiapkan satu materi untuk ditampilkan.
 *
 * Format tersimpan selalu menang atas tebakan. Nilai yang tidak dikenal
 * diperlakukan sebagai markdown — pilihan aman, karena markdown di-escape
 * di sisi klien sedangkan HTML tidak.
 */
export const siapkanUntukTampil = (
	isi: string,
	format: string | null | undefined
): { html: string; format: FormatMateri } => {
	// Kolom kosong berarti materi lama sebelum kolom format ada — barulah
	// format ditebak. Nilai yang terisi tetapi tidak dikenal justru menandakan
	// data rusak, dan tidak boleh dinaikkan menjadi HTML tepercaya.
	const adaNilai = format !== null && format !== undefined && format !== '';

	let terpakai: FormatMateri;
	if (!adaNilai) {
		terpakai = deteksiFormat(isi ?? '');
	} else {
		terpakai = format === 'html' ? 'html' : 'markdown';
	}

	if (terpakai === 'html') {
		return { html: bersihkanHtml(isi ?? ''), format: 'html' };
	}

	// Markdown diteruskan apa adanya; pengubahan ke HTML dilakukan di klien
	// setelah teks di-escape.
	return { html: isi ?? '', format: 'markdown' };
};
