import type { D1Database } from '@cloudflare/workers-types';
import { ensurePaymentNotificationDeliveriesSchema } from './payment-success-notifier';

type PaymentEmailEnv = {
	PAYMENT_EMAIL_NOTIFICATIONS_ENABLED?: string;
	RESEND_API_KEY?: string;
	PAYMENT_EMAIL_FROM?: string;
	PUBLIC_BASE_URL?: string;
};

type PaymentSuccessEmailInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	orderId: string;
	userId: string | null;
	packageName: string | null;
	productSlug: string;
	grossAmount: number;
};

type PaymentEmailConfig = {
	apiKey: string;
	from: string;
	baseUrl: string;
};

type UserEmailRow = {
	username: string | null;
	email: string;
};

type DeliveryState = {
	status: 'pending' | 'sending' | 'sent' | 'failed';
	attempts: number;
	updatedAt: number;
};

export type PaymentSuccessEmailResult =
	| { status: 'sent'; messageId: string }
	| { status: 'duplicate' }
	| { status: 'in_progress' }
	| { status: 'exhausted' }
	| { status: 'failed'; code: string }
	| {
			status: 'skipped';
			reason: 'disabled' | 'not_configured' | 'missing_user' | 'invalid_recipient';
	  };

export const isPaymentEmailNotificationEnabled = (env: object) =>
	(env as PaymentEmailEnv).PAYMENT_EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true';

export const getPaymentEmailConfig = (env: object): PaymentEmailConfig | null => {
	const vars = env as PaymentEmailEnv;
	const apiKey = vars.RESEND_API_KEY?.trim();
	const from = vars.PAYMENT_EMAIL_FROM?.trim();
	const baseUrl = vars.PUBLIC_BASE_URL?.trim() || 'https://app.santrionline.com';
	if (!apiKey || !from) return null;
	return { apiKey, from, baseUrl };
};

export const paymentSuccessEmailDeliveryId = (orderId: string) =>
	`email:payment_success:${orderId}`;

const escapeHtml = (value: string) =>
	value.replace(/[&<>'"]/g, (char) => {
		const entities: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			"'": '&#39;',
			'"': '&quot;'
		};
		return entities[char] ?? char;
	});

const formatRupiah = (value: number) =>
	new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(value);

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const notifyPaymentSuccessEmail = async ({
	db,
	fetchFn,
	env,
	orderId,
	userId,
	packageName,
	productSlug,
	grossAmount
}: PaymentSuccessEmailInput): Promise<PaymentSuccessEmailResult> => {
	if (!isPaymentEmailNotificationEnabled(env)) {
		return { status: 'skipped', reason: 'disabled' };
	}
	const config = getPaymentEmailConfig(env);
	if (!config) return { status: 'skipped', reason: 'not_configured' };
	if (!userId) return { status: 'skipped', reason: 'missing_user' };

	const user = await db
		.prepare('SELECT username, email FROM users WHERE id = ?')
		.bind(userId)
		.first<UserEmailRow>();
	if (!user) return { status: 'skipped', reason: 'missing_user' };
	const recipient = user.email?.trim().toLowerCase();
	if (!recipient || !isValidEmail(recipient)) {
		return { status: 'skipped', reason: 'invalid_recipient' };
	}

	await ensurePaymentNotificationDeliveriesSchema(db);
	const deliveryId = paymentSuccessEmailDeliveryId(orderId);
	const now = Date.now();
	const staleClaimBefore = now - 15 * 60 * 1000;
	await db
		.prepare(
			`INSERT OR IGNORE INTO payment_notification_deliveries (
				id, order_id, channel, event_type, recipient_last4, status, attempts, created_at, updated_at
			) VALUES (?, ?, 'email', 'payment_success', NULL, 'pending', 0, ?, ?)`
		)
		.bind(deliveryId, orderId, now, now)
		.run();

	const claim = await db
		.prepare(
			`UPDATE payment_notification_deliveries
			 SET status = 'sending', attempts = attempts + 1, updated_at = ?
			 WHERE id = ?
			   AND attempts < 3
			   AND (status IN ('pending','failed') OR (status = 'sending' AND updated_at < ?))`
		)
		.bind(now, deliveryId, staleClaimBefore)
		.run();
	if (Number(claim.meta?.changes ?? 0) !== 1) {
		const current = await db
			.prepare(
				`SELECT status, attempts, updated_at AS updatedAt
				 FROM payment_notification_deliveries WHERE id = ?`
			)
			.bind(deliveryId)
			.first<DeliveryState>();
		if (!current) return { status: 'failed', code: 'claim_state_missing' };
		if (current.status === 'sent') return { status: 'duplicate' };
		const isStaleSending = current.status === 'sending' && current.updatedAt < staleClaimBefore;
		if (current.attempts >= 3 && (current.status !== 'sending' || isStaleSending)) {
			return { status: 'exhausted' };
		}
		return { status: 'in_progress' };
	}

	const customerName = user.username?.trim() || recipient.split('@')[0] || 'Sahabat SantriOnline';
	const productName = packageName?.trim() || productSlug;
	const amount = formatRupiah(grossAmount);
	const safeName = escapeHtml(customerName);
	const safeProduct = escapeHtml(productName);
	const safeAmount = escapeHtml(amount);
	const safeOrderId = escapeHtml(orderId);
	const safeDashboardUrl = escapeHtml(`${config.baseUrl.replace(/\/$/, '')}/coins`);

	let providerMessageId = '';
	let errorCode = '';
	try {
		const response = await fetchFn('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: config.from,
				to: [recipient],
				subject: `Pembayaran berhasil — ${productName}`,
				text: `Assalamu'alaikum ${customerName}, pembayaran ${productName} sebesar ${amount} telah berhasil. ID transaksi: ${orderId}. Lihat status di ${config.baseUrl.replace(/\/$/, '')}/coins`,
				html: `<p>Assalamu'alaikum ${safeName},</p><p>Pembayaran <strong>${safeProduct}</strong> sebesar <strong>${safeAmount}</strong> telah berhasil.</p><p>ID transaksi: <code>${safeOrderId}</code></p><p><a href="${safeDashboardUrl}">Lihat status di dashboard SantriOnline</a></p>`
			}),
			signal: AbortSignal.timeout(5_000)
		});
		const payload = (await response.json().catch(() => ({}))) as { id?: unknown };
		if (response.ok && typeof payload.id === 'string' && payload.id.trim()) {
			providerMessageId = payload.id.trim();
		} else {
			errorCode = `resend_http_${response.status}`;
		}
	} catch {
		errorCode = 'resend_request_failed';
	}

	const completedAt = Date.now();
	if (providerMessageId) {
		await db
			.prepare(
				`UPDATE payment_notification_deliveries
				 SET status = 'sent', provider_message_id = ?, last_error_code = NULL,
					 last_error_message = NULL, updated_at = ?, sent_at = ?
				 WHERE id = ? AND status = 'sending'`
			)
			.bind(providerMessageId, completedAt, completedAt, deliveryId)
			.run();
		return { status: 'sent', messageId: providerMessageId };
	}

	await db
		.prepare(
			`UPDATE payment_notification_deliveries
			 SET status = 'failed', last_error_code = ?, last_error_message = ?, updated_at = ?
			 WHERE id = ? AND status = 'sending'`
		)
		.bind(errorCode, 'Transactional email delivery failed', completedAt, deliveryId)
		.run();
	return { status: 'failed', code: errorCode };
};
