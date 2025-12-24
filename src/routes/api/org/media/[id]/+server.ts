import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteOrgMedia } from '$lib/server/org-media';

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
	return { db: locals.db, orgId: locals.user.orgId };
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { db, orgId } = requireOrgAccess(locals);
	const id = params.id;
	if (!id) {
		throw error(400, 'ID media tidak valid');
	}

	const deleted = await deleteOrgMedia(db, { orgId, id });
	if (!deleted) {
		throw error(404, 'Media tidak ditemukan');
	}

	return json({ success: true });
};
