/**
 * Regresi struktural halaman dashboard.
 *
 * Mengikuti pola tests/homepage-hero-layout.test.ts: memeriksa sumber halaman
 * agar peningkatan yang sudah dibuat tidak diam-diam hilang di kemudian hari.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dashboardPath = new URL('../src/routes/(app)/dashboard/+page.svelte', import.meta.url);
const topBarPath = new URL('../src/lib/components/TopBar.svelte', import.meta.url);
const motionPath = new URL('../src/lib/motion/index.ts', import.meta.url);

test('dashboard tidak lagi memakai kelas animasi "fade-in" yang tidak pernah didefinisikan', async () => {
	const page = await readFile(dashboardPath, 'utf8');
	// `fade-in` dipakai 10 kali tetapi tidak pernah ada @keyframes-nya,
	// sehingga tidak ada animasi yang benar-benar berjalan.
	assert.doesNotMatch(page, /class="fade-in/);
	assert.doesNotMatch(page, /style="animation-delay: \d+ms;"/);
});

test('dashboard memakai action reveal berbasis IntersectionObserver', async () => {
	const page = await readFile(dashboardPath, 'utf8');
	assert.match(page, /import \{ reveal[^}]*\} from '\$lib\/motion'/);
	const uses = page.match(/use:reveal=/g) ?? [];
	assert.ok(uses.length >= 10, `harus ada minimal 10 use:reveal, ditemukan ${uses.length}`);
});

test('grafik dashboard memakai komponen SVG, bukan div dengan tinggi persen', async () => {
	const page = await readFile(dashboardPath, 'utf8');
	assert.match(page, /import BarChart from '\$lib\/components\/charts\/BarChart\.svelte'/);
	assert.match(page, /<BarChart\b/);
	// Pendekatan lama: <div style={`height: ${entry.height}%`}> tanpa sumbu apa pun.
	assert.doesNotMatch(page, /style=\{`height: \$\{entry\.height\}%`\}/);
});

test('kartu statistik memakai komponen bersama, bukan markup berulang', async () => {
	const page = await readFile(dashboardPath, 'utf8');
	assert.match(page, /import StatCard from '\$lib\/components\/dashboard\/StatCard\.svelte'/);
	assert.match(page, /<StatCard\b/);
});

test('TopBar memakai identitas sesi, bukan nilai yang ditulis mati', async () => {
	const topBar = await readFile(topBarPath, 'utf8');
	// Sebelumnya inisial "MY", nama "Admin", dan peran "Superadmin" ditulis mati
	// sehingga salah untuk semua pengguna selain pemilik.
	assert.doesNotMatch(topBar, />\s*MY\s*</);
	assert.doesNotMatch(topBar, />Superadmin</);
	assert.match(topBar, /currentUser\?\.username \|\| currentUser\?\.email/);
	assert.match(topBar, /roleLabelMap\[currentUser\?\.role \?\? ''\]/);
});

test('lapisan motion menghormati prefers-reduced-motion', async () => {
	const motion = await readFile(motionPath, 'utf8');
	assert.match(motion, /prefers-reduced-motion: reduce/);
	// Setiap action yang bergerak wajib punya jalan keluar saat reduced-motion aktif.
	for (const action of ['reveal', 'countUp', 'spotlight', 'autoAnimate']) {
		const body = motion.slice(motion.indexOf(`export function ${action}`));
		assert.match(
			body.slice(0, 700),
			/prefersReducedMotion\(\)/,
			`${action} harus memeriksa prefersReducedMotion`
		);
	}
});

test('animasi dibatasi pada transform dan opacity agar tetap ringan', async () => {
	const motion = await readFile(motionPath, 'utf8');
	// Menganimasikan width/height/top/left memicu layout ulang dan membuat berat.
	assert.doesNotMatch(motion, /animate\([^)]*\b(width|height|top|left|margin)\s*:/);
	assert.match(motion, /opacity/);
	assert.match(motion, /transform/);
});
