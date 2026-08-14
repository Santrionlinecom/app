import type { D1Database } from '@cloudflare/workers-types';
import { hashLicenseKey } from './digital-products';

const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type EntitlementRow = {
	saleId: string;
	status: 'pending' | 'paid' | 'failed' | 'refunded';
	buyerUserId: string | null;
	licensePackage: string | null;
	productId: string | null;
	productSlug: string | null;
	productPlan: 'free' | 'pro' | null;
	defaultMaxDevices: number | null;
	featuresJson: string | null;
};

const bytesToSegments = (bytes: Uint8Array) => {
	const chars = Array.from(bytes.slice(0, 12), (byte) => KEY_ALPHABET[byte % KEY_ALPHABET.length]).join('');
	return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
};

export async function deriveOrderLicenseKey(saleId: string, secret: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`santriprint-license:${saleId}`)));
	return `SP-PRO-${bytesToSegments(signature)}`;
}

export async function claimPaidDigitalOrderLicense(input: {
	db: D1Database;
	referenceCode: string;
	accessToken: string;
	userId: string;
	secret: string;
	now?: number;
}) {
	const entitlement = await input.db
		.prepare(
			`SELECT s.id AS saleId, s.status, s.buyer_user_id AS buyerUserId,
			        p.license_package AS licensePackage, p.license_product_id AS productId,
			        lp.slug AS productSlug, lp.plan AS productPlan,
			        lp.default_max_devices AS defaultMaxDevices, lp.features_json AS featuresJson
			 FROM digital_product_sales s
			 JOIN digital_products p ON p.id = s.product_id
			 LEFT JOIN products lp ON lp.id = p.license_product_id AND lp.status = 'active'
			 WHERE s.reference_code = ? AND s.access_token = ?
			 LIMIT 1`
		)
		.bind(input.referenceCode, input.accessToken)
		.first<EntitlementRow>();

	if (!entitlement) throw new Error('Pesanan tidak ditemukan.');
	if (entitlement.status !== 'paid') throw new Error('Pesanan belum lunas dan belum memiliki entitlement lisensi.');
	if (!entitlement.productId || !entitlement.productSlug || entitlement.productPlan !== 'pro') {
		throw new Error('Paket ini belum terhubung ke produk lisensi aktif.');
	}
	if (entitlement.buyerUserId && entitlement.buyerUserId !== input.userId) {
		throw new Error('Entitlement pesanan dimiliki akun lain.');
	}

	const licenseKey = await deriveOrderLicenseKey(entitlement.saleId, input.secret);
	const licenseKeyHash = await hashLicenseKey(licenseKey, input.secret);
	const now = input.now ?? Date.now();
	const maxDevices = Math.max(1, Number(entitlement.defaultMaxDevices ?? 1));
	const packageSlug = entitlement.licensePackage ?? 'pro';
	const internalLicenseId = `lic_sale_${entitlement.saleId}`;

	await input.db.batch([
		input.db
			.prepare(
				`UPDATE digital_product_sales
				 SET buyer_user_id = COALESCE(buyer_user_id, ?), updated_at = updated_at
				 WHERE id = ? AND access_token = ? AND status = 'paid'
				   AND (buyer_user_id IS NULL OR buyer_user_id = ?)`
			)
			.bind(input.userId, entitlement.saleId, input.accessToken, input.userId),
		input.db
			.prepare(
				`INSERT OR IGNORE INTO licenses (
				   license_key, user_id, user_email, plan, status, device_limit, created_at,
				   expires_at, notes, product_id, license_key_hash, max_devices,
				   features_json, activated_at, updated_at, source_sale_id, package_slug
				 )
				 SELECT ?, ?, NULL, ?, 'active', ?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, ?
				 WHERE EXISTS (
				   SELECT 1 FROM digital_product_sales
				   WHERE id = ? AND access_token = ? AND status = 'paid' AND buyer_user_id = ?
				 )`
			)
			.bind(
				internalLicenseId, input.userId, 'pro', maxDevices, now,
				`Entitlement paket SantriPrint ${packageSlug}`, entitlement.productId,
				licenseKeyHash, maxDevices, entitlement.featuresJson ?? '[]', now,
				entitlement.saleId, packageSlug,
				entitlement.saleId, input.accessToken, input.userId
			)
	]);

	const license = await input.db
		.prepare(
			`SELECT license_key AS licenseId, user_id AS userId, source_sale_id AS sourceSaleId,
			        package_slug AS packageSlug
			 FROM licenses WHERE source_sale_id = ? LIMIT 1`
		)
		.bind(entitlement.saleId)
		.first<{ licenseId: string; userId: string | null; sourceSaleId: string; packageSlug: string | null }>();
	if (!license || license.userId !== input.userId) throw new Error('Gagal membuat entitlement lisensi untuk pesanan.');

	return { licenseKey, licenseId: license.licenseId, packageSlug: license.packageSlug ?? packageSlug, productSlug: entitlement.productSlug, maxDevices };
}
