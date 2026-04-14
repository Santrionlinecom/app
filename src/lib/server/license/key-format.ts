const STRM_LICENSE_KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const STRM_LICENSE_KEY_REGEX = /^STRM-[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3}$/;

export const normalizeStrmLicenseKey = (value: string) => value.trim().toUpperCase();

const randomChunk = (length: number) => {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (let i = 0; i < bytes.length; i += 1) {
		out += STRM_LICENSE_KEY_ALPHABET[bytes[i] % STRM_LICENSE_KEY_ALPHABET.length];
	}
	return out;
};

export const buildStrmLicenseKey = () =>
	`STRM-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}`;

export const isStrmLicenseKeyFormat = (value: string) =>
	STRM_LICENSE_KEY_REGEX.test(normalizeStrmLicenseKey(value));
