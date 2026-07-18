import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	adminBookPublishLabel,
	canAdminPublishBook,
	canManagePublishedBookChapters,
	defaultPublishedThrough
} from './moderation-policy.ts';

test('super admin can publish a draft, pending, or rejected book from the canonical moderation page', () => {
	assert.equal(canAdminPublishBook('draft'), true);
	assert.equal(canAdminPublishBook('pending'), true);
	assert.equal(canAdminPublishBook('rejected'), true);
	assert.equal(canAdminPublishBook('published'), false);
	assert.equal(canAdminPublishBook('archived'), false);
});

test('publish button label distinguishes approval from direct publishing', () => {
	assert.equal(adminBookPublishLabel('pending'), 'Approve dan Terbitkan');
	assert.equal(adminBookPublishLabel('draft'), 'Terbitkan Buku');
	assert.equal(adminBookPublishLabel('rejected'), 'Terbitkan Ulang');
});

test('chapter release remains manageable after the parent book is published', () => {
	assert.equal(canManagePublishedBookChapters('draft'), true);
	assert.equal(canManagePublishedBookChapters('rejected'), true);
	assert.equal(canManagePublishedBookChapters('published'), true);
	assert.equal(canManagePublishedBookChapters('pending'), false);
	assert.equal(canManagePublishedBookChapters('archived'), false);
});

test('draft books default to a safe three-chapter release', () => {
	assert.equal(defaultPublishedThrough('draft', 100, 100), 3);
	assert.equal(defaultPublishedThrough('draft', 1, 2), 2);
	assert.equal(defaultPublishedThrough('pending', 7, 100), 7);
});
