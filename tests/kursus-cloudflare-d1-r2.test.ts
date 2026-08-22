import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const akar = process.cwd();
const seed = readFileSync(join(akar, 'migrations/0077_seed_kursus_cloudflare_d1_r2.sql'), 'utf-8');
const skrip = readFileSync(join(akar, 'scripts/seed-kursus-cloudflare-d1-r2.py'), 'utf-8');

test('kursus edge terbit, gratis, slug tetap', () => {
	assert.match(seed, /'published'/);
	assert.match(seed, /'bangun-deploy-aplikasi-edge-1-hari'/);
	assert.match(seed, /NULL, 135,/);
	assert.match(seed, /'Teknologi & Platform'/);
	assert.match(seed, /, 0, 'dasar'/);
});

test('enam materi lengkap dengan id tetap', () => {
	const jumlah = (seed.match(/INSERT OR REPLACE INTO kursus_materi/g) ?? []).length;
	assert.equal(jumlah, 6, `harus 6 materi, ditemukan ${jumlah}`);
	for (let i = 1; i <= 6; i += 1) {
		assert.match(seed, new RegExp(`kursus-cloudflare-d1-r2-m${i}`));
	}
});

test('PPT R2 ditautkan dari seed dan skrip', () => {
	const url =
		'https://files.santrionline.com/kursus/cloudflare-d1-r2/Kursus-1-Cloudflare-D1-R2.pptx';
	assert.match(seed, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	assert.match(skrip, /PPT_URL/);
	assert.match(skrip, /Kursus-1-Cloudflare-D1-R2\.pptx/);
});

test('tujuh modul dan perkakas inti dibahas', () => {
	const wajib = ['D1', 'R2', 'Wrangler', 'WSL', 'GitHub', 'API Token', 'Telegram', 'commit'];
	const hilang = wajib.filter((k) => !seed.toLowerCase().includes(k.toLowerCase()));
	assert.deepEqual(hilang, [], `istilah belum dibahas: ${hilang.join(', ')}`);
});
