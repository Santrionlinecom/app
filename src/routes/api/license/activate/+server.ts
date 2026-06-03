import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	activateDesktopLicense,
	desktopLicenseResponseStatus,
	desktopServerError,
	isDesktopLicenseContractRequest
} from '$lib/server/license/streamer-desktop';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import {
	countStreamerDevices,
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseByKey,
	isStreamerLicenseUsable,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	upsertStreamerDevice
} from '$lib/server/license/streamer-db';
import { buildClaimsFromLicense, generateLicenseToken } from '$lib/server/license/streamer-token';

const RATE_LIMIT = {
	scope: 'license:activate',
	limit: 30,
	windowMs: 5 * 60 * 1000
};

const bad = (status: number, error: string, message: string) => json({ ok: false, error, message }, { status });
const methodNotAllowed = () =>
	json({ ok: false, message: 'Method not allowed. Gunakan POST.' }, { status: 405 });
const notAllowedHandler: RequestHandler = async () => methodNotAllowed();

const getSigningSecret = (platform: App.Platform | undefined) =>
	((platform?.env as Record<string, unknown> | undefined)?.STREAMER_LICENSE_SIGNING_SECRET as string | undefined) ||
	((platform?.env as Record<string, unknown> | undefined)?.LICENSE_SIGNING_SECRET as string | undefined);

export const GET = notAllowedHandler;
export const PUT = notAllowedHandler;
export const PATCH = notAllowedHandler;
export const DELETE = notAllowedHandler;
export const OPTIONS = notAllowedHandler;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return json(desktopServerError(), { status: 503 });

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
			{ ok: false, error: 'rate_limit', message: 'Terlalu banyak request. Coba lagi sebentar.' },
			{ status: 429, headers: buildRateLimitHeaders(limiter) }
		);
	}

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return json({ ok: false, reason: 'request invalid' }, { status: 400 });
	}

	if (isDesktopLicenseContractRequest(body)) {
		try {
			const result = await activateDesktopLicense({
				body,
				db,
				ip: getRequestIp(request)
			});
			return json(result, { status: desktopLicenseResponseStatus(result) });
		} catch {
			return json(desktopServerError(), { status: 500 });
		}
	}

	try {
		await ensureStreamerLicenseTables(db);

		const licenseKey = typeof body.license_key === 'string' ? body.license_key.trim() : '';
		const deviceIdHashRaw = typeof body.device_id_hash === 'string' ? body.device_id_hash.trim() : '';
		const app = typeof body.app === 'string' ? body.app.trim() : '';
		const version = typeof body.version === 'string' ? body.version.trim() : '';

		if (!licenseKey || !deviceIdHashRaw || !app || !version) {
			return bad(400, 'invalid_payload', 'Data lisensi, perangkat, aplikasi, dan versi wajib diisi');
		}
		if (app !== 'santri-streamer') {
			return bad(400, 'invalid_app', 'app harus "santri-streamer"');
		}

		const deviceIdHash = normalizeDeviceIdHash(deviceIdHashRaw);
		if (deviceIdHash.length < 8 || deviceIdHash.length > 255) {
			return bad(400, 'invalid_device_id_hash', 'Data perangkat tidak valid');
		}

		const now = Date.now();
		const ip = getRequestIp(request);
		const license = await getStreamerLicenseByKey(db, licenseKey);

		if (!license) {
			await logStreamerLicenseEvent(db, {
				eventType: 'activate_failed',
				meta: { reason: 'license_not_found', app, version: version || null, device_id_hash: deviceIdHash, ip }
			});
			return bad(404, 'license_not_found', 'License tidak ditemukan');
		}

		const usable = isStreamerLicenseUsable(license, now);
		if (!usable.ok) {
			await logStreamerLicenseEvent(db, {
				licenseId: license.id,
				eventType: 'activate_failed',
				meta: { reason: usable.code, app, version: version || null, device_id_hash: deviceIdHash, ip },
				now
			});
			return bad(usable.code === 'revoked' ? 403 : 403, usable.code, `License ${usable.code}`);
		}

		const existingDevice = await getStreamerDevice(db, license.id, deviceIdHash);
		if (!existingDevice) {
			const deviceCount = await countStreamerDevices(db, license.id);
			if (deviceCount >= license.max_devices) {
				await logStreamerLicenseEvent(db, {
					licenseId: license.id,
					eventType: 'activate_failed',
					meta: {
						reason: 'device_limit_reached',
						app,
						version: version || null,
						device_id_hash: deviceIdHash,
						device_count: deviceCount,
						max_devices: license.max_devices,
						ip
					},
					now
				});
				return bad(409, 'device_limit_reached', 'Batas device untuk license ini sudah penuh');
			}
		}

		await upsertStreamerDevice(db, { licenseId: license.id, deviceIdHash, now });
		await logStreamerLicenseEvent(db, {
			licenseId: license.id,
			eventType: existingDevice ? 'refresh_touch' : 'activate',
			meta: { app, version: version || null, device_id_hash: deviceIdHash, ip },
			now
		});

		const signingSecret = getSigningSecret(platform);
		if (!signingSecret) {
			return bad(500, 'signing_secret_missing', 'Konfigurasi lisensi belum siap');
		}

		let token = '';
		try {
			token = await generateLicenseToken(
				buildClaimsFromLicense({
					license,
					validUntilMs: usable.validUntil ?? null,
					issuedAtMs: now,
					deviceIdHash,
					app
				}),
				signingSecret
			);
		} catch {
			return bad(500, 'signing_secret_missing', 'Konfigurasi lisensi belum siap');
		}

		return json({ token });
	} catch {
		return bad(500, 'server_error', 'Terjadi kesalahan pada layanan');
	}
};
