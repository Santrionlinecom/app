import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { businessApiError } from '$lib/server/business-agent/http';
import { decideQuoteApproval } from '$lib/server/business-agent/repository';
import { approvalDecisionSchema } from '$lib/server/business-agent/schemas';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	if (!params.id) return json({ ok: false, message: 'ID approval tidak valid' }, { status: 400 });
	const parsed = approvalDecisionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return json({ ok: false, message: 'Keputusan approval tidak valid' }, { status: 400 });
	}
	try {
		const approval = await decideQuoteApproval(
			db,
			{ approvalId: params.id, ...parsed.data },
			{ id: user.id, type: 'admin' }
		);
		return json({ ok: true, approval });
	} catch (error) {
		return businessApiError(error, 'decide_quote_approval');
	}
};
