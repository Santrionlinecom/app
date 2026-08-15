import type { D1Database } from '@cloudflare/workers-types';
import { ensurePaymentNotificationDeliveriesSchema } from './payment-success-notifier';

type DigitalPurchaseEmailEnv = {
	DIGITAL_PURCHASE_EMAIL_NOTIFICATIONS_ENABLED?: string;
	RESEND_API_KEY?: string;
	TRANSACTIONAL_EMAIL_FROM?: string;
	PAYMENT_EMAIL_FROM?: string;
	REGISTRATION_EMAIL_FROM?: string;
	PUBLIC_BASE_URL?: string;
};

type DigitalPurchaseEmailInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	orderId: string;
	userId: string;
	productTitle: string;
	referenceCode: string;
	coinAmount: number;
	licensePackage: string | null;
};

type DeliveryState = { status: 'pending' | 'sending' | 'sent' | 'failed'; attempts: number; updatedAt: number };

export type DigitalPurchaseEmailResult =
	| { status: 'sent'; messageId: string }
	| { status: 'duplicate' | 'in_progress' | 'exhausted' }
	| { status: 'failed'; code: string }
	| { status: 'skipped'; reason: 'disabled' | 'not_configured' | 'missing_user' | 'invalid_recipient' };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character] ?? character));
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const getDigitalPurchaseEmailConfig = (env: object) => {
	const vars = env as DigitalPurchaseEmailEnv;
	const apiKey = vars.RESEND_API_KEY?.trim();
	const from = vars.TRANSACTIONAL_EMAIL_FROM?.trim() || vars.PAYMENT_EMAIL_FROM?.trim() || vars.REGISTRATION_EMAIL_FROM?.trim();
	const baseUrl = vars.PUBLIC_BASE_URL?.trim() || 'https://app.santrionline.com';
	if (!apiKey || !from) return null;
	return { apiKey, from, baseUrl };
};

export const digitalPurchaseEmailDeliveryId = (orderId: string) => `email:digital_purchase:${orderId}`;

export const notifyDigitalPurchaseEmail = async (input: DigitalPurchaseEmailInput): Promise<DigitalPurchaseEmailResult> => {
	const enabled = (input.env as DigitalPurchaseEmailEnv).DIGITAL_PURCHASE_EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true';
	if (!enabled) return { status: 'skipped', reason: 'disabled' };
	const config = getDigitalPurchaseEmailConfig(input.env);
	if (!config) return { status: 'skipped', reason: 'not_configured' };

	const user = await input.db.prepare('SELECT username, email FROM users WHERE id = ?').bind(input.userId).first<{ username: string | null; email: string }>();
	if (!user) return { status: 'skipped', reason: 'missing_user' };
	const recipient = user.email?.trim().toLowerCase();
	if (!recipient || !isValidEmail(recipient)) return { status: 'skipped', reason: 'invalid_recipient' };

	await ensurePaymentNotificationDeliveriesSchema(input.db);
	const deliveryId = digitalPurchaseEmailDeliveryId(input.orderId);
	const now = Date.now();
	const staleBefore = now - 15 * 60 * 1000;
	await input.db.prepare(`INSERT OR IGNORE INTO payment_notification_deliveries
		(id, order_id, channel, event_type, recipient_last4, status, attempts, created_at, updated_at)
		VALUES (?, ?, 'email', 'digital_purchase', NULL, 'pending', 0, ?, ?)`).bind(deliveryId, input.orderId, now, now).run();
	const claim = await input.db.prepare(`UPDATE payment_notification_deliveries SET status = 'sending', attempts = attempts + 1, updated_at = ?
		WHERE id = ? AND attempts < 3 AND (status IN ('pending','failed') OR (status = 'sending' AND updated_at < ?))`).bind(now, deliveryId, staleBefore).run();
	if (Number(claim.meta?.changes ?? 0) !== 1) {
		const current = await input.db.prepare('SELECT status, attempts, updated_at AS updatedAt FROM payment_notification_deliveries WHERE id = ?').bind(deliveryId).first<DeliveryState>();
		if (!current) return { status: 'failed', code: 'claim_state_missing' };
		if (current.status === 'sent') return { status: 'duplicate' };
		if (current.attempts >= 3 && (current.status !== 'sending' || current.updatedAt < staleBefore)) return { status: 'exhausted' };
		return { status: 'in_progress' };
	}

	const buyerName = user.username?.trim() || recipient.split('@')[0] || 'Sahabat SantriOnline';
	const orderUrl = `${config.baseUrl.replace(/\/$/, '')}/digital-store/order/${encodeURIComponent(input.referenceCode)}`;
	const supportNote = input.licensePackage === 'bantuan' ? ' Tim Bantuan akan menghubungi Anda untuk proses onboarding.' : '';
	const text = `Assalamu'alaikum ${buyerName}, pesanan ${input.productTitle} berhasil. Referensi: ${input.referenceCode}. Jumlah: ${input.coinAmount} Coin. Status: paid. Buka halaman pesanan aman: ${orderUrl}. Lisensi dan unduhan tersedia di halaman pesanan setelah login.${supportNote}`;
	const html = `<p>Assalamu'alaikum ${escapeHtml(buyerName)},</p><p>Pesanan <strong>${escapeHtml(input.productTitle)}</strong> berhasil.</p><ul><li>Referensi: <code>${escapeHtml(input.referenceCode)}</code></li><li>Jumlah: ${escapeHtml(String(input.coinAmount))} Coin</li><li>Status: paid</li></ul><p><a href="${escapeHtml(orderUrl)}">Buka halaman pesanan aman</a></p><p>Lisensi dan unduhan tersedia di halaman pesanan setelah login.</p>${input.licensePackage === 'bantuan' ? '<p>Tim Bantuan akan menghubungi Anda untuk proses onboarding.</p>' : ''}`;

	let messageId = '';
	let errorCode = '';
	try {
		const response = await input.fetchFn('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': deliveryId },
			body: JSON.stringify({ from: config.from, to: [recipient], subject: `Pesanan berhasil — ${input.productTitle}`, text, html }),
			signal: AbortSignal.timeout(5_000)
		});
		const payload = await response.json().catch(() => ({})) as { id?: unknown };
		if (response.ok && typeof payload.id === 'string' && payload.id.trim()) messageId = payload.id.trim();
		else errorCode = `resend_http_${response.status}`;
	} catch {
		errorCode = 'resend_request_failed';
	}
	const completedAt = Date.now();
	if (messageId) {
		await input.db.prepare(`UPDATE payment_notification_deliveries SET status = 'sent', provider_message_id = ?, last_error_code = NULL, last_error_message = NULL, updated_at = ?, sent_at = ? WHERE id = ? AND status = 'sending'`).bind(messageId, completedAt, completedAt, deliveryId).run();
		return { status: 'sent', messageId };
	}
	await input.db.prepare(`UPDATE payment_notification_deliveries SET status = 'failed', last_error_code = ?, last_error_message = ?, updated_at = ? WHERE id = ? AND status = 'sending'`).bind(errorCode, 'Transactional email delivery failed', completedAt, deliveryId).run();
	return { status: 'failed', code: errorCode };
};

export const queueDigitalPurchaseEmail = (input: DigitalPurchaseEmailInput, waitUntil?: (promise: Promise<unknown>) => void) => {
	const task = notifyDigitalPurchaseEmail(input).catch(() => ({ status: 'failed' as const, code: 'unexpected_error' }));
	if (waitUntil) waitUntil(task);
	else void task;
};
