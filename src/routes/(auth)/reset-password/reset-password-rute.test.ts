// src/routes/(auth)/reset-password/reset-password-rute.test.ts
// Penjaga rute reset password.
//
// Uji mutasi pada pekerjaan sebelumnya membuktikan tes yang hanya mencari
// keberadaan teks TIDAK menggigit — `if (false)` tetap lolos. Karena itu
// tes di sini memeriksa BENTUK kodenya.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const minta = readFileSync(fileURLToPath(new URL('./+page.server.ts', import.meta.url)), 'utf8');
const mintaUi = readFileSync(fileURLToPath(new URL('./+page.svelte', import.meta.url)), 'utf8');
const konfirmasi = readFileSync(
	fileURLToPath(new URL('./konfirmasi/+page.server.ts', import.meta.url)),
	'utf8'
);
const konfirmasiUi = readFileSync(
	fileURLToPath(new URL('./konfirmasi/+page.svelte', import.meta.url)),
	'utf8'
);

test('halaman minta reset benar-benar menerbitkan token, bukan placeholder', () => {
	// Sebelum 22 Agustus 2026 rute ini hanya membalas pesan tanpa
	// mengirim apa pun. Penjaga ini memastikan itu tidak terulang.
	assert.match(minta, /mintaResetPassword\s*\(/, 'tidak memanggil service reset');
	assert.match(minta, /kirimEmailResetPassword\s*\(/, 'tidak mengirim email');
	assert.doesNotMatch(minta, /Placeholder/i, 'masih berupa placeholder');
});

test('kedua rute memverifikasi Turnstile sebelum bekerja', () => {
	for (const [nama, isi] of [
		['minta', minta],
		['konfirmasi', konfirmasi]
	] as const) {
		assert.match(
			isi,
			/const turnstile = await verifyTurnstileFormData\([\s\S]{0,80}?if \(!turnstile\.success\)\s*\{[\s\S]{0,120}?return fail\(/,
			`${nama}: gerbang Turnstile tidak berbentuk utuh — mungkin dilumpuhkan`
		);
		assert.doesNotMatch(isi, /if\s*\(\s*(false|0)\s*\)/, `${nama}: ada kondisi yang selalu salah`);
	}
});

test('kedua halaman menampilkan widget Turnstile', () => {
	assert.match(mintaUi, /<Turnstile\s/);
	assert.match(konfirmasiUi, /<Turnstile\s/);
});

test('halaman konfirmasi memasang Referrer-Policy agar token tidak bocor', () => {
	// Token ada di query string. Tanpa ini, alamat lengkap berikut tokennya
	// bisa ikut terkirim ke domain lain lewat header Referer.
	assert.match(konfirmasi, /setHeaders\(/);
	assert.match(konfirmasi, /'Referrer-Policy':\s*'no-referrer'/);
	assert.match(konfirmasiUi, /name="referrer"\s+content="no-referrer"/);
});

test('halaman konfirmasi tidak boleh diindeks mesin pencari', () => {
	assert.match(konfirmasiUi, /name="robots"\s+content="noindex/);
});

test('halaman konfirmasi tidak menyimpan cache berisi token', () => {
	assert.match(konfirmasi, /'Cache-Control':\s*'no-store/);
});

test('load konfirmasi hanya MEMERIKSA token, tidak mengubah data', () => {
	const badanLoad = konfirmasi.slice(konfirmasi.indexOf('export const load'), konfirmasi.indexOf('export const actions'));
	assert.doesNotMatch(badanLoad, /\bUPDATE\b|\bDELETE\b|\bINSERT\b/i, 'load tidak boleh mengubah data — GET harus aman diulang');
});

test('token TIDAK dikembalikan ke klien lewat data', () => {
	const badanLoad = konfirmasi.slice(konfirmasi.indexOf('export const load'), konfirmasi.indexOf('export const actions'));
	assert.doesNotMatch(badanLoad, /return\s*\{[^}]*\btoken\b\s*[,:}]/, 'token tidak boleh diteruskan ke data halaman');
	assert.match(badanLoad, /tokenSah/, 'halaman cukup diberi tahu sah atau tidak');
});

test('password diganti lewat service, bukan query langsung di rute', () => {
	assert.match(konfirmasi, /pakaiTokenReset\s*\(/);
	assert.doesNotMatch(konfirmasi, /UPDATE users SET password_hash/i, 'aturan keamanan harus tetap di satu tempat');
});

test('konfirmasi mengirim email pemberitahuan setelah password berubah', () => {
	assert.match(konfirmasi, /kirimEmailPasswordBerubah\s*\(/);
});

test('password dan konfirmasinya dicocokkan di server, bukan hanya di layar', () => {
	assert.match(
		konfirmasi,
		/if\s*\(\s*password\s*!==\s*konfirmasi\s*\)[\s\S]{0,120}?return fail\(/,
		'pencocokan hanya di sisi tampilan mudah dilewati'
	);
});
