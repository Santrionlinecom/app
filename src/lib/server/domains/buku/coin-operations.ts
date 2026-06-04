import type { D1Database } from '@cloudflare/workers-types';
import { ensureCoinWallet, getCoinBalance } from './wallet';

export type CoinDeductResult = {
	success: boolean;
	newBalance?: number;
	error?: string;
};

export type CoinCheckResult = {
	hasEnough: boolean;
	currentBalance: number;
	required: number;
	shortfall: number;
};

/**
 * Check if user has enough coin balance
 */
export async function checkCoinBalance(
	db: D1Database,
	userId: string,
	requiredAmount: number
): Promise<CoinCheckResult> {
	const balance = await getCoinBalance(db, userId);
	const hasEnough = balance >= requiredAmount;
	const shortfall = hasEnough ? 0 : requiredAmount - balance;

	return {
		hasEnough,
		currentBalance: balance,
		required: requiredAmount,
		shortfall
	};
}

/**
 * Deduct coins from user wallet with transaction logging
 */
export async function deductCoins(
	db: D1Database,
	userId: string,
	amount: number,
	description: string,
	referenceType?: string,
	referenceId?: string
): Promise<CoinDeductResult> {
	if (amount <= 0) {
		return {
			success: false,
			error: 'Jumlah coin harus lebih dari 0'
		};
	}

	// Ensure wallet exists
	await ensureCoinWallet(db, userId);

	// Check balance
	const check = await checkCoinBalance(db, userId, amount);
	if (!check.hasEnough) {
		return {
			success: false,
			error: `Saldo coin tidak cukup. Anda memerlukan ${check.shortfall} coin lagi.`
		};
	}

	const transactionId = crypto.randomUUID();
	const now = new Date().toISOString();

	try {
		// Deduct from wallet and log transaction in a batch
		await db.batch([
			db
				.prepare(
					`UPDATE coin_wallets 
					SET balance = balance - ?, 
						updated_at = ? 
					WHERE user_id = ?`
				)
				.bind(amount, now, userId),
			db
				.prepare(
					`INSERT INTO coin_transactions (
						id, user_id, type, amount, balance_after, 
						description, reference_type, reference_id, created_at
					) VALUES (?, ?, ?, ?, 
						(SELECT balance FROM coin_wallets WHERE user_id = ?),
						?, ?, ?, ?
					)`
				)
				.bind(
					transactionId,
					userId,
					'purchase', // New transaction type for purchases
					-amount, // Negative for deduction
					userId,
					description,
					referenceType ?? null,
					referenceId ?? null,
					now
				)
		]);

		const newBalance = await getCoinBalance(db, userId);

		return {
			success: true,
			newBalance
		};
	} catch (error: any) {
		console.error('deduct_coins_error', { userId, amount, error: error.message });
		return {
			success: false,
			error: 'Gagal memproses transaksi coin. Silakan coba lagi.'
		};
	}
}

/**
 * Add coins to user wallet (for topup, refund, etc)
 */
export async function addCoins(
	db: D1Database,
	userId: string,
	amount: number,
	type: 'topup' | 'refund' | 'adjustment',
	description: string,
	referenceType?: string,
	referenceId?: string
): Promise<CoinDeductResult> {
	if (amount <= 0) {
		return {
			success: false,
			error: 'Jumlah coin harus lebih dari 0'
		};
	}

	// Ensure wallet exists
	await ensureCoinWallet(db, userId);

	const transactionId = crypto.randomUUID();
	const now = new Date().toISOString();

	try {
		// Add to wallet and log transaction in a batch
		await db.batch([
			db
				.prepare(
					`UPDATE coin_wallets 
					SET balance = balance + ?, 
						updated_at = ? 
					WHERE user_id = ?`
				)
				.bind(amount, now, userId),
			db
				.prepare(
					`INSERT INTO coin_transactions (
						id, user_id, type, amount, balance_after, 
						description, reference_type, reference_id, created_at
					) VALUES (?, ?, ?, ?, 
						(SELECT balance FROM coin_wallets WHERE user_id = ?),
						?, ?, ?, ?
					)`
				)
				.bind(
					transactionId,
					userId,
					type,
					amount, // Positive for addition
					userId,
					description,
					referenceType ?? null,
					referenceId ?? null,
					now
				)
		]);

		const newBalance = await getCoinBalance(db, userId);

		return {
			success: true,
			newBalance
		};
	} catch (error: any) {
		console.error('add_coins_error', { userId, amount, error: error.message });
		return {
			success: false,
			error: 'Gagal memproses transaksi coin. Silakan coba lagi.'
		};
	}
}

/**
 * Convert Rupiah to Coin (1 Rupiah = 1 Coin for simplicity)
 * You can adjust the conversion rate here
 */
export function rupiahToCoin(rupiah: number): number {
	return rupiah; // 1:1 conversion
}

/**
 * Convert Coin to Rupiah
 */
export function coinToRupiah(coin: number): number {
	return coin; // 1:1 conversion
}
