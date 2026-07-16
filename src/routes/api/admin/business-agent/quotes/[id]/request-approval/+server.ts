import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { runIdempotentAdminBusinessMutation } from '$lib/server/business-agent/admin-idempotency';
import { businessApiError } from '$lib/server/business-agent/http';
import { requestQuoteApproval } from '$lib/server/business-agent/repository';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	if (!params.id) return json({ ok: false, message: 'ID quote tidak valid' }, { status: 400 });
	try {
		return await runIdempotentAdminBusinessMutation({
			db,
			request,
			actorId: user.id,
			scope: 'admin_request_quote_approval',
			payload: { quoteId: params.id },
			execute: async () => {
				const approval = await requestQuoteApproval(db, params.id!, { id: user.id, type: 'admin' });
				return { response: { ok: true, approval }, resourceId: approval.id, status: 201 };
			}
		});
	} catch (error) {
		return businessApiError(error, 'request_quote_approval');
	}
};
