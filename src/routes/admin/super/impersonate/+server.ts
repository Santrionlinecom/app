import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeLucia } from '$lib/server/lucia';

export const GET: RequestHandler = async ({ locals, url, cookies }) => {
	if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const orgId = url.searchParams.get('orgId');
	if (!orgId) {
		throw error(400, 'Organisasi tidak valid');
	}

	const adminUser = await locals.db
		.prepare('SELECT id FROM users WHERE org_id = ? AND role = ? ORDER BY created_at ASC LIMIT 1')
		.bind(orgId, 'admin')
		.first<{ id: string }>();

	if (!adminUser?.id) {
		throw error(404, 'Admin lembaga tidak ditemukan');
	}

	const lucia = initializeLucia(locals.db);
	const session = await lucia.createSession(adminUser.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '/',
		...sessionCookie.attributes
	});

	throw redirect(302, '/dashboard');
};
