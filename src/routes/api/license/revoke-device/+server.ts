import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseByHash,
	hashLicenseKey,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	removeStreamerDevice
} from '$lib/server/license/streamer-db';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT = {
	scope: 'streamer-license:revoke-device',
	limit: 30,
	windowMs: 5 * 60 * 1000
} as const;

const bad = (status: number, error: string, message: string) => json({ ok: false, error, message }, { status });

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return bad(503, 'db_unavailable', 'Database D1 tidak tersedia');
	await ensureStreamerLicenseTables(db);

	const ip = getRequestIp(request) ?? 'unknown';
	const limiter = await consumeApiRateLimit({
		db,
		scope: RATE_LIMIT.scope,
		key: `ip:${ip}`,
		limit: RATE_LIMIT.limit,
		windowMs: RATE_LIMIT.windowMs
	});
	if (!limiter.allowed) {
		return json(
			{ ok: false, error: 'rate_limited', message: 'Terlalu banyak request. Coba lagi sebentar.' },
			{ status: 429, headers: buildRateLimitHeaders(limiter) }
		);
	}

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return bad(400, 'invalid_json', 'Body JSON tidak valid');
	}

	const licenseKey = typeof body.license_key === 'string' ? body.license_key.trim() : '';
	const deviceIdHashRaw = typeof body.device_id_hash === 'string' ? body.device_id_hash.trim() : '';
	if (!licenseKey || !deviceIdHashRaw) {
		return bad(400, 'invalid_payload', 'license_key dan device_id_hash wajib diisi');
	}

	const licenseKeyHash = await hashLicenseKey(licenseKey);
	const license = await getStreamerLicenseByHash(db, licenseKeyHash);
	if (!license) {
		await logStreamerLicenseEvent(db, {
			eventType: 'revoke_device_failed',
			meta: { reason: 'license_not_found', ip }
		});
		return bad(404, 'license_not_found', 'License tidak ditemukan');
	}

	const deviceIdHash = normalizeDeviceIdHash(deviceIdHashRaw);
	const device = await getStreamerDevice(db, license.id, deviceIdHash);
	if (!device) {
		await logStreamerLicenseEvent(db, {
			licenseId: license.id,
			eventType: 'revoke_device_failed',
			meta: { reason: 'device_not_registered', device_id_hash: deviceIdHash, ip }
		});
		return bad(404, 'device_not_registered', 'Device tidak ditemukan pada license ini');
	}

	const removed = await removeStreamerDevice(db, license.id, deviceIdHash);
	await logStreamerLicenseEvent(db, {
		licenseId: license.id,
		eventType: 'revoke_device',
		meta: { device_id_hash: deviceIdHash, removed, ip }
	});

	return json({ ok: true, removed });
};

