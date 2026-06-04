import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAdminRole } from '$lib/utils/role-helpers';

export const load: LayoutServerLoad = async ({ locals }) => {
	const isAdmin = isAdminRole(locals.user?.role ?? '');
	if (!isAdmin && locals.user?.orgId && locals.user.orgStatus === 'pending') {
		throw redirect(302, '/menunggu');
	}
	if (!isAdmin && locals.user?.orgId && locals.db) {
		const org = await locals.db
			.prepare('SELECT status FROM organizations WHERE id = ?')
			.bind(locals.user.orgId)
			.first<{ status?: string }>();
		if (org?.status === 'pending' || org?.status === 'rejected') {
			throw redirect(302, '/menunggu');
		}
	}

	return {
		user: locals.user
	};
};
