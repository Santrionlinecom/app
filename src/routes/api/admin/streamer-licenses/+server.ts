import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureStreamerLicenseTables,
	getStreamerLicenseByHash,
	hashLicenseKey,
	logStreamerLicenseEvent,
	type StreamerPlanType
} from '$lib/server/license/streamer-db';

const DAY_MS = 24 * 60 * 60 * 1000;

const PLAN_DURATION_MS: Record<Exclude<StreamerPlanType, 'lifetime'>, number> = {
	monthly: 30 * DAY_MS,
	yearly: 365 * DAY_MS
};

const STREAMER_KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const isPlanType = (value: string): value is StreamerPlanType =>
	value === 'monthly' || value === 'yearly' || value === 'lifetime';

const randomChunk = (length: number) => {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (let i = 0; i < bytes.length; i += 1) {
		out += STREAMER_KEY_ALPHABET[bytes[i] % STREAMER_KEY_ALPHABET.length];
	}
	return out;
};

const buildStreamerLicenseKey = () =>
	`STRM-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}-${randomChunk(5)}`;

const generateUniqueStreamerLicenseKey = async (db: D1Database) => {
	for (let i = 0; i < 25; i += 1) {
		const licenseKey = buildStreamerLicenseKey();
		const licenseKeyHash = await hashLicenseKey(licenseKey);
		const existing = await getStreamerLicenseByHash(db, licenseKeyHash);
		if (!existing) {
			return { licenseKey, licenseKeyHash };
		}
	}
	throw error(500, 'Gagal membuat license key unik. Coba lagi.');
};

const normalizeEpochMs = (value: unknown) => {
	if (value == null || value === '') return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return null;
	const normalized = Math.floor(parsed);
	if (normalized <= 0) return null;
	return normalized;
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureStreamerLicenseTables(db);

	const limitRaw = Number(url.searchParams.get('limit') ?? 50);
	const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50));

	const { results } = await db
		.prepare(
			`SELECT l.id, l.plan_type, l.status, l.max_devices, l.created_at, l.expires_at,
				(SELECT COUNT(*) FROM streamer_license_devices d WHERE d.license_id = l.id) AS device_count,
				(SELECT MAX(d.last_seen_at) FROM streamer_license_devices d WHERE d.license_id = l.id) AS last_seen_at,
				(
					SELECT e.event_type
					FROM streamer_license_events e
					WHERE e.license_id = l.id
					ORDER BY e.created_at DESC
					LIMIT 1
				) AS last_event_type
			 FROM streamer_licenses l
			 ORDER BY l.created_at DESC
			 LIMIT ?`
		)
		.bind(limit)
		.all<Record<string, unknown>>();

	return json({
		ok: true,
		items: (results ?? []).map((row) => ({
			id: row.id,
			plan_type: row.plan_type,
			status: row.status,
			max_devices: Number(row.max_devices ?? 0),
			created_at: Number(row.created_at ?? 0),
			expires_at: row.expires_at == null ? null : Number(row.expires_at),
			device_count: Number(row.device_count ?? 0),
			last_seen_at: row.last_seen_at == null ? null : Number(row.last_seen_at),
			last_event_type: typeof row.last_event_type === 'string' ? row.last_event_type : null
		}))
	});
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureStreamerLicenseTables(db);

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		throw error(400, 'Body JSON tidak valid');
	}

	const planTypeRaw = typeof body.plan_type === 'string' ? body.plan_type.trim().toLowerCase() : '';
	if (!isPlanType(planTypeRaw)) {
		throw error(400, 'plan_type tidak valid');
	}

	const maxDevicesRaw = Number(body.max_devices);
	if (!Number.isFinite(maxDevicesRaw) || maxDevicesRaw < 1 || maxDevicesRaw > 50) {
		throw error(400, 'max_devices harus antara 1-50');
	}

	const now = Date.now();
	const maxDevices = Math.floor(maxDevicesRaw);

	let expiresAt = normalizeEpochMs(body.expires_at);
	if (planTypeRaw === 'lifetime') {
		expiresAt = null;
	} else if (expiresAt == null) {
		expiresAt = now + PLAN_DURATION_MS[planTypeRaw];
	}

	if (expiresAt != null && expiresAt <= now) {
		throw error(400, 'expires_at harus lebih besar dari waktu sekarang');
	}

	const { licenseKey, licenseKeyHash } = await generateUniqueStreamerLicenseKey(db);
	const licenseId = crypto.randomUUID();

	await db
		.prepare(
			`INSERT INTO streamer_licenses (
				id, license_key_hash, plan_type, expires_at, status, max_devices, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(licenseId, licenseKeyHash, planTypeRaw, expiresAt, 'active', maxDevices, now)
		.run();

	await logStreamerLicenseEvent(db, {
		licenseId,
		eventType: 'generate',
		meta: {
			by_user_id: user.id,
			by_email: user.email,
			plan_type: planTypeRaw,
			max_devices: maxDevices,
			expires_at: expiresAt
		},
		now
	});

	return json(
		{
			ok: true,
			license_key: licenseKey,
			item: {
				id: licenseId,
				plan_type: planTypeRaw,
				status: 'active',
				max_devices: maxDevices,
				created_at: now,
				expires_at: expiresAt,
				device_count: 0,
				last_seen_at: null,
				last_event_type: 'generate'
			}
		},
		{ status: 201 }
	);
};
