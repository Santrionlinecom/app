import { env as privateEnv } from '$env/dynamic/private';
import type { StreamerLicenseRow } from '$lib/server/license/streamer-db';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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
	const header = { alg: 'HS256', typ: 'JWT' } as const;
	const payload: StreamerLicenseTokenClaims = { kind: 'santri_streamer_license', ...claims };

	const headerPart = toBase64Url(encoder.encode(JSON.stringify(header)));
	const payloadPart = toBase64Url(encoder.encode(JSON.stringify(payload)));
	const signingInput = `${headerPart}.${payloadPart}`;

	const key = await importHmacKey(secretOverride);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
	const sigPart = toBase64Url(new Uint8Array(signature));

	return `${signingInput}.${sigPart}`;
};

export const verifyLicenseToken = async (token: string, secretOverride?: string) => {
	if (typeof token !== 'string' || !token.trim()) return null;
	// Resolve secret up front so missing env is surfaced as server error by callers.
	const key = await importHmacKey(secretOverride);
	const parts = token.trim().split('.');
	if (parts.length !== 3) return null;
	const [headerPart, payloadPart, sigPart] = parts;

	try {
		const header = JSON.parse(decoder.decode(fromBase64Url(headerPart)));
		if (!isObject(header) || header.alg !== 'HS256' || header.typ !== 'JWT') return null;
		const ok = await crypto.subtle.verify(
			'HMAC',
			key,
			fromBase64Url(sigPart),
			encoder.encode(`${headerPart}.${payloadPart}`)
		);
		if (!ok) return null;

		const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart)));
		return parseClaims(payload);
	} catch {
		return null;
	}
};

export const signStreamerLicenseToken = generateLicenseToken;
export const verifyStreamerLicenseToken = verifyLicenseToken;
