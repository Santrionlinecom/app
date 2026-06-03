import { json, type RequestHandler } from '@sveltejs/kit';
import { getD1 } from '$lib/server/cloudflare';
import { getRequestIp } from '$lib/server/logger';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import {
	getActivation,
	getFeaturesForLicense,
	getLicenseByKeyHash,
	getPlanForLicense,
	hashLicenseKey,
	isLicenseExpired,
	isValidDeviceHash,
	normalizeDeviceHash,
	touchActivation
} from '$lib/server/licenses/digital-products';

const RATE_LIMIT = {
	scope: 'digital-license:verify',
	limit: 120,
	windowMs: 5 * 60 * 1000
};

const payloadResponse = (
	status: string,
	plan: string | null = null,
	expiresAt: number | null = null,
	features: string[] = []
) => ({ status, plan, expiresAt, features });

const getHashSecret = (platform: App.Platform | undefined) => platform?.env?.LICENSE_KEY_HASH_SECRET ?? null;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = getD1({ locals, platform });
	if (!db) {
		return json(payloadResponse('service_unavailable'), { status: 503 });
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
		return json(payloadResponse('rate_limited'), {
			status: 429,
			headers: buildRateLimitHeaders(limiter)
		});
	}

	const body = await request.json().catch(() => ({}));
	const licenseKey = typeof body?.license_key === 'string' ? body.license_key.trim() : '';
	const deviceHash = normalizeDeviceHash(typeof body?.device_hash === 'string' ? body.device_hash : '');
	const deviceName = typeof body?.device_name === 'string' ? body.device_name.trim() : '';
	if (!licenseKey || !isValidDeviceHash(deviceHash)) {
		return json(payloadResponse('invalid_payload'), { status: 400 });
	}

	const license = await getLicenseByKeyHash(db, await hashLicenseKey(licenseKey, getHashSecret(platform)));
	if (!license) {
		return json(payloadResponse('not_found'), { status: 404 });
	}

	const plan = getPlanForLicense(license);
	const features = getFeaturesForLicense(license);
	const expiresAt = license.expiresAt ?? null;
	const now = Date.now();

	if (license.productStatus === 'inactive') {
		return json(payloadResponse('inactive_product', plan, expiresAt, features), { status: 403 });
	}
	if (license.status === 'revoked') {
		return json(payloadResponse('revoked', plan, expiresAt, features), { status: 403 });
	}
	if (license.status === 'expired' || isLicenseExpired(license, now)) {
		return json(payloadResponse('expired', plan, expiresAt, features), { status: 403 });
	}

	const activation = await getActivation(db, license.licenseId, deviceHash);
	if (activation?.status !== 'active') {
		return json(payloadResponse('not_activated', plan, expiresAt, features), { status: 403 });
	}

	await touchActivation(db, { licenseId: license.licenseId, deviceHash, deviceName, now });

	return json(payloadResponse('active', plan, expiresAt, features));
};
