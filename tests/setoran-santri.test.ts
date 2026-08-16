import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
	buildSantriOptions,
	resolveSetoranSantri,
	type SantriOption
} from '../src/lib/server/domains/tpq/setoran-santri';

/**
 * Tahap 2: halaman setoran harus bisa mencatat setoran untuk santri yang
 * didata lewat tabel `santri` (tanpa akun login), bukan hanya santri lama
 * yang punya baris di `users`.
 *
 * Skema lama memaksa `santri_user_id NOT NULL REFERENCES users(id)`, sehingga
 * santri TPQ hasil pendataan tahap 1 mustahil disetorkan.
 */

const dariTabelSantri: SantriOption[] = [
	{ id: 's1', nama: 'Ahmad Fauzi', sumber: 'santri', kelas: 'Iqro 3' },
	{ id: 's2', nama: 'Siti Aminah', sumber: 'santri', kelas: null }
];

const dariUsers: SantriOption[] = [
	{ id: 'u1', nama: 'Budi Santoso', sumber: 'users', kelas: null }
];

test('daftar santri menggabungkan hasil pendataan dan akun lama', () => {
	const opsi = buildSantriOptions(dariTabelSantri, dariUsers);
	assert.equal(opsi.length, 3);
	assert.deepEqual(
		opsi.map((o) => o.nama),
		['Ahmad Fauzi', 'Budi Santoso', 'Siti Aminah']
	);
});

test('daftar diurutkan menurut nama, bukan menurut sumber', () => {
	const opsi = buildSantriOptions(
		[{ id: 's9', nama: 'Zainal', sumber: 'santri', kelas: null }],
		[{ id: 'u9', nama: 'Abdullah', sumber: 'users', kelas: null }]
	);
	assert.equal(opsi[0].nama, 'Abdullah');
});

test('sumber tiap santri tetap terbawa agar kolom tujuan benar', () => {
	const opsi = buildSantriOptions(dariTabelSantri, dariUsers);
	assert.equal(opsi.find((o) => o.id === 's1')?.sumber, 'santri');
	assert.equal(opsi.find((o) => o.id === 'u1')?.sumber, 'users');
});

test('daftar kosong tidak membuat kesalahan', () => {
	assert.deepEqual(buildSantriOptions([], []), []);
});

test('santri hasil pendataan disimpan ke kolom santri_id', () => {
	const hasil = resolveSetoranSantri('s1', dariTabelSantri.concat(dariUsers));
	assert.equal(hasil.ok, true);
	if (!hasil.ok) return;
	assert.equal(hasil.value.santriId, 's1');
	assert.equal(hasil.value.santriUserId, null);
});

test('santri berakun lama tetap disimpan ke kolom santri_user_id', () => {
	const hasil = resolveSetoranSantri('u1', dariTabelSantri.concat(dariUsers));
	assert.equal(hasil.ok, true);
	if (!hasil.ok) return;
	assert.equal(hasil.value.santriUserId, 'u1');
	assert.equal(hasil.value.santriId, null);
});

test('KEAMANAN: santri di luar daftar lembaga ditolak', () => {
	// Daftar hanya berisi santri lembaga aktif, jadi id asing berarti percobaan
	// mencatat setoran untuk santri lembaga lain.
	const hasil = resolveSetoranSantri('santri-lembaga-lain', dariTabelSantri);
	assert.equal(hasil.ok, false);
});

test('id kosong ditolak', () => {
	assert.equal(resolveSetoranSantri('', dariTabelSantri).ok, false);
	assert.equal(resolveSetoranSantri('   ', dariTabelSantri).ok, false);
});

/**
 * Skema tpq_setoran harus menerima kedua sumber. Tabel di produksi masih
 * kosong (0 baris) sehingga rekonstruksi aman dilakukan.
 */
const academic = readFileSync(
	join(process.cwd(), 'src/lib/server/domains/tpq/academic.ts'),
	'utf-8'
);

test('skema setoran punya kolom santri_id ke tabel santri', () => {
	assert.match(academic, /santri_id TEXT/, 'wajib ada kolom santri_id');
	assert.match(academic, /REFERENCES santri\(id\)/, 'santri_id wajib merujuk tabel santri');
});

test('santri_user_id tidak lagi NOT NULL', () => {
	assert.equal(
		/santri_user_id TEXT NOT NULL/.test(academic),
		false,
		'santri_user_id harus boleh NULL agar santri tanpa akun bisa disetorkan'
	);
});

test('skema memaksa tepat satu sumber santri terisi', () => {
	// Tanpa CHECK, sebuah setoran bisa tidak punya santri sama sekali, atau
	// punya dua sekaligus sehingga laporan menghitung ganda.
	assert.match(
		academic,
		/CHECK\s*\(\s*\(santri_id IS NOT NULL\)\s*\+\s*\(santri_user_id IS NOT NULL\)\s*=\s*1\s*\)/,
		'wajib ada CHECK tepat satu sumber santri'
	);
});

const setoranPage = readFileSync(
	join(process.cwd(), 'src/routes/(app)/tpq/akademik/setoran/+page.server.ts'),
	'utf-8'
);

test('halaman setoran membaca daftar santri dari tabel santri', () => {
	assert.match(setoranPage, /FROM santri\b/, 'daftar santri wajib mengambil tabel santri');
	assert.match(setoranPage, /buildSantriOptions/, 'daftar wajib digabung lewat helper teruji');
});

test('penyimpanan setoran memakai resolusi sumber santri', () => {
	assert.match(setoranPage, /resolveSetoranSantri/, 'kolom tujuan wajib ditentukan helper');
});
