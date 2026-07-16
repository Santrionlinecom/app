import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { runIdempotentAdminBusinessMutation } from '$lib/server/business-agent/admin-idempotency';
import { businessApiError } from '$lib/server/business-agent/http';
import { transitionBusinessLead } from '$lib/server/business-agent/repository';
import { leadTransitionSchema } from '$lib/server/business-agent/schemas';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	if (!params.id) return json({ ok: false, message: 'ID lead tidak valid' }, { status: 400 });
	const parsed = leadTransitionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return json({ ok: false, message: 'Transisi lead tidak valid' }, { status: 400 });
	}
	try {
		return await runIdempotentAdminBusinessMutation({
			db,
			request,
			actorId: user.id,
			scope: 'admin_transition_lead',
			payload: { leadId: params.id, ...parsed.data },
			execute: async () => {
				const lead = await transitionBusinessLead(
					db,
					{ leadId: params.id!, ...parsed.data },
					{ id: user.id, type: 'admin' }
				);
				return { response: { ok: true, lead }, resourceId: lead.id };
			}
		});
	} catch (error) {
		return businessApiError(error, 'transition_lead');
	}
};
