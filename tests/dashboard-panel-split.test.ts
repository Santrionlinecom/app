/**
 * Regresi pemecahan panel dashboard.
 *
 * Panel per peran harus tetap dimuat malas. Bila suatu saat seseorang
 * mengubahnya menjadi impor statis, chunk dashboard membengkak kembali
 * tanpa ada yang menyadarinya.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (rel: string) => readFile(new URL(`../src/${rel}`, import.meta.url), 'utf8');
const PAGE = 'routes/(app)/dashboard/+page.svelte';

test('panel per peran dimuat malas, bukan diimpor statis', async () => {
	const page = await read(PAGE);

	// Impor statis akan menarik panel ke chunk utama dashboard.
	assert.doesNotMatch(
		page,
		/^\s*import\s+\w+\s+from\s+'\$lib\/components\/dashboard\/panels\//m,
		'panel tidak boleh diimpor statis'
	);
	assert.match(page, /import\('\$lib\/components\/dashboard\/panels\/TpqPanel\.svelte'\)/);
	assert.match(page, /import\('\$lib\/components\/dashboard\/panels\/CommunityPanel\.svelte'\)/);
});

test('panel hanya diminta saat perannya cocok', async () => {
	const page = await read(PAGE);

	// Impor harus dijaga kondisi peran; kalau tidak, semua orang mengunduhnya.
	assert.match(page, /if \(orgType === 'tpq' && tpqDashboard && !tpqPanelPromise\)/);
	assert.match(page, /if \(isCommunityOrg && !communityPanelPromise\)/);
});

test('markup panel sudah keluar dari halaman dashboard', async () => {
	const page = await read(PAGE);

	// Penanda unik tiap panel tidak boleh lagi ada di halaman induk.
	assert.doesNotMatch(page, /Pusat Operasional TPQ/, 'markup TPQ harus pindah ke komponen');
	assert.doesNotMatch(page, /Transaksi Kas Terbaru/, 'markup komunitas harus pindah');
	assert.doesNotMatch(page, /Galeri Lembaga/, 'galeri komunitas harus pindah');
});

test('panel TPQ mempertahankan isi dan tautan pentingnya', async () => {
	const panel = await read('lib/components/dashboard/panels/TpqPanel.svelte');
	assert.match(panel, /Pusat Operasional TPQ/);
	assert.match(panel, /href="\/tpq\/akademik\/riwayat"/);
	assert.match(panel, /href="\/habit"/);
	assert.match(panel, /getSetoranStatusLabel/, 'status setoran wajib dipertahankan');
});

test('panel komunitas mempertahankan aksi form aset dan galeri', async () => {
	const panel = await read('lib/components/dashboard/panels/CommunityPanel.svelte');

	// Aksi server ini harus tetap sama persis, kalau tidak fitur aset rusak.
	for (const action of ['?/importAssets', '?/updateAsset', '?/addAsset', '?/deleteAsset']) {
		assert.ok(panel.includes(action), `aksi ${action} wajib dipertahankan`);
	}
	assert.match(panel, /name="quantity"/, 'field jumlah wajib ada');
	assert.match(panel, /confirm\('Hapus aset ini\?'\)/, 'konfirmasi hapus wajib dipertahankan');
	assert.match(panel, /uploadOrgMedia/, 'unggah galeri wajib dipertahankan');
});

test('state form aset tetap terhubung dua arah ke induk', async () => {
	const page = await read(PAGE);
	// Tanpa bind:, tombol Edit tidak akan mengisi form dan fitur edit rusak.
	for (const field of ['assetId', 'assetName', 'assetQuantity', 'assetFormRef']) {
		assert.ok(page.includes(`bind:${field}`), `bind:${field} wajib ada`);
	}
});
