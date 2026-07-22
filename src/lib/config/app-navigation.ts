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
	/** Sidebar section key for the unified dashboard shell */
	group?: AppNavigationGroupKey;
	/** Prefer in mobile bottom bar when present */
	mobilePrimary?: boolean;
};

export type AppNavigationGroupKey =
	| 'utama'
	| 'pembinaan'
	| 'akademik'
	| 'operasional'
	| 'komunitas'
	| 'buku'
	| 'lembaga'
	| 'sistem';

export type AppNavigationGroup = {
	key: AppNavigationGroupKey;
	label: string;
	items: AppNavigationItem[];
};

export const APP_NAV_GROUP_META: Record<
	AppNavigationGroupKey,
	{ label: string; order: number; defaultOpen?: boolean }
> = {
	utama: { label: 'Utama', order: 0, defaultOpen: true },
	pembinaan: { label: 'Pembinaan', order: 1, defaultOpen: true },
	akademik: { label: 'Akademik', order: 2, defaultOpen: true },
	operasional: { label: 'Operasional', order: 3, defaultOpen: false },
	komunitas: { label: 'Komunitas', order: 4, defaultOpen: false },
	buku: { label: 'Buku & Coin', order: 5, defaultOpen: false },
	lembaga: { label: 'Lembaga', order: 6, defaultOpen: false },
	sistem: { label: 'Sistem', order: 7, defaultOpen: false }
};

const ICONS = {
	home: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z',
	users: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z',
	book: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M8 15h6',
	check: 'M5 12l5 5L20 7',
	chart: 'M4 17l5-5 4 4 7-7',
	file: 'M5 4h10l4 4v12H5V4zm10 0v5h5M8 12h8M8 16h5',
	calendar:
		'M7 2v4M17 2v4M3 8h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
	wallet:
		'M4 7h16M4 12h10M4 17h7M15 12h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z',
	megaphone: 'M4 13h3l9 4V7l-9 4H4v2zm3 0v5',
	star: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z',
	message: 'M4 5h16v11H8l-4 4V5z',
	mapPin:
		'M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z',
	building: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5zM8 20v-6h8v6',
	settings:
		'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z',
	shield: 'M12 3l7 3v5c0 4.4-2.8 8.4-7 10-4.2-1.6-7-5.6-7-10V6l7-3z',
	habit: 'M5 12l5 5L20 7',
	learn: 'M4 19.5V5a2 2 0 012-2h9l5 5v11.5M14 3v6h6M8 13h8M8 17h5'
};

const fallbackHref = (feature: string) =>
	`/fitur-belum-tersedia?fitur=${encodeURIComponent(feature)}`;

/** Canonical app home after login. Public marketing home remains `/`. */
export const APP_HOME_HREF = '/dashboard';

/** Social feed lives under the same app shell; label is Sosial, not Beranda. */
export const APP_SOCIAL_HREF = '/beranda';

export const APP_NAVIGATION_BY_TYPE: Record<InstitutionKey, AppNavigationItem[]> = {
	tpq: [
		{
			label: 'Dashboard',
			href: APP_HOME_HREF,
			icon: ICONS.home,
			allowedTypes: ['tpq'],
			group: 'utama',
			mobilePrimary: true,
			description: 'Ringkasan lembaga'
		},
		{
			label: 'Misi Habit',
			href: '/habit',
			icon: ICONS.habit,
			allowedTypes: ['tpq'],
			group: 'pembinaan',
			mobilePrimary: true,
			description: '3 misi harian pilot'
		},
		{
			label: 'Belajar',
			href: '/belajar',
			icon: ICONS.learn,
			allowedTypes: ['tpq'],
			group: 'pembinaan'
		},
		{
			label: 'Data Santri',
			href: '/dashboard/kelola-santri',
			icon: ICONS.users,
			allowedTypes: ['tpq'],
			group: 'akademik',
			permission: 'student.read',
			allowedRoles: [
				'admin',
				'kepala_tpq',
				'koordinator',
				'wali_kelas',
				'ustadz',
				'ustadzah',
				'operator'
			]
		},
		{
			label: 'Setoran Hafalan',
			href: '/tpq/akademik/setoran',
			icon: ICONS.check,
			allowedTypes: ['tpq'],
			group: 'akademik',
			permission: 'hafalan.input',
			allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah']
		},
		{
			label: 'Ujian',
			href: '/dashboard/ujian-tahfidz',
			icon: ICONS.star,
			allowedTypes: ['tpq'],
			group: 'akademik',
			permission: 'ujian.read',
			allowedRoles: ['admin', 'kepala_tpq', 'koordinator', 'wali_kelas', 'ustadz', 'ustadzah']
		},
		{
			label: 'Rapor',
			href: '/tpq/hafalan-rapor',
			icon: ICONS.file,
			allowedTypes: ['tpq'],
			group: 'akademik',
			permission: 'raport.read',
			allowedRoles: [
				'admin',
				'kepala_tpq',
				'koordinator',
				'wali_kelas',
				'ustadz',
				'ustadzah',
				'wali'
			]
		},
		{
			label: 'Akademik',
			href: '/tpq/akademik',
			icon: ICONS.book,
			allowedTypes: ['tpq'],
			group: 'akademik',
			anyPermission: ['hafalan.read', 'hafalan.input', 'hafalan.review']
		},
		{
			label: 'Jadwal',
			href: '/kalender',
			icon: ICONS.calendar,
			allowedTypes: ['tpq'],
			group: 'operasional',
			permission: 'schedule.read'
		},
		{
			label: 'Sosial',
			href: APP_SOCIAL_HREF,
			icon: ICONS.message,
			allowedTypes: ['tpq'],
			group: 'komunitas',
			permission: 'social.post',
			mobilePrimary: true
		}
	],
	pondok: [
		{
			label: 'Dashboard',
			href: APP_HOME_HREF,
			icon: ICONS.home,
			allowedTypes: ['pondok'],
			group: 'utama',
			mobilePrimary: true
		},
		{
			label: 'Data Santri',
			href: '/dashboard/kelola-santri',
			icon: ICONS.users,
			allowedTypes: ['pondok'],
			group: 'akademik',
			allowedRoles: ['admin', 'pengasuh', 'musyrif', 'ustadz', 'ustadzah', 'operator']
		},
		{
			label: 'Asrama/Kamar',
			href: fallbackHref('Asrama/Kamar'),
			icon: ICONS.building,
			allowedTypes: ['pondok'],
			group: 'operasional',
			allowedRoles: ['admin', 'pengasuh', 'musyrif', 'operator']
		},
		{
			label: 'Diniyah',
			href: '/dashboard/diniyah',
			icon: ICONS.book,
			allowedTypes: ['pondok'],
			group: 'akademik'
		},
		{
			label: 'Hafalan',
			href: '/dashboard/pencapaian-hafalan',
			icon: ICONS.chart,
			allowedTypes: ['pondok'],
			group: 'akademik'
		},
		{
			label: 'Keuangan',
			href: fallbackHref('Keuangan Pondok'),
			icon: ICONS.wallet,
			allowedTypes: ['pondok'],
			group: 'operasional',
			permission: 'finance.read',
			allowedRoles: ['admin', 'pengasuh', 'bendahara']
		},
		{
			label: 'Jadwal',
			href: '/kalender',
			icon: ICONS.calendar,
			allowedTypes: ['pondok'],
			group: 'operasional'
		},
		{
			label: 'Sosial',
			href: APP_SOCIAL_HREF,
			icon: ICONS.message,
			allowedTypes: ['pondok'],
			group: 'komunitas',
			mobilePrimary: true
		}
	],
	masjid: [
		{
			label: 'Dashboard',
			href: APP_HOME_HREF,
			icon: ICONS.home,
			allowedTypes: ['masjid'],
			group: 'utama',
			mobilePrimary: true
		},
		{
			label: 'Data Jamaah',
			href: '/dashboard/kelola-santri',
			icon: ICONS.users,
			allowedTypes: ['masjid'],
			group: 'operasional',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara', 'operator']
		},
		{
			label: 'Kas Masjid',
			href: '/keuangan',
			icon: ICONS.wallet,
			allowedTypes: ['masjid'],
			group: 'operasional',
			permission: 'finance.read',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara']
		},
		{
			label: 'Jadwal Imam/Khotib',
			href: '/dashboard/jadwal',
			icon: ICONS.calendar,
			allowedTypes: ['masjid'],
			group: 'operasional',
			anyPermission: ['schedule.read', 'imam.schedule'],
			allowedRoles: [
				'admin',
				'ketua_takmir',
				'takmir',
				'tamir',
				'imam',
				'khotib',
				'muadzin',
				'operator'
			]
		},
		{
			label: 'Qurban',
			href: fallbackHref('Qurban'),
			icon: ICONS.star,
			allowedTypes: ['masjid'],
			group: 'operasional',
			permission: 'zakat.manage',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara']
		},
		{
			label: 'Pengumuman',
			href: fallbackHref('Pengumuman Masjid'),
			icon: ICONS.megaphone,
			allowedTypes: ['masjid'],
			group: 'komunitas',
			permission: 'announcement.read'
		},
		{
			label: 'Sosial',
			href: APP_SOCIAL_HREF,
			icon: ICONS.message,
			allowedTypes: ['masjid'],
			group: 'komunitas',
			permission: 'social.post',
			mobilePrimary: true
		}
	],
	musholla: [
		{
			label: 'Dashboard',
			href: APP_HOME_HREF,
			icon: ICONS.home,
			allowedTypes: ['musholla'],
			group: 'utama',
			mobilePrimary: true
		},
		{
			label: 'Data Jamaah',
			href: '/dashboard/kelola-santri',
			icon: ICONS.users,
			allowedTypes: ['musholla'],
			group: 'operasional',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara', 'operator']
		},
		{
			label: 'Kas Musholla',
			href: '/keuangan',
			icon: ICONS.wallet,
			allowedTypes: ['musholla'],
			group: 'operasional',
			permission: 'finance.read',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara']
		},
		{
			label: 'Jadwal Imam',
			href: '/dashboard/jadwal',
			icon: ICONS.calendar,
			allowedTypes: ['musholla'],
			group: 'operasional',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'imam', 'muadzin', 'operator']
		},
		{
			label: 'Qurban',
			href: fallbackHref('Qurban'),
			icon: ICONS.star,
			allowedTypes: ['musholla'],
			group: 'operasional',
			permission: 'zakat.manage',
			allowedRoles: ['admin', 'ketua_takmir', 'takmir', 'tamir', 'bendahara']
		},
		{
			label: 'Pengumuman',
			href: fallbackHref('Pengumuman Musholla'),
			icon: ICONS.megaphone,
			allowedTypes: ['musholla'],
			group: 'komunitas'
		},
		{
			label: 'Sosial',
			href: APP_SOCIAL_HREF,
			icon: ICONS.message,
			allowedTypes: ['musholla'],
			group: 'komunitas',
			mobilePrimary: true
		}
	],
	'rumah-tahfidz': [
		{
			label: 'Dashboard',
			href: APP_HOME_HREF,
			icon: ICONS.home,
			allowedTypes: ['rumah-tahfidz'],
			group: 'utama',
			mobilePrimary: true
		},
		{
			label: 'Data Santri',
			href: '/dashboard/kelola-santri',
			icon: ICONS.users,
			allowedTypes: ['rumah-tahfidz'],
			group: 'akademik',
			allowedRoles: ['admin', 'kepala_tahfidz', 'musyrif', 'ustadz', 'ustadzah', 'operator']
		},
		{
			label: 'Halaqoh',
			href: '/dashboard/halaqoh',
			icon: ICONS.building,
			allowedTypes: ['rumah-tahfidz'],
			group: 'akademik',
			allowedRoles: ['admin', 'kepala_tahfidz', 'musyrif', 'ustadz', 'ustadzah', 'operator']
		},
		{
			label: 'Setoran Hafalan',
			href: fallbackHref('Setoran Hafalan Rumah Tahfidz'),
			icon: ICONS.check,
			allowedTypes: ['rumah-tahfidz'],
			group: 'akademik'
		},
		{
			label: 'Progress Hafalan',
			href: '/dashboard/pencapaian-hafalan',
			icon: ICONS.chart,
			allowedTypes: ['rumah-tahfidz'],
			group: 'akademik'
		},
		{
			label: 'Jadwal',
			href: '/kalender',
			icon: ICONS.calendar,
			allowedTypes: ['rumah-tahfidz'],
			group: 'operasional'
		},
		{
			label: 'Sosial',
			href: APP_SOCIAL_HREF,
			icon: ICONS.message,
			allowedTypes: ['rumah-tahfidz'],
			group: 'komunitas',
			mobilePrimary: true
		}
	]
};

export const GLOBAL_APP_NAVIGATION: AppNavigationItem[] = [
	{
		label: 'Lembaga',
		href: '/lembaga',
		icon: ICONS.building,
		description: 'Kelola lembaga aktif',
		group: 'lembaga',
		mobilePrimary: true
	},
	{
		label: 'Addon',
		href: '/addon',
		icon: ICONS.star,
		description: 'Aktivasi fitur tambahan',
		permission: 'org.manage',
		allowedRoles: ['admin'],
		group: 'lembaga'
	},
	{
		label: 'Baca Buku',
		href: '/buku',
		icon: ICONS.book,
		group: 'buku'
	},
	{
		label: 'Studio Penulis',
		href: '/buku/studio',
		icon: ICONS.learn,
		group: 'buku'
	},
	{
		label: 'Saldo Coin',
		href: '/coins',
		icon: ICONS.wallet,
		group: 'buku'
	},
	{
		label: 'Akun',
		href: '/akun',
		icon: ICONS.settings,
		description: 'Profil dan keamanan akun',
		group: 'sistem',
		mobilePrimary: true
	}
];

export const SUPER_ADMIN_NAVIGATION: AppNavigationItem[] = [
	{
		label: 'Super Admin',
		href: '/admin/super/overview',
		icon: ICONS.shield,
		group: 'utama',
		mobilePrimary: true
	},
	{
		label: 'Peta Lembaga',
		href: '/admin/peta',
		icon: ICONS.mapPin,
		allowedRoles: ['super_admin'],
		group: 'sistem'
	},
	{ label: 'Moderasi Buku', href: '/admin/super/buku', icon: ICONS.book, group: 'buku' },
	{
		label: 'Royalti',
		href: '/admin/super/buku/royalties',
		icon: ICONS.chart,
		group: 'buku'
	},
	{
		label: 'Topup Coin',
		href: '/admin/super/coin-topups',
		icon: ICONS.wallet,
		group: 'buku'
	},
	{ label: 'CMS', href: '/admin/posts', icon: ICONS.file, group: 'sistem' },
	{ label: 'Licenses', href: '/admin/licenses', icon: ICONS.shield, group: 'sistem' },
	{
		label: 'Akun',
		href: '/akun',
		icon: ICONS.settings,
		group: 'sistem',
		mobilePrimary: true
	}
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

const inferGroup = (item: AppNavigationItem): AppNavigationGroupKey => {
	if (item.group) return item.group;
	const href = item.href;
	if (href === APP_HOME_HREF || href.includes('/overview')) return 'utama';
	if (href.startsWith('/habit') || href.startsWith('/belajar')) return 'pembinaan';
	if (
		href.includes('akademik') ||
		href.includes('kelola-santri') ||
		href.includes('hafalan') ||
		href.includes('setoran') ||
		href.includes('ujian') ||
		href.includes('rapor') ||
		href.includes('halaqoh') ||
		href.includes('diniyah') ||
		href.includes('sertifikat')
	) {
		return 'akademik';
	}
	if (href === APP_SOCIAL_HREF || href.startsWith('/sosial') || href.includes('pengumuman')) {
		return 'komunitas';
	}
	if (href.startsWith('/buku') || href.startsWith('/coins')) return 'buku';
	if (href.startsWith('/lembaga') || href.startsWith('/addon')) return 'lembaga';
	if (href.startsWith('/keuangan') || href.includes('jadwal') || href.startsWith('/kalender')) {
		return 'operasional';
	}
	if (href.startsWith('/admin') || href.startsWith('/akun')) return 'sistem';
	return 'operasional';
};

export const getAppNavigation = (
	orgType?: string | null,
	role?: string | null,
	can?: (permission: Permission) => boolean
) => {
	const normalizedType = (orgType ?? '').trim() as InstitutionKey;
	const options = { role, can };
	const institutionItems =
		normalizedType in APP_NAVIGATION_BY_TYPE
			? APP_NAVIGATION_BY_TYPE[normalizedType].filter((item) => itemAllowed(item, options))
			: [];
	const globalItems = GLOBAL_APP_NAVIGATION.filter((item) => itemAllowed(item, options));
	return [...institutionItems, ...globalItems];
};

export const groupAppNavigation = (items: AppNavigationItem[]): AppNavigationGroup[] => {
	const buckets = new Map<AppNavigationGroupKey, AppNavigationItem[]>();
	const seen = new Set<string>();

	for (const raw of items) {
		const key = `${raw.href}::${raw.label}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const groupKey = inferGroup(raw);
		const list = buckets.get(groupKey) ?? [];
		list.push({ ...raw, group: groupKey });
		buckets.set(groupKey, list);
	}

	return [...buckets.entries()]
		.map(([key, groupItems]) => ({
			key,
			label: APP_NAV_GROUP_META[key].label,
			items: groupItems
		}))
		.sort((a, b) => APP_NAV_GROUP_META[a.key].order - APP_NAV_GROUP_META[b.key].order)
		.filter((group) => group.items.length > 0);
};

export const getMobilePrimaryNav = (items: AppNavigationItem[], limit = 5): AppNavigationItem[] => {
	const preferred = items.filter((item) => item.mobilePrimary);
	const rest = items.filter((item) => !item.mobilePrimary);
	const ordered = [...preferred, ...rest];
	const unique: AppNavigationItem[] = [];
	const seen = new Set<string>();
	for (const item of ordered) {
		if (seen.has(item.href)) continue;
		seen.add(item.href);
		unique.push(item);
		if (unique.length >= limit) break;
	}
	return unique;
};

export const findNavLabel = (items: AppNavigationItem[], pathname: string): string | null => {
	const exact = items.find((item) => item.href === pathname);
	if (exact) return exact.label;
	const prefix = items
		.filter((item) => item.href !== '/' && pathname.startsWith(`${item.href}/`))
		.sort((a, b) => b.href.length - a.href.length)[0];
	return prefix?.label ?? null;
};
