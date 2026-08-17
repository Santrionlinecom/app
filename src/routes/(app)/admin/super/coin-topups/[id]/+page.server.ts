import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	approveManualCoinTopup,
	rejectManualCoinTopup
} from '$lib/server/services/payment-gateway/payments/manual-coin-topup-approval';
import { queueCoinTransactionEmail } from '$lib/server/notifications/coin-transaction-email';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { db } = requireSuperAdmin(locals);

	const { id } = params;

	// Get topup request with user info
	const request = await db
		.prepare(
			`SELECT
				t.id,
				t.user_id as userId,
				u.email as userEmail,
				u.username as userName,
				t.amount_rupiah as amountRupiah,
				t.coin_amount as coinAmount,
				t.proof_url as proofUrl,
				t.user_note as userNote,
				t.status,
				t.admin_note as adminNote,
				t.reviewed_by as reviewedBy,
				t.reviewed_at as reviewedAt,
				t.created_at as createdAt,
				t.updated_at as updatedAt,
				p.provider as paymentProvider
			FROM coin_topup_requests t
			LEFT JOIN users u ON t.user_id = u.id
			LEFT JOIN payment_orders p ON p.id = t.id AND p.purpose = 'coin_topup'
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
	approve: async ({ locals, params, platform }) => {
		const { db, user } = requireSuperAdmin(locals);
		const topup = await db
			.prepare('SELECT user_id AS userId, coin_amount AS coinAmount FROM coin_topup_requests WHERE id = ?')
			.bind(params.id)
			.first<{ userId: string; coinAmount: number }>();
		const result = await approveManualCoinTopup({
			db,
			orderId: params.id,
			adminUserId: user.id
		});
		if (result.status === 'provider_managed') {
			return fail(400, { message: 'Pembayaran Midtrans hanya boleh diproses otomatis oleh webhook.' });
		}
		if (result.status === 'proof_required') {
			return fail(400, { message: 'Bukti pembayaran manual wajib tersedia sebelum persetujuan.' });
		}
		if (result.status === 'not_found') {
			return fail(404, { message: 'Request topup tidak ditemukan' });
		}
		if (result.status === 'already_processed') {
			return fail(400, { message: 'Request sudah diproses sebelumnya' });
		}

		// Hanya persetujuan yang benar-benar memindahkan koin. Status lain sudah
		// ditolak di atas, jadi di titik ini saldo pasti bertambah.
		if (topup?.userId) {
			queueCoinTransactionEmail(
				{
					db,
					fetchFn: fetch,
					env: platform?.env ?? {},
					userId: topup.userId,
					transactionId: `manual-coin-topup:${params.id}`,
					jenis: 'topup',
					koin: topup.coinAmount,
					saldoAkhir: result.balanceAfter,
					keterangan: 'Topup koin via transfer manual'
				},
				platform?.context?.waitUntil
			);
		}

		throw redirect(303, '/admin/super/coin-topups?success=approved');
	},

	reject: async ({ request, locals, params }) => {
		const { db, user } = requireSuperAdmin(locals);

		const { id } = params;
		const formData = await request.formData();
		const adminNote = formData.get('admin_note')?.toString()?.trim() ?? 'Rejected by admin';

		const result = await rejectManualCoinTopup({
			db,
			orderId: id,
			adminUserId: user.id,
			adminNote
		});
		if (result.status === 'provider_managed') {
			return fail(400, { message: 'Pembayaran Midtrans hanya boleh diproses otomatis oleh webhook.' });
		}
		if (result.status === 'already_processed') {
			return fail(400, { message: 'Request sudah diproses sebelumnya' });
		}

		throw redirect(303, '/admin/super/coin-topups?success=rejected');
	}
};
