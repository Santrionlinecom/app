import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

const includePrerendered = process.env.PWA_INCLUDE_PRERENDERED === 'true';
const pwaGlobPatterns = [
	'client/**/*.{js,css,ico,png,svg,webp,woff2,ttf,webmanifest}'
];
if (includePrerendered) {
	pwaGlobPatterns.push('prerendered/**/*.{html,json}');
}

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: [
				'favicon.ico',
				'robots.txt',
				'icons/icon-48.png',
				'icons/icon-192.png',
				'icons/icon-512.png',
				'icons/apple-touch-icon.png'
			],
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
						src: '/icons/icon-48.png',
						sizes: '48x48',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icons/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icons/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				// Optional: set PWA_INCLUDE_PRERENDERED=true to include prerendered pages.
				modifyURLPrefix: {},
				globPatterns: pwaGlobPatterns,
				
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
						handler: 'NetworkFirst',
						options: {
							cacheName: 'santri-quran-juz-v2',
							networkTimeoutSeconds: 4,
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
