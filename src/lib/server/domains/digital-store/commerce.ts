import type { D1Database } from '@cloudflare/workers-types';

const DAY_MS = 24 * 60 * 60 * 1000;

const jakartaDayFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Jakarta',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const jakartaLabelFormatter = new Intl.DateTimeFormat('id-ID', {
	timeZone: 'Asia/Jakarta',
	day: 'numeric',
	month: 'short'
});

const toJakartaDayKey = (timestamp: number) =>
	jakartaDayFormatter
		.formatToParts(timestamp)
		.reduce(
			(acc, part) => {
				if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
					acc[part.type] = part.value;
				}
				return acc;
			},
			{ year: '0000', month: '00', day: '00' } as Record<'year' | 'month' | 'day', string>
		);

const formatJakartaDayKey = (timestamp: number) => {
	const parts = toJakartaDayKey(timestamp);
	return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatJakartaLabel = (timestamp: number) => jakartaLabelFormatter.format(timestamp);

const normalizeMoney = (value: number | null | undefined) => Number(value ?? 0);
const normalizeFlag = (value: unknown) => Number(value ?? 0) > 0;

const uniqueIds = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export type DigitalPaymentMethodType = 'bank' | 'ewallet' | 'qris' | 'manual';

type DigitalProductStatus = 'draft' | 'published' | 'archived';
type DigitalSaleStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface DigitalPaymentMethod {
	id: string;
	name: string;
	type: DigitalPaymentMethodType;
	accountName: string | null;
	accountNumber: string | null;
	assetUrl: string | null;
	instructions: string | null;
	isActive: boolean;
	displayOrder: number;
	createdAt: number;
	updatedAt: number;
}

export interface DigitalProductPaymentMethodSummary {
	id: string;
	name: string;
	type: DigitalPaymentMethodType;
	accountName?: string | null;
	accountNumber?: string | null;
	assetUrl?: string | null;
	instructions?: string | null;
	isActive: boolean;
}

export interface DigitalProductListItem {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	price: number;
	coverUrl: string | null;
	fileUrl: string | null;
	status: DigitalProductStatus;
	featured: boolean;
	createdAt: number;
	updatedAt: number;
	salesCount: number;
	revenue: number;
	paymentMethods: DigitalProductPaymentMethodSummary[];
	paymentMethodIds: string[];
}

export interface PublicDigitalProductListItem {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	price: number;
	coverUrl: string | null;
	featured: boolean;
	updatedAt: number;
	paymentMethods: DigitalProductPaymentMethodSummary[];
}

export interface DigitalSaleListItem {
	id: string;
	referenceCode: string;
	productId: string;
	productSlug: string | null;
	productTitle: string | null;
	buyerName: string | null;
	buyerContact: string | null;
	amount: number;
	paymentMethodId: string | null;
	paymentMethodName: string | null;
	status: DigitalSaleStatus;
	proofUrl: string | null;
	proofUploadedAt: number | null;
	adminNotes: string | null;
	verifiedAt: number | null;
	verifiedBy: string | null;
	createdAt: number;
	paidAt: number | null;
}

export interface DigitalSalesPoint {
	date: string;
	label: string;
	revenue: number;
	salesCount: number;
}

export interface DigitalCommerceOverview {
	stats: {
		totalProducts: number;
		publishedProducts: number;
		draftProducts: number;
		featuredProducts: number;
		activeMethods: number;
		totalSales: number;
		totalRevenue: number;
		averageOrderValue: number;
	};
	products: DigitalProductListItem[];
	paymentMethods: DigitalPaymentMethod[];
	pendingSales: DigitalSaleListItem[];
	recentSales: DigitalSaleListItem[];
	salesChart: DigitalSalesPoint[];
}

type ProductRow = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	price: number | null;
	cover_url: string | null;
	file_url: string | null;
	status: DigitalProductStatus;
	featured: number | null;
	created_at: number;
	updated_at: number;
	salesCount: number | null;
	revenue: number | null;
};

type PaymentMethodRow = {
	id: string;
	name: string;
	type: DigitalPaymentMethodType;
	account_name: string | null;
	account_number: string | null;
	asset_url: string | null;
	instructions: string | null;
	is_active: number | null;
	display_order: number | null;
	created_at: number;
	updated_at: number;
};

const mapPaymentMethod = (row: PaymentMethodRow): DigitalPaymentMethod => ({
	id: row.id,
	name: row.name,
	type: row.type,
	accountName: row.account_name,
	accountNumber: row.account_number,
	assetUrl: row.asset_url,
	instructions: row.instructions,
	isActive: normalizeFlag(row.is_active),
	displayOrder: Number(row.display_order ?? 0),
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

const mapProduct = (
	row: ProductRow,
	methodsByProduct: Map<string, DigitalProductPaymentMethodSummary[]>
): DigitalProductListItem => {
	const paymentMethods = methodsByProduct.get(row.id) ?? [];
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		summary: row.summary,
		description: row.description,
		price: normalizeMoney(row.price),
		coverUrl: row.cover_url,
		fileUrl: row.file_url,
		status: row.status,
		featured: normalizeFlag(row.featured),
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		salesCount: Number(row.salesCount ?? 0),
		revenue: normalizeMoney(row.revenue),
		paymentMethods,
		paymentMethodIds: paymentMethods.map((method) => method.id)
	};
};

const mapPublicProduct = (
	row: ProductRow,
	methodsByProduct: Map<string, DigitalProductPaymentMethodSummary[]>
): PublicDigitalProductListItem => ({
	id: row.id,
	title: row.title,
	slug: row.slug,
	summary: row.summary,
	description: row.description,
	price: normalizeMoney(row.price),
	coverUrl: row.cover_url,
	featured: normalizeFlag(row.featured),
	updatedAt: row.updated_at,
	paymentMethods: (methodsByProduct.get(row.id) ?? []).filter((method) => method.isActive)
});

export async function ensureDigitalCommerceSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS digital_products (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				slug TEXT UNIQUE NOT NULL,
				summary TEXT,
				description TEXT,
				price INTEGER NOT NULL DEFAULT 0,
				cover_url TEXT,
				file_url TEXT,
				status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
				featured INTEGER NOT NULL DEFAULT 0,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`
		)
		.run();
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS digital_payment_methods (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('bank', 'ewallet', 'qris', 'manual')),
				account_name TEXT,
				account_number TEXT,
				asset_url TEXT,
				instructions TEXT,
				is_active INTEGER NOT NULL DEFAULT 1,
				display_order INTEGER NOT NULL DEFAULT 0,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`
		)
		.run();
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS digital_product_payment_methods (
				product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
				payment_method_id TEXT NOT NULL REFERENCES digital_payment_methods(id) ON DELETE CASCADE,
				created_at INTEGER NOT NULL,
				PRIMARY KEY (product_id, payment_method_id)
			)`
		)
		.run();
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS digital_product_sales (
				id TEXT PRIMARY KEY,
				product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
				buyer_name TEXT,
				buyer_contact TEXT,
				amount INTEGER NOT NULL,
				reference_code TEXT UNIQUE,
				payment_method_id TEXT REFERENCES digital_payment_methods(id) ON DELETE SET NULL,
				payment_method_name TEXT,
				status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
				proof_url TEXT,
				proof_key TEXT,
				proof_mime_type TEXT,
				proof_size INTEGER,
				proof_uploaded_at INTEGER,
				admin_notes TEXT,
				verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
				verified_at INTEGER,
				access_token TEXT,
				paid_at INTEGER,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`
		)
		.run();

	try {
		await db.prepare('ALTER TABLE digital_payment_methods ADD COLUMN asset_url TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN reference_code TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN proof_url TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN proof_key TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN proof_mime_type TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN proof_size INTEGER').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN proof_uploaded_at INTEGER').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN admin_notes TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN verified_by TEXT REFERENCES users(id) ON DELETE SET NULL').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN verified_at INTEGER').run();
	} catch (_) {
		// ignore when column already exists
	}
	try {
		await db.prepare('ALTER TABLE digital_product_sales ADD COLUMN access_token TEXT').run();
	} catch (_) {
		// ignore when column already exists
	}

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON digital_products(slug)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status)').run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_digital_payment_methods_active ON digital_payment_methods(is_active, display_order, updated_at DESC)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_digital_product_payment_methods_product ON digital_product_payment_methods(product_id)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_digital_product_sales_created ON digital_product_sales(created_at DESC)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_digital_product_sales_product ON digital_product_sales(product_id, status)'
		)
		.run();
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_product_sales_reference_code ON digital_product_sales(reference_code)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_digital_product_sales_status_created ON digital_product_sales(status, created_at DESC)'
		)
		.run();
}

export async function listDigitalPaymentMethods(db: D1Database): Promise<DigitalPaymentMethod[]> {
	const { results } = await db
		.prepare(
			`SELECT id, name, type, account_name, account_number, instructions, is_active, display_order, created_at, updated_at
			 ,
			 asset_url
			 FROM digital_payment_methods
			 ORDER BY is_active DESC, display_order ASC, updated_at DESC`
		)
		.all<PaymentMethodRow>();

	return (results ?? []).map(mapPaymentMethod);
}

const listProductPaymentMethods = async (db: D1Database) => {
	const { results } = await db
		.prepare(
			`SELECT ppm.product_id as productId, m.id, m.name, m.type, m.account_name as accountName, m.account_number as accountNumber, m.asset_url as assetUrl, m.instructions, m.is_active as isActive
			 FROM digital_product_payment_methods ppm
			 INNER JOIN digital_payment_methods m ON m.id = ppm.payment_method_id
			 ORDER BY m.display_order ASC, m.updated_at DESC`
		)
		.all<{
			productId: string;
			id: string;
			name: string;
			type: DigitalPaymentMethodType;
			accountName: string | null;
			accountNumber: string | null;
			assetUrl: string | null;
			instructions: string | null;
			isActive: number | null;
		}>();

	const methodsByProduct = new Map<string, DigitalProductPaymentMethodSummary[]>();
	for (const row of results ?? []) {
		const list = methodsByProduct.get(row.productId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			type: row.type,
			accountName: row.accountName,
			accountNumber: row.accountNumber,
			assetUrl: row.assetUrl,
			instructions: row.instructions,
			isActive: normalizeFlag(row.isActive)
		});
		methodsByProduct.set(row.productId, list);
	}
	return methodsByProduct;
};

const resolvePublicMethods = (
	allMethods: DigitalPaymentMethod[],
	methodsByProduct: Map<string, DigitalProductPaymentMethodSummary[]>,
	productId: string
) => {
	const assigned = (methodsByProduct.get(productId) ?? []).filter((method) => method.isActive);
	if (assigned.length > 0) return assigned;
	return allMethods
		.filter((method) => method.isActive)
		.map((method) => ({
			id: method.id,
			name: method.name,
			type: method.type,
			accountName: method.accountName,
			accountNumber: method.accountNumber,
			assetUrl: method.assetUrl,
			instructions: method.instructions,
			isActive: method.isActive
		}));
};

export async function listDigitalProducts(db: D1Database): Promise<DigitalProductListItem[]> {
	const methodsByProduct = await listProductPaymentMethods(db);
	const { results } = await db
		.prepare(
			`SELECT
				p.id,
				p.title,
				p.slug,
				p.summary,
				p.description,
				p.price,
				p.cover_url,
				p.file_url,
				p.status,
				p.featured,
				p.created_at,
				p.updated_at,
				COALESCE(SUM(CASE WHEN s.status = 'paid' THEN 1 ELSE 0 END), 0) as salesCount,
				COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.amount ELSE 0 END), 0) as revenue
			FROM digital_products p
			LEFT JOIN digital_product_sales s ON s.product_id = p.id
			GROUP BY p.id
			ORDER BY
				CASE p.status
					WHEN 'published' THEN 0
					WHEN 'draft' THEN 1
					ELSE 2
				END,
				p.updated_at DESC`
		)
		.all<ProductRow>();

	return (results ?? []).map((row) => mapProduct(row, methodsByProduct));
}

export async function listPublishedDigitalProducts(
	db: D1Database
): Promise<PublicDigitalProductListItem[]> {
	const [methodsByProduct, allMethods] = await Promise.all([
		listProductPaymentMethods(db),
		listDigitalPaymentMethods(db)
	]);
	const { results } = await db
		.prepare(
			`SELECT
				p.id,
				p.title,
				p.slug,
				p.summary,
				p.description,
				p.price,
				p.cover_url,
				p.file_url,
				p.status,
				p.featured,
				p.created_at,
				p.updated_at,
				0 as salesCount,
				0 as revenue
			FROM digital_products p
			WHERE p.status = 'published'
			ORDER BY p.featured DESC, p.updated_at DESC`
		)
		.all<ProductRow>();

	return (results ?? []).map((row) => ({
		...mapPublicProduct(row, methodsByProduct),
		paymentMethods: resolvePublicMethods(allMethods, methodsByProduct, row.id)
	}));
}

export async function getPublishedDigitalProductBySlug(
	db: D1Database,
	slug: string
): Promise<PublicDigitalProductListItem | null> {
	const [methodsByProduct, allMethods, row] = await Promise.all([
		listProductPaymentMethods(db),
		listDigitalPaymentMethods(db),
		db
			.prepare(
				`SELECT
					p.id,
					p.title,
					p.slug,
					p.summary,
					p.description,
					p.price,
					p.cover_url,
					p.file_url,
					p.status,
					p.featured,
					p.created_at,
					p.updated_at,
					0 as salesCount,
					0 as revenue
				FROM digital_products p
				WHERE p.slug = ? AND p.status = 'published'
				LIMIT 1`
			)
			.bind(slug)
			.first<ProductRow>()
	]);

	if (!row) return null;

	return {
		...mapPublicProduct(row, methodsByProduct),
		paymentMethods: resolvePublicMethods(allMethods, methodsByProduct, row.id)
	};
}

export async function getDigitalCommerceOverview(
	db: D1Database,
	{ chartDays = 14 }: { chartDays?: number } = {}
): Promise<DigitalCommerceOverview> {
	const safeChartDays = Math.max(7, Math.min(chartDays, 30));
	const [paymentMethods, products] = await Promise.all([
		listDigitalPaymentMethods(db),
		listDigitalProducts(db)
	]);

	const productStats = await db
		.prepare(
			`SELECT
				COUNT(1) as totalProducts,
				COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) as publishedProducts,
				COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) as draftProducts,
				COALESCE(SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END), 0) as featuredProducts
			 FROM digital_products`
		)
		.first<{
			totalProducts: number | null;
			publishedProducts: number | null;
			draftProducts: number | null;
			featuredProducts: number | null;
		}>();

	const salesStats = await db
		.prepare(
			`SELECT
				COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as totalSales,
				COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalRevenue
			 FROM digital_product_sales`
		)
		.first<{ totalSales: number | null; totalRevenue: number | null }>();

	const todayKey = formatJakartaDayKey(Date.now());
	const chartStart = Date.parse(`${todayKey}T00:00:00+07:00`) - (safeChartDays - 1) * DAY_MS;

	const { results: rawChartRows } = await db
		.prepare(
			`SELECT
				strftime('%Y-%m-%d', COALESCE(paid_at, created_at) / 1000, 'unixepoch', '+7 hours') as day,
				COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as salesCount,
				COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as revenue
			 FROM digital_product_sales
			 WHERE COALESCE(paid_at, created_at) >= ?
			 GROUP BY day
			 ORDER BY day ASC`
		)
		.bind(chartStart)
		.all<{ day: string; salesCount: number | null; revenue: number | null }>();

	const chartMap = new Map(
		(rawChartRows ?? []).map((row) => [
			row.day,
			{
				salesCount: Number(row.salesCount ?? 0),
				revenue: normalizeMoney(row.revenue)
			}
		])
	);

	const salesChart: DigitalSalesPoint[] = [];
	for (let index = 0; index < safeChartDays; index += 1) {
		const timestamp = chartStart + index * DAY_MS;
		const date = formatJakartaDayKey(timestamp);
		const row = chartMap.get(date);
		salesChart.push({
			date,
			label: formatJakartaLabel(timestamp),
			salesCount: row?.salesCount ?? 0,
			revenue: row?.revenue ?? 0
		});
	}

	const { results: recentSalesRows } = await db
		.prepare(
			`SELECT
				s.id,
				s.reference_code as referenceCode,
				s.product_id as productId,
				p.slug as productSlug,
				p.title as productTitle,
				s.buyer_name as buyerName,
				s.buyer_contact as buyerContact,
				s.amount,
				s.payment_method_id as paymentMethodId,
				s.payment_method_name as paymentMethodName,
				s.status,
				s.proof_url as proofUrl,
				s.proof_uploaded_at as proofUploadedAt,
				s.admin_notes as adminNotes,
				s.verified_at as verifiedAt,
				u.username as verifiedByUsername,
				u.email as verifiedByEmail,
				s.created_at as createdAt,
				s.paid_at as paidAt
			 FROM digital_product_sales s
			 LEFT JOIN digital_products p ON p.id = s.product_id
			 LEFT JOIN users u ON u.id = s.verified_by
			 ORDER BY
			 	CASE s.status
					WHEN 'pending' THEN 0
					WHEN 'paid' THEN 1
					WHEN 'failed' THEN 2
					ELSE 3
				END,
				COALESCE(s.paid_at, s.created_at) DESC
			 LIMIT 16`
		)
		.all<{
			id: string;
			referenceCode: string | null;
			productId: string;
			productSlug: string | null;
			productTitle: string | null;
			buyerName: string | null;
			buyerContact: string | null;
			amount: number | null;
			paymentMethodId: string | null;
			paymentMethodName: string | null;
			status: DigitalSaleStatus;
			proofUrl: string | null;
			proofUploadedAt: number | null;
			adminNotes: string | null;
			verifiedAt: number | null;
			verifiedByUsername: string | null;
			verifiedByEmail: string | null;
			createdAt: number;
			paidAt: number | null;
		}>();

	const mapSaleRow = (row: {
		id: string;
		referenceCode: string | null;
		productId: string;
		productSlug: string | null;
		productTitle: string | null;
		buyerName: string | null;
		buyerContact: string | null;
		amount: number | null;
		paymentMethodId: string | null;
		paymentMethodName: string | null;
		status: DigitalSaleStatus;
		proofUrl: string | null;
		proofUploadedAt: number | null;
		adminNotes: string | null;
		verifiedAt: number | null;
		verifiedByUsername: string | null;
		verifiedByEmail: string | null;
		createdAt: number;
		paidAt: number | null;
	}): DigitalSaleListItem => ({
		id: row.id,
		referenceCode: row.referenceCode ?? row.id,
		productId: row.productId,
		productSlug: row.productSlug,
		productTitle: row.productTitle,
		buyerName: row.buyerName,
		buyerContact: row.buyerContact,
		amount: normalizeMoney(row.amount),
		paymentMethodId: row.paymentMethodId,
		paymentMethodName: row.paymentMethodName,
		status: row.status,
		proofUrl: row.proofUrl,
		proofUploadedAt: row.proofUploadedAt,
		adminNotes: row.adminNotes,
		verifiedAt: row.verifiedAt,
		verifiedBy: row.verifiedByUsername || row.verifiedByEmail || null,
		createdAt: row.createdAt,
		paidAt: row.paidAt
	});

	const totalSales = Number(salesStats?.totalSales ?? 0);
	const totalRevenue = normalizeMoney(salesStats?.totalRevenue);
	const recentSales = (recentSalesRows ?? []).map(mapSaleRow);

	return {
		stats: {
			totalProducts: Number(productStats?.totalProducts ?? 0),
			publishedProducts: Number(productStats?.publishedProducts ?? 0),
			draftProducts: Number(productStats?.draftProducts ?? 0),
			featuredProducts: Number(productStats?.featuredProducts ?? 0),
			activeMethods: paymentMethods.filter((method) => method.isActive).length,
			totalSales,
			totalRevenue,
			averageOrderValue: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0
		},
		products,
		paymentMethods,
		pendingSales: recentSales.filter((sale) => sale.status === 'pending'),
		recentSales,
		salesChart
	};
}

export async function upsertDigitalPaymentMethod(
	db: D1Database,
	input: {
		id?: string | null;
		name: string;
		type: DigitalPaymentMethodType;
		accountName?: string | null;
		accountNumber?: string | null;
		assetUrl?: string | null;
		instructions?: string | null;
		isActive?: boolean;
		displayOrder?: number;
	}
) {
	const now = Date.now();
	const id = input.id?.trim() || crypto.randomUUID();

	if (input.id?.trim()) {
		await db
			.prepare(
			`UPDATE digital_payment_methods
				 SET name = ?, type = ?, account_name = ?, account_number = ?, asset_url = ?, instructions = ?, is_active = ?, display_order = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				input.name.trim(),
				input.type,
				input.accountName?.trim() || null,
				input.accountNumber?.trim() || null,
				input.assetUrl?.trim() || null,
				input.instructions?.trim() || null,
				input.isActive ? 1 : 0,
				Math.max(0, Math.floor(input.displayOrder ?? 0)),
				now,
				id
			)
			.run();
		return id;
	}

	await db
		.prepare(
			`INSERT INTO digital_payment_methods
				(id, name, type, account_name, account_number, asset_url, instructions, is_active, display_order, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			input.name.trim(),
			input.type,
			input.accountName?.trim() || null,
			input.accountNumber?.trim() || null,
			input.assetUrl?.trim() || null,
			input.instructions?.trim() || null,
			input.isActive ? 1 : 0,
			Math.max(0, Math.floor(input.displayOrder ?? 0)),
			now,
			now
		)
		.run();
	return id;
}

export async function deleteDigitalPaymentMethod(db: D1Database, id: string) {
	await db
		.prepare('UPDATE digital_product_sales SET payment_method_id = NULL WHERE payment_method_id = ?')
		.bind(id)
		.run();
	await db
		.prepare('DELETE FROM digital_product_payment_methods WHERE payment_method_id = ?')
		.bind(id)
		.run();
	await db.prepare('DELETE FROM digital_payment_methods WHERE id = ?').bind(id).run();
}

const replaceProductPaymentMethods = async (
	db: D1Database,
	productId: string,
	paymentMethodIds: string[]
) => {
	const nextIds = uniqueIds(paymentMethodIds);
	const now = Date.now();
	await db.prepare('DELETE FROM digital_product_payment_methods WHERE product_id = ?').bind(productId).run();

	for (const paymentMethodId of nextIds) {
		await db
			.prepare(
				`INSERT INTO digital_product_payment_methods (product_id, payment_method_id, created_at)
				 VALUES (?, ?, ?)`
			)
			.bind(productId, paymentMethodId, now)
			.run();
	}
};

export async function upsertDigitalProduct(
	db: D1Database,
	input: {
		id?: string | null;
		title: string;
		slug: string;
		summary?: string | null;
		description?: string | null;
		price: number;
		coverUrl?: string | null;
		fileUrl?: string | null;
		status: DigitalProductStatus;
		featured?: boolean;
		paymentMethodIds?: string[];
	}
) {
	const now = Date.now();
	const id = input.id?.trim() || crypto.randomUUID();

	if (input.id?.trim()) {
		await db
			.prepare(
				`UPDATE digital_products
				 SET title = ?, slug = ?, summary = ?, description = ?, price = ?, cover_url = ?, file_url = ?, status = ?, featured = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				input.title.trim(),
				input.slug.trim(),
				input.summary?.trim() || null,
				input.description?.trim() || null,
				Math.max(0, Math.floor(input.price)),
				input.coverUrl?.trim() || null,
				input.fileUrl?.trim() || null,
				input.status,
				input.featured ? 1 : 0,
				now,
				id
			)
			.run();
		await replaceProductPaymentMethods(db, id, input.paymentMethodIds ?? []);
		return id;
	}

	await db
		.prepare(
			`INSERT INTO digital_products
				(id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			input.title.trim(),
			input.slug.trim(),
			input.summary?.trim() || null,
			input.description?.trim() || null,
			Math.max(0, Math.floor(input.price)),
			input.coverUrl?.trim() || null,
			input.fileUrl?.trim() || null,
			input.status,
			input.featured ? 1 : 0,
			now,
			now
		)
		.run();
	await replaceProductPaymentMethods(db, id, input.paymentMethodIds ?? []);
	return id;
}

export async function updateDigitalProductStatus(
	db: D1Database,
	id: string,
	status: DigitalProductStatus
) {
	await db
		.prepare('UPDATE digital_products SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, Date.now(), id)
		.run();
}

export async function deleteDigitalProduct(db: D1Database, id: string) {
	await db.prepare('DELETE FROM digital_product_payment_methods WHERE product_id = ?').bind(id).run();
	await db.prepare('DELETE FROM digital_product_sales WHERE product_id = ?').bind(id).run();
	await db.prepare('DELETE FROM digital_products WHERE id = ?').bind(id).run();
}

export async function createDigitalSale(
	db: D1Database,
	input: {
		productId: string;
		buyerName?: string | null;
		buyerContact?: string | null;
		amount?: number | null;
		paymentMethodId?: string | null;
		status?: DigitalSaleStatus;
	}
) {
	const product = await db
		.prepare('SELECT id, title, price FROM digital_products WHERE id = ?')
		.bind(input.productId)
		.first<{ id: string; title: string; price: number | null }>();
	if (!product) {
		throw new Error('Produk digital tidak ditemukan.');
	}

	let paymentMethodName: string | null = null;
	let paymentMethodId: string | null = null;

	if (input.paymentMethodId?.trim()) {
		const method = await db
			.prepare('SELECT id, name FROM digital_payment_methods WHERE id = ?')
			.bind(input.paymentMethodId.trim())
			.first<{ id: string; name: string }>();
		if (method) {
			paymentMethodId = method.id;
			paymentMethodName = method.name;
		}
	}

	const status = input.status ?? 'paid';
	const now = Date.now();
	const amount = Math.max(0, Math.floor(input.amount ?? product.price ?? 0));

	await db
		.prepare(
			`INSERT INTO digital_product_sales
				(id, product_id, buyer_name, buyer_contact, amount, reference_code, payment_method_id, payment_method_name, status, access_token, paid_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			crypto.randomUUID(),
			product.id,
			input.buyerName?.trim() || null,
			input.buyerContact?.trim() || null,
			amount,
			`LEGACY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
			paymentMethodId,
			paymentMethodName,
			status,
			crypto.randomUUID(),
			status === 'paid' ? now : null,
			now,
			now
		)
		.run();
}

const createReferenceCode = () => {
	const date = new Date();
	const y = date.getFullYear().toString().slice(-2);
	const m = `${date.getMonth() + 1}`.padStart(2, '0');
	const d = `${date.getDate()}`.padStart(2, '0');
	const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
	return `SO-DIG-${y}${m}${d}-${random}`;
};

const createAccessToken = () => `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, '')}`;

export async function createManualDigitalOrder(
	db: D1Database,
	input: {
		productId: string;
		buyerName: string;
		buyerContact: string;
		paymentMethodId: string;
	}
) {
	const product = await db
		.prepare(
			`SELECT id, title, slug, price, status
			 FROM digital_products
			 WHERE id = ?`
		)
		.bind(input.productId)
		.first<{
			id: string;
			title: string;
			slug: string;
			price: number | null;
			status: DigitalProductStatus;
		}>();
	if (!product || product.status !== 'published') {
		throw new Error('Produk digital tidak tersedia untuk checkout.');
	}

	const method = await db
		.prepare(
			`SELECT id, name, type, account_name as accountName, account_number as accountNumber, asset_url as assetUrl, instructions, is_active as isActive
			 FROM digital_payment_methods
			 WHERE id = ?`
		)
		.bind(input.paymentMethodId)
		.first<{
			id: string;
			name: string;
			type: DigitalPaymentMethodType;
			accountName: string | null;
			accountNumber: string | null;
			assetUrl: string | null;
			instructions: string | null;
			isActive: number | null;
		}>();
	if (!method || !normalizeFlag(method.isActive)) {
		throw new Error('Metode pembayaran tidak tersedia.');
	}

	const productMethod = await db
		.prepare(
			`SELECT 1 as enabled
			 FROM digital_product_payment_methods
			 WHERE product_id = ? AND payment_method_id = ?
			 LIMIT 1`
		)
		.bind(product.id, method.id)
		.first<{ enabled: number | null }>();
	const hasSpecificMethods = await db
		.prepare(
			`SELECT COUNT(1) as total
			 FROM digital_product_payment_methods
			 WHERE product_id = ?`
		)
		.bind(product.id)
		.first<{ total: number | null }>();
	if (Number(hasSpecificMethods?.total ?? 0) > 0 && !productMethod) {
		throw new Error('Metode pembayaran tidak tersedia untuk produk ini.');
	}

	const referenceCode = createReferenceCode();
	const accessToken = createAccessToken();
	const now = Date.now();
	const amount = Math.max(0, Math.floor(product.price ?? 0));
	const id = crypto.randomUUID();

	await db
		.prepare(
			`INSERT INTO digital_product_sales
				(id, product_id, buyer_name, buyer_contact, amount, reference_code, payment_method_id, payment_method_name, status, access_token, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
		)
		.bind(
			id,
			product.id,
			input.buyerName.trim(),
			input.buyerContact.trim(),
			amount,
			referenceCode,
			method.id,
			method.name,
			accessToken,
			now,
			now
		)
		.run();

	return {
		id,
		referenceCode,
		accessToken,
		product: {
			id: product.id,
			title: product.title,
			slug: product.slug,
			price: amount
		},
		paymentMethod: {
			id: method.id,
			name: method.name,
			type: method.type,
			accountName: method.accountName,
			accountNumber: method.accountNumber,
			assetUrl: method.assetUrl,
			instructions: method.instructions
		}
	};
}

export async function attachDigitalSaleProof(
	db: D1Database,
	input: {
		referenceCode: string;
		accessToken: string;
		proofUrl: string;
		proofKey?: string | null;
		proofMimeType?: string | null;
		proofSize?: number | null;
	}
) {
	const order = await db
		.prepare(
			`SELECT id, status
			 FROM digital_product_sales
			 WHERE reference_code = ? AND access_token = ?
			 LIMIT 1`
		)
		.bind(input.referenceCode, input.accessToken)
		.first<{ id: string; status: DigitalSaleStatus }>();
	if (!order) {
		throw new Error('Pesanan tidak ditemukan.');
	}
	if (order.status === 'paid') {
		throw new Error('Pesanan sudah lunas dan tidak perlu upload bukti lagi.');
	}

	const now = Date.now();
	await db
		.prepare(
			`UPDATE digital_product_sales
			 SET proof_url = ?, proof_key = ?, proof_mime_type = ?, proof_size = ?, proof_uploaded_at = ?, status = 'pending', updated_at = ?
			 WHERE id = ?`
		)
		.bind(
			input.proofUrl,
			input.proofKey?.trim() || null,
			input.proofMimeType?.trim() || null,
			input.proofSize ?? null,
			now,
			now,
			order.id
		)
		.run();
}

export async function updateDigitalSaleStatus(
	db: D1Database,
	input: {
		id: string;
		status: DigitalSaleStatus;
		adminNotes?: string | null;
		verifiedBy?: string | null;
	}
) {
	const now = Date.now();
	const shouldMarkPaid = input.status === 'paid';
	const shouldMarkVerified = input.status === 'paid' || input.status === 'failed' || input.status === 'refunded';

	await db
		.prepare(
			`UPDATE digital_product_sales
			 SET status = ?, admin_notes = ?, verified_by = ?, verified_at = ?, paid_at = CASE WHEN ? = 1 THEN COALESCE(paid_at, ?) ELSE paid_at END, updated_at = ?
			 WHERE id = ?`
		)
		.bind(
			input.status,
			input.adminNotes?.trim() || null,
			shouldMarkVerified ? input.verifiedBy?.trim() || null : null,
			shouldMarkVerified ? now : null,
			shouldMarkPaid ? 1 : 0,
			now,
			now,
			input.id
		)
		.run();
}

export async function getDigitalOrderByReference(
	db: D1Database,
	referenceCode: string,
	accessToken: string
) {
	return await db
		.prepare(
			`SELECT
				s.id,
				s.reference_code as referenceCode,
				s.access_token as accessToken,
				s.product_id as productId,
				p.slug as productSlug,
				p.title as productTitle,
				p.summary as productSummary,
				p.description as productDescription,
				p.cover_url as productCoverUrl,
				p.file_url as productFileUrl,
				s.buyer_name as buyerName,
				s.buyer_contact as buyerContact,
				s.amount,
				s.payment_method_id as paymentMethodId,
				s.payment_method_name as paymentMethodName,
				m.type as paymentMethodType,
				m.account_name as paymentAccountName,
				m.account_number as paymentAccountNumber,
				m.asset_url as paymentAssetUrl,
				m.instructions as paymentInstructions,
				s.status,
				s.proof_url as proofUrl,
				s.proof_uploaded_at as proofUploadedAt,
				s.admin_notes as adminNotes,
				s.verified_at as verifiedAt,
				s.created_at as createdAt,
				s.paid_at as paidAt
			 FROM digital_product_sales s
			 INNER JOIN digital_products p ON p.id = s.product_id
			 LEFT JOIN digital_payment_methods m ON m.id = s.payment_method_id
			 WHERE s.reference_code = ? AND s.access_token = ?
			 LIMIT 1`
		)
		.bind(referenceCode, accessToken)
		.first<{
			id: string;
			referenceCode: string;
			accessToken: string;
			productId: string;
			productSlug: string | null;
			productTitle: string | null;
			productSummary: string | null;
			productDescription: string | null;
			productCoverUrl: string | null;
			productFileUrl: string | null;
			buyerName: string | null;
			buyerContact: string | null;
			amount: number | null;
			paymentMethodId: string | null;
			paymentMethodName: string | null;
			paymentMethodType: DigitalPaymentMethodType | null;
			paymentAccountName: string | null;
			paymentAccountNumber: string | null;
			paymentAssetUrl: string | null;
			paymentInstructions: string | null;
			status: DigitalSaleStatus;
			proofUrl: string | null;
			proofUploadedAt: number | null;
			adminNotes: string | null;
			verifiedAt: number | null;
			createdAt: number;
			paidAt: number | null;
		}>();
}
