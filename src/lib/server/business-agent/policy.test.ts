import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { evaluateBusinessAction } from './policy.ts';

const base = {
	actorType: 'admin' as const,
	actorId: 'admin-1',
	requestedBy: 'agent-1',
	hasValidApproval: false,
	paymentVerified: false,
	killSwitchActive: false
};

test('read and internal drafts are allowed without financial approval', () => {
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'read' }), { allowed: true, reason: 'allowed' });
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'create_lead' }), {
		allowed: true,
		reason: 'allowed'
	});
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'create_quote_draft' }), {
		allowed: true,
		reason: 'allowed'
	});
});

test('maker cannot approve their own request', () => {
	assert.deepEqual(
		evaluateBusinessAction({
			...base,
			action: 'approve_quote',
			actorId: 'agent-1',
			requestedBy: 'agent-1'
		}),
		{ allowed: false, reason: 'self_approval_forbidden' }
	);
});

test('invoice creation requires a valid payload-bound approval', () => {
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'create_midtrans_invoice' }), {
		allowed: false,
		reason: 'approval_required'
	});
	assert.deepEqual(
		evaluateBusinessAction({
			...base,
			action: 'create_midtrans_invoice',
			hasValidApproval: true
		}),
		{ allowed: true, reason: 'allowed' }
	);
});

test('payment state can only be settled by a verified payment webhook', () => {
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'mark_paid' }), {
		allowed: false,
		reason: 'verified_payment_required'
	});
	assert.deepEqual(
		evaluateBusinessAction({
			...base,
			action: 'mark_paid',
			actorType: 'payment_webhook',
			actorId: 'midtrans',
			paymentVerified: true
		}),
		{ allowed: true, reason: 'allowed' }
	);
});

test('kill switch blocks every side effect but keeps reads available', () => {
	assert.deepEqual(
		evaluateBusinessAction({ ...base, action: 'create_quote_draft', killSwitchActive: true }),
		{ allowed: false, reason: 'kill_switch_active' }
	);
	assert.deepEqual(evaluateBusinessAction({ ...base, action: 'read', killSwitchActive: true }), {
		allowed: true,
		reason: 'allowed'
	});
});
