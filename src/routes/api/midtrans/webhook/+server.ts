import { json, type RequestHandler } from '@sveltejs/kit';
import { generateId } from 'lucia';

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

const parseAddonOrderId = (orderId: string): { lembagaId: string; addonTipe: AddonTipe } | null => {
	if (!orderId.startsWith('addon-')) return null;

	const rest = orderId.slice('addon-'.length);
	for (const addonTipe of ADDON_TYPES) {
		const marker = `-${addonTipe}-`;
		const markerIndex = rest.lastIndexOf(marker);
		if (markerIndex <= 0) continue;

		const lembagaId = rest.slice(0, markerIndex);
		const timestamp = rest.slice(markerIndex + marker.length);
		if (!lembagaId || !/^\d+$/.test(timestamp)) continue;

		return { lembagaId, addonTipe };
	}

	return null;
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ ok: false, message: 'Layanan data tidak tersedia' }, { status: 503 });
	}

	const serverKey = platform?.env?.MIDTRANS_SERVER_KEY;
	if (!serverKey) {
		return json({ ok: false, message: 'Konfigurasi Midtrans belum tersedia' }, { status: 500 });
	}

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

	if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
		const parsedOrder = parseAddonOrderId(orderId);
		if (!parsedOrder) {
			return json({ ok: false, message: 'Order ID addon tidak valid' }, { status: 400 });
		}

		const now = Date.now();
		const berlakuHingga = Math.floor(now / 1000) + 2592000;

		await db.batch([
			db.prepare("UPDATE billing SET status = 'sukses' WHERE id = ?").bind(orderId),
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
				.bind(nanoid(), parsedOrder.lembagaId, parsedOrder.addonTipe, berlakuHingga, now)
		]);
	}

	return json({ ok: true }, { status: 200 });
};
