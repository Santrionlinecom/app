import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { businessApiError } from '$lib/server/business-agent/http';
import { requestQuoteApproval } from '$lib/server/business-agent/repository';

export const POST: RequestHandler = async ({ locals, params }) => {
	const { db, user } = requireSuperAdmin(locals);
	if (!params.id) return json({ ok: false, message: 'ID quote tidak valid' }, { status: 400 });
	try {
		const approval = await requestQuoteApproval(db, params.id, { id: user.id, type: 'admin' });
		return json({ ok: true, approval }, { status: 201 });
	} catch (error) {
		return businessApiError(error, 'request_quote_approval');
	}
};
