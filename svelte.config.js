import adapter from '@sveltejs/adapter-cloudflare'; // Menggunakan adapter cloudflare
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocess agar penulisan kode lebih rapi
	preprocess: vitePreprocess(),

	kit: {
		// Mengaktifkan adapter cloudflare
		adapter: adapter()
	}
};

export default config;