import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
	assertActiveOrg,
	resolveActiveOrg,
	type MembershipLike
} from '../src/lib/server/active-org';
import { assertOrgMember } from '../src/lib/server/auth/rbac';
import { FREE_LEMBAGA_LIMIT, evaluateLembagaCapacity } from '../src/lib/server/addons';

/**
 * Kasus nyata yang harus didukung: satu takmir di kampungnya mengurus TPQ,
 * musholla, dan masjid sekaligus. Ia mendaftarkan ketiganya dan menjadi admin
 * berwenang di semuanya.
 *
 * Sebelum perbaikan, `users.org_id` hanya memuat SATU lembaga sehingga lembaga
 * kedua dan ketiga tidak pernah bisa dibuka.
 */
const takmir: MembershipLike[] = [
	{ org_id: 'org-tpq', org_type: 'tpq', role: 'admin', is_active: true, org_name: 'TPQ Pendem' },
	{
		org_id: 'org-musholla',
		org_type: 'musholla',
		role: 'admin',
		is_active: true,
		org_name: 'Musholla Al-Ikhlas'
	},
	{
		org_id: 'org-masjid',
		org_type: 'masjid',
		role: 'admin',
		is_active: true,
		org_name: 'Masjid Baiturrahman'
	}
];

test('satu orang bisa memegang banyak lembaga sekaligus', () => {
	for (const target of ['org-tpq', 'org-musholla', 'org-masjid']) {
		const active = resolveActiveOrg({ memberships: takmir, requestedOrgId: target });
		assert.equal(active?.org_id, target, `lembaga ${target} wajib bisa dibuka`);
		assert.equal(active?.role, 'admin');
	}
});

test('lembaga aktif mengikuti pilihan pengguna, bukan selalu yang pertama', () => {
	const active = resolveActiveOrg({ memberships: takmir, requestedOrgId: 'org-masjid' });
	assert.equal(active?.org_id, 'org-masjid');
	assert.notEqual(active?.org_id, takmir[0].org_id);
});

test('KEAMANAN: tidak bisa membuka lembaga milik orang lain', () => {
	// Permintaan ke lembaga yang tidak ada di daftar keanggotaan tidak boleh
	// dikabulkan, dan tidak boleh diam-diam jatuh ke lembaga lain milik dia.
	const active = resolveActiveOrg({
		memberships: takmir,
		requestedOrgId: 'org-tpq-milik-orang-lain'
	});
	assert.equal(active, null, 'permintaan lembaga asing wajib ditolak, bukan dialihkan');
});

test('KEAMANAN: keanggotaan nonaktif tidak memberi akses', () => {
	const dicabut: MembershipLike[] = [
		{ org_id: 'org-lama', org_type: 'tpq', role: 'admin', is_active: false }
	];
	assert.equal(resolveActiveOrg({ memberships: dicabut, requestedOrgId: 'org-lama' }), null);
	assert.equal(resolveActiveOrg({ memberships: dicabut }), null);
});

test('tanpa pilihan, memakai lembaga bawaan akun (kompatibilitas akun lama)', () => {
	const active = resolveActiveOrg({ memberships: takmir, fallbackOrgId: 'org-musholla' });
	assert.equal(active?.org_id, 'org-musholla');
});

test('lembaga bawaan yang sudah tidak sah tidak dipakai', () => {
	// users.org_id lama menunjuk lembaga yang keanggotaannya sudah dicabut:
	// jangan dipakai, jatuh ke keanggotaan sah pertama.
	const active = resolveActiveOrg({ memberships: takmir, fallbackOrgId: 'org-sudah-keluar' });
	assert.equal(active?.org_id, 'org-tpq');
});

test('akun tanpa lembaga sama sekali menghasilkan null', () => {
	assert.equal(resolveActiveOrg({ memberships: [] }), null);
});

test('assertActiveOrg menolak akun tanpa lembaga dengan 403', () => {
	assert.throws(
		() => assertActiveOrg({ memberships: [] }),
		(err: any) => err?.status === 403,
		'akun tanpa lembaga wajib 403, bukan 500'
	);
});

test('assertActiveOrg mengembalikan lembaga yang dipilih', () => {
	const active = assertActiveOrg({ memberships: takmir, requestedOrgId: 'org-masjid' });
	assert.equal(active.org_id, 'org-masjid');
	assert.equal(active.org_type, 'masjid');
});

test('dua lembaga pertama gratis, ketiga wajib addon', () => {
	assert.equal(FREE_LEMBAGA_LIMIT, 2, 'jatah gratis adalah 2 lembaga');

	assert.equal(evaluateLembagaCapacity({ used: 0, unlimited: false }).canAdd, true);
	assert.equal(evaluateLembagaCapacity({ used: 1, unlimited: false }).canAdd, true);
	assert.equal(
		evaluateLembagaCapacity({ used: 2, unlimited: false }).canAdd,
		false,
		'lembaga ketiga wajib addon berbayar'
	);
});

test('addon aktif membuka lembaga tanpa batas', () => {
	const kapasitas = evaluateLembagaCapacity({ used: 9, unlimited: true });
	assert.equal(kapasitas.canAdd, true);
	assert.equal(kapasitas.limit, null);
	assert.equal(kapasitas.remaining, null);
});

test('sisa jatah dilaporkan benar dan tidak pernah negatif', () => {
	assert.equal(evaluateLembagaCapacity({ used: 0, unlimited: false }).remaining, 2);
	assert.equal(evaluateLembagaCapacity({ used: 1, unlimited: false }).remaining, 1);
	assert.equal(evaluateLembagaCapacity({ used: 5, unlimited: false }).remaining, 0);
});

/**
 * Kontrak penyambungan: lembaga aktif ditentukan sekali di hooks, lalu
 * `locals.user.orgId` diisi hasilnya. Dengan begitu ke-22 pemanggilan
 * `assertOrgMember(user)` yang tersebar di 9 rute ikut sadar multi-lembaga
 * tanpa perlu diubah satu per satu.
 */
const hooks = readFileSync(join(process.cwd(), 'src/hooks.server.ts'), 'utf-8');

test('hooks memuat keanggotaan dari organization_memberships', () => {
	assert.match(
		hooks,
		/loadMemberships/,
		'hooks wajib membaca keanggotaan, bukan hanya users.org_id'
	);
});

test('hooks menentukan lembaga aktif lewat resolveActiveOrg', () => {
	assert.match(hooks, /resolveActiveOrg/, 'lembaga aktif wajib divalidasi terhadap keanggotaan');
});

test('hooks membaca pilihan lembaga dari cookie', () => {
	assert.match(hooks, /ACTIVE_ORG_COOKIE/, 'pilihan lembaga wajib dibaca dari cookie');
});

test('KEAMANAN: orgType mengikuti lembaga aktif hasil validasi keanggotaan', () => {
	// orgType wajib diambil dari lembaga aktif yang sudah divalidasi terhadap
	// keanggotaan. Bila diambil dari users.org_id mentah, izin fitur bisa
	// dinilai memakai jenis lembaga yang salah saat pengguna berpindah lembaga.
	assert.match(
		hooks,
		/event\.locals\.orgType = activeOrg\.org_type/,
		'orgType wajib bersumber dari lembaga aktif'
	);

	// Jalur users.org_id hanya boleh dipakai sebagai cadangan ketika pengguna
	// belum punya baris keanggotaan sama sekali (akun lama, sebelum backfill).
	assert.match(
		hooks,
		/} else if \(resolvedUser\.orgId\) \{/,
		'jalur users.org_id hanya boleh jadi cadangan di cabang else'
	);
});

test('assertOrgMember tetap menolak akun tanpa lembaga', () => {
	assert.throws(
		() => assertOrgMember({ orgId: null }),
		(err: any) => err?.status === 403
	);
	assert.equal(assertOrgMember({ orgId: 'org-tpq' }), 'org-tpq');
});

/**
 * Pemilihan lembaga harus tersimpan di server. Sebelum perbaikan,
 * LembagaSwitcher hanya memanggil `lembagaAktif.set()` — mengubah tampilan di
 * browser saja — sehingga data yang dikirim server tetap lembaga lama.
 */
const switcherEndpoint = readFileSync(
	join(process.cwd(), 'src/routes/api/lembaga-aktif/+server.ts'),
	'utf-8'
);

test('endpoint pilih lembaga menyimpan pilihan ke cookie', () => {
	assert.match(switcherEndpoint, /ACTIVE_ORG_COOKIE/, 'pilihan wajib ditulis ke cookie');
	assert.match(switcherEndpoint, /cookies\.set/, 'endpoint wajib menyetel cookie');
});

test('KEAMANAN: endpoint memvalidasi lembaga terhadap keanggotaan', () => {
	assert.match(
		switcherEndpoint,
		/loadMemberships/,
		'endpoint wajib memeriksa keanggotaan sebelum menerima pilihan'
	);
	assert.match(switcherEndpoint, /403/, 'lembaga yang bukan miliknya wajib ditolak 403');
});

test('KEAMANAN: cookie lembaga aktif tidak bisa dibaca skrip browser', () => {
	assert.match(switcherEndpoint, /httpOnly:\s*true/, 'cookie wajib httpOnly');
	assert.match(switcherEndpoint, /sameSite:/, 'cookie wajib menyetel sameSite');
});

test('endpoint menolak permintaan tanpa sesi login', () => {
	assert.match(switcherEndpoint, /401/, 'tanpa sesi wajib 401');
});

/**
 * Daftar lembaga di switcher harus berasal dari keanggotaan, bukan hanya
 * kolom `akun_admin_id`. Seorang admin bisa diberi wewenang di lembaga yang
 * pendaftar aslinya orang lain.
 */
const appLayout = readFileSync(join(process.cwd(), 'src/routes/(app)/+layout.server.ts'), 'utf-8');

test('daftar lembaga switcher bersumber dari keanggotaan', () => {
	assert.match(
		appLayout,
		/organization_memberships|loadMemberships/,
		'daftar lembaga wajib memakai keanggotaan, bukan hanya akun_admin_id'
	);
});

/**
 * `/lembaga/tambah` adalah jalur menambah lembaga kedua dan seterusnya.
 * Sebelum perbaikan ia hanya INSERT ke tabel organizations lalu redirect,
 * tanpa menghubungkan pembuatnya — sehingga 7 lembaga di produksi berdiri
 * tanpa satu pun anggota dan pembuatnya kena 403 di dashboard.
 */
const tambahLembaga = readFileSync(
	join(process.cwd(), 'src/routes/(app)/lembaga/tambah/+page.server.ts'),
	'utf-8'
);

test('pembuat lembaga langsung tercatat sebagai admin lembaga itu', () => {
	assert.match(
		tambahLembaga,
		/grantMembership/,
		'pembuat wajib dicatat di organization_memberships'
	);
	assert.match(tambahLembaga, /'admin'/, 'peran yang diberikan adalah admin');
});

test('lembaga pendidikan baru mendapat target hafalan default', () => {
	// Tanpa seed, dashboard bisa dibuka tetapi isinya kosong sehingga pengurus
	// mengira fiturnya tidak berfungsi.
	assert.match(tambahLembaga, /seedHafalanDefault/, 'lembaga pendidikan wajib diberi seed');
	assert.match(
		tambahLembaga,
		/isEducationalOrgType/,
		'seed hanya untuk lembaga pendidikan (tpq/pondok/rumah-tahfidz)'
	);
});

test('akun yang belum punya lembaga ikut disetel org_id-nya', () => {
	assert.match(
		tambahLembaga,
		/UPDATE users SET/,
		'akun tanpa lembaga wajib disetel agar kompatibel dengan kode lama'
	);
});

/**
 * Jalur pendaftaran per jenis lembaga sudah mengisi users.org_id, tetapi belum
 * mencatat baris keanggotaan. Tanpa itu lembaga tidak muncul di switcher dan
 * lembaga kedua tidak pernah bisa dibuka.
 */
for (const jenis of ['tpq', 'pondok', 'masjid', 'musholla', 'rumah-tahfidz']) {
	test(`/${jenis}/daftar mencatat keanggotaan admin`, () => {
		const berkas = readFileSync(
			join(process.cwd(), `src/routes/${jenis}/daftar/+page.server.ts`),
			'utf-8'
		);
		assert.match(berkas, /grantMembership/, `/${jenis}/daftar wajib mencatat keanggotaan`);
	});
}
