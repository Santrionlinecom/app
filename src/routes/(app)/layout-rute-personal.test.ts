// src/routes/(app)/layout-rute-personal.test.ts
// Penjaga daftar rute personal di src/routes/(app)/+layout.server.ts
//
// Latar: layout (app) menolak rute yang tidak terdaftar sebagai "personal"
// dengan 404 ketika pengguna tidak punya orgId. Rute /wali sempat kena
// justru karena wali memang TIDAK punya lembaga — persis pengguna yang
// halaman itu layani. Kegagalannya senyap: kode benar, build benar,
// tapi halaman balas 404 di produksi.
//
// Tes ini membaca berkas layout apa adanya dan memastikan setiap rute
// yang dipakai akun pribadi benar-benar terdaftar.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const layout = readFileSync(
	fileURLToPath(new URL('./+layout.server.ts', import.meta.url)),
	'utf8'
);

/** Rute yang dipakai pengguna TANPA lembaga (santri mandiri, wali). */
const RUTE_PERSONAL = ['/wali', '/habit', '/belajar', '/sertifikat', '/akun', '/kitab'];

for (const rute of RUTE_PERSONAL) {
	test(`rute personal ${rute} terdaftar di layout (app)`, () => {
		assert.ok(
			layout.includes(`url.pathname === '${rute}'`),
			`${rute} tidak terdaftar sebagai rute personal — pengguna tanpa lembaga akan menerima 404`
		);
	});
}

test('rute wali juga mengizinkan sub-rute /wali/[santriId]', () => {
	assert.ok(
		layout.includes(`url.pathname.startsWith('/wali/')`),
		'Sub-rute /wali/[santriId] tidak diizinkan — detail anak akan 404'
	);
});
