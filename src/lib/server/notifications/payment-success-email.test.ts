import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	getPaymentEmailConfig,
	isPaymentEmailNotificationEnabled,
	notifyPaymentSuccessEmail,
	paymentSuccessEmailDeliveryId
} from './payment-success-email.ts';

const configuredEnv = {
	PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'true',
	RESEND_API_KEY: 'synthetic-resend-key',
	PAYMENT_EMAIL_FROM: 'SantriOnline <transaksi@example.test>',
	PUBLIC_BASE_URL: 'https://app.santrionline.com'
};

test('transactional payment email is enabled only by explicit feature flag', () => {
	assert.equal(isPaymentEmailNotificationEnabled({}), false);
	assert.equal(isPaymentEmailNotificationEnabled({ PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'false' }), false);
	assert.equal(isPaymentEmailNotificationEnabled({ PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: ' TRUE ' }), true);
});

test('payment email config requires provider key and sender', () => {
	assert.equal(getPaymentEmailConfig({ PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'true' }), null);
	assert.deepEqual(getPaymentEmailConfig(configuredEnv), {
		apiKey: 'synthetic-resend-key',
		from: 'SantriOnline <transaksi@example.test>',
		baseUrl: 'https://app.santrionline.com'
	});
});

test('disabled transactional email does not touch DB or provider', async () => {
	let dbCalls = 0;
	let providerCalls = 0;
	const result = await notifyPaymentSuccessEmail({
		db: {
			prepare() {
				dbCalls += 1;
				throw new Error('DB must not be touched while email is disabled');
			}
		} as never,
		fetchFn: (async () => {
			providerCalls += 1;
			throw new Error('Provider must not be called while email is disabled');
		}) as typeof fetch,
		env: { ...configuredEnv, PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'false' },
		orderId: 'SOA-EMAIL-DISABLED',
		userId: 'user-1',
		packageName: 'Paket Koin',
		productSlug: 'coin_100',
		grossAmount: 50_000
	});
	assert.deepEqual(result, { status: 'skipped', reason: 'disabled' });
	assert.equal(dbCalls, 0);
	assert.equal(providerCalls, 0);
});

test('payment success email uses an idempotent delivery claim', async () => {
	let status: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	let attempts = 0;
	let providerCalls = 0;
	const db = {
		prepare(sql: string) {
			const statement = {
				bind() {
					return statement;
				},
				async first() {
					if (sql.includes('FROM users')) {
						return { username: 'Ahmad', email: 'AHMAD@example.test' };
					}
					if (sql.includes('FROM payment_notification_deliveries')) {
						return status ? { status, attempts, updatedAt: Date.now() } : null;
					}
					return null;
				},
				async run() {
					if (sql.includes('INSERT OR IGNORE INTO payment_notification_deliveries')) {
						if (!status) status = 'pending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'sending'")) {
						if ((status === 'pending' || status === 'failed') && attempts < 3) {
							status = 'sending';
							attempts += 1;
							return { meta: { changes: 1 } };
						}
						return { meta: { changes: 0 } };
					}
					if (sql.includes("SET status = 'sent'")) status = 'sent';
					return { meta: { changes: 0 } };
				}
			};
			return statement;
		}
	};
	const input = {
		db: db as never,
		fetchFn: (async (_url: string | URL | Request, init?: RequestInit) => {
			providerCalls += 1;
			const body = JSON.parse(String(init?.body)) as { to: string[]; subject: string; html: string };
			assert.deepEqual(body.to, ['ahmad@example.test']);
			assert.match(body.subject, /Pembayaran berhasil/);
			assert.match(body.html, /SOA-EMAIL-1/);
			return new Response(JSON.stringify({ id: 'email.once' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}) as typeof fetch,
		env: configuredEnv,
		orderId: 'SOA-EMAIL-1',
		userId: 'user-1',
		packageName: 'Top Up Koin',
		productSlug: 'coin_100',
		grossAmount: 50_000
	};

	assert.deepEqual(await notifyPaymentSuccessEmail(input), { status: 'sent', messageId: 'email.once' });
	assert.deepEqual(await notifyPaymentSuccessEmail(input), { status: 'duplicate' });
	assert.equal(providerCalls, 1);
	assert.equal(paymentSuccessEmailDeliveryId('SOA-EMAIL-1'), 'email:payment_success:SOA-EMAIL-1');
});

test('provider failure is recorded as notification failure without throwing', async () => {
	let status: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	let attempts = 0;
	const db = {
		prepare(sql: string) {
			const statement = {
				bind() {
					return statement;
				},
				async first() {
					if (sql.includes('FROM users')) return { username: null, email: 'user@example.test' };
					if (sql.includes('FROM payment_notification_deliveries')) {
						return status ? { status, attempts, updatedAt: Date.now() } : null;
					}
					return null;
				},
				async run() {
					if (sql.includes('INSERT OR IGNORE INTO payment_notification_deliveries')) {
						if (!status) status = 'pending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'sending'")) {
						status = 'sending';
						attempts += 1;
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'failed'")) status = 'failed';
					return { meta: { changes: 0 } };
				}
			};
			return statement;
		}
	};

	const result = await notifyPaymentSuccessEmail({
		db: db as never,
		fetchFn: (async () => new Response('{}', { status: 503 })) as typeof fetch,
		env: configuredEnv,
		orderId: 'SOA-EMAIL-FAIL',
		userId: 'user-1',
		packageName: 'Top Up Koin',
		productSlug: 'coin_100',
		grossAmount: 50_000
	});
	assert.deepEqual(result, { status: 'failed', code: 'resend_http_503' });
	assert.equal(status, 'failed');
});
