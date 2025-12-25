import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.user?.orgId && locals.user.orgStatus === 'pending') {
		throw redirect(302, '/menunggu');
	}
	if (locals.user?.orgId && locals.db) {
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
