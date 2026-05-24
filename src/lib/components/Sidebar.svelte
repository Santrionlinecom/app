<script lang="ts">
	import { page } from '$app/stores';

	type MenuItem = {
		key: string;
		label: string;
		href: string;
		icon: string;
		match: string[];
	};

	type SidebarPageData = {
		org?: { name?: string | null } | null;
		lembaga?: { name?: string | null } | null;
		roleLabel?: string | null;
		role?: string | null;
	};

	const menu: MenuItem[] = [
		{ key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '⌂', match: ['/dashboard'] },
		{
			key: 'santri',
			label: 'Santri',
			href: '/dashboard/kelola-santri',
			icon: '👥',
			match: ['/dashboard/kelola-santri']
		},
		{
			key: 'setoran',
			label: 'Hafalan & Setoran',
			href: '/tpq/akademik/setoran',
			icon: '📖',
			match: ['/tpq/akademik']
		},
		{
			key: 'ujian',
			label: 'Ujian',
			href: '/dashboard/ujian-tahfidz',
			icon: '▣',
			match: ['/dashboard/ujian-tahfidz']
		},
		{
			key: 'raport',
			label: 'Raport',
			href: '/tpq/hafalan-rapor',
			icon: '▤',
			match: [
				'/tpq/hafalan-rapor',
				'/tpq/rapor-rekap',
				'/dashboard/rapor-hafalan',
				'/dashboard/pencapaian-hafalan'
			]
		},
		{ key: 'kas', label: 'Kas Lembaga', href: '/keuangan', icon: '▰', match: ['/keuangan'] },
		{ key: 'pengaturan', label: 'Pengaturan', href: '/akun', icon: '⚙', match: ['/akun'] }
	];

	$: path = $page.url.pathname;
	$: pageData = $page.data as SidebarPageData;
	$: orgName = pageData?.org?.name || pageData?.lembaga?.name || 'Nama Lembaga';
	$: roleLabel = pageData?.roleLabel || pageData?.role || 'Superadmin';
	$: initials =
		orgName
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0])
			.join('')
			.toUpperCase() || 'SO';

	const isActive = (item: MenuItem) =>
		item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
</script>

<aside
	class="hidden min-h-screen w-[276px] shrink-0 bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white shadow-2xl lg:flex lg:flex-col"
>
	<a href="/dashboard" class="flex items-center gap-3">
		<div
			class="grid h-12 w-12 place-items-center rounded-2xl border border-so-gold/40 bg-white/10 text-2xl text-so-gold"
		>
			۞
		</div>
		<div>
			<div class="font-display text-xl font-bold leading-none">SantriOnline</div>
			<div class="text-xs font-semibold text-white/65">App</div>
		</div>
	</a>

	<div class="mt-8 rounded-2xl border border-white/10 bg-white/8 p-3">
		<div class="flex items-center gap-3">
			<div
				class="grid h-11 w-11 place-items-center rounded-xl bg-so-cream text-sm font-black text-so-green"
			>
				{initials}
			</div>
			<div>
				<p class="text-sm font-bold">{orgName}</p>
				<p class="mt-0.5 text-xs text-white/60">{roleLabel}</p>
			</div>
		</div>
	</div>

	<nav class="mt-6 grid gap-1.5">
		{#each menu as item}
			<a
				href={item.href}
				class={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition
          ${isActive(item) ? 'bg-so-gold/24 text-white ring-1 ring-so-gold/30' : 'text-white/78 hover:bg-white/10 hover:text-white'}`}
			>
				<span
					class={`grid h-8 w-8 place-items-center rounded-lg text-sm
          ${isActive(item) ? 'bg-so-gold text-so-green' : 'bg-white/8 text-white/80 group-hover:bg-white/14'}`}
					>{item.icon}</span
				>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto rounded-2xl border border-so-gold/50 bg-so-green-3/50 p-4">
		<div class="flex items-start gap-3">
			<span class="grid h-9 w-9 place-items-center rounded-xl bg-so-gold text-so-green">✦</span>
			<div>
				<p class="font-display text-base font-bold">AI Assistant</p>
				<p class="mt-1 text-xs leading-5 text-white/67">
					Bantu rekap, cari data, dan beri saran operasional lembaga.
				</p>
			</div>
		</div>
	</div>
</aside>

<nav
	class="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-so-border bg-white/92 p-2 shadow-soft backdrop-blur lg:hidden"
>
	<div class="grid grid-cols-4 gap-1">
		{#each menu.filter((i) => ['dashboard', 'santri', 'setoran', 'kas'].includes(i.key)) as item}
			<a
				href={item.href}
				class={`grid place-items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold
          ${isActive(item) ? 'bg-so-green text-white' : 'text-so-muted'}`}
			>
				<span>{item.icon}</span>
				<span>{item.label.replace('Hafalan & ', '')}</span>
			</a>
		{/each}
	</div>
</nav>
