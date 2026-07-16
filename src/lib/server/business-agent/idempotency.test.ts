import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { normalizeBusinessIdempotencyKey } from './idempotency.ts';

test('idempotency key accepts bounded opaque identifiers', () => {
	assert.equal(normalizeBusinessIdempotencyKey('agent-run_2026:request-0001'), 'agent-run_2026:request-0001');
});

test('idempotency key rejects missing, short, oversized, or unsafe values', () => {
	assert.equal(normalizeBusinessIdempotencyKey(null), null);
	assert.equal(normalizeBusinessIdempotencyKey('short'), null);
	assert.equal(normalizeBusinessIdempotencyKey('x'.repeat(129)), null);
	assert.equal(normalizeBusinessIdempotencyKey('valid-length-but-has spaces'), null);
});
