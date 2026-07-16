import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrganizationStatusTransitionError } from './organizations';

test('pending organization with an admin can be activated', () => {
	assert.equal(getOrganizationStatusTransitionError('pending', 'active', 1), null);
});

test('pending organization without an admin cannot be activated', () => {
	assert.equal(
		getOrganizationStatusTransitionError('pending', 'active', 0),
		'Lembaga harus memiliki admin sebelum diaktifkan.'
	);
});

test('pending organization can be rejected without an admin', () => {
	assert.equal(getOrganizationStatusTransitionError('pending', 'rejected', 0), null);
});

test('only pending organizations can receive an approval decision', () => {
	assert.equal(
		getOrganizationStatusTransitionError('active', 'rejected', 1),
		'Hanya lembaga berstatus pending yang dapat diproses.'
	);
});

test('organization approval rejects unsupported target statuses', () => {
	assert.equal(
		getOrganizationStatusTransitionError('pending', 'pending' as 'active', 1),
		'Status tujuan lembaga tidak valid.'
	);
});
