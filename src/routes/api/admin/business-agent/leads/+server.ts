import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { runIdempotentAdminBusinessMutation } from '$lib/server/business-agent/admin-idempotency';
import { businessApiError } from '$lib/server/business-agent/http';
import { createBusinessLead, listBusinessLeads } from '$lib/server/business-agent/repository';
import { createLeadSchema } from '$lib/server/business-agent/schemas';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const limit = Number(url.searchParams.get('limit') ?? 50);
	return json({ ok: true, leads: await listBusinessLeads(db, limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	const parsed = createLeadSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return json({ ok: false, message: 'Data lead belum lengkap atau tidak valid' }, { status: 400 });
	}
	try {
		return await runIdempotentAdminBusinessMutation({
			db,
			request,
			actorId: user.id,
			scope: 'admin_create_lead',
			payload: parsed.data,
			execute: async () => {
				const lead = await createBusinessLead(db, parsed.data, { id: user.id, type: 'admin' });
				return { response: { ok: true, lead }, resourceId: lead.id, status: 201 };
			}
		});
	} catch (error) {
		return businessApiError(error, 'create_lead');
	}
};
