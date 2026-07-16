import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { createPayloadHash, stableJson } from './integrity.ts';

test('stableJson is deterministic regardless of object key order', () => {
	assert.equal(
		stableJson({ total: 150000, package: 'pro', items: [{ quantity: 1, slug: 'academy' }] }),
		stableJson({ items: [{ slug: 'academy', quantity: 1 }], package: 'pro', total: 150000 })
	);
});

test('approval payload hash changes when financial intent changes', async () => {
	const approved = await createPayloadHash({ quoteId: 'quote-1', total: 150000, currency: 'IDR' });
	const changed = await createPayloadHash({ quoteId: 'quote-1', total: 175000, currency: 'IDR' });
	assert.notEqual(approved, changed);
	assert.match(approved, /^[a-f0-9]{64}$/);
});
