import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureCoinWallet, getCoinWallet } from '$lib/server/buku-wallet';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw redirect(302, '/');
	}

	// Ensure wallet exists
	const wallet = await ensureCoinWallet(db, locals.user.id);

	// Get transactions
	const transactions = await db
		.prepare(
			`SELECT
				id,
				type,
				amount,
				balance_after as balanceAfter,
				description,
				created_at as createdAt
			FROM coin_transactions
			WHERE user_id = ?
			ORDER BY created_at DESC
			LIMIT 50`
		)
		.bind(locals.user.id)
		.all<any>();

	// Get user's topup requests
	const topupRequests = await db
		.prepare(
			`SELECT
				id,
				amount_rupiah as amountRupiah,
				coin_amount as coinAmount,
				proof_url as proofUrl,
				user_note as userNote,
				status,
				admin_note as adminNote,
				reviewed_at as reviewedAt,
				created_at as createdAt
			FROM coin_topup_requests
			WHERE user_id = ?
			ORDER BY created_at DESC
			LIMIT 20`
		)
		.bind(locals.user.id)
		.all<any>();

	return {
		wallet: {
			userId: wallet.userId,
			balance: wallet.balance,
			createdAt: wallet.createdAt,
			updatedAt: wallet.updatedAt
		},
		transactions: transactions.results ?? [],
		topupRequests: topupRequests.results ?? []
	};
};