import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import { getAppNavigation, SUPER_ADMIN_NAVIGATION } from '$lib/config/app-navigation';
import {
	assertLoggedIn,
	assertOrgRoleAllowed,
	canAccessFeature
} from '$lib/server/auth/rbac';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';

type LembagaSwitcherItem = {
	id: string;
	name: string;
	type: string;
	slug: string | null;
	status: string | null;
	logoUrl: string | null;
	isAktif: number | null;
};

const isMissingMultiLembagaColumn = (err: unknown) => {
	const message = `${(err as Error)?.message ?? err}`.toLowerCase();
	return (
		message.includes('no such column') &&
		(message.includes('akun_admin_id') || message.includes('logo_url') || message.includes('is_aktif'))
	);
};

const listManagedLembaga = async (db: App.Locals['db'], userId?: string | null) => {
	if (!db || !userId) return [];

	try {
		const { results } = await db
			.prepare(
				`SELECT
					id,
					name,
					type,
					slug,
					status,
					logo_url as logoUrl,
					is_aktif as isAktif
				 FROM organizations
				 WHERE akun_admin_id = ?
				 ORDER BY COALESCE(is_aktif, 0) DESC, name COLLATE NOCASE ASC`
			)
			.bind(userId)
			.all<LembagaSwitcherItem>();

		return (results ?? []).map((item) => ({
			id: item.id,
			name: item.name,
			type: item.type,
			slug: item.slug,
			status: item.status,
			logoUrl: item.logoUrl,
			isAktif: item.isAktif
		}));
	} catch (err) {
		if (isMissingMultiLembagaColumn(err)) return [];
		throw err;
	}
};

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = assertLoggedIn({ locals });
	const superAdmin = isSuperAdminRole(user.role);

	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	if (superAdmin) {
		return {
			user,
			org: null,
			lembagaList: await listManagedLembaga(locals.db, user.id),
			appMenu: SUPER_ADMIN_NAVIGATION,
			featureAccess: {
				hafalan: true,
				setoran: true,
				ujian: true,
				raport: true,
				kas_masjid: true,
				zakat_infaq: true,
				jadwal_kegiatan: true,
				kalender: true
			}
		};
	}

	const isDashboardRoute = url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/');
	const isLembagaRoute = url.pathname === '/lembaga' || url.pathname.startsWith('/lembaga/');
	const orgId = user.orgId ?? null;
	let org = null;

	if (orgId) {
		org = await getOrganizationById(locals.db, orgId);
		if (!org && !isDashboardRoute) {
			throw error(404, 'Lembaga tidak ditemukan');
		}
	} else if (isDashboardRoute) {
		throw redirect(302, '/lembaga');
	} else if (!isDashboardRoute && !isLembagaRoute) {
		throw error(403, 'Akun belum terhubung ke lembaga.');
	}

	if (org) {
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
		lembagaList: await listManagedLembaga(locals.db, user.id),
		appMenu: getAppNavigation(org?.type ?? null, user.role),
		featureAccess
	};
};
