import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { isSuccessfulMidtransTransaction, mapMidtransPaymentStatus } from './midtrans-status.ts';

test('settlement is successful without fraud metadata', () => {
	assert.equal(isSuccessfulMidtransTransaction('settlement', ''), true);
});

test('capture is successful only when fraud status is accept', () => {
	assert.equal(isSuccessfulMidtransTransaction('capture', 'accept'), true);
	assert.equal(isSuccessfulMidtransTransaction('capture', 'challenge'), false);
	assert.equal(isSuccessfulMidtransTransaction('capture', ''), false);
});

test('Midtrans statuses map to internal payment statuses safely', () => {
	assert.equal(mapMidtransPaymentStatus('settlement', ''), 'sukses');
	assert.equal(mapMidtransPaymentStatus('capture', 'accept'), 'sukses');
	assert.equal(mapMidtransPaymentStatus('capture', 'challenge'), 'pending');
	assert.equal(mapMidtransPaymentStatus('expire', ''), 'expired');
	assert.equal(mapMidtransPaymentStatus('cancel', ''), 'canceled');
	assert.equal(mapMidtransPaymentStatus('deny', ''), 'denied');
	assert.equal(mapMidtransPaymentStatus('refund', ''), 'refunded');
	assert.equal(mapMidtransPaymentStatus('failure', ''), 'gagal');
	assert.equal(mapMidtransPaymentStatus('unknown', ''), 'pending');
});
