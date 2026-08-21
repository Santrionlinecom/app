// src/routes/privacy/kebijakan-privasi.test.ts
// Penjaga isi Kebijakan Privasi.
//
// Halaman ini adalah dokumen kepatuhan, bukan sekadar halaman statis.
// Kalau bagian dasar hukum hilang saat redesain, tidak ada yang menyadari
// sampai ada lembaga atau pihak berwenang yang menanyakannya.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VERSI_LEGAL } from '../../lib/server/legal/consent.ts';

const halaman = readFileSync(
	fileURLToPath(new URL('./+page.svelte', import.meta.url)),
	'utf8'
);
const syarat = readFileSync(
	fileURLToPath(new URL('../syarat/+page.svelte', import.meta.url)),
	'utf8'
);

test('menyebut UU 27 Tahun 2022 secara eksplisit', () => {
	// Teks di markup bisa terpotong newline + indentasi, jadi spasi
	// dinormalkan dulu sebelum dicocokkan.
	const rata = halaman.replace(/\s+/g, ' ');
	assert.match(rata, /Nomor 27 Tahun 2022/);
	assert.match(rata, /Pelindungan Data Pribadi/);
});

test('menyatakan siapa Pengendali Data Pribadi', () => {
	assert.match(halaman, /Pengendali Data Pribadi/);
});

test('mencantumkan kontak penanggung jawab data', () => {
	assert.match(halaman, /mailto:[^"']+@santrionline\.com/);
});

test('menjelaskan peran lembaga atas data santrinya', () => {
	assert.match(halaman, /lembaga bertindak sebagai pengendali/i);
});

test('menyatakan prinsip minimal data secara spesifik', () => {
	// Klaim ini harus tetap benar. Kalau suatu saat NIK/KK benar-benar
	// dikumpulkan, kalimat ini WAJIB diubah — bukan dibiarkan berbohong.
	assert.match(halaman, /tidak mengumpulkan NIK/i);
});

test('memberi tautan ke sumber resmi UU PDP', () => {
	assert.match(halaman, /peraturan\.bpk\.go\.id/);
});

test('menjanjikan jalur hapus akun mandiri', () => {
	// Klaim ini harus punya wujud nyata: halaman /akun memang punya
	// action hapusAkun. Menjanjikan hak yang tidak ada = menyesatkan.
	assert.match(halaman.replace(/\s+/g, ' '), /menghapus akun kapan saja/i);

	const halamanAkun = readFileSync(
		fileURLToPath(new URL('../(app)/akun/+page.server.ts', import.meta.url)),
		'utf8'
	);
	assert.match(
		halamanAkun,
		/hapusAkun:\s*async/,
		'kebijakan menjanjikan hapus akun mandiri, tetapi action-nya tidak ada'
	);
});

test('menyatakan tenggat pemberitahuan kebocoran', () => {
	const rata = halaman.replace(/\s+/g, ' ');
	assert.match(rata, /kebocoran/i);
	assert.match(rata, /3×24 jam|3x24 jam/i);
});

test('prosedur tanggap kebocoran benar-benar terdokumentasi', () => {
	// Janji di halaman publik harus punya dokumen pendukung, bukan
	// sekadar kalimat yang enak dibaca.
	const prosedur = readFileSync(
		fileURLToPath(new URL('../../../docs/prosedur-tanggap-kebocoran.md', import.meta.url)),
		'utf8'
	);
	assert.ok(prosedur.length > 1000, 'dokumen prosedur tampak kosong');
	assert.match(prosedur, /3×24 jam/, 'tenggat di dokumen harus sama dengan yang dijanjikan publik');
	assert.match(prosedur, /27 Tahun 2022/);
});

test('halaman syarat & ketentuan tetap ada dan bisa ditaut', () => {
	assert.ok(syarat.length > 500, 'halaman /syarat tampak kosong');
});

test('tanggal pembaruan tidak lebih lama dari versi persetujuan', () => {
	// Kalau VERSI_LEGAL dinaikkan tapi halaman tidak diperbarui, berarti
	// pengguna menyetujui versi yang tidak pernah ditulis.
	const cocok = halaman.match(/lastUpdated = '([^']+)'/);
	assert.ok(cocok, 'tanggal pembaruan tidak ditemukan');

	const BULAN: Record<string, string> = {
		Januari: '01', Februari: '02', Maret: '03', April: '04',
		Mei: '05', Juni: '06', Juli: '07', Agustus: '08',
		September: '09', Oktober: '10', November: '11', Desember: '12'
	};
	const [tgl, namaBulan, tahun] = cocok[1].split(' ');
	const iso = `${tahun}-${BULAN[namaBulan]}-${tgl.padStart(2, '0')}`;

	assert.ok(
		iso >= VERSI_LEGAL,
		`halaman privasi (${iso}) lebih lama dari versi persetujuan (${VERSI_LEGAL}) — perbarui halamannya`
	);
});
