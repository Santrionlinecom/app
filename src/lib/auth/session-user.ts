type SessionUserLike = {
	role?: string | null;
	originalRole?: string | null;
	isImpersonating?: boolean | null;
	impersonatedOrgId?: string | null;
} | null | undefined;

const normalizeSystemRole = (role?: string | null) =>
	role?.trim().replace(/[-\s]+/g, '_').toUpperCase() ?? null;

const isSuperAdminRoleValue = (role?: string | null) => {
	const normalized = normalizeSystemRole(role);
	return normalized === 'SUPER_ADMIN' || normalized === 'SUPERADMIN';
};

export const getOriginalRole = (user: SessionUserLike) => user?.originalRole ?? user?.role ?? null;

export const isSuperAdminUser = (user: SessionUserLike) => isSuperAdminRoleValue(getOriginalRole(user));

export const isImpersonatingUser = (user: SessionUserLike) =>
	Boolean(user?.isImpersonating && user?.impersonatedOrgId);
