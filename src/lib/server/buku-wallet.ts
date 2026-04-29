import type { D1Database } from '@cloudflare/workers-types';

export const COIN_TRANSACTION_TYPES = ['topup', 'unlock_chapter', 'adjustment', 'refund'] as const;
export const COIN_TOPUP_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type CoinTransactionType = (typeof COIN_TRANSACTION_TYPES)[number];
export type CoinTopupStatus = (typeof COIN_TOPUP_STATUSES)[number];

export type CoinWallet = {
	userId: string;
	balance: number;
	createdAt: string;
	updatedAt: string;
};

export type CoinTransaction = {
	id: string;
	userId: string;
	type: CoinTransactionType;
	amount: number;
	balanceAfter: number | null;
	description: string | null;
	referenceType: string | null;
	referenceId: string | null;
	createdAt: string;
};

export type CoinTopupRequest = {
	id: string;
	userId: string;
	amountRupiah: number;
	coinAmount: number;
	proofUrl: string | null;
	userNote: string | null;
	status: CoinTopupStatus;
	adminNote: string | null;
	reviewedBy: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export async function ensureBukuWalletSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS coin_wallets (
				user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
				balance INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS coin_transactions (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				type TEXT NOT NULL CHECK (type IN ('topup', 'unlock_chapter', 'adjustment', 'refund')),
				amount INTEGER NOT NULL,
				balance_after INTEGER,
				description TEXT,
				reference_type TEXT,
				reference_id TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS coin_topup_requests (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				amount_rupiah INTEGER NOT NULL,
				coin_amount INTEGER NOT NULL,
				proof_url TEXT,
				user_note TEXT,
				status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
				admin_note TEXT,
				reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
				reviewed_at TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_user ON coin_topup_requests(user_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_status ON coin_topup_requests(status)').run();
}
