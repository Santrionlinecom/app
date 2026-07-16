import { json, type RequestHandler } from '@sveltejs/kit';

import { businessApiError } from '$lib/server/business-agent/http';
import {
	claimBusinessIdempotencyKey,
	completeBusinessIdempotencyKey,
	normalizeBusinessIdempotencyKey,
	releaseBusinessIdempotencyKey
} from '$lib/server/business-agent/idempotency';
import { createPayloadHash } from '$lib/server/business-agent/integrity';
import {
	createBusinessLead,
	createBusinessQuote,
	requestQuoteApproval,
	transitionBusinessLead
} from '$lib/server/business-agent/repository';
import { businessAgentActionSchema } from '$lib/server/business-agent/schemas';
import { isBusinessAgentServiceAuthorized } from '$lib/server/business-agent/service-auth';

const actor = { id: 'hermes-business-agent', type: 'agent' as const };

type BusinessAgentEnv = App.Platform['env'] & {
	BUSINESS_AGENT_AGENT_API_ENABLED?: string;
	BUSINESS_AGENT_SERVICE_TOKEN?: string;
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	const env = platform?.env as BusinessAgentEnv | undefined;
	const db = locals.db ?? env?.DB;
	if (!db) return json({ ok: false, message: 'Layanan data tidak tersedia' }, { status: 503 });

	const enabled = env?.BUSINESS_AGENT_AGENT_API_ENABLED === 'true';
	if (!enabled) return json({ ok: false, message: 'Business Agent API belum diaktifkan' }, { status: 503 });
	if (
		!isBusinessAgentServiceAuthorized({
			authorization: request.headers.get('authorization'),
			enabled,
			secret: env?.BUSINESS_AGENT_SERVICE_TOKEN
		})
	) {
		return json({ ok: false, message: 'Tidak diizinkan' }, { status: 401 });
	}

	const parsed = businessAgentActionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return json({ ok: false, message: 'Action Business Agent tidak valid' }, { status: 400 });

	const idempotencyKey = normalizeBusinessIdempotencyKey(request.headers.get('idempotency-key'));
	if (!idempotencyKey) {
		return json({ ok: false, message: 'Idempotency-Key wajib diisi dengan format aman' }, { status: 400 });
	}
	const idempotencyScope = 'hermes_agent_action';
	const requestHash = await createPayloadHash(parsed.data);
	const claim = await claimBusinessIdempotencyKey(db, {
		scope: idempotencyScope,
		key: idempotencyKey,
		requestHash,
		owner: actor.id
	});
	if (claim.state === 'payload_mismatch') {
		return json({ ok: false, message: 'Idempotency-Key sudah dipakai untuk payload berbeda' }, { status: 409 });
	}
	if (claim.state === 'processing') {
		return json({ ok: false, message: 'Action dengan Idempotency-Key ini sedang diproses' }, { status: 409 });
	}
	if (claim.state === 'completed') return json({ ...claim.response, replayed: true });

	let actionCompleted = false;
	try {
		let response: Record<string, unknown>;
		let resourceId: string;
		let status = 200;
		switch (parsed.data.action) {
			case 'create_lead': {
				const lead = await createBusinessLead(db, parsed.data.input, actor);
				response = { ok: true, lead };
				resourceId = lead.id;
				status = 201;
				break;
			}
			case 'transition_lead': {
				const { leadId, ...transition } = parsed.data.input;
				const lead = await transitionBusinessLead(db, { leadId, ...transition }, actor);
				response = { ok: true, lead };
				resourceId = lead.id;
				break;
			}
			case 'create_quote': {
				const quote = await createBusinessQuote(db, parsed.data.input, actor);
				response = { ok: true, quote };
				resourceId = quote.id;
				status = 201;
				break;
			}
			case 'request_quote_approval': {
				const approval = await requestQuoteApproval(db, parsed.data.input.quoteId, actor);
				response = { ok: true, approval };
				resourceId = approval.id;
				status = 201;
				break;
			}
		}
		actionCompleted = true;
		await completeBusinessIdempotencyKey(db, {
			scope: idempotencyScope,
			key: idempotencyKey,
			requestHash,
			owner: actor.id,
			resourceId,
			response
		});
		return json(response, { status });
	} catch (error) {
		if (!actionCompleted) {
			await releaseBusinessIdempotencyKey(db, {
				scope: idempotencyScope,
				key: idempotencyKey,
				requestHash,
				owner: actor.id
			}).catch(() => undefined);
		}
		return businessApiError(error, 'agent_action');
	}
};
