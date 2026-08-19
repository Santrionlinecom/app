import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
	pilihNotifikasiBaru,
	ringkasUntukPush
} from '../src/lib/server/notifications/super-admin-push';
import type { SuperAdminNotification } from '../src/lib/server/super-admin-notifications';

const root = process.cwd();
const baca = (p: string) => readFileSync(join(root, p), 'utf8');

const buat = (
	id: string,
	kind: string,
	createdAt: number,
	extra: Partial<SuperAdminNotification> = {}
): SuperAdminNotification => ({
	id,
	kind,
	severity: 'urgent',
	title: 'Judul',
	body: 'Isi',
	href: '/admin/super/overview',
	createdAt,
	...extra
});

test('hanya notifikasi yang belum pernah dikirim yang dipilih', () => {
	const semua = [buat('addon-pending:a', 'addon', 100), buat('register:b', 'register', 200)];
	const sudah = new Set(['addon-pending:a']);
	const baru = pilihNotifikasiBaru(semua, sudah);
	assert.deepEqual(
		baru.map((n) => n.id),
		['register:b']
	);
});

test('tidak ada notifikasi baru menghasilkan daftar kosong, bukan kirim ulang', () => {
	const semua = [buat('addon-pending:a', 'addon', 100)];
	const baru = pilihNotifikasiBaru(semua, new Set(['addon-pending:a']));
	assert.equal(baru.length, 0);
});

test('hanya jenis yang diminta Mas Yogik yang dikirim sebagai push', () => {
	const semua = [
		buat('register:b', 'register', 100),
		buat('addon-pending:c', 'addon', 100),
		buat('org-pending:d', 'institution', 100),
		buat('chat:e', 'message', 100)
	];
	const baru = pilihNotifikasiBaru(semua, new Set());
	// Chat tidak termasuk: bukan aktivitas pendaftaran/addon/lembaga.
	assert.deepEqual(
		baru.map((n) => n.kind).sort(),
		['addon', 'institution', 'register']
	);
});

test('satu push merangkum banyak kejadian agar HP tidak dibanjiri', () => {
	const ringkas = ringkasUntukPush([
		buat('register:a', 'register', 100),
		buat('addon-pending:b', 'addon', 100),
		buat('org-pending:c', 'institution', 100)
	]);
	assert.ok(ringkas, 'harus menghasilkan satu pesan push');
	assert.match(ringkas!.title, /3/, 'judul menyebut jumlah kejadian');
	assert.equal(ringkas!.url, '/admin/super/overview#activity-feed');
});

test('satu kejadian memakai judul aslinya, bukan ringkasan angka', () => {
	const ringkas = ringkasUntukPush([
		buat('addon-pending:b', 'addon', 100, { title: 'Request addon menunggu approval' })
	]);
	assert.equal(ringkas?.title, 'Request addon menunggu approval');
});

test('daftar kosong tidak menghasilkan push', () => {
	assert.equal(ringkasUntukPush([]), null);
});

test('endpoint lonceng dijaga superadmin', () => {
	const server = baca('src/routes/api/admin/notifications/+server.ts');
	assert.match(server, /requireSuperAdmin/, 'endpoint wajib memakai requireSuperAdmin');
});

test('komponen lonceng menampilkan jumlah dan hanya untuk superadmin', () => {
	const layout = baca('src/routes/+layout.svelte');
	assert.match(layout, /SuperAdminBell/, 'lonceng harus dipasang di layout');
	assert.match(layout, /\{#if isSuperAdmin\}[\s\S]{0,400}SuperAdminBell/, 'lonceng hanya untuk superadmin');

	const bell = baca('src/lib/components/SuperAdminBell.svelte');
	assert.match(bell, /aria-label/, 'tombol lonceng butuh label aksesibilitas');
	assert.match(bell, /api\/admin\/notifications/, 'lonceng membaca endpoint notifikasi');
});

// Regresi: chrome root disembunyikan begitu pengguna login
// (`hidePageChrome = ... || Boolean(data?.user)`), sedangkan Super Admin selalu
// dalam keadaan login. Akibatnya lonceng di root layout tidak pernah terlihat.
// Header nyata yang dipakai Super Admin adalah shell `(app)`, jadi lonceng
// wajib ada di sana juga.
test('lonceng ikut dirender di header shell (app) tempat Super Admin bekerja', () => {
	const shell = baca('src/routes/(app)/+layout.svelte');

	assert.match(shell, /import SuperAdminBell from/, 'shell app harus mengimpor lonceng');
	assert.match(
		shell,
		/\{#if isSuperAdmin\}[\s\S]{0,400}<SuperAdminBell \/>/,
		'lonceng di shell app wajib berada di dalam guard isSuperAdmin'
	);
});

test('chrome root memang disembunyikan saat login sehingga shell app wajib punya lonceng', () => {
	const layout = baca('src/routes/+layout.svelte');

	// Mengunci alasan bug: selama baris ini ada, lonceng root tak terlihat
	// bagi pengguna yang sudah login.
	assert.match(
		layout,
		/hidePageChrome\s*=[^\n]*Boolean\(data\?\.user\)/,
		'root layout menyembunyikan chrome saat login — lonceng tidak boleh hanya mengandalkan root'
	);
});
