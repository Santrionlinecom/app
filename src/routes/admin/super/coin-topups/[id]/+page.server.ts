import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { isSuperAdminUser } from '$lib/auth/session-user';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isSuperAdminUser(locals.user)) {
		throw redirect(302, '/');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw redirect(302, '/');
	}

	const { id } = params;

	// Get topup request with user info
	const request = await db
		.prepare(
			`SELECT
				t.id,
				t.user_id as userId,
				u.email as userEmail,
				u.name as userName,
				t.amount_rupiah as amountRupiah,
				t.coin_amount as coinAmount,
				t.proof_url as proofUrl,
				t.user_note as userNote,
				t.status,
				t.admin_note as adminNote,
				t.reviewed_by as reviewedBy,
				t.reviewed_at as reviewedAt,
				t.created_at as createdAt,
				t.updated_at as updatedAt
			FROM coin_topup_requests t
			LEFT JOIN users u ON t.user_id = u.id
			WHERE t.id = ?
			LIMIT 1`
		)
		.bind(id)
		.first<any>();

	if (!request) {
		throw error(404, 'Request topup tidak ditemukan');
	}

	// Get user's current wallet balance
	const wallet = await db
		.prepare('SELECT balance FROM coin_wallets WHERE user_id = ?')
		.bind(request.userId)
		.first<{ balance: number }>();

	return {
		request: {
			...request,
			currentBalance: wallet?.balance ?? 0
		}
	};
};

export const actions: Actions = {
	approve: async ({ locals, platform, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}
		if (!isSuperAdminUser(locals.user)) {
			throw redirect(302, '/');
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Database tidak tersedia' });
		}

		const { id } = params;
		const adminNote = 'Approved';

		// Get the request first
		const existing = await db
			.prepare('SELECT * FROM coin_topup_requests WHERE id = ?')
			.bind(id)
			.first<any>();

		if (!existing) {
			return fail(404, { message: 'Request topup tidak ditemukan' });
		}

		if (existing.status !== 'pending') {
			return fail(400, { message: 'Request sudah diproses sebelumnya' });
		}

		const now = new Date().toISOString();
		const coinAmount = existing.coin_amount;
		const userId = existing.user_id;

		// Ensure wallet exists
		await db.prepare('INSERT OR IGNORE INTO coin_wallets (user_id) VALUES (?)').bind(userId).run();

		// Get current balance
		const wallet = await db.prepare('SELECT balance FROM coin_wallets WHERE user_id = ?').bind(userId).first<{ balance: number }>();
		const currentBalance = wallet?.balance ?? 0;
		const newBalance = currentBalance + coinAmount;

		// Update wallet balance
		await db
			.prepare('UPDATE coin_wallets SET balance = ?, updated_at = ? WHERE user_id = ?')
			.bind(newBalance, now, userId)
			.run();

		// Record transaction
		const txId = generateId(15);
		await db
			.prepare(
				`INSERT INTO coin_transactions 
				(id, user_id, type, amount, balance_after, description, reference_type, reference_id, created_at)
				VALUES (?, ?, 'topup', ?, ?, 'Topup koin via request manual', 'coin_topup_requests', ?, ?)`
			)
			.bind(txId, userId, coinAmount, newBalance, id, now)
			.run();

		// Update request status
		await db
			.prepare(
				`UPDATE coin_topup_requests 
				SET status = 'approved', admin_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
				WHERE id = ?`
			)
			.bind(adminNote, locals.user.id, now, now, id)
			.run();

		throw redirect(303, '/admin/super/coin-topups?success=approved');
	},

	reject: async ({ request, locals, platform, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}
		if (!isSuperAdminUser(locals.user)) {
			throw redirect(302, '/');
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Database tidak tersedia' });
		}

		const { id } = params;
		const formData = await request.formData();
		const adminNote = formData.get('admin_note')?.toString()?.trim() ?? 'Rejected by admin';

		// Get the request first
		const existing = await db
			.prepare('SELECT * FROM coin_topup_requests WHERE id = ?')
			.bind(id)
			.first<any>();

		if (!existing) {
			return fail(404, { message: 'Request topup tidak ditemukan' });
		}

		if (existing.status !== 'pending') {
			return fail(400, { message: 'Request sudah diproses sebelumnya' });
		}

		const now = new Date().toISOString();

		// Update request status
		await db
			.prepare(
				`UPDATE coin_topup_requests 
				SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
				WHERE id = ?`
			)
			.bind(adminNote, locals.user.id, now, now, id)
			.run();

		throw redirect(303, '/admin/super/coin-topups?success=rejected');
	}
};