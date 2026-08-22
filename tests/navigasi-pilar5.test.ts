// Menu fitur Pilar 5 harus benar-benar sampai ke peran yang berhak.
//
// Latar: /wali, /halaqah, /rapor, kelola-halaqah, kotak-setoran,
// terbitkan-rapor, dan undangan-wali sempat LIVE tanpa satu pun entri menu
// (22 Agu 2026) — empat di antaranya nol tautan. Fiturnya jalan, tapi tidak
// bisa ditemukan pengguna. Tes ini menjaga agar itu tidak terulang.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	GLOBAL_APP_NAVIGATION,
	getAppNavigation,
	getMobilePrimaryNav,
	groupAppNavigation
} from '../src/lib/config/app-navigation';
import { canAccessPermission } from '../src/lib/server/auth/rbac';
import type { Permission } from '../src/lib/types/rbac';

const navUntuk = (role: string | null, orgType: string | null = 'tpq') =>
	getAppNavigation(orgType, role, (izin: Permission) =>
		canAccessPermission(role ?? '', izin)
	);

const punya = (role: string | null, href: string, orgType: string | null = 'tpq') =>
	navUntuk(role, orgType).some((item) => item.href === href);

test('rute personal muncul untuk pengguna tanpa lembaga', () => {
	// Wali dan santri mandiri tidak punya orgId; menunya tetap harus ada.
	for (const href of ['/wali', '/halaqah', '/rapor']) {
		assert.equal(punya(null, href, null), true, `${href} hilang untuk pengguna tanpa lembaga`);
		assert.equal(punya('santri', href, null), true, `${href} hilang untuk santri mandiri`);
	}
});

test('menu pengurus mengikuti izin gerbang halamannya', () => {
	// hafalan.input -> kelola halaqah + kotak setoran
	assert.equal(punya('ustadz', '/dashboard/kelola-halaqah'), true);
	assert.equal(punya('ustadz', '/dashboard/kotak-setoran'), true);

	// raport.write -> terbitkan rapor
	assert.equal(punya('admin', '/dashboard/terbitkan-rapor'), true);
});

test('peran warisan tetap melihat menunya', () => {
	// BASE_PERMISSIONS hanya mengenal peran kanonik, sedangkan normalizeRole()
	// meloloskan peran warisan apa adanya — sehingga
	// canAccessPermission('ustadz','hafalan.input') bernilai false.
	// Tanpa allowedRoles, menu ini hilang dari ustadz/ustadzah/kepala_tpq.
	// Ini pernah terjadi dan ditangkap tes ini.
	assert.equal(
		canAccessPermission('ustadz', 'hafalan.input' as Permission),
		false,
		'asumsi berubah: ustadz kini punya izin kanonik — sederhanakan allowedRoles'
	);

	for (const peran of ['ustadz', 'ustadzah', 'musyrif', 'kepala_tpq']) {
		assert.equal(
			punya(peran, '/dashboard/kotak-setoran'),
			true,
			`${peran} kehilangan menu Kotak Setoran`
		);
	}
});

test('santri biasa tidak melihat menu pengurus', () => {
	// Kalau ini bocor, santri melihat menu yang ujungnya 403.
	for (const href of [
		'/dashboard/kelola-halaqah',
		'/dashboard/terbitkan-rapor',
		'/lembaga/undangan-wali'
	]) {
		assert.equal(punya('santri', href), false, `${href} bocor ke santri`);
	}
});

test('setiap entri baru punya label, ikon, dan grup', () => {
	const baru = [
		'/wali',
		'/halaqah',
		'/rapor',
		'/dashboard/kelola-halaqah',
		'/dashboard/kotak-setoran',
		'/dashboard/terbitkan-rapor',
		'/lembaga/undangan-wali'
	];
	for (const href of baru) {
		const item = GLOBAL_APP_NAVIGATION.find((n) => n.href === href);
		assert.ok(item, `${href} belum terdaftar di GLOBAL_APP_NAVIGATION`);
		assert.ok(item.label?.trim(), `${href} tanpa label`);
		assert.ok(item.icon?.trim(), `${href} tanpa ikon`);
		assert.ok(item.group?.trim(), `${href} tanpa grup sidebar`);
	}
});

test('entri baru benar-benar masuk grup sidebar, bukan menggantung', () => {
	const grup = groupAppNavigation(navUntuk('admin'));
	const semuaHref = grup.flatMap((g) => g.items.map((i) => i.href));
	for (const href of ['/wali', '/halaqah', '/rapor', '/dashboard/terbitkan-rapor']) {
		assert.ok(semuaHref.includes(href), `${href} tidak muncul di grup sidebar mana pun`);
	}
});

test('tidak ada href ganda di navigasi global', () => {
	const hitung = new Map<string, number>();
	for (const item of GLOBAL_APP_NAVIGATION) {
		hitung.set(item.href, (hitung.get(item.href) ?? 0) + 1);
	}
	const ganda = [...hitung.entries()].filter(([, n]) => n > 1).map(([href]) => href);
	assert.deepEqual(ganda, [], `href ganda: ${ganda.join(', ')}`);
});

// --- Tampilan HP vs desktop ------------------------------------------------
//
// Sidebar desktop menampung puluhan menu; bottom bar HP hanya 5 slot. Karena
// itu keduanya sengaja dibedakan, dan pembedaan itu dikunci di sini.

const bottomBar = (role: string | null, orgType: string | null = 'tpq') =>
	getMobilePrimaryNav(navUntuk(role, orgType), 5).map((i) => i.href);

test('wali di HP langsung menemukan Pantau Anak', () => {
	// Wali adalah pengguna paling HP-sentris dan biasanya TIDAK punya lembaga.
	// Sebelum perbaikan, bottom bar-nya terisi Lembaga/Baca Buku/Kursus/
	// Digital Store — tidak satu pun yang ia cari.
	const bar = bottomBar(null, null);
	assert.ok(bar.includes('/wali'), `Pantau Anak hilang dari bottom bar wali: ${bar.join(', ')}`);
	assert.ok(bar.length <= 5, 'bottom bar tidak boleh lebih dari 5 slot');
});

test('bottom bar pengguna lembaga tidak terdesak menu baru', () => {
	// Menambah mobilePrimary bisa MENENDANG menu lama karena slotnya cuma 5.
	// Santri dan admin TPQ wajib tetap memegang Dashboard + Akun.
	for (const peran of ['santri', 'admin']) {
		const bar = bottomBar(peran, 'tpq');
		assert.ok(bar.includes('/dashboard'), `${peran} kehilangan Dashboard di HP`);
		assert.ok(bar.includes('/akun'), `${peran} kehilangan Akun di HP`);
		assert.ok(bar.length <= 5, `${peran}: bottom bar lebih dari 5 slot`);
	}
});

test('desktop menampung jauh lebih banyak daripada HP', () => {
	// Menu yang tidak muat di HP tidak boleh hilang — ia harus tetap ada di
	// sidebar desktop (dan lewat Ctrl+K yang memakai daftar yang sama).
	const semua = navUntuk('admin', 'tpq');
	const bar = bottomBar('admin', 'tpq');
	assert.ok(semua.length > bar.length, 'sidebar desktop harus lebih kaya dari bottom bar');

	const grup = groupAppNavigation(semua);
	const dariSidebar = new Set(grup.flatMap((g) => g.items.map((i) => i.href)));
	for (const href of ['/dashboard/kelola-halaqah', '/dashboard/terbitkan-rapor']) {
		assert.ok(dariSidebar.has(href), `${href} tidak terjangkau dari sidebar desktop`);
	}
});
