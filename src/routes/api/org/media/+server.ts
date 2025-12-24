import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addOrgMedia, listOrgMedia } from '$lib/server/org-media';

const allowedRoles = new Set(['admin', 'ustadz', 'ustadzah', 'tamir', 'bendahara']);

const requireOrgAccess = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	if (!locals.user.orgId) {
		throw error(403, 'Organisasi belum terhubung');
	}
	if (!allowedRoles.has(locals.user.role ?? '')) {
		throw error(403, 'Forbidden');
	}
	return { db: locals.db, orgId: locals.user.orgId, userId: locals.user.id };
};

export const GET: RequestHandler = async ({ locals }) => {
	const { db, orgId } = requireOrgAccess(locals);
	const items = await listOrgMedia(db, orgId);
	return json({ items });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, orgId, userId } = requireOrgAccess(locals);
	const body = await request.json().catch(() => ({}));
	const url = typeof body.url === 'string' ? body.url.trim() : '';

	if (!url) {
		throw error(400, 'URL tidak valid');
	}

	const item = await addOrgMedia(db, { orgId, url, createdBy: userId });
	return json({ item }, { status: 201 });
};
