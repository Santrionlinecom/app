import type { D1Database } from '@cloudflare/workers-types';

type FulfillPendingCoinTopupInput = {
	db: D1Database;
	orderId: string;
	userId: string;
	coinAmount: number;
	transactionStatus: string;
	nowIso: string;
	nowMs: number;
};

export const fulfillPendingCoinTopup = async ({
	db,
	orderId,
	userId,
	coinAmount,
	transactionStatus,
	nowIso,
	nowMs
}: FulfillPendingCoinTopupInput) => {
	if (!Number.isSafeInteger(coinAmount) || coinAmount <= 0) {
		throw new Error('Jumlah coin topup tidak valid');
	}

	await db.prepare('INSERT OR IGNORE INTO coin_wallets (user_id) VALUES (?)').bind(userId).run();
	const transactionId = `coin-topup:${orderId}`;
	const settlement = await db.batch([
		db
			.prepare(
				`UPDATE coin_wallets
				 SET balance = balance + ?, updated_at = ?
				 WHERE user_id = ?
				   AND EXISTS (
					 SELECT 1 FROM coin_topup_requests
					 WHERE id = ? AND status = 'pending'
				   )`
			)
			.bind(coinAmount, nowIso, userId, orderId),
		db
			.prepare(
				`INSERT INTO coin_transactions
				(id, user_id, type, amount, balance_after, description, reference_type, reference_id, created_at)
				SELECT ?, ?, 'topup', ?, balance, 'Topup koin via Midtrans', 'coin_topup_requests', ?, ?
				FROM coin_wallets
				WHERE user_id = ?
				  AND EXISTS (
					SELECT 1 FROM coin_topup_requests
					WHERE id = ? AND status = 'pending'
				  )`
			)
			.bind(transactionId, userId, coinAmount, orderId, nowIso, userId, orderId),
		db
			.prepare(
				`UPDATE coin_topup_requests
				 SET status = 'approved', admin_note = ?, reviewed_at = ?, updated_at = ?
				 WHERE id = ? AND status = 'pending'`
			)
			.bind('Paid via Midtrans', nowIso, nowIso, orderId),
		db
			.prepare("UPDATE payment_orders SET status = 'sukses', provider_status = ?, updated_at = ? WHERE id = ?")
			.bind(transactionStatus, nowMs, orderId)
	]);

	return Number(settlement[0]?.meta?.changes ?? 0) === 1;
};
