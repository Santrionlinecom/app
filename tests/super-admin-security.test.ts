import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
	clampSuperAdminSession,
	evaluateSuperAdminOAuth,
	getSuperAdminSessionExpiry,
	isPasswordLoginAllowedForIdentity,
	isPasswordLoginAllowedForRole,
	isSuperAdminSessionAllowed,
	parseSuperAdminEmailAllowlist
} from '../src/lib/server/auth/super-admin-security';

test('empty configuration grants no Super Admin email', () => {
	const allowlist = parseSuperAdminEmailAllowlist(undefined, undefined);
	assert.equal(allowlist.size, 0);
	assert.equal(allowlist.has('masyogikonline@gmail.com'), false);
});

test('Super Admin OAuth requires an allowlisted and verified Google email', () => {
	const allowlist = parseSuperAdminEmailAllowlist(' WebSantriOnline@gmail.com ');
	assert.equal(
		evaluateSuperAdminOAuth({
			email: 'websantrionline@gmail.com',
			emailVerified: true,
			currentRole: 'santri',
			allowlist
		}),
		'grant'
	);
	assert.equal(
		evaluateSuperAdminOAuth({
			email: 'websantrionline@gmail.com',
			emailVerified: false,
			currentRole: 'SUPER_ADMIN',
			allowlist
		}),
		'deny'
	);
	assert.equal(
		evaluateSuperAdminOAuth({
			email: 'legacy-admin@example.com',
			emailVerified: true,
			currentRole: 'SUPER_ADMIN',
			allowlist
		}),
		'deny'
	);
	assert.equal(
		evaluateSuperAdminOAuth({
			email: 'santri@example.com',
			emailVerified: true,
			currentRole: 'santri',
			allowlist
		}),
		'standard'
	);
});

test('Super Admin is Google-only and receives an eight-hour session ceiling', () => {
	const allowlist = parseSuperAdminEmailAllowlist('websantrionline@gmail.com');
	assert.equal(isPasswordLoginAllowedForRole('SUPER_ADMIN'), false);
	assert.equal(isPasswordLoginAllowedForRole('super-admin'), false);
	assert.equal(isPasswordLoginAllowedForRole('admin'), true);
	assert.equal(
		isPasswordLoginAllowedForIdentity({
			role: 'santri',
			email: 'websantrionline@gmail.com',
			allowlist
		}),
		false
	);
	const now = 1_700_000_000_000;
	assert.equal(getSuperAdminSessionExpiry(now), now + 8 * 60 * 60 * 1000);
});

test('Super Admin session persistence is clamped to the eight-hour ceiling', async () => {
	let statement = '';
	let bindings: unknown[] = [];
	let didRun = false;
	const db = {
		prepare(sql: string) {
			statement = sql;
			return {
				bind(...values: unknown[]) {
					bindings = values;
					return {
						async run() {
							didRun = true;
						}
					};
				}
			};
		}
	};
	await clampSuperAdminSession(db, 'session-1', 1_700_000_000_000);
	assert.match(statement, /UPDATE sessions SET expires_at/);
	assert.deepEqual(bindings, [1_700_028_800_000, 'session-1']);
	assert.equal(didRun, true);
});

test('existing Super Admin sessions fail closed against the runtime allowlist', () => {
	const allowlist = parseSuperAdminEmailAllowlist('websantrionline@gmail.com');
	assert.equal(
		isSuperAdminSessionAllowed({
			role: 'SUPER_ADMIN',
			email: 'legacy-admin@example.com',
			allowlist
		}),
		false
	);
	assert.equal(
		isSuperAdminSessionAllowed({
			role: 'SUPER_ADMIN',
			email: 'websantrionline@gmail.com',
			allowlist
		}),
		true
	);
	assert.equal(
		isSuperAdminSessionAllowed({ role: 'santri', email: 'santri@example.com', allowlist }),
		true
	);
});

test('all authentication entry points enforce the Super Admin high-security policy', () => {
	const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
	const callback = read('src/routes/(auth)/auth/google/callback/+server.ts');
	const passwordLogin = read('src/routes/(auth)/auth/+page.server.ts');
	const hooks = read('src/hooks.server.ts');
	const account = read('src/routes/(app)/akun/+page.server.ts');

	assert.doesNotMatch(callback, /DEFAULT_SUPER_ADMIN_EMAIL/);
	assert.match(callback, /email_verified/);
	assert.match(callback, /evaluateSuperAdminOAuth/);
	assert.match(callback, /clampSuperAdminSession/);
	assert.match(passwordLogin, /isPasswordLoginAllowedForIdentity/);
	assert.match(passwordLogin, /parseSuperAdminEmailAllowlist/);
	assert.match(hooks, /clampSuperAdminSession/);
	assert.match(hooks, /isSuperAdminSessionAllowed/);
	assert.match(hooks, /invalidateSession/);
	assert.match(account, /isPasswordLoginAllowedForIdentity/);
	assert.match(account, /parseSuperAdminEmailAllowlist/);
});
