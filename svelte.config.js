import adapter from '@sveltejs/adapter-cloudflare'; // Menggunakan adapter cloudflare
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Aturan _routes.json untuk Cloudflare Pages.
 *
 * Cloudflare membatasi include + exclude menjadi 100 aturan. Nilai bawaan
 * adapter, `exclude: ['<all>']`, menuliskan SETIAP berkas di static/ satu per
 * satu. Direktori static/ berisi 180 berkas — 120 di antaranya bendera SVG —
 * sehingga batas itu jebol dan adapter membuang 88 aturan sambil memperingatkan
 * "this will cause unnecessary function invocations".
 *
 * Aset yang aturannya terbuang berhenti dilayani langsung oleh CDN dan mulai
 * membangunkan Worker pada setiap permintaan: lebih lambat bagi pengguna dan
 * memakan kuota invocation. Yang ikut terbuang antara lain ikon PWA, font
 * Arab, dan seluruh PDF kitab.
 *
 * Karena itu setiap direktori diringkas menjadi satu pola. Pola-pola ini aman:
 * tidak ada rute aplikasi yang URL-nya diawali salah satu prefix di bawah
 * (sudah diperiksa dengan grup rute seperti "(app)" dalam keadaan terbuka),
 * dan hal itu dijaga terus oleh tests/cloudflare-routes-budget.test.ts.
 *
 * Diekspor agar tes memeriksa konfigurasi yang sungguh dipakai, bukan salinan.
 */
export const ADAPTER_ROUTES = {
	include: ['/*'],
	exclude: [
		// Artefak build Vite dan halaman hasil prerender.
		'<build>',
		'<prerendered>',

		// Isi static/ diringkas per direktori, bukan per berkas.
		'/.well-known/*',
		'/flags/*',
		'/fonts/*',
		'/icons/*',
		'/kitab-assets/*',
		'/quran/*',
		'/templates/*',

		// Berkas lepas di akar static/.
		'/favicon.ico',
		'/favicon.png',
		'/logo-santri.png',
		'/logo.png',
		'/manifest.json',
		'/pwa-192x192.png',
		'/pwa-512x512.png',
		'/quran-mobile-flip.js',
		'/santrionline.png'
	]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocess agar penulisan kode lebih rapi
	preprocess: vitePreprocess(),

	kit: {
		// Mengaktifkan adapter cloudflare
		adapter: adapter({ routes: ADAPTER_ROUTES })
	}
};

export default config;
