import { json, type RequestHandler } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { ensurePaymentOrdersSchema } from '$lib/server/payments/midtrans';

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
};

type PaymentOrderRow = {
	id: string;
	userId: string | null;
	lembagaId: string | null;
	productSlug: string;
	packageName: string | null;
	grossAmount: number;
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

export const POST: RequestHandler = async ({ locals, platform, request }) => {
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
	const transactionStatus = toPayloadString(body.transaction_status);

	if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
		return json({ ok: false, message: 'Payload tidak lengkap' }, { status: 400 });
	}

	const expectedSignature = await sha512Hex(`${orderId}${statusCode}${grossAmount}${serverKey}`);
	if (!timingSafeEqual(expectedSignature, signatureKey)) {
		return json({ ok: false, message: 'Signature tidak valid' }, { status: 403 });
	}

	const paymentOrder = await db
		.prepare(
			`SELECT
				id,
				user_id AS userId,
				lembaga_id AS lembagaId,
				product_slug AS productSlug,
				package_name AS packageName,
				gross_amount AS grossAmount
			 FROM payment_orders
			 WHERE id = ?
			   AND provider = 'midtrans'
			   AND purpose = 'addon'`
		)
		.bind(orderId)
		.first<PaymentOrderRow>();

	if (!paymentOrder || !paymentOrder.lembagaId || !isAddonTipe(paymentOrder.productSlug)) {
		return json({ ok: false, message: 'Order pembayaran addon tidak ditemukan' }, { status: 404 });
	}

	const webhookGrossAmount = Number(grossAmount);
	if (!Number.isFinite(webhookGrossAmount) || webhookGrossAmount !== Number(paymentOrder.grossAmount)) {
		return json({ ok: false, message: 'Nominal pembayaran tidak sesuai' }, { status: 400 });
	}

	console.info('midtrans_webhook_addon', {
		order_id: orderId,
		gross_amount: paymentOrder.grossAmount,
		product_slug: paymentOrder.productSlug
	});

	if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
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
	} else {
		await db
			.prepare('UPDATE payment_orders SET provider_status = ?, updated_at = ? WHERE id = ?')
			.bind(transactionStatus, Date.now(), orderId)
			.run();
	}

	return json({ ok: true }, { status: 200 });
};
