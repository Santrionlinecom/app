import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
	coinTransactionEmailDeliveryId,
	getCoinEmailConfig,
	isCoinEmailEnabled,
	notifyCoinTransactionEmail
} from '../src/lib/server/notifications/coin-transaction-email';

const envAktif = {
	PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'true',
	RESEND_API_KEY: 'kunci-sintetis',
	TRANSACTIONAL_EMAIL_FROM: 'SantriOnline <transaksi@contoh.test>',
	PUBLIC_BASE_URL: 'https://contoh.test'
};

const buatDb = (opsi: { klaim?: number; user?: unknown; status?: string } = {}) => {
	const sqlDijalankan: string[] = [];
	let status = opsi.status ?? 'pending';
	return {
		sqlDijalankan,
		prepare(sql: string) {
			sqlDijalankan.push(sql);
			return {
				bind: (...args: unknown[]) => ({
					run: async () => {
						if (sql.includes("SET status = 'sending'")) {
							return { meta: { changes: opsi.klaim ?? 1 } };
						}
						if (sql.includes("SET status = 'sent'")) status = 'sent';
						if (sql.includes("SET status = 'failed'")) status = 'failed';
						return { meta: { changes: 1 } };
					},
					first: async () => {
						if (sql.includes('FROM users')) {
							return opsi.user === undefined
								? { username: 'Ahmad', email: 'santri@contoh.test' }
								: opsi.user;
						}
						if (sql.includes('FROM coin_transaction_email_deliveries')) {
							return { status, attempts: 3, updatedAt: Date.now() };
						}
						return null;
					}
				}),
				run: async () => ({ meta: { changes: 1 } }),
				first: async () => null
			};
		}
	} as never;
};

const masukan = (tambahan: Record<string, unknown> = {}) => ({
	db: buatDb(),
	fetchFn: (async () =>
		new Response(JSON.stringify({ id: 'pesan.sekali' }), { status: 200 })) as never,
	env: envAktif,
	userId: 'user-1',
	transactionId: 'trx-1',
	jenis: 'purchase' as const,
	koin: 150,
	saldoAkhir: 850,
	keterangan: 'Pembelian Kitab Digital',
	...tambahan
});

test('id pengiriman deterministik per transaksi', () => {
	assert.equal(coinTransactionEmailDeliveryId('trx-9'), 'email:coin:trx-9');
});

test('flag mati membuat email dilewati tanpa menyentuh DB', async () => {
	const db = buatDb();
	const hasil = await notifyCoinTransactionEmail(
		masukan({ db, env: { ...envAktif, PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'false' } }) as never
	);
	assert.deepEqual(hasil, { status: 'skipped', reason: 'disabled' });
	assert.equal((db as unknown as { sqlDijalankan: string[] }).sqlDijalankan.length, 0);
});

test('tanpa kunci API email dilewati, bukan melempar galat', async () => {
	const hasil = await notifyCoinTransactionEmail(
		masukan({ env: { ...envAktif, RESEND_API_KEY: undefined } }) as never
	);
	assert.deepEqual(hasil, { status: 'skipped', reason: 'not_configured' });
});

test('pengirim diambil dari TRANSACTIONAL lalu PAYMENT lalu REGISTRATION', () => {
	assert.equal(
		getCoinEmailConfig({ ...envAktif, RESEND_API_KEY: 'k' })?.from,
		'SantriOnline <transaksi@contoh.test>'
	);
	assert.equal(
		getCoinEmailConfig({
			RESEND_API_KEY: 'k',
			PAYMENT_EMAIL_FROM: 'SantriOnline <bayar@contoh.test>'
		})?.from,
		'SantriOnline <bayar@contoh.test>'
	);
	assert.equal(
		getCoinEmailConfig({
			RESEND_API_KEY: 'k',
			REGISTRATION_EMAIL_FROM: 'SantriOnline <daftar@contoh.test>'
		})?.from,
		'SantriOnline <daftar@contoh.test>'
	);
	assert.equal(getCoinEmailConfig({ RESEND_API_KEY: 'k' }), null);
});

test('flag khusus koin bisa mematikan tanpa mematikan email pembayaran', () => {
	assert.equal(isCoinEmailEnabled({ PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'true' }), true);
	assert.equal(
		isCoinEmailEnabled({
			PAYMENT_EMAIL_NOTIFICATIONS_ENABLED: 'true',
			COIN_EMAIL_NOTIFICATIONS_ENABLED: 'false'
		}),
		false
	);
});

test('pengguna tanpa email tidak dikirimi', async () => {
	const hasil = await notifyCoinTransactionEmail(
		masukan({ db: buatDb({ user: { username: 'X', email: '   ' } }) }) as never
	);
	assert.deepEqual(hasil, { status: 'skipped', reason: 'invalid_recipient' });
});

test('pengiriman berhasil mengembalikan message id', async () => {
	const hasil = await notifyCoinTransactionEmail(masukan() as never);
	assert.deepEqual(hasil, { status: 'sent', messageId: 'pesan.sekali' });
});

test('transaksi yang sudah terkirim tidak dikirim dua kali', async () => {
	const hasil = await notifyCoinTransactionEmail(
		masukan({ db: buatDb({ klaim: 0, status: 'sent' }) }) as never
	);
	assert.deepEqual(hasil, { status: 'duplicate' });
});

test('penolakan Resend dicatat sebagai gagal, bukan melempar', async () => {
	const hasil = await notifyCoinTransactionEmail(
		masukan({
			fetchFn: (async () =>
				new Response(JSON.stringify({ name: 'validation_error', message: 'API key is invalid' }), {
					status: 403
				})) as never
		}) as never
	);
	assert.deepEqual(hasil, { status: 'failed', code: 'resend_validation_error' });
});

test('jaringan putus tidak melempar galat ke pemanggil', async () => {
	const hasil = await notifyCoinTransactionEmail(
		masukan({
			fetchFn: (async () => {
				throw new Error('putus');
			}) as never
		}) as never
	);
	assert.deepEqual(hasil, { status: 'failed', code: 'resend_request_failed' });
});

test('isi email menyebut jenis transaksi, jumlah koin, dan sisa saldo', async () => {
	let badan = '';
	await notifyCoinTransactionEmail(
		masukan({
			fetchFn: (async (_url: string, init: { body: string }) => {
				badan = init.body;
				return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
			}) as never
		}) as never
	);
	const dikirim = JSON.parse(badan);
	assert.match(dikirim.subject, /Pembelian/i);
	assert.match(dikirim.text, /150/);
	assert.match(dikirim.text, /850/);
	assert.match(dikirim.html, /Pembelian Kitab Digital/);
	assert.equal(dikirim.from, 'SantriOnline <transaksi@contoh.test>');
	assert.deepEqual(dikirim.to, ['santri@contoh.test']);
});

test('topup memakai kalimat penambahan saldo, bukan pengurangan', async () => {
	let badan = '';
	await notifyCoinTransactionEmail(
		masukan({
			jenis: 'topup',
			keterangan: 'Topup koin',
			fetchFn: (async (_url: string, init: { body: string }) => {
				badan = init.body;
				return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
			}) as never
		}) as never
	);
	const dikirim = JSON.parse(badan);
	assert.match(dikirim.subject, /Koin bertambah/i);
	assert.doesNotMatch(dikirim.text, /berkurang/i);
});

test('isi email lolos dari penyusupan HTML', async () => {
	let badan = '';
	await notifyCoinTransactionEmail(
		masukan({
			keterangan: '<script>alert(1)</script>',
			fetchFn: (async (_url: string, init: { body: string }) => {
				badan = init.body;
				return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
			}) as never
		}) as never
	);
	const dikirim = JSON.parse(badan);
	assert.doesNotMatch(dikirim.html, /<script>/);
	assert.match(dikirim.html, /&lt;script&gt;/);
});
