import type { D1Database } from '@cloudflare/workers-types';

export const LICENSE_GRACE_DAYS = 14;

export type LicensePlan = 'starter' | 'pro' | 'studio';
export type LicenseStatus = 'active' | 'revoked' | 'expired';
export type LicenseVerifyStatus = LicenseStatus | 'device_limit' | 'not_found';

export type LicenseRow = {
	license_key: string;
	user_id: string | null;
	user_email: string | null;
	plan: LicensePlan;
	status: LicenseStatus;
	device_limit: number;
	created_at: number;
	expires_at: number | null;
	notes: string | null;
};

export type DeviceRow = {
	id: number;
	license_key: string;
	device_id: string;
	device_name: string | null;
	activated_at: number;
	last_seen_at: number;
};

const eventTypes = new Set([
	'generate',
	'verify',
	'activate',
	'deactivate',
	'revoke',
	'reset_devices',
	'fail'
]);

const serializeMeta = (meta: unknown) => {
	if (meta == null) return null;
	if (typeof meta === 'string') return meta;
	try {
		return JSON.stringify(meta);
	} catch {
		return null;
	}
};

export const normalizeLicenseKey = (value: string) => value.trim().toUpperCase();

const MIN_REASONABLE_MS = 1_000_000_000_000; // ~2001-09-09
const MAX_REASONABLE_MS = 9_999_999_999_999; // ~2286-11-20

export const normalizeEpochMs = (value: unknown): number | null => {
	if (value == null || value === '') return null;
	let parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;

	// Handle seconds epoch.
	if (parsed < MIN_REASONABLE_MS) {
		parsed *= 1000;
	}

	// Handle microseconds/nanoseconds that are accidentally stored.
	while (parsed > MAX_REASONABLE_MS) {
		parsed = Math.floor(parsed / 1000);
		if (parsed <= 0) return null;
	}

	return Math.floor(parsed);
};

export const ensureLicenseTables = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS licenses (
				license_key TEXT PRIMARY KEY,
				user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
				user_email TEXT NULL,
				plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'studio')),
				status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
				device_limit INTEGER NOT NULL,
				created_at INTEGER NOT NULL,
				expires_at INTEGER NULL,
				notes TEXT NULL
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS devices (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
				device_id TEXT NOT NULL,
				device_name TEXT NULL,
				activated_at INTEGER NOT NULL,
				last_seen_at INTEGER NOT NULL,
				UNIQUE (license_key, device_id)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS license_events (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				license_key TEXT NULL REFERENCES licenses(license_key) ON DELETE SET NULL,
				event_type TEXT NOT NULL CHECK (event_type IN ('generate', 'verify', 'activate', 'deactivate', 'revoke', 'reset_devices', 'fail')),
				created_at INTEGER NOT NULL,
				meta TEXT NULL
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_devices_license_key ON devices(license_key)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_licenses_user_email ON licenses(user_email)').run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_license_events_key_time ON license_events(license_key, created_at DESC)'
		)
		.run();
};

export const logLicenseEvent = async (
	db: D1Database,
	params: {
		licenseKey?: string | null;
		eventType: string;
		meta?: unknown;
		now?: number;
	}
) => {
	if (!eventTypes.has(params.eventType)) return;
	await db
		.prepare(
			`INSERT INTO license_events (license_key, event_type, created_at, meta)
			 VALUES (?, ?, ?, ?)`
		)
		.bind(
			params.licenseKey ? normalizeLicenseKey(params.licenseKey) : null,
			params.eventType,
			params.now ?? Date.now(),
			serializeMeta(params.meta)
		)
		.run();
};

export const getLicenseByKey = async (db: D1Database, licenseKey: string) => {
	const key = normalizeLicenseKey(licenseKey);
	const row =
		(await db
			.prepare(
				`SELECT license_key, user_id, user_email, plan, status, device_limit, created_at, expires_at, notes
				 FROM licenses
				 WHERE license_key = ?`
			)
			.bind(key)
			.first<LicenseRow>()) ?? null;

	if (!row) return null;

	const normalizedExpiresAt = normalizeEpochMs(row.expires_at);
	if (normalizedExpiresAt !== row.expires_at) {
		await db
			.prepare('UPDATE licenses SET expires_at = ? WHERE license_key = ?')
			.bind(normalizedExpiresAt, row.license_key)
			.run();
		row.expires_at = normalizedExpiresAt;
	}

	return row;
};

export const normalizeLicenseStatus = async (db: D1Database, license: LicenseRow, now = Date.now()) => {
	if (license.expires_at != null && now > license.expires_at && license.status !== 'expired') {
		await db
			.prepare('UPDATE licenses SET status = ? WHERE license_key = ?')
			.bind('expired', license.license_key)
			.run();
		license.status = 'expired';
	}
	return license;
};

const LICENSE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomSegment = (length: number) => {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	let out = '';
	for (let i = 0; i < bytes.length; i += 1) {
		out += LICENSE_CHARS[bytes[i] % LICENSE_CHARS.length];
	}
	return out;
};

const PLAN_CODE: Record<LicensePlan, string> = {
	starter: 'STR',
	pro: 'PRO',
	studio: 'STD'
};

export const buildLicenseKey = (plan: LicensePlan) =>
	`SANTRI-${PLAN_CODE[plan]}-${randomSegment(4)}-${randomSegment(4)}`;

export const generateUniqueLicenseKey = async (db: D1Database, plan: LicensePlan) => {
	for (let i = 0; i < 10; i += 1) {
		const key = buildLicenseKey(plan);
		const exists = await db
			.prepare('SELECT license_key FROM licenses WHERE license_key = ?')
			.bind(key)
			.first<{ license_key: string }>();
		if (!exists?.license_key) return key;
	}
	throw new Error('Gagal membuat license key unik');
};
