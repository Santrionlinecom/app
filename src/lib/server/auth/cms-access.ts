import { isSuperAdminUser } from '$lib/auth/session-user';

const cmsRoles = new Set(['admin']);

export const canManageCms = (user: App.Locals['user']) =>
	Boolean(user && (cmsRoles.has(user.role ?? '') || isSuperAdminUser(user)));
