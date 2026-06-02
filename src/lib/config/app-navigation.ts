import type { InstitutionKey } from '$lib/config/institutions';
import type { Permission } from '$lib/types/rbac';

export type AppNavigationItem = {
	label: string;
	href: string;
	icon: string;
	description?: string;
	permission?: Permission;
	anyPermission?: Permission[];
	allowedTypes?: InstitutionKey[];
	allowedRoles?: string[];
};

const ICONS = {
	home: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z',
	users: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z',
	book: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M8 15h6',
	check: 'M5 12l5 5L20 7',
	chart: 'M4 17l5-5 4 4 7-7',
	file: 'M5 4h10l4 4v12H5V4zm10 0v5h5M8 12h8M8 16h5',
	calendar: 'M7 2v4M17 2v4M3 8h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
	wallet: 'M4 7h16M4 12h10M4 17h7M15 12h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z',
	megaphone: 'M4 13h3l9 4V7l-9 4H4v2zm3 0v5',
	star: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z',
	message: 'M4 5h16v11H8l-4 4V5z',
	mapPin: 'M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z',
	building: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5zM8 20v-6h8v6',
	settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z',
	shield: 'M12 3l7 3v5c0 4.4-2.8 8.4-7 10-4.2-1.6-7-5.6-7-10V6l7-3z'
};

const fallbackHref = (feature: string) =>
	`/fitur-belum-tersedia?fitur=${encodeURIComponent(feature)}`;

export const APP_NAVIGATION_BY_TYPE: Record<InstitutionKey, AppNavigationItem[]> = {
	tpq: [
		{ label: 'Dashboard TPQ', href: '/dashboard', icon: ICONS.home, allowedTypes: ['tpq'] },
		{ label: 'Data Santri', href: '/dashboard/kelola-santri', icon: ICONS.users, allowedTypes: ['tpq'], permission: 'student.read', allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah', 'operator'] },
		{ label: 'Setoran Hafalan', href: '/tpq/akademik/setoran', icon: ICONS.check, allowedTypes: ['tpq'], permission: 'hafalan.input', allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah'] },
		{ label: 'Ujian', href: '/dashboard/ujian-tahfidz', icon: ICONS.star, allowedTypes: ['tpq'], permission: 'ujian.read', allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah'] },
		{ label: 'Rapor', href: '/tpq/hafalan-rapor', icon: ICONS.file, allowedTypes: ['tpq'], permission: 'raport.read', allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah', 'wali'] },
		{ label: 'Akademik', href: '/tpq/akademik', icon: ICONS.book, allowedTypes: ['tpq'], anyPermission: ['hafalan.read', 'hafalan.input', 'hafalan.review'] },
		{ label: 'Jadwal', href: '/kalender', icon: ICONS.calendar, allowedTypes: ['tpq'], permission: 'schedule.read' },
		{ label: 'Sosial', href: '/beranda', icon: ICONS.message, allowedTypes: ['tpq'], permission: 'social.post' }
	],
	pondok: [
		{ label: 'Dashboard Pondok', href: '/dashboard', icon: ICONS.home, allowedTypes: ['pondok'] },
		{ label: 'Data Santri', href: '/dashboard/kelola-santri', icon: ICONS.users, allowedTypes: ['pondok'], allowedRoles: ['admin', 'pengasuh', 'musyrif', 'ustadz', 'ustadzah', 'operator'] },
		{ label: 'Asrama/Kamar', href: fallbackHref('Asrama/Kamar'), icon: ICONS.building, allowedTypes: ['pondok'], allowedRoles: ['admin', 'pengasuh', 'musyrif', 'operator'] },
		{ label: 'Diniyah', href: '/dashboard/diniyah', icon: ICONS.book, allowedTypes: ['pondok'] },
		{ label: 'Hafalan', href: '/dashboard/pencapaian-hafalan', icon: ICONS.chart, allowedTypes: ['pondok'] },
		{ label: 'Keuangan', href: fallbackHref('Keuangan Pondok'), icon: ICONS.wallet, allowedTypes: ['pondok'], permission: 'finance.read', allowedRoles: ['admin', 'pengasuh', 'bendahara'] },
		{ label: 'Jadwal', href: '/kalender', icon: ICONS.calendar, allowedTypes: ['pondok'] },
		{ label: 'Sosial', href: '/beranda', icon: ICONS.message, allowedTypes: ['pondok'] }
	],
	masjid: [
		{ label: 'Dashboard Masjid', href: '/dashboard', icon: ICONS.home, allowedTypes: ['masjid'] },
		{ label: 'Data Jamaah', href: '/dashboard/kelola-santri', icon: ICONS.users, allowedTypes: ['masjid'], allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara', 'operator'] },
		{ label: 'Kas Masjid', href: '/keuangan', icon: ICONS.wallet, allowedTypes: ['masjid'], permission: 'finance.read', allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara'] },
		{ label: 'Jadwal Imam/Khotib', href: '/dashboard/jadwal', icon: ICONS.calendar, allowedTypes: ['masjid'], anyPermission: ['schedule.read', 'imam.schedule'], allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'imam', 'khotib', 'muadzin', 'operator'] },
		{ label: 'Qurban', href: fallbackHref('Qurban'), icon: ICONS.star, allowedTypes: ['masjid'], permission: 'zakat.manage', allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara'] },
		{ label: 'Pengumuman', href: fallbackHref('Pengumuman Masjid'), icon: ICONS.megaphone, allowedTypes: ['masjid'], permission: 'announcement.read' },
		{ label: 'Sosial', href: '/beranda', icon: ICONS.message, allowedTypes: ['masjid'], permission: 'social.post' }
	],
	musholla: [
		{ label: 'Dashboard Musholla', href: '/dashboard', icon: ICONS.home, allowedTypes: ['musholla'] },
		{ label: 'Data Jamaah', href: '/dashboard/kelola-santri', icon: ICONS.users, allowedTypes: ['musholla'], allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara', 'operator'] },
		{ label: 'Kas Musholla', href: '/keuangan', icon: ICONS.wallet, allowedTypes: ['musholla'], permission: 'finance.read', allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara'] },
		{ label: 'Jadwal Imam', href: '/dashboard/jadwal', icon: ICONS.calendar, allowedTypes: ['musholla'], allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'imam', 'muadzin', 'operator'] },
		{ label: 'Pengumuman', href: fallbackHref('Pengumuman Musholla'), icon: ICONS.megaphone, allowedTypes: ['musholla'] },
		{ label: 'Sosial', href: '/beranda', icon: ICONS.message, allowedTypes: ['musholla'] }
	],
	'rumah-tahfidz': [
		{ label: 'Dashboard Rumah Tahfidz', href: '/dashboard', icon: ICONS.home, allowedTypes: ['rumah-tahfidz'] },
		{ label: 'Data Santri', href: '/dashboard/kelola-santri', icon: ICONS.users, allowedTypes: ['rumah-tahfidz'], allowedRoles: ['admin', 'kepala_tahfidz', 'musyrif', 'ustadz', 'ustadzah', 'operator'] },
		{ label: 'Halaqoh', href: '/dashboard/halaqoh', icon: ICONS.building, allowedTypes: ['rumah-tahfidz'], allowedRoles: ['admin', 'kepala_tahfidz', 'musyrif', 'ustadz', 'ustadzah', 'operator'] },
		{ label: 'Setoran Hafalan', href: fallbackHref('Setoran Hafalan Rumah Tahfidz'), icon: ICONS.check, allowedTypes: ['rumah-tahfidz'] },
		{ label: 'Progress Hafalan', href: '/dashboard/pencapaian-hafalan', icon: ICONS.chart, allowedTypes: ['rumah-tahfidz'] },
		{ label: 'Jadwal', href: '/kalender', icon: ICONS.calendar, allowedTypes: ['rumah-tahfidz'] },
		{ label: 'Sosial', href: '/beranda', icon: ICONS.message, allowedTypes: ['rumah-tahfidz'] }
	]
};

export const GLOBAL_APP_NAVIGATION: AppNavigationItem[] = [
	{ label: 'Lembaga', href: '/lembaga', icon: ICONS.building, description: 'Kelola lembaga aktif' },
	{ label: 'Addon', href: '/addon', icon: ICONS.star, description: 'Aktivasi fitur tambahan', permission: 'org.manage', allowedRoles: ['admin'] },
	{ label: 'Akun', href: '/akun', icon: ICONS.settings, description: 'Profil dan keamanan akun' }
];

export const SUPER_ADMIN_NAVIGATION: AppNavigationItem[] = [
	{ label: 'Super Admin', href: '/admin/super/overview', icon: ICONS.shield },
	{ label: 'Peta Lembaga', href: '/admin/peta', icon: ICONS.mapPin, allowedRoles: ['super_admin'] },
	{ label: 'Moderasi Buku', href: '/admin/super/buku', icon: ICONS.book },
	{ label: 'Royalti', href: '/admin/super/buku/royalties', icon: ICONS.chart },
	{ label: 'Topup Coin', href: '/admin/super/coin-topups', icon: ICONS.wallet },
	{ label: 'CMS', href: '/admin/posts', icon: ICONS.file },
	{ label: 'Licenses', href: '/admin/licenses', icon: ICONS.shield }
];

type NavigationFilterOptions = {
	role?: string | null;
	can?: (permission: Permission) => boolean;
};

const itemAllowed = (item: AppNavigationItem, options: NavigationFilterOptions = {}) => {
	if (item.permission && options.can?.(item.permission)) return true;
	if (item.anyPermission?.some((permission) => options.can?.(permission))) return true;
	if (item.permission || item.anyPermission?.length) {
		return Boolean(item.allowedRoles?.includes((options.role ?? '').trim()));
	}
	if (!item.allowedRoles?.length) return true;
	return item.allowedRoles.includes((options.role ?? '').trim());
};

export const getAppNavigation = (
	orgType?: string | null,
	role?: string | null,
	can?: (permission: Permission) => boolean
) => {
	const normalizedType = (orgType ?? '').trim() as InstitutionKey;
	const options = { role, can };
	const institutionItems = normalizedType in APP_NAVIGATION_BY_TYPE
		? APP_NAVIGATION_BY_TYPE[normalizedType].filter((item) => itemAllowed(item, options))
		: [];
	const globalItems = GLOBAL_APP_NAVIGATION.filter((item) => itemAllowed(item, options));
	return [...institutionItems, ...globalItems];
};
