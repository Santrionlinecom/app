import { error } from '@sveltejs/kit';
import type { OrgRole, OrgType, Permission } from '$lib/types/rbac';
import { hasPermission, isRoleAllowedInOrg } from './permissions';

const getLocalRole = (locals: App.Locals) => locals.user?.role as OrgRole | undefined;
const getLocalOrgId = (locals: App.Locals) => locals.user?.orgId ?? null;

export const requirePermission = (locals: App.Locals, permission: Permission): void => {
	if (locals.isSuperAdmin) return;
	const role = getLocalRole(locals);
	if (!role || !hasPermission(role, permission)) {
		throw error(403, `Akses ditolak: butuh permission '${permission}'`);
	}
};

export const requireAnyPermission = (locals: App.Locals, permissions: Permission[]): void => {
	if (locals.isSuperAdmin) return;
	const role = getLocalRole(locals);
	const hasAny = Boolean(role && permissions.some((permission) => hasPermission(role, permission)));
	if (!hasAny) {
		throw error(403, `Akses ditolak: butuh salah satu dari [${permissions.join(', ')}]`);
	}
};

export const canDo = (locals: App.Locals, permission: Permission): boolean => {
	if (locals.isSuperAdmin) return true;
	const role = getLocalRole(locals);
	return Boolean(role && hasPermission(role, permission));
};

export const requireSameOrg = (locals: App.Locals, resourceOrgId: string): void => {
	if (locals.isSuperAdmin) return;
	if (getLocalOrgId(locals) !== resourceOrgId) {
		throw error(403, 'Akses ditolak: resource bukan milik lembaga Anda');
	}
};

export const assertRoleAllowedInOrg = (role: OrgRole, orgType: OrgType): void => {
	if (!isRoleAllowedInOrg(role, orgType)) {
		throw error(400, `Role '${role}' tidak diizinkan untuk lembaga jenis '${orgType}'`);
	}
};
