import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Modul business-agent (B2B leads/quotes/approvals/orders) dihapus.
 *
 * Alasan: 8 tabelnya kosong total di produksi, tidak ada halaman UI yang
 * memakainya, tidak dirujuk menu navigasi, tidak diimpor modul lain, dan
 * flag `BUSINESS_AGENT_AGENT_API_ENABLED` tetap "false" sejak dibuat.
 * 2.105 baris kode + 8 berkas test yang ikut dibangun setiap kali build.
 *
 * Kode dan tesnya tetap tersimpan di riwayat git bila suatu saat dibutuhkan.
 */

const akar = process.cwd();

const jalurTerhapus = [
	'src/lib/server/business-agent',
	'src/routes/api/admin/business-agent',
	'src/routes/api/internal/business-agent'
];

test('folder business-agent sudah tidak ada', () => {
	for (const j of jalurTerhapus) {
		assert.equal(existsSync(join(akar, j)), false, `${j} seharusnya sudah dihapus`);
	}
});

test('tidak ada sisa impor ke business-agent', async () => {
	const { execSync } = await import('node:child_process');
	const keluaran = execSync(
		"grep -rl 'business-agent\\|businessAgent' src/ 2>/dev/null || true",
		{ cwd: akar, encoding: 'utf-8' }
	).trim();
	assert.equal(keluaran, '', `masih ada berkas merujuk business-agent:\n${keluaran}`);
});

test('skrip npm test:business-agent sudah dilepas', async () => {
	const { readFileSync } = await import('node:fs');
	const pkg = JSON.parse(readFileSync(join(akar, 'package.json'), 'utf-8'));
	assert.equal(
		'test:business-agent' in (pkg.scripts ?? {}),
		false,
		'skrip menunjuk berkas yang sudah tidak ada'
	);
});

test('flag BUSINESS_AGENT sudah dilepas dari wrangler.toml', async () => {
	const { readFileSync } = await import('node:fs');
	const toml = readFileSync(join(akar, 'wrangler.toml'), 'utf-8');
	assert.equal(
		/BUSINESS_AGENT_AGENT_API_ENABLED\s*=/.test(toml),
		false,
		'flag untuk modul yang sudah dihapus'
	);
});

/**
 * Penjaga: gerbang CI harus benar-benar menjalankan test. Sebelum ini CI
 * hanya menjalankan `check` dan `build`, sehingga 64 berkas test (299 test)
 * tidak pernah dieksekusi — bug seperti tabel santri yatim lolos berbulan.
 */
test('CI menjalankan test, bukan hanya check dan build', async () => {
	const { readFileSync } = await import('node:fs');
	const ci = readFileSync(join(akar, '.github/workflows/ci.yml'), 'utf-8');
	assert.match(ci, /run:\s*npm test/, 'CI wajib menjalankan npm test');
});

/**
 * Versi Node di CI harus cukup baru untuk fitur yang dipakai kode.
 * `library-moderation.test.ts` mengimpor `node:sqlite` yang baru ada di
 * Node 22+; di Node 20 test itu gagal dengan ERR_UNKNOWN_BUILTIN_MODULE.
 */
test('CI memakai Node yang mendukung node:sqlite', async () => {
	const { readFileSync } = await import('node:fs');
	const ci = readFileSync(join(akar, '.github/workflows/ci.yml'), 'utf-8');
	const cocok = ci.match(/node-version:\s*(\d+)/);
	assert.ok(cocok, 'ci.yml wajib menyebut node-version');
	assert.ok(
		Number(cocok[1]) >= 22,
		`node:sqlite butuh Node 22+, ci.yml memakai ${cocok[1]}`
	);
});

test('npm test mencakup tests/ dan src/', async () => {
	// Diuji lewat perilaku nyata skrip, bukan lewat isi string perintah:
	// glob '**' hanya jalan di Node 21+, sedangkan CI memakai Node 20, jadi
	// penelusuran berkas dipindahkan ke scripts/jalankan-test.mjs.
	const { readFileSync } = await import('node:fs');
	const pkg = JSON.parse(readFileSync(join(akar, 'package.json'), 'utf-8'));
	assert.match(
		pkg.scripts?.test ?? '',
		/jalankan-test\.mjs/,
		'npm test wajib memakai skrip penelusur'
	);

	const skrip = readFileSync(join(akar, 'scripts/jalankan-test.mjs'), 'utf-8');
	assert.match(skrip, /'tests'/, 'skrip wajib menelusuri tests/');
	assert.match(skrip, /'src'/, 'skrip wajib menelusuri src/');
	assert.match(skrip, /\.test\.ts/, 'skrip wajib menyaring berkas *.test.ts');

	// Tidak boleh kembali memakai glob '**' yang gagal senyap di Node 20.
	assert.equal(
		/\*\*/.test(pkg.scripts?.test ?? ''),
		false,
		"glob '**' tidak didukung Node 20 di CI"
	);
});
