import type { D1Database } from '@cloudflare/workers-types';

// Notifikasi email untuk setiap mutasi koin: topup, pembelian produk digital,
// dan membuka bab buku. Riwayat sudah tersimpan di coin_transactions; berkas
// ini hanya memberi tahu pemiliknya lewat email.
//
// Aturan penting: kegagalan email TIDAK BOLEH membatalkan transaksi. Koin sudah
// terpotong dan produk sudah menjadi hak pembeli sebelum fungsi ini dipanggil.

type CoinEmailEnv = {
	PAYMENT_EMAIL_NOTIFICATIONS_ENABLED?: string;
	COIN_EMAIL_NOTIFICATIONS_ENABLED?: string;
	RESEND_API_KEY?: string;
	TRANSACTIONAL_EMAIL_FROM?: string;
	PAYMENT_EMAIL_FROM?: string;
	REGISTRATION_EMAIL_FROM?: string;
	PUBLIC_BASE_URL?: string;
};

export type CoinTransactionKind = 'topup' | 'purchase' | 'unlock_chapter' | 'refund' | 'adjustment';

type CoinEmailConfig = {
	apiKey: string;
	from: string;
	baseUrl: string;
};

type CoinTransactionEmailInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	userId: string | null;
	transactionId: string;
	jenis: CoinTransactionKind;
	koin: number;
	saldoAkhir: number;
	keterangan: string;
};

type UserEmailRow = { username: string | null; email: string };
type DeliveryState = { status: string; attempts: number; updatedAt: number };

export type CoinTransactionEmailResult =
	| { status: 'sent'; messageId: string }
	| { status: 'duplicate' }
	| { status: 'in_progress' }
	| { status: 'exhausted' }
	| { status: 'failed'; code: string }
	| {
			status: 'skipped';
			reason: 'disabled' | 'not_configured' | 'missing_user' | 'invalid_recipient';
	  };

export const coinTransactionEmailDeliveryId = (transactionId: string) => `email:coin:${transactionId}`;

// Flag koin menumpang flag pembayaran supaya tidak perlu variabel baru saat
// rilis, tetapi tetap bisa dimatikan sendiri lewat COIN_EMAIL_NOTIFICATIONS_ENABLED.
export const isCoinEmailEnabled = (env: object) => {
	const vars = env as CoinEmailEnv;
	const khusus = vars.COIN_EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase();
	if (khusus === 'false') return false;
	if (khusus === 'true') return true;
	return vars.PAYMENT_EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true';
};

export const getCoinEmailConfig = (env: object): CoinEmailConfig | null => {
	const vars = env as CoinEmailEnv;
	const apiKey = vars.RESEND_API_KEY?.trim();
	const from =
		vars.TRANSACTIONAL_EMAIL_FROM?.trim() ||
		vars.PAYMENT_EMAIL_FROM?.trim() ||
		vars.REGISTRATION_EMAIL_FROM?.trim();
	const baseUrl = vars.PUBLIC_BASE_URL?.trim() || 'https://app.santrionline.com';
	if (!apiKey || !from) return null;
	return { apiKey, from, baseUrl };
};

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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const formatKoin = (value: number) => new Intl.NumberFormat('id-ID').format(Math.abs(value));

const salinan = (jenis: CoinTransactionKind) => {
	if (jenis === 'topup' || jenis === 'refund') {
		return {
			subjek: 'Koin bertambah di SantriOnline',
			judul: jenis === 'refund' ? 'Koin dikembalikan' : 'Koin berhasil ditambahkan',
			arah: 'bertambah' as const
		};
	}
	if (jenis === 'unlock_chapter') {
		return { subjek: 'Bab berhasil dibuka', judul: 'Bab buku dibuka', arah: 'terpakai' as const };
	}
	if (jenis === 'adjustment') {
		return { subjek: 'Penyesuaian koin', judul: 'Penyesuaian saldo koin', arah: 'terpakai' as const };
	}
	return { subjek: 'Pembelian berhasil', judul: 'Pembelian berhasil', arah: 'terpakai' as const };
};

export const ensureCoinEmailSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS coin_transaction_email_deliveries (
				transaction_id TEXT PRIMARY KEY,
				status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
				provider_message_id TEXT,
				attempts INTEGER NOT NULL DEFAULT 0,
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
			`CREATE INDEX IF NOT EXISTS idx_coin_email_deliveries_status_updated
			 ON coin_transaction_email_deliveries(status, updated_at)`
		)
		.run();
};

// Dipanggil setelah transaksi commit. waitUntil menjaga tugas tetap hidup
// setelah respons dikirim; tanpa itu Worker bisa dimatikan lebih dulu.
export const queueCoinTransactionEmail = (
	input: CoinTransactionEmailInput,
	waitUntil?: (promise: Promise<unknown>) => void
) => {
	const task = notifyCoinTransactionEmail(input).catch(() => ({
		status: 'failed' as const,
		code: 'unexpected_error'
	}));
	if (waitUntil) waitUntil(task);
	else void task;
};

export const notifyCoinTransactionEmail = async ({
	db,
	fetchFn,
	env,
	userId,
	transactionId,
	jenis,
	koin,
	saldoAkhir,
	keterangan
}: CoinTransactionEmailInput): Promise<CoinTransactionEmailResult> => {
	if (!isCoinEmailEnabled(env)) return { status: 'skipped', reason: 'disabled' };
	const config = getCoinEmailConfig(env);
	if (!config) return { status: 'skipped', reason: 'not_configured' };
	if (!userId) return { status: 'skipped', reason: 'missing_user' };

	const user = await db
		.prepare('SELECT username, email FROM users WHERE id = ?')
		.bind(userId)
		.first<UserEmailRow>();
	if (!user) return { status: 'skipped', reason: 'missing_user' };
	const recipient = user.email?.trim().toLowerCase() ?? '';
	if (!isValidEmail(recipient)) return { status: 'skipped', reason: 'invalid_recipient' };

	await ensureCoinEmailSchema(db);

	const now = Date.now();
	const staleClaimBefore = now - 15 * 60 * 1000;
	await db
		.prepare(
			`INSERT OR IGNORE INTO coin_transaction_email_deliveries
				(transaction_id, status, attempts, created_at, updated_at)
			 VALUES (?, 'pending', 0, ?, ?)`
		)
		.bind(transactionId, now, now)
		.run();

	const claim = await db
		.prepare(
			`UPDATE coin_transaction_email_deliveries
			 SET status = 'sending', attempts = attempts + 1, updated_at = ?
			 WHERE transaction_id = ?
			   AND attempts < 3
			   AND (status IN ('pending','failed') OR (status = 'sending' AND updated_at < ?))`
		)
		.bind(now, transactionId, staleClaimBefore)
		.run();

	if (Number(claim.meta?.changes ?? 0) !== 1) {
		const current = await db
			.prepare(
				`SELECT status, attempts, updated_at AS updatedAt
				 FROM coin_transaction_email_deliveries WHERE transaction_id = ?`
			)
			.bind(transactionId)
			.first<DeliveryState>();
		if (!current) return { status: 'failed', code: 'claim_state_missing' };
		if (current.status === 'sent') return { status: 'duplicate' };
		const stale = current.status === 'sending' && current.updatedAt < staleClaimBefore;
		if (current.attempts >= 3 && (current.status !== 'sending' || stale)) {
			return { status: 'exhausted' };
		}
		return { status: 'in_progress' };
	}

	const teks = salinan(jenis);
	const nama = user.username?.trim() || recipient.split('@')[0] || 'Sahabat SantriOnline';
	const jumlah = formatKoin(koin);
	const sisa = formatKoin(saldoAkhir);
	const riwayatUrl = `${config.baseUrl.replace(/\/$/, '')}/coins`;

	const safeNama = escapeHtml(nama);
	const safeKeterangan = escapeHtml(keterangan.trim() || teks.judul);
	const safeRiwayat = escapeHtml(riwayatUrl);

	let providerMessageId = '';
	let errorCode = '';
	let errorMessage = '';
	try {
		const response = await fetchFn('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json',
				'Idempotency-Key': coinTransactionEmailDeliveryId(transactionId)
			},
			body: JSON.stringify({
				from: config.from,
				to: [recipient],
				subject: teks.subjek,
				text: `Assalamu'alaikum ${nama}, ${teks.judul}: ${keterangan.trim()}. Koin ${teks.arah}: ${jumlah}. Sisa saldo: ${sisa} koin. Riwayat lengkap: ${riwayatUrl}`,
				html: `<p>Assalamu'alaikum ${safeNama},</p><p><strong>${escapeHtml(teks.judul)}</strong></p><p>${safeKeterangan}</p><p>Koin ${teks.arah}: <strong>${jumlah}</strong><br/>Sisa saldo: <strong>${sisa}</strong> koin</p><p><a href="${safeRiwayat}">Lihat riwayat koin</a></p>`
			}),
			signal: AbortSignal.timeout(5_000)
		});
		const payload = (await response.json().catch(() => ({}))) as {
			id?: unknown;
			name?: unknown;
			message?: unknown;
		};
		if (response.ok && typeof payload.id === 'string' && payload.id.trim()) {
			providerMessageId = payload.id.trim();
		} else {
			const nama = typeof payload.name === 'string' ? payload.name.trim() : '';
			errorCode = nama ? `resend_${nama}` : `resend_http_${response.status}`;
			errorMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
		}
	} catch {
		errorCode = 'resend_request_failed';
	}

	const completedAt = Date.now();
	if (providerMessageId) {
		await db
			.prepare(
				`UPDATE coin_transaction_email_deliveries
				 SET status = 'sent', provider_message_id = ?, last_error_code = NULL,
					 updated_at = ?, sent_at = ?
				 WHERE transaction_id = ? AND status = 'sending'`
			)
			.bind(providerMessageId, completedAt, completedAt, transactionId)
			.run();
		return { status: 'sent', messageId: providerMessageId };
	}

	await db
		.prepare(
			`UPDATE coin_transaction_email_deliveries
			 SET status = 'failed', last_error_code = ?, last_error_message = ?, updated_at = ?
			 WHERE transaction_id = ? AND status = 'sending'`
		)
		.bind(errorCode, errorMessage.slice(0, 500) || null, completedAt, transactionId)
		.run();
	return { status: 'failed', code: errorCode };
};
