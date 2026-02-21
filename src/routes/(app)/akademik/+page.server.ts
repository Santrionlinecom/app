import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	canInputSetoran,
	canReviewSetoran,
	requireTpqAcademicContext
} from '$lib/server/tpq-academic';

export const load: PageServerLoad = async ({ locals }) => {
	const { role } = await requireTpqAcademicContext(locals);

	if (canInputSetoran(role)) {
		throw redirect(302, '/tpq/akademik/setoran');
	}
	if (canReviewSetoran(role)) {
		throw redirect(302, '/tpq/akademik/review');
	}

	throw redirect(302, '/tpq/akademik/riwayat');
};
