import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

import {
	claimBusinessIdempotencyKey,
	completeBusinessIdempotencyKey,
	normalizeBusinessIdempotencyKey,
	releaseBusinessIdempotencyKey
} from './idempotency';
import { createPayloadHash } from './integrity';

type IdempotentMutationResult = {
	response: Record<string, unknown>;
	resourceId: string;
	status?: number;
};

export const runIdempotentAdminBusinessMutation = async (input: {
	db: D1Database;
	request: Request;
	actorId: string;
	scope: string;
	payload: unknown;
	execute: () => Promise<IdempotentMutationResult>;
}) => {
	const key = normalizeBusinessIdempotencyKey(input.request.headers.get('idempotency-key'));
	if (!key) return json({ ok: false, message: 'Idempotency-Key wajib diisi dengan format aman' }, { status: 400 });

	const owner = `admin:${input.actorId}`;
	const requestHash = await createPayloadHash({ scope: input.scope, payload: input.payload });
	const claim = await claimBusinessIdempotencyKey(input.db, {
		scope: input.scope,
		key,
		requestHash,
		owner
	});
	if (claim.state === 'payload_mismatch') {
		return json({ ok: false, message: 'Idempotency-Key sudah dipakai untuk payload berbeda' }, { status: 409 });
	}
	if (claim.state === 'processing') {
		return json({ ok: false, message: 'Action dengan Idempotency-Key ini sedang diproses' }, { status: 409 });
	}
	if (claim.state === 'completed') return json({ ...claim.response, replayed: true });

	let mutationCompleted = false;
	try {
		const result = await input.execute();
		mutationCompleted = true;
		await completeBusinessIdempotencyKey(input.db, {
			scope: input.scope,
			key,
			requestHash,
			owner,
			resourceId: result.resourceId,
			response: result.response
		});
		return json(result.response, { status: result.status ?? 200 });
	} catch (error) {
		if (!mutationCompleted) {
			await releaseBusinessIdempotencyKey(input.db, { scope: input.scope, key, requestHash, owner }).catch(() => undefined);
		}
		throw error;
	}
};
