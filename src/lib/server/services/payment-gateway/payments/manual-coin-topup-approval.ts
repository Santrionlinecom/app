import type { D1Database } from '@cloudflare/workers-types';

type ApproveManualCoinTopupInput = {
	db: D1Database;
	orderId: string;
	adminUserId: string;
	nowIso?: string;
};

export type ManualCoinTopupApprovalResult =
	| { status: 'approved'; balanceAfter: number }
	| { status: 'provider_managed' }
	| { status: 'proof_required' }
	| { status: 'not_found' }
	| { status: 'already_processed' };

type ManualTopupRow = {
	userId: string;
	coinAmount: number;
	proofUrl: string | null;
	status: string;
};

export const approveManualCoinTopup = async ({
	db,
	orderId,
	adminUserId,
	nowIso = new Date().toISOString()
}: ApproveManualCoinTopupInput): Promise<ManualCoinTopupApprovalResult> => {
	const providerOrder = await db
		.prepare('SELECT provider FROM payment_orders WHERE id = ? AND purpose = ? LIMIT 1')
		.bind(orderId, 'coin_topup')
		.first<{ provider: string }>();
	if (providerOrder) return { status: 'provider_managed' };

	const topup = await db
		.prepare(
			`SELECT user_id AS userId, coin_amount AS coinAmount, proof_url AS proofUrl, status
			 FROM coin_topup_requests WHERE id = ? LIMIT 1`
		)
		.bind(orderId)
		.first<ManualTopupRow>();
	if (!topup) return { status: 'not_found' };
	if (topup.status !== 'pending') return { status: 'already_processed' };
	if (!topup.proofUrl?.trim()) return { status: 'proof_required' };
	if (!Number.isSafeInteger(topup.coinAmount) || topup.coinAmount <= 0) {
		throw new Error('Jumlah coin topup tidak valid');
	}

	await db.prepare('INSERT OR IGNORE INTO coin_wallets (user_id) VALUES (?)').bind(topup.userId).run();
	const ledgerId = `manual-coin-topup:${orderId}`;
	const settlement = await db.batch([
		db
			.prepare(
				`UPDATE coin_wallets
				 SET balance = balance + ?, updated_at = ?
				 WHERE user_id = ?
				   AND EXISTS (
					 SELECT 1 FROM coin_topup_requests
					 WHERE id = ? AND status = 'pending' AND proof_url IS NOT NULL AND trim(proof_url) <> ''
				   )`
			)
			.bind(topup.coinAmount, nowIso, topup.userId, orderId),
		db
			.prepare(
				`INSERT INTO coin_transactions
				(id, user_id, type, amount, balance_after, description, reference_type, reference_id, created_at)
				SELECT ?, ?, 'topup', ?, balance, 'Topup koin via transfer manual', 'coin_topup_requests', ?, ?
				FROM coin_wallets
				WHERE user_id = ?
				  AND EXISTS (
					SELECT 1 FROM coin_topup_requests WHERE id = ? AND status = 'pending'
				  )`
			)
			.bind(ledgerId, topup.userId, topup.coinAmount, orderId, nowIso, topup.userId, orderId),
		db
			.prepare(
				`UPDATE coin_topup_requests
				 SET status = 'approved', admin_note = 'Approved manual transfer',
				     reviewed_by = ?, reviewed_at = ?, updated_at = ?
				 WHERE id = ? AND status = 'pending'`
			)
			.bind(adminUserId, nowIso, nowIso, orderId)
	]);

	if (Number(settlement[0]?.meta?.changes ?? 0) !== 1) {
		return { status: 'already_processed' };
	}
	const wallet = await db
		.prepare('SELECT balance FROM coin_wallets WHERE user_id = ?')
		.bind(topup.userId)
		.first<{ balance: number }>();
	return { status: 'approved', balanceAfter: Number(wallet?.balance ?? 0) };
};

type RejectManualCoinTopupInput = {
	db: D1Database;
	orderId: string;
	adminUserId: string;
	adminNote: string;
	nowIso?: string;
};

export type ManualCoinTopupRejectionResult =
	| { status: 'rejected' }
	| { status: 'provider_managed' }
	| { status: 'already_processed' };

export const rejectManualCoinTopup = async ({
	db,
	orderId,
	adminUserId,
	adminNote,
	nowIso = new Date().toISOString()
}: RejectManualCoinTopupInput): Promise<ManualCoinTopupRejectionResult> => {
	const providerOrder = await db
		.prepare('SELECT provider FROM payment_orders WHERE id = ? AND purpose = ? LIMIT 1')
		.bind(orderId, 'coin_topup')
		.first<{ provider: string }>();
	if (providerOrder) return { status: 'provider_managed' };

	const result = await db
		.prepare(
			`UPDATE coin_topup_requests
			 SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
			 WHERE id = ? AND status = 'pending'`
		)
		.bind(adminNote.trim() || 'Rejected by admin', adminUserId, nowIso, nowIso, orderId)
		.run();

	return Number(result.meta?.changes ?? 0) === 1
		? { status: 'rejected' }
		: { status: 'already_processed' };
};
