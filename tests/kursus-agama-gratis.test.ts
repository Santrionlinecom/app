import * as assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { wajibGratis } from '../src/lib/server/domains/kursus/kebijakan-harga';

/**
 * Penjaga menyeluruh untuk kebijakan "ilmu agama tidak dijual".
 *
 * Aturan sudah ditegakkan di lapisan aplikasi, tetapi seed dan migrasi
 * menulis langsung ke basis data tanpa melewatinya. Test ini menutup
 * celah itu.
 */

const akar = process.cwd();

test('tidak ada seed kursus agama yang berbayar', () => {
	const dirMigrasi = join(akar, 'migrations');
	const pelanggaran: string[] = [];

	for (const berkas of readdirSync(dirMigrasi).filter((f) => f.endsWith('.sql'))) {
		const isi = readFileSync(join(dirMigrasi, berkas), 'utf-8');

		for (const baris of isi.split('\n')) {
			if (!baris.includes('INTO kursus ')) continue;

			// Kolom kursus berurutan tetap:
			//   ..., deskripsi, harga_koin, level, kategori, sampul_url, ...
			// Diurai berpasangan agar harga dan kategori dipastikan berasal dari
			// baris yang sama — bukan sekadar dua pola yang kebetulan cocok.
			const cocok = baris.match(/,\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*NULL/);
			if (!cocok) continue;

			const harga = Number(cocok[1]);
			const kategori = cocok[3];

			if (harga > 0 && wajibGratis(kategori)) {
				pelanggaran.push(`${berkas}: kategori "${kategori}" diberi harga ${harga}`);
			}
		}
	}

	assert.deepEqual(pelanggaran, [], `seed melanggar kebijakan:\n${pelanggaran.join('\n')}`);
});

test('skrip seed python tidak memberi harga pada kursus agama', () => {
	const skrip = readFileSync(join(akar, 'scripts/seed-kursus.py'), 'utf-8');

	// Setiap blok kursus: pasangkan kategori dengan harga_koin di blok yang sama.
	const blok = skrip.split('"slug":').slice(1);
	const pelanggaran: string[] = [];

	for (const b of blok) {
		const kategori = b.match(/"kategori":\s*"([^"]+)"/)?.[1];
		const harga = Number(b.match(/"harga_koin":\s*(\d+)/)?.[1] ?? 0);
		if (kategori && wajibGratis(kategori) && harga > 0) {
			pelanggaran.push(`${kategori} diberi harga ${harga}`);
		}
	}

	assert.deepEqual(pelanggaran, [], `skrip seed melanggar kebijakan: ${pelanggaran.join(', ')}`);
});

test('editor superadmin menegakkan kebijakan', () => {
	const server = readFileSync(
		join(akar, 'src/routes/(app)/admin/kursus/[slug]/edit/+page.server.ts'),
		'utf-8'
	);
	assert.match(
		server,
		/periksaHargaKursus/,
		'harga dari panel superadmin wajib melewati pemeriksaan kebijakan'
	);

	// Penegakan wajib di server, bukan hanya mengunci kolom di halaman:
	// form bisa dikirim langsung tanpa membuka halaman.
	assert.equal(
		/const harga = Number\.isFinite\(hargaMentah\)/.test(server),
		false,
		'harga tidak boleh dipakai langsung tanpa pemeriksaan kebijakan'
	);
});

test('migrasi pembebasan kursus agama ada', () => {
	const migrasi = readFileSync(join(akar, 'migrations/0066_ilmu_agama_gratis.sql'), 'utf-8');
	assert.match(migrasi, /UPDATE kursus/);
	assert.match(migrasi, /harga_koin = 0/);
	assert.match(migrasi, /aqidah/i);
});
