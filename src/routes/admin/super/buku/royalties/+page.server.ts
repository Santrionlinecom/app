import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	BUKU_ROYALTY_STATUSES,
	getAdminRoyaltySummary,
	isBukuRoyaltyStatus,
	listAdminRoyaltyLedger
} from '$lib/server/buku-royalty';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const statusParam = url.searchParams.get('status') ?? 'all';
	const currentStatus = isBukuRoyaltyStatus(statusParam) ? statusParam : 'all';
	const status = currentStatus === 'all' ? null : currentStatus;
	const [summary, ledger] = await Promise.all([
		getAdminRoyaltySummary(db, status),
		listAdminRoyaltyLedger(db, { status, limit: 250 })
	]);

	return {
		summary,
		ledger,
		currentStatus,
		statuses: BUKU_ROYALTY_STATUSES
	};
};
