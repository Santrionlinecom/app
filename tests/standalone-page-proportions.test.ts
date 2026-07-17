import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const readRoute = (path: string) => readFile(resolve('src/routes', path), 'utf8');

const wideRoutes = [
	'coins/+page.svelte',
	'coins/topup/+page.svelte',
	'buku/+page.svelte',
	'buku/[slug]/+page.svelte',
	'buku/[slug]/baca/+page.svelte',
	'buku/saya/+page.svelte',
	'buku/studio/+page.svelte',
	'buku/studio/earnings/+page.svelte'
];

const focusedRoutes = [
	'buku/studio/new/+page.svelte',
	'buku/studio/[id]/edit/+page.svelte',
	'buku/studio/[id]/chapters/new/+page.svelte',
	'buku/studio/[id]/chapters/[chapterId]/edit/+page.svelte',
	'akun/perangkat/+page.svelte'
];

const chapterReaderRoute = 'buku/[slug]/bab/[chapter]/+page.svelte';

test('halaman Buku dan Koin memakai container desktop proporsional', async () => {
	for (const route of wideRoutes) {
		const source = await readRoute(route);
		assert.match(source, /max-w-\[1440px\]/, route);
		assert.match(source, /px-4/, route);
		assert.match(source, /sm:px-6/, route);
		assert.match(source, /lg:px-8/, route);
		assert.match(source, /pb-36/, route);
	}
});

test('form dan editor mempertahankan lebar baca yang fokus', async () => {
	for (const route of focusedRoutes) {
		const source = await readRoute(route);
		assert.match(source, /min-h-screen w-full max-w-(?:4xl|5xl)/, route);
		assert.match(source, /px-4/, route);
		assert.match(source, /sm:px-6/, route);
		assert.match(source, /pb-36/, route);
	}
});

test('reader bab memiliki lebar baca fokus dan ruang aman di atas navigasi mobile', async () => {
	const source = await readRoute(chapterReaderRoute);
	assert.match(source, /max-w-5xl/);
	assert.match(source, /pb-36/);
	assert.match(source, /md:pb-12/);
});

test('baris riwayat Koin tetap terbaca untuk teks panjang di layar kecil', async () => {
	const source = await readRoute('coins/+page.svelte');
	const responsiveRows = source.match(/flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6/g) ?? [];
	const wrappedDescriptions = source.match(/break-words text-sm leading-6/g) ?? [];

	assert.equal(responsiveRows.length, 2);
	assert.equal(wrappedDescriptions.length, 2);
	assert.match(source, /flex min-w-0 items-center gap-4/);
	assert.match(source, /self-end text-right sm:self-auto/);
});

test('shell global tidak memberi padding kedua pada Buku dan Koin', async () => {
	const source = await readRoute('+layout.svelte');
	assert.match(source, /usesStandalonePageContainer = isBookMenuActive\(pathname\)/);
	assert.match(source, /hidePageChrome \|\| usesStandalonePageContainer/);
});
