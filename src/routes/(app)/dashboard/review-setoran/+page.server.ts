import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	canReviewSetoran,
	requireTpqAcademicContext
} from '$lib/server/domains/tpq/academic';

export const load: PageServerLoad = async ({ locals }) => {
	const { role } = await requireTpqAcademicContext(locals);
	if (!canReviewSetoran(role)) {
		throw redirect(302, '/tpq/akademik/riwayat');
	}
	throw redirect(302, '/tpq/akademik/review');
};
