const LICENSE_KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CURRENT_LICENSE_KEY_PREFIX = 'SANTRI';
const LEGACY_LICENSE_KEY_PREFIX = 'STRM';
const LICENSE_KEY_BODY_PATTERN = '[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3}';

export const STREAMER_LICENSE_KEY_REGEX = new RegExp(
	`^(?:${CURRENT_LICENSE_KEY_PREFIX}|${LEGACY_LICENSE_KEY_PREFIX})-${LICENSE_KEY_BODY_PATTERN}$`
);

export const normalizeStrmLicenseKey = (value: string) => value.trim().toUpperCase();

const randomChunk = (length: number) => {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (let i = 0; i < bytes.length; i += 1) {
		out += LICENSE_KEY_ALPHABET[bytes[i] % LICENSE_KEY_ALPHABET.length];
	}
	return out;
};

export const buildSantriLicenseKey = () =>
	`${CURRENT_LICENSE_KEY_PREFIX}-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}`;

export const buildStrmLicenseKey = buildSantriLicenseKey;

export const isStrmLicenseKeyFormat = (value: string) =>
	STREAMER_LICENSE_KEY_REGEX.test(normalizeStrmLicenseKey(value));

export const getStrmLicenseKeyLookupCandidates = (value: string) => {
	const normalized = normalizeStrmLicenseKey(value);
	if (!normalized) return [];
	if (!STREAMER_LICENSE_KEY_REGEX.test(normalized)) return [normalized];

	const [prefix, ...chunks] = normalized.split('-');
	const body = chunks.join('-');
	if (prefix === CURRENT_LICENSE_KEY_PREFIX) {
		return [normalized, `${LEGACY_LICENSE_KEY_PREFIX}-${body}`];
	}
	if (prefix === LEGACY_LICENSE_KEY_PREFIX) {
		return [normalized, `${CURRENT_LICENSE_KEY_PREFIX}-${body}`];
	}
	return [normalized];
};
