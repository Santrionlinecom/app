import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	digitalPurchaseEmailDeliveryId,
	getDigitalPurchaseEmailConfig,
	notifyDigitalPurchaseEmail
} from './digital-purchase-email.ts';

const configuredEnv = {
	DIGITAL_PURCHASE_EMAIL_NOTIFICATIONS_ENABLED: 'true',
	RESEND_API_KEY: 'synthetic-resend-key',
	TRANSACTIONAL_EMAIL_FROM: 'SantriOnline <transaksi@example.test>',
	PUBLIC_BASE_URL: 'https://app.santrionline.com'
};

test('digital purchase email can reuse the verified registration sender', () => {
	assert.equal(getDigitalPurchaseEmailConfig({
		RESEND_API_KEY: 'synthetic-resend-key',
		REGISTRATION_EMAIL_FROM: 'SantriOnline <salam@example.test>'
	})?.from, 'SantriOnline <salam@example.test>');
});

const createDb = (canonicalEmail = 'OWNER@example.test') => {
	let status: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	let attempts = 0;
	const db = {
		prepare(sql: string) {
			let bindings: unknown[] = [];
			const statement = {
				bind(...values: unknown[]) { bindings = values; return statement; },
				async first() {
					if (sql.includes('FROM users')) return { username: '<Owner & Co>', email: canonicalEmail };
					if (sql.includes('FROM payment_notification_deliveries')) return status ? { status, attempts, updatedAt: Date.now() } : null;
					return null;
				},
				async run() {
					if (sql.includes('INSERT OR IGNORE INTO payment_notification_deliveries')) {
						if (!status) status = 'pending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'sending'")) {
						if ((status === 'pending' || status === 'failed') && attempts < 3) {
							status = 'sending'; attempts += 1; return { meta: { changes: 1 } };
						}
						return { meta: { changes: 0 } };
					}
					if (sql.includes("SET status = 'sent'")) status = 'sent';
					if (sql.includes("SET status = 'failed'")) status = 'failed';
					void bindings;
					return { meta: { changes: 1 } };
				}
			};
			return statement;
		}
	};
	return { db: db as never, getStatus: () => status };
};

const baseInput = (db: never, fetchFn: typeof fetch, env: object = configuredEnv) => ({
	db,
	fetchFn,
	env,
	orderId: 'sale-123',
	userId: 'user-1',
	productTitle: 'SantriPrint <Pro>',
	referenceCode: 'SO-COIN-ABC123',
	coinAmount: 600,
	licensePackage: 'bantuan' as const
});

test('missing digital purchase email config skips before DB and provider access', async () => {
	let touched = false;
	const result = await notifyDigitalPurchaseEmail(baseInput({ prepare() { touched = true; throw new Error('no DB'); } } as never, (async () => { touched = true; throw new Error('no provider'); }) as typeof fetch, { DIGITAL_PURCHASE_EMAIL_NOTIFICATIONS_ENABLED: 'true' }));
	assert.deepEqual(result, { status: 'skipped', reason: 'not_configured' });
	assert.equal(touched, false);
	assert.equal(getDigitalPurchaseEmailConfig({ ...configuredEnv, TRANSACTIONAL_EMAIL_FROM: undefined, PAYMENT_EMAIL_FROM: 'Legacy <legacy@example.test>' })?.from, 'Legacy <legacy@example.test>');
});

test('successful digital purchase email uses canonical user email, safe URL, escaped HTML, and sends once on replay', async () => {
	const { db } = createDb();
	let providerCalls = 0;
	const fetchFn = (async (_url: string | URL | Request, init?: RequestInit) => {
		providerCalls += 1;
		assert.equal(new Headers(init?.headers).get('Idempotency-Key'), digitalPurchaseEmailDeliveryId('sale-123'));
		const body = JSON.parse(String(init?.body)) as { to: string[]; text: string; html: string };
		assert.deepEqual(body.to, ['owner@example.test']);
		assert.match(body.text, /SantriPrint <Pro>/);
		assert.match(body.text, /SO-COIN-ABC123/);
		assert.match(body.text, /600 Coin/);
		assert.match(body.text, /status: paid/i);
		assert.match(body.text, /tim Bantuan/i);
		assert.match(body.text, /https:\/\/app\.santrionline\.com\/digital-store\/order\/SO-COIN-ABC123/);
		assert.doesNotMatch(body.text + body.html, /access[_ -]?token|\?token=|sale-secret/i);
		assert.match(body.html, /SantriPrint &lt;Pro&gt;/);
		assert.match(body.html, /&lt;Owner &amp; Co&gt;/);
		assert.match(body.html, /Lisensi dan unduhan/);
		return new Response(JSON.stringify({ id: 'email.digital.once' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	}) as typeof fetch;
	const input = baseInput(db, fetchFn);
	assert.deepEqual(await notifyDigitalPurchaseEmail(input), { status: 'sent', messageId: 'email.digital.once' });
	assert.deepEqual(await notifyDigitalPurchaseEmail(input), { status: 'duplicate' });
	assert.equal(providerCalls, 1);
});

test('provider failure is swallowed and leaves delivery failed for retry', async () => {
	const { db, getStatus } = createDb();
	const result = await notifyDigitalPurchaseEmail(baseInput(db, (async () => new Response('{}', { status: 503 })) as typeof fetch));
	assert.deepEqual(result, { status: 'failed', code: 'resend_http_503' });
	assert.equal(getStatus(), 'failed');
});
