import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	getRegistrationEmailConfig,
	notifyRegistrationEmail,
	registrationEmailDeliveryId
} from './registration-email.ts';

const configuredEnv = {
	REGISTRATION_EMAIL_NOTIFICATIONS_ENABLED: 'true',
	RESEND_API_KEY: 'synthetic-resend-key',
	REGISTRATION_EMAIL_FROM: 'SantriOnline <salam@example.test>',
	PUBLIC_BASE_URL: 'https://app.santrionline.com'
};

test('registration email config reuses payment sender when a dedicated sender is absent', () => {
	assert.deepEqual(
		getRegistrationEmailConfig({ ...configuredEnv, REGISTRATION_EMAIL_FROM: undefined, PAYMENT_EMAIL_FROM: 'SantriOnline <transaksi@example.test>' }),
		{
			apiKey: 'synthetic-resend-key',
			from: 'SantriOnline <transaksi@example.test>',
			baseUrl: 'https://app.santrionline.com'
		}
	);
});

test('registration email sends once with a stable provider idempotency key', async () => {
	let status: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	let providerCalls = 0;
	const preparedSql: string[] = [];
	const db = {
		prepare(sql: string) {
			preparedSql.push(sql);
			const statement = {
				bind() { return statement; },
				async first() {
					if (sql.includes('FROM registration_email_deliveries')) {
						return status ? { status, attempts: 1, updatedAt: Date.now() } : null;
					}
					return null;
				},
				async run() {
					if (sql.includes('CREATE TABLE')) return { meta: { changes: 0 } };
					if (sql.includes('INSERT OR IGNORE')) {
						if (!status) status = 'pending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'sending'")) {
						if (status === 'pending' || status === 'failed') {
							status = 'sending';
							return { meta: { changes: 1 } };
						}
						return { meta: { changes: 0 } };
					}
					if (sql.includes("SET status = 'sent'")) status = 'sent';
					if (sql.includes("SET status = 'failed'")) status = 'failed';
					return { meta: { changes: 1 } };
				}
			};
			return statement;
		}
	};
	const input = {
		db: db as never,
		fetchFn: (async (_url: string | URL | Request, init?: RequestInit) => {
			providerCalls += 1;
			assert.equal(new Headers(init?.headers).get('Idempotency-Key'), 'email:registration:user-1');
			const body = JSON.parse(String(init?.body)) as { to: string[]; subject: string };
			assert.deepEqual(body.to, ['ahmad@example.test']);
			assert.match(body.subject, /Selamat datang/);
			return new Response(JSON.stringify({ id: 'registration.once' }), { status: 200 });
		}) as typeof fetch,
		env: configuredEnv,
		userId: 'user-1',
		name: 'Ahmad',
		email: 'AHMAD@example.test',
		role: 'santri',
		organizationName: 'TPQ Al-Ikhlas'
	};

	assert.deepEqual(await notifyRegistrationEmail(input), { status: 'sent', messageId: 'registration.once' });
	assert.deepEqual(await notifyRegistrationEmail(input), { status: 'duplicate' });
	assert.equal(providerCalls, 1);
	assert.equal(registrationEmailDeliveryId('user-1'), 'email:registration:user-1');
	assert.equal(preparedSql.some((sql) => sql.includes("CHECK (status IN ('pending', 'sending', 'sent', 'failed'))")), true);
	assert.equal(preparedSql.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_registration_email_deliveries_status_updated')), true);
});

test('provider failure is returned as data and never thrown into registration flow', async () => {
	let status: 'pending' | 'sending' | 'sent' | 'failed' | null = null;
	const db = {
		prepare(sql: string) {
			const statement = {
				bind() { return statement; },
				async first() { return status ? { status, attempts: 1, updatedAt: Date.now() } : null; },
				async run() {
					if (sql.includes('INSERT OR IGNORE')) status ||= 'pending';
					if (sql.includes("SET status = 'sending'")) { status = 'sending'; return { meta: { changes: 1 } }; }
					if (sql.includes("SET status = 'failed'")) status = 'failed';
					return { meta: { changes: 1 } };
				}
			};
			return statement;
		}
	};
	const result = await notifyRegistrationEmail({
		db: db as never,
		fetchFn: (async () => new Response('{}', { status: 503 })) as typeof fetch,
		env: configuredEnv,
		userId: 'user-fail',
		name: 'Fatimah',
		email: 'fatimah@example.test',
		role: 'santri'
	});
	assert.deepEqual(result, { status: 'failed', code: 'resend_http_503' });
	assert.equal(status, 'failed');
});
