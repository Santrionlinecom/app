import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';

type PublicProfile = {
	id: string;
	username: string | null;
	role: string | null;
	gender: string | null;
	orgId: string | null;
	orgStatus: string | null;
	createdAt: number | null;
};

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	const handle = params.id;
	if (!handle) {
		throw error(404, 'Profil tidak ditemukan');
	}

	const profile = await db
		.prepare(
			`SELECT id,
				username,
				role,
				gender,
				org_id as orgId,
				org_status as orgStatus,
				created_at as createdAt
			 FROM users
			 WHERE id = ?`
		)
		.bind(handle)
		.first<PublicProfile>();

	if (!profile) {
		throw error(404, 'Profil tidak ditemukan');
	}

	const org = profile.orgId ? await getOrganizationById(db, profile.orgId) : null;

	return {
		profile,
		org
	};
};
