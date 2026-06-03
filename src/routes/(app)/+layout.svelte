<script lang="ts">
	import { page } from '$app/stores';
	import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
	import LembagaSwitcher from '$lib/components/LembagaSwitcher.svelte';
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

	type MenuItem = {
		label: string;
		href: string;
		icon: string;
		description?: string;
		feature?: FeatureKey;
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

	const featureAllowed = (item: MenuItem) =>
		!item.feature || Boolean(featureAccess[item.feature]);

	const resolveRoleItems = () => {
		if (!hasOrg) return [];
		if (isCommunityOrg) {
			if (role === 'admin' || role === 'tamir' || role === 'bendahara') {
				return communityManagerItems;
			}
			return communityMemberItems;
		}

		if (role === 'admin') return educationalAdminItems;
		if (role === 'koordinator') return educationalCoordinatorItems;
		if (role === 'ustadz' || role === 'ustadzah') return educationalTeacherItems;
		if (role === 'santri' || role === 'alumni') return educationalStudentItems;
		return [];
	};

	let roleItems: MenuItem[] = [];
	let menuItems: MenuItem[] = [];
	let mobileQuickItems: MenuItem[] = [];
	$: {
		role = data?.user?.role ?? '';
		orgType = data?.org?.type ?? null;
		isCommunityOrg = orgType === 'masjid' || orgType === 'musholla';
		hasOrg = Boolean(data?.org);
		isSuperAdmin = isSuperAdminUser(data?.user);
		isImpersonating = isImpersonatingUser(data?.user);
		featureAccess = (data?.featureAccess ?? {}) as Record<string, boolean>;
		const roleKey = isSuperAdmin && !isImpersonating ? 'SUPER_ADMIN' : role;
		orgLabel =
			isSuperAdmin && !isImpersonating ? 'System' : orgType ? orgLabelMap[orgType] ?? orgType : 'Lembaga';
		roleLabel = roleLabelMap[roleKey] ?? 'Pengguna';
		headerTitle = isSuperAdmin && !isImpersonating
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
				: [...primaryItems, ...bookAccessItems, ...(isSuperAdmin ? utilityItems : roleItems), ...footerItems];
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

	const isActive = (item: MenuItem) => {
		const path = $page.url.pathname;
		if (item.href === '/buku') {
			return path === '/buku' || (path.startsWith('/buku/') && !path.startsWith('/buku/studio'));
		}
		return path === item.href || path.startsWith(`${item.href}/`);
	};

	const displayName = data?.user?.username || data?.user?.email || 'Guest';
</script>

<div class="app-shell relative min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-teal-50 to-amber-50 text-slate-900">
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl"></div>
		<div class="absolute -right-10 top-40 h-64 w-64 rounded-full bg-amber-200/50 blur-[90px]"></div>
		<div class="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-cyan-200/40 blur-[110px]"></div>
	</div>

	<div class="relative flex min-h-screen w-full max-w-full overflow-x-hidden">
		<aside class="hidden w-64 shrink-0 flex-col border-r border-white/70 bg-white/70 px-4 py-6 shadow-xl backdrop-blur xl:w-72 xl:px-5 md:flex">
			<div class="flex items-center justify-between gap-2">
				<div class="min-w-0">
					<p class="app-title truncate text-xl font-semibold">SantriOnline</p>
					<p class="truncate text-xs uppercase tracking-[0.3em] text-slate-500">Institution Hub</p>
				</div>
				<span class="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-semibold text-teal-700">
					{orgLabel}
				</span>
			</div>

			<nav class="mt-8 space-y-1.5">
				{#each menuItems as item, idx}
					<a
						href={item.href}
						class="fade-in flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-sm"
						class:bg-emerald-100={isActive(item)}
						class:text-emerald-900={isActive(item)}
						class:shadow-sm={isActive(item)}
						class:font-semibold={isActive(item)}
						style={`animation-delay: ${idx * 50}ms;`}
					>
						<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
			<header class="sticky top-0 z-20 flex w-full max-w-full items-center justify-between gap-2 border-b border-white/70 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4 md:px-6 xl:px-8">
				<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
					<button
						class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100 md:hidden"
						on:click={() => (sidebarOpen = true)}
						aria-label="Open navigation"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 6h16M4 12h16M4 18h10" />
						</svg>
					</button>
					<div class="min-w-0 flex-1 sm:flex-initial">
						<p class="truncate text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:text-xs">Dashboard</p>
						<h1 class="app-title truncate text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">{headerTitle}</h1>
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
					<div class="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 lg:block">
						{displayName}
					</div>
					<button
						class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
						aria-label="Buka menu akun"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</button>
				</div>
			</header>

			<main class="min-w-0 flex-1 overflow-x-hidden px-3 py-5 pb-20 sm:px-4 sm:py-6 md:px-6 md:pb-6 xl:px-8 2xl:px-10">
				{#if isImpersonating}
					<div class="mb-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 shadow-sm md:flex-row md:items-center md:justify-between md:py-4">
						<div class="min-w-0">
							<p class="font-semibold">Mode Admin Lembaga Aktif</p>
							<p class="mt-1 break-words text-xs leading-relaxed text-amber-800/90 md:text-sm">Akses dashboard organisasi sedang aktif, tetapi menu super admin dan license tetap tersedia.</p>
						</div>
						<div class="flex shrink-0 flex-wrap gap-2">
							<a href="/admin/super/overview" class="inline-flex items-center justify-center rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 active:bg-amber-200" style="min-height: 36px;">
								Buka Super Admin
							</a>
							<a href="/admin/super/impersonate/stop" class="inline-flex items-center justify-center rounded-xl bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-950 active:bg-amber-950" style="min-height: 36px;">
								Keluar Mode Admin
							</a>
						</div>
					</div>
				{/if}
				<slot />
			</main>
		</div>
	</div>

	<nav class="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-hidden border-t border-white/70 bg-white/95 shadow-[0_-6px_24px_rgba(15,118,110,0.12)] backdrop-blur-sm md:hidden safe-area-bottom">
		<div class="flex w-full min-w-0 items-center justify-around gap-1 px-2 py-2 pb-safe sm:gap-2">
			{#each mobileQuickItems as item}
				<a
					href={item.href}
					class="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs text-slate-600 transition-all duration-200 active:scale-95"
					class:text-emerald-700={isActive(item)}
					class:font-semibold={isActive(item)}
					class:bg-emerald-50={isActive(item)}
					style="min-height: 44px;"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" stroke-width="2">
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
			<aside class="absolute left-0 top-0 h-full w-[min(18rem,85vw)] max-w-full overflow-y-auto bg-white px-5 py-6 shadow-2xl">
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
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 6l12 12M18 6l-12 12" />
						</svg>
					</button>
				</div>

				<nav class="mt-6 space-y-1.5">
					{#each menuItems as item, idx}
						<a
							href={item.href}
							class="fade-in flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]"
							class:bg-emerald-100={isActive(item)}
							class:text-emerald-900={isActive(item)}
							class:shadow-sm={isActive(item)}
							class:font-semibold={isActive(item)}
							style={`animation-delay: ${idx * 50}ms; min-height: 44px;`}
							on:click={() => (sidebarOpen = false)}
						>
							<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
		font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
