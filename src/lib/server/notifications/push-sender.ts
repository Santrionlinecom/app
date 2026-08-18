import type { D1Database } from '@cloudflare/workers-types';
import { base64UrlDecode, buildVapidAuthorization, encryptPushPayload } from './web-push-crypto';

// Pengirim Web Push. Menyimpan langganan, mengirim notifikasi, dan
// membersihkan langganan mati secara otomatis.

type PushEnv = {
	PUSH_NOTIFICATIONS_ENABLED?: string;
	VAPID_PUBLIC_KEY?: string;
	VAPID_PRIVATE_KEY?: string;
	VAPID_SUBJECT?: string;
};

type PushConfig = { publicKey: string; privateKey: string; subject: string };

export type PushSubscriptionInput = {
	endpoint: string;
	p256dh: string;
	auth: string;
	userAgent?: string | null;
};

export type PushMessage = {
	title: string;
	body: string;
	url?: string;
	tag?: string;
};

export type PushSendResult =
	| { status: 'sent'; endpoint: string }
	| { status: 'expired'; endpoint: string }
	| { status: 'failed'; endpoint: string; code: string };

export const isPushEnabled = (env: object) =>
	(env as PushEnv).PUSH_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true';

export const getPushConfig = (env: object): PushConfig | null => {
	const vars = env as PushEnv;
	const publicKey = vars.VAPID_PUBLIC_KEY?.trim();
	const privateKey = vars.VAPID_PRIVATE_KEY?.trim();
	const subject = vars.VAPID_SUBJECT?.trim() || 'mailto:admin@santrionline.com';
	if (!publicKey || !privateKey) return null;
	return { publicKey, privateKey, subject };
};

// Endpoint push service selalu https dan berasal dari vendor tepercaya.
// Validasi ini menahan penyimpanan URL sembarangan dari klien.
export const isValidPushEndpoint = (endpoint: string): boolean => {
	try {
		const url = new URL(endpoint);
		return url.protocol === 'https:';
	} catch {
		return false;
	}
};

// Kunci dari browser wajib berukuran tepat, kalau tidak enkripsi pasti gagal
// nanti saat pengiriman — lebih baik ditolak lebih awal.
export const isValidSubscriptionKeys = (p256dh: string, auth: string): boolean => {
	try {
		return base64UrlDecode(p256dh).length === 65 && base64UrlDecode(auth).length === 16;
	} catch {
		return false;
	}
};

export const ensurePushSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS push_subscriptions (
				endpoint TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				p256dh TEXT NOT NULL,
				auth TEXT NOT NULL,
				user_agent TEXT,
				failure_count INTEGER NOT NULL DEFAULT 0,
				last_error_code TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL,
				last_success_at INTEGER
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id)')
		.run();
};

export const savePushSubscription = async (
	db: D1Database,
	userId: string,
	input: PushSubscriptionInput
) => {
	await ensurePushSchema(db);
	const now = Date.now();
	// Endpoint yang sama bisa berpindah pemilik bila satu perangkat dipakai
	// bergantian, jadi user_id ikut diperbarui.
	await db
		.prepare(
			`INSERT INTO push_subscriptions
				(endpoint, user_id, p256dh, auth, user_agent, failure_count, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, 0, ?, ?)
			 ON CONFLICT(endpoint) DO UPDATE SET
				user_id = excluded.user_id,
				p256dh = excluded.p256dh,
				auth = excluded.auth,
				user_agent = excluded.user_agent,
				failure_count = 0,
				last_error_code = NULL,
				updated_at = excluded.updated_at`
		)
		.bind(input.endpoint, userId, input.p256dh, input.auth, input.userAgent ?? null, now, now)
		.run();
};

export const deletePushSubscription = async (db: D1Database, endpoint: string) => {
	await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
};

type KirimSatuInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	config: PushConfig;
	subscription: { endpoint: string; p256dh: string; auth: string };
	message: PushMessage;
	ttlSeconds?: number;
};

export const sendPushToSubscription = async ({
	db,
	fetchFn,
	config,
	subscription,
	message,
	ttlSeconds = 24 * 60 * 60
}: KirimSatuInput): Promise<PushSendResult> => {
	try {
		const terenkripsi = await encryptPushPayload({
			payload: JSON.stringify(message),
			p256dh: subscription.p256dh,
			auth: subscription.auth
		});
		const authorization = await buildVapidAuthorization({
			endpoint: subscription.endpoint,
			subject: config.subject,
			publicKey: config.publicKey,
			privateKey: config.privateKey
		});

		const response = await fetchFn(subscription.endpoint, {
			method: 'POST',
			headers: {
				...terenkripsi.headers,
				Authorization: authorization,
				TTL: String(ttlSeconds),
				Urgency: 'normal'
			},
			body: terenkripsi.body,
			signal: AbortSignal.timeout(10_000)
		});

		if (response.ok) {
			await db
				.prepare(
					`UPDATE push_subscriptions
					 SET failure_count = 0, last_error_code = NULL, last_success_at = ?, updated_at = ?
					 WHERE endpoint = ?`
				)
				.bind(Date.now(), Date.now(), subscription.endpoint)
				.run();
			return { status: 'sent', endpoint: subscription.endpoint };
		}

		// 404/410 = langganan sudah tidak berlaku. PWA dihapus atau izin dicabut.
		// Menyimpannya hanya membuang kuota pengiriman berikutnya.
		if (response.status === 404 || response.status === 410) {
			await deletePushSubscription(db, subscription.endpoint);
			return { status: 'expired', endpoint: subscription.endpoint };
		}

		const code = `push_http_${response.status}`;
		await db
			.prepare(
				`UPDATE push_subscriptions
				 SET failure_count = failure_count + 1, last_error_code = ?, updated_at = ?
				 WHERE endpoint = ?`
			)
			.bind(code, Date.now(), subscription.endpoint)
			.run();
		return { status: 'failed', endpoint: subscription.endpoint, code };
	} catch {
		const code = 'push_request_failed';
		await db
			.prepare(
				`UPDATE push_subscriptions
				 SET failure_count = failure_count + 1, last_error_code = ?, updated_at = ?
				 WHERE endpoint = ?`
			)
			.bind(code, Date.now(), subscription.endpoint)
			.run();
		return { status: 'failed', endpoint: subscription.endpoint, code };
	}
};

type KirimKeUserInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	userId: string;
	message: PushMessage;
};

export const sendPushToUser = async ({
	db,
	fetchFn,
	env,
	userId,
	message
}: KirimKeUserInput): Promise<PushSendResult[]> => {
	if (!isPushEnabled(env)) return [];
	const config = getPushConfig(env);
	if (!config) return [];

	await ensurePushSchema(db);
	const { results } = await db
		.prepare(
			`SELECT endpoint, p256dh, auth FROM push_subscriptions
			 WHERE user_id = ? AND failure_count < 5`
		)
		.bind(userId)
		.all<{ endpoint: string; p256dh: string; auth: string }>();

	const langganan = results ?? [];
	if (langganan.length === 0) return [];

	// Satu pengguna bisa punya banyak perangkat; kegagalan satu perangkat tidak
	// boleh menghentikan pengiriman ke perangkat lain.
	return Promise.all(
		langganan.map((subscription) =>
			sendPushToSubscription({ db, fetchFn, config, subscription, message })
		)
	);
};
