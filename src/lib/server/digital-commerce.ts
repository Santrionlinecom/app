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

export interface DigitalSaleListItem {
	id: string;
	productId: string;
	productTitle: string | null;
	buyerName: string | null;
	buyerContact: string | null;
	amount: number;
	paymentMethodId: string | null;
	paymentMethodName: string | null;
	status: DigitalSaleStatus;
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
				payment_method_id TEXT REFERENCES digital_payment_methods(id) ON DELETE SET NULL,
				payment_method_name TEXT,
				status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
				paid_at INTEGER,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`
		)
		.run();

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
}

export async function listDigitalPaymentMethods(db: D1Database): Promise<DigitalPaymentMethod[]> {
	const { results } = await db
		.prepare(
			`SELECT id, name, type, account_name, account_number, instructions, is_active, display_order, created_at, updated_at
			 FROM digital_payment_methods
			 ORDER BY is_active DESC, display_order ASC, updated_at DESC`
		)
		.all<PaymentMethodRow>();

	return (results ?? []).map(mapPaymentMethod);
}

const listProductPaymentMethods = async (db: D1Database) => {
	const { results } = await db
		.prepare(
			`SELECT ppm.product_id as productId, m.id, m.name, m.type, m.is_active as isActive
			 FROM digital_product_payment_methods ppm
			 INNER JOIN digital_payment_methods m ON m.id = ppm.payment_method_id
			 ORDER BY m.display_order ASC, m.updated_at DESC`
		)
		.all<{
			productId: string;
			id: string;
			name: string;
			type: DigitalPaymentMethodType;
			isActive: number | null;
		}>();

	const methodsByProduct = new Map<string, DigitalProductPaymentMethodSummary[]>();
	for (const row of results ?? []) {
		const list = methodsByProduct.get(row.productId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			type: row.type,
			isActive: normalizeFlag(row.isActive)
		});
		methodsByProduct.set(row.productId, list);
	}
	return methodsByProduct;
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
				s.product_id as productId,
				p.title as productTitle,
				s.buyer_name as buyerName,
				s.buyer_contact as buyerContact,
				s.amount,
				s.payment_method_id as paymentMethodId,
				s.payment_method_name as paymentMethodName,
				s.status,
				s.created_at as createdAt,
				s.paid_at as paidAt
			 FROM digital_product_sales s
			 LEFT JOIN digital_products p ON p.id = s.product_id
			 ORDER BY COALESCE(s.paid_at, s.created_at) DESC
			 LIMIT 8`
		)
		.all<{
			id: string;
			productId: string;
			productTitle: string | null;
			buyerName: string | null;
			buyerContact: string | null;
			amount: number | null;
			paymentMethodId: string | null;
			paymentMethodName: string | null;
			status: DigitalSaleStatus;
			createdAt: number;
			paidAt: number | null;
		}>();

	const totalSales = Number(salesStats?.totalSales ?? 0);
	const totalRevenue = normalizeMoney(salesStats?.totalRevenue);

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
		recentSales: (recentSalesRows ?? []).map((row) => ({
			id: row.id,
			productId: row.productId,
			productTitle: row.productTitle,
			buyerName: row.buyerName,
			buyerContact: row.buyerContact,
			amount: normalizeMoney(row.amount),
			paymentMethodId: row.paymentMethodId,
			paymentMethodName: row.paymentMethodName,
			status: row.status,
			createdAt: row.createdAt,
			paidAt: row.paidAt
		})),
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
				 SET name = ?, type = ?, account_name = ?, account_number = ?, instructions = ?, is_active = ?, display_order = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				input.name.trim(),
				input.type,
				input.accountName?.trim() || null,
				input.accountNumber?.trim() || null,
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
				(id, name, type, account_name, account_number, instructions, is_active, display_order, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			input.name.trim(),
			input.type,
			input.accountName?.trim() || null,
			input.accountNumber?.trim() || null,
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
				(id, product_id, buyer_name, buyer_contact, amount, payment_method_id, payment_method_name, status, paid_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			crypto.randomUUID(),
			product.id,
			input.buyerName?.trim() || null,
			input.buyerContact?.trim() || null,
			amount,
			paymentMethodId,
			paymentMethodName,
			status,
			status === 'paid' ? now : null,
			now,
			now
		)
		.run();
}
