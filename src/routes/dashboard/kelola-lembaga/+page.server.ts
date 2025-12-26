import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureOrgSchema } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (locals.user.role !== 'SUPER_ADMIN') {
		throw redirect(302, '/dashboard');
	}
	if (!locals.db) throw redirect(302, '/dashboard');

	await ensureOrgSchema(locals.db!);
	const { results } = await locals.db!
		.prepare(
			`SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
			 FROM organizations
			 ORDER BY created_at DESC`
		)
		.all();

	return {
		orgs: results ?? []
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!
			.prepare('UPDATE organizations SET status = ? WHERE id = ?')
			.bind('active', orgId)
			.run();

		return { success: true };
	},
	reject: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!
			.prepare('UPDATE organizations SET status = ? WHERE id = ?')
			.bind('rejected', orgId)
			.run();

		return { success: true };
	},
	remove: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
			return fail(403, { error: 'Tidak memiliki akses' });
		}
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const formData = await request.formData();
		const orgId = formData.get('orgId');
		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Organisasi tidak valid' });
		}

		await locals.db!.prepare('DELETE FROM users WHERE org_id = ?').bind(orgId).run();
		await locals.db!.prepare('DELETE FROM organizations WHERE id = ?').bind(orgId).run();

		return { success: true };
	}
};
