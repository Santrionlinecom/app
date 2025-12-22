import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.user?.orgId && locals.user.orgStatus === 'pending') {
		throw redirect(302, '/menunggu');
	}

	return {
		user: locals.user
	};
};
