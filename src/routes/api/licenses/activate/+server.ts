import { json, type RequestHandler } from '@sveltejs/kit';
import { getD1 } from '$lib/server/cloudflare';
import { getRequestIp } from '$lib/server/logger';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import {
	countActiveActivations,
	getActivation,
	getFeaturesForLicense,
	getLicenseByKeyHash,
	getMaxDevicesForLicense,
	getPlanForLicense,
	hashLicenseKey,
	isLicenseExpired,
	isValidDeviceHash,
	isValidProductSlug,
	normalizeDeviceHash,
	normalizeProductSlug,
	upsertActivation
} from '$lib/server/licenses/digital-products';

const RATE_LIMIT = {
	scope: 'digital-license:activate',
	limit: 60,
	windowMs: 5 * 60 * 1000
};

const payloadResponse = (
	status: string,
	plan: string | null = null,
	expiresAt: number | null = null,
	features: string[] = [],
	detail?: { missingFields?: string[]; invalidFields?: string[] }
) => ({
	status,
	plan,
	expiresAt,
	features,
	...(detail ? { detail } : {})
});

const parseBody = async (request: Request) => {
	const body = await request.json().catch(() => ({}));
	return {
		licenseKey:
			typeof body?.licenseKey === 'string'
				? body.licenseKey.trim()
				: typeof body?.license_key === 'string'
					? body.license_key.trim()
					: '',
		deviceHash:
			typeof body?.deviceHash === 'string'
				? body.deviceHash.trim()
				: typeof body?.device_hash === 'string'
					? body.device_hash.trim()
					: '',
		productSlug:
			typeof body?.productSlug === 'string'
				? body.productSlug.trim()
				: typeof body?.product_slug === 'string'
					? body.product_slug.trim()
					: '',
		deviceName:
			typeof body?.deviceName === 'string'
				? body.deviceName.trim()
				: typeof body?.device_name === 'string'
					? body.device_name.trim()
					: '',
		appVersion:
			typeof body?.appVersion === 'string'
				? body.appVersion.trim()
				: typeof body?.app_version === 'string'
					? body.app_version.trim()
					: ''
	};
};

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

	const { licenseKey, deviceHash: rawDeviceHash, productSlug: rawProductSlug, deviceName, appVersion } =
		await parseBody(request);
	const deviceHash = normalizeDeviceHash(rawDeviceHash);
	const productSlug = normalizeProductSlug(rawProductSlug);
	const missingFields = [
		!licenseKey ? 'licenseKey' : null,
		!rawDeviceHash ? 'deviceHash' : null,
		!rawProductSlug ? 'productSlug' : null
	].filter((field): field is string => Boolean(field));
	const invalidFields = [
		rawDeviceHash && !isValidDeviceHash(deviceHash) ? 'deviceHash' : null,
		rawProductSlug && !isValidProductSlug(productSlug) ? 'productSlug' : null
	].filter((field): field is string => Boolean(field));
	if (missingFields.length || invalidFields.length) {
		return json(payloadResponse('invalid_payload', null, null, [], { missingFields, invalidFields }), {
			status: 400
		});
	}

	const licenseKeyHash = await hashLicenseKey(licenseKey, getHashSecret(platform));
	const license = await getLicenseByKeyHash(db, licenseKeyHash, productSlug);
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

	const existingActivation = await getActivation(db, license.licenseId, deviceHash);
	if (existingActivation?.status !== 'active') {
		const activeDevices = await countActiveActivations(db, license.licenseId);
		const maxDevices = getMaxDevicesForLicense(license);
		if (activeDevices >= maxDevices) {
			return json(payloadResponse('device_limit_reached', plan, expiresAt, features), { status: 409 });
		}
	}

	await upsertActivation(db, {
		licenseId: license.licenseId,
		deviceHash,
		deviceName,
		metadata: { ip, appVersion: appVersion || null },
		now
	});

	await db
		.prepare('UPDATE licenses SET activated_at = COALESCE(activated_at, ?), updated_at = ? WHERE license_key = ?')
		.bind(now, now, license.licenseId)
		.run();

	return json(payloadResponse('active', plan, expiresAt, features));
};
