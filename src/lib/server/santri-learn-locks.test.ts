import assert from 'node:assert/strict';
import test from 'node:test';

import { applyTrackLocks } from './santri-learn-locks.ts';

test('first module in every learning track is open independently', () => {
	const modules = applyTrackLocks([
		{ id: 'aqidah-01', pathKey: 'aqidah_aswaja', status: 'belum' },
		{ id: 'adab-01', pathKey: 'adab', status: 'belum' },
		{ id: 'arabic-01', pathKey: 'arabic_nahwu', status: 'selesai' },
		{ id: 'arabic-02', pathKey: 'arabic_nahwu', status: 'belum' },
		{ id: 'adab-02', pathKey: 'adab', status: 'belum' }
	]);

	assert.equal(modules.find((module) => module.id === 'aqidah-01')?.locked, false);
	assert.equal(modules.find((module) => module.id === 'adab-01')?.locked, false);
	assert.equal(modules.find((module) => module.id === 'arabic-01')?.locked, false);
	assert.equal(modules.find((module) => module.id === 'arabic-02')?.locked, false);
	assert.equal(modules.find((module) => module.id === 'adab-02')?.locked, true);
});
