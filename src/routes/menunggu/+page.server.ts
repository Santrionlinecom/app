import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureOrgSchema } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw redirect(302, '/auth');
	}

	await ensureOrgSchema(locals.db!);

	const orgId = locals.user.orgId ?? null;
	let org = null;
	if (orgId) {
		org = await locals.db!
			.prepare(
				`SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
				 FROM organizations
				 WHERE id = ?`
			)
			.bind(orgId)
			.first();
	}

	const memberPending = locals.user.orgStatus === 'pending';
	const orgPending = org?.status === 'pending';
	const orgRejected = org?.status === 'rejected';

	if (!memberPending && !orgPending && !orgRejected) {
		throw redirect(302, '/dashboard');
	}

	return {
		user: locals.user,
		org,
		memberPending,
		orgPending,
		orgRejected
	};
};
