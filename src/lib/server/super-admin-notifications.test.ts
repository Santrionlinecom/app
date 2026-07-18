import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { dedupeSuperAdminNotifications } from './super-admin-notifications.ts';

test('deduplicates notifications by stable event id and keeps the newest item', () => {
	const items = [
		{ id: 'register:1', kind: 'register', severity: 'info' as const, title: 'lama', body: 'A', href: '/', createdAt: 10 },
		{ id: 'register:1', kind: 'register', severity: 'info' as const, title: 'baru', body: 'A', href: '/', createdAt: 20 },
		{ id: 'book:1', kind: 'book', severity: 'urgent' as const, title: 'Buku', body: 'B', href: '/buku', createdAt: 15 }
	];

	const result = dedupeSuperAdminNotifications(items);
	assert.equal(result.length, 2);
	assert.equal(result.find((item) => item.id === 'register:1')?.title, 'baru');
});
