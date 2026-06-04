import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureDigitalCommerceSchema,
	getPublishedDigitalProductBySlug
} from '$lib/server/domains/digital-store/commerce';
import { checkCoinBalance, deductCoins, rupiahToCoin } from '$lib/server/domains/buku/coin-operations';
import { ensureCoinWallet, getCoinBalance } from '$lib/server/domains/buku/wallet';

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
		isLoggedIn: !!locals.user
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

		if (!buyerName) {
			return fail(400, { error: 'Nama pembeli wajib diisi.' });
		}
		if (!buyerContact) {
			return fail(400, { error: 'Nomor WhatsApp atau kontak wajib diisi.' });
		}

		// Ensure coin wallet exists
		await ensureCoinWallet(locals.db, locals.user.id);

		// Convert price to coin (1:1 conversion)
		const coinRequired = rupiahToCoin(product.price);

		// Check coin balance
		const balanceCheck = await checkCoinBalance(locals.db, locals.user.id, coinRequired);
		if (!balanceCheck.hasEnough) {
			return fail(400, {
				type: 'insufficient_coin',
				error: 'Saldo coin tidak cukup.',
				currentBalance: balanceCheck.currentBalance,
				requiredAmount: balanceCheck.required,
				shortfall: balanceCheck.shortfall,
				productName: product.name
			});
		}

		const orderId = crypto.randomUUID();
		const referenceCode = `DS-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}`;
		const accessToken = crypto.randomUUID();
		const now = new Date().toISOString();

		try {
			// Deduct coins
			const deductResult = await deductCoins(
				locals.db,
				locals.user.id,
				coinRequired,
				`Pembelian ${product.name}`,
				'digital_product',
				orderId
			);

			if (!deductResult.success) {
				return fail(400, {
					type: 'deduct_failed',
					error: deductResult.error || 'Gagal memproses pembayaran coin.'
				});
			}

			// Create digital sale record
			await locals.db
				.prepare(
					`INSERT INTO digital_sales (
						id,
						product_id,
						buyer_user_id,
						buyer_name,
						buyer_contact,
						reference_code,
						access_token,
						price_paid,
						payment_method,
						status,
						created_at,
						updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'coin', 'completed', ?, ?)`
				)
				.bind(
					orderId,
					product.id,
					locals.user.id,
					buyerName,
					buyerContact,
					referenceCode,
					accessToken,
					product.price,
					now,
					now
				)
				.run();

			console.info('digital_store_order_success_coin', {
				order_id: orderId,
				product_id: product.id,
				product_name: product.name,
				coin_amount: coinRequired,
				new_balance: deductResult.newBalance
			});

			throw redirect(
				303,
				`/digital-store/order/${referenceCode}?token=${encodeURIComponent(accessToken)}`
			);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			console.error('digital_store_order_error', {
				order_id: orderId,
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