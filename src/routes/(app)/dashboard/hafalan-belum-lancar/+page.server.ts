import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFlaggedHafalan } from '$lib/server/progress';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Database tidak tersedia');
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	assertFeature(org.type, user.role, 'hafalan');

	const role = user.role as 'admin' | 'ustadz' | 'ustadzah' | 'santri';
	const { isSystemAdmin } = getOrgScope(user);
	const targetUser = url.searchParams.get('userId') || undefined;
	const flagged = await getFlaggedHafalan(locals.db!, {
		currentUserId: user.id,
		role: role as any,
		userId: targetUser,
		orgId: isSystemAdmin ? null : orgId
	});

	return {
		role,
		flagged
	};
};
