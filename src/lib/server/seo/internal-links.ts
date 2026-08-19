/**
 * Penyisip tautan internal untuk artikel blog.
 *
 * Dijalankan saat render, bukan sebagai penulisan ulang isi di basis data.
 * Alasannya: 2.000+ artikel lama ikut mendapat tautan tanpa satu pun UPDATE
 * berisiko, hasilnya tetap ada di HTML server-render sehingga terbaca mesin
 * pencari, dan bila kelak petanya berubah cukup ganti kode — isi asli artikel
 * tidak pernah rusak.
 *
 * Aturan yang dijaga:
 *  - hanya menaut ke halaman yang benar-benar publik (bukan yang minta login),
 *  - tidak pernah menyisip di dalam <a>, judul, kode, atau atribut tag,
 *  - satu kata kunci dipakai sekali saja, dengan batas jumlah tautan,
 *  - idempoten: isi yang sudah disisipi tidak akan ditambah lagi.
 */

/** Situs utama. Inilah backlink yang diminta ada di setiap artikel. */
export const SITUS_UTAMA = 'https://santrionline.com';

/** Penanda supaya penyisipan tidak berlapis saat fungsi dipanggil dua kali. */
const PENANDA = 'data-so-link';

/** Tag yang isinya haram disentuh. */
const TAG_TERLARANG = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'script', 'style', 'figcaption']);

export type PetaTautan = {
	/** Kata kunci yang dicari di dalam teks artikel. */
	kata: string[];
	href: string;
	judul: string;
};

/**
 * Peta kata kunci ke halaman.
 *
 * Setiap href sudah diverifikasi mengembalikan HTTP 200 tanpa login pada
 * 19 Agustus 2026. Halaman `/kitab`, `/kitab/quran`, dan `/kursus` sengaja
 * TIDAK dipakai: ketiganya kini berada di dalam shell dashboard dan membalas
 * 302 ke halaman masuk, sehingga menautinya hanya membuang jatah crawl dan
 * membuat pembaca anonim mentok.
 */
export const PETA_TAUTAN: PetaTautan[] = [
	{
		kata: ['Rasulullah', 'Nabi Muhammad', 'nabi', 'rasul'],
		href: '/nabi',
		judul: 'Sirah para nabi di SantriOnline'
	},
	{
		kata: ['sahabat Nabi', 'para sahabat', 'sahabat'],
		href: '/sahabat',
		judul: 'Kisah para sahabat Nabi'
	},
	{
		kata: ['tabiin', "tabi'in"],
		href: '/tabiin',
		judul: 'Generasi tabiin'
	},
	{
		kata: ['ulama', 'kiai', 'syekh', 'imam mazhab'],
		href: '/ulama',
		judul: 'Profil ulama Ahlus Sunnah'
	},
	{
		kata: ['masjid', 'musholla', 'musala'],
		href: '/masjid',
		judul: 'Direktori masjid'
	},
	{
		kata: ['dinasti', 'khilafah', 'kekhalifahan', 'Utsmani', 'Abbasiyah', 'Umayyah'],
		href: '/dinasti',
		judul: 'Sejarah dinasti Islam'
	},
	{
		kata: ['ormas', 'Nahdlatul Ulama', 'Muhammadiyah', 'organisasi Islam'],
		href: '/ormas',
		judul: 'Ormas Islam Indonesia'
	},
	{
		kata: ['tokoh', 'ilmuwan muslim', 'cendekiawan'],
		href: '/tokoh',
		judul: 'Tokoh Islam'
	},
	{
		kata: ['buku', 'kitab digital', 'membaca'],
		href: '/buku',
		judul: 'Buku digital SantriOnline'
	}
];

/** Kalimat penutup yang membawa backlink ke situs utama. */
export const PARAGRAF_BACKLINK =
	`<p ${PENANDA}="beranda">Bacaan ini bagian dari ikhtiar ` +
	`<a href="${SITUS_UTAMA}" title="SantriOnline — pembinaan santri Indonesia">SantriOnline</a>` +
	` dalam membina generasi muslim Indonesia: aqidah yang kukuh, adab yang hidup, ilmu yang terus tumbuh, dan keterampilan yang siap dipakai.</p>`;

type Potongan = { jenis: 'tag' | 'teks'; nilai: string; bolehSisip: boolean };

/**
 * Memecah HTML menjadi potongan tag dan teks, sambil menandai teks mana yang
 * aman disisipi. Cukup untuk HTML sederhana <p>/<h3> yang dihasilkan penulis
 * artikel; tidak berpura-pura menjadi parser HTML lengkap.
 */
function pecah(html: string): Potongan[] {
	const hasil: Potongan[] = [];
	const pola = /<[^>]+>/g;
	const tumpukan: string[] = [];
	let posisi = 0;
	let cocok: RegExpExecArray | null;

	const amanSekarang = () => !tumpukan.some((tag) => TAG_TERLARANG.has(tag));

	while ((cocok = pola.exec(html)) !== null) {
		if (cocok.index > posisi) {
			hasil.push({ jenis: 'teks', nilai: html.slice(posisi, cocok.index), bolehSisip: amanSekarang() });
		}
		const tag = cocok[0];
		const nama = tag.match(/^<\/?\s*([a-zA-Z0-9]+)/)?.[1]?.toLowerCase();
		if (nama) {
			if (tag.startsWith('</')) {
				const indeks = tumpukan.lastIndexOf(nama);
				if (indeks !== -1) tumpukan.splice(indeks, 1);
			} else if (!tag.endsWith('/>')) {
				tumpukan.push(nama);
			}
		}
		hasil.push({ jenis: 'tag', nilai: tag, bolehSisip: false });
		posisi = pola.lastIndex;
	}

	if (posisi < html.length) {
		hasil.push({ jenis: 'teks', nilai: html.slice(posisi), bolehSisip: amanSekarang() });
	}
	return hasil;
}

const escapeRegExp = (nilai: string) => nilai.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Menyisipkan tautan internal ke dalam isi artikel.
 *
 * @param html isi artikel apa adanya dari basis data
 * @param maksTautan batas tautan kontekstual (di luar paragraf backlink)
 */
export function sisipkanTautanInternal(html: string, maksTautan = 4): string {
	const isi = typeof html === 'string' ? html : '';
	if (!isi.trim()) return isi;
	// Sudah pernah disisipi — jangan menumpuk.
	if (isi.includes(PENANDA)) return isi;

	const potongan = pecah(isi);
	let terpakai = 0;

	for (const entri of PETA_TAUTAN) {
		if (terpakai >= maksTautan) break;

		// Kata terpanjang dahulu agar "Nabi Muhammad" menang atas "nabi".
		const kataUrut = [...entri.kata].sort((a, b) => b.length - a.length);
		let sudah = false;

		for (const kata of kataUrut) {
			if (sudah) break;
			const pola = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(kata)})(?![\\p{L}\\p{N}])`, 'iu');

			for (const bagian of potongan) {
				if (sudah) break;
				if (bagian.jenis !== 'teks' || !bagian.bolehSisip) continue;
				if (!pola.test(bagian.nilai)) continue;

				bagian.nilai = bagian.nilai.replace(
					pola,
					(_cocok, depan: string, teks: string) =>
						`${depan}<a href="${entri.href}" ${PENANDA}="kata" title="${entri.judul}">${teks}</a>`
				);
				sudah = true;
				terpakai += 1;
			}
		}
	}

	return potongan.map((bagian) => bagian.nilai).join('') + PARAGRAF_BACKLINK;
}

/** Dipakai pengujian dan panel admin untuk melihat berapa tautan yang masuk. */
export function hitungTautanInternal(html: string): number {
	return (html.match(new RegExp(`${PENANDA}="kata"`, 'g')) ?? []).length;
}
