import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { hashLicenseKey } from '$lib/server/licenses/digital-products';

const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const PRODUCT_OPTIONS = [
	{
		label: 'Santri Cleaner Pro',
		slug: 'santri-cleaner-pro',
		keyPrefix: 'SC-PRO',
		fallbackMaxDevices: 1,
		features: ['deep_scan', 'developer_cleaner', 'creator_cleaner', 'export_pdf', 'ai_assistant']
	},
	{
		label: 'Santri Studio Pro',
		slug: 'santri-studio-pro',
		keyPrefix: 'SS-PRO',
		fallbackMaxDevices: 1,
		features: ['video_export', 'subtitle_auto', 'ai_script', 'render_queue', 'cloud_assets']
	}
] as const;

type ProductSlug = (typeof PRODUCT_OPTIONS)[number]['slug'];

type ProductRow = {
	id: string;
	slug: string;
	name: string;
	plan: 'free' | 'pro';
	default_max_devices: number | null;
};

type DigitalLicenseListRow = {
	licenseId: string;
	productSlug: string;
	productName: string;
	plan: string;
	status: 'active' | 'revoked' | 'expired';
	maxDevices: number | null;
	deviceLimit: number;
	expiresAt: number | null;
	createdAt: number;
	activeDevices: number | null;
};

const isProductSlug = (value: string): value is ProductSlug =>
	PRODUCT_OPTIONS.some((option) => option.slug === value);

const randomSegment = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	let segment = '';
	for (const byte of bytes) {
		segment += KEY_ALPHABET[byte % KEY_ALPHABET.length];
	}
	return segment;
};

const generateLicenseKey = (prefix: string) =>
	`${prefix}-${randomSegment()}-${randomSegment()}-${randomSegment()}`;

const parseExpiresAt = (value: FormDataEntryValue | null) => {
	const raw = typeof value === 'string' ? value.trim() : '';
	if (!raw) return null;

	const parsed = new Date(raw).getTime();
	if (!Number.isFinite(parsed) || parsed <= Date.now()) {
		return undefined;
	}
	return parsed;
};

const normalizeFilter = (value: string | null) => {
	if (value === 'cleaner' || value === 'studio') return value;
	return 'all';
};

const buildProductFilterClause = (filter: string) => {
	if (filter === 'cleaner') return "AND p.slug LIKE 'santri-cleaner-%'";
	if (filter === 'studio') return "AND p.slug LIKE 'santri-studio-%'";
	return '';
};

const listDigitalLicenses = async (db: App.Locals['db'], productFilter: string) => {
	if (!db) return [];
	const productSlugs = PRODUCT_OPTIONS.map((option) => option.slug);
	const placeholders = productSlugs.map(() => '?').join(', ');
	const filterClause = buildProductFilterClause(productFilter);
	const rows = await db
		.prepare(
			`SELECT
				l.license_key AS licenseId,
				p.slug AS productSlug,
				p.name AS productName,
				COALESCE(p.plan, l.plan) AS plan,
				l.status AS status,
				l.max_devices AS maxDevices,
				l.device_limit AS deviceLimit,
				l.expires_at AS expiresAt,
				l.created_at AS createdAt,
				(
					SELECT COUNT(*)
					FROM license_activations a
					WHERE a.license_id = l.license_key AND a.status = 'active'
				) AS activeDevices
			 FROM licenses l
			 JOIN products p ON p.id = l.product_id
			 WHERE p.slug IN (${placeholders})
			 ${filterClause}
			 ORDER BY l.created_at DESC
			 LIMIT 100`
		)
		.bind(...productSlugs)
		.all<DigitalLicenseListRow>();

	return rows.results ?? [];
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const productFilter = normalizeFilter(url.searchParams.get('product'));

	return {
		productFilter,
		productOptions: PRODUCT_OPTIONS.map((option) => ({
			label: option.label,
			slug: option.slug,
			features: option.features
		})),
		licenses: await listDigitalLicenses(db, productFilter)
	};
};

export const actions: Actions = {
	generate: async ({ locals, platform, request }) => {
		const { db } = requireSuperAdmin(locals);
		const secret = platform?.env?.LICENSE_KEY_HASH_SECRET?.trim();
		if (!secret) {
			return fail(500, {
				error: 'LICENSE_KEY_HASH_SECRET belum tersedia di environment Pages.'
			});
		}

		const formData = await request.formData();
		const productSlug = String(formData.get('productSlug') ?? '').trim();
		if (!isProductSlug(productSlug)) {
			return fail(400, {
				error: 'Produk tidak valid.',
				selectedProductSlug: productSlug
			});
		}

		const expiresAt = parseExpiresAt(formData.get('expiresAt'));
		if (expiresAt === undefined) {
			return fail(400, {
				error: 'Tanggal kadaluarsa tidak valid atau sudah lewat.',
				selectedProductSlug: productSlug
			});
		}

		const option = PRODUCT_OPTIONS.find((item) => item.slug === productSlug)!;
		const product = await db
			.prepare(
				`SELECT id, slug, name, plan, default_max_devices
				 FROM products
				 WHERE slug = ? AND status = ?`
			)
			.bind(productSlug, 'active')
			.first<ProductRow>();
		if (!product?.id) {
			return fail(400, {
				error: `Produk ${productSlug} belum tersedia. Pastikan migration 0046 sudah diterapkan.`,
				selectedProductSlug: productSlug
			});
		}

		const maxDevices = Math.max(1, Number(product.default_max_devices ?? option.fallbackMaxDevices));

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const licenseKey = generateLicenseKey(option.keyPrefix);
			const licenseKeyHash = await hashLicenseKey(licenseKey, secret);
			const now = Date.now();
			const internalLicenseId = `lic_${crypto.randomUUID()}`;

			try {
				await db
					.prepare(
						`INSERT INTO licenses (
							license_key,
							user_id,
							user_email,
							plan,
							status,
							device_limit,
							created_at,
							expires_at,
							notes,
							product_id,
							license_key_hash,
							max_devices,
							features_json,
							activated_at,
							updated_at
						)
						VALUES (?, NULL, NULL, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`
					)
					.bind(
						internalLicenseId,
						product.plan,
						maxDevices,
						now,
						expiresAt,
						'Generated from /admin/licenses/generate',
						product.id,
						licenseKeyHash,
						maxDevices,
						JSON.stringify(option.features),
						now
					)
					.run();

				return {
					success: true,
					licenseKey,
					generatedLicenseId: internalLicenseId,
					productSlug,
					productName: option.label,
					plan: product.plan,
					maxDevices,
					expiresAt,
					features: option.features
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : '';
				if (!message.includes('UNIQUE')) {
					return fail(500, {
						error: 'Gagal membuat license produk digital.',
						selectedProductSlug: productSlug
					});
				}
			}
		}

		return fail(500, {
			error: 'Gagal membuat license unik. Coba ulangi.',
			selectedProductSlug: productSlug
		});
	}
};
