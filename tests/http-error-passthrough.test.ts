/**
 * Regresi: galat HTTP tidak boleh tertelan menjadi 500.
 *
 * SvelteKit `error(4xx, ...)` melempar objek HttpError. Bila blok catch
 * menangkapnya tanpa memeriksa, galat validasi (400) dan otorisasi (403/404)
 * berubah menjadi 500 — pengguna melihat "Kode 500 / Halaman belum siap"
 * padahal sebenarnya hanya input kurang lengkap atau tidak punya akses.
 *
 * Test ini ditulis SEBELUM perbaikan dan awalnya GAGAL, membuktikan bug nyata.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (rel: string) => readFile(new URL(`../src/${rel}`, import.meta.url), 'utf8');

/** Berkas yang terbukti menelan HttpError di dalam try/catch. */
const GUARDED_FILES = ['routes/api/notes/+server.ts', 'routes/api/notes/[id]/+server.ts'];

for (const rel of GUARDED_FILES) {
	test(`${rel} meneruskan status HTTP asli, tidak membungkusnya jadi 500`, async () => {
		const src = await read(rel);

		// Berkas ini melempar error()/fail() dengan kode 4xx di dalam try.
		const throws4xx = /\b(error|fail)\(\s*4\d\d\s*,/.test(src);
		assert.ok(throws4xx, 'prasyarat: berkas memang melempar 4xx');

		// Maka setiap catch wajib punya penjaga yang mengenali HttpError.
		assert.match(
			src,
			/isHttpError/,
			'catch wajib memakai isHttpError agar status asli tidak hilang'
		);

		// Penjaga harus meneruskan err.status, bukan memaksa 500.
		assert.match(
			src,
			/status:\s*err\.status|status:\s*error\.status/,
			'status asli galat wajib diteruskan ke respons'
		);
	});
}

test('isHttpError diimpor dari @sveltejs/kit di berkas yang dijaga', async () => {
	for (const rel of GUARDED_FILES) {
		const src = await read(rel);
		assert.match(
			src,
			/import\s*\{[^}]*\bisHttpError\b[^}]*\}\s*from\s*'@sveltejs\/kit'/,
			`${rel} wajib mengimpor isHttpError`
		);
	}
});

test('redirect tidak boleh ikut tertelan oleh catch', async () => {
	// assertLoggedIn() melempar `redirect(302, '/auth')`, BUKAN HttpError.
	// isHttpError() tidak mengenalinya, sehingga tanpa isRedirect() sesi
	// kedaluwarsa tampil sebagai 500 alih-alih 401.
	for (const rel of GUARDED_FILES) {
		const src = await read(rel);
		if (/assertLoggedIn|requireUser/.test(src)) {
			assert.match(
				src,
				/isRedirect\(err\)/,
				`${rel} memakai assertLoggedIn, wajib menjaga redirect dengan isRedirect`
			);
			assert.match(
				src,
				/status:\s*401/,
				`${rel} wajib membalas 401 untuk sesi berakhir, bukan mengalihkan`
			);
		}
	}
});

test('isRedirect diimpor di berkas yang memakai assertLoggedIn', async () => {
	for (const rel of GUARDED_FILES) {
		const src = await read(rel);
		if (/isRedirect\(/.test(src)) {
			assert.match(
				src,
				/import\s*\{[^}]*\bisRedirect\b[^}]*\}\s*from\s*'@sveltejs\/kit'/,
				`${rel} wajib mengimpor isRedirect`
			);
		}
	}
});

test('jadwal memakai fail() yang di-return, bukan dilempar ke catch', async () => {
	// Audit awal menandai berkas ini, tetapi pemeriksaan ulang membuktikan
	// polanya sudah benar: `fail()` adalah nilai yang DI-RETURN (tidak pernah
	// tertangkap catch), dan `error(400/404)` berada di requireScheduleContext,
	// di luar blok try mana pun.
	const src = await read('routes/(app)/dashboard/jadwal/+page.server.ts');

	// fail() harus di-return, tidak di-throw — inilah alasan pola ini aman.
	assert.doesNotMatch(src, /throw\s+fail\(/, 'fail() tidak boleh dilempar');

	// Setiap catch yang menangani tabel hilang wajib meneruskan galat lain.
	const missingTableGuards = src.match(/if \(isMissingTableError\(err\)\) \{/g) ?? [];
	const rethrows = src.match(/\bthrow err;/g) ?? [];
	assert.equal(
		missingTableGuards.length,
		rethrows.length,
		'setiap penjaga tabel-hilang wajib diikuti throw err untuk galat tak dikenal'
	);

	// Catch parsing Excel sengaja membalas 400 (berkas rusak = galat pengguna),
	// bukan 500. Itu perilaku benar dan tidak boleh dianggap pelanggaran.
	const excelGuards = src.match(/File Excel tidak dapat dibaca/g) ?? [];
	assert.ok(excelGuards.length > 0, 'galat parsing Excel wajib dibalas 400');
});

test('pesan galat mentah tidak dibocorkan ke pengguna', async () => {
	// Sebelumnya catch mengembalikan err.message apa adanya, yang bisa memuat
	// detail skema database (mis. "no such column: calendar_notes.foo").
	for (const rel of GUARDED_FILES) {
		const src = await read(rel);
		assert.doesNotMatch(
			src,
			/error:\s*msg\b/,
			`${rel} tidak boleh mengembalikan pesan galat mentah`
		);
	}
});

test('pesan galat validasi sampai ke pengguna, bukan pesan generik', async () => {
	const src = await read('routes/api/notes/+server.ts');
	// Pesan asli 400 harus diteruskan supaya pengguna tahu apa yang kurang.
	assert.match(
		src,
		/err\.body\?\.\s*message|err\.body\.message/,
		'pesan asli dari error() wajib diteruskan'
	);
});
