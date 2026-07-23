import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { clearImpersonatedOrgId } from '$lib/server/auth/impersonation';

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
	requireSuperAdmin(locals);
	clearImpersonatedOrgId(cookies);

	const next = url.searchParams.get('next');
	throw redirect(302, next || '/admin/super/overview');
};
