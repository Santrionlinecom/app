import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request, locals, url, platform }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const body = await request.json().catch(() => ({}));
	const actionRaw = typeof body.action === 'string' ? body.action.trim() : '';
	if (!actionRaw) {
		throw error(400, 'Action wajib diisi');
	}
	if (actionRaw.length > 64) {
		throw error(400, 'Action terlalu panjang');
	}

	const metadataBase =
		body && typeof body.metadata === 'object' && body.metadata !== null && !Array.isArray(body.metadata)
			? body.metadata
			: typeof body.metadata === 'string'
				? { note: body.metadata }
				: {};

	const metadata = {
		...metadataBase,
		source: typeof body.source === 'string' ? body.source : undefined,
		path: typeof body.path === 'string' ? body.path : url.pathname,
		referrer: request.headers.get('referer') ?? undefined
	};

	await logActivity(locals.db, {
		userId: locals.user.id,
		action: actionRaw.toUpperCase(),
		metadata
	});
	logSystemActivity(locals.db, actionRaw.toUpperCase(), {
		userId: locals.user.id,
		userEmail: locals.user.email,
		ipAddress: getRequestIp(request),
		metadata,
		waitUntil: platform?.context?.waitUntil
	});

	return json({ ok: true });
};
