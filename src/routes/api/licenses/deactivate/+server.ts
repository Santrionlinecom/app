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
	isValidProductSlug,
	normalizeDeviceHash,
	normalizeProductSlug
} from '$lib/server/domains/digital-store/licenses/digital-products';
import { licensePayload, parseLicenseApiBody } from '$lib/server/domains/digital-store/licenses/request';

const RATE_LIMIT = {
	scope: 'digital-license:deactivate',
	limit: 60,
	windowMs: 5 * 60 * 1000
};

const getHashSecret = (platform: App.Platform | undefined) => platform?.env?.LICENSE_KEY_HASH_SECRET ?? null;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = getD1({ locals, platform });
	if (!db) {
		return json(licensePayload('service_unavailable'), { status: 503 });
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
		return json(licensePayload('rate_limited'), {
			status: 429,
			headers: buildRateLimitHeaders(limiter)
		});
	}

	const body = await parseLicenseApiBody(request);
	const deviceHash = normalizeDeviceHash(body.deviceHash);
	const productSlug = body.productSlug ? normalizeProductSlug(body.productSlug) : null;
	const missingFields = [
		!body.licenseKey ? 'licenseKey' : null,
		!body.deviceHash ? 'deviceHash' : null
	].filter((field): field is string => Boolean(field));
	const invalidFields = [
		body.deviceHash && !isValidDeviceHash(deviceHash) ? 'deviceHash' : null,
		productSlug && !isValidProductSlug(productSlug) ? 'productSlug' : null
	].filter((field): field is string => Boolean(field));
	if (missingFields.length || invalidFields.length) {
		return json(licensePayload('invalid_payload', null, null, [], { missingFields, invalidFields }), {
			status: 400
		});
	}

	const license = await getLicenseByKeyHash(
		db,
		await hashLicenseKey(body.licenseKey, getHashSecret(platform)),
		productSlug
	);
	if (!license) {
		return json(licensePayload('not_found'), { status: 404 });
	}

	const plan = getPlanForLicense(license);
	const expiresAt = license.expiresAt ?? null;
	const features = getFeaturesForLicense(license);
	const activation = await getActivation(db, license.licenseId, deviceHash);
	if (activation?.status !== 'active') {
		return json(licensePayload('not_activated', plan, expiresAt, features), { status: 404 });
	}

	await deactivateActivation(db, { licenseId: license.licenseId, deviceHash, now: Date.now() });

	return json(licensePayload('deactivated', plan, expiresAt, features));
};
