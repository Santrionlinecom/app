import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const page = readFileSync(join(process.cwd(), 'src/routes/(app)/akun/+page.svelte'), 'utf8');
const appLayout = readFileSync(join(process.cwd(), 'src/routes/(app)/+layout.svelte'), 'utf8');

test('account page exposes one accessible responsive section navigator', () => {
	assert.match(page, /aria-label="Navigasi pengaturan akun"/);
	for (const label of ['Ringkasan', 'Lembaga', 'Tautan', 'Lokasi', 'Profil', 'Keamanan', 'Perangkat']) {
		assert.match(page, new RegExp(`label: '${label}'|<span>${label}<\\/span>`));
	}
	assert.match(page, /account-nav-link-active=\{activeSection === item\.id\}/);
	assert.match(page, /new IntersectionObserver/);
	assert.match(page, /data-account-section=\{item\.id\}/);
	assert.match(page, /link\.scrollIntoView/);
	assert.doesNotMatch(page, /class="quick-card"/);
});

test('account navigation targets real sections with sticky-header clearance', () => {
	for (const id of ['ringkasan', 'lembaga', 'tautan', 'lokasi', 'profil', 'keamanan']) {
		assert.match(page, new RegExp(`id="${id}"`));
	}
	assert.match(page, /\.account-anchor \{\s*scroll-margin-top:/);
	assert.match(page, /\.account-section-nav \{[\s\S]*position: sticky;/);
	assert.match(page, /\.account-nav-scroll \{[\s\S]*overflow-x: auto;/);
	assert.match(appLayout, /data-app-shell-header/);
	assert.match(page, /new ResizeObserver\(syncNavigationMetrics\)/);
	assert.match(page, /--account-shell-header-height/);
	assert.match(page, /--account-section-nav-height/);
	assert.doesNotMatch(page, /top:\s*(5\.25|8\.75|9)rem/);
});

test('account settings remain readable instead of using cramped four-column cards', () => {
	assert.match(page, /id="profil" class="account-anchor grid gap-6 xl:grid-cols-2"/);
	assert.doesNotMatch(page, /xl:grid-cols-4/);
	assert.match(page, /min-height: 2\.75rem;/);
});
