import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const mulai = readFileSync('src/routes/(auth)/auth/google/+server.ts', 'utf8');
const tombol = readFileSync('src/lib/components/GoogleAuthButton.svelte', 'utf8');

// Pengguna yang sudah punya sesi tidak boleh dikirim bolak-balik ke
// accounts.google.com. Perjalanan itu memakan beberapa detik dan tampak seperti
// "loading yang tidak hilang-hilang padahal sudah masuk akun".
test('pengguna yang sudah login tidak dikirim lagi ke Google', () => {
	assert.match(mulai, /locals/, 'handler wajib membaca locals untuk tahu sesi aktif');
	assert.match(mulai, /if \(locals\.user\)/, 'wajib ada penjaga sesi aktif');

	const penjaga = mulai.indexOf('if (locals.user)');
	const keGoogle = mulai.indexOf('createAuthorizationURL');
	assert.ok(penjaga >= 0 && penjaga < keGoogle, 'penjaga wajib sebelum membuat URL otorisasi Google');
});

test('pengalihan menghormati tujuan yang aman saja', () => {
	assert.match(mulai, /safeRedirect/, 'wajib memakai jalur redirect yang sudah divalidasi');
});

test('tombol Google memberi umpan balik saat diklik', () => {
	assert.match(tombol, /aria-busy/, 'wajib menandai status sibuk untuk pembaca layar');
	assert.match(tombol, /on:click/, 'wajib menangkap klik untuk menampilkan status');
	assert.match(tombol, /animate-spin|Menghubungkan/, 'wajib ada indikator visual saat menunggu Google');
});
