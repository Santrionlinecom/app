import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { dispatchPaymentSuccessNotificationsBestEffort } from './payment-success-notifications.ts';

const input = {
	db: {} as never,
	fetchFn: fetch,
	env: {},
	orderId: 'SOA-BEST-EFFORT',
	userId: 'user-1',
	packageName: 'Top Up Koin',
	productSlug: 'coin_100',
	grossAmount: 50_000
};

test('notification provider failures are isolated from payment settlement', async () => {
	let calls = 0;
	const outcomes = await dispatchPaymentSuccessNotificationsBestEffort(input, [
		async () => {
			calls += 1;
			throw new Error('WhatsApp provider unavailable');
		},
		async () => {
			calls += 1;
			return { status: 'failed', code: 'email_provider_unavailable' };
		}
	]);

	assert.equal(calls, 2);
	assert.deepEqual(outcomes, [
		{
			channel: 'whatsapp',
			result: { status: 'unexpected_error', code: 'unexpected_error' }
		},
		{
			channel: 'email',
			result: { status: 'failed', code: 'email_provider_unavailable' }
		}
	]);
});
