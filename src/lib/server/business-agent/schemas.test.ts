import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { approvalDecisionSchema, createLeadSchema, createQuoteSchema } from './schemas.ts';

test('lead schema requires a usable contact and business need', () => {
	assert.equal(
		createLeadSchema.safeParse({
			source: 'telegram',
			contactName: 'Ahmad',
			needSummary: 'Membutuhkan platform kelas TPQ untuk lembaganya.',
			contactWhatsapp: '081234567890'
		}).success,
		true
	);
	assert.equal(
		createLeadSchema.safeParse({
			source: 'telegram',
			contactName: 'A',
			needSummary: 'Pendek',
			contactWhatsapp: ''
		}).success,
		false
	);
});

test('quote schema rejects discounts above subtotal', () => {
	assert.equal(
		createQuoteSchema.safeParse({
			leadId: 'lead-1',
			subtotal: 100000,
			discount: 150000,
			packageSnapshot: { slug: 'academy', name: 'SantriOnline Academy' },
			assumptions: [],
			expiresAt: Date.now() + 86_400_000
		}).success,
		false
	);
});

test('approval decision accepts only approve or reject', () => {
	assert.equal(approvalDecisionSchema.safeParse({ decision: 'approve' }).success, true);
	assert.equal(approvalDecisionSchema.safeParse({ decision: 'cancel' }).success, false);
});
