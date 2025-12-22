import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFlaggedHafalan } from '$lib/server/progress';
import { getOrgScope } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	const role = locals.user.role as 'admin' | 'ustadz' | 'ustadzah' | 'santri';
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const targetUser = url.searchParams.get('userId') || undefined;
	const flagged = await getFlaggedHafalan(locals.db!, {
		currentUserId: locals.user.id,
		role: role as any,
		userId: targetUser,
		orgId: isSystemAdmin ? null : orgId
	});

	return {
		role,
		flagged
	};
};
