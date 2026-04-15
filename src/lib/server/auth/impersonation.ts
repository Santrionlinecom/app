import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { isSuperAdminUser } from '$lib/auth/session-user';

export const SUPER_ADMIN_IMPERSONATION_COOKIE = 'so_superadmin_org';

const cookieAttributes = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev
};

export const getImpersonatedOrgId = (cookies: Cookies) => {
	const orgId = cookies.get(SUPER_ADMIN_IMPERSONATION_COOKIE)?.trim();
	return orgId || null;
};

export const setImpersonatedOrgId = (cookies: Cookies, orgId: string) => {
	cookies.set(SUPER_ADMIN_IMPERSONATION_COOKIE, orgId, {
		...cookieAttributes,
		maxAge: 60 * 60 * 12
	});
};

export const clearImpersonatedOrgId = (cookies: Cookies) => {
	cookies.delete(SUPER_ADMIN_IMPERSONATION_COOKIE, { path: '/' });
};

export const applySuperAdminImpersonation = <
	T extends {
		role?: string | null;
		orgId?: string | null;
		orgStatus?: string | null;
		originalRole?: string | null;
	}
>(
	user: T,
	orgId: string
) => {
	if (!isSuperAdminUser(user)) return user;

	return {
		...user,
		role: 'admin',
		orgId,
		orgStatus: 'active',
		actualRole: user.role ?? null,
		actualOrgId: user.orgId ?? null,
		originalRole: user.originalRole ?? user.role ?? null,
		isImpersonating: true,
		impersonatedOrgId: orgId
	};
};
