import type { D1Database } from '@cloudflare/workers-types';

/**
 * Kuota bonus lisensi untuk admin lembaga.
 *
 * Kebijakan produk (ditetapkan Mas Yogik):
 * - Setiap admin lembaga mendapat BONUS pendaftaran: 1x generate license Pro
 *   per produk, gratis.
 * - Generate berikutnya untuk produk yang sama berbayar (diarahkan menghubungi
 *   Super Admin / membeli melalui digital store).
 * - Super Admin tidak dibatasi (unlimited) dan tidak dicatat sebagai grant.
 */

export const ensureLicenseGrantSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS admin_license_grants (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				product_slug TEXT NOT NULL,
				license_id TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				UNIQUE (user_id, product_slug)
			)`
		)
		.run();
};

export const hasUsedFreeGrant = async (
	db: D1Database,
	userId: string,
	productSlug: string
) => {
	const row = await db
		.prepare(
			'SELECT id FROM admin_license_grants WHERE user_id = ? AND product_slug = ? LIMIT 1'
		)
		.bind(userId, productSlug)
		.first<{ id: string }>();
	return Boolean(row?.id);
};

export const recordFreeGrant = async (
	db: D1Database,
	input: { userId: string; productSlug: string; licenseId: string }
) => {
	await db
		.prepare(
			`INSERT INTO admin_license_grants (id, user_id, product_slug, license_id, created_at)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT (user_id, product_slug) DO NOTHING`
		)
		.bind(
			`grant_${crypto.randomUUID()}`,
			input.userId,
			input.productSlug,
			input.licenseId,
			Date.now()
		)
		.run();
};

export const listUsedGrantSlugs = async (db: D1Database, userId: string) => {
	const rows = await db
		.prepare('SELECT product_slug FROM admin_license_grants WHERE user_id = ?')
		.bind(userId)
		.all<{ product_slug: string }>();
	return (rows.results ?? []).map((row) => row.product_slug);
};

export const listGrantedLicenseIds = async (db: D1Database, userId: string) => {
	const rows = await db
		.prepare('SELECT license_id FROM admin_license_grants WHERE user_id = ?')
		.bind(userId)
		.all<{ license_id: string }>();
	return (rows.results ?? []).map((row) => row.license_id);
};
