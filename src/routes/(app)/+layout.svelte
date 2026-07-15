<script lang="ts">
	import { page } from '$app/stores';
	import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
	import LembagaSwitcher from '$lib/components/LembagaSwitcher.svelte';
	import { isTeachingRole, isMentoringRole } from '$lib/utils/role-helpers';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	type FeatureKey =
		| 'hafalan'
		| 'setoran'
		| 'ujian'
		| 'raport'
		| 'kas_masjid'
		| 'zakat_infaq'
		| 'jadwal_kegiatan'
		| 'kalender';

	let role = '';
	let orgType: string | null = null;
	let isCommunityOrg = false;
	let hasOrg = false;
	let isSuperAdmin = false;
	let isImpersonating = false;
	let orgLabel = 'Lembaga';
	let roleLabel = 'Pengguna';
	let headerTitle = 'Ringkasan Harian';
	let featureAccess: Record<string, boolean> = {};
	let isDashboardRoute = false;

	const orgLabelMap: Record<string, string> = {
		pondok: 'Pondok',
		tpq: 'TPQ',
		'rumah-tahfidz': 'Rumah Tahfidz',
		masjid: 'Masjid',
		musholla: 'Musholla'
	};
	const roleLabelMap: Record<string, string> = {
		SUPER_ADMIN: 'Super Admin',
		admin: 'Admin',
		koordinator: 'Koordinator',
		ustadz: 'Guru',
		ustadzah: 'Guru',
		santri: 'Santri',
		alumni: 'Alumni',
		jamaah: 'Jamaah',
		tamir: "Ta'mir",
		bendahara: 'Bendahara'
	};

	const santriOnlineIconUrl =
		'https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png';

	const dashboardIconPaths = {
		dashboard: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z',
		search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
		sparkles:
			'M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.5 10.3 11 6 9.3l4.3-1.7L12 3Zm6 10 1 2.6 2.5 1-2.5 1-1 2.4-1-2.4-2.5-1 2.5-1 1-2.6ZM5 13l.8 2.1L8 16l-2.2.9L5 19l-.8-2.1L2 16l2.2-.9L5 13Z'
	};

	type MenuItem = {
		label: string;
		href: string;
		icon: string;
		description?: string;
		feature?: FeatureKey;
	};

	const sidebarIconTone = (item: MenuItem) => {
		const href = item.href;

		if (href === '/dashboard' || href.includes('/overview')) return 'from-slate-700 to-emerald-700';
		if (href.startsWith('/lembaga') || href.includes('kelola-aset')) return 'from-lime-700 to-emerald-700';
		if (href.startsWith('/addon')) return 'from-fuchsia-600 to-rose-600';
		if (href.includes('earnings') || href.includes('royalt')) return 'from-rose-600 to-pink-600';
		if (href.startsWith('/buku/studio')) return 'from-sky-600 to-cyan-700';
		if (href.startsWith('/buku') || href.startsWith('/belajar')) return 'from-emerald-700 to-teal-700';
		if (href.startsWith('/coins') || href.includes('topup')) return 'from-amber-700 to-orange-700';
		if (href.includes('kelola-santri') || href.includes('licenses')) return 'from-violet-600 to-indigo-600';
		if (href.includes('review') || href.includes('riwayat') || href.startsWith('/admin/posts')) return 'from-cyan-700 to-blue-600';
		if (href.includes('pencapaian') || href.includes('rapor')) return 'from-rose-600 to-pink-600';
		if (href.includes('sertifikat') || href.includes('jadwal') || href.startsWith('/kalender')) return 'from-indigo-600 to-violet-600';
		if (href.startsWith('/keuangan')) return 'from-blue-600 to-indigo-600';
		if (href.startsWith('/akun')) return 'from-amber-700 to-orange-700';

		return 'from-emerald-700 to-teal-700';
	};

	const learnItem: MenuItem = {
		label: 'Belajar 📚',
		href: '/belajar',
		icon: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M8 15h6'
	};

	const educationalAdminItems: MenuItem[] = [
		{
			label: 'Akademik',
			href: '/tpq/akademik/setoran',
			icon: 'M3.5 7.5l8.5-4 8.5 4-8.5 4-8.5-4zm1.5 5.5l7 3.25 7-3.25v5.5l-7 3.25-7-3.25v-5.5z',
			feature: 'setoran'
		},
		learnItem,
		{
			label: 'Kelola Santri',
			href: '/dashboard/kelola-santri',
			icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z'
		},
		{
			label: 'Review Setoran',
			href: '/tpq/akademik/review',
			icon: 'M5 12l5 5L20 7',
			feature: 'setoran'
		},
		{
			label: 'Pencapaian',
			href: '/dashboard/pencapaian-hafalan',
			icon: 'M4 17l5-5 4 4 7-7',
			feature: 'raport'
		},
		{
			label: 'Rapor Hafalan',
			href: '/tpq/hafalan-rapor',
			icon: 'M5 4h10l4 4v12H5V4zm10 0v5h5M8 12h8M8 16h5',
			feature: 'raport'
		},
		{
			label: 'Rekap Rapor',
			href: '/tpq/rapor-rekap',
			icon: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
			feature: 'raport'
		},
		{
			label: 'Sertifikat',
			href: '/dashboard/sertifikat',
			icon: 'M8 5h8l3 3v11a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z',
			feature: 'raport'
		}
	];

	const educationalTeacherItems: MenuItem[] = [
		{
			label: 'Akademik',
			href: '/tpq/akademik/setoran',
			icon: 'M3.5 7.5l8.5-4 8.5 4-8.5 4-8.5-4zm1.5 5.5l7 3.25 7-3.25v5.5l-7 3.25-7-3.25v-5.5z',
			feature: 'setoran'
		},
		learnItem,
		{
			label: 'Riwayat Setoran',
			href: '/tpq/akademik/riwayat',
			icon: 'M4 6h16M4 12h16M4 18h10',
			feature: 'setoran'
		},
		{
			label: 'Kelola Santri',
			href: '/dashboard/kelola-santri',
			icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z'
		},
		{
			label: 'Pencapaian',
			href: '/dashboard/pencapaian-hafalan',
			icon: 'M4 17l5-5 4 4 7-7',
			feature: 'raport'
		},
		{
			label: 'Rapor Hafalan',
			href: '/tpq/hafalan-rapor',
			icon: 'M5 4h10l4 4v12H5V4zm10 0v5h5M8 12h8M8 16h5',
			feature: 'raport'
		},
		{
			label: 'Sertifikat',
			href: '/dashboard/sertifikat',
			icon: 'M8 5h8l3 3v11a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z',
			feature: 'raport'
		}
	];

	const educationalCoordinatorItems: MenuItem[] = [
		learnItem,
		{
			label: 'Review Setoran',
			href: '/tpq/akademik/review',
			icon: 'M5 12l5 5L20 7',
			feature: 'setoran'
		},
		{
			label: 'Riwayat Setoran',
			href: '/tpq/akademik/riwayat',
			icon: 'M4 6h16M4 12h16M4 18h10',
			feature: 'setoran'
		},
		{
			label: 'Pencapaian',
			href: '/dashboard/pencapaian-hafalan',
			icon: 'M4 17l5-5 4 4 7-7',
			feature: 'raport'
		},
		{
			label: 'Rekap Rapor',
			href: '/tpq/rapor-rekap',
			icon: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
			feature: 'raport'
		}
	];

	const educationalStudentItems: MenuItem[] = [
		learnItem,
		{
			label: "Muroja'ah",
			href: '/dashboard/hafalan-mandiri',
			icon: 'M6 4h9l3 3v13a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zm8 0v4h4',
			feature: 'hafalan'
		},
		{
			label: 'Riwayat Setoran',
			href: '/tpq/akademik/riwayat',
			icon: 'M4 12h16M4 6h16M4 18h10',
			feature: 'setoran'
		},
		{
			label: 'Pencapaian',
			href: '/dashboard/pencapaian-hafalan',
			icon: 'M4 17l5-5 4 4 7-7',
			feature: 'raport'
		},
		{
			label: 'Rapor Hafalan',
			href: '/dashboard/rapor-hafalan',
			icon: 'M5 4h10l4 4v12H5V4zm10 0v5h5M8 12h8M8 16h5',
			feature: 'raport'
		},
		{
			label: 'Belum Lancar',
			href: '/dashboard/hafalan-belum-lancar',
			icon: 'M12 8v5m0 4h.01M10.29 3.86l-7.4 12.8A1 1 0 003.75 18h16.5a1 1 0 00.86-1.34l-7.4-12.8a1 1 0 00-1.72 0z',
			feature: 'hafalan'
		}
	];

	const communityManagerItems: MenuItem[] = [
		{
			label: 'Keuangan',
			href: '/keuangan',
			icon: 'M4 7h16M4 12h10M4 17h7M15 12h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z',
			feature: 'kas_masjid'
		},
		{
			label: 'Kelola Jamaah',
			href: '/dashboard/kelola-santri',
			icon: 'M7 11a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zm-4 10a6.5 6.5 0 0113 0H3z'
		},
		{
			label: 'Jadwal',
			href: '/dashboard/jadwal',
			icon: 'M7 2v4M17 2v4M3 8h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
			feature: 'jadwal_kegiatan'
		},
		{
			label: 'Aset',
			href: '/dashboard/kelola-aset',
			icon: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5z',
			feature: 'kas_masjid'
		}
	];
	const communityMemberItems: MenuItem[] = [
		{
			label: 'Kalender',
			href: '/kalender',
			icon: 'M7 2v4M17 2v4M3 8h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
			feature: 'kalender'
		}
	];
	const bookAccessItems: MenuItem[] = [
		{
			label: 'Baca Buku',
			href: '/buku',
			icon: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M6.5 19A2.5 2.5 0 014 16.5'
		},
		{
			label: 'Studio Penulis',
			href: '/buku/studio',
			icon: 'M4 19.5V5a2 2 0 012-2h9l5 5v11.5M14 3v6h6M8 13h8M8 17h5'
		},
		{
			label: 'Saldo Coin',
			href: '/coins',
			icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 5v8m-3-4h6'
		},
		{
			label: 'Topup Coin',
			href: '/coins/topup',
			icon: 'M12 5v14M5 12h14M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z'
		},
		{
			label: 'Royalti Saya',
			href: '/buku/studio/earnings',
			icon: 'M4 19h16M7 16V8m5 8V5m5 11v-6M5 19h14'
		}
	];
	const superAdminItems: MenuItem[] = [
		{
			label: 'Moderasi Buku',
			href: '/admin/super/buku',
			icon: 'M5 4.5h11a2 2 0 012 2V19a1 1 0 01-1.6.8L12 16.5l-4.4 3.3A1 1 0 016 19V6.5a2 2 0 012-2z'
		},
		{
			label: 'Laporan Royalti',
			href: '/admin/super/buku/royalties',
			icon: 'M4 19h16M7 16V8m5 8V5m5 11v-6M5 19h14'
		},
		{
			label: 'Kelola Topup',
			href: '/admin/super/coin-topups',
			icon: 'M4 7h16M4 12h10M4 17h7M15 12h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z'
		},
		{
			label: 'CMS',
			href: '/admin/posts',
			icon: 'M5 4.5h11a2 2 0 012 2V19a1 1 0 01-1.6.8L12 16.5l-4.4 3.3A1 1 0 016 19V6.5a2 2 0 012-2z'
		},
		{
			label: 'Licenses',
			href: '/admin/licenses',
			icon: 'M4 7.5V6a2 2 0 012-2h12a2 2 0 012 2v1.5M3 9.5h18v8.5a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5zm6 4.5h6'
		},
		{
			label: 'Generate License',
			href: '/admin/licenses/generate',
			icon: 'M12 5v14m-7-7h14M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z'
		}
	];

	const footerItems: MenuItem[] = [
		{
			label: 'Settings',
			href: '/akun',
			icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z'
		}
	];

	const featureAllowed = (item: MenuItem) => !item.feature || Boolean(featureAccess[item.feature]);

	const resolveRoleItems = () => {
		if (!hasOrg) return [];
		if (isCommunityOrg) {
			if (role === 'admin' || role === 'tamir' || role === 'bendahara') {
				return communityManagerItems;
			}
			return communityMemberItems;
		}

		if (role === 'admin') return educationalAdminItems;
		if (isMentoringRole(role)) return educationalCoordinatorItems;
		if (isTeachingRole(role)) return educationalTeacherItems;
		if (role === 'santri' || role === 'alumni') return educationalStudentItems;
		return [];
	};

	let roleItems: MenuItem[] = [];
	let menuItems: MenuItem[] = [];
	let dashboardShellMenuItems: MenuItem[] = [];
	let mobileQuickItems: MenuItem[] = [];
	$: {
		isDashboardRoute = $page.url.pathname === '/dashboard';
		role = data?.user?.role ?? '';
		orgType = data?.org?.type ?? null;
		isCommunityOrg = orgType === 'masjid' || orgType === 'musholla';
		hasOrg = Boolean(data?.org);
		isSuperAdmin = isSuperAdminUser(data?.user);
		isImpersonating = isImpersonatingUser(data?.user);
		featureAccess = (data?.featureAccess ?? {}) as Record<string, boolean>;
		const roleKey = isSuperAdmin && !isImpersonating ? 'SUPER_ADMIN' : role;
		orgLabel =
			isSuperAdmin && !isImpersonating
				? 'System'
				: orgType
					? (orgLabelMap[orgType] ?? orgType)
					: 'Lembaga';
		roleLabel = roleLabelMap[roleKey] ?? 'Pengguna';
		headerTitle =
			isSuperAdmin && !isImpersonating
				? 'Panel Super Admin'
				: orgType === 'tpq'
					? 'Dashboard TPQ'
					: orgType === 'pondok'
						? 'Dashboard Pondok'
						: orgType === 'masjid'
							? 'Dashboard Masjid'
							: orgType === 'musholla'
								? 'Dashboard Musholla'
								: orgType === 'rumah-tahfidz'
									? 'Dashboard Rumah Tahfidz'
									: 'Dashboard Lembaga';

		roleItems = resolveRoleItems().filter(featureAllowed);
		const configuredMenu = ((data?.appMenu ?? []) as MenuItem[]).filter(Boolean);
		const primaryItems: MenuItem[] = isImpersonating
			? [
					{
						label: 'Dashboard',
						href: '/dashboard',
						icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z'
					},
					{
						label: 'Super Admin',
						href: '/admin/super/overview',
						icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z'
					}
				]
			: [
					{
						label: isSuperAdmin ? 'Super Admin' : 'Dashboard',
						href: isSuperAdmin ? '/admin/super/overview' : '/dashboard',
						icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z'
					},
					{
						label: 'Lembaga',
						href: '/lembaga',
						icon: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5zM8 20v-6h8v6'
					},
					{
						label: 'Addon',
						href: '/addon',
						icon: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z'
					}
				];
		const utilityItems = isSuperAdmin ? superAdminItems : [];
		menuItems = configuredMenu.length
			? configuredMenu
			: isImpersonating
				? [...primaryItems, ...bookAccessItems, ...utilityItems, ...roleItems, ...footerItems]
				: [
						...primaryItems,
						...bookAccessItems,
						...(isSuperAdmin ? utilityItems : roleItems),
						...footerItems
					];
		dashboardShellMenuItems = [
			{ label: 'Dashboard', href: '/dashboard', icon: dashboardIconPaths.dashboard },
			...menuItems.filter((item) => item.href !== '/dashboard')
		];
		const dashboardItem = menuItems.find((item) => item.href === '/dashboard') ?? primaryItems[0];
		const socialItem = menuItems.find((item) => item.href === '/beranda');
		const lembagaItem = menuItems.find((item) => item.href === '/lembaga');
		const accountItem = menuItems.find((item) => item.href === '/akun') ?? footerItems[0];
		mobileQuickItems = [
			{ ...dashboardItem, label: isSuperAdmin ? 'Admin' : 'Dashboard' },
			...(lembagaItem ? [{ ...lembagaItem, label: 'Lembaga' }] : []),
			...(socialItem ? [{ ...socialItem, label: 'Sosial' }] : []),
			{ ...accountItem, label: 'Akun' }
		].slice(0, 5);
	}

	let sidebarOpen = false;
	let desktopSidebarCollapsed = false;

	const isActive = (item: MenuItem) => {
		const path = $page.url.pathname;
		if (item.href === '/buku') {
			return path === '/buku' || (path.startsWith('/buku/') && !path.startsWith('/buku/studio'));
		}
		return path === item.href || path.startsWith(`${item.href}/`);
	};

	const displayName = data?.user?.username || data?.user?.email || 'Guest';
	const displayInitials =
		displayName
			.split(/[\s@._-]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || 'SO';
</script>

{#if isDashboardRoute}
	<div
		class="dashboard-app-shell min-h-screen bg-so-cream text-so-ink lg:grid"
		class:lg:grid-cols-[276px_minmax(0,1fr)]={!desktopSidebarCollapsed}
		class:lg:grid-cols-[72px_minmax(0,1fr)]={desktopSidebarCollapsed}
	>
		<aside
			class="hidden min-h-screen bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white transition-all duration-300 lg:sticky lg:top-0 lg:flex lg:flex-col"
			class:lg:w-[276px]={!desktopSidebarCollapsed}
			class:lg:w-[72px]={desktopSidebarCollapsed}
			class:lg:px-3={desktopSidebarCollapsed}
		>
			<button
				class="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-so-green text-white shadow-lg transition-all hover:bg-so-green-2 lg:flex"
				on:click={() => (desktopSidebarCollapsed = !desktopSidebarCollapsed)}
				aria-label={desktopSidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
			>
				<svg
					class="h-3 w-3 transition-transform duration-300"
					class:rotate-180={desktopSidebarCollapsed}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M15 18l-6-6 6-6" />
				</svg>
			</button>
			<a href="/dashboard" class="flex items-center gap-3" class:justify-center={desktopSidebarCollapsed}>
				<img src={santriOnlineIconUrl} alt="SantriOnline" class="h-11 w-11 object-contain" />
				{#if !desktopSidebarCollapsed}
					<div>
						<p class="font-display text-xl font-bold leading-none">SantriOnline</p>
						<p class="text-xs font-semibold text-white/65">{roleLabel}</p>
					</div>
				{/if}
			</a>

			<div class="mt-8 rounded-xl border border-white/10 bg-white/8 p-3" class:flex={desktopSidebarCollapsed} class:justify-center={desktopSidebarCollapsed}>
				<div class="flex items-center gap-3" class:flex-col={desktopSidebarCollapsed} class:gap-0={desktopSidebarCollapsed}>
					<div
						class="grid h-11 w-11 place-items-center rounded-lg bg-so-cream text-xs font-black text-so-green"
					>
						{displayInitials}
					</div>
					{#if !desktopSidebarCollapsed}
						<div class="min-w-0">
							<p class="truncate text-sm font-bold">{displayName}</p>
							<p class="mt-0.5 text-xs text-white/60">{roleLabel.toUpperCase()} · {orgLabel}</p>
						</div>
					{/if}
				</div>
			</div>

			<nav class="mt-6 grid gap-1.5">
				{#each dashboardShellMenuItems as item}
					<a
						href={item.href}
						class={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
							isActive(item)
								? 'bg-so-gold/24 text-white ring-1 ring-so-gold/30'
								: 'text-white/78 hover:bg-white/10 hover:text-white'
						}`}
						class:justify-center={desktopSidebarCollapsed}
						class:px-2={desktopSidebarCollapsed}
						title={desktopSidebarCollapsed ? item.label : ''}
						aria-current={isActive(item) ? 'page' : undefined}
					>
						<span
							class={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition duration-200 motion-safe:group-hover:-translate-y-0.5 group-hover:shadow-lg ${sidebarIconTone(item)} ${
								isActive(item) ? 'ring-2 ring-so-gold/80 shadow-so-gold/20' : ''
							}`}
						>
							<svg
								class="h-[18px] w-[18px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.9"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d={item.icon} />
							</svg>
						</span>
						{#if !desktopSidebarCollapsed}
							<span class="min-w-0 truncate">{item.label}</span>
						{/if}
					</a>
				{/each}
			</nav>

			<div class="mt-auto rounded-xl border border-so-gold/45 bg-so-green-3/55 p-4" class:flex={desktopSidebarCollapsed} class:justify-center={desktopSidebarCollapsed} class:p-3={desktopSidebarCollapsed}>
				<div class="flex items-start gap-3" class:flex-col={desktopSidebarCollapsed} class:items-center={desktopSidebarCollapsed} class:gap-2={desktopSidebarCollapsed}>
					<span class="grid h-9 w-9 place-items-center rounded-lg bg-so-gold text-so-green" class:h-8={desktopSidebarCollapsed} class:w-8={desktopSidebarCollapsed}>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d={dashboardIconPaths.sparkles} />
						</svg>
					</span>
					{#if !desktopSidebarCollapsed}
						<div>
							<p class="font-display text-base font-bold">Control Center</p>
							<p class="mt-1 text-xs leading-5 text-white/67">
								Tampilan mengikuti izin {roleLabel} di {orgLabel}. Tidak mengubah permission akun.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</aside>

		{#if sidebarOpen}
			<div class="fixed inset-0 z-50 lg:hidden">
				<button
					class="absolute inset-0 bg-slate-950/45"
					type="button"
					aria-label="Tutup menu"
					on:click={() => (sidebarOpen = false)}
				></button>
				<aside
					class="relative h-full w-[286px] overflow-y-auto bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white shadow-2xl"
				>
					<div class="flex items-center justify-between">
						<a
							href="/dashboard"
							class="flex items-center gap-3"
							on:click={() => (sidebarOpen = false)}
						>
							<img src={santriOnlineIconUrl} alt="SantriOnline" class="h-10 w-10 object-contain" />
							<div>
								<p class="font-display text-lg font-bold leading-none">SantriOnline</p>
								<p class="text-xs text-white/65">{roleLabel}</p>
							</div>
						</a>
						<button
							class="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10"
							type="button"
							aria-label="Tutup menu"
							on:click={() => (sidebarOpen = false)}
						>
							×
						</button>
					</div>
					<nav class="mt-6 grid gap-1.5">
						{#each dashboardShellMenuItems as item}
							<a
								href={item.href}
								class={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
									isActive(item) ? 'bg-so-gold/24 text-white' : 'text-white/78'
								}`}
								on:click={() => (sidebarOpen = false)}
								aria-current={isActive(item) ? 'page' : undefined}
							>
								<span
									class={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 ${sidebarIconTone(item)} ${
										isActive(item) ? 'ring-2 ring-so-gold/80 shadow-so-gold/20' : ''
									}`}
								>
									<svg
										class="h-[18px] w-[18px]"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.9"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d={item.icon} />
									</svg>
								</span>
								<span class="min-w-0 truncate">{item.label}</span>
							</a>
						{/each}
					</nav>
				</aside>
			</div>
		{/if}

		<main class="min-w-0 pb-8">
			<header
				class="sticky top-0 z-30 border-b border-so-border/70 bg-so-cream/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8"
			>
				<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div class="flex items-center gap-3">
						<button
							class="grid h-10 w-10 place-items-center rounded-xl border border-so-border bg-white text-so-green shadow-sm lg:hidden"
							type="button"
							aria-label="Buka menu"
							on:click={() => (sidebarOpen = true)}
						>
							☰
						</button>
						<div>
							<h1 class="font-display text-2xl font-bold tracking-tight text-so-green md:text-3xl">
								Dashboard
							</h1>
							<p class="mt-1 text-sm text-so-muted">Beranda ringkasan aktivitas lembaga</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<div class="relative min-w-[240px] flex-1 sm:min-w-[320px] xl:w-[360px] xl:flex-none">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-so-muted">
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d={dashboardIconPaths.search} />
								</svg>
							</span>
							<input
								class="so-focus h-11 w-full rounded-xl border border-so-border bg-white/90 pl-9 pr-4 text-sm shadow-sm"
								placeholder="Cari menu, lembaga, atau aktivitas..."
								aria-label="Pencarian cepat dashboard"
								readonly
							/>
						</div>
						<div class="min-w-0 max-w-[min(72vw,22rem)] sm:max-w-[20rem]">
							<LembagaSwitcher
								lembagaList={data?.lembagaList ?? []}
								fallbackLembaga={data?.org ?? null}
								currentUser={data?.user ?? null}
							/>
						</div>
						<a
							href="/akun"
							class="flex items-center gap-3 rounded-xl border border-so-border bg-white px-3 py-2 shadow-sm"
						>
							<div
								class="grid h-9 w-9 place-items-center rounded-full bg-so-green text-sm font-black text-white"
							>
								{displayInitials}
							</div>
							<div class="hidden sm:block">
								<p class="max-w-[140px] truncate text-sm font-bold text-so-ink">{displayName}</p>
								<p class="text-xs text-so-muted">{roleLabel}</p>
							</div>
						</a>
					</div>
				</div>
			</header>

			<div class="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
				{#if isImpersonating}
					<div
						class="mb-5 flex min-w-0 flex-col gap-3 rounded-xl border border-so-gold/45 bg-so-gold/12 px-4 py-3.5 text-sm text-so-green shadow-sm md:flex-row md:items-center md:justify-between md:py-4"
					>
						<div class="min-w-0">
							<p class="font-semibold">Mode Admin Lembaga Aktif</p>
							<p class="mt-1 break-words text-xs leading-relaxed text-so-green/80 md:text-sm">
								Akses dashboard organisasi sedang aktif, tetapi menu super admin dan license tetap
								tersedia.
							</p>
						</div>
						<div class="flex shrink-0 flex-wrap gap-2">
							<a
								href="/admin/super/overview"
								class="inline-flex items-center justify-center rounded-xl border border-so-gold/60 px-3 py-2 text-xs font-semibold text-so-green transition-colors hover:bg-so-gold/20"
								style="min-height: 36px;"
							>
								Buka Super Admin
							</a>
							<a
								href="/admin/super/impersonate/stop"
								class="inline-flex items-center justify-center rounded-xl bg-so-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-so-green-2"
								style="min-height: 36px;"
							>
								Keluar Mode Admin
							</a>
						</div>
					</div>
				{/if}
				<slot />
			</div>
		</main>
	</div>
{:else}
	<div
		class="app-shell relative min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-teal-50 to-amber-50 text-slate-900"
	>
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl"></div>
			<div
				class="absolute -right-10 top-40 h-64 w-64 rounded-full bg-amber-200/50 blur-[90px]"
			></div>
			<div
				class="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-cyan-200/40 blur-[110px]"
			></div>
		</div>

		<div class="relative flex min-h-screen w-full max-w-full overflow-x-hidden">
			<aside
				class="hidden w-64 shrink-0 flex-col border-r border-white/70 bg-white/70 px-4 py-6 shadow-xl backdrop-blur xl:w-72 xl:px-5 md:flex"
			>
				<div class="flex items-center justify-between gap-2">
					<div class="min-w-0">
						<p class="app-title truncate text-xl font-semibold">SantriOnline</p>
						<p class="truncate text-xs uppercase tracking-[0.3em] text-slate-500">
							Institution Hub
						</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-semibold text-teal-700"
					>
						{orgLabel}
					</span>
				</div>

				<nav class="mt-8 space-y-1.5">
					{#each menuItems as item, idx}
						<a
							href={item.href}
							class="fade-in flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm"
							class:bg-emerald-100={isActive(item)}
							class:text-emerald-600={isActive(item)}
							class:shadow-sm={isActive(item)}
							class:font-semibold={isActive(item)}
							style={`animation-delay: ${idx * 50}ms;`}
						>
							<svg
								class="h-5 w-5 shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d={item.icon} />
							</svg>
							<span class="min-w-0 truncate">{item.label}</span>
						</a>
					{/each}
				</nav>

				<div
					class="mt-auto rounded-xl px-3 py-3 text-xs leading-relaxed"
					style="border: 1px solid var(--app-warm-soft); background: var(--app-warm-wash); color: var(--app-warm);"
				>
					<p class="font-semibold">Akses Role</p>
					<p class="mt-1.5 break-words">
						{#if isImpersonating}
							Super admin sedang memakai konteks admin {orgLabel} tanpa kehilangan akses global.
						{:else}
							Menu ditampilkan sesuai peran {roleLabel} di {orgLabel}.
						{/if}
					</p>
				</div>
			</aside>

			<div class="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
				<header
					class="sticky top-0 z-20 flex w-full max-w-full items-center justify-between gap-2 border-b border-white/70 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4 md:px-6 xl:px-8"
				>
					<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
						<button
							class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100 md:hidden"
							on:click={() => (sidebarOpen = true)}
							aria-label="Open navigation"
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M4 6h16M4 12h16M4 18h10" />
							</svg>
						</button>
						<div class="min-w-0 flex-1 sm:flex-initial">
							<p class="truncate text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:text-xs">
								Dashboard
							</p>
							<h1
								class="app-title truncate text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl"
							>
								{headerTitle}
							</h1>
						</div>
					</div>

					<div class="flex min-w-0 shrink-0 items-center gap-2">
						<div class="min-w-0 max-w-[40vw] sm:max-w-[min(50vw,18rem)] md:max-w-[20rem]">
							<LembagaSwitcher
								lembagaList={data?.lembagaList ?? []}
								fallbackLembaga={data?.org ?? null}
								currentUser={data?.user ?? null}
							/>
						</div>
						<div
							class="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 lg:block"
						>
							{displayName}
						</div>
						<button
							class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
							aria-label="Buka menu akun"
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M6 9l6 6 6-6" />
							</svg>
						</button>
					</div>
				</header>

				<main
					class="min-w-0 flex-1 overflow-x-hidden px-3 py-5 pb-20 sm:px-4 sm:py-6 md:px-6 md:pb-6 xl:px-8 2xl:px-10"
				>
					{#if isImpersonating}
						<div
							class="mb-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 shadow-sm md:flex-row md:items-center md:justify-between md:py-4"
						>
							<div class="min-w-0">
								<p class="font-semibold">Mode Admin Lembaga Aktif</p>
								<p class="mt-1 break-words text-xs leading-relaxed text-amber-800/90 md:text-sm">
									Akses dashboard organisasi sedang aktif, tetapi menu super admin dan license tetap
									tersedia.
								</p>
							</div>
							<div class="flex shrink-0 flex-wrap gap-2">
								<a
									href="/admin/super/overview"
									class="inline-flex items-center justify-center rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 active:bg-amber-200"
									style="min-height: 36px;"
								>
									Buka Super Admin
								</a>
								<a
									href="/admin/super/impersonate/stop"
									class="inline-flex items-center justify-center rounded-xl bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-950 active:bg-amber-950"
									style="min-height: 36px;"
								>
									Keluar Mode Admin
								</a>
							</div>
						</div>
					{/if}
					<slot />
				</main>
			</div>
		</div>

		<nav
			class="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-hidden border-t border-white/70 bg-white/95 shadow-[0_-6px_24px_rgba(15,118,110,0.12)] backdrop-blur-sm md:hidden safe-area-bottom"
		>
			<div class="flex w-full min-w-0 items-center justify-around gap-1 px-2 py-2 pb-safe sm:gap-2">
				{#each mobileQuickItems as item}
					<a
						href={item.href}
						class="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs text-slate-600 transition-all duration-200 active:scale-95"
						class:text-emerald-600={isActive(item)}
						class:font-semibold={isActive(item)}
						class:bg-emerald-50={isActive(item)}
						style="min-height: 44px;"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							class="h-6 w-6 shrink-0"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span class="max-w-full truncate text-[10px] leading-tight">{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>

		{#if sidebarOpen}
			<div class="fixed inset-0 z-40 md:hidden">
				<div
					class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
					role="button"
					tabindex="0"
					on:click={() => (sidebarOpen = false)}
					on:keydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') sidebarOpen = false;
					}}
					aria-label="Tutup navigasi"
				></div>
				<aside
					class="absolute left-0 top-0 h-full w-[min(18rem,85vw)] max-w-full overflow-y-auto bg-white px-5 py-6 shadow-2xl"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="min-w-0">
							<p class="app-title truncate text-lg font-semibold">SantriOnline</p>
							<p class="truncate text-[10px] uppercase tracking-[0.3em] text-slate-500">Menu</p>
						</div>
						<button
							class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-colors hover:bg-slate-50 active:bg-slate-100"
							on:click={() => (sidebarOpen = false)}
							aria-label="Close navigation"
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M6 6l12 12M18 6l-12 12" />
							</svg>
						</button>
					</div>

					<nav class="mt-6 space-y-1.5">
						{#each menuItems as item, idx}
							<a
								href={item.href}
								class="fade-in flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98]"
								class:bg-emerald-100={isActive(item)}
								class:text-emerald-600={isActive(item)}
								class:shadow-sm={isActive(item)}
								class:font-semibold={isActive(item)}
								style={`animation-delay: ${idx * 50}ms; min-height: 44px;`}
								on:click={() => (sidebarOpen = false)}
							>
								<svg
									class="h-5 w-5 shrink-0"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d={item.icon} />
								</svg>
								<span class="min-w-0 truncate">{item.label}</span>
							</a>
						{/each}
					</nav>

					<div
						class="mt-6 rounded-xl px-3 py-3 text-xs leading-relaxed"
						style="border: 1px solid var(--app-accent-soft); background: var(--app-accent-wash); color: var(--app-accent);"
					>
						<p class="font-semibold">Role Aktif</p>
						<p class="mt-1.5 break-words">{roleLabel} • {orgLabel}</p>
					</div>
				</aside>
			</div>
		{/if}
	</div>
{/if}


<style>
	:global(:root) {
		--app-accent: #0f766e;
		--app-accent-soft: #ccfbf1;
		--app-accent-wash: #f0fdfa;
		--app-warm: #b45309;
		--app-warm-soft: #fef3c7;
		--app-warm-wash: #fffbeb;
	}

	:global(.app-shell) {
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	:global(.app-title) {
		font-family: Georgia, 'Times New Roman', serif;
		letter-spacing: 0.02em;
	}

	:global(.fade-in) {
		animation: fade-in 0.5s ease both;
	}

	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}

	.pb-safe {
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
