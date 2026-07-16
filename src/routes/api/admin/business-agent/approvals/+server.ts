import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { listPendingBusinessApprovals } from '$lib/server/business-agent/repository';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const limit = Number(url.searchParams.get('limit') ?? 50);
	return json({ ok: true, approvals: await listPendingBusinessApprovals(db, limit) });
};
