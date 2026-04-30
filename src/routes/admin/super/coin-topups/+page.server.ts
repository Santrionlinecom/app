import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperAdminUser } from '$lib/auth/session-user';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
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

	// Filter by status
	const status = url.searchParams.get('status') ?? 'pending';
	const validStatuses = ['pending', 'approved', 'rejected'];
	const filterStatus = validStatuses.includes(status) ? status : 'pending';

	// Get topup requests with user info
	const requests = await db
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
			WHERE t.status = ?
			ORDER BY t.created_at DESC
			LIMIT 100`
		)
		.bind(filterStatus)
		.all<any>();

	// Get counts for each status
	const counts = await db
		.prepare(
			`SELECT status, COUNT(*) as count
			FROM coin_topup_requests
			GROUP BY status`
		)
		.all<{ status: string; count: number }>();

	const countMap: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
	for (const c of counts.results ?? []) {
		countMap[c.status] = c.count;
	}

	return {
		requests: requests.results ?? [],
		currentStatus: filterStatus,
		counts: countMap
	};
};