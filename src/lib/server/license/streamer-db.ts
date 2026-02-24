import type { D1Database } from '@cloudflare/workers-types';

export type StreamerPlanType = 'monthly' | 'yearly' | 'lifetime';
export type StreamerLicenseStatus = 'active' | 'revoked';

export type StreamerLicenseRow = {
	id: string;
	license_key_hash: string;
	plan_type: StreamerPlanType;
	expires_at: number | null;
	status: StreamerLicenseStatus;
	max_devices: number;
	created_at: number;
};

export type StreamerLicenseDeviceRow = {
	id: string;
	license_id: string;
	device_id_hash: string;
	activated_at: number;
	last_seen_at: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PLAN_DURATION_MS: Record<Exclude<StreamerPlanType, 'lifetime'>, number> = {
	monthly: 30 * DAY_MS,
	yearly: 365 * DAY_MS
};

const normalizeText = (value: string) => value.trim();

export const normalizeLicenseKeyForHash = (value: string) => normalizeText(value).toUpperCase();

export const normalizeDeviceIdHash = (value: string) => normalizeText(value).toLowerCase();

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const sha256Hex = async (value: string) => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return toHex(new Uint8Array(digest));
};

export const hashLicenseKey = async (licenseKey: string) => sha256Hex(normalizeLicenseKeyForHash(licenseKey));

const serializeMeta = (meta: unknown) => {
	if (meta == null) return null;
	if (typeof meta === 'string') return meta;
	try {
		return JSON.stringify(meta);
	} catch {
		return null;
	}
};

export const ensureStreamerLicenseTables = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS streamer_licenses (
				id TEXT PRIMARY KEY,
				license_key_hash TEXT NOT NULL UNIQUE,
				plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
				expires_at INTEGER NULL,
				status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
				max_devices INTEGER NOT NULL,
				created_at INTEGER NOT NULL
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS streamer_license_devices (
				id TEXT PRIMARY KEY,
				license_id TEXT NOT NULL REFERENCES streamer_licenses(id) ON DELETE CASCADE,
				device_id_hash TEXT NOT NULL,
				activated_at INTEGER NOT NULL,
				last_seen_at INTEGER NOT NULL,
				UNIQUE (license_id, device_id_hash)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS streamer_license_events (
				id TEXT PRIMARY KEY,
				license_id TEXT NULL REFERENCES streamer_licenses(id) ON DELETE SET NULL,
				event_type TEXT NOT NULL,
				meta_json TEXT NULL,
				created_at INTEGER NOT NULL
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_streamer_licenses_status ON streamer_licenses(status)').run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_streamer_license_devices_license ON streamer_license_devices(license_id)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_streamer_license_devices_hash ON streamer_license_devices(device_id_hash)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_streamer_license_events_license_time ON streamer_license_events(license_id, created_at DESC)'
		)
		.run();
};

export const logStreamerLicenseEvent = async (
	db: D1Database,
	params: {
		licenseId?: string | null;
		eventType: string;
		meta?: unknown;
		now?: number;
	}
) => {
	await db
		.prepare(
			`INSERT INTO streamer_license_events (id, license_id, event_type, meta_json, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), params.licenseId ?? null, params.eventType, serializeMeta(params.meta), params.now ?? Date.now())
		.run();
};

export const getStreamerLicenseByHash = async (db: D1Database, licenseKeyHash: string) =>
	(await db
		.prepare(
			`SELECT id, license_key_hash, plan_type, expires_at, status, max_devices, created_at
			 FROM streamer_licenses
			 WHERE license_key_hash = ?`
		)
		.bind(licenseKeyHash)
		.first<StreamerLicenseRow>()) ?? null;

export const getStreamerLicenseById = async (db: D1Database, licenseId: string) =>
	(await db
		.prepare(
			`SELECT id, license_key_hash, plan_type, expires_at, status, max_devices, created_at
			 FROM streamer_licenses
			 WHERE id = ?`
		)
		.bind(licenseId)
		.first<StreamerLicenseRow>()) ?? null;

export const getStreamerDevice = async (db: D1Database, licenseId: string, deviceIdHash: string) =>
	(await db
		.prepare(
			`SELECT id, license_id, device_id_hash, activated_at, last_seen_at
			 FROM streamer_license_devices
			 WHERE license_id = ? AND device_id_hash = ?`
		)
			.bind(licenseId, deviceIdHash)
			.first<StreamerLicenseDeviceRow>()) ?? null;

export const listStreamerDevices = async (db: D1Database, licenseId: string) => {
	const { results } = await db
		.prepare(
			`SELECT id, license_id, device_id_hash, activated_at, last_seen_at
			 FROM streamer_license_devices
			 WHERE license_id = ?
			 ORDER BY last_seen_at DESC`
		)
		.bind(licenseId)
		.all<StreamerLicenseDeviceRow>();
	return (results ?? []) as StreamerLicenseDeviceRow[];
};

export const countStreamerDevices = async (db: D1Database, licenseId: string) => {
	const row = await db
		.prepare('SELECT COUNT(*) as total FROM streamer_license_devices WHERE license_id = ?')
		.bind(licenseId)
		.first<{ total: number | null }>();
	return Number(row?.total ?? 0);
};

export const upsertStreamerDevice = async (
	db: D1Database,
	params: { licenseId: string; deviceIdHash: string; now?: number }
) => {
	const now = params.now ?? Date.now();
	await db
		.prepare(
			`INSERT INTO streamer_license_devices (id, license_id, device_id_hash, activated_at, last_seen_at)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT(license_id, device_id_hash)
			 DO UPDATE SET last_seen_at = excluded.last_seen_at`
		)
		.bind(crypto.randomUUID(), params.licenseId, params.deviceIdHash, now, now)
		.run();
};

export const touchStreamerDevice = async (
	db: D1Database,
	params: { licenseId: string; deviceIdHash: string; now?: number }
) => {
	await db
		.prepare(
			`UPDATE streamer_license_devices
			 SET last_seen_at = ?
			 WHERE license_id = ? AND device_id_hash = ?`
		)
		.bind(params.now ?? Date.now(), params.licenseId, params.deviceIdHash)
		.run();
};

export const removeStreamerDevice = async (db: D1Database, licenseId: string, deviceIdHash: string) => {
	const result = await db
		.prepare('DELETE FROM streamer_license_devices WHERE license_id = ? AND device_id_hash = ?')
		.bind(licenseId, deviceIdHash)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const computeStreamerValidUntil = (license: StreamerLicenseRow, now: number) => {
	if (license.plan_type === 'lifetime') return null;
	if (license.expires_at != null) return Number(license.expires_at);
	return now + PLAN_DURATION_MS[license.plan_type];
};

export const isStreamerLicenseUsable = (license: StreamerLicenseRow, now: number) => {
	if (license.status !== 'active') {
		return { ok: false as const, code: 'revoked' as const };
	}
	const validUntil = computeStreamerValidUntil(license, now);
	if (validUntil != null && validUntil < now) {
		return { ok: false as const, code: 'expired' as const };
	}
	return { ok: true as const, validUntil };
};
