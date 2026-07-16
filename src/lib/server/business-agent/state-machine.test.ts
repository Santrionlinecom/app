import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	assertBusinessTransition,
	canTransitionBusinessState,
	type BusinessAggregate
} from './state-machine.ts';

const allowed: Array<[BusinessAggregate, string, string, string]> = [
	['lead', 'new', 'discovery', 'discovery_started'],
	['lead', 'discovery', 'qualified', 'lead_qualified'],
	['quote', 'draft', 'awaiting_approval', 'approval_requested'],
	['quote', 'awaiting_approval', 'approved', 'approval_granted'],
	['quote', 'revision_required', 'draft', 'quote_revised'],
	['order', 'created', 'awaiting_payment', 'invoice_created'],
	['order', 'awaiting_payment', 'paid', 'payment_verified'],
	['order', 'paid', 'provisioning', 'provisioning_started'],
	['order', 'provisioning', 'active', 'provisioning_completed']
];

test('allows only explicit business transitions', () => {
	for (const [aggregate, from, to, event] of allowed) {
		assert.equal(canTransitionBusinessState({ aggregate, from, to, event }), true);
	}
});

test('rejects skipped, backwards, and arbitrary status transitions', () => {
	assert.equal(
		canTransitionBusinessState({
			aggregate: 'quote',
			from: 'draft',
			to: 'approved',
			event: 'approval_granted'
		}),
		false
	);
	assert.equal(
		canTransitionBusinessState({
			aggregate: 'order',
			from: 'awaiting_payment',
			to: 'active',
			event: 'payment_verified'
		}),
		false
	);
	assert.equal(
		canTransitionBusinessState({
			aggregate: 'lead',
			from: 'qualified',
			to: 'new',
			event: 'manual_update'
		}),
		false
	);
});

test('assertBusinessTransition fails closed with a safe error', () => {
	assert.throws(
		() =>
			assertBusinessTransition({
				aggregate: 'quote',
				from: 'draft',
				to: 'sent',
				event: 'quote_sent'
			}),
		/Transisi status bisnis tidak diizinkan/
	);
});
