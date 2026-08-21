import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf-8');

test('halaman asrama pondok ada dan hanya untuk pondok', () => {
	assert.equal(existsSync(join(root, 'src/routes/(app)/dashboard/asrama/+page.server.ts')), true);
	assert.equal(existsSync(join(root, 'src/routes/(app)/dashboard/asrama/+page.svelte')), true);
	const server = read('src/routes/(app)/dashboard/asrama/+page.server.ts');
	assert.match(server, /org\.type !== 'pondok'/);
	assert.match(server, /pondok_asrama/);
	assert.match(server, /createAsrama|createRoom|buatKamar/);
});

test('diniyah menaut ke kitab digital yang sudah ada', () => {
	// 2026-08-21: kurikulum diniyah dipindah dari +page.svelte ke
	// +page.server.ts supaya judul & ketersediaan kitab diverifikasi ke
	// kitab_catalog. Maksud tes ini tidak berubah — memastikan halaman
	// menaut ke kitab yang benar-benar ada, bukan tautan karangan.
	const server = read('src/routes/(app)/dashboard/diniyah/+page.server.ts');
	assert.match(server, /terjemah-aqidatul-awam/);
	assert.match(server, /safinatun-najah-makna-perkata/);
	assert.match(server, /terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied/);
	assert.match(server, /terjemah-bidayatul-hidayah/);
	assert.match(server, /bahasa-arab-dasar-1/);

	// Slug wajib dicocokkan ke katalog, bukan langsung dijadikan tautan.
	assert.match(server, /kitab_catalog/);

	const page = read('src/routes/(app)/dashboard/diniyah/+page.svelte');
	assert.doesNotMatch(page, /Integrasikan ringkasan materi/);
	assert.match(page, /data\.materi/, 'halaman harus memakai data dari server');
});

test('ujian tahfidz menyimpan hasil, bukan halaman kosong', () => {
	const server = read('src/routes/(app)/dashboard/ujian-tahfidz/+page.server.ts');
	assert.match(server, /tahfidz_ujian/);
	assert.match(server, /export const actions/);
	assert.doesNotMatch(server, /ready: false/);
});
