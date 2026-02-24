import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	ensureLicenseTables,
	logLicenseEvent,
	normalizeLicenseKey
} from '$lib/server/license/db';
import {
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseById,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	removeStreamerDevice
} from '$lib/server/license/streamer-db';
import { verifyLicenseToken } from '$lib/server/license/streamer-token';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT = {
	scope: 'license:deactivate',
	limit: 45,
	windowMs: 5 * 60 * 1000
};

const getSigningSecret = (platform: App.Platform | undefined) =>
	((platform?.env as Record<string, unknown> | undefined)?.STREAMER_LICENSE_SIGNING_SECRET as string | undefined) ||
	((platform?.env as Record<string, unknown> | undefined)?.LICENSE_SIGNING_SECRET as string | undefined);

const methodNotAllowed = () =>
	json({ ok: false, message: 'Method not allowed. Gunakan POST.' }, { status: 405 });
const notAllowedHandler: RequestHandler = async () => methodNotAllowed();

export const GET = notAllowedHandler;
export const PUT = notAllowedHandler;
export const PATCH = notAllowedHandler;
export const DELETE = notAllowedHandler;
export const OPTIONS = notAllowedHandler;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ ok: false, message: 'Database tidak tersedia' }, { status: 503 });
	}

	const ip = getRequestIp(request) ?? 'unknown';
	const limiter = await consumeApiRateLimit({
		db,
		scope: RATE_LIMIT.scope,
		key: `ip:${ip}`,
		limit: RATE_LIMIT.limit,
		windowMs: RATE_LIMIT.windowMs
	});
	if (!limiter.allowed) {
		return json({ ok: false, message: 'Terlalu banyak request. Coba lagi sebentar.' }, {
			status: 429,
			headers: buildRateLimitHeaders(limiter)
		});
	}

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		// noop
	}

	const token = typeof body?.token === 'string' ? body.token.trim() : '';
	const deviceIdHashInput = typeof body?.device_id_hash === 'string' ? body.device_id_hash.trim() : '';
	if (token || deviceIdHashInput) {
		await ensureStreamerLicenseTables(db);

		if (!token || !deviceIdHashInput) {
			return json({ ok: false, error: 'invalid_payload', message: 'token dan device_id_hash wajib diisi' }, { status: 400 });
		}

		const signingSecret = getSigningSecret(platform);
		if (!signingSecret) {
			return json({ ok: false, message: 'Signing secret license belum dikonfigurasi' }, { status: 500 });
		}

		let claims = null;
		try {
			claims = await verifyLicenseToken(token, signingSecret);
		} catch {
			return json({ ok: false, message: 'Signing secret license belum dikonfigurasi' }, { status: 500 });
		}
		if (!claims) {
			return json({ ok: false, error: 'invalid_token', message: 'Token tidak valid' }, { status: 401 });
		}

		const deviceIdHash = normalizeDeviceIdHash(deviceIdHashInput);
		if (claims.device_id_hash !== deviceIdHash) {
			return json(
				{ ok: false, error: 'device_mismatch', message: 'device_id_hash tidak cocok dengan token' },
				{ status: 400 }
			);
		}
		if (claims.app !== 'santri-streamer') {
			return json({ ok: false, error: 'invalid_token_app', message: 'Token bukan untuk aplikasi santri-streamer' }, { status: 400 });
		}

		const license = await getStreamerLicenseById(db, claims.license_id);
		if (!license) {
			return json({ ok: false, error: 'license_not_found', message: 'License tidak ditemukan' }, { status: 404 });
		}

		const device = await getStreamerDevice(db, license.id, deviceIdHash);
		if (!device) {
			await logStreamerLicenseEvent(db, {
				licenseId: license.id,
				eventType: 'deactivate_failed',
				meta: { reason: 'device_not_registered', device_id_hash: deviceIdHash, app: claims.app, ip }
			});
			return json(
				{ ok: false, error: 'device_not_registered', message: 'Device belum terdaftar untuk license ini' },
				{ status: 404 }
			);
		}

		const removed = await removeStreamerDevice(db, license.id, deviceIdHash);
		await logStreamerLicenseEvent(db, {
			licenseId: license.id,
			eventType: 'deactivate',
			meta: { device_id_hash: deviceIdHash, app: claims.app, removed, ip }
		});

		return json({ ok: true, removed, message: 'Device berhasil dinonaktifkan' });
	}

	await ensureLicenseTables(db);

	let licenseKey = '';
	let deviceId = '';
	licenseKey = typeof body?.license_key === 'string' ? body.license_key.trim() : '';
	deviceId = typeof body?.device_id === 'string' ? body.device_id.trim() : '';

	if (!licenseKey || !deviceId) {
		await logLicenseEvent(db, {
			eventType: 'fail',
			licenseKey: licenseKey || null,
			meta: { reason: 'invalid_deactivate_payload', ip }
		});
		return json({ ok: false, message: 'license_key dan device_id wajib diisi' }, { status: 400 });
	}

	const normalizedKey = normalizeLicenseKey(licenseKey);
	const normalizedDeviceId = deviceId.slice(0, 191);
	const result = await db
		.prepare('DELETE FROM devices WHERE license_key = ? AND device_id = ?')
		.bind(normalizedKey, normalizedDeviceId)
		.run();

	await logLicenseEvent(db, {
		eventType: 'deactivate',
		licenseKey: normalizedKey,
		meta: {
			deviceId: normalizedDeviceId,
			ip,
			removed: Number(result.meta?.changes ?? 0)
		}
	});

	return json({ ok: true, removed: Number(result.meta?.changes ?? 0) });
};
