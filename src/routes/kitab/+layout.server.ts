import type { LayoutServerLoad } from './$types';
import { assertLoggedIn } from '$lib/server/auth/rbac';

export const load: LayoutServerLoad = async ({ locals }) => {
	assertLoggedIn({ locals });
	return {};
};
