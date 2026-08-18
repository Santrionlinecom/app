// Kripto Web Push untuk Cloudflare Workers.
//
// Library `web-push` dari npm TIDAK dipakai karena bergantung pada node:crypto
// yang tidak tersedia penuh di runtime Workers. Semua operasi di sini memakai
// Web Crypto API standar sehingga berjalan sama di Workers, browser, dan Node 22.
//
// Rujukan: RFC 8291 (Message Encryption for Web Push), RFC 8292 (VAPID),
// RFC 8188 (Encrypted Content-Encoding aes128gcm).

const encoder = new TextEncoder();

// Batas payload Web Push. Push service umumnya menolak di atas 4KB.
const MAX_PAYLOAD_BYTES = 4096;

// RFC 8292: masa berlaku JWT tidak boleh lebih dari 24 jam.
const MAX_JWT_LIFETIME_SECONDS = 24 * 60 * 60;

export const base64UrlEncode = (data: ArrayBuffer | Uint8Array): string => {
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	let biner = '';
	for (const byte of bytes) biner += String.fromCharCode(byte);
	return btoa(biner).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64UrlDecode = (value: string): Uint8Array<ArrayBuffer> => {
	// Sebagian browser menyertakan padding pada PushSubscription.toJSON().
	const normal = value.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
	const padded = normal + '='.repeat((4 - (normal.length % 4)) % 4);
	const biner = atob(padded);
	const bytes = new Uint8Array(new ArrayBuffer(biner.length));
	for (let i = 0; i < biner.length; i += 1) bytes[i] = biner.charCodeAt(i);
	return bytes;
};

// Push service hanya menerima audience berupa origin, bukan endpoint lengkap.
export const pushServiceAudience = (endpoint: string): string => new URL(endpoint).origin;

const gabung = (...bagian: Uint8Array[]): Uint8Array<ArrayBuffer> => {
	const total = bagian.reduce((jumlah, item) => jumlah + item.length, 0);
	const hasil = new Uint8Array(new ArrayBuffer(total));
	let posisi = 0;
	for (const item of bagian) {
		hasil.set(item, posisi);
		posisi += item.length;
	}
	return hasil;
};

// TypeScript membedakan Uint8Array<ArrayBuffer> dari Uint8Array<ArrayBufferLike>.
// Web Crypto hanya menerima yang pertama, jadi setiap byte hasil decode disalin
// ke ArrayBuffer nyata sebelum dipakai.
const sebagaiBuffer = (bytes: Uint8Array): Uint8Array<ArrayBuffer> => {
	const salinan = new Uint8Array(new ArrayBuffer(bytes.length));
	salinan.set(bytes);
	return salinan;
};

export type VapidKeyPair = { publicKey: string; privateKey: string };

export const generateVapidKeys = async (): Promise<VapidKeyPair> => {
	const pasangan = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify'
	]);
	const publik = await crypto.subtle.exportKey('raw', pasangan.publicKey);
	const privatJwk = await crypto.subtle.exportKey('jwk', pasangan.privateKey);
	if (!privatJwk.d) throw new Error('Kunci privat VAPID gagal diekspor');
	return { publicKey: base64UrlEncode(publik), privateKey: privatJwk.d };
};

// Import kunci privat sebagai JWK. Web Crypto mewajibkan koordinat x dan y
// hadir bersama d, jadi kunci publik VAPID selalu ikut disertakan — keduanya
// memang selalu tersimpan berpasangan sebagai secret.
const importVapidPrivateKey = async (publicKey: string, privateKey: string) => {
	const d = base64UrlDecode(privateKey);
	if (d.length !== 32) throw new Error('Kunci privat VAPID wajib 32 byte');
	const publik = base64UrlDecode(publicKey);
	if (publik.length !== 65 || publik[0] !== 0x04) {
		throw new Error('Kunci publik VAPID wajib 65 byte tak terkompresi');
	}
	return crypto.subtle.importKey(
		'jwk',
		{
			kty: 'EC',
			crv: 'P-256',
			d: base64UrlEncode(d),
			x: base64UrlEncode(publik.slice(1, 33)),
			y: base64UrlEncode(publik.slice(33, 65)),
			ext: true
		},
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);
};

type VapidJwtInput = {
	audience: string;
	subject: string;
	publicKey: string;
	privateKey: string;
	expiresAt?: number;
};

export const createVapidJwt = async ({
	audience,
	subject,
	publicKey,
	privateKey,
	expiresAt
}: VapidJwtInput): Promise<string> => {
	if (!/^(mailto:|https:)/.test(subject)) {
		throw new Error('Subject VAPID wajib diawali mailto: atau https:');
	}
	const sekarang = Math.floor(Date.now() / 1000);
	const exp = expiresAt ?? sekarang + 12 * 60 * 60;
	if (exp - sekarang > MAX_JWT_LIFETIME_SECONDS) {
		throw new Error('Masa berlaku JWT VAPID tidak boleh lebih dari 24 jam');
	}

	const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
	const payload = base64UrlEncode(encoder.encode(JSON.stringify({ aud: audience, exp, sub: subject })));
	const materi = `${header}.${payload}`;

	const kunci = await importVapidPrivateKey(publicKey, privateKey);
	const tandaTangan = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		kunci,
		encoder.encode(materi)
	);
	return `${materi}.${base64UrlEncode(tandaTangan)}`;
};

type VapidAuthorizationInput = {
	endpoint: string;
	subject: string;
	publicKey: string;
	privateKey: string;
	expiresAt?: number;
};

export const buildVapidAuthorization = async ({
	endpoint,
	subject,
	publicKey,
	privateKey,
	expiresAt
}: VapidAuthorizationInput): Promise<string> => {
	const jwt = await createVapidJwt({
		audience: pushServiceAudience(endpoint),
		subject,
		publicKey,
		privateKey,
		expiresAt
	});
	return `vapid t=${jwt}, k=${publicKey}`;
};

// HKDF sesuai RFC 5869, dipakai untuk menurunkan kunci konten dan nonce.
const hkdf = async (
	salt: Uint8Array,
	ikm: Uint8Array,
	info: Uint8Array,
	panjang: number
): Promise<Uint8Array<ArrayBuffer>> => {
	const kunci = await crypto.subtle.importKey('raw', sebagaiBuffer(ikm), 'HKDF', false, [
		'deriveBits'
	]);
	const bit = await crypto.subtle.deriveBits(
		{ name: 'HKDF', hash: 'SHA-256', salt: sebagaiBuffer(salt), info: sebagaiBuffer(info) },
		kunci,
		panjang * 8
	);
	return new Uint8Array(bit);
};

type EncryptPushInput = {
	payload: string;
	p256dh: string;
	auth: string;
};

export type EncryptedPush = {
	body: ArrayBuffer;
	headers: Record<string, string>;
};

export const encryptPushPayload = async ({
	payload,
	p256dh,
	auth
}: EncryptPushInput): Promise<EncryptedPush> => {
	const isi = encoder.encode(payload);
	if (isi.length > MAX_PAYLOAD_BYTES) {
		throw new Error(`Payload push terlalu besar: ${isi.length} byte, batas ${MAX_PAYLOAD_BYTES}`);
	}

	const kunciPenerima = base64UrlDecode(p256dh);
	const rahasiaAuth = base64UrlDecode(auth);

	// Kunci sekali pakai per kiriman: menjamin ciphertext berbeda tiap kali.
	const pasanganPengirim = await crypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveBits']
	);
	const kunciPublikPengirim = new Uint8Array(
		await crypto.subtle.exportKey('raw', pasanganPengirim.publicKey)
	);

	const kunciPublikPenerima = await crypto.subtle.importKey(
		'raw',
		sebagaiBuffer(kunciPenerima),
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);
	const rahasiaBersama = new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: 'ECDH', public: kunciPublikPenerima },
			pasanganPengirim.privateKey,
			256
		)
	);

	// RFC 8291 §3.4: PRK gabungan mengikat kedua kunci publik ke dalam konteks.
	const infoGabungan = gabung(
		encoder.encode('WebPush: info\0'),
		kunciPenerima,
		kunciPublikPengirim
	);
	const prk = await hkdf(rahasiaAuth, rahasiaBersama, infoGabungan, 32);

	const salt = crypto.getRandomValues(new Uint8Array(16));
	const kunciKonten = await hkdf(salt, prk, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
	const nonce = await hkdf(salt, prk, encoder.encode('Content-Encoding: nonce\0'), 12);

	// RFC 8188 mewajibkan penanda akhir rekaman 0x02 sebelum enkripsi.
	const isiDenganPenanda = gabung(isi, new Uint8Array([0x02]));
	const kunciAes = await crypto.subtle.importKey('raw', sebagaiBuffer(kunciKonten), 'AES-GCM', false, [
		'encrypt'
	]);
	const cipher = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: sebagaiBuffer(nonce), tagLength: 128 },
			kunciAes,
			isiDenganPenanda
		)
	);

	// Header aes128gcm: salt(16) + rs(4) + idlen(1) + keyid(65)
	const rs = new Uint8Array(4);
	new DataView(rs.buffer).setUint32(0, 4096, false);
	const body = gabung(
		salt,
		rs,
		new Uint8Array([kunciPublikPengirim.length]),
		kunciPublikPengirim,
		cipher
	);

	return {
		body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer,
		headers: {
			'Content-Encoding': 'aes128gcm',
			'Content-Type': 'application/octet-stream',
			'Content-Length': String(body.length)
		}
	};
};
