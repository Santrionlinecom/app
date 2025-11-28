import scryptModule from 'scrypt-js';

const { scrypt } = scryptModule;

type ScryptOptions = {
	N?: number;
	r?: number;
	p?: number;
	dkLen?: number;
};

const DEFAULT_OPTS = {
	N: 16384,
	r: 16,
	p: 1,
	dkLen: 64
} satisfies Required<ScryptOptions>;

const hexFromBytes = (bytes: Uint8Array) =>
	Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const hexToBytes = (hex: string) => {
	const cleaned = hex.trim();
	if (cleaned.length % 2 !== 0) {
		throw new Error('Invalid hex string');
	}
	const out = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < cleaned.length; i += 2) {
		out[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
	}
	return out;
};

const constantTimeEqual = (a: Uint8Array, b: Uint8Array) => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}
	return diff === 0;
};

const getRandomBytes = (size: number) => {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return bytes;
};

export class Scrypt {
	N: number;
	r: number;
	p: number;
	dkLen: number;

	constructor(options?: ScryptOptions) {
		this.N = options?.N ?? DEFAULT_OPTS.N;
		this.r = options?.r ?? DEFAULT_OPTS.r;
		this.p = options?.p ?? DEFAULT_OPTS.p;
		this.dkLen = options?.dkLen ?? DEFAULT_OPTS.dkLen;
	}

	async hash(password: string) {
		const salt = getRandomBytes(16);
		const key = await this.generateKey(password, salt);
		return `${hexFromBytes(salt)}:${hexFromBytes(key)}`;
	}

	async verify(hash: string, password: string) {
		const [saltHex, keyHex] = hash.split(':');
		if (!saltHex || !keyHex) return false;
		const salt = hexToBytes(saltHex);
		const expectedKey = hexToBytes(keyHex);
		const derivedKey = await this.generateKey(password, salt);
		return constantTimeEqual(derivedKey, expectedKey);
	}

	private async generateKey(password: string, salt: Uint8Array) {
		const normalized = password.normalize('NFKC');
		const passwordBytes = new TextEncoder().encode(normalized);
		const key = await scrypt(passwordBytes, salt, this.N, this.r, this.p, this.dkLen);
		return new Uint8Array(key);
	}
}
