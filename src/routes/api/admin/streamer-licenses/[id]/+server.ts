import { json, type RequestHandler } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureStreamerLicenseTables,
	getStreamerLicenseById,
	logStreamerLicenseEvent
} from '$lib/server/license/streamer-db';

const bad = (status: number, message: string) => json({ ok: false, message }, { status });

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureStreamerLicenseTables(db);

	const licenseId = (params.id ?? '').trim();
	if (!licenseId) {
		return bad(400, 'id license tidak valid');
	}

	const license = await getStreamerLicenseById(db, licenseId);
	if (!license) {
		return bad(404, 'License tidak ditemukan');
	}

	const now = Date.now();
	await logStreamerLicenseEvent(db, {
		licenseId,
		eventType: 'delete',
		meta: {
			by_user_id: user.id,
			by_email: user.email,
			license_id: license.id,
			license_key: license.license_key_plain,
			plan_type: license.plan_type,
			status: license.status
		},
		now
	});

	const result = await db.prepare('DELETE FROM streamer_licenses WHERE id = ?').bind(licenseId).run();
	const removed = Number(result.meta?.changes ?? 0);
	if (removed < 1) {
		return bad(500, 'Gagal menghapus license');
	}

	return json({
		ok: true,
		id: licenseId
	});
};
