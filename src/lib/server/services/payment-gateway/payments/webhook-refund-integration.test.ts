import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const webhookUrl = new URL('../../../../../routes/api/midtrans/webhook/+server.ts', import.meta.url);

test('Midtrans webhook delegates coin and addon refunds to reversal services', async () => {
	const webhook = await readFile(webhookUrl, 'utf8');
	assert.match(webhook, /reverseApprovedCoinTopup/);
	assert.match(webhook, /paymentStatus === 'refunded'/);
	assert.match(webhook, /reverseAddonPayment/);
});
