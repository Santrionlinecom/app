import assert from 'node:assert/strict';
import test from 'node:test';
import {
	ADDON_GROUP_WA_PATH,
	isAddonActiveRow,
	isAddonTipe,
	manageHrefForAddon
} from './addons.ts';

test('addon type guard accepts known catalog keys', () => {
	assert.equal(isAddonTipe('santri_unlimited'), true);
	assert.equal(isAddonTipe('unknown'), false);
});

test('active addon rows respect expiry timestamps', () => {
	const now = 1_700_000_000_000;
	assert.equal(isAddonActiveRow('aktif', null, now), true);
	assert.equal(isAddonActiveRow('aktif', now + 1000, now), true);
	assert.equal(isAddonActiveRow('aktif', now - 1000, now), false);
	assert.equal(isAddonActiveRow('trial', null, now), false);
	// seconds-based expiry still works
	assert.equal(isAddonActiveRow('aktif', Math.floor((now + 10_000) / 1000), now), true);
});

test('group WA path uses tracked shortlink route', () => {
	assert.equal(ADDON_GROUP_WA_PATH, '/r/groupwa');
});

test('manage href maps addon types to usable routes', () => {
	assert.equal(manageHrefForAddon('santri_unlimited'), '/dashboard/kelola-santri');
	assert.equal(manageHrefForAddon('lembaga_tambahan'), '/lembaga/tambah');
	assert.equal(manageHrefForAddon('modul_masjid', { lembagaSlug: 'al-ikhlas' }), '/org/al-ikhlas/ummah');
});
