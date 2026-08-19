import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();

/**
 * Leaflet memberi z-index tinggi ke pane (400) dan kontrol zoom/attribution (1000).
 * Sidebar mobile app memakai z-[55] dan header z-50, sehingga tanpa stacking
 * context sendiri peta akan "melayang" menutupi sidebar di layar HP.
 *
 * Perbaikannya: bungkus peta dalam elemen yang membuat stacking context
 * (`isolate` = isolation:isolate) supaya seluruh z-index Leaflet ter-contain.
 */
const mapComponents = [
	'src/lib/components/admin/LembagaMap.svelte',
	'src/lib/components/admin/KoordinatInput.svelte',
	'src/lib/components/dashboard/StudentProgressMap.svelte'
];

const readComponent = (relativePath: string) =>
	readFileSync(join(root, relativePath), 'utf8');

for (const relativePath of mapComponents) {
	test(`${relativePath} membungkus peta dalam stacking context sendiri`, () => {
		const source = readComponent(relativePath);
		assert.match(
			source,
			/\bisolate\b/,
			`${relativePath} harus memakai class "isolate" agar z-index Leaflet tidak menembus sidebar`
		);
	});

	test(`${relativePath} menahan kontrol Leaflet di bawah sidebar`, () => {
		const source = readComponent(relativePath);
		assert.match(
			source,
			/\.leaflet-(top|bottom|pane|control-container)/,
			`${relativePath} harus menurunkan z-index kontrol Leaflet secara eksplisit`
		);
	});
}

test('sidebar mobile tetap di atas lapisan peta', () => {
	const layout = readComponent('src/routes/+layout.svelte');
	// Sidebar mobile memakai z-[55]; peta harus berada di stacking context
	// dengan level jauh di bawahnya (z-0), bukan bersaing di root.
	assert.match(layout, /z-\[55\]/, 'sidebar mobile harus tetap memakai z-[55]');

	const lembagaMap = readComponent('src/lib/components/admin/LembagaMap.svelte');
	assert.doesNotMatch(
		lembagaMap,
		/class="[^"]*\bfixed\b[^"]*"[^>]*bind:this={mapElement}/,
		'container peta tidak boleh fixed'
	);
});
