import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import {
	assertLoggedIn,
	assertOrgMember,
	assertOrgRoleAllowed,
	canAccessFeature
} from '$lib/server/auth/rbac';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	assertOrgRoleAllowed(org.type, user.role);

	const featureAccess = {
		hafalan: canAccessFeature(org.type, user.role, 'hafalan'),
		setoran: canAccessFeature(org.type, user.role, 'setoran'),
		ujian: canAccessFeature(org.type, user.role, 'ujian'),
		raport: canAccessFeature(org.type, user.role, 'raport'),
		kas_masjid: canAccessFeature(org.type, user.role, 'kas_masjid'),
		zakat_infaq: canAccessFeature(org.type, user.role, 'zakat_infaq'),
		jadwal_kegiatan: canAccessFeature(org.type, user.role, 'jadwal_kegiatan'),
		kalender: canAccessFeature(org.type, user.role, 'kalender')
	};

	return {
		user,
		org,
		featureAccess
	};
};
