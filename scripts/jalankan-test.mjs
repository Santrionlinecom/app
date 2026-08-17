#!/usr/bin/env node
/**
 * Menjalankan seluruh berkas *.test.ts di tests/ dan src/.
 *
 * Kenapa tidak memakai glob di package.json:
 * pola `src/**\/*.test.ts` hanya didukung Node 21+, sedangkan CI memakai
 * Node 20 — di sana perintahnya gagal dengan "Could not find". Menyerahkan
 * direktori langsung ke `--test` juga tidak bisa: Node mencoba memuat
 * `tests/index.ts` sebagai modul.
 *
 * Skrip ini menelusuri sendiri lalu meneruskan daftar berkas eksplisit,
 * sehingga perilakunya sama di Node 20 maupun 24.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AKAR = ['tests', 'src'];
const ABAIKAN = new Set(['node_modules', '.svelte-kit', 'dist', 'build', '.git']);

/** @param {string} dir @returns {string[]} */
const telusuri = (dir) => {
	let hasil = [];
	let isi;
	try {
		isi = readdirSync(dir);
	} catch {
		return hasil;
	}
	for (const nama of isi) {
		if (ABAIKAN.has(nama)) continue;
		const p = join(dir, nama);
		let st;
		try {
			st = statSync(p);
		} catch {
			continue;
		}
		if (st.isDirectory()) hasil = hasil.concat(telusuri(p));
		else if (nama.endsWith('.test.ts')) hasil.push(p);
	}
	return hasil;
};

const berkas = AKAR.flatMap(telusuri).sort();

if (berkas.length === 0) {
	console.error('Tidak ada berkas *.test.ts ditemukan.');
	process.exit(1);
}

console.log(`Menjalankan ${berkas.length} berkas test...\n`);

const hasil = spawnSync(
	process.execPath,
	[
		'--import',
		'tsx',
		'--import',
		'./tests/register-svelte.mjs',
		'--test',
		...berkas
	],
	{ stdio: 'inherit' }
);

process.exit(hasil.status ?? 1);
