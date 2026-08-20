import { json } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { kirimPushSuperAdmin } from '$lib/server/notifications/super-admin-push';
import {
	dismissSuperAdminNotification,
	getSuperAdminNotifications
} from '$lib/server/super-admin-notifications';

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

/**
 * Menandai notifikasi sebagai sudah dibaca.
 *
 * Notifikasi di sini bukan antrean melainkan hasil query keadaan (misalnya
 * "topup menunggu verifikasi"), sehingga membuka halamannya saja tidak
 * membuatnya hilang. Tanpa penandaan eksplisit, angka di lonceng akan tetap
 * bertahan meski seluruh notifikasi sudah diklik.
 *
 * Body:
 *   { id: "<notification_id>" }  menandai satu notifikasi
 *   { semua: true }              menandai semua yang sedang tampil
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const { user, db } = requireSuperAdmin(locals);

	let muatan: { id?: unknown; semua?: unknown } = {};
	try {
		muatan = await request.json();
	} catch {
		return json({ ok: false, error: 'Body tidak valid.' }, { status: 400 });
	}

	if (muatan.semua === true) {
		// Hanya menandai yang benar-benar sedang tampil, supaya notifikasi yang
		// muncul setelah permintaan ini tidak ikut terhapus tanpa dilihat.
		const { notifications } = await getSuperAdminNotifications(db);
		for (const item of notifications) {
			await dismissSuperAdminNotification(db, item.id, user.id);
		}
		return json({ ok: true, ditandai: notifications.length });
	}

	const id = typeof muatan.id === 'string' ? muatan.id.trim() : '';
	if (!id) {
		return json({ ok: false, error: 'Notifikasi tidak valid.' }, { status: 400 });
	}

	const hasil = await dismissSuperAdminNotification(db, id, user.id);
	if (!hasil.ok) {
		return json({ ok: false, error: hasil.error }, { status: 400 });
	}

	return json({ ok: true, ditandai: 1 });
};
