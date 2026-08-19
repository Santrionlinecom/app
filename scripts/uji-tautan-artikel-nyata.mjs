/**
 * Uji penyisip tautan terhadap isi artikel produksi yang sesungguhnya.
 * Contoh sintetis bisa menipu; yang menentukan adalah HTML asli dari D1.
 */
import { readFileSync } from 'node:fs';
import { hitungTautanInternal, sisipkanTautanInternal } from '../src/lib/server/seo/internal-links.ts';

const berkas = process.argv[2];
const artikel = JSON.parse(readFileSync(berkas, 'utf8'));

let totalTautan = 0;
let tanpaTautan = 0;
let rusak = 0;

for (const row of artikel) {
	const asli = row.content ?? '';
	const hasil = sisipkanTautanInternal(asli);
	const jumlah = hitungTautanInternal(hasil);
	totalTautan += jumlah;
	if (jumlah === 0) tanpaTautan += 1;

	// Pemeriksaan kerusakan: tautan bersarang dan jumlah tag <a> yang masuk akal.
	if (/<a[^>]*>[^<]*<a /.test(hasil)) rusak += 1;

	const backlink = hasil.includes('https://santrionline.com');
	if (!backlink) rusak += 1;

	console.log(
		`${String(jumlah).padStart(2)} tautan | backlink:${backlink ? 'ya ' : 'TIDAK'} | ${String(row.title).slice(0, 62)}`
	);
}

console.log('\n--- ringkasan ---');
console.log(`artikel diuji     : ${artikel.length}`);
console.log(`total tautan kata : ${totalTautan}`);
console.log(`rata-rata         : ${(totalTautan / artikel.length).toFixed(2)} tautan/artikel`);
console.log(`tanpa tautan kata : ${tanpaTautan} (tetap dapat backlink)`);
console.log(`indikasi rusak    : ${rusak}`);
