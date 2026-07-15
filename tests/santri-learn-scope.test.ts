import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveLearnLembagaId } from '../src/lib/server/santri-learn-scope.ts';

test('akun tanpa lembaga tetap mendapat akses ke kurikulum global', () => {
	assert.equal(resolveLearnLembagaId({ orgId: null }), null);
});

test('anggota lembaga mempertahankan scope lembaganya', () => {
	assert.equal(resolveLearnLembagaId({ orgId: 'tpq-pendem' }), 'tpq-pendem');
});
