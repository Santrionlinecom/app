import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { APP_NAVIGATION_BY_TYPE } from '../src/lib/config/app-navigation';
import { INSTITUTIONS } from '../src/lib/config/institutions';
import { canAccessFeature } from '../src/lib/server/auth/rbac';
import type { OrgType } from '../src/lib/types/rbac';

const root = process.cwd();

/**
 * Ruang Belajar (/belajar) berisi kurikulum pembinaan: aqidah, adab, fikih,
 * sirah, skill, dan Bahasa Arab. Isinya untuk SEMUA member, bukan hanya santri
 * TPQ — jamaah masjid dan musholla pun perlu jalur aqidah dan adab.
 *
 * Sebelumnya menu ini hanya terdaftar di navigasi tpq, sehingga pengguna yang
 * lembaga aktifnya musholla tidak pernah melihatnya di sidebar.
 */
test('menu Ruang Belajar ada di sidebar semua tipe lembaga', () => {
	for (const institution of INSTITUTIONS) {
		const items = APP_NAVIGATION_BY_TYPE[institution.key] ?? [];
		const belajar = items.find((item) => item.href === '/belajar');
		assert.ok(
			belajar,
			`tipe lembaga "${institution.key}" tidak punya menu /belajar di sidebar`
		);
		assert.ok(
			belajar?.allowedTypes?.includes(institution.key),
			`menu /belajar pada "${institution.key}" tidak mengizinkan tipe itu sendiri`
		);
	}
});

test('menu Ruang Belajar tidak dibatasi peran pengurus', () => {
	for (const institution of INSTITUTIONS) {
		const belajar = (APP_NAVIGATION_BY_TYPE[institution.key] ?? []).find(
			(item) => item.href === '/belajar'
		);
		assert.equal(
			belajar?.allowedRoles,
			undefined,
			`menu /belajar pada "${institution.key}" tidak boleh dibatasi allowedRoles; santri dan jamaah harus bisa melihatnya`
		);
		assert.equal(
			belajar?.permission,
			undefined,
			`menu /belajar pada "${institution.key}" tidak boleh menuntut permission pengurus`
		);
	}
});

/**
 * Fitur belajar dulu memakai kunci 'hafalan', yang hanya berlaku untuk lembaga
 * pendidikan (tpq, pondok, rumah tahfidz). Akibatnya jamaah masjid dan musholla
 * mendapat 403 meski menunya muncul. Kurikulum pembinaan bukan setoran hafalan,
 * jadi ia punya kunci fitur sendiri.
 */
test('fitur belajar terbuka untuk lembaga pendidikan maupun kemasjidan', () => {
	const kasus: { tipe: OrgType; peran: string }[] = [
		{ tipe: 'tpq', peran: 'santri' },
		{ tipe: 'pondok', peran: 'santri' },
		{ tipe: 'rumah-tahfidz', peran: 'santri' },
		{ tipe: 'masjid', peran: 'jamaah' },
		{ tipe: 'musholla', peran: 'jamaah' }
	];

	for (const { tipe, peran } of kasus) {
		assert.equal(
			canAccessFeature(tipe, peran, 'belajar'),
			true,
			`fitur belajar harus terbuka untuk ${peran} di ${tipe}`
		);
	}
});

test('fitur setoran hafalan tetap tertutup untuk masjid dan musholla', () => {
	// Penjagaan agar pelonggaran fitur belajar tidak ikut membuka setoran.
	for (const tipe of ['masjid', 'musholla'] as OrgType[]) {
		assert.equal(
			canAccessFeature(tipe, 'jamaah', 'hafalan'),
			false,
			`setoran hafalan tidak boleh terbuka di ${tipe}`
		);
	}
});

/**
 * Jalur belajar harus selaras dengan 9 kitab yang sudah diindeks RAG:
 * 5 kitab fondasi + 4 jilid Bahasa Arab.
 */
test('setiap kategori dari 9 kitab punya jalur belajar', () => {
	const migrasi = readFileSync(
		join(root, 'migrations/0070_learn_paths_kitab.sql'),
		'utf8'
	);

	// Kategori kitab -> kunci jalur belajar yang mewakilinya.
	const wajibAda = [
		'quran_tahsin', // ilmu-tajwid-lengkap
		'aqidah_aswaja', // terjemah-aqidatul-awam
		'fikih_praktis', // safinatun-najah-makna-perkata
		'hadits', // terjemah-syarah-arbain-nawawiyah
		'adab', // terjemah-bidayatul-hidayah
		'arabic_nahwu' // bahasa-arab-dasar 1-4
	];

	for (const kunci of wajibAda) {
		assert.match(
			migrasi,
			new RegExp(`'${kunci}'`),
			`jalur "${kunci}" belum ada di migrasi jalur belajar`
		);
	}
});

test('setiap jalur menunjuk slug kitab yang benar-benar ada', () => {
	const migrasi = readFileSync(
		join(root, 'migrations/0070_learn_paths_kitab.sql'),
		'utf8'
	);
	const fondasi = readFileSync(join(root, 'src/lib/data/kitab-fondasi.ts'), 'utf8');
	const curated = readFileSync(join(root, 'src/lib/data/kitab-curated.ts'), 'utf8');
	const sumberKitab = `${fondasi}\n${curated}`;

	const slugDirujuk = [...migrasi.matchAll(/kitab_slug[^']*'([a-z0-9-]+)'/g)].map((m) => m[1]);
	assert.ok(slugDirujuk.length >= 6, 'migrasi harus menautkan jalur ke slug kitab');

	for (const slug of slugDirujuk) {
		assert.match(
			sumberKitab,
			new RegExp(`slug: '${slug}'`),
			`slug kitab "${slug}" dirujuk migrasi tetapi tidak ada di data kitab`
		);
	}
});

test('migrasi jalur belajar bersifat aditif dan idempoten', () => {
	const migrasi = readFileSync(
		join(root, 'migrations/0070_learn_paths_kitab.sql'),
		'utf8'
	);
	assert.doesNotMatch(migrasi, /DROP\s+TABLE/i, 'migrasi tidak boleh menghapus tabel');
	assert.doesNotMatch(migrasi, /DELETE\s+FROM/i, 'migrasi tidak boleh menghapus baris');
	assert.match(migrasi, /INSERT OR IGNORE/i, 'penyisipan harus idempoten');
});
