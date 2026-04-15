type SessionUserLike = {
	role?: string | null;
	originalRole?: string | null;
	isImpersonating?: boolean | null;
	impersonatedOrgId?: string | null;
} | null | undefined;

const normalizeSystemRole = (role?: string | null) =>
	role?.trim().replace(/-/g, '_').toUpperCase() ?? null;

export const getOriginalRole = (user: SessionUserLike) => user?.originalRole ?? user?.role ?? null;

export const isSuperAdminUser = (user: SessionUserLike) =>
	normalizeSystemRole(getOriginalRole(user)) === 'SUPER_ADMIN';

export const isImpersonatingUser = (user: SessionUserLike) =>
	Boolean(user?.isImpersonating && user?.impersonatedOrgId);
