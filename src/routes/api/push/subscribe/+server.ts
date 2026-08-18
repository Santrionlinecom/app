import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	deletePushSubscription,
	getPushConfig,
	isPushEnabled,
	isValidPushEndpoint,
	isValidSubscriptionKeys,
	savePushSubscription
} from '$lib/server/notifications/push-sender';

// Kunci publik VAPID dibutuhkan browser sebelum berlangganan. Ini memang
// publik — aman dikirim ke klien.
export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env ?? {};
	if (!isPushEnabled(env)) return json({ enabled: false, publicKey: null });
	const config = getPushConfig(env);
	return json({ enabled: Boolean(config), publicKey: config?.publicKey ?? null });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) throw error(401, 'Silakan masuk terlebih dahulu.');
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia.');

	const body = (await request.json().catch(() => null)) as {
		endpoint?: unknown;
		keys?: { p256dh?: unknown; auth?: unknown };
	} | null;

	const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
	const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh.trim() : '';
	const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth.trim() : '';

	if (!isValidPushEndpoint(endpoint)) throw error(400, 'Endpoint push tidak valid.');
	if (!isValidSubscriptionKeys(p256dh, auth)) throw error(400, 'Kunci langganan tidak valid.');

	await savePushSubscription(locals.db, locals.user.id, {
		endpoint,
		p256dh,
		auth,
		userAgent: request.headers.get('user-agent')
	});

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Silakan masuk terlebih dahulu.');
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia.');

	const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
	const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
	if (!endpoint) throw error(400, 'Endpoint wajib diisi.');

	await deletePushSubscription(locals.db, endpoint);
	return json({ ok: true });
};
