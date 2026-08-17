import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import { notifyRegistrationEmail } from '../src/lib/server/notifications/registration-email';

/**
 * Diagnosis kegagalan email.
 *
 * Sebelum ini kode hanya menyimpan `resend_http_403` tanpa pesan aslinya.
 * Padahal Resend memakai 403 untuk tiga sebab yang penanganannya berbeda:
 *
 *   invalid_api_key   -> kunci salah, buat ulang di dashboard
 *   validation_error  -> domain belum diverifikasi di resend.com/domains
 *   validation_error  -> mode uji: hanya boleh kirim ke email sendiri
 *
 * Tanpa pesan aslinya, ketiganya tampak sama dan tidak bisa diperbaiki
 * tanpa menebak. Test ini mengunci agar sebabnya ikut tercatat.
 */

const envSiap = {
	RESEND_API_KEY: 'kunci-uji',
	REGISTRATION_EMAIL_FROM: 'SantriOnline <noreply@santrionline.com>',
	REGISTRATION_EMAIL_NOTIFICATIONS_ENABLED: 'true'
};

/** Basis data tiruan yang merekam nilai yang di-bind. */
const buatDb = () => {
	const terikat: unknown[][] = [];
	let status: string | null = null;
	const db = {
		prepare(sql: string) {
			const statement = {
				bind(...args: unknown[]) {
					if (sql.includes("SET status = 'failed'")) terikat.push(args);
					return statement;
				},
				async first() {
					return status ? { status, attempts: 1, updatedAt: Date.now() } : null;
				},
				async run() {
					if (sql.includes('INSERT OR IGNORE')) status ||= 'pending';
					if (sql.includes("SET status = 'sending'")) {
						status = 'sending';
						return { meta: { changes: 1 } };
					}
					if (sql.includes("SET status = 'failed'")) status = 'failed';
					return { meta: { changes: 1 } };
				}
			};
			return statement;
		}
	};
	return { db, terikat };
};

const jawabanResend = (status: number, body: unknown) =>
	(async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

test('403 kunci tidak valid tercatat beserta sebabnya', async () => {
	const { db, terikat } = buatDb();
	const hasil = await notifyRegistrationEmail({
		db: db as never,
		fetchFn: jawabanResend(403, { name: 'invalid_api_key', message: 'API key is invalid' }),
		env: envSiap,
		userId: 'u-kunci',
		name: 'Ahmad',
		email: 'ahmad@example.test',
		role: 'santri'
	});

	assert.equal(hasil.status, 'failed');
	assert.equal(
		'code' in hasil && hasil.code,
		'resend_invalid_api_key',
		'sebab spesifik wajib menggantikan kode status generik'
	);
	const tersimpan = JSON.stringify(terikat);
	assert.match(tersimpan, /invalid_api_key/, 'sebab wajib tersimpan ke basis data');
});

test('403 domain belum diverifikasi dibedakan dari kunci salah', async () => {
	const { db } = buatDb();
	const hasil = await notifyRegistrationEmail({
		db: db as never,
		fetchFn: jawabanResend(403, {
			name: 'validation_error',
			message: 'The santrionline.com domain is not verified. Please, add and verify your domain.'
		}),
		env: envSiap,
		userId: 'u-domain',
		name: 'Siti',
		email: 'siti@example.test',
		role: 'santri'
	});

	assert.equal(hasil.status, 'failed');
	assert.equal('code' in hasil && hasil.code, 'resend_validation_error');
});

test('galat tanpa nama tetap memakai kode status sebagai cadangan', async () => {
	const { db } = buatDb();
	const hasil = await notifyRegistrationEmail({
		db: db as never,
		fetchFn: jawabanResend(503, {}),
		env: envSiap,
		userId: 'u-503',
		name: 'Umar',
		email: 'umar@example.test',
		role: 'santri'
	});

	assert.equal(hasil.status, 'failed');
	assert.equal('code' in hasil && hasil.code, 'resend_http_503');
});

test('pesan galat disimpan agar bisa didiagnosis tanpa menebak', async () => {
	const { db, terikat } = buatDb();
	await notifyRegistrationEmail({
		db: db as never,
		fetchFn: jawabanResend(403, {
			name: 'validation_error',
			message: 'You can only send testing emails to your own email address'
		}),
		env: envSiap,
		userId: 'u-pesan',
		name: 'Ali',
		email: 'ali@example.test',
		role: 'santri'
	});

	const tersimpan = JSON.stringify(terikat);
	assert.match(
		tersimpan,
		/only send testing emails/,
		'pesan asli Resend wajib ikut tersimpan'
	);
});
