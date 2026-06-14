import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { hashLicenseKey, parseFeatures } from '$lib/server/domains/digital-store/licenses/digital-products';

const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type ProductRow = {
	id: string;
	slug: string;
	name: string;
	plan: 'free' | 'pro';
	default_max_devices: number | null;
	features_json: string | null;
};

type ProductOption = {
	label: string;
	slug: string;
	plan: ProductRow['plan'];
	keyPrefix: string;
	keyFormat: string;
	defaultMaxDevices: number;
	features: string[];
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

const randomSegment = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	let segment = '';
	for (const byte of bytes) {
		segment += KEY_ALPHABET[byte % KEY_ALPHABET.length];
	}
	return segment;
};

const buildKeyPrefix = (slug: string) => {
	const parts = slug.split('-').filter(Boolean);
	const plan = (parts.at(-1) ?? 'pro').toUpperCase();
	const productInitials = parts
		.slice(0, -1)
		.map((part) => part[0])
		.join('')
		.toUpperCase();

	return `${productInitials || 'SO'}-${plan}`;
};

const generateLicenseKey = (prefix: string) =>
	`${prefix}-${randomSegment()}-${randomSegment()}-${randomSegment()}`;

const toProductOption = (product: ProductRow): ProductOption => {
	const keyPrefix = buildKeyPrefix(product.slug);
	return {
		label: product.name,
		slug: product.slug,
		plan: product.plan,
		keyPrefix,
		keyFormat: `${keyPrefix}-XXXX-XXXX-XXXX`,
		defaultMaxDevices: Math.max(1, Number(product.default_max_devices ?? 1)),
		features: parseFeatures(product.features_json)
	};
};

const listLicenseProducts = async (db: App.Locals['db']) => {
	if (!db) return [];
	const rows = await db
		.prepare(
			`SELECT id, slug, name, plan, default_max_devices, features_json
			 FROM products
			 WHERE status = ? AND slug LIKE 'santri-%'
			 ORDER BY slug ASC`
		)
		.bind('active')
		.all<ProductRow>();

	return (rows.results ?? []).map(toProductOption);
};

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

const listDigitalLicenses = async (db: App.Locals['db'], productFilter: string, productSlugs: string[]) => {
	if (!db || productSlugs.length === 0) return [];
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
	const productOptions = await listLicenseProducts(db);

	return {
		productFilter,
		productOptions,
		licenses: await listDigitalLicenses(
			db,
			productFilter,
			productOptions.map((option) => option.slug)
		)
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
		if (!productSlug) {
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

		const product = await db
			.prepare(
				`SELECT id, slug, name, plan, default_max_devices, features_json
				 FROM products
				 WHERE slug = ? AND status = ? AND slug LIKE 'santri-%'`
			)
			.bind(productSlug, 'active')
			.first<ProductRow>();
		if (!product?.id) {
			return fail(400, {
				error: `Produk ${productSlug} belum tersedia di D1 atau belum aktif.`,
				selectedProductSlug: productSlug
			});
		}

		const option = toProductOption(product);
		const maxDevices = option.defaultMaxDevices;
		const legacyPlan = product.plan === 'free' ? 'starter' : 'pro';

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
						legacyPlan,
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
