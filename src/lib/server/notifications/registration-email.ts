import type { D1Database } from '@cloudflare/workers-types';

type RegistrationEmailEnv = {
	REGISTRATION_EMAIL_NOTIFICATIONS_ENABLED?: string;
	RESEND_API_KEY?: string;
	REGISTRATION_EMAIL_FROM?: string;
	PAYMENT_EMAIL_FROM?: string;
	PUBLIC_BASE_URL?: string;
};

type RegistrationEmailConfig = {
	apiKey: string;
	from: string;
	baseUrl: string;
};

type RegistrationEmailInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	userId: string;
	name: string;
	email: string;
	role: string;
	organizationName?: string | null;
};

type DeliveryState = {
	status: 'pending' | 'sending' | 'sent' | 'failed';
	attempts: number;
	updatedAt: number;
};

export type RegistrationEmailResult =
	| { status: 'sent'; messageId: string }
	| { status: 'duplicate' }
	| { status: 'in_progress' }
	| { status: 'exhausted' }
	| { status: 'failed'; code: string }
	| { status: 'skipped'; reason: 'disabled' | 'not_configured' | 'invalid_recipient' };

export const registrationEmailDeliveryId = (userId: string) => `email:registration:${userId}`;

export const isRegistrationEmailEnabled = (env: object) =>
	(env as RegistrationEmailEnv).REGISTRATION_EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true';

export const getRegistrationEmailConfig = (env: object): RegistrationEmailConfig | null => {
	const vars = env as RegistrationEmailEnv;
	const apiKey = vars.RESEND_API_KEY?.trim();
	const from = vars.REGISTRATION_EMAIL_FROM?.trim() || vars.PAYMENT_EMAIL_FROM?.trim();
	const baseUrl = vars.PUBLIC_BASE_URL?.trim() || 'https://app.santrionline.com';
	if (!apiKey || !from) return null;
	return { apiKey, from, baseUrl };
};

export const ensureRegistrationEmailSchema = async (db: D1Database) => {
	await db.prepare(
		`CREATE TABLE IF NOT EXISTS registration_email_deliveries (
			user_id TEXT PRIMARY KEY,
			status TEXT NOT NULL DEFAULT 'pending',
			attempts INTEGER NOT NULL DEFAULT 0,
			provider_message_id TEXT,
			last_error_code TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			sent_at INTEGER
		)`
	).run();
};

const escapeHtml = (value: string) =>
	value.replace(/[&<>'"]/g, (char) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;'
	})[char] ?? char);

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const queueRegistrationEmail = (
	input: RegistrationEmailInput,
	waitUntil?: (promise: Promise<unknown>) => void
) => {
	const task = notifyRegistrationEmail(input).catch(() => ({ status: 'failed' as const, code: 'unexpected_error' }));
	if (waitUntil) waitUntil(task);
	else void task;
};

export const notifyRegistrationEmail = async ({
	db,
	fetchFn,
	env,
	userId,
	name,
	email,
	role,
	organizationName
}: RegistrationEmailInput): Promise<RegistrationEmailResult> => {
	if (!isRegistrationEmailEnabled(env)) return { status: 'skipped', reason: 'disabled' };
	const config = getRegistrationEmailConfig(env);
	if (!config) return { status: 'skipped', reason: 'not_configured' };
	const recipient = email.trim().toLowerCase();
	if (!isValidEmail(recipient)) return { status: 'skipped', reason: 'invalid_recipient' };

	await ensureRegistrationEmailSchema(db);
	const now = Date.now();
	const staleClaimBefore = now - 15 * 60 * 1000;
	await db.prepare(
		`INSERT OR IGNORE INTO registration_email_deliveries
			(user_id, status, attempts, created_at, updated_at)
		 VALUES (?, 'pending', 0, ?, ?)`
	).bind(userId, now, now).run();

	const claim = await db.prepare(
		`UPDATE registration_email_deliveries
		 SET status = 'sending', attempts = attempts + 1, updated_at = ?
		 WHERE user_id = ?
		   AND attempts < 3
		   AND (status IN ('pending', 'failed') OR (status = 'sending' AND updated_at < ?))`
	).bind(now, userId, staleClaimBefore).run();

	if (Number(claim.meta?.changes ?? 0) !== 1) {
		const current = await db.prepare(
			`SELECT status, attempts, updated_at AS updatedAt
			 FROM registration_email_deliveries WHERE user_id = ?`
		).bind(userId).first<DeliveryState>();
		if (!current) return { status: 'failed', code: 'claim_state_missing' };
		if (current.status === 'sent') return { status: 'duplicate' };
		const stale = current.status === 'sending' && current.updatedAt < staleClaimBefore;
		if (current.attempts >= 3 && (current.status !== 'sending' || stale)) return { status: 'exhausted' };
		return { status: 'in_progress' };
	}

	const safeName = escapeHtml(name.trim() || 'Sahabat SantriOnline');
	const safeRole = escapeHtml(role.trim() || 'member');
	const safeOrganization = organizationName?.trim() ? escapeHtml(organizationName.trim()) : '';
	const dashboardUrl = `${config.baseUrl.replace(/\/$/, '')}/dashboard`;
	const safeDashboardUrl = escapeHtml(dashboardUrl);
	const organizationText = organizationName?.trim() ? ` di ${organizationName.trim()}` : '';
	const organizationHtml = safeOrganization ? ` di <strong>${safeOrganization}</strong>` : '';
	const deliveryId = registrationEmailDeliveryId(userId);

	let providerMessageId = '';
	let errorCode = '';
	try {
		const response = await fetchFn('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json',
				'Idempotency-Key': deliveryId
			},
			body: JSON.stringify({
				from: config.from,
				to: [recipient],
				subject: 'Selamat datang di SantriOnline',
				text: `Assalamu'alaikum ${name.trim() || 'Sahabat SantriOnline'}, akun ${role}${organizationText} berhasil dibuat. Buka dashboard: ${dashboardUrl}`,
				html: `<p>Assalamu'alaikum ${safeName},</p><p>Akun Anda sebagai <strong>${safeRole}</strong>${organizationHtml} berhasil dibuat.</p><p><a href="${safeDashboardUrl}">Buka dashboard SantriOnline</a></p>`
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
		await db.prepare(
			`UPDATE registration_email_deliveries
			 SET status = 'sent', provider_message_id = ?, last_error_code = NULL,
				 updated_at = ?, sent_at = ?
			 WHERE user_id = ? AND status = 'sending'`
		).bind(providerMessageId, completedAt, completedAt, userId).run();
		return { status: 'sent', messageId: providerMessageId };
	}

	await db.prepare(
		`UPDATE registration_email_deliveries
		 SET status = 'failed', last_error_code = ?, updated_at = ?
		 WHERE user_id = ? AND status = 'sending'`
	).bind(errorCode, completedAt, userId).run();
	return { status: 'failed', code: errorCode };
};
