import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fetchMidtransTransactionStatus } from './midtrans-status-api.ts';

const serverKey = 'server-key-for-test';

test('fetchMidtransTransactionStatus verifies through the sandbox Status API', async () => {
	let requestedUrl = '';
	let authorization = '';
	const result = await fetchMidtransTransactionStatus({
		fetchFn: async (input, init) => {
			requestedUrl = String(input);
			authorization = new Headers(init?.headers).get('Authorization') ?? '';
			return new Response(
				JSON.stringify({
					order_id: 'COIN-123',
					status_code: '200',
					gross_amount: '50000.00',
					transaction_status: 'settlement',
					fraud_status: 'accept'
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		},
		serverKey,
		isProduction: false,
		orderId: 'COIN-123'
	});

	assert.equal(requestedUrl, 'https://api.sandbox.midtrans.com/v2/COIN-123/status');
	assert.equal(authorization, `Basic ${btoa(`${serverKey}:`)}`);
	assert.deepEqual(result, {
		ok: true,
		orderId: 'COIN-123',
		statusCode: '200',
		grossAmount: '50000.00',
		transactionStatus: 'settlement',
		fraudStatus: 'accept'
	});
});

test('fetchMidtransTransactionStatus uses production host and URL-encodes order ID', async () => {
	let requestedUrl = '';
	await fetchMidtransTransactionStatus({
		fetchFn: async (input) => {
			requestedUrl = String(input);
			return new Response('{}', { status: 404 });
		},
		serverKey,
		isProduction: true,
		orderId: 'ORDER/123'
	});
	assert.equal(requestedUrl, 'https://api.midtrans.com/v2/ORDER%2F123/status');
});

test('fetchMidtransTransactionStatus rejects incomplete success payloads', async () => {
	const result = await fetchMidtransTransactionStatus({
		fetchFn: async () =>
			new Response(JSON.stringify({ transaction_status: 'settlement' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}),
		serverKey,
		isProduction: false,
		orderId: 'COIN-123'
	});
	assert.deepEqual(result, { ok: false, code: 'invalid_response' });
});

test('fetchMidtransTransactionStatus returns bounded provider failures without exposing key', async () => {
	const result = await fetchMidtransTransactionStatus({
		fetchFn: async () => new Response(JSON.stringify({ status_code: '404' }), { status: 404 }),
		serverKey,
		isProduction: false,
		orderId: 'COIN-123'
	});
	assert.deepEqual(result, { ok: false, code: 'http_404' });
	assert.equal(JSON.stringify(result).includes(serverKey), false);
});