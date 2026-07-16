import type { D1Database } from '@cloudflare/workers-types';

const keyPattern = /^[A-Za-z0-9:_-]{16,128}$/;

export const normalizeBusinessIdempotencyKey = (value: string | null | undefined) => {
	if (!value || !keyPattern.test(value)) return null;
	return value;
};

type IdempotencyRow = {
	requestHash: string;
	resourceId: string;
	responseJson: string;
};

export type BusinessIdempotencyClaim =
	| { state: 'claimed' }
	| { state: 'processing' }
	| { state: 'payload_mismatch' }
	| { state: 'completed'; response: Record<string, unknown> };

export const claimBusinessIdempotencyKey = async (
	db: D1Database,
	input: {
		scope: string;
		key: string;
		requestHash: string;
		owner: string;
		now?: number;
	}
): Promise<BusinessIdempotencyClaim> => {
	const now = input.now ?? Date.now();
	const processingOwner = `processing:${input.owner}`;
	const result = await db
		.prepare(
			`INSERT OR IGNORE INTO business_idempotency_keys (
				scope, idempotency_key, request_hash, resource_id, response_json, created_at, expires_at
			 ) VALUES (?, ?, ?, ?, '{}', ?, ?)`
		)
		.bind(input.scope, input.key, input.requestHash, processingOwner, now, now + 86_400_000)
		.run();
	if (Number(result.meta?.changes ?? 0) === 1) return { state: 'claimed' };

	const row = await db
		.prepare(
			`SELECT request_hash AS requestHash, resource_id AS resourceId, response_json AS responseJson
			 FROM business_idempotency_keys WHERE scope = ? AND idempotency_key = ?`
		)
		.bind(input.scope, input.key)
		.first<IdempotencyRow>();
	if (!row) return { state: 'processing' };
	if (row.requestHash !== input.requestHash) return { state: 'payload_mismatch' };
	if (row.resourceId.startsWith('processing:')) return { state: 'processing' };

	try {
		const response = JSON.parse(row.responseJson);
		if (response && typeof response === 'object' && !Array.isArray(response)) {
			return { state: 'completed', response: response as Record<string, unknown> };
		}
	} catch {
		// Corrupt response data remains fail-closed as processing.
	}
	return { state: 'processing' };
};

export const completeBusinessIdempotencyKey = async (
	db: D1Database,
	input: {
		scope: string;
		key: string;
		requestHash: string;
		owner: string;
		resourceId: string;
		response: Record<string, unknown>;
	}
) => {
	const result = await db
		.prepare(
			`UPDATE business_idempotency_keys
			 SET resource_id = ?, response_json = ?
			 WHERE scope = ? AND idempotency_key = ? AND request_hash = ? AND resource_id = ?`
		)
		.bind(
			input.resourceId,
			JSON.stringify(input.response),
			input.scope,
			input.key,
			input.requestHash,
			`processing:${input.owner}`
		)
		.run();
	if (Number(result.meta?.changes ?? 0) !== 1) throw new Error('Idempotency result gagal disimpan');
};

export const releaseBusinessIdempotencyKey = async (
	db: D1Database,
	input: { scope: string; key: string; requestHash: string; owner: string }
) => {
	await db
		.prepare(
			`DELETE FROM business_idempotency_keys
			 WHERE scope = ? AND idempotency_key = ? AND request_hash = ? AND resource_id = ?`
		)
		.bind(input.scope, input.key, input.requestHash, `processing:${input.owner}`)
		.run();
};
