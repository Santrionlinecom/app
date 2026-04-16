import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
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

const allowedProductStatuses = new Set(['draft', 'published', 'archived']);
const allowedPaymentTypes = new Set(['bank', 'ewallet', 'qris', 'manual']);
const allowedSaleStatuses = new Set(['pending', 'paid', 'failed', 'refunded']);

const safeLogQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
	try {
		return await fn();
	} catch {
		return fallback;
	}
};

const normalizeText = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const normalizeSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

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
		const formData = await request.formData();

		const id = normalizeText(formData.get('product-id'));
		const title = normalizeText(formData.get('title'));
		const description = normalizeText(formData.get('description'));
		const price = Number(normalizeText(formData.get('price')));
		const fileUrl = normalizeText(formData.get('file-url'));
		const fileSize = Number(normalizeText(formData.get('file-size')));
		const coverUrl = normalizeText(formData.get('cover-url'));
		const status = normalizeText(formData.get('status'));
		const paymentMethods = normalizeText(formData.get('payment-methods')).split(',').filter(Boolean);

		if (!title || !price || price <= 0) {
			return fail(400, { error: 'Judul dan harga diperlukan.' });
		}

		if (!allowedProductStatuses.has(status)) {
			return fail(400, { error: 'Status produk tidak valid.' });
		}

		const slug = normalizeSlug(title);

		try {
			if (id) {
				await upsertDigitalProduct(db, {
					id,
					title,
					description,
					price,
					fileUrl,
					fileSize,
					coverUrl,
					status,
					paymentMethods,
					slug
				});
			} else {
				const newId = generateId(15);
				await upsertDigitalProduct(db, {
					id: newId,
					title,
					description,
					price,
					fileUrl,
					fileSize,
					coverUrl,
					status,
					paymentMethods,
					slug
				});
			}

			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Gagal menyimpan produk.' });
		}
	},

	deleteProduct: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();
		const id = normalizeText(formData.get('product-id'));

		if (!id) {
			return fail(400, { error: 'ID produk diperlukan.' });
		}

		try {
			await deleteDigitalProduct(db, id);
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Gagal menghapus produk.' });
		}
	},

	updateProductStatus: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();
		const id = normalizeText(formData.get('product-id'));
		const status = normalizeText(formData.get('status'));

		if (!id || !allowedProductStatuses.has(status)) {
			return fail(400, { error: 'Data tidak valid.' });
		}

		try {
			await updateDigitalProductStatus(db, id, status);
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Gagal mengubah status.' });
		}
	},

	savePaymentMethod: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();

		const id = normalizeText(formData.get('payment-id'));
		const type = normalizeText(formData.get('type'));
		const name = normalizeText(formData.get('name'));
		const details = normalizeText(formData.get('details'));

		if (!type || !name) {
			return fail(400, { error: 'Tipe dan nama metode pembayaran diperlukan.' });
		}

		if (!allowedPaymentTypes.has(type)) {
			return fail(400, { error: 'Tipe pembayaran tidak valid.' });
		}

		try {
			const result = await upsertDigitalPaymentMethod(db, {
				id: id || generateId(15),
				type,
				name,
				details
			});

			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Gagal menyimpan metode pembayaran.' });
		}
	},

	deletePaymentMethod: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();
		const id = normalizeText(formData.get('payment-id'));

		if (!id) {
			return fail(400, { error: 'ID metode pembayaran diperlukan.' });
		}

		try {
			await deleteDigitalPaymentMethod(db, id);
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Gagal menghapus metode pembayaran.' });
		}
	}
};
