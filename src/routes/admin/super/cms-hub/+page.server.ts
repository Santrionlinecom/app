import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { ensureCmsSchema, getAllPosts } from '$lib/server/cms';
import {
	deleteDigitalPaymentMethod,
	deleteDigitalProduct,
	ensureDigitalCommerceSchema,
	getDigitalCommerceOverview,
	updateDigitalProductStatus,
	upsertDigitalPaymentMethod,
	upsertDigitalProduct
} from '$lib/server/digital-commerce';

const productStatuses = ['draft', 'published', 'archived'] as const;
type ProductStatus = (typeof productStatuses)[number];
const allowedProductStatuses = new Set<ProductStatus>(productStatuses);

const paymentTypes = ['bank', 'ewallet', 'qris', 'manual'] as const;
type PaymentType = (typeof paymentTypes)[number];
const allowedPaymentTypes = new Set<PaymentType>(paymentTypes);

const normalizeText = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const normalizeSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

const parseInteger = (value: FormDataEntryValue | null, fallback = 0) => {
	const parsed = Number.parseInt(normalizeText(value), 10);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCurrency = (value: FormDataEntryValue | null) => {
	const normalized = normalizeText(value).replace(/[^\d]/g, '');
	if (!normalized) return null;
	const parsed = Number.parseInt(normalized, 10);
	return Number.isFinite(parsed) ? parsed : null;
};

const readFirstValue = (formData: FormData, ...names: string[]) => {
	for (const name of names) {
		const value = normalizeText(formData.get(name));
		if (value) return value;
	}
	return '';
};

const readManyValues = (formData: FormData, ...names: string[]) => {
	const values = names.flatMap((name) =>
		formData
			.getAll(name)
			.map((value) => normalizeText(value))
			.filter(Boolean)
	);
	return Array.from(new Set(values));
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureCmsSchema(db);
	await ensureDigitalCommerceSchema(db);

	const recentCmsPosts = await getAllPosts(db, { page: 1, limit: 10 });
	const cmsStatsRow = await db
		.prepare(
			`SELECT
				COUNT(1) as totalPosts,
				COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) as publishedPosts,
				COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) as draftPosts,
				COALESCE(SUM(CASE WHEN scheduled_at IS NOT NULL AND scheduled_at > ? THEN 1 ELSE 0 END), 0) as scheduledPosts
			 FROM cms_posts`
		)
		.bind(Date.now())
		.first<{
			totalPosts: number | null;
			publishedPosts: number | null;
			draftPosts: number | null;
			scheduledPosts: number | null;
		}>();

	const digitalCommerce = await getDigitalCommerceOverview(db, { chartDays: 14 });
	const editingProductId = (url.searchParams.get('product') ?? '').trim();
	const editingPaymentMethodId = (url.searchParams.get('payment') ?? '').trim();
	const editingProduct =
		digitalCommerce.products.find((product) => product.id === editingProductId) ?? null;
	const editingPaymentMethod =
		digitalCommerce.paymentMethods.find((payment) => payment.id === editingPaymentMethodId) ?? null;

	return {
		cms: {
			stats: {
				totalPosts: Number(cmsStatsRow?.totalPosts ?? 0),
				publishedPosts: Number(cmsStatsRow?.publishedPosts ?? 0),
				draftPosts: Number(cmsStatsRow?.draftPosts ?? 0),
				scheduledPosts: Number(cmsStatsRow?.scheduledPosts ?? 0)
			},
			posts: recentCmsPosts.posts
		},
		digitalCommerce: {
			...digitalCommerce,
			editingProduct,
			editingPaymentMethod
		}
	};
};

export const actions: Actions = {
	saveProduct: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureDigitalCommerceSchema(db);

		const formData = await request.formData();
		const id = readFirstValue(formData, 'id', 'product-id');
		const title = normalizeText(formData.get('title'));
		const slug = normalizeSlug(readFirstValue(formData, 'slug') || title);
		const summary = normalizeText(formData.get('summary'));
		const description = normalizeText(formData.get('description'));
		const coverUrl = readFirstValue(formData, 'coverUrl', 'cover-url');
		const fileUrl = readFirstValue(formData, 'fileUrl', 'file-url');
		const price = parseCurrency(formData.get('price')) ?? 0;
		const status = readFirstValue(formData, 'status');
		const featured = (formData.get('featured') ?? '').toString() === 'on';
		const paymentMethodIds = [
			...readManyValues(formData, 'paymentMethodIds'),
			...readFirstValue(formData, 'payment-methods')
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean)
		].filter((value, index, all) => all.indexOf(value) === index);

		if (!title) {
			return fail(400, { error: 'Nama produk digital wajib diisi.' });
		}
		if (!slug) {
			return fail(400, { error: 'Slug produk tidak valid.' });
		}
		if (!allowedProductStatuses.has(status as ProductStatus)) {
			return fail(400, { error: 'Status produk tidak valid.' });
		}
		if (status === 'published' && !fileUrl) {
			return fail(400, { error: 'Produk yang dipublish wajib memiliki file atau link digital.' });
		}

		try {
			await upsertDigitalProduct(db, {
				id: id || null,
				title,
				slug,
				summary,
				description,
				price,
				coverUrl,
				fileUrl,
				status: status as ProductStatus,
				featured,
				paymentMethodIds
			});
		} catch (err: any) {
			const message = String(err?.message || err || '');
			if (message.includes('UNIQUE') && message.toLowerCase().includes('slug')) {
				return fail(400, { error: 'Slug produk sudah dipakai. Gunakan slug lain.' });
			}
			return fail(500, { error: 'Gagal menyimpan produk digital.' });
		}

		throw redirect(303, '/admin/super/cms-hub#cms-digital');
	},

	deleteProduct: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureDigitalCommerceSchema(db);

		const formData = await request.formData();
		const id = readFirstValue(formData, 'id', 'product-id');

		if (!id) {
			return fail(400, { error: 'Produk digital tidak ditemukan.' });
		}

		await deleteDigitalProduct(db, id);
		throw redirect(303, '/admin/super/cms-hub#cms-digital');
	},

	updateProductStatus: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureDigitalCommerceSchema(db);

		const formData = await request.formData();
		const id = readFirstValue(formData, 'id', 'product-id');
		const status = readFirstValue(formData, 'status', 'next');

		if (!id || !allowedProductStatuses.has(status as ProductStatus)) {
			return fail(400, { error: 'Produk atau status berikutnya tidak valid.' });
		}

		await updateDigitalProductStatus(db, id, status as ProductStatus);
		throw redirect(303, '/admin/super/cms-hub#cms-digital');
	},

	savePaymentMethod: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureDigitalCommerceSchema(db);

		const formData = await request.formData();
		const id = readFirstValue(formData, 'id', 'payment-id');
		const type = readFirstValue(formData, 'type');
		const name = normalizeText(formData.get('name'));
		const accountName = readFirstValue(formData, 'accountName', 'account-name');
		const accountNumber = readFirstValue(formData, 'accountNumber', 'account-number');
		const instructions = readFirstValue(formData, 'instructions', 'details');
		const displayOrder = parseInteger(formData.get('displayOrder') ?? formData.get('display-order'));
		const isActiveValue = formData.get('isActive') ?? formData.get('is-active');
		const isActive = isActiveValue === 'on' || isActiveValue === 'true' || isActiveValue === '1';

		if (!name) {
			return fail(400, { error: 'Nama metode pembayaran wajib diisi.' });
		}
		if (!allowedPaymentTypes.has(type as PaymentType)) {
			return fail(400, { error: 'Tipe metode pembayaran tidak valid.' });
		}

		await upsertDigitalPaymentMethod(db, {
			id: id || null,
			name,
			type: type as PaymentType,
			accountName,
			accountNumber,
			instructions,
			displayOrder,
			isActive
		});

		throw redirect(303, '/admin/super/cms-hub#payment-methods');
	},

	deletePaymentMethod: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureDigitalCommerceSchema(db);

		const formData = await request.formData();
		const id = readFirstValue(formData, 'id', 'payment-id');

		if (!id) {
			return fail(400, { error: 'Metode pembayaran tidak ditemukan.' });
		}

		await deleteDigitalPaymentMethod(db, id);
		throw redirect(303, '/admin/super/cms-hub#payment-methods');
	}
};
