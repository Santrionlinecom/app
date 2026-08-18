import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
	base64UrlDecode,
	base64UrlEncode,
	buildVapidAuthorization,
	createVapidJwt,
	encryptPushPayload,
	generateVapidKeys,
	pushServiceAudience
} from '../src/lib/server/notifications/web-push-crypto';

// Web Push di Cloudflare Workers tidak boleh memakai library `web-push`
// karena bergantung pada node:crypto. Semua kripto di sini wajib Web Crypto.

test('base64url bolak-balik tanpa padding dan tanpa karakter + /', () => {
	const data = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255]);
	const encoded = base64UrlEncode(data);
	assert.doesNotMatch(encoded, /[+/=]/, 'base64url tidak boleh memuat + / atau =');
	assert.deepEqual(Array.from(base64UrlDecode(encoded)), Array.from(data));
});

test('base64url menerima masukan ber-padding dari browser', () => {
	// PushSubscription.toJSON() dari beberapa browser menyertakan padding.
	assert.deepEqual(Array.from(base64UrlDecode('AQID')), [1, 2, 3]);
	assert.deepEqual(Array.from(base64UrlDecode('AQID==')), [1, 2, 3]);
});

test('audience diambil dari origin push service, bukan URL penuh', () => {
	assert.equal(
		pushServiceAudience('https://fcm.googleapis.com/fcm/send/abc123'),
		'https://fcm.googleapis.com'
	);
	assert.equal(
		pushServiceAudience('https://web.push.apple.com/QRS/xyz?a=1'),
		'https://web.push.apple.com'
	);
});

test('pasangan kunci VAPID berbentuk P-256 tak terkompresi', async () => {
	const keys = await generateVapidKeys();
	const publicKey = base64UrlDecode(keys.publicKey);
	assert.equal(publicKey.length, 65, 'kunci publik P-256 tak terkompresi = 65 byte');
	assert.equal(publicKey[0], 0x04, 'wajib diawali 0x04 sebagai penanda tak terkompresi');
	assert.equal(base64UrlDecode(keys.privateKey).length, 32, 'kunci privat P-256 = 32 byte');
});

test('JWT VAPID memakai ES256 dan dapat diverifikasi kunci publiknya', async () => {
	const keys = await generateVapidKeys();
	const jwt = await createVapidJwt({
		audience: 'https://fcm.googleapis.com',
		subject: 'mailto:admin@santrionline.com',
		publicKey: keys.publicKey,
		privateKey: keys.privateKey,
		expiresAt: Math.floor(Date.now() / 1000) + 3600
	});

	const [rawHeader, rawPayload, rawSignature] = jwt.split('.');
	assert.ok(rawHeader && rawPayload && rawSignature, 'JWT wajib tiga bagian');

	const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(rawHeader)));
	assert.equal(header.alg, 'ES256', 'Web Push mewajibkan ES256');
	assert.equal(header.typ, 'JWT');

	const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(rawPayload)));
	assert.equal(payload.aud, 'https://fcm.googleapis.com');
	assert.equal(payload.sub, 'mailto:admin@santrionline.com');
	assert.ok(payload.exp > Math.floor(Date.now() / 1000), 'exp wajib di masa depan');

	// Tanda tangan wajib benar-benar sah, bukan sekadar ada.
	const publicKey = await crypto.subtle.importKey(
		'raw',
		base64UrlDecode(keys.publicKey),
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['verify']
	);
	const sah = await crypto.subtle.verify(
		{ name: 'ECDSA', hash: 'SHA-256' },
		publicKey,
		base64UrlDecode(rawSignature),
		new TextEncoder().encode(`${rawHeader}.${rawPayload}`)
	);
	assert.equal(sah, true, 'tanda tangan JWT wajib lolos verifikasi');
});

test('exp JWT ditolak bila lebih dari 24 jam sesuai RFC 8292', async () => {
	const keys = await generateVapidKeys();
	await assert.rejects(
		() =>
			createVapidJwt({
				audience: 'https://fcm.googleapis.com',
				subject: 'mailto:admin@santrionline.com',
				publicKey: keys.publicKey,
				privateKey: keys.privateKey,
				expiresAt: Math.floor(Date.now() / 1000) + 25 * 3600
			}),
		/24 jam/i
	);
});

test('subject wajib mailto: atau https:', async () => {
	const keys = await generateVapidKeys();
	await assert.rejects(
		() =>
			createVapidJwt({
				audience: 'https://fcm.googleapis.com',
				subject: 'admin@santrionline.com',
				publicKey: keys.publicKey,
				privateKey: keys.privateKey
			}),
		/mailto:/i
	);
});

test('header Authorization memakai skema vapid t= dan k=', async () => {
	const keys = await generateVapidKeys();
	const header = await buildVapidAuthorization({
		endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
		subject: 'mailto:admin@santrionline.com',
		publicKey: keys.publicKey,
		privateKey: keys.privateKey
	});
	assert.match(header, /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/);
	assert.ok(header.includes(`k=${keys.publicKey}`), 'k wajib kunci publik VAPID');
});

test('payload dienkripsi aes128gcm dengan header yang benar', async () => {
	// Kunci penerima palsu tetapi berbentuk sah, meniru PushSubscription browser.
	const penerima = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	]);
	const p256dh = base64UrlEncode(
		new Uint8Array(await crypto.subtle.exportKey('raw', penerima.publicKey))
	);
	const authSecret = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

	const hasil = await encryptPushPayload({
		payload: JSON.stringify({ title: 'Waktunya setoran' }),
		p256dh,
		auth: authSecret
	});

	assert.ok(hasil.body.byteLength > 86, 'wajib ada header aes128gcm + ciphertext');
	assert.equal(hasil.headers['Content-Encoding'], 'aes128gcm');
	assert.equal(hasil.headers['Content-Type'], 'application/octet-stream');

	// RFC 8188: 16 byte salt, 4 byte panjang rekaman, 1 byte panjang idlen, lalu kunci publik 65 byte.
	const body = new Uint8Array(hasil.body);
	assert.equal(body[20], 65, 'idlen wajib 65 untuk kunci P-256 tak terkompresi');
	assert.equal(body[21], 0x04, 'kunci publik pengirim wajib tak terkompresi');
});

test('payload berbeda menghasilkan ciphertext berbeda', async () => {
	const penerima = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	]);
	const p256dh = base64UrlEncode(
		new Uint8Array(await crypto.subtle.exportKey('raw', penerima.publicKey))
	);
	const auth = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

	const a = await encryptPushPayload({ payload: 'pesan-a', p256dh, auth });
	const b = await encryptPushPayload({ payload: 'pesan-a', p256dh, auth });

	// Salt dan kunci sekali pakai membuat setiap kiriman unik walau isinya sama.
	assert.notDeepEqual(Array.from(new Uint8Array(a.body)), Array.from(new Uint8Array(b.body)));
});

test('payload melebihi batas 4KB ditolak lebih awal', async () => {
	const penerima = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	]);
	const p256dh = base64UrlEncode(
		new Uint8Array(await crypto.subtle.exportKey('raw', penerima.publicKey))
	);
	const auth = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

	await assert.rejects(
		() => encryptPushPayload({ payload: 'x'.repeat(4097), p256dh, auth }),
		/terlalu besar/i
	);
});
