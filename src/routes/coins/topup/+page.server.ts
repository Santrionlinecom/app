import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureBukuWalletSchema } from '$lib/server/buku-wallet';
import { getCoinTopupPackageById, getCoinTopupPackages } from '$lib/server/coin-packages';
import {
	createMidtransAuthorization,
	createMidtransOrderId,
	ensurePaymentOrdersSchema,
	MIDTRANS_SNAP_TRANSACTION_URL
} from '$lib/server/payments/midtrans';

type MidtransSnapResponse = {
	token?: string;
	error_messages?: string[];
};

const INVALID_PACKAGE_MESSAGE =
	'Paket top up tidak valid. Silakan pilih paket yang tersedia.';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		user: locals.user,
		packages: getCoinTopupPackages(),
		midtransClientKey: platform?.env?.MIDTRANS_CLIENT_KEY ?? ''
	};
};

export const actions: Actions = {
	order: async ({ request, locals, platform, fetch }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data tidak tersedia' });
		}

		const serverKey = platform?.env?.MIDTRANS_SERVER_KEY;
		if (!serverKey) {
			return fail(500, { message: 'Konfigurasi Midtrans belum tersedia.' });
		}

		const formData = await request.formData();
		const packageId = formData.get('package_id');
		const userNote = formData.get('user_note');

		if (typeof packageId !== 'string') {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}
		const selectedPackage = getCoinTopupPackageById(packageId);
		if (!selectedPackage) {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}

		const rawNote = typeof userNote === 'string' ? userNote.trim() : '';
		if (rawNote.length > 500) {
			return fail(400, { message: 'Catatan pembayaran maksimal 500 karakter' });
		}
		const note = rawNote
			? `[MIDTRANS][PAKET: ${selectedPackage.name}] ${rawNote}`
			: `[MIDTRANS][PAKET: ${selectedPackage.name}]`;

		await ensureBukuWalletSchema(db);
		await ensurePaymentOrdersSchema(db);

		const orderId = createMidtransOrderId();
		const nowIso = new Date().toISOString();
		const nowMs = Date.now();
		const packageName = `Top Up Coin ${selectedPackage.name}`;
		const metadata = JSON.stringify({
			userId: locals.user.id,
			packageId: selectedPackage.id,
			packageName,
			coinAmount: selectedPackage.coinAmount,
			bonusCoin: selectedPackage.bonusCoin
		});

		try {
			await db.batch([
				db
					.prepare(
						`INSERT INTO payment_orders (
							id,
							provider,
							purpose,
							user_id,
							product_slug,
							package_name,
							gross_amount,
							currency,
							status,
							metadata,
							created_at,
							updated_at
						)
						VALUES (?, 'midtrans', 'coin_topup', ?, ?, ?, ?, 'IDR', 'pending', ?, ?, ?)`
					)
					.bind(
						orderId,
						locals.user.id,
						selectedPackage.id,
						packageName,
						selectedPackage.amountRupiah,
						metadata,
						nowMs,
						nowMs
					),
				db
					.prepare(
						`INSERT INTO coin_topup_requests
						(id, user_id, amount_rupiah, coin_amount, proof_url, user_note, status, created_at, updated_at)
						VALUES (?, ?, ?, ?, NULL, ?, 'pending', ?, ?)`
					)
					.bind(
						orderId,
						locals.user.id,
						selectedPackage.amountRupiah,
						selectedPackage.coinAmount,
						note,
						nowIso,
						nowIso
					)
			]);
		} catch (err) {
			console.error('Gagal membuat topup request:', err);
			return fail(500, { message: 'Gagal membuat permintaan top up' });
		}

		console.info('midtrans_snap_create_coin_topup', {
			order_id: orderId,
			gross_amount: selectedPackage.amountRupiah,
			product_slug: selectedPackage.id
		});

		const snapResponse = await fetch(MIDTRANS_SNAP_TRANSACTION_URL, {
			method: 'POST',
			headers: {
				Authorization: createMidtransAuthorization(serverKey),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				transaction_details: {
					order_id: orderId,
					gross_amount: selectedPackage.amountRupiah
				},
				customer_details: {
					first_name: locals.user.username ?? locals.user.email,
					email: locals.user.email
				},
				item_details: [
					{
						id: selectedPackage.id,
						price: selectedPackage.amountRupiah,
						quantity: 1,
						name: packageName
					}
				]
			})
		});

		const snapPayload = (await snapResponse.json().catch(() => ({}))) as MidtransSnapResponse;
		if (!snapResponse.ok || !snapPayload.token) {
			await db.batch([
				db.prepare("UPDATE payment_orders SET status = 'gagal', provider_status = ?, updated_at = ? WHERE id = ?").bind(
					String(snapResponse.status),
					Date.now(),
					orderId
				),
				db
					.prepare(
						"UPDATE coin_topup_requests SET status = 'rejected', admin_note = ?, updated_at = ? WHERE id = ?"
					)
					.bind('Midtrans Snap gagal membuat token pembayaran', new Date().toISOString(), orderId)
			]);

			console.warn('midtrans_snap_create_coin_topup_failed', {
				order_id: orderId,
				gross_amount: selectedPackage.amountRupiah,
				product_slug: selectedPackage.id,
				status: snapResponse.status
			});

			const midtransMessage = Array.isArray(snapPayload.error_messages)
				? snapPayload.error_messages.join(', ')
				: 'Midtrans Snap tidak mengembalikan token.';
			return fail(502, { message: midtransMessage });
		}

		await db
			.prepare('UPDATE payment_orders SET provider_token = ?, updated_at = ? WHERE id = ?')
			.bind(snapPayload.token, Date.now(), orderId)
			.run();

		return {
			type: 'snapToken',
			snapToken: snapPayload.token
		};
	}
};
