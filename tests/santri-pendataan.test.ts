import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
	normalizeSantriInput,
	type SantriInput
} from '../src/lib/server/domains/tpq/santri-data';

/**
 * Pendataan santri TPQ.
 *
 * Santri usia 5-12 tahun tidak punya HP dan tidak perlu akun login, sehingga
 * memaksa membuat baris `users` berarti mengarang email dan password palsu.
 * Tabel `santri` memang dirancang untuk ini (`user_id` boleh NULL) namun
 * sebelumnya yatim: tidak ada satu pun kode yang menulis maupun membacanya.
 *
 * Data yang wajib bisa dicatat pengurus: nama, NIS, kelas, nama wali, HP wali.
 * Kolom itu semua tidak ada di tabel `users`.
 */

const dasar: SantriInput = { nama: 'Ahmad Fauzi' };

test('nama wajib diisi', () => {
	assert.equal(normalizeSantriInput({ nama: '   ' }).ok, false);
	assert.equal(normalizeSantriInput({ nama: '' }).ok, false);
});

test('santri cukup bernama, tanpa email maupun password', () => {
	const hasil = normalizeSantriInput(dasar);
	assert.equal(hasil.ok, true);
	assert.equal(hasil.ok && hasil.value.nama, 'Ahmad Fauzi');
	// Tidak boleh menuntut akun login.
	assert.equal(hasil.ok && 'email' in hasil.value, false);
	assert.equal(hasil.ok && 'password' in hasil.value, false);
});

test('spasi berlebih pada nama dirapikan', () => {
	const hasil = normalizeSantriInput({ nama: '  Siti   Aminah  ' });
	assert.equal(hasil.ok && hasil.value.nama, 'Siti Aminah');
});

test('data wali dan NIS tersimpan apa adanya', () => {
	const hasil = normalizeSantriInput({
		nama: 'Ahmad',
		nis: '2026-001',
		kelas: 'Iqro 3',
		waliNama: 'Bapak Slamet',
		waliHp: '081234567890'
	});
	assert.equal(hasil.ok, true);
	if (!hasil.ok) return;
	assert.equal(hasil.value.nis, '2026-001');
	assert.equal(hasil.value.kelas, 'Iqro 3');
	assert.equal(hasil.value.waliNama, 'Bapak Slamet');
	assert.equal(hasil.value.waliHp, '081234567890');
});

test('kolom opsional yang kosong menjadi null, bukan string kosong', () => {
	const hasil = normalizeSantriInput({ nama: 'Ahmad', nis: '  ', kelas: '' });
	assert.equal(hasil.ok, true);
	if (!hasil.ok) return;
	assert.equal(hasil.value.nis, null);
	assert.equal(hasil.value.kelas, null);
	assert.equal(hasil.value.waliNama, null);
});

test('nomor HP wali dirapikan dari spasi dan tanda hubung', () => {
	const hasil = normalizeSantriInput({ nama: 'Ahmad', waliHp: '0812-3456 7890' });
	assert.equal(hasil.ok && hasil.value.waliHp, '081234567890');
});

test('nama terlalu panjang ditolak', () => {
	assert.equal(normalizeSantriInput({ nama: 'A'.repeat(121) }).ok, false);
});

test('santri baru berstatus aktif', () => {
	const hasil = normalizeSantriInput(dasar);
	assert.equal(hasil.ok && hasil.value.isAktif, 1);
});

/**
 * Endpoint pendataan terpisah dari /api/santri, karena endpoint lama membuat
 * akun login (dipakai juga untuk ustadz dan admin) dan tidak boleh dirombak.
 */
const endpoint = readFileSync(
	join(process.cwd(), 'src/routes/api/tpq/santri/+server.ts'),
	'utf-8'
);

test('endpoint menulis ke tabel santri, bukan users', () => {
	assert.match(endpoint, /INSERT INTO santri\b/, 'pendataan wajib masuk tabel santri');
	assert.equal(
		/INSERT INTO users/.test(endpoint),
		false,
		'pendataan santri tidak boleh membuat akun login'
	);
});

test('KEAMANAN: santri terikat ke lembaga aktif pengurus', () => {
	assert.match(
		endpoint,
		/assertOrgMember|activeOrg/,
		'lembaga wajib diambil dari sesi, bukan dari isian pengguna'
	);
});

test('KEAMANAN: hanya yang berwenang boleh mendata', () => {
	assert.match(endpoint, /student\.write/, 'wajib memeriksa izin tulis santri');
	assert.match(endpoint, /401/, 'tanpa sesi wajib 401');
});

test('KEAMANAN: daftar dan hapus dibatasi lembaga aktif', () => {
	// Tanpa penyaringan lembaga, pengurus TPQ A bisa melihat atau menghapus
	// santri milik TPQ B.
	const cocok = endpoint.match(/lembaga_id = \?/g) ?? [];
	assert.ok(cocok.length >= 2, `lembaga_id wajib menyaring daftar & hapus (ada ${cocok.length})`);
});

test('batas kuota santri tetap berlaku', () => {
	assert.match(endpoint, /assertCanAddSantri/, 'kuota santri wajib diperiksa');
});
