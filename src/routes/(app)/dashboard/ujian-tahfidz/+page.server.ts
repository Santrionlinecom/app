import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertFeature(org.type, user.role, 'ujian');
	return {};
};
