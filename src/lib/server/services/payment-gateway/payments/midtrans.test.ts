import assert from 'node:assert/strict';
import test from 'node:test';
import { getMidtransSnapScriptUrl, getMidtransSnapTransactionUrl } from './midtrans.ts';

test('Midtrans Snap API and browser script use the same environment', () => {
	assert.equal(getMidtransSnapTransactionUrl(true), 'https://app.midtrans.com/snap/v1/transactions');
	assert.equal(getMidtransSnapScriptUrl(true), 'https://app.midtrans.com/snap/snap.js');
	assert.equal(getMidtransSnapTransactionUrl(false), 'https://app.sandbox.midtrans.com/snap/v1/transactions');
	assert.equal(getMidtransSnapScriptUrl(false), 'https://app.sandbox.midtrans.com/snap/snap.js');
});
