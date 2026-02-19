import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import {
	assertLoggedIn,
	assertOrgRoleAllowed,
	canAccessFeature
} from '$lib/server/auth/rbac';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = assertLoggedIn({ locals });
	if (user.role === 'jamaah' || user.role === 'tamir' || user.role === 'bendahara') {
		throw redirect(302, '/tpq');
	}

	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const isDashboardRoute = url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/');
	const orgId = user.orgId ?? null;
	let org = null;

	if (orgId) {
		org = await getOrganizationById(locals.db, orgId);
		if (!org && !isDashboardRoute) {
			throw error(404, 'Lembaga tidak ditemukan');
		}
	} else if (!isDashboardRoute) {
		throw error(403, 'Akun belum terhubung ke lembaga.');
	}

	if (org) {
		if (org.type !== 'tpq') {
			throw redirect(302, '/tpq');
		}

		assertOrgRoleAllowed(org.type, user.role);
	}

	const featureAccess = {
		hafalan: canAccessFeature(org?.type ?? null, user.role, 'hafalan'),
		setoran: canAccessFeature(org?.type ?? null, user.role, 'setoran'),
		ujian: canAccessFeature(org?.type ?? null, user.role, 'ujian'),
		raport: canAccessFeature(org?.type ?? null, user.role, 'raport'),
		kas_masjid: canAccessFeature(org?.type ?? null, user.role, 'kas_masjid'),
		zakat_infaq: canAccessFeature(org?.type ?? null, user.role, 'zakat_infaq'),
		jadwal_kegiatan: canAccessFeature(org?.type ?? null, user.role, 'jadwal_kegiatan'),
		kalender: canAccessFeature(org?.type ?? null, user.role, 'kalender')
	};

	return {
		user,
		org,
		featureAccess
	};
};
