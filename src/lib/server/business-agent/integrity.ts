const bytesToHex = (buffer: ArrayBuffer) =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

export const stableJson = (value: unknown): string => {
	if (value === null) return 'null';
	if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) throw new TypeError('Payload harus berisi angka finite');
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right));
		return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
	}
	throw new TypeError('Payload harus JSON-compatible');
};

export const createPayloadHash = async (payload: unknown) => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableJson(payload)));
	return bytesToHex(digest);
};
