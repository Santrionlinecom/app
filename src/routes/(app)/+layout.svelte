<script lang="ts">
	import { page } from '$app/stores';
	import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
	import LembagaSwitcher from '$lib/components/LembagaSwitcher.svelte';
	import {
		APP_HOME_HREF,
		APP_NAV_GROUP_META,
		findNavLabel,
		getMobilePrimaryNav,
		groupAppNavigation,
		type AppNavigationGroupKey,
		type AppNavigationItem
	} from '$lib/config/app-navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const santriOnlineIconUrl =
		'https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png';

	const iconPaths = {
		dashboard: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z',
		search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
		sparkles:
			'M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.5 10.3 11 6 9.3l4.3-1.7L12 3Zm6 10 1 2.6 2.5 1-2.5 1-1 2.4-1-2.4-2.5-1 2.5-1 1-2.6ZM5 13l.8 2.1L8 16l-2.2.9L5 19l-.8-2.1L2 16l2.2-.9L5 13Z',
		chevron: 'M9 18l6-6-6-6',
		logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
		user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z',
		settings:
			'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z',
		building: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5zM8 20v-6h8v6',
		shield: 'M12 3l7 3v5c0 4.4-2.8 8.4-7 10-4.2-1.6-7-5.6-7-10V6l7-3z',
		coins: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 5v8m-3-4h6',
		habit: 'M5 12l5 5L20 7'
	};

	const orgLabelMap: Record<string, string> = {
		pondok: 'Pondok',
		tpq: 'TPQ',
		'rumah-tahfidz': 'Rumah Tahfidz',
		masjid: 'Masjid',
		musholla: 'Musholla'
	};

	const roleLabelMap: Record<string, string> = {
		SUPER_ADMIN: 'Super Admin',
		super_admin: 'Super Admin',
		admin: 'Admin',
		kepala_tpq: 'Kepala TPQ',
		kepala_tahfidz: 'Kepala Tahfidz',
		koordinator: 'Koordinator',
		wali_kelas: 'Wali Kelas',
		pengasuh: 'Pengasuh',
		musyrif: 'Musyrif',
		ustadz: 'Guru',
		ustadzah: 'Guru',
		santri: 'Santri',
		alumni: 'Alumni',
		wali: 'Wali',
		jamaah: 'Jamaah',
		ketua_takmir: "Ketua Ta'mir",
		takmir: "Ta'mir",
		tamir: "Ta'mir",
		imam: 'Imam',
		khotib: 'Khotib',
		muadzin: 'Muadzin',
		operator: 'Operator',
		bendahara: 'Bendahara'
	};

	let sidebarOpen = false;
	let desktopSidebarCollapsed = false;
	let profileMenuOpen = false;
	let openGroups: Record<string, boolean> = {};

	$: role = data?.user?.role ?? '';
	$: orgType = data?.org?.type ?? null;
	$: isSuperAdmin = isSuperAdminUser(data?.user);
	$: isImpersonating = isImpersonatingUser(data?.user);
	$: orgLabel =
		isSuperAdmin && !isImpersonating
			? 'System'
			: orgType
				? (orgLabelMap[orgType] ?? orgType)
				: 'Lembaga';
	$: roleKey = isSuperAdmin && !isImpersonating ? 'SUPER_ADMIN' : role;
	$: roleLabel = roleLabelMap[roleKey] ?? 'Pengguna';
	$: displayName = data?.user?.username || data?.user?.email || 'Pengguna';
	$: displayEmail = data?.user?.email || '';
	$: coinBalance = Number((data as any)?.coinBalance ?? 0);
	$: coinBalanceLabel = coinBalance.toLocaleString('id-ID');
	$: displayInitials =
		displayName
			.split(/[\s@._-]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || 'SO';

	$: menuItems = ((data?.appMenu ?? []) as AppNavigationItem[]).filter(Boolean);
	$: navGroups = groupAppNavigation(menuItems);
	$: mobileQuickItems = getMobilePrimaryNav(menuItems, 5);
	$: pageLabel =
		findNavLabel(menuItems, $page.url.pathname) ||
		(isSuperAdmin && !isImpersonating ? 'Super Admin' : 'Dashboard');
	$: headerTitle =
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
	$: pageSubtitle =
		$page.url.pathname === APP_HOME_HREF || $page.url.pathname === '/admin/super/overview'
			? `Ringkasan ${orgLabel} · ${roleLabel}`
			: `${pageLabel} · ${orgLabel}`;

	$: navGroupKeys = navGroups.map((group) => group.key).join('|');
	$: if (navGroupKeys) {
		// Seed group open-state once per key; keep active groups open.
		let changed = false;
		const next: Record<string, boolean> = { ...openGroups };
		for (const group of navGroups) {
			const hasActive = group.items.some((item) => isActive(item));
			if (!(group.key in next)) {
				next[group.key] =
					Boolean(APP_NAV_GROUP_META[group.key as AppNavigationGroupKey]?.defaultOpen) || hasActive;
				changed = true;
			} else if (hasActive && !next[group.key]) {
				next[group.key] = true;
				changed = true;
			}
		}
		if (changed) openGroups = next;
	}

	const sidebarIconTone = (href: string) => {
		if (href === APP_HOME_HREF || href.includes('/overview')) return 'from-slate-700 to-emerald-700';
		if (href.startsWith('/lembaga') || href.includes('kelola-aset')) return 'from-lime-700 to-emerald-700';
		if (href.startsWith('/addon')) return 'from-fuchsia-600 to-rose-600';
		if (href.includes('earnings') || href.includes('royalt')) return 'from-rose-600 to-pink-600';
		if (href.startsWith('/buku/studio')) return 'from-sky-600 to-cyan-700';
		if (href.startsWith('/buku') || href.startsWith('/belajar') || href.startsWith('/habit'))
			return 'from-emerald-700 to-teal-700';
		if (href.startsWith('/coins') || href.includes('topup')) return 'from-amber-700 to-orange-700';
		if (href.includes('kelola-santri') || href.includes('licenses')) return 'from-violet-600 to-indigo-600';
		if (href.includes('review') || href.includes('riwayat') || href.startsWith('/admin/posts'))
			return 'from-cyan-700 to-blue-600';
		if (href.includes('pencapaian') || href.includes('rapor')) return 'from-rose-600 to-pink-600';
		if (href.includes('sertifikat') || href.includes('jadwal') || href.startsWith('/kalender'))
			return 'from-indigo-600 to-violet-600';
		if (href.startsWith('/keuangan')) return 'from-blue-600 to-indigo-600';
		if (href.startsWith('/akun') || href === '/beranda') return 'from-amber-700 to-orange-700';
		return 'from-emerald-700 to-teal-700';
	};

	const isActive = (item: Pick<AppNavigationItem, 'href'>) => {
		const path = $page.url.pathname;
		if (item.href === '/buku') {
			return path === '/buku' || (path.startsWith('/buku/') && !path.startsWith('/buku/studio'));
		}
		if (item.href === APP_HOME_HREF) {
			return path === APP_HOME_HREF;
		}
		return path === item.href || path.startsWith(`${item.href}/`);
	};

	const toggleGroup = (key: string) => {
		openGroups = { ...openGroups, [key]: !openGroups[key] };
	};

	const closeOverlays = () => {
		sidebarOpen = false;
		profileMenuOpen = false;
	};

	const toggleProfileMenu = () => {
		profileMenuOpen = !profileMenuOpen;
	};
</script>

<svelte:window
	on:keydown={(event) => {
		if (event.key === 'Escape') closeOverlays();
	}}
/>

<div
	class="dashboard-app-shell min-h-screen bg-so-cream text-so-ink lg:grid"
	class:lg:grid-cols-[276px_minmax(0,1fr)]={!desktopSidebarCollapsed}
	class:lg:grid-cols-[72px_minmax(0,1fr)]={desktopSidebarCollapsed}
>
	<!-- Desktop sidebar -->
	<aside
		class="hidden min-h-screen bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white transition-all duration-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
		class:lg:w-[276px]={!desktopSidebarCollapsed}
		class:lg:w-[72px]={desktopSidebarCollapsed}
		class:lg:px-3={desktopSidebarCollapsed}
	>
		<button
			class="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-so-green text-white shadow-lg transition-all hover:bg-so-green-2 lg:flex"
			on:click={() => (desktopSidebarCollapsed = !desktopSidebarCollapsed)}
			aria-label={desktopSidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
			type="button"
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

		<a
			href={isSuperAdmin && !isImpersonating ? '/admin/super/overview' : APP_HOME_HREF}
			class="flex items-center gap-3"
			class:justify-center={desktopSidebarCollapsed}
		>
			<img src={santriOnlineIconUrl} alt="SantriOnline" class="h-11 w-11 object-contain" />
			{#if !desktopSidebarCollapsed}
				<div>
					<p class="font-display text-xl font-bold leading-none">SantriOnline</p>
					<p class="text-xs font-semibold text-white/65">{roleLabel}</p>
				</div>
			{/if}
		</a>

		<div
			class="mt-8 rounded-xl border border-white/10 bg-white/8 p-3"
			class:flex={desktopSidebarCollapsed}
			class:justify-center={desktopSidebarCollapsed}
		>
			<div
				class="flex items-center gap-3"
				class:flex-col={desktopSidebarCollapsed}
				class:gap-0={desktopSidebarCollapsed}
			>
				<div
					class="grid h-11 w-11 place-items-center rounded-full bg-so-cream text-xs font-black text-so-green"
				>
					{displayInitials}
				</div>
				{#if !desktopSidebarCollapsed}
					<div class="min-w-0">
						<p class="truncate text-sm font-bold">{displayName}</p>
						<p class="mt-0.5 text-xs text-white/60">{roleLabel} · {orgLabel}</p>
					</div>
				{/if}
			</div>
		</div>

		<nav class="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
			{#each navGroups as group (group.key)}
				<section class="space-y-1">
					{#if !desktopSidebarCollapsed}
						<button
							type="button"
							class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 hover:bg-white/5 hover:text-white/80"
							on:click={() => toggleGroup(group.key)}
							aria-expanded={openGroups[group.key] !== false}
						>
							<span>{group.label}</span>
							<svg
								class="h-3.5 w-3.5 transition-transform"
								class:rotate-90={openGroups[group.key] !== false}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
							>
								<path d={iconPaths.chevron} stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					{/if}

					{#if desktopSidebarCollapsed || openGroups[group.key] !== false}
						<div class="grid gap-1">
							{#each group.items as item (item.href + item.label)}
								<a
									href={item.href}
									class={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
										isActive(item)
											? 'bg-so-gold/24 text-white ring-1 ring-so-gold/30'
											: 'text-white/78 hover:bg-white/10 hover:text-white'
									}`}
									class:justify-center={desktopSidebarCollapsed}
									class:px-2={desktopSidebarCollapsed}
									title={desktopSidebarCollapsed ? item.label : item.description || item.label}
									aria-current={isActive(item) ? 'page' : undefined}
								>
									<span
										class={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition duration-200 motion-safe:group-hover:-translate-y-0.5 group-hover:shadow-lg ${sidebarIconTone(item.href)} ${
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
						</div>
					{/if}
				</section>
			{/each}
		</nav>

		<div
			class="mt-4 rounded-xl border border-so-gold/45 bg-so-green-3/55 p-4"
			class:flex={desktopSidebarCollapsed}
			class:justify-center={desktopSidebarCollapsed}
			class:p-3={desktopSidebarCollapsed}
		>
			<div
				class="flex items-start gap-3"
				class:flex-col={desktopSidebarCollapsed}
				class:items-center={desktopSidebarCollapsed}
				class:gap-2={desktopSidebarCollapsed}
			>
				<span
					class="grid h-9 w-9 place-items-center rounded-lg bg-so-gold text-so-green"
					class:h-8={desktopSidebarCollapsed}
					class:w-8={desktopSidebarCollapsed}
				>
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d={iconPaths.sparkles} />
					</svg>
				</span>
				{#if !desktopSidebarCollapsed}
					<div>
						<p class="font-display text-base font-bold">1 Dashboard</p>
						<p class="mt-1 text-xs leading-5 text-white/67">
							Semua menu lembaga, habit, belajar, dan sosial dalam satu shell.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</aside>

	<!-- Mobile drawer -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				class="absolute inset-0 bg-slate-950/45"
				type="button"
				aria-label="Tutup menu"
				on:click={() => (sidebarOpen = false)}
			></button>
			<aside
				class="relative h-full w-[min(20rem,88vw)] overflow-y-auto bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white shadow-2xl"
			>
				<div class="flex items-center justify-between">
					<a
						href={isSuperAdmin && !isImpersonating ? '/admin/super/overview' : APP_HOME_HREF}
						class="flex items-center gap-3"
						on:click={closeOverlays}
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

				<nav class="mt-6 space-y-4">
					{#each navGroups as group (group.key)}
						<section>
							<p class="px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
								{group.label}
							</p>
							<div class="mt-1.5 grid gap-1">
								{#each group.items as item (item.href + item.label)}
									<a
										href={item.href}
										class={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
											isActive(item) ? 'bg-so-gold/24 text-white' : 'text-white/78'
										}`}
										on:click={closeOverlays}
										aria-current={isActive(item) ? 'page' : undefined}
									>
										<span
											class={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 ${sidebarIconTone(item.href)} ${
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
							</div>
						</section>
					{/each}
				</nav>
			</aside>
		</div>
	{/if}

	<main class="min-w-0 pb-24 lg:pb-8">
		<header
			class="sticky top-0 z-30 border-b border-so-border/70 bg-so-cream/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8"
		>
			<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
				<div class="flex items-center gap-3">
					<button
						class="grid h-10 w-10 place-items-center rounded-xl border border-so-border bg-white text-so-green shadow-sm lg:hidden"
						type="button"
						aria-label="Buka menu"
						on:click={() => {
							profileMenuOpen = false;
							sidebarOpen = true;
						}}
					>
						☰
					</button>
					<div class="min-w-0">
						<p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-so-muted sm:text-xs">
							{headerTitle}
						</p>
						<h1 class="truncate font-display text-xl font-bold tracking-tight text-so-green sm:text-2xl md:text-3xl">
							{pageLabel}
						</h1>
						<p class="mt-0.5 truncate text-sm text-so-muted">{pageSubtitle}</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2 sm:gap-3">
					<div class="relative min-w-0 flex-1 sm:min-w-[240px] xl:w-[320px] xl:flex-none">
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
								<path d={iconPaths.search} />
							</svg>
						</span>
						<input
							class="so-focus h-11 w-full rounded-xl border border-so-border bg-white/90 pl-9 pr-4 text-sm shadow-sm"
							placeholder="Cari menu, lembaga, atau aktivitas..."
							aria-label="Pencarian cepat dashboard"
							readonly
						/>
					</div>

					<div class="min-w-0 max-w-[min(48vw,16rem)] sm:max-w-[18rem]">
						<LembagaSwitcher
							lembagaList={data?.lembagaList ?? []}
							fallbackLembaga={data?.org ?? null}
							currentUser={data?.user ?? null}
						/>
					</div>

					<!-- Google/YouTube style profile button -->
					<div class="relative shrink-0">
						<button
							type="button"
							class="flex items-center gap-2 rounded-full border border-so-border bg-white py-1 pl-1 pr-2 shadow-sm transition hover:bg-slate-50 sm:pr-3"
							aria-haspopup="menu"
							aria-expanded={profileMenuOpen}
							aria-label="Menu profil akun"
							on:click={toggleProfileMenu}
						>
							<div
								class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-so-green to-emerald-700 text-sm font-black text-white"
							>
								{displayInitials}
							</div>
							<div class="hidden min-w-0 text-left sm:block">
								<p class="max-w-[120px] truncate text-sm font-bold text-so-ink">{displayName}</p>
								<p class="max-w-[120px] truncate text-[11px] text-so-muted">{roleLabel}</p>
							</div>
							<svg
								class="hidden h-4 w-4 text-so-muted sm:block"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>

						{#if profileMenuOpen}
							<button
								type="button"
								class="fixed inset-0 z-40 cursor-default bg-transparent"
								aria-label="Tutup menu profil"
								on:click={() => (profileMenuOpen = false)}
							></button>
							<div
								class="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
								role="menu"
							>
								<div class="border-b border-slate-100 px-4 py-4">
									<div class="flex items-center gap-3">
										<div
											class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-so-green to-emerald-700 text-sm font-black text-white"
										>
											{displayInitials}
										</div>
										<div class="min-w-0">
											<p class="truncate text-sm font-bold text-slate-900">{displayName}</p>
											{#if displayEmail}
												<p class="truncate text-xs text-slate-500">{displayEmail}</p>
											{/if}
											<p class="mt-0.5 text-xs font-medium text-emerald-700">
												{roleLabel} · {orgLabel}
											</p>
										</div>
									</div>
									<a
										href="/akun"
										class="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
										on:click={closeOverlays}
									>
										Kelola akun Anda
									</a>
									<a
										href="/coins"
										class="mt-3 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2.5 transition hover:bg-amber-100"
										role="menuitem"
										on:click={closeOverlays}
									>
										<span class="flex items-center gap-2 text-sm font-semibold text-amber-950">
											<svg
												class="h-4 w-4 text-amber-700"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
											>
												<path d={iconPaths.coins} stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											Saldo coin
										</span>
										<span class="text-sm font-black tabular-nums text-amber-900">{coinBalanceLabel}</span>
									</a>
								</div>

								<div class="py-1.5">
									<a
										href="/akun"
										class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
										role="menuitem"
										on:click={closeOverlays}
									>
										<svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<path d={iconPaths.user} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										<span>Profil & pengaturan</span>
									</a>
									<a
										href="/lembaga"
										class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
										role="menuitem"
										on:click={closeOverlays}
									>
										<svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<path d={iconPaths.building} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										<span>Lembaga saya</span>
									</a>
									<a
										href="/habit"
										class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
										role="menuitem"
										on:click={closeOverlays}
									>
										<svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<path d={iconPaths.habit} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										<span>Misi habit harian</span>
									</a>
									<a
										href="/coins/topup"
										class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
										role="menuitem"
										on:click={closeOverlays}
									>
										<svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										<span>Topup coin</span>
									</a>
									{#if isSuperAdmin}
										<a
											href="/admin/super/overview"
											class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
											role="menuitem"
											on:click={closeOverlays}
										>
											<svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
												<path d={iconPaths.shield} stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<span>Panel super admin</span>
										</a>
									{/if}
									{#if isImpersonating}
										<a
											href="/admin/super/impersonate/stop"
											class="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-800 transition hover:bg-amber-50"
											role="menuitem"
											on:click={closeOverlays}
										>
											<svg class="h-4 w-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
												<path d={iconPaths.shield} stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<span>Keluar mode admin lembaga</span>
										</a>
									{/if}
								</div>

								<div class="border-t border-slate-100 py-1.5">
									<form method="POST" action="/logout">
										<button
											type="submit"
											class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
											role="menuitem"
										>
											<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
												<path d={iconPaths.logout} stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<span>Logout</span>
										</button>
									</form>
								</div>
							</div>
						{/if}
					</div>
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
							Akses dashboard organisasi sedang aktif, tetapi menu super admin tetap tersedia.
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

	<!-- Mobile bottom nav -->
	<nav
		class="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-hidden border-t border-so-border/80 bg-white/95 shadow-[0_-6px_24px_rgba(15,118,110,0.12)] backdrop-blur-sm lg:hidden safe-area-bottom"
	>
		<div class="flex w-full min-w-0 items-center justify-around gap-1 px-2 py-2 pb-safe sm:gap-2">
			{#each mobileQuickItems as item (item.href)}
				<a
					href={item.href}
					class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-medium text-slate-500 transition-all duration-200 active:scale-95"
					class:text-emerald-700={isActive(item)}
					class:bg-emerald-50={isActive(item)}
					style="min-height: 48px;"
					aria-current={isActive(item) ? 'page' : undefined}
				>
					<span
						class={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-black/5 ${sidebarIconTone(item.href)}`}
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</span>
					<span class="max-w-full truncate text-[10px] leading-tight">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>

<style>
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}

	.pb-safe {
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
	}
</style>
