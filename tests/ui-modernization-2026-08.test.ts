import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const srcRoot = new URL('../src/', import.meta.url);
const read = (fromRoot: string) => readFileSync(new URL(fromRoot, root), 'utf8');

const collectSourceFiles = (dir: string, acc: string[] = []) => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === '.svelte-kit') continue;
			collectSourceFiles(full, acc);
			continue;
		}
		if (/\.(test|spec)\./.test(entry.name)) continue;
		if (/\.(svelte|ts|js)$/.test(entry.name)) acc.push(full);
	}
	return acc;
};

test('halaman publik tidak boleh menyebut segera hadir atau coming soon', () => {
	const files = collectSourceFiles(srcRoot.pathname);
	const hits: string[] = [];
	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		if (/segera hadir|coming soon/i.test(text)) {
			hits.push(relative(srcRoot.pathname, file));
		}
	}
	assert.deepEqual(hits, [], `teks terlarang masih ada di: ${hits.join(', ')}`);
});

test('semua ikon memakai @lucide/svelte, bukan lucide-svelte', () => {
	const files = collectSourceFiles(srcRoot.pathname);
	const hits: string[] = [];
	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		if (/from ['"]lucide-svelte['"]/.test(text)) {
			hits.push(relative(srcRoot.pathname, file));
		}
	}
	assert.deepEqual(hits, [], `import lama masih ada di: ${hits.join(', ')}`);

	const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
	assert.equal(pkg.dependencies?.['lucide-svelte'], undefined);
	assert.equal(pkg.devDependencies?.['lucide-svelte'], undefined);
	assert.ok(pkg.devDependencies?.['@lucide/svelte'] || pkg.dependencies?.['@lucide/svelte']);
});

test('landing marketing punya hero, kartu lembaga aktif, dan social proof', () => {
	const page = read('src/routes/(marketing)/+page.svelte');
	assert.match(page, /from '@lucide\/svelte'/);
	assert.match(page, /ENABLED_INSTITUTIONS/);
	assert.match(page, /text-4xl/);
	assert.match(page, /text-6xl/);
	assert.match(page, /href="\/register"/);
	assert.match(page, /Daftarkan Lembaga/);
	assert.match(page, /href="\/auth"/);
	assert.match(page, />\s*Masuk\s*</);
	assert.match(page, /\/api\/public\/stats/);
	assert.match(page, /prefers-reduced-motion/);
	assert.match(page, /IntersectionObserver/);
	assert.doesNotMatch(page, /segera hadir|coming soon/i);
	assert.match(page, /width="96"/);
	assert.match(page, /height="96"/);
});

test('endpoint statistik publik ringan dan di-cache satu jam', () => {
	const endpoint = read('src/routes/api/public/stats/+server.ts');
	assert.match(endpoint, /Cache-Control': 'public, max-age=3600'/);
	assert.match(endpoint, /COUNT\(1\)/);
	assert.match(endpoint, /organizations/);
	assert.match(endpoint, /institutionCount/);
	assert.match(endpoint, /studentCount/);
	assert.doesNotMatch(endpoint, /from '\$lib\/server\//);
});

test('halaman lembaga publik memakai struktur hero, 3 fitur, CTA, dan FAQ', () => {
	const view = read('src/lib/components/org/OrgPublicLandingView.svelte');
	assert.match(view, /from '@lucide\/svelte'/);
	assert.match(view, /institution.highlights/);
	assert.match(view, /pageCopy.faq/);
	assert.match(view, /registerRoute/);
	assert.match(view, /Kas transparan|Agenda jamaah|santri|hafalan/i);
	assert.match(view, /id="faq"/);
	assert.match(view, /prefers-reduced-motion/);
	for (const file of ['tpq', 'pondok', 'masjid', 'musholla', 'rumah-tahfidz']) {
		const page = read(`src/routes/${file}/+page.svelte`);
		assert.match(page, /OrgPublicLandingView/);
	}
});

test('form pendaftaran lembaga hanya mengubah presentasi', () => {
	const form = read('src/lib/components/org/OrgRegisterView.svelte');
	assert.match(form, /from '@lucide\/svelte'/);
	assert.match(form, /name="orgName"/);
	assert.match(form, /name="orgSlug"/);
	assert.match(form, /name="orgPhone"/);
	assert.match(form, /name="adminName"/);
	assert.match(form, /name="adminEmail"/);
	assert.match(form, /name="adminPassword"/);
	assert.match(form, /method="POST"/);
	assert.match(form, /h-12/);
	assert.match(form, /Langkah 1/);
	assert.match(form, /Data Lembaga/);
	assert.match(form, /Akun Admin/);
	assert.match(form, /Nama lembaga wajib diisi/);
	assert.match(form, /text-red-600/);
	assert.doesNotMatch(form, /input tidak valid/i);
});

test('halaman register memakai lembaga aktif dan jalur ustadz, tanpa coming soon', () => {
	const page = read('src/routes/(auth)/register/+page.svelte');
	assert.match(page, /from '@lucide\/svelte'/);
	assert.match(page, /ENABLED_INSTITUTIONS/);
	assert.match(page, /register\/ustadz/);
	assert.doesNotMatch(page, /upcomingInstitutions/);
	assert.doesNotMatch(page, /segera hadir|coming soon/i);
});

test('navigasi daftar menampilkan 5 lembaga plus ustadz', () => {
	const layout = read('src/routes/+layout.svelte');
	assert.match(layout, /institutionRegisterMenuItems/);
	assert.match(layout, /\/register\/ustadz/);
	assert.match(layout, /Daftar sebagai Ustadz/);
	assert.match(layout, /desktop-nav-link-active/);
	assert.match(layout, /isRegisterMenuActive/);
});

test('folder IDE lokal tidak ikut ter-track', () => {
	const ignore = read('.gitignore');
	assert.match(ignore, /^\.idea\//m);
	assert.match(ignore, /^\.gradle\//m);
	assert.match(ignore, /^\.junie\//m);
});
