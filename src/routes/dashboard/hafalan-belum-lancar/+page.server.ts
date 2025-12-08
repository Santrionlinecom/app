import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFlaggedHafalan } from '$lib/server/progress';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	const role = locals.user.role as 'admin' | 'ustadz' | 'ustadzah' | 'santri';
	const targetUser = url.searchParams.get('userId') || undefined;
	const flagged = await getFlaggedHafalan(locals.db, {
		currentUserId: locals.user.id,
		role,
		userId: targetUser
	});

	return {
		role,
		flagged
	};
};
