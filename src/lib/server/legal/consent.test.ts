// src/lib/server/legal/consent.test.ts
// Penjaga persetujuan PDP.
//
// Yang dijaga bukan tampilan checkbox, melainkan hal yang menentukan sah
// tidaknya jejak persetujuan: centang tidak boleh dianggap default, dan
// TIDAK BOLEH ADA jalur pendaftaran yang lolos tanpa memeriksanya.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	bacaConsent,
	kolomConsent,
	consentOauth,
	VERSI_LEGAL,
	FIELD_CONSENT
} from './consent.ts';

const akarRepo = fileURLToPath(new URL('../../../../', import.meta.url));

test('checkbox tercentang dianggap setuju', () => {
	const fd = new FormData();
	fd.set(FIELD_CONSENT, 'on');
	assert.equal(bacaConsent(fd).ok, true);
});

test('checkbox TIDAK dicentang berarti TIDAK setuju', () => {
	// Browser tidak mengirim field checkbox yang tidak dicentang.
	const fd = new FormData();
	assert.equal(bacaConsent(fd).ok, false);
});

test('persetujuan tidak boleh punya nilai bawaan "setuju"', () => {
	// Kalau nilainya aneh/kosong, jawabannya TIDAK — bukan dianggap setuju.
	for (const nilai of ['', ' ', 'off', 'false', '0', 'tidak', 'entah']) {
		const fd = new FormData();
		fd.set(FIELD_CONSENT, nilai);
		assert.equal(
			bacaConsent(fd).ok,
			false,
			`nilai ${JSON.stringify(nilai)} tidak boleh dianggap setuju`
		);
	}
});

test('nilai setuju yang wajar tetap diterima', () => {
	for (const nilai of ['on', 'true', '1', 'ya', 'YES', ' On ']) {
		const fd = new FormData();
		fd.set(FIELD_CONSENT, nilai);
		assert.equal(bacaConsent(fd).ok, true, `nilai ${JSON.stringify(nilai)} seharusnya setuju`);
	}
});

test('kolom consent mencatat waktu dan versi dokumen', () => {
	const sebelum = Date.now();
	const [waktu, versi] = kolomConsent();
	assert.ok(waktu >= sebelum, 'waktu persetujuan harus saat ini');
	assert.equal(versi, VERSI_LEGAL);
});

test('pendaftaran Google juga mencatat jejak persetujuan', () => {
	const [waktu, versi] = consentOauth();
	assert.ok(typeof waktu === 'number' && waktu > 0);
	assert.equal(versi, VERSI_LEGAL);
});

test('versi legal berformat tanggal, bukan teks bebas', () => {
	assert.match(VERSI_LEGAL, /^\d{4}-\d{2}-\d{2}$/);
});

/**
 * Penjaga terpenting: setiap berkas yang membuat akun WAJIB menyimpan jejak
 * persetujuan. Ada 13 jalur pendaftaran — kalau satu terlewat, akan lahir
 * akun tanpa jejak dan lubang itu sulit terlihat dari luar.
 */
const JALUR_PENDAFTARAN = [
	'src/routes/tpq/daftar/+page.server.ts',
	'src/routes/tpq/[slug]/daftar/+page.server.ts',
	'src/routes/masjid/daftar/+page.server.ts',
	'src/routes/masjid/[slug]/daftar/+page.server.ts',
	'src/routes/musholla/daftar/+page.server.ts',
	'src/routes/musholla/[slug]/daftar/+page.server.ts',
	'src/routes/pondok/daftar/+page.server.ts',
	'src/routes/pondok/[slug]/daftar/+page.server.ts',
	'src/routes/rumah-tahfidz/daftar/+page.server.ts',
	'src/routes/rumah-tahfidz/[slug]/daftar/+page.server.ts',
	'src/routes/(auth)/register/ustadz/+page.server.ts',
	'src/routes/(auth)/auth/google/callback/+server.ts'
];

for (const jalur of JALUR_PENDAFTARAN) {
	test(`jalur pendaftaran ${jalur} menyimpan jejak persetujuan`, () => {
		const berkas = `${akarRepo}${jalur}`;
		assert.ok(existsSync(berkas), `berkas tidak ditemukan: ${jalur}`);

		const isi = readFileSync(berkas, 'utf8');
		assert.ok(
			isi.includes('consent_at'),
			`${jalur} membuat akun tanpa menyimpan consent_at — akan lahir akun tanpa jejak persetujuan`
		);
		assert.ok(
			/kolomConsent\(\)|consentOauth\(\)/.test(isi),
			`${jalur} harus memakai helper consent terpusat, bukan menulis nilainya sendiri`
		);
	});
}

test('semua jalur berbasis form memeriksa checkbox sebelum membuat akun', () => {
	// Google OAuth dikecualikan: persetujuan dinyatakan sebelum menekan
	// tombol Google, bukan lewat field form.
	const berbasisForm = JALUR_PENDAFTARAN.filter((j) => !j.includes('google'));

	for (const jalur of berbasisForm) {
		const isi = readFileSync(`${akarRepo}${jalur}`, 'utf8');
		assert.ok(
			isi.includes('bacaConsent'),
			`${jalur} tidak memeriksa persetujuan — akun bisa dibuat tanpa centang`
		);
	}
});

/**
 * Uji mutasi 21 Agustus 2026 membuktikan dua tes di atas TIDAK MENGGIGIT:
 * mengubah `if (!bacaConsent(formData).ok)` menjadi `if (false)` tetap lolos,
 * karena yang diperiksa hanya keberadaan teksnya.
 *
 * Melumpuhkan gerbang consent adalah persis kegagalan yang paling mahal —
 * akun lahir tanpa jejak persetujuan, dan tidak ada yang menyadari. Jadi
 * dua tes berikut memeriksa BENTUK kodenya, bukan sekadar keberadaannya.
 */
for (const jalur of JALUR_PENDAFTARAN.filter((j) => !j.includes('google'))) {
	test(`gerbang consent di ${jalur} benar-benar aktif`, () => {
		const isi = readFileSync(`${akarRepo}${jalur}`, 'utf8');

		// Gerbangnya harus memanggil bacaConsent DI DALAM kondisi if,
		// dan mengembalikan kegagalan — bukan if(false) atau kondisi mati.
		assert.match(
			isi,
			/if\s*\(\s*!\s*bacaConsent\(\s*formData\s*\)\.ok\s*\)\s*\{[\s\S]{0,200}?return fail\(/,
			`${jalur}: gerbang consent tidak berbentuk "if (!bacaConsent(formData).ok) { return fail(...) }" — mungkin dilumpuhkan`
		);

		assert.doesNotMatch(
			isi,
			/if\s*\(\s*(false|0)\s*\)/,
			`${jalur}: ada kondisi yang selalu salah — gerbang kemungkinan dimatikan`
		);
	});

	test(`nilai consent di ${jalur} benar-benar ikut ke query`, () => {
		const isi = readFileSync(`${akarRepo}${jalur}`, 'utf8');

		// Kolom disebut di INSERT DAN nilainya benar-benar di-bind.
		assert.match(
			isi,
			/INSERT INTO users \([^)]*consent_at[^)]*consent_versi[^)]*\)/s,
			`${jalur}: kolom consent tidak ada di daftar kolom INSERT`
		);
		assert.match(
			isi,
			/\.bind\([^;]*\.\.\.kolomConsent\(\)/s,
			`${jalur}: kolomConsent() tidak ikut di-bind — kolomnya disebut tapi nilainya tidak dikirim`
		);
	});
}

test('jumlah placeholder cocok dengan jumlah kolom di setiap INSERT', () => {
	// Kalau kolom bertambah tapi tanda tanya tidak, query gagal saat
	// dijalankan — dan itu baru ketahuan di produksi.
	for (const jalur of JALUR_PENDAFTARAN.filter((j) => !j.includes('google'))) {
		const isi = readFileSync(`${akarRepo}${jalur}`, 'utf8');
		const cocok = isi.match(/INSERT INTO users \(([^)]*)\)\s*\n?\s*VALUES \(([^)]*)\)/s);
		assert.ok(cocok, `${jalur}: pola INSERT tidak terbaca`);

		const jumlahKolom = cocok[1].split(',').filter((k) => k.trim()).length;
		const jumlahTanda = (cocok[2].match(/\?/g) ?? []).length;

		assert.equal(
			jumlahKolom,
			jumlahTanda,
			`${jalur}: ${jumlahKolom} kolom tapi ${jumlahTanda} placeholder — query akan gagal`
		);
	}
});
