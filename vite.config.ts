import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sentrySvelteKit } from '@sentry/sveltekit';

/**
 * Catatan service worker.
 *
 * Proyek ini pernah memakai SvelteKitPWA (Workbox) BERSAMAAN dengan service
 * worker bawaan SvelteKit di src/service-worker.ts. Keduanya ikut ter-build,
 * tetapi hanya satu yang benar-benar dipakai:
 *
 *   - SvelteKit mendaftarkan src/service-worker.ts secara otomatis, dan
 *     berkas itulah yang aktif di produksi (menangani Web Push).
 *   - Workbox menghasilkan sw.js + workbox-*.js (±51 KB) beserta
 *     registerSW.js yang TIDAK PERNAH dimuat, sehingga seluruh aturan
 *     runtimeCaching-nya tidak pernah berjalan.
 *
 * Selain sia-sia, aturan Workbox itu berbahaya bila sempat aktif: ia menyimpan
 * balasan /api/* selama 30 hari dan halaman HTML selama 7 hari. Aplikasi ini
 * memakai sesi login dan satu perangkat sering dipakai bergantian, sehingga
 * data akun sebelumnya bisa tersaji ke akun berikutnya.
 *
 * Workbox dilepas. Caching aset kini ditangani src/service-worker.ts dengan
 * kebijakan eksplisit di src/lib/service-worker-policy.ts, yang menolak
 * seluruh balasan API dan halaman ber-sesi.
 *
 * Manifest PWA tetap dilayani dari static/manifest.json seperti yang dirujuk
 * src/app.html.
 */
export default defineConfig(async () => ({
	plugins: [
		await sentrySvelteKit({
			org: 'santri-online',
			project: 'javascript-sveltekit',
			authToken: process.env.SENTRY_AUTH_TOKEN,
			telemetry: false,
			adapter: 'cloudflare',
			autoUploadSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN)
		}),
		sveltekit()
	]
}));
