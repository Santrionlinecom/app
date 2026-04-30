import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	listAuthorRoyaltyLedger,
	listAuthorRoyaltySummary
} from '$lib/server/buku-royalty';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	const [summary, ledger] = await Promise.all([
		listAuthorRoyaltySummary(db, locals.user.id),
		listAuthorRoyaltyLedger(db, locals.user.id)
	]);

	return {
		summary,
		ledger
	};
};
