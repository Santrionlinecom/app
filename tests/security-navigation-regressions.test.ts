import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readProjectFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('session cookie is valid for the whole application', async () => {
	const [lucia, hooks] = await Promise.all([
		readProjectFile('src/lib/server/lucia.ts'),
		readProjectFile('src/hooks.server.ts')
	]);
	assert.match(lucia, /path:\s*['"]\/['"]/);
	assert.doesNotMatch(lucia, /path:\s*['"]\.['"]/);
	assert.doesNotMatch(hooks, /path:\s*['"]\.['"]/);
});

test('dangerous demo credential seeding is permanently retired', async () => {
	const source = await readProjectFile('src/routes/api/seed-admin/+server.ts');
	assert.doesNotMatch(source, /defaultPassword|password123|UPDATE users SET password_hash/);
	assert.match(source, /status:\s*410/);
});

test('maintenance secrets are accepted from headers only, never URL query parameters', async () => {
	const [seed, migrate] = await Promise.all([
		readProjectFile('src/routes/api/seed-admin/+server.ts'),
		readProjectFile('src/routes/api/admin/migrate/+server.ts')
	]);
	assert.doesNotMatch(seed, /searchParams\.get\(['"]token['"]\)/);
	assert.doesNotMatch(migrate, /searchParams\.get\(['"]token['"]\)/);
});

test('global responses receive baseline security headers and report-only CSP', async () => {
	const hooks = await readProjectFile('src/hooks.server.ts');
	for (const header of [
		'Strict-Transport-Security',
		'X-Content-Type-Options',
		'X-Frame-Options',
		'Referrer-Policy',
		'Permissions-Policy',
		'Content-Security-Policy-Report-Only'
	]) {
		assert.match(hooks, new RegExp(header));
	}
});

test('app error CTA sends only Super Admin users to the system overview', async () => {
	const source = await readProjectFile('src/routes/(app)/+error.svelte');
	assert.match(source, /isSuperAdmin/);
	assert.doesNotMatch(source, /role\.includes\('SUPER'\) \|\| appMenu/);
	assert.match(source, /isSuperAdmin \? '\/admin\/super\/overview' : '\/dashboard'/);
});
