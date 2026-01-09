<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	type InstitutionType = 'PESANTREN' | 'MASJID';

	let institutionType: InstitutionType = 'PESANTREN';
	$: institutionType = (data?.institution_type ?? 'PESANTREN') as InstitutionType;

	const baseItems = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z'
		}
	];

	const pesantrenItems = [
		{
			label: 'Akademik',
			href: '/akademik',
			icon: 'M3.5 7.5l8.5-4 8.5 4-8.5 4-8.5-4zm1.5 5.5l7 3.25 7-3.25v5.5l-7 3.25-7-3.25v-5.5z'
		},
		{
			label: 'Santri',
			href: '/dashboard/kelola-santri',
			icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z'
		},
		{
			label: 'Hafalan',
			href: '/dashboard/hafalan-mandiri',
			icon: 'M6 4h9l3 3v13a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zm8 0v4h4'
		}
	];

	const masjidItems = [
		{
			label: 'Keuangan',
			href: '/keuangan',
			icon: 'M4 7h16M4 12h10M4 17h7M15 12h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z'
		},
		{
			label: 'Jamaah',
			href: '/dashboard/kelola-santri',
			icon: 'M7 11a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zm-4 10a6.5 6.5 0 0113 0H3z'
		},
		{
			label: 'Aset',
			href: '/dashboard/kelola-lembaga',
			icon: 'M4 10.5L12 6l8 4.5v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5z'
		}
	];

	const footerItems = [
		{
			label: 'Settings',
			href: '/akun',
			icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z'
		}
	];

	let menuItems = [...baseItems, ...footerItems];
	$: menuItems = [
		...baseItems,
		...(institutionType === 'PESANTREN' ? pesantrenItems : masjidItems),
		...footerItems
	];

	let sidebarOpen = false;

	const isActive = (href: string) => {
		const path = $page.url.pathname;
		return path === href || path.startsWith(`${href}/`);
	};

	const displayName = data?.user?.username || data?.user?.email || 'Guest';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap"
	/>
</svelte:head>

<div class="app-shell relative min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-amber-50 text-slate-900">
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl"></div>
		<div class="absolute -right-10 top-40 h-64 w-64 rounded-full bg-amber-200/50 blur-[90px]"></div>
		<div class="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-cyan-200/40 blur-[110px]"></div>
	</div>

	<div class="relative flex min-h-screen">
		<aside class="hidden w-72 flex-col border-r border-white/70 bg-white/70 px-6 py-8 shadow-xl backdrop-blur md:flex">
			<div class="flex items-center justify-between">
				<div>
					<p class="app-title text-xl font-semibold">SantriOnline</p>
					<p class="text-xs uppercase tracking-[0.3em] text-slate-500">Institution Hub</p>
				</div>
				<span class="rounded-full bg-teal-100 px-3 py-1 text-[11px] font-semibold text-teal-700">
					{institutionType === 'PESANTREN' ? 'Pesantren' : 'Masjid'}
				</span>
			</div>

			<nav class="mt-10 space-y-2">
				{#each menuItems as item, idx}
					<a
						href={item.href}
						class="fade-in flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
						class:bg-emerald-100={isActive(item.href)}
						class:text-emerald-900={isActive(item.href)}
						style={`animation-delay: ${idx * 60}ms;`}
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
							<path d={item.icon} />
						</svg>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<div
				class="mt-auto rounded-2xl px-4 py-4 text-xs"
				style="border: 1px solid var(--app-warm-soft); background: var(--app-warm-wash); color: var(--app-warm);"
			>
				<p class="font-semibold">Quick note</p>
				<p class="mt-1">Menu will follow institution settings once wired to data.</p>
			</div>
		</aside>

		<div class="flex min-h-screen flex-1 flex-col">
			<header class="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/70 bg-white/70 px-4 py-4 shadow-sm backdrop-blur md:px-8">
				<div class="flex items-center gap-3">
					<button
						class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
						on:click={() => (sidebarOpen = true)}
						aria-label="Open navigation"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 6h16M4 12h16M4 18h10" />
						</svg>
					</button>
					<div>
						<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
						<h1 class="app-title text-2xl font-semibold text-slate-900">Ringkasan Harian</h1>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<div class="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 md:block">
						{displayName}
					</div>
					<button class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</button>
				</div>
			</header>

			<main class="flex-1 px-4 py-6 md:px-8">
				<slot />
			</main>
		</div>
	</div>

	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 md:hidden">
			<div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" on:click={() => (sidebarOpen = false)}></div>
			<aside class="absolute left-0 top-0 h-full w-72 bg-white px-6 py-8 shadow-2xl">
				<div class="flex items-center justify-between">
					<p class="app-title text-lg font-semibold">SantriOnline</p>
					<button
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white"
						on:click={() => (sidebarOpen = false)}
						aria-label="Close navigation"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 6l12 12M18 6l-12 12" />
						</svg>
					</button>
				</div>

				<nav class="mt-8 space-y-2">
					{#each menuItems as item, idx}
						<a
							href={item.href}
							class="fade-in flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
							class:bg-emerald-100={isActive(item.href)}
							class:text-emerald-900={isActive(item.href)}
							style={`animation-delay: ${idx * 60}ms;`}
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
								<path d={item.icon} />
							</svg>
							<span>{item.label}</span>
						</a>
					{/each}
				</nav>

				<div
					class="mt-8 rounded-2xl px-4 py-4 text-xs"
					style="border: 1px solid var(--app-accent-soft); background: var(--app-accent-wash); color: var(--app-accent);"
				>
					<p class="font-semibold">Institution mode</p>
					<p class="mt-1">Currently showing menus for {institutionType === 'PESANTREN' ? 'Pesantren' : 'Masjid'}.</p>
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
		font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif;
	}

	:global(.app-title) {
		font-family: 'Fraunces', 'Times New Roman', serif;
		letter-spacing: 0.02em;
	}

	:global(.fade-in) {
		animation: fade-in 0.5s ease both;
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
