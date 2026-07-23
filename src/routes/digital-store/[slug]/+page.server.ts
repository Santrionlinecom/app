import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureDigitalCommerceSchema,
	getPublishedDigitalProductBySlug
} from '$lib/server/domains/digital-store/commerce';
import { rupiahToCoin } from '$lib/server/domains/buku/coin-operations';
import { getCoinBalance } from '$lib/server/domains/buku/wallet';
import { checkoutDigitalProductWithCoins } from '$lib/server/domains/digital-store/coin-checkout';

const normalizeText = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);

	const product = await getPublishedDigitalProductBySlug(locals.db, params.slug);
	if (!product) {
		throw error(404, 'Produk digital tidak ditemukan');
	}

	// Get user's coin balance if logged in
	let coinBalance = 0;
	if (locals.user) {
		coinBalance = await getCoinBalance(locals.db, locals.user.id);
	}

	return {
		product,
		coinBalance,
		isLoggedIn: !!locals.user,
		purchaseKey: `checkout:${crypto.randomUUID()}`
	};
};

export const actions: Actions = {
	createOrder: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, {
				type: 'auth_required',
				error: 'Silakan login terlebih dahulu untuk membeli produk.'
			});
		}

		if (!locals.db) {
			return fail(500, { error: 'Layanan data tidak tersedia.' });
		}

		await ensureDigitalCommerceSchema(locals.db);

		const product = await getPublishedDigitalProductBySlug(locals.db, params.slug);
		if (!product) {
			return fail(404, { error: 'Produk digital tidak ditemukan.' });
		}

		const formData = await request.formData();
		const buyerName = normalizeText(formData.get('buyerName'));
		const buyerContact = normalizeText(formData.get('buyerContact'));
		const purchaseKey = normalizeText(formData.get('purchaseKey'));

		if (!buyerName) {
			return fail(400, { error: 'Nama pembeli wajib diisi.' });
		}
		if (!buyerContact) {
			return fail(400, { error: 'Nomor WhatsApp atau kontak wajib diisi.' });
		}
		if (!purchaseKey) {
			return fail(400, { error: 'Sesi checkout tidak valid. Muat ulang halaman lalu coba lagi.' });
		}

		// Convert price to coin (1:1 conversion)
		const coinRequired = rupiahToCoin(product.price);

		try {
			const result = await checkoutDigitalProductWithCoins({
				db: locals.db,
				userId: locals.user.id,
				productId: product.id,
				productTitle: product.title,
				coinAmount: coinRequired,
				buyerName,
				buyerContact,
				purchaseKey
			});

			if (result.status === 'insufficient_coin') {
				return fail(400, {
					type: 'insufficient_coin',
					error: 'Saldo coin tidak cukup.',
					currentBalance: result.balance,
					requiredAmount: result.required,
					shortfall: Math.max(0, result.required - result.balance),
					productName: product.title
				});
			}

			console.info('digital_store_order_success_coin', {
				order_id: result.orderId,
				product_id: product.id,
				coin_amount: coinRequired,
				new_balance: result.balanceAfter,
				result: result.status
			});

			throw redirect(
				303,
				`/digital-store/order/${result.referenceCode}?token=${encodeURIComponent(result.accessToken)}`
			);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			console.error('digital_store_order_error', {
				product_id: product.id,
				error: err.message
			});
			return fail(500, {
				type: 'error',
				error: 'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.'
			});
		}
	}
};
