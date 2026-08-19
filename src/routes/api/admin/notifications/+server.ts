import { json } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { kirimPushSuperAdmin } from '$lib/server/notifications/super-admin-push';
import { getSuperAdminNotifications } from '$lib/server/super-admin-notifications';

import type { RequestHandler } from './$types';

/**
 * Sumber data lonceng notifikasi di header. Sekaligus memicu Web Push untuk
 * kejadian yang belum pernah dikirim ke perangkat superadmin ini.
 *
 * Push dipicu di sini (bukan cron) karena Cloudflare Pages tidak menyediakan
 * scheduled worker untuk proyek ini.
 */
export const GET: RequestHandler = async ({ locals, platform, fetch }) => {
	const { user, db } = requireSuperAdmin(locals);

	const { notifications, notificationCounts } = await getSuperAdminNotifications(db);

	const env = platform?.env ?? {};
	await kirimPushSuperAdmin({ db, fetchFn: fetch, env, userId: user.id, notifications });

	return json(
		{ notifications, counts: notificationCounts },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
};
