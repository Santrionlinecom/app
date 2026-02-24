import { env as privateEnv } from '$env/dynamic/private';

const encoder = new TextEncoder();

const toBase64Url = (buffer: ArrayBuffer) => {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string) => {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

const getSecret = (secretOverride?: string) => {
	const secret = (secretOverride ?? privateEnv.LICENSE_SIGNING_SECRET ?? '').trim();
	if (!secret) {
		throw new Error('LICENSE_SIGNING_SECRET belum dikonfigurasi');
	}
	return secret;
};

const importHmacKey = async (secretOverride?: string) => {
	const secret = getSecret(secretOverride);
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{
			name: 'HMAC',
			hash: 'SHA-256'
		},
		false,
		['sign', 'verify']
	);
};

export const signPayload = async (payloadJsonString: string, secretOverride?: string) => {
	const key = await importHmacKey(secretOverride);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadJsonString));
	return toBase64Url(signature);
};

export const verifySignature = async (
	payloadJsonString: string,
	signature: string,
	secretOverride?: string
) => {
	if (!signature) return false;
	try {
		const key = await importHmacKey(secretOverride);
		return await crypto.subtle.verify(
			'HMAC',
			key,
			fromBase64Url(signature),
			encoder.encode(payloadJsonString)
		);
	} catch {
		return false;
	}
};
