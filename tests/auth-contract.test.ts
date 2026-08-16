/**
 * Kontrak fungsional halaman autentikasi.
 *
 * Test ini ditulis SEBELUM perubahan tampilan, supaya perbaikan visual
 * tidak pernah diam-diam merusak kemampuan login dan register.
 *
 * Aturan: berkas server autentikasi tidak boleh diubah oleh pekerjaan tampilan.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (rel: string) => readFile(new URL(`../src/${rel}`, import.meta.url), 'utf8');

test('halaman masuk mempertahankan field yang dibutuhkan server', async () => {
	const page = await read('routes/(auth)/auth/+page.svelte');

	// Server membaca formData 'email' dan 'password'; nama ini tidak boleh berubah.
	assert.match(page, /name="email"/, 'input email wajib ada');
	assert.match(page, /name="password"/, 'input password wajib ada');
	assert.match(page, /<form method="POST"/, 'form wajib POST ke action default');
	assert.match(page, /type="submit"/, 'tombol submit wajib ada');
	assert.match(page, /required/, 'validasi required wajib dipertahankan');
});

test('halaman masuk mempertahankan Turnstile dan Google', async () => {
	const page = await read('routes/(auth)/auth/+page.svelte');

	// verifyTurnstileFormData() akan menggagalkan login bila token tidak terkirim.
	assert.match(page, /<Turnstile\b/, 'komponen Turnstile wajib dirender');
	assert.match(page, /siteKey=\{data\.turnstileSiteKey\}/, 'siteKey wajib diteruskan');
	assert.match(page, /<GoogleAuthButton\b/, 'tombol Google wajib ada');
	assert.match(page, /href=\{googleHref\}/, 'href Google wajib memakai redirect aman');
});

test('halaman masuk menampilkan pesan galat dari server', async () => {
	const page = await read('routes/(auth)/auth/+page.svelte');
	assert.match(page, /form\?\.message/, 'pesan galat server wajib ditampilkan');
	assert.match(page, /role="alert"/, 'galat wajib diumumkan ke pembaca layar');
});

test('halaman masuk mempertahankan tautan daftar dan lupa password', async () => {
	const page = await read('routes/(auth)/auth/+page.svelte');
	assert.match(page, /href="\/register"/, 'tautan daftar wajib ada');
	assert.match(page, /href="\/reset-password"/, 'tautan lupa password wajib ada');
});

test('toggle tampilkan password tetap berfungsi', async () => {
	const page = await read('routes/(auth)/auth/+page.svelte');
	assert.match(page, /type=\{showPassword \? 'text' : 'password'\}/, 'toggle wajib bekerja');
	assert.match(page, /aria-label=\{showPassword \?/, 'toggle wajib punya label aksesibel');
});

test('halaman daftar mempertahankan semua jalur pendaftaran', async () => {
	const page = await read('routes/(auth)/register/+page.svelte');
	assert.match(page, /href="\/register\/ustadz"/, 'jalur pendaftaran ustadz wajib ada');
	assert.match(page, /href="\/auth"/, 'tautan kembali ke masuk wajib ada');
});

test('logika server autentikasi tidak diubah oleh pekerjaan tampilan', async () => {
	const server = await read('routes/(auth)/auth/+page.server.ts');

	// Penjaga keamanan yang wajib tetap utuh.
	assert.match(server, /verifyTurnstileFormData/, 'verifikasi Turnstile wajib dipertahankan');
	assert.match(server, /isPasswordLoginAllowedForIdentity/, 'penjaga Super Admin wajib ada');
	assert.match(server, /Scrypt/, 'verifikasi password wajib memakai Scrypt');
	assert.match(server, /initializeLucia/, 'sesi wajib dibuat lewat Lucia');
	// Pesan galat tidak boleh membocorkan apakah email terdaftar.
	assert.match(server, /Email atau Password salah/, 'pesan galat wajib tetap samar');
});

test('/login tidak menyimpan form masuk tiruan yang tidak berfungsi', async () => {
	const loginServer = await read('routes/(auth)/login/+page.server.ts');
	const loginPage = await read('routes/(auth)/login/+page.svelte');

	// Server selalu mengalihkan, jadi form apa pun di sini tidak akan pernah
	// memverifikasi Turnstile maupun memeriksa password.
	assert.match(loginServer, /redirect\(302, '\/auth'\)/, 'load wajib mengalihkan ke /auth');
	assert.doesNotMatch(loginPage, /<form/, 'tidak boleh ada form masuk tiruan');
	assert.doesNotMatch(loginPage, /name="password"/, 'tidak boleh ada input password tiruan');
	assert.match(loginPage, /href="\/auth"/, 'wajib menyediakan tautan tanpa JavaScript');
});

test('halaman autentikasi memakai token warna merek, bukan biru generik', async () => {
	const pages = await Promise.all([
		read('routes/(auth)/auth/+page.svelte'),
		read('routes/(auth)/reset-password/+page.svelte')
	]);

	for (const page of pages) {
		// Warna biru Tailwind bukan bagian dari palet SantriOnline.
		assert.doesNotMatch(page, /\b(bg|text|border|focus:border)-blue-\d{3}\b/);
		assert.match(page, /text-so-green|--color-so-green/, 'wajib memakai token hijau merek');
	}
});

test('pesan sukses reset password tidak memakai ikon galat', async () => {
	const page = await read('routes/(auth)/reset-password/+page.svelte');
	// Ikon harus mengikuti jenis pesan, bukan selalu ikon galat.
	assert.match(page, /\{#if form\?\.success\}/, 'ikon wajib bercabang sesuai status');
	assert.match(page, /M9 12l2 2 4-4/, 'ikon centang wajib ada untuk pesan sukses');
});

test('form autentikasi memakai autocomplete yang benar', async () => {
	const auth = await read('routes/(auth)/auth/+page.svelte');
	assert.match(auth, /autocomplete="email"/, 'email wajib punya autocomplete');
	assert.match(auth, /autocomplete="current-password"/, 'password wajib punya autocomplete');
});

test('navigasi bawah mobile disembunyikan di seluruh halaman autentikasi', async () => {
	const layout = await read('routes/+layout.svelte');

	// Sebelumnya hanya /register yang disembunyikan, sehingga navigasi
	// mengambang menutupi form pada /auth dan /reset-password di layar kecil.
	assert.match(layout, /isAuthPage\s*=/, 'wajib ada penanda halaman autentikasi');
	for (const route of ['/auth', '/login', '/reset-password', '/register']) {
		assert.ok(
			new RegExp(`pathname === '${route}'`).test(layout) ||
				new RegExp(`pathname\\.startsWith\\('${route}/'\\)`).test(layout),
			`${route} wajib termasuk halaman autentikasi`
		);
	}
	assert.match(
		layout,
		/hideMobileBottomNavigation = isAuthPage \|\| isPromosiPage/,
		'navigasi bawah wajib disembunyikan pada halaman autentikasi'
	);
});
