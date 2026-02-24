import { error, json, type RequestHandler } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureLicenseTables,
	logLicenseEvent,
	normalizeLicenseKey
} from '$lib/server/license/db';

export const POST: RequestHandler = async ({ locals, params }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const licenseKey = normalizeLicenseKey(params.key || '');
	if (!licenseKey) {
		throw error(400, 'License key tidak valid');
	}

	const result = await db
		.prepare('DELETE FROM devices WHERE license_key = ?')
		.bind(licenseKey)
		.run();

	await logLicenseEvent(db, {
		licenseKey,
		eventType: 'reset_devices',
		meta: {
			removed: Number(result.meta?.changes ?? 0),
			byUserId: user.id,
			byEmail: user.email
		}
	});

	return json({ ok: true, removed: Number(result.meta?.changes ?? 0) });
};
