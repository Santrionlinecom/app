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
	const page = read('src/routes/(app)/dashboard/diniyah/+page.svelte');
	assert.match(page, /\/kitab\/terjemah-aqidatul-awam/);
	assert.match(page, /\/kitab\/safinatun-najah-makna-perkata/);
	assert.match(page, /\/kitab\/terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied/);
	assert.match(page, /\/kitab\/terjemah-bidayatul-hidayah/);
	assert.match(page, /\/kitab\/bahasa-arab-dasar-1/);
	assert.doesNotMatch(page, /Integrasikan ringkasan materi/);
});

test('ujian tahfidz menyimpan hasil, bukan halaman kosong', () => {
	const server = read('src/routes/(app)/dashboard/ujian-tahfidz/+page.server.ts');
	assert.match(server, /tahfidz_ujian/);
	assert.match(server, /export const actions/);
	assert.doesNotMatch(server, /ready: false/);
});
