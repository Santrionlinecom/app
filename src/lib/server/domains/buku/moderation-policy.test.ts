import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	adminBookPublishLabel,
	canAdminPublishBook,
	canManagePublishedBookChapters,
	defaultPublishedThrough,
	isValidPublishedThrough
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

test('draft books default to the third actual chapter number even when numbering is sparse', () => {
	assert.equal(defaultPublishedThrough('draft', [10, 20, 30, 40], []), 30);
	assert.equal(defaultPublishedThrough('draft', [10, 20], []), 20);
	assert.equal(defaultPublishedThrough('pending', [10, 20, 30], [10, 20]), 20);
});

test('publish cutoff must be an actual chapter number', () => {
	assert.equal(isValidPublishedThrough([10, 20], 10), true);
	assert.equal(isValidPublishedThrough([10, 20], 2), false);
	assert.equal(isValidPublishedThrough([], 1), false);
});
