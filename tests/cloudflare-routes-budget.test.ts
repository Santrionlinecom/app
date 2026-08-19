import * as assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();

/**
 * Cloudflare Pages membatasi include + exclude di _routes.json menjadi 100
 * aturan. Secara bawaan adapter memakai '<all>', yang menuliskan SETIAP berkas
 * di static/ satu per satu. Dengan 180 berkas (120 di antaranya bendera),
 * batas itu jebol dan adapter membuang 88 aturan sambil memperingatkan
 * "this will cause unnecessary function invocations".
 *
 * Akibatnya aset yang aturannya terbuang tidak lagi dilayani langsung dari
 * CDN, melainkan membangunkan Worker untuk tiap permintaan.
 */
// Diambil dari sumber yang sama dengan yang dipakai svelte.config.js,
// sehingga tes menguji konfigurasi sungguhan, bukan salinannya.
import { ADAPTER_ROUTES } from '../svelte.config.js';

const include = ADAPTER_ROUTES.include;
const exclude = ADAPTER_ROUTES.exclude;

const BATAS_CLOUDFLARE = 100;

const daftarIsiStatic = () => {
	const isi = readdirSync(join(root, 'static'));
	return isi.map((nama) => ({
		nama,
		direktori: statSync(join(root, 'static', nama)).isDirectory()
	}));
};

test('total aturan berada jauh di bawah batas 100 Cloudflare', () => {
	const total = include.length + exclude.length;
	assert.ok(
		total <= BATAS_CLOUDFLARE,
		`total aturan ${total} melebihi batas ${BATAS_CLOUDFLARE}`
	);
	// Sisakan ruang agar penambahan aset baru tidak langsung menjebol batas.
	assert.ok(total <= 60, `total aturan ${total} terlalu mepet; sisakan ruang tumbuh`);
});

test('bendera memakai satu pola, bukan satu baris per berkas', () => {
	const barisBendera = exclude.filter((r) => r.startsWith('/flags/'));
	assert.deepEqual(barisBendera, ['/flags/*'], 'bendera harus diringkas jadi /flags/*');
});

test('tidak ada aturan exclude yang menyebut berkas .svg satu per satu', () => {
	const perFile = exclude.filter((r) => r.endsWith('.svg'));
	assert.deepEqual(perFile, [], `masih ada exclude per-berkas svg: ${perFile.join(', ')}`);
});

test('setiap isi static/ tercakup aturan exclude', () => {
	const tidakTercakup = daftarIsiStatic().filter(({ nama, direktori }) => {
		if (nama === '_headers' || nama === '_redirects') return false;
		const target = direktori ? `/${nama}/*` : `/${nama}`;
		return !exclude.includes(target);
	});

	assert.deepEqual(
		tidakTercakup.map((i) => i.nama),
		[],
		'ada isi static/ yang tidak punya aturan exclude; berkas itu akan membangunkan Worker'
	);
});

test('artefak build dan halaman prerender tetap dikecualikan', () => {
	assert.ok(exclude.includes('<build>'), '<build> wajib ada');
	assert.ok(exclude.includes('<prerendered>'), '<prerendered> wajib ada');
});

test('tidak ada pola exclude yang menelan rute aplikasi', () => {
	// Rute di dalam grup seperti (app) tidak menambah segmen URL, jadi
	// src/routes/(app)/quran akan tersaji di /quran dan bisa tertelan pola
	// /quran/*. Segmen di bawah ini dikumpulkan dengan grup sudah dibuka.
	const segmenRute = new Set<string>();
	const telusuri = (dir: string, dasar: string) => {
		for (const entri of readdirSync(dir, { withFileTypes: true })) {
			if (!entri.isDirectory()) continue;
			const grup = entri.name.startsWith('(') && entri.name.endsWith(')');
			if (grup) {
				telusuri(join(dir, entri.name), dasar);
				continue;
			}
			if (dasar === '') segmenRute.add(entri.name);
		}
	};
	telusuri(join(root, 'src/routes'), '');

	const bentrok = exclude
		.filter((r) => r.startsWith('/') && r.endsWith('/*'))
		.map((r) => r.slice(1, -2))
		.filter((segmen) => segmenRute.has(segmen));

	assert.deepEqual(
		bentrok,
		[],
		`pola exclude menelan rute aplikasi: ${bentrok.join(', ')} — permintaan tidak akan sampai ke Worker`
	);
});
