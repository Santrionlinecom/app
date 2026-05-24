import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';

export const requireMaintenanceAccess = (params: {
	locals: App.Locals;
	secret?: string | null;
	token?: string | null;
	secretName: string;
}) => {
	const { user, db } = requireSuperAdmin(params.locals);
	const secret = params.secret?.trim();

	if (!secret && !dev) {
		throw error(503, `${params.secretName} belum dikonfigurasi`);
	}

	if (secret && params.token !== secret) {
		throw error(403, 'Token pemeliharaan tidak valid');
	}

	return { user, db };
};
