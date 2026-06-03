import type { D1Database } from '@cloudflare/workers-types';

export type DigitalProductPlan = 'free' | 'pro';
export type DigitalLicenseStatus =
	| 'active'
	| 'revoked'
	| 'expired'
	| 'inactive_product'
	| 'not_found'
	| 'not_activated'
	| 'device_limit_reached'
	| 'deactivated';

export type ProductLicenseRow = {
	licenseId: string;
	userId: string | null;
	userEmail: string | null;
	legacyPlan: string;
	status: 'active' | 'revoked' | 'expired';
	deviceLimit: number;
	maxDevices: number | null;
	expiresAt: number | null;
	productId: string | null;
	productSlug: string | null;
	productName: string | null;
	productPlan: DigitalProductPlan | null;
	productStatus: 'active' | 'inactive' | null;
	defaultMaxDevices: number | null;
	productFeaturesJson: string | null;
	licenseFeaturesJson: string | null;
	createdAt: number;
	updatedAt: number | null;
};

export type LicenseActivationRow = {
	id: string;
	licenseId: string;
	deviceHash: string;
	deviceName: string | null;
	status: 'active' | 'deactivated';
	activatedAt: number;
	lastSeenAt: number;
	deactivatedAt: number | null;
};

const MAX_DEVICE_HASH_LENGTH = 191;
const DEFAULT_FEATURES: string[] = [];

const textEncoder = new TextEncoder();

const bytesToHex = (buffer: ArrayBuffer) =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

export const normalizeLicenseKeyInput = (value: string) => value.trim().toUpperCase();

export const normalizeDeviceHash = (value: string) =>
	value.trim().toLowerCase().slice(0, MAX_DEVICE_HASH_LENGTH);

export const isValidDeviceHash = (value: string) => value.length >= 8 && value.length <= MAX_DEVICE_HASH_LENGTH;

export const hashLicenseKey = async (licenseKey: string, secret?: string | null) => {
	const normalizedKey = normalizeLicenseKeyInput(licenseKey);
	const secretValue = secret?.trim();

	if (secretValue) {
		const key = await crypto.subtle.importKey(
			'raw',
			textEncoder.encode(secretValue),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		return bytesToHex(await crypto.subtle.sign('HMAC', key, textEncoder.encode(normalizedKey)));
	}

	return bytesToHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(normalizedKey)));
};

export const parseFeatures = (value: string | null | undefined): string[] => {
	if (!value) return DEFAULT_FEATURES;
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return DEFAULT_FEATURES;
		return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
	} catch {
		return DEFAULT_FEATURES;
	}
};

export const getFeaturesForLicense = (license: ProductLicenseRow) => {
	const licenseFeatures = parseFeatures(license.licenseFeaturesJson);
	return licenseFeatures.length ? licenseFeatures : parseFeatures(license.productFeaturesJson);
};

export const getPlanForLicense = (license: ProductLicenseRow) =>
	license.productPlan ?? (license.legacyPlan === 'pro' || license.legacyPlan === 'studio' ? 'pro' : 'free');

export const getMaxDevicesForLicense = (license: ProductLicenseRow) =>
	Math.max(1, Number(license.maxDevices ?? license.defaultMaxDevices ?? license.deviceLimit ?? 1));

export const isLicenseExpired = (license: Pick<ProductLicenseRow, 'expiresAt'>, now = Date.now()) =>
	license.expiresAt !== null && Number(license.expiresAt) > 0 && now > Number(license.expiresAt);

export const getLicenseByKeyHash = async (db: D1Database, licenseKeyHash: string) =>
	(await db
		.prepare(
			`SELECT
				l.license_key AS licenseId,
				l.user_id AS userId,
				l.user_email AS userEmail,
				l.plan AS legacyPlan,
				l.status,
				l.device_limit AS deviceLimit,
				l.max_devices AS maxDevices,
				l.expires_at AS expiresAt,
				l.product_id AS productId,
				l.features_json AS licenseFeaturesJson,
				l.created_at AS createdAt,
				l.updated_at AS updatedAt,
				p.slug AS productSlug,
				p.name AS productName,
				p.plan AS productPlan,
				p.status AS productStatus,
				p.default_max_devices AS defaultMaxDevices,
				p.features_json AS productFeaturesJson
			 FROM licenses l
			 LEFT JOIN products p ON p.id = l.product_id
			 WHERE l.license_key_hash = ?`
		)
		.bind(licenseKeyHash)
		.first<ProductLicenseRow>()) ?? null;

export const getActivation = async (db: D1Database, licenseId: string, deviceHash: string) =>
	(await db
		.prepare(
			`SELECT
				id,
				license_id AS licenseId,
				device_hash AS deviceHash,
				device_name AS deviceName,
				status,
				activated_at AS activatedAt,
				last_seen_at AS lastSeenAt,
				deactivated_at AS deactivatedAt
			 FROM license_activations
			 WHERE license_id = ? AND device_hash = ?`
		)
		.bind(licenseId, deviceHash)
		.first<LicenseActivationRow>()) ?? null;

export const countActiveActivations = async (db: D1Database, licenseId: string) => {
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS total
			 FROM license_activations
			 WHERE license_id = ? AND status = 'active'`
		)
		.bind(licenseId)
		.first<{ total: number | null }>();
	return Number(row?.total ?? 0);
};

export const upsertActivation = async (
	db: D1Database,
	params: {
		licenseId: string;
		deviceHash: string;
		deviceName?: string | null;
		metadata?: unknown;
		now?: number;
	}
) => {
	const now = params.now ?? Date.now();
	const metadataJson = params.metadata ? JSON.stringify(params.metadata).slice(0, 2000) : null;
	const id = crypto.randomUUID();

	await db
		.prepare(
			`INSERT INTO license_activations (
				id, license_id, device_hash, device_name, status, activated_at, last_seen_at, deactivated_at, metadata_json
			 )
			 VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, ?)
			 ON CONFLICT(license_id, device_hash) DO UPDATE SET
				device_name = COALESCE(excluded.device_name, license_activations.device_name),
				status = 'active',
				last_seen_at = excluded.last_seen_at,
				deactivated_at = NULL,
				metadata_json = COALESCE(excluded.metadata_json, license_activations.metadata_json)`
		)
		.bind(
			id,
			params.licenseId,
			params.deviceHash,
			params.deviceName?.trim().slice(0, 191) || null,
			now,
			now,
			metadataJson
		)
		.run();
};

export const touchActivation = async (
	db: D1Database,
	params: { licenseId: string; deviceHash: string; deviceName?: string | null; now?: number }
) => {
	await db
		.prepare(
			`UPDATE license_activations
			 SET last_seen_at = ?, device_name = COALESCE(?, device_name)
			 WHERE license_id = ? AND device_hash = ? AND status = 'active'`
		)
		.bind(
			params.now ?? Date.now(),
			params.deviceName?.trim().slice(0, 191) || null,
			params.licenseId,
			params.deviceHash
		)
		.run();
};

export const deactivateActivation = async (
	db: D1Database,
	params: { licenseId: string; deviceHash: string; now?: number }
) => {
	const result = await db
		.prepare(
			`UPDATE license_activations
			 SET status = 'deactivated', deactivated_at = ?, last_seen_at = ?
			 WHERE license_id = ? AND device_hash = ? AND status = 'active'`
		)
		.bind(params.now ?? Date.now(), params.now ?? Date.now(), params.licenseId, params.deviceHash)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const listUserProductLicenses = async (db: D1Database, user: { id: string; email?: string | null }) => {
	const email = user.email?.trim() || null;
	const rows = await db
		.prepare(
			`SELECT
				l.license_key AS licenseId,
				l.user_id AS userId,
				l.user_email AS userEmail,
				l.plan AS legacyPlan,
				l.status,
				l.device_limit AS deviceLimit,
				l.max_devices AS maxDevices,
				l.expires_at AS expiresAt,
				l.product_id AS productId,
				l.features_json AS licenseFeaturesJson,
				l.created_at AS createdAt,
				l.updated_at AS updatedAt,
				p.slug AS productSlug,
				p.name AS productName,
				p.plan AS productPlan,
				p.status AS productStatus,
				p.default_max_devices AS defaultMaxDevices,
				p.features_json AS productFeaturesJson,
				(SELECT COUNT(*) FROM license_activations a WHERE a.license_id = l.license_key AND a.status = 'active') AS activeDevices
			 FROM licenses l
			 LEFT JOIN products p ON p.id = l.product_id
			 WHERE l.product_id IS NOT NULL
			   AND (l.user_id = ? OR (? IS NOT NULL AND l.user_email = ?))
			 ORDER BY l.created_at DESC`
		)
		.bind(user.id, email, email)
		.all<ProductLicenseRow & { activeDevices: number | null }>();

	return rows.results ?? [];
};
