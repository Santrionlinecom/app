import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	LICENSE_GRACE_DAYS,
	ensureLicenseTables,
	getLicenseByKey,
	logLicenseEvent,
	normalizeLicenseKey,
	normalizeLicenseStatus,
	type LicenseVerifyStatus
} from '$lib/server/license/db';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import { signPayload } from '$lib/server/license/sign';

const RATE_LIMIT = {
	scope: 'license:verify',
	limit: 90,
	windowMs: 5 * 60 * 1000
};

const parseBody = async (request: Request) => {
	try {
		const body = await request.json();
		return {
			licenseKey: typeof body?.license_key === 'string' ? body.license_key.trim() : '',
			deviceId: typeof body?.device_id === 'string' ? body.device_id.trim() : '',
			deviceName: typeof body?.device_name === 'string' ? body.device_name.trim() : '',
			appVersion: typeof body?.app_version === 'string' ? body.app_version.trim() : ''
		};
	} catch {
		return {
			licenseKey: '',
			deviceId: '',
			deviceName: '',
			appVersion: ''
		};
	}
};

const invalidResponse = (params: {
	status: LicenseVerifyStatus;
	message: string;
	now: number;
	plan?: string | null;
	deviceLimit?: number | null;
	expiresAt?: number | null;
}) => ({
	valid: false,
	status: params.status,
	plan: params.plan ?? null,
	device_limit: params.deviceLimit ?? null,
	expires_at: params.expiresAt ?? null,
	grace_days: LICENSE_GRACE_DAYS,
	server_time: params.now,
	payload: null,
	signature: null,
	message: params.message
});

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json(invalidResponse({ status: 'not_found', message: 'Database tidak tersedia', now: Date.now() }), {
			status: 503
		});
	}

	await ensureLicenseTables(db);

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
			invalidResponse({ status: 'not_found', message: 'Terlalu banyak request. Coba lagi sebentar.', now: Date.now() }),
			{ status: 429, headers: buildRateLimitHeaders(limiter) }
		);
	}

	const { licenseKey, deviceId, deviceName, appVersion } = await parseBody(request);
	const now = Date.now();

	if (!licenseKey || !deviceId) {
		await logLicenseEvent(db, {
			eventType: 'fail',
			licenseKey: licenseKey || null,
			meta: { reason: 'invalid_payload', deviceId, appVersion, ip }
		});
		return json(invalidResponse({ status: 'not_found', message: 'license_key dan device_id wajib diisi', now }), {
			status: 400
		});
	}

	const normalizedKey = normalizeLicenseKey(licenseKey);
	const normalizedDeviceId = deviceId.slice(0, 191);
	const normalizedDeviceName = deviceName ? deviceName.slice(0, 191) : null;

	let license = await getLicenseByKey(db, normalizedKey);
	if (!license) {
		await logLicenseEvent(db, {
			eventType: 'fail',
			licenseKey: normalizedKey,
			meta: { reason: 'not_found', deviceId: normalizedDeviceId, appVersion, ip }
		});
		return json(invalidResponse({ status: 'not_found', message: 'License tidak ditemukan', now }));
	}

	license = await normalizeLicenseStatus(db, license, now);

	if (license.status === 'revoked') {
		await logLicenseEvent(db, {
			eventType: 'fail',
			licenseKey: normalizedKey,
			meta: { reason: 'revoked', deviceId: normalizedDeviceId, appVersion, ip }
		});
		return json(
			invalidResponse({
				status: 'revoked',
				message: 'License sudah dicabut',
				now,
				plan: license.plan,
				deviceLimit: license.device_limit,
				expiresAt: license.expires_at
			})
		);
	}

	if (license.status === 'expired') {
		await logLicenseEvent(db, {
			eventType: 'fail',
			licenseKey: normalizedKey,
			meta: { reason: 'expired', deviceId: normalizedDeviceId, appVersion, ip }
		});
		return json(
			invalidResponse({
				status: 'expired',
				message: 'License sudah kedaluwarsa',
				now,
				plan: license.plan,
				deviceLimit: license.device_limit,
				expiresAt: license.expires_at
			})
		);
	}

	const currentDevice = await db
		.prepare(
			`SELECT id, device_id
			 FROM devices
			 WHERE license_key = ? AND device_id = ?`
		)
		.bind(normalizedKey, normalizedDeviceId)
		.first<{ id: number; device_id: string }>();

	if (!currentDevice) {
		const countRow = await db
			.prepare('SELECT COUNT(*) as total FROM devices WHERE license_key = ?')
			.bind(normalizedKey)
			.first<{ total: number | null }>();
		const deviceCount = Number(countRow?.total ?? 0);

		if (deviceCount >= license.device_limit) {
			await logLicenseEvent(db, {
				eventType: 'fail',
				licenseKey: normalizedKey,
				meta: {
					reason: 'device_limit',
					deviceId: normalizedDeviceId,
					deviceCount,
					deviceLimit: license.device_limit,
					appVersion,
					ip
				}
			});
			return json(
				invalidResponse({
					status: 'device_limit',
					message: 'Batas perangkat untuk license ini sudah tercapai',
					now,
					plan: license.plan,
					deviceLimit: license.device_limit,
					expiresAt: license.expires_at
				})
			);
		}

		await db
			.prepare(
				`INSERT INTO devices (license_key, device_id, device_name, activated_at, last_seen_at)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(normalizedKey, normalizedDeviceId, normalizedDeviceName, now, now)
			.run();

		await logLicenseEvent(db, {
			eventType: 'activate',
			licenseKey: normalizedKey,
			meta: { deviceId: normalizedDeviceId, deviceName: normalizedDeviceName, appVersion, ip }
		});
	} else {
		await db
			.prepare('UPDATE devices SET last_seen_at = ?, device_name = COALESCE(?, device_name) WHERE id = ?')
			.bind(now, normalizedDeviceName, currentDevice.id)
			.run();
	}

	await logLicenseEvent(db, {
		eventType: 'verify',
		licenseKey: normalizedKey,
		meta: { deviceId: normalizedDeviceId, deviceName: normalizedDeviceName, appVersion, ip }
	});

	const payload = {
		license_key: license.license_key,
		plan: license.plan,
		status: license.status,
		device_id: normalizedDeviceId,
		device_limit: license.device_limit,
		expires_at: license.expires_at,
		grace_days: LICENSE_GRACE_DAYS,
		issued_at: now,
		server_time: now
	};
	const payloadJson = JSON.stringify(payload);
	const signature = await signPayload(payloadJson, platform?.env?.LICENSE_SIGNING_SECRET);

	return json({
		valid: true,
		status: 'active',
		plan: license.plan,
		device_limit: license.device_limit,
		expires_at: license.expires_at,
		grace_days: LICENSE_GRACE_DAYS,
		server_time: now,
		payload,
		signature,
		message: 'License valid'
	});
};
