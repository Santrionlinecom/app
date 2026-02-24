import { json, type RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { getRequestIp } from '$lib/server/logger';
import {
	computeStreamerValidUntil,
	ensureStreamerLicenseTables,
	getStreamerLicenseByHash,
	hashLicenseKey,
	isStreamerLicenseUsable,
	listStreamerDevices,
	logStreamerLicenseEvent
} from '$lib/server/license/streamer-db';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT = {
	scope: 'streamer-license:status',
	limit: 60,
	windowMs: 5 * 60 * 1000
} as const;

const bad = (status: number, error: string, message: string) => json({ ok: false, error, message }, { status });

const parseLicenseKeyFromBody = async (request: Request) => {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		return typeof body.license_key === 'string' ? body.license_key.trim() : '';
	} catch {
		return '';
	}
};

const handleStatusLookup = async (params: {
	db: D1Database;
	licenseKey: string;
	ip: string | null;
}) => {
	const { db, licenseKey, ip } = params;
	if (!licenseKey) {
		return bad(400, 'invalid_payload', 'license_key wajib diisi');
	}

	const now = Date.now();
	const licenseKeyHash = await hashLicenseKey(licenseKey);
	const license = await getStreamerLicenseByHash(db, licenseKeyHash);
	if (!license) {
		await logStreamerLicenseEvent(db, {
			eventType: 'status_failed',
			meta: { reason: 'license_not_found', ip }
		});
		return bad(404, 'license_not_found', 'License tidak ditemukan');
	}

	const devices = await listStreamerDevices(db, license.id);
	const usable = isStreamerLicenseUsable(license, now);
	const validUntil = computeStreamerValidUntil(license, now);
	const effectiveStatus = usable.ok ? 'active' : usable.code;

	await logStreamerLicenseEvent(db, {
		licenseId: license.id,
		eventType: 'status_lookup',
		meta: { ip, device_count: devices.length },
		now
	});

	return json({
		ok: true,
		license: {
			id: license.id,
			plan_type: license.plan_type,
			status: effectiveStatus,
			status_db: license.status,
			expires_at: license.expires_at,
			valid_until: validUntil,
			max_devices: license.max_devices,
			created_at: license.created_at
		},
		device_count: devices.length,
		devices
	});
};

const enforceRateLimit = async (params: {
	db: D1Database;
	request: Request;
}) => {
	const ip = getRequestIp(params.request);
	const limiter = await consumeApiRateLimit({
		db: params.db,
		scope: RATE_LIMIT.scope,
		key: `ip:${ip ?? 'unknown'}`,
		limit: RATE_LIMIT.limit,
		windowMs: RATE_LIMIT.windowMs
	});
	if (limiter.allowed) return { ok: true as const, ip, headers: {} as Record<string, string> };
	return {
		ok: false as const,
		ip,
		response: json(
			{ ok: false, error: 'rate_limited', message: 'Terlalu banyak request. Coba lagi sebentar.' },
			{ status: 429, headers: buildRateLimitHeaders(limiter) }
		)
	};
};

export const GET: RequestHandler = async ({ request, url, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return bad(503, 'db_unavailable', 'Database D1 tidak tersedia');
	await ensureStreamerLicenseTables(db);

	const limitCheck = await enforceRateLimit({ db, request });
	if (!limitCheck.ok) return limitCheck.response;

	const licenseKey = (url.searchParams.get('license_key') ?? '').trim();
	return handleStatusLookup({ db, licenseKey, ip: limitCheck.ip });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return bad(503, 'db_unavailable', 'Database D1 tidak tersedia');
	await ensureStreamerLicenseTables(db);

	const limitCheck = await enforceRateLimit({ db, request });
	if (!limitCheck.ok) return limitCheck.response;

	const licenseKey = await parseLicenseKeyFromBody(request);
	return handleStatusLookup({ db, licenseKey, ip: limitCheck.ip });
};
