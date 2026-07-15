import type { D1Database } from '@cloudflare/workers-types';
import {
	normalizeWhatsAppRecipient,
	sendPaymentSuccessTemplate,
	type WhatsAppCloudConfig
} from './whatsapp-cloud';

type WhatsAppEnv = {
	WHATSAPP_ACCESS_TOKEN?: string;
	WHATSAPP_PHONE_NUMBER_ID?: string;
	WHATSAPP_GRAPH_API_VERSION?: string;
	WHATSAPP_PAYMENT_SUCCESS_TEMPLATE?: string;
	WHATSAPP_TEMPLATE_LANGUAGE?: string;
};

type PaymentSuccessNotificationInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	orderId: string;
	userId: string | null;
	packageName: string | null;
	productSlug: string;
	grossAmount: number;
};

type UserNotificationRow = {
	username: string | null;
	email: string;
	whatsapp: string | null;
};

type PaymentNotificationDeliveryState = {
	status: 'pending' | 'sending' | 'sent' | 'failed';
	attempts: number;
	updatedAt: number;
};

export type PaymentSuccessNotificationResult =
	| { status: 'sent'; messageId: string }
	| { status: 'duplicate' }
	| { status: 'in_progress' }
	| { status: 'exhausted' }
	| { status: 'failed'; code: string }
	| { status: 'skipped'; reason: 'not_configured' | 'missing_user' | 'invalid_recipient' };

export const isRetryablePaymentNotificationResult = (
	result: PaymentSuccessNotificationResult
) =>
	result.status === 'failed' ||
	result.status === 'in_progress' ||
	(result.status === 'skipped' && result.reason === 'not_configured');

export const getWhatsAppCloudConfig = (env: object): WhatsAppCloudConfig | null => {
	const vars = env as WhatsAppEnv;
	const accessToken = vars.WHATSAPP_ACCESS_TOKEN?.trim();
	const phoneNumberId = vars.WHATSAPP_PHONE_NUMBER_ID?.trim();
	const graphApiVersion = vars.WHATSAPP_GRAPH_API_VERSION?.trim();
	const templateName = vars.WHATSAPP_PAYMENT_SUCCESS_TEMPLATE?.trim();
	const languageCode = vars.WHATSAPP_TEMPLATE_LANGUAGE?.trim();

	if (!accessToken || !phoneNumberId || !graphApiVersion || !templateName || !languageCode) return null;
	return { accessToken, phoneNumberId, graphApiVersion, templateName, languageCode };
};

export const paymentSuccessDeliveryId = (orderId: string) =>
	`whatsapp:payment_success:${orderId}`;

export const ensurePaymentNotificationDeliveriesSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS payment_notification_deliveries (
				id TEXT PRIMARY KEY,
				order_id TEXT NOT NULL,
				channel TEXT NOT NULL,
				event_type TEXT NOT NULL,
				recipient_last4 TEXT,
				status TEXT NOT NULL DEFAULT 'pending'
					CHECK(status IN ('pending','sending','sent','failed')),
				attempts INTEGER NOT NULL DEFAULT 0,
				provider_message_id TEXT,
				last_error_code TEXT,
				last_error_message TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL,
				sent_at INTEGER
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_payment_notifications_order ON payment_notification_deliveries(order_id, channel, event_type)'
		)
		.run();
};

export const notifyPaymentSuccess = async ({
	db,
	fetchFn,
	env,
	orderId,
	userId,
	packageName,
	productSlug,
	grossAmount
}: PaymentSuccessNotificationInput): Promise<PaymentSuccessNotificationResult> => {
	const config = getWhatsAppCloudConfig(env);
	if (!config) return { status: 'skipped', reason: 'not_configured' };
	if (!userId) return { status: 'skipped', reason: 'missing_user' };

	const user = await db
		.prepare('SELECT username, email, whatsapp FROM users WHERE id = ?')
		.bind(userId)
		.first<UserNotificationRow>();
	if (!user) return { status: 'skipped', reason: 'missing_user' };

	const recipient = normalizeWhatsAppRecipient(user.whatsapp ?? '');
	if (!recipient) return { status: 'skipped', reason: 'invalid_recipient' };

	await ensurePaymentNotificationDeliveriesSchema(db);
	const deliveryId = paymentSuccessDeliveryId(orderId);
	const now = Date.now();
	const staleClaimBefore = now - 15 * 60 * 1000;
	await db
		.prepare(
			`INSERT OR IGNORE INTO payment_notification_deliveries (
				id, order_id, channel, event_type, recipient_last4, status, attempts, created_at, updated_at
			) VALUES (?, ?, 'whatsapp', 'payment_success', ?, 'pending', 0, ?, ?)`
		)
		.bind(deliveryId, orderId, recipient.slice(-4), now, now)
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
			.first<PaymentNotificationDeliveryState>();
		if (!current) return { status: 'failed', code: 'claim_state_missing' };
		if (current.status === 'sent') return { status: 'duplicate' };

		const isStaleSending = current.status === 'sending' && current.updatedAt < staleClaimBefore;
		if (current.attempts >= 3 && (current.status !== 'sending' || isStaleSending)) {
			if (isStaleSending) {
				await db
					.prepare(
						`UPDATE payment_notification_deliveries
						 SET status = 'failed', last_error_code = 'attempts_exhausted',
							 last_error_message = 'Delivery attempts exhausted', updated_at = ?
						 WHERE id = ? AND status = 'sending' AND attempts >= 3 AND updated_at < ?`
					)
					.bind(now, deliveryId, staleClaimBefore)
					.run();
			}
			return { status: 'exhausted' };
		}
		return { status: 'in_progress' };
	}

	const customerName = user.username?.trim() || user.email.split('@')[0] || 'Sahabat SantriOnline';
	const sendResult = await sendPaymentSuccessTemplate({
		fetchFn,
		config,
		recipient,
		customerName,
		packageName: packageName?.trim() || productSlug,
		amountRupiah: grossAmount,
		orderId
	});
	const completedAt = Date.now();

	if (sendResult.ok === true) {
		await db
			.prepare(
				`UPDATE payment_notification_deliveries
				 SET status = 'sent', provider_message_id = ?, last_error_code = NULL,
					 last_error_message = NULL, updated_at = ?, sent_at = ?
				 WHERE id = ? AND status = 'sending'`
			)
			.bind(sendResult.messageId, completedAt, completedAt, deliveryId)
			.run();
		return { status: 'sent', messageId: sendResult.messageId };
	}

	await db
		.prepare(
			`UPDATE payment_notification_deliveries
			 SET status = 'failed', last_error_code = ?, last_error_message = ?, updated_at = ?
			 WHERE id = ? AND status = 'sending'`
		)
		.bind(sendResult.code.slice(0, 100), sendResult.message.slice(0, 300), completedAt, deliveryId)
		.run();
	return { status: 'failed', code: sendResult.code };
};
