import { isSuperAdminUser } from '$lib/auth/session-user';

export const canManageCms = (user: App.Locals['user']) =>
	Boolean(user && isSuperAdminUser(user));
