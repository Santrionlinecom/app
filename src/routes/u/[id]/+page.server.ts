import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import { hasAssignedSantri } from '$lib/server/domains/tpq/santri-ustadz';

type PublicProfile = {
	id: string;
	username: string | null;
	role: string | null;
	gender: string | null;
	avatarUrl: string | null;
	orgId: string | null;
	orgStatus: string | null;
	createdAt: number | null;
};

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	if (!db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	const handle = params.id.trim().toLowerCase();
	if (!handle) {
		throw error(404, 'Profil tidak ditemukan');
	}

	const profile = await db
		.prepare(
			`SELECT id,
				username,
				role,
				gender,
				avatar_url as avatarUrl,
				org_id as orgId,
				org_status as orgStatus,
				created_at as createdAt
			 FROM users
			 WHERE public_handle = ? OR id = ?
			 ORDER BY CASE WHEN public_handle = ? THEN 0 ELSE 1 END
			 LIMIT 1`
		)
		.bind(handle, handle, handle)
		.first<PublicProfile>();

	if (!profile) {
		throw error(404, 'Profil tidak ditemukan');
	}

	const org = profile.orgId ? await getOrganizationById(db, profile.orgId) : null;
	const extraRoles: string[] = [];
	if (profile.role === 'admin') {
		const hasSantri = await hasAssignedSantri(db, profile.id);
		if (hasSantri) {
			extraRoles.push(profile.gender === 'wanita' ? 'ustadzah' : 'ustadz');
		}
	}

	return {
		profile,
		org,
		extraRoles
	};
};
