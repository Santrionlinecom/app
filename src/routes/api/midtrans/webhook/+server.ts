import { json, type RequestHandler } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { ensureBukuWalletSchema } from '$lib/server/domains/buku/wallet';
import { dispatchPaymentSuccessNotificationsBestEffort } from '$lib/server/notifications/payment-success-notifications';
import { ensurePaymentOrdersSchema } from '$lib/server/services/payment-gateway/payments/midtrans';
import { fulfillPendingCoinTopup } from '$lib/server/services/payment-gateway/payments/coin-topup-fulfillment';
import { fetchMidtransTransactionStatus } from '$lib/server/services/payment-gateway/payments/midtrans-status-api';
import {
	isSuccessfulMidtransTransaction,
	mapMidtransPaymentStatus
} from '$lib/server/services/payment-gateway/payments/midtrans-status';

const ADDON_TYPES = [
	'lembaga_tambahan',
	'modul_masjid',
	'modul_tahfidz',
	'modul_musholla',
	'santri_unlimited',
	'raport_premium'
] as const;

type AddonTipe = (typeof ADDON_TYPES)[number];

type MidtransWebhookPayload = {
	order_id?: unknown;
	status_code?: unknown;
	gross_amount?: unknown;
	signature_key?: unknown;
	transaction_status?: unknown;
	fraud_status?: unknown;
};

type PaymentOrderRow = {
	id: string;
	purpose: string;
	userId: string | null;
	lembagaId: string | null;
	productSlug: string;
	packageName: string | null;
	grossAmount: number;
	metadata: string | null;
	status: string;
};

type CoinTopupRequestRow = {
	id: string;
	userId: string;
	amountRupiah: number;
	coinAmount: number;
	status: string;
};

const nanoid = () => generateId(15);

const toPayloadString = (value: unknown) => {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return '';
};

const sha512Hex = async (value: string) => {
	const data = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-512', data);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
};

const timingSafeEqual = (left: string, right: string) => {
	if (left.length !== right.length) return false;

	let diff = 0;
	for (let index = 0; index < left.length; index += 1) {
		diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}
	return diff === 0;
};

const isAddonTipe = (value: string): value is AddonTipe =>
	(ADDON_TYPES as readonly string[]).includes(value);

const settleCoinTopup = async ({
	db,
	orderId,
	transactionStatus,
	fraudStatus
}: {
	db: App.Locals['db'];
	orderId: string;
	transactionStatus: string;
	fraudStatus: string;
}) => {
	if (!db) return false;

	await ensureBukuWalletSchema(db);

	const topup = await db
		.prepare(
			`SELECT
				id,
				user_id AS userId,
				amount_rupiah AS amountRupiah,
				coin_amount AS coinAmount,
				status
			 FROM coin_topup_requests
			 WHERE id = ?`
		)
		.bind(orderId)
		.first<CoinTopupRequestRow>();

	if (!topup) {
		throw new Error('Coin topup request tidak ditemukan');
	}

	const nowIso = new Date().toISOString();
	const nowMs = Date.now();

	if (isSuccessfulMidtransTransaction(transactionStatus, fraudStatus)) {
		if (topup.status === 'approved') {
			await db
				.prepare("UPDATE payment_orders SET status = 'sukses', provider_status = ?, updated_at = ? WHERE id = ?")
				.bind(transactionStatus, nowMs, orderId)
				.run();
			return true;
		}

		if (topup.status !== 'pending') {
			await db
				.prepare('UPDATE payment_orders SET provider_status = ?, updated_at = ? WHERE id = ?')
				.bind(transactionStatus, nowMs, orderId)
				.run();
			return false;
		}

		const coinAmount = Number(topup.coinAmount ?? 0);
		return fulfillPendingCoinTopup({
			db,
			orderId,
			userId: topup.userId,
			coinAmount,
			transactionStatus,
			nowIso,
			nowMs
		});
	}

	const paymentStatus = mapMidtransPaymentStatus(transactionStatus, fraudStatus);
	const shouldRejectTopup = ['gagal', 'expired', 'canceled', 'denied'].includes(paymentStatus);
	await db.batch([
		db
			.prepare('UPDATE payment_orders SET status = ?, provider_status = ?, updated_at = ? WHERE id = ?')
			.bind(paymentStatus, transactionStatus, nowMs, orderId),
		...(shouldRejectTopup
			? [
					db
						.prepare(
							`UPDATE coin_topup_requests
							SET status = 'rejected', admin_note = ?, updated_at = ?
							WHERE id = ? AND status = 'pending'`
						)
						.bind(`Midtrans ${transactionStatus}`, nowIso, orderId)
				]
			: [])
	]);
	return false;
};

export const POST: RequestHandler = async ({ fetch, locals, platform, request }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ ok: false, message: 'Layanan data tidak tersedia' }, { status: 503 });
	}

	const serverKey = platform?.env?.MIDTRANS_SERVER_KEY;
	if (!serverKey) {
		return json({ ok: false, message: 'Konfigurasi Midtrans belum tersedia' }, { status: 500 });
	}

	await ensurePaymentOrdersSchema(db);

	let body: MidtransWebhookPayload;
	try {
		body = (await request.json()) as MidtransWebhookPayload;
	} catch {
		return json({ ok: false, message: 'Payload tidak valid' }, { status: 400 });
	}

	const orderId = toPayloadString(body.order_id);
	const statusCode = toPayloadString(body.status_code);
	const grossAmount = toPayloadString(body.gross_amount);
	const signatureKey = toPayloadString(body.signature_key).toLowerCase();
	const payloadTransactionStatus = toPayloadString(body.transaction_status);

	if (!orderId || !statusCode || !grossAmount || !signatureKey || !payloadTransactionStatus) {
		return json({ ok: false, message: 'Payload tidak lengkap' }, { status: 400 });
	}

	const expectedSignature = await sha512Hex(`${orderId}${statusCode}${grossAmount}${serverKey}`);
	if (!timingSafeEqual(expectedSignature, signatureKey)) {
		return json({ ok: false, message: 'Signature tidak valid' }, { status: 403 });
	}

	const verifiedStatus = await fetchMidtransTransactionStatus({
		fetchFn: fetch,
		serverKey,
		isProduction: platform?.env?.MIDTRANS_IS_PRODUCTION === 'true',
		orderId
	});
	if (!verifiedStatus.ok) {
		console.error('midtrans_status_verification_failed', {
			order_id: orderId,
			code: verifiedStatus.code
		});
		return json({ ok: false, message: 'Status pembayaran belum dapat diverifikasi' }, { status: 502 });
	}
	if (verifiedStatus.orderId !== orderId) {
		return json({ ok: false, message: 'Identitas pembayaran tidak sesuai' }, { status: 409 });
	}
	const transactionStatus = verifiedStatus.transactionStatus;
	const fraudStatus = verifiedStatus.fraudStatus;

	const paymentOrder = await db
		.prepare(
			`SELECT
				id,
				purpose,
				user_id AS userId,
				lembaga_id AS lembagaId,
				product_slug AS productSlug,
				package_name AS packageName,
				gross_amount AS grossAmount,
				metadata,
				status
			 FROM payment_orders
			 WHERE id = ?
			   AND provider = 'midtrans'`
		)
		.bind(orderId)
		.first<PaymentOrderRow>();

	if (!paymentOrder) {
		return json({ ok: false, message: 'Order pembayaran tidak ditemukan' }, { status: 404 });
	}

	const webhookGrossAmount = Number(verifiedStatus.grossAmount);
	if (!Number.isFinite(webhookGrossAmount) || webhookGrossAmount !== Number(paymentOrder.grossAmount)) {
		return json({ ok: false, message: 'Nominal pembayaran tidak sesuai' }, { status: 400 });
	}

	console.info('midtrans_webhook_payment', {
		order_id: orderId,
		gross_amount: paymentOrder.grossAmount,
		product_slug: paymentOrder.productSlug
	});

	const sendSuccessNotifications = async () => {
		const input = {
			db,
			fetchFn: fetch,
			env: platform?.env ?? {},
			orderId,
			userId: paymentOrder.userId,
			packageName: paymentOrder.packageName,
			productSlug: paymentOrder.productSlug,
			grossAmount: paymentOrder.grossAmount
		};
		const outcomes = await dispatchPaymentSuccessNotificationsBestEffort(input);
		for (const { channel, result } of outcomes) {
			console.info('payment_success_notification', {
				order_id: orderId,
				channel,
				status: result.status,
				...(result.status === 'skipped' ? { reason: result.reason } : {}),
				...(result.status === 'failed' ? { code: result.code } : {})
			});
		}
	};

	if (
		paymentOrder.status === 'sukses' &&
		isSuccessfulMidtransTransaction(transactionStatus, fraudStatus)
	) {
		await sendSuccessNotifications();
		return json({ ok: true }, { status: 200 });
	}

	if (paymentOrder.purpose === 'coin_topup') {
		try {
			const paymentSucceeded = await settleCoinTopup({ db, orderId, transactionStatus, fraudStatus });
			if (paymentSucceeded) {
				await sendSuccessNotifications();
			}
			return json({ ok: true }, { status: 200 });
		} catch (err) {
			console.error('midtrans_webhook_coin_topup_failed', {
				order_id: orderId,
				gross_amount: paymentOrder.grossAmount,
				product_slug: paymentOrder.productSlug,
				message: err instanceof Error ? err.message : 'unknown'
			});
			return json({ ok: false, message: 'Gagal memproses topup coin' }, { status: 500 });
		}
	}

	if (paymentOrder.purpose !== 'addon' || !paymentOrder.lembagaId || !isAddonTipe(paymentOrder.productSlug)) {
		return json({ ok: false, message: 'Order pembayaran addon tidak valid' }, { status: 400 });
	}

	if (isSuccessfulMidtransTransaction(transactionStatus, fraudStatus)) {
		const now = Date.now();
		const berlakuHingga = Math.floor(now / 1000) + 2592000;

		await db.batch([
			db.prepare("UPDATE billing SET status = 'sukses' WHERE id = ?").bind(orderId),
			db
				.prepare(
					"UPDATE payment_orders SET status = 'sukses', provider_status = ?, updated_at = ? WHERE id = ?"
				)
				.bind(transactionStatus, now, orderId),
			db
				.prepare(
					`INSERT INTO addon_lembaga (
						id,
						lembaga_id,
						tipe_addon,
						status,
						berlaku_hingga,
						created_at
					)
					VALUES (?, ?, ?, 'aktif', ?, ?)
					ON CONFLICT(lembaga_id, tipe_addon) DO UPDATE SET
						status = 'aktif',
						berlaku_hingga = excluded.berlaku_hingga,
						created_at = excluded.created_at`
				)
				.bind(nanoid(), paymentOrder.lembagaId, paymentOrder.productSlug, berlakuHingga, now)
		]);
		await sendSuccessNotifications();
	} else {
		await db
			.prepare('UPDATE payment_orders SET status = ?, provider_status = ?, updated_at = ? WHERE id = ?')
			.bind(mapMidtransPaymentStatus(transactionStatus, fraudStatus), transactionStatus, Date.now(), orderId)
			.run();
	}

	return json({ ok: true }, { status: 200 });
};
