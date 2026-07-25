import type { D1Database } from '@cloudflare/workers-types';
import { parseFeatures } from './digital-products';

export type AdminLicenseRow = {
	licenseId: string;
	userId: string | null;
	userEmail: string | null;
	status: 'active' | 'revoked' | 'expired';
	plan: string;
	maxDevices: number | null;
	deviceLimit: number;
	expiresAt: number | null;
	createdAt: number;
	updatedAt: number | null;
	activatedAt: number | null;
	productId: string | null;
	productSlug: string | null;
	productName: string | null;
	activeDevices: number | null;
	notes: string | null;
};

export type AdminActivationRow = {
	id: string;
	deviceHash: string;
	deviceName: string | null;
	status: 'active' | 'deactivated';
	activatedAt: number;
	lastSeenAt: number;
	deactivatedAt: number | null;
};

export type AdminListFilters = {
	q?: string;
	productSlug?: string;
	status?: 'all' | 'active' | 'revoked' | 'expired';
	limit?: number;
};

const clampLimit = (value?: number) => Math.min(200, Math.max(1, Number(value ?? 50)));

export const listAdminDigitalLicenses = async (db: D1Database, filters: AdminListFilters = {}) => {
	const limit = clampLimit(filters.limit);
	const q = filters.q?.trim() ?? '';
	const productSlug = filters.productSlug?.trim().toLowerCase() ?? '';
	const status = filters.status && filters.status !== 'all' ? filters.status : '';
	const now = Date.now();

	const where: string[] = ['l.product_id IS NOT NULL'];
	const binds: Array<string | number> = [];

	if (productSlug) {
		where.push('p.slug = ?');
		binds.push(productSlug);
	}
	if (status === 'revoked') {
		where.push("l.status = 'revoked'");
	} else if (status === 'expired') {
		where.push("(l.status = 'expired' OR (l.expires_at IS NOT NULL AND l.expires_at > 0 AND l.expires_at < ?))");
		binds.push(now);
	} else if (status === 'active') {
		where.push("l.status = 'active'");
		where.push('(l.expires_at IS NULL OR l.expires_at = 0 OR l.expires_at >= ?)');
		binds.push(now);
	}
	if (q) {
		where.push(
			'(l.license_key LIKE ? OR l.user_email LIKE ? OR l.user_id LIKE ? OR p.slug LIKE ? OR p.name LIKE ? OR l.notes LIKE ?)'
		);
		const like = `%${q}%`;
		binds.push(like, like, like, like, like, like);
	}

	const rows = await db
		.prepare(
			`SELECT
				l.license_key AS licenseId,
				l.user_id AS userId,
				l.user_email AS userEmail,
				l.status,
				COALESCE(p.plan, l.plan) AS plan,
				l.max_devices AS maxDevices,
				l.device_limit AS deviceLimit,
				l.expires_at AS expiresAt,
				l.created_at AS createdAt,
				l.updated_at AS updatedAt,
				l.activated_at AS activatedAt,
				l.product_id AS productId,
				p.slug AS productSlug,
				p.name AS productName,
				l.notes AS notes,
				(
					SELECT COUNT(*)
					FROM license_activations a
					WHERE a.license_id = l.license_key AND a.status = 'active'
				) AS activeDevices
			 FROM licenses l
			 LEFT JOIN products p ON p.id = l.product_id
			 WHERE ${where.join(' AND ')}
			 ORDER BY l.created_at DESC
			 LIMIT ?`
		)
		.bind(...binds, limit)
		.all<AdminLicenseRow>();

	return rows.results ?? [];
};

export const listActivationsForLicense = async (db: D1Database, licenseId: string) => {
	const rows = await db
		.prepare(
			`SELECT
				id,
				device_hash AS deviceHash,
				device_name AS deviceName,
				status,
				activated_at AS activatedAt,
				last_seen_at AS lastSeenAt,
				deactivated_at AS deactivatedAt
			 FROM license_activations
			 WHERE license_id = ?
			 ORDER BY last_seen_at DESC`
		)
		.bind(licenseId)
		.all<AdminActivationRow>();
	return rows.results ?? [];
};

export const getAdminLicense = async (db: D1Database, licenseId: string) =>
	(
		await db
			.prepare(
				`SELECT
					l.license_key AS licenseId,
					l.user_id AS userId,
					l.user_email AS userEmail,
					l.status,
					COALESCE(p.plan, l.plan) AS plan,
					l.max_devices AS maxDevices,
					l.device_limit AS deviceLimit,
					l.expires_at AS expiresAt,
					l.created_at AS createdAt,
					l.updated_at AS updatedAt,
					l.activated_at AS activatedAt,
					l.product_id AS productId,
					p.slug AS productSlug,
					p.name AS productName,
					l.notes AS notes,
					(
						SELECT COUNT(*)
						FROM license_activations a
						WHERE a.license_id = l.license_key AND a.status = 'active'
					) AS activeDevices
				 FROM licenses l
				 LEFT JOIN products p ON p.id = l.product_id
				 WHERE l.license_key = ? AND l.product_id IS NOT NULL`
			)
			.bind(licenseId)
			.first<AdminLicenseRow>()
	) ?? null;

export const revokeLicense = async (db: D1Database, licenseId: string, now = Date.now()) => {
	const result = await db
		.prepare(
			`UPDATE licenses
			 SET status = 'revoked', updated_at = ?
			 WHERE license_key = ? AND product_id IS NOT NULL`
		)
		.bind(now, licenseId)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const reactivateLicense = async (db: D1Database, licenseId: string, now = Date.now()) => {
	const license = await getAdminLicense(db, licenseId);
	if (!license) return 0;
	const expired =
		license.expiresAt !== null && Number(license.expiresAt) > 0 && now > Number(license.expiresAt);
	if (expired) {
		await db
			.prepare(`UPDATE licenses SET status = 'expired', updated_at = ? WHERE license_key = ?`)
			.bind(now, licenseId)
			.run();
		return 0;
	}
	const result = await db
		.prepare(
			`UPDATE licenses
			 SET status = 'active', updated_at = ?
			 WHERE license_key = ? AND product_id IS NOT NULL`
		)
		.bind(now, licenseId)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const resetLicenseDevices = async (db: D1Database, licenseId: string, now = Date.now()) => {
	const result = await db
		.prepare(
			`UPDATE license_activations
			 SET status = 'deactivated', deactivated_at = ?, last_seen_at = ?
			 WHERE license_id = ? AND status = 'active'`
		)
		.bind(now, now, licenseId)
		.run();
	await db
		.prepare(`UPDATE licenses SET updated_at = ? WHERE license_key = ? AND product_id IS NOT NULL`)
		.bind(now, licenseId)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const deactivateOneDevice = async (
	db: D1Database,
	params: { licenseId: string; deviceHash: string; now?: number }
) => {
	const now = params.now ?? Date.now();
	const result = await db
		.prepare(
			`UPDATE license_activations
			 SET status = 'deactivated', deactivated_at = ?, last_seen_at = ?
			 WHERE license_id = ? AND device_hash = ? AND status = 'active'`
		)
		.bind(now, now, params.licenseId, params.deviceHash)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const setLicenseExpiry = async (
	db: D1Database,
	params: { licenseId: string; expiresAt: number | null; now?: number }
) => {
	const now = params.now ?? Date.now();
	const result = await db
		.prepare(
			`UPDATE licenses
			 SET expires_at = ?, updated_at = ?,
			     status = CASE
			       WHEN status = 'revoked' THEN status
			       WHEN ? IS NOT NULL AND ? > 0 AND ? < ? THEN 'expired'
			       ELSE 'active'
			     END
			 WHERE license_key = ? AND product_id IS NOT NULL`
		)
		.bind(
			params.expiresAt,
			now,
			params.expiresAt,
			params.expiresAt,
			params.expiresAt,
			now,
			params.licenseId
		)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const setLicenseCustomer = async (
	db: D1Database,
	params: { licenseId: string; userEmail?: string | null; userId?: string | null; notes?: string | null }
) => {
	const now = Date.now();
	const result = await db
		.prepare(
			`UPDATE licenses
			 SET user_email = COALESCE(?, user_email),
			     user_id = COALESCE(?, user_id),
			     notes = COALESCE(?, notes),
			     updated_at = ?
			 WHERE license_key = ? AND product_id IS NOT NULL`
		)
		.bind(
			params.userEmail?.trim() || null,
			params.userId?.trim() || null,
			params.notes?.trim() || null,
			now,
			params.licenseId
		)
		.run();
	return Number(result.meta?.changes ?? 0);
};

export const listActiveLicenseProducts = async (db: D1Database) => {
	const rows = await db
		.prepare(
			`SELECT id, slug, name, plan, default_max_devices, features_json
			 FROM products
			 WHERE status = 'active'
			 ORDER BY name ASC`
		)
		.all<{
			id: string;
			slug: string;
			name: string;
			plan: 'free' | 'pro';
			default_max_devices: number | null;
			features_json: string | null;
		}>();

	return (rows.results ?? []).map((row) => ({
		id: row.id,
		slug: row.slug,
		name: row.name,
		plan: row.plan,
		defaultMaxDevices: Math.max(1, Number(row.default_max_devices ?? 1)),
		features: parseFeatures(row.features_json)
	}));
};
