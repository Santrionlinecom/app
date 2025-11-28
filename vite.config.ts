import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifestFilename: 'manifest.json',
			includeAssets: ['favicon.ico', 'robots.txt', 'logo.png', 'logo-santri.png'],
			manifest: {
				id: '/',
				name: 'Santri Online',
				short_name: 'SantriOnline',
				description:
					'Platform Digital Terintegrasi untuk Santri - Setor Hafalan, History Belajar Kitab, dan Ibadah Harian',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait',
				background_color: '#ffffff',
				theme_color: '#15803d',
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
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/app\.santrionline\.com\/.*$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'santri-pages',
							networkTimeoutSeconds: 3,
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'santri-assets',
							expiration: {
								maxEntries: 60,
								maxAgeSeconds: 60 * 60 * 24 * 14
							}
						}
					},
					{
						urlPattern: ({ request }) => request.destination === 'image',
						handler: 'CacheFirst',
						options: {
							cacheName: 'santri-images',
							expiration: {
								maxEntries: 60,
								maxAgeSeconds: 60 * 60 * 24 * 30
							}
						}
					}
				]
			}
		})
	]
});
