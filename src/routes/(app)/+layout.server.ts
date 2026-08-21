import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import { getDailyStreak } from '$lib/server/streak';
import { getAppNavigation, SUPER_ADMIN_NAVIGATION } from '$lib/config/app-navigation';
import {
	assertLoggedIn,
	assertOrgRoleAllowed,
	canAccessFeature
} from '$lib/server/auth/rbac';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';
import { getCoinBalance } from '$lib/server/domains/buku/wallet';

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
		// Sumber utama: keanggotaan. Satu orang bisa memegang banyak lembaga, dan
		// ia bisa diberi wewenang di lembaga yang pendaftar aslinya orang lain —
		// sehingga `akun_admin_id` saja tidak cukup. Union dengan kolom lama tetap
		// dipertahankan supaya akun yang belum punya baris keanggotaan tidak
		// kehilangan daftar lembaganya sebelum backfill selesai.
		const { results } = await db
			.prepare(
				`SELECT DISTINCT
					o.id,
					o.name,
					o.type,
					o.slug,
					o.status,
					o.logo_url as logoUrl,
					o.is_aktif as isAktif
				 FROM organizations o
				 LEFT JOIN organization_memberships m
					ON m.org_id = o.id AND m.user_id = ? AND m.is_active = 1
				 WHERE m.user_id IS NOT NULL OR o.akun_admin_id = ?
				 ORDER BY COALESCE(o.is_aktif, 0) DESC, o.name COLLATE NOCASE ASC`
			)
			.bind(userId, userId)
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
		console.error('[layout] daftar lembaga gagal', err);
		return [];
	}
};

const layoutPermissions = (locals: App.Locals) => ({
	canPost: locals.can('social.post'),
	canModerate: locals.can('social.moderate'),
	canManageOrg: locals.can('org.manage'),
	canWriteFinance: locals.can('finance.write'),
	canReviewHafalan: locals.can('hafalan.review'),
	canWriteAnnouncement: locals.can('announcement.write')
});

const withOrgScopedNavigation = (
	items: ReturnType<typeof getAppNavigation>,
	orgSlug?: string | null
) => {
	if (!orgSlug) return items;
	const ummahHref = `/org/${encodeURIComponent(orgSlug)}/ummah`;
	return items.map((item) =>
		item.label === 'Qurban' || item.label === 'Zakat & Qurban'
			? { ...item, href: ummahHref }
			: item
	);
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
			coinBalance: await getCoinBalance(locals.db, user.id).catch(() => 0),
			featureAccess: {
				hafalan: true,
				setoran: true,
				ujian: true,
				raport: true,
				kas_masjid: true,
				zakat_infaq: true,
				jadwal_kegiatan: true,
				kalender: true
			},
			permissions: layoutPermissions(locals)
		};
	}

	const isDashboardRoute = url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/');
	const isLembagaRoute = url.pathname === '/lembaga' || url.pathname.startsWith('/lembaga/');
	const isAkunRoute = url.pathname === '/akun' || url.pathname.startsWith('/akun/');
	// All /admin/* tools share the unified dashboard shell
	const isAppAdminRoute = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
	// Personal / shared app surfaces that must work with or without org context
	const isPersonalAppRoute =
		url.pathname === '/coins' ||
		url.pathname.startsWith('/coins/') ||
		url.pathname === '/buku/saya' ||
		url.pathname.startsWith('/buku/saya/') ||
		url.pathname === '/buku/studio' ||
		url.pathname.startsWith('/buku/studio/') ||
		url.pathname === '/menunggu' ||
		url.pathname.startsWith('/menunggu/') ||
		url.pathname === '/sertifikat' ||
		url.pathname.startsWith('/sertifikat/') ||
		url.pathname === '/addon' ||
		url.pathname.startsWith('/addon/') ||
		url.pathname === '/fitur-belum-tersedia' ||
		url.pathname.startsWith('/fitur-belum-tersedia') ||
		url.pathname === '/kalender' ||
		url.pathname.startsWith('/kalender/') ||
		url.pathname === '/habit' ||
		url.pathname.startsWith('/habit/') ||
		url.pathname === '/belajar' ||
		url.pathname.startsWith('/belajar/') ||
		url.pathname === '/kursus' ||
		url.pathname.startsWith('/kursus/') ||
		url.pathname === '/digital-store' ||
		url.pathname.startsWith('/digital-store/') ||
		url.pathname === '/kitab' ||
		url.pathname.startsWith('/kitab/') ||
		url.pathname === '/desain' ||
		url.pathname.startsWith('/desain/') ||
		url.pathname === '/beranda' ||
		url.pathname.startsWith('/beranda/') ||
		url.pathname === '/sosial' ||
		url.pathname.startsWith('/sosial/') ||
		// Rute wali: pemantauan milik akun pribadi, bukan milik lembaga.
		// Wali biasanya TIDAK punya orgId, jadi wajib masuk daftar rute
		// personal — kalau tidak, layout ini menolaknya dengan 404.
		url.pathname === '/wali' ||
		url.pathname.startsWith('/wali/') ||
		// Halaqah: santri mandiri boleh ikut halaqah tanpa jadi anggota
		// lembaga formal, jadi rute ini juga personal.
		url.pathname === '/halaqah' ||
		url.pathname.startsWith('/halaqah/') ||
		// Rapor milik santri: santri mandiri pun berhak punya rapor.
		url.pathname === '/rapor' ||
		url.pathname.startsWith('/rapor/');
	const orgId = user.orgId ?? null;
	let org = null;

	if (orgId) {
		org = await getOrganizationById(locals.db, orgId);
		if (!org && !isDashboardRoute && !isAkunRoute && !isAppAdminRoute && !isPersonalAppRoute) {
			throw error(404, 'Lembaga tidak ditemukan');
		}
	} else if (isDashboardRoute) {
		throw redirect(302, '/lembaga');
	} else if (
		!isDashboardRoute &&
		!isLembagaRoute &&
		!isAkunRoute &&
		!isAppAdminRoute &&
		!isPersonalAppRoute
	) {
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
		streak: await getDailyStreak(locals.db, user.id),
		coinBalance: await getCoinBalance(locals.db, user.id).catch(() => 0),
		lembagaList: await listManagedLembaga(locals.db, user.id),
		appMenu: withOrgScopedNavigation(
			getAppNavigation(org?.type ?? null, user.role, locals.can),
			org?.slug
		),
		featureAccess,
		permissions: layoutPermissions(locals)
	};
};
