import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALLOWED_ROLES_BY_TYPE, getPermissions } from '../src/lib/rbac/permissions';
import {
	APP_NAVIGATION_BY_TYPE,
	GLOBAL_APP_NAVIGATION,
	type AppNavigationItem
} from '../src/lib/config/app-navigation';
import type { Permission } from '../src/lib/types/rbac';

/**
 * Izin yatim: terdaftar sebagai tipe Permission tetapi tidak dimiliki peran
 * mana pun. Setiap pemeriksaan `can(izin)` terhadapnya selalu bernilai false,
 * sehingga rute yang memakainya menolak semua orang tanpa kecuali.
 *
 * `student.read` adalah kasus nyata: dipakai `/api/santri`, `/api/tpq/santri`,
 * dan menu "Data Santri", padahal peran admin memegang `student.read.all`.
 */

const izinDimiliki = new Set<string>();
for (const peranPerJenis of Object.values(ALLOWED_ROLES_BY_TYPE)) {
	for (const peran of peranPerJenis) {
		for (const izin of getPermissions(peran)) {
			izinDimiliki.add(izin);
		}
	}
}

const semuaMenu: AppNavigationItem[] = [
	...GLOBAL_APP_NAVIGATION,
	...Object.values(APP_NAVIGATION_BY_TYPE).flat()
];

/** Mengumpulkan izin yang dirujuk menu navigasi. */
const izinDipakaiNavigasi = () => {
	const dipakai: { label: string; izin: string }[] = [];
	for (const item of semuaMenu) {
		if (item.permission) dipakai.push({ label: item.label, izin: item.permission });
		for (const izin of item.anyPermission ?? []) {
			dipakai.push({ label: item.label, izin });
		}
	}
	return dipakai;
};

test('setiap izin yang dipakai menu dimiliki minimal satu peran', () => {
	const yatim = izinDipakaiNavigasi().filter((d) => !izinDimiliki.has(d.izin));
	assert.deepEqual(
		yatim,
		[],
		`menu memakai izin yang tidak dimiliki peran mana pun: ${yatim
			.map((d) => `${d.label} -> ${d.izin}`)
			.join(', ')}`
	);
});

test('student.read.all dimiliki peran admin', () => {
	// Pembanding: varian inilah yang benar-benar diberikan ke peran.
	assert.equal(izinDimiliki.has('student.read.all'), true);
});

test('member.read dimiliki peran pengurus non-TPQ', () => {
	assert.equal(
		izinDimiliki.has('member.read') || izinDimiliki.has('member.read.all'),
		true,
		'pengurus masjid/musholla perlu izin baca anggota'
	);
});

/**
 * Menu "Data Santri" adalah pintu masuk pendataan. Bila izinnya yatim, menu
 * hanya lolos lewat cadangan allowedRoles — rapuh, karena peran baru yang
 * tidak terdaftar akan kehilangan akses tanpa pesan yang jelas.
 */
test('menu Data Santri memakai izin yang benar-benar ada', () => {
	const item = semuaMenu.find((n) => n.href === '/dashboard/santri-tpq');
	assert.ok(item, 'menu Data Santri wajib ada');
	const izin = [item.permission, ...(item.anyPermission ?? [])].filter(Boolean) as Permission[];
	assert.ok(izin.length > 0, 'menu wajib menyebut izin');
	for (const p of izin) {
		assert.equal(izinDimiliki.has(p), true, `izin ${p} tidak dimiliki peran mana pun`);
	}
});
