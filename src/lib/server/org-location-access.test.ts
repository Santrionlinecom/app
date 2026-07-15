import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { canManageOrgLocation } from './org-location-access.ts';

const actor = (role: string, orgId: string | null = 'org-a', isSuperAdmin = false) => ({ role, orgId, isSuperAdmin });

test('admin can manage coordinates only for their own institution', () => {
	assert.equal(canManageOrgLocation(actor('admin'), 'org-a'), true);
	assert.equal(canManageOrgLocation(actor('admin'), 'org-b'), false);
});

test('non-admin institution roles cannot manage coordinates', () => {
	for (const role of ['santri', 'ustadz', 'tamir', 'bendahara', 'koordinator', 'alumni']) {
		assert.equal(canManageOrgLocation(actor(role), 'org-a'), false, `${role} must be rejected`);
	}
});

test('super admin can manage coordinates across institutions', () => {
	assert.equal(canManageOrgLocation(actor('SUPER_ADMIN', null, true), 'org-b'), true);
});
