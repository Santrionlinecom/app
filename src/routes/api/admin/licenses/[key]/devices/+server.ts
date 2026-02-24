import { error, json, type RequestHandler } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureLicenseTables,
	logLicenseEvent,
	normalizeLicenseKey
} from '$lib/server/license/db';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const licenseKey = normalizeLicenseKey(params.key || '');
	if (!licenseKey) {
		throw error(400, 'License key tidak valid');
	}

	const { results } = await db
		.prepare(
			`SELECT id, license_key, device_id, device_name, activated_at, last_seen_at
			 FROM devices
			 WHERE license_key = ?
			 ORDER BY last_seen_at DESC`
		)
		.bind(licenseKey)
		.all();

	return json({ items: results ?? [] });
};

export const DELETE: RequestHandler = async ({ locals, params, url }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const licenseKey = normalizeLicenseKey(params.key || '');
	const deviceId = (url.searchParams.get('device_id') ?? '').trim().slice(0, 191);
	if (!licenseKey || !deviceId) {
		throw error(400, 'license key dan device_id wajib diisi');
	}

	const result = await db
		.prepare('DELETE FROM devices WHERE license_key = ? AND device_id = ?')
		.bind(licenseKey, deviceId)
		.run();

	await logLicenseEvent(db, {
		licenseKey,
		eventType: 'deactivate',
		meta: {
			deviceId,
			removed: Number(result.meta?.changes ?? 0),
			byUserId: user.id,
			byEmail: user.email
		}
	});

	return json({ ok: true, removed: Number(result.meta?.changes ?? 0) });
};
