import { json, type RequestHandler } from '@sveltejs/kit';
import { getD1 } from '$lib/server/cloudflare';
import { getRequestIp } from '$lib/server/logger';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import {
	deactivateActivation,
	getActivation,
	getFeaturesForLicense,
	getLicenseByKeyHash,
	getPlanForLicense,
	hashLicenseKey,
	isValidDeviceHash,
	normalizeDeviceHash
} from '$lib/server/domains/digital-store/licenses/digital-products';

const RATE_LIMIT = {
	scope: 'digital-license:deactivate',
	limit: 60,
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
	if (!licenseKey || !isValidDeviceHash(deviceHash)) {
		return json(payloadResponse('invalid_payload'), { status: 400 });
	}

	const license = await getLicenseByKeyHash(db, await hashLicenseKey(licenseKey, getHashSecret(platform)));
	if (!license) {
		return json(payloadResponse('not_found'), { status: 404 });
	}

	const plan = getPlanForLicense(license);
	const expiresAt = license.expiresAt ?? null;
	const features = getFeaturesForLicense(license);
	const activation = await getActivation(db, license.licenseId, deviceHash);
	if (activation?.status !== 'active') {
		return json(payloadResponse('not_activated', plan, expiresAt, features), { status: 404 });
	}

	await deactivateActivation(db, { licenseId: license.licenseId, deviceHash, now: Date.now() });

	return json(payloadResponse('deactivated', plan, expiresAt, features));
};
