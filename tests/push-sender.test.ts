import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
	getPushConfig,
	isPushEnabled,
	isValidPushEndpoint,
	isValidSubscriptionKeys,
	sendPushToSubscription
} from '../src/lib/server/notifications/push-sender';
import { base64UrlEncode, generateVapidKeys } from '../src/lib/server/notifications/web-push-crypto';

const buatLangganan = async () => {
	const penerima = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	]);
	return {
		endpoint: 'https://fcm.googleapis.com/fcm/send/uji-123',
		p256dh: base64UrlEncode(new Uint8Array(await crypto.subtle.exportKey('raw', penerima.publicKey))),
		auth: base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)))
	};
};

const buatDb = () => {
	const sql: string[] = [];
	return {
		sql,
		prepare(query: string) {
			sql.push(query);
			return {
				bind: () => ({ run: async () => ({ meta: { changes: 1 } }) }),
				run: async () => ({ meta: { changes: 1 } })
			};
		}
	} as never;
};

test('push dimatikan bila flag tidak true', () => {
	assert.equal(isPushEnabled({ PUSH_NOTIFICATIONS_ENABLED: 'true' }), true);
	assert.equal(isPushEnabled({ PUSH_NOTIFICATIONS_ENABLED: 'false' }), false);
	assert.equal(isPushEnabled({}), false);
});

test('konfigurasi null bila kunci VAPID belum dipasang', async () => {
	const keys = await generateVapidKeys();
	assert.equal(getPushConfig({ VAPID_PUBLIC_KEY: keys.publicKey }), null);
	const config = getPushConfig({
		VAPID_PUBLIC_KEY: keys.publicKey,
		VAPID_PRIVATE_KEY: keys.privateKey
	});
	assert.equal(config?.subject, 'mailto:admin@santrionline.com', 'subject punya nilai bawaan');
});

test('endpoint non-https ditolak', () => {
	assert.equal(isValidPushEndpoint('https://fcm.googleapis.com/fcm/send/x'), true);
	assert.equal(isValidPushEndpoint('http://jahat.test/x'), false);
	assert.equal(isValidPushEndpoint('bukan-url'), false);
});

test('kunci langganan berukuran salah ditolak', () => {
	const p256dh = base64UrlEncode(new Uint8Array(65));
	const auth = base64UrlEncode(new Uint8Array(16));
	assert.equal(isValidSubscriptionKeys(p256dh, auth), true);
	assert.equal(isValidSubscriptionKeys(base64UrlEncode(new Uint8Array(32)), auth), false);
	assert.equal(isValidSubscriptionKeys(p256dh, base64UrlEncode(new Uint8Array(8))), false);
});

test('pengiriman sukses mengembalikan status sent', async () => {
	const keys = await generateVapidKeys();
	const hasil = await sendPushToSubscription({
		db: buatDb(),
		fetchFn: (async () => new Response(null, { status: 201 })) as never,
		config: { ...keys, subject: 'mailto:admin@santrionline.com' },
		subscription: await buatLangganan(),
		message: { title: 'Setoran', body: 'Waktunya setoran hafalan' }
	});
	assert.equal(hasil.status, 'sent');
});

test('langganan mati (410) dihapus, bukan dicoba terus', async () => {
	const keys = await generateVapidKeys();
	const db = buatDb();
	const hasil = await sendPushToSubscription({
		db,
		fetchFn: (async () => new Response(null, { status: 410 })) as never,
		config: { ...keys, subject: 'mailto:admin@santrionline.com' },
		subscription: await buatLangganan(),
		message: { title: 'Setoran', body: 'Waktunya setoran' }
	});
	assert.equal(hasil.status, 'expired');
	const sql = (db as unknown as { sql: string[] }).sql.join(' ');
	assert.match(sql, /DELETE FROM push_subscriptions/);
});

test('galat server dicatat sebagai gagal tanpa melempar', async () => {
	const keys = await generateVapidKeys();
	const hasil = await sendPushToSubscription({
		db: buatDb(),
		fetchFn: (async () => new Response(null, { status: 500 })) as never,
		config: { ...keys, subject: 'mailto:admin@santrionline.com' },
		subscription: await buatLangganan(),
		message: { title: 'Setoran', body: 'Waktunya setoran' }
	});
	assert.deepEqual(hasil.status === 'failed' && hasil.code, 'push_http_500');
});

test('jaringan putus tidak melempar ke pemanggil', async () => {
	const keys = await generateVapidKeys();
	const hasil = await sendPushToSubscription({
		db: buatDb(),
		fetchFn: (async () => {
			throw new Error('putus');
		}) as never,
		config: { ...keys, subject: 'mailto:admin@santrionline.com' },
		subscription: await buatLangganan(),
		message: { title: 'Setoran', body: 'Waktunya setoran' }
	});
	assert.deepEqual(hasil.status === 'failed' && hasil.code, 'push_request_failed');
});

test('permintaan push membawa header VAPID, TTL, dan aes128gcm', async () => {
	const keys = await generateVapidKeys();
	let init: RequestInit | undefined;
	await sendPushToSubscription({
		db: buatDb(),
		fetchFn: (async (_url: string, opsi: RequestInit) => {
			init = opsi;
			return new Response(null, { status: 201 });
		}) as never,
		config: { ...keys, subject: 'mailto:admin@santrionline.com' },
		subscription: await buatLangganan(),
		message: { title: 'Setoran', body: 'Waktunya setoran' }
	});

	const headers = init?.headers as Record<string, string>;
	assert.match(headers.Authorization, /^vapid t=.+, k=.+$/);
	assert.equal(headers['Content-Encoding'], 'aes128gcm');
	assert.equal(headers.TTL, '86400');
	assert.ok(init?.body, 'body wajib berisi payload terenkripsi');
});
