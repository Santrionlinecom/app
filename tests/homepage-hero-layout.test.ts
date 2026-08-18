import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/routes/(marketing)/+page.svelte', import.meta.url);
const layoutPath = new URL('../src/routes/+layout.svelte', import.meta.url);
const cookiePath = new URL('../src/lib/components/CookieConsent.svelte', import.meta.url);

test('homepage hero avoids DaisyUI hero collision and owns a responsive full-bleed container', async () => {
	const [page, layout] = await Promise.all([
		readFile(pagePath, 'utf8'),
		readFile(layoutPath, 'utf8')
	]);

	assert.match(page, /<main class="min-h-screen overflow-x-hidden bg-\[#f6f7f3\]/);
	assert.doesNotMatch(page, /<section class="hero\b/);
	assert.match(page, /text-4xl font-extrabold/);
	assert.match(page, /lg:text-6xl/);
	assert.match(layout, /usesStandalonePageContainer = pathname === '\/' \|\| isBookMenuActive\(pathname\)/);
});

test('homepage mobile chrome keeps the menu but avoids a duplicate bottom navigation', async () => {
	const layout = await readFile(layoutPath, 'utf8');

	assert.match(layout, /aria-label="Buka menu mobile"/);
	assert.match(layout, /data\?\.user && pathname !== '\/' && !hideMobileBottomNavigation/);
	assert.match(layout, /!data\?\.user && pathname !== '\/' && !hideMobileBottomNavigation/);
});

test('compact consent banner preserves accept, reject, and preference controls', async () => {
	const cookie = await readFile(cookiePath, 'utf8');

	assert.match(cookie, /Terima Analytics/);
	assert.match(cookie, /Tolak Analytics/);
	assert.match(cookie, /Atur Pilihan/);
	assert.match(cookie, /Cookie penting menjaga sesi/);
});
