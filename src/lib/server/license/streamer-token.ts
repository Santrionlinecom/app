import { env as privateEnv } from '$env/dynamic/private';
import type { StreamerLicenseRow } from '$lib/server/license/streamer-db';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type StreamerTokenAlg = 'HS256' | 'EdDSA';

export type StreamerLicenseTokenClaims = {
	kind: 'santri_streamer_license';
	license_id: string;
	plan_type: 'monthly' | 'yearly' | 'lifetime';
	valid_until: number | null; // unix seconds
	issued_at: number; // unix seconds
	device_id_hash: string | null;
	app: string;
	features: string[] | null;
};

export const STREAMER_PREMIUM_FEATURES = [
	'ai_auto_subtitle',
	'burn_subtitle_from_file',
	'tts_generate_audio'
] as const;

const DEFAULT_STREAMER_FEATURES = [...STREAMER_PREMIUM_FEATURES];
const DEFAULT_STREAMER_TOKEN_ALG: StreamerTokenAlg = 'EdDSA';
const ED25519_PKCS8_PREFIX = Uint8Array.from([
	0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
]);

const getSecret = (secretOverride?: string) => {
	const secret = (
		secretOverride ??
		privateEnv.STREAMER_LICENSE_SIGNING_SECRET ??
		privateEnv.LICENSE_SIGNING_SECRET ??
		''
	).trim();
	if (!secret) {
		throw new Error('STREAMER_LICENSE_SIGNING_SECRET/LICENSE_SIGNING_SECRET belum dikonfigurasi');
	}
	return secret;
};

const toUnixSeconds = (valueMs: number | null | undefined) => {
	if (valueMs == null) return null;
	if (!Number.isFinite(valueMs)) return null;
	return Math.floor(Number(valueMs) / 1000);
};

const normalizeEpochSeconds = (value: unknown) => {
	if (value == null) return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	// Backward compatibility: accept old tokens that stored milliseconds.
	return Math.floor(parsed > 1_000_000_000_000 ? parsed / 1000 : parsed);
};

const normalizeStringArray = (value: unknown) => {
	if (value == null) return null;
	if (!Array.isArray(value)) return null;
	const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
	return items.length ? items : [];
};

const toBase64Url = (bytes: Uint8Array) => {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

const importHmacKey = async (secretOverride?: string) =>
	crypto.subtle.importKey(
		'raw',
		encoder.encode(getSecret(secretOverride)),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);

const importEd25519PrivateKey = async (secretOverride?: string) => {
	const secret = encoder.encode(getSecret(secretOverride));
	const digest = await crypto.subtle.digest('SHA-256', secret);
	const seed = new Uint8Array(digest);
	const pkcs8 = new Uint8Array(ED25519_PKCS8_PREFIX.length + seed.length);
	pkcs8.set(ED25519_PKCS8_PREFIX, 0);
	pkcs8.set(seed, ED25519_PKCS8_PREFIX.length);
	return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
};

const equalBytes = (left: Uint8Array, right: Uint8Array) => {
	if (left.length !== right.length) return false;
	let mismatch = 0;
	for (let i = 0; i < left.length; i += 1) {
		mismatch |= left[i] ^ right[i];
	}
	return mismatch === 0;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const parseClaims = (value: unknown): StreamerLicenseTokenClaims | null => {
	if (!isObject(value)) return null;
	const kind = value.kind;
	const licenseId = value.license_id;
	const planType = value.plan_type;
	const validUntil = value.valid_until;
	const issuedAt = value.issued_at;
	const deviceIdHash = value.device_id_hash;
	const app = value.app;
	const validUntilSeconds = normalizeEpochSeconds(validUntil);
	const issuedAtSeconds = normalizeEpochSeconds(issuedAt);

	if (kind !== 'santri_streamer_license') return null;
	if (typeof licenseId !== 'string' || !licenseId) return null;
	if (planType !== 'monthly' && planType !== 'yearly' && planType !== 'lifetime') return null;
	if (validUntil !== null && validUntilSeconds == null) return null;
	if (issuedAtSeconds == null) return null;
	if (deviceIdHash !== null && (typeof deviceIdHash !== 'string' || !deviceIdHash)) return null;
	if (typeof app !== 'string' || !app) return null;

	const features =
		'features' in value
			? normalizeStringArray(value.features)
			: null;

	const claims: StreamerLicenseTokenClaims = {
		kind,
		license_id: licenseId,
		plan_type: planType,
		valid_until: validUntilSeconds,
		issued_at: issuedAtSeconds,
		device_id_hash: deviceIdHash === null ? null : deviceIdHash,
		app,
		features
	};

	return claims;
};

export const buildClaimsFromLicense = (params: {
	license: Pick<StreamerLicenseRow, 'id' | 'plan_type'>;
	validUntilMs: number | null;
	issuedAtMs?: number;
	deviceIdHash?: string | null;
	app: string;
	features?: string[] | null;
}): Omit<StreamerLicenseTokenClaims, 'kind'> => ({
	license_id: params.license.id,
	plan_type: params.license.plan_type,
	valid_until: toUnixSeconds(params.validUntilMs),
	issued_at: toUnixSeconds(params.issuedAtMs ?? Date.now()) ?? Math.floor(Date.now() / 1000),
	device_id_hash: params.deviceIdHash ?? null,
	app: params.app,
	features: params.features ?? [...DEFAULT_STREAMER_FEATURES]
});

export const generateLicenseToken = async (
	claims: Omit<StreamerLicenseTokenClaims, 'kind'>,
	secretOverride?: string
) => {
	const header = { alg: DEFAULT_STREAMER_TOKEN_ALG, typ: 'JWT' } as const;
	const payload: StreamerLicenseTokenClaims = { kind: 'santri_streamer_license', ...claims };

	const headerPart = toBase64Url(encoder.encode(JSON.stringify(header)));
	const payloadPart = toBase64Url(encoder.encode(JSON.stringify(payload)));
	const signingInput = `${headerPart}.${payloadPart}`;

	let signature: Uint8Array;
	if (header.alg === 'EdDSA') {
		const key = await importEd25519PrivateKey(secretOverride);
		signature = new Uint8Array(await crypto.subtle.sign('Ed25519', key, encoder.encode(signingInput)));
	} else {
		const key = await importHmacKey(secretOverride);
		signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput)));
	}

	const sigPart = toBase64Url(signature);

	return `${signingInput}.${sigPart}`;
};

export const verifyLicenseToken = async (token: string, secretOverride?: string) => {
	if (typeof token !== 'string' || !token.trim()) return null;
	const parts = token.trim().split('.');
	if (parts.length !== 3) return null;
	const [headerPart, payloadPart, sigPart] = parts;

	try {
		const header = JSON.parse(decoder.decode(fromBase64Url(headerPart)));
		if (!isObject(header) || header.typ !== 'JWT') return null;
		const algorithm = header.alg;
		const signed = encoder.encode(`${headerPart}.${payloadPart}`);
		const givenSignature = fromBase64Url(sigPart);

		if (algorithm === 'HS256') {
			// Backward compatibility for tokens issued before EdDSA migration.
			const key = await importHmacKey(secretOverride);
			const ok = await crypto.subtle.verify('HMAC', key, givenSignature, signed);
			if (!ok) return null;
		} else if (algorithm === 'EdDSA') {
			const key = await importEd25519PrivateKey(secretOverride);
			const expected = new Uint8Array(await crypto.subtle.sign('Ed25519', key, signed));
			if (!equalBytes(givenSignature, expected)) return null;
		} else {
			return null;
		}

		const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart)));
		return parseClaims(payload);
	} catch {
		return null;
	}
};

export const signStreamerLicenseToken = generateLicenseToken;
export const verifyStreamerLicenseToken = verifyLicenseToken;
