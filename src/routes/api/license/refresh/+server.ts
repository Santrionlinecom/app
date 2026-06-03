import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseById,
	isStreamerLicenseUsable,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	touchStreamerDevice
} from '$lib/server/license/streamer-db';
import { buildClaimsFromLicense, generateLicenseToken, verifyLicenseToken } from '$lib/server/license/streamer-token';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT = {
	scope: 'license:refresh',
	limit: 90,
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
	if (!db) return bad(503, 'db_unavailable', 'Layanan data tidak tersedia');

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

	await ensureStreamerLicenseTables(db);

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return bad(400, 'invalid_json', 'Body JSON tidak valid');
	}

	const token = typeof body.token === 'string' ? body.token.trim() : '';
	const deviceIdHashRaw = typeof body.device_id_hash === 'string' ? body.device_id_hash.trim() : '';
	if (!token || !deviceIdHashRaw) {
		return bad(400, 'invalid_payload', 'Data perangkat wajib diisi');
	}

	const deviceIdHash = normalizeDeviceIdHash(deviceIdHashRaw);
	const signingSecret = getSigningSecret(platform);
	if (!signingSecret) {
		return bad(500, 'signing_secret_missing', 'Konfigurasi lisensi belum siap');
	}

	let claims = null;
	try {
		claims = await verifyLicenseToken(token, signingSecret);
	} catch {
		return bad(500, 'signing_secret_missing', 'Konfigurasi lisensi belum siap');
	}
	if (!claims) {
		return bad(401, 'invalid_token', 'Kode akses tidak valid');
	}
	if (claims.device_id_hash !== deviceIdHash) {
		return bad(400, 'device_mismatch', 'Data perangkat tidak cocok');
	}
	if (claims.app !== 'santri-streamer') {
		return bad(400, 'invalid_token_app', 'Kode akses bukan untuk aplikasi ini');
	}

	const now = Date.now();
	const license = await getStreamerLicenseById(db, claims.license_id);
	if (!license) {
		return bad(404, 'license_not_found', 'License tidak ditemukan');
	}

	const usable = isStreamerLicenseUsable(license, now);
	if (!usable.ok) {
		return bad(403, usable.code, `License ${usable.code}`);
	}

	const device = await getStreamerDevice(db, license.id, deviceIdHash);
	if (!device) {
		await logStreamerLicenseEvent(db, {
			licenseId: license.id,
			eventType: 'refresh_failed',
			meta: { reason: 'device_not_registered', device_id_hash: deviceIdHash, app: claims.app, ip: getRequestIp(request) },
			now
		});
		return bad(403, 'device_not_registered', 'Device belum terdaftar untuk license ini');
	}

	await touchStreamerDevice(db, { licenseId: license.id, deviceIdHash, now });
	await logStreamerLicenseEvent(db, {
		licenseId: license.id,
		eventType: 'refresh',
		meta: { device_id_hash: deviceIdHash, app: claims.app, ip: getRequestIp(request) },
		now
	});

	let nextToken = '';
	try {
		nextToken = await generateLicenseToken(
			buildClaimsFromLicense({
				license,
				validUntilMs: usable.validUntil ?? null,
				issuedAtMs: now,
				deviceIdHash,
				app: claims.app
			}),
			signingSecret
		);
	} catch {
		return bad(500, 'signing_secret_missing', 'Konfigurasi lisensi belum siap');
	}

	return json({ token: nextToken });
};
