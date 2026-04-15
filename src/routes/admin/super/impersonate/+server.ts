import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { setImpersonatedOrgId } from '$lib/server/auth/impersonation';

export const GET: RequestHandler = async ({ locals, url, cookies }) => {
	const { db } = requireSuperAdmin(locals);

	const orgId = url.searchParams.get('orgId');
	if (!orgId) {
		throw error(400, 'Organisasi tidak valid');
	}

	const org = await db
		.prepare('SELECT id FROM organizations WHERE id = ?')
		.bind(orgId)
		.first<{ id: string }>();

	if (!org?.id) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	setImpersonatedOrgId(cookies, orgId);

	throw redirect(302, '/dashboard');
};
