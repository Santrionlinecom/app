import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	getWhatsAppCloudConfig,
	isRetryablePaymentNotificationResult,
	notifyPaymentSuccess,
	paymentSuccessDeliveryId
} from './payment-success-notifier.ts';

test('getWhatsAppCloudConfig returns null when required secrets are absent', () => {
	assert.equal(getWhatsAppCloudConfig({}), null);
	assert.equal(
		getWhatsAppCloudConfig({
			WHATSAPP_ACCESS_TOKEN: 'token',
			WHATSAPP_PHONE_NUMBER_ID: ''
		}),
		null
	);
});

test('getWhatsAppCloudConfig uses explicit production configuration', () => {
	assert.deepEqual(
		getWhatsAppCloudConfig({
			WHATSAPP_ACCESS_TOKEN: 'token',
			WHATSAPP_PHONE_NUMBER_ID: '123456789',
			WHATSAPP_GRAPH_API_VERSION: 'v23.0',
			WHATSAPP_PAYMENT_SUCCESS_TEMPLATE: 'santrionline_payment_success',
			WHATSAPP_TEMPLATE_LANGUAGE: 'id'
		}),
		{
			accessToken: 'token',
			phoneNumberId: '123456789',
			graphApiVersion: 'v23.0',
			templateName: 'santrionline_payment_success',
			languageCode: 'id'
		}
	);
});

test('paymentSuccessDeliveryId is deterministic and channel scoped', () => {
	assert.equal(paymentSuccessDeliveryId('SOA-123'), 'whatsapp:payment_success:SOA-123');
});

test('only transient delivery outcomes request a webhook retry', () => {
	assert.equal(isRetryablePaymentNotificationResult({ status: 'failed', code: 'timeout' }), true);
	assert.equal(
		isRetryablePaymentNotificationResult({ status: 'skipped', reason: 'not_configured' }),
		true
	);
	assert.equal(
		isRetryablePaymentNotificationResult({ status: 'skipped', reason: 'invalid_recipient' }),
		false
	);
	assert.equal(isRetryablePaymentNotificationResult({ status: 'sent', messageId: 'wamid.1' }), false);
	assert.equal(isRetryablePaymentNotificationResult({ status: 'in_progress' }), true);
	assert.equal(isRetryablePaymentNotificationResult({ status: 'exhausted' }), false);
	assert.equal(isRetryablePaymentNotificationResult({ status: 'duplicate' }), false);
});

test('notifyPaymentSuccess keeps a fresh sending claim retryable without sending twice', async () => {
	let graphCalls = 0;
	const db = {
		prepare(sql: string) {
			const statement = {
				bind() {
					return statement;
				},
				async first() {
					if (sql.includes('FROM users')) {
						return { username: 'Ahmad', email: 'ahmad@example.test', whatsapp: '081234567890' };
					}
					if (sql.includes('FROM payment_notification_deliveries')) {
						return { status: 'sending', attempts: 1, updatedAt: Date.now() };
					}
					return null;
				},
				async run() {
					if (sql.includes("SET status = 'sending'")) return { meta: { changes: 0 } };
					return { meta: { changes: 0 } };
				}
			};
			return statement;
		}
	};

	const result = await notifyPaymentSuccess({
		db: db as never,
		fetchFn: (async () => {
			graphCalls += 1;
			throw new Error('Graph API must not be called by the losing claimant');
		}) as typeof fetch,
		env: {
			WHATSAPP_ACCESS_TOKEN: 'token',
			WHATSAPP_PHONE_NUMBER_ID: '123456789',
			WHATSAPP_GRAPH_API_VERSION: 'v23.0',
			WHATSAPP_PAYMENT_SUCCESS_TEMPLATE: 'santrionline_payment_success',
			WHATSAPP_TEMPLATE_LANGUAGE: 'id'
		},
		orderId: 'SOA-IN-PROGRESS',
		userId: 'user-1',
		packageName: 'Paket Koin',
		productSlug: 'coin_100',
		grossAmount: 50_000
	});

	assert.deepEqual(result, { status: 'in_progress' });
	assert.equal(graphCalls, 0);
});

test('notifyPaymentSuccess sends only once when the same order is replayed', async () => {
	let deliveryStatus: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	let attempts = 0;
	let graphCalls = 0;
	const db = {
		prepare(sql: string) {
			let args: unknown[] = [];
			const statement = {
				bind(...values: unknown[]) {
					args = values;
					return statement;
				},
				async first() {
					if (sql.includes('FROM users')) {
						return { username: 'Ahmad', email: 'ahmad@example.test', whatsapp: '081234567890' };
					}
					if (sql.includes('FROM payment_notification_deliveries')) {
						return deliveryStatus
							? { status: deliveryStatus, attempts, updatedAt: Date.now() }
							: null;
					}
					return null;
				},
				async run() {
					if (sql.includes('INSERT OR IGNORE INTO payment_notification_deliveries')) {
						if (!deliveryStatus) deliveryStatus = 'pending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'sending'")) {
						if ((deliveryStatus === 'pending' || deliveryStatus === 'failed') && attempts < 3) {
							deliveryStatus = 'sending';
							attempts += 1;
							return { meta: { changes: 1 } };
						}
						return { meta: { changes: 0 } };
					}
					if (sql.includes("SET status = 'sent'")) deliveryStatus = 'sent';
					void args;
					return { meta: { changes: 0 } };
				}
			};
			return statement;
		}
	};
	const input = {
		db: db as never,
		fetchFn: (async () => {
			graphCalls += 1;
			return new Response(JSON.stringify({ messages: [{ id: 'wamid.once' }] }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}) as typeof fetch,
		env: {
			WHATSAPP_ACCESS_TOKEN: 'token',
			WHATSAPP_PHONE_NUMBER_ID: '123456789',
			WHATSAPP_GRAPH_API_VERSION: 'v23.0',
			WHATSAPP_PAYMENT_SUCCESS_TEMPLATE: 'santrionline_payment_success',
			WHATSAPP_TEMPLATE_LANGUAGE: 'id'
		},
		orderId: 'SOA-123',
		userId: 'user-1',
		packageName: 'Paket Koin',
		productSlug: 'coin_100',
		grossAmount: 50_000
	};

	assert.deepEqual(await notifyPaymentSuccess(input), { status: 'sent', messageId: 'wamid.once' });
	assert.deepEqual(await notifyPaymentSuccess(input), { status: 'duplicate' });
	assert.equal(graphCalls, 1);
});
