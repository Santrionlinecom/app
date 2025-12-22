import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'robots.txt', 'pwa-192x192.png', 'pwa-512x512.png'],
			manifest: {
				name: 'Santri Online',
				short_name: 'SantriOnline',
				description: 'Platform Digital Terintegrasi untuk Santri - Setor Hafalan, History Belajar Kitab, dan Ibadah Harian',
				theme_color: '#15803d',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				scope: '/',
				categories: ['education', 'productivity', 'lifestyle'],
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				// Pastikan pola ini menangkap semua file statis penting
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,ttf}'],
				
				// Strategi Caching (Penyimpanan Offline)
				runtimeCaching: [
					// 1. Simpan Halaman HTML (Dashboard, Menu)
					// Strategi: NetworkFirst (Cari sinyal dulu, kalau mati baru buka cache)
					{
						urlPattern: ({ request }) => request.destination === 'document',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'santri-pages',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 7 // Simpan 1 minggu
							},
							networkTimeoutSeconds: 3 // Kalau 3 detik gak ada sinyal, anggap offline
						}
					},
					// 2. Simpan Data API (Amalan, Wirid, Hafalan) - INI PENTING BUAT OFFLINE
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/amalan'),
						handler: 'NetworkFirst',
						options: {
							cacheName: 'santri-api-data',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // Simpan 1 bulan biar wirid aman
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// 3. Simpan Aset (CSS, JS, Worker) - Biar aplikasi ngebut
					{
						urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
						handler: 'StaleWhileRevalidate', // Pakai cache lama sambil update cache baru di background
						options: {
							cacheName: 'santri-assets',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30
							}
						}
					},
					// 4. Simpan Gambar - Biar hemat kuota
					{
						urlPattern: ({ request }) => request.destination === 'image',
						handler: 'CacheFirst', // Utamakan cache, jarang update gambar
						options: {
							cacheName: 'santri-images',
							expiration: {
								maxEntries: 60,
								maxAgeSeconds: 60 * 60 * 24 * 30
							}
						}
					},
					// 5. Simpan Mushaf per Juz (on-demand)
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/quran/'),
						handler: 'CacheFirst',
						options: {
							cacheName: 'santri-quran-juz',
							expiration: {
								maxEntries: 40,
								maxAgeSeconds: 60 * 60 * 24 * 365
							}
						}
					},
					// 6. Simpan Font (Google Fonts / Amiri)
					{
						urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
						handler: 'CacheFirst',
						options: {
							cacheName: 'santri-fonts',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // Simpan setahun
							}
						}
					}
				]
			}
		})
	]
});
