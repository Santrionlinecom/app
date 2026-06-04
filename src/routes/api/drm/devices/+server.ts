import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { deleteDrmDevice, ensureDrmSchema, listDrmDevices } from '$lib/server/domains/buku/drm';

export const GET: RequestHandler = async ({ platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk melanjutkan.');
	}

	const db = requireD1({ locals, platform });
	await ensureDrmSchema(db);
	const devices = await listDrmDevices(db, locals.user.id);

	return json({ devices });
};

export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk melanjutkan.');
	}

	const { deviceId } = await request.json();
	const normalizedDeviceId = String(deviceId || '').trim();
	if (!normalizedDeviceId) throw error(400, 'Perangkat tidak valid.');

	const db = requireD1({ locals, platform });
	await ensureDrmSchema(db);
	await deleteDrmDevice(db, locals.user.id, normalizedDeviceId);

	return json({ success: true });
};
