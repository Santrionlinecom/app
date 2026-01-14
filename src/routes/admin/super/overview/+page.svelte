<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type Institution = PageData['institutions'][number];
	type AvailableUser = PageData['availableUsers'][number];
	type ActivityRow = PageData['liveStats']['recentActivities'][number];
	type LiveActivity = ActivityRow & { role?: string | null };
	type TypeSummary = {
		type: string;
		totalInstitutions: number;
		activeInstitutions: number;
		pendingInstitutions: number;
		rejectedInstitutions: number;
		adminCount: number;
		santriCount: number;
		alumniCount: number;
		jamaahCount: number;
		ustadzCount: number;
		ustadzahCount: number;
		tamirCount: number;
		bendaharaCount: number;
	};

	let liveStats = data.liveStats ?? {
		loginsToday: 0,
		registrationsToday: 0,
		trafficSources: [],
		recentActivities: []
	};
	let recentActivities: LiveActivity[] = liveStats.recentActivities ?? [];

	const roleOptions = [
		{ value: 'all', label: 'Semua Role' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'SUPER_ADMIN', label: 'Super Admin' },
		{ value: 'ustadz', label: 'Ustadz' },
		{ value: 'ustadzah', label: 'Ustadzah' },
		{ value: 'santri', label: 'Santri' },
		{ value: 'alumni', label: 'Alumni' },
		{ value: 'jamaah', label: 'Jamaah' },
		{ value: 'tamir', label: 'Tamir' },
		{ value: 'bendahara', label: 'Bendahara' },
		{ value: 'guest', label: 'Pengunjung' }
	];

	const actionOptions = [
		{ value: 'all', label: 'Semua Aksi' },
		{ value: 'LOGIN', label: 'Login' },
		{ value: 'REGISTER', label: 'Register' },
		{ value: 'VIEW_PAGE', label: 'Lihat Halaman' },
		{ value: 'CLICK', label: 'Semua Klik' },
		{ value: 'CLICK_WA', label: 'Klik WA' },
		{ value: 'VIEW_CERTIFICATE', label: 'Lihat Sertifikat' }
	];

	const rangeOptions = [
		{ value: '1h', label: '1 Jam' },
		{ value: '6h', label: '6 Jam' },
		{ value: '24h', label: '24 Jam' },
		{ value: '7d', label: '7 Hari' },
		{ value: '30d', label: '30 Hari' }
	];

	let filterRole = 'all';
	let filterAction = 'all';
	let filterRange = '24h';
	let isRefreshing = false;
	let lastRefreshed: number | null = null;
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	const orgTypeLabel: Record<string, string> = {
		pondok: 'Pondok',
		masjid: 'Masjid',
		musholla: 'Musholla',
		tpq: 'TPQ',
		'rumah-tahfidz': 'Rumah Tahfidz'
	};

	const orgTypeOrder = ['pondok', 'tpq', 'rumah-tahfidz', 'masjid', 'musholla'] as const;
	type OrgTypeKey = (typeof orgTypeOrder)[number];
	const orgTypeConfig: Record<
		OrgTypeKey,
		{ label: string; group: 'education' | 'community'; tone: string; accent: string }
	> = {
		pondok: {
			label: 'Pondok Pesantren',
			group: 'education',
			tone: 'from-emerald-400/80 to-teal-500/80',
			accent: 'text-emerald-700'
		},
		tpq: {
			label: 'TPQ',
			group: 'education',
			tone: 'from-sky-400/80 to-cyan-500/80',
			accent: 'text-sky-700'
		},
		'rumah-tahfidz': {
			label: 'Rumah Tahfidz',
			group: 'education',
			tone: 'from-indigo-400/80 to-blue-500/80',
			accent: 'text-indigo-700'
		},
		masjid: {
			label: 'Masjid',
			group: 'community',
			tone: 'from-amber-400/80 to-orange-500/80',
			accent: 'text-amber-700'
		},
		musholla: {
			label: 'Musholla',
			group: 'community',
			tone: 'from-rose-400/80 to-pink-500/80',
			accent: 'text-rose-700'
		}
	};

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatDate = (value?: number | null) =>
		value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
	const formatDateTime = (value?: number | null) =>
		value
			? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
			: '-';

	const parseMetadata = (value?: string | null) => {
		if (!value) return null;
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	};

	const actionLabel = (action: string) => {
		const map: Record<string, string> = {
			LOGIN: 'Login',
			REGISTER: 'Register',
			VIEW_PAGE: 'Lihat Halaman',
			CLICK_WA: 'Klik WA',
			VIEW_CERTIFICATE: 'Lihat Sertifikat'
		};
		if (map[action]) return map[action];
		if (action.startsWith('CLICK_')) return `Klik ${action.slice(6).replace(/_/g, ' ')}`;
		return action;
	};

	const actorLabel = (activity: ActivityRow) =>
		activity.username || activity.userEmail || activity.email || 'Pengunjung';

	const orgTypeName = (value?: string | null) => (value ? orgTypeLabel[value] ?? value : '-');
	const orgLabel = (org: Institution) => `${org.name} (${orgTypeLabel[org.type] ?? org.type})`;
	const orgsWithoutAdmin = (orgs: Institution[]) => orgs.filter((org) => !org.adminCount);
	const hasOrgWithoutAdmin = (orgs: Institution[]) => orgs.some((org) => !org.adminCount);
	const userLabel = (user: AvailableUser) => {
		const org = data.institutions?.find((item) => item.id === user.orgId);
		const orgName = org ? org.name : null;
		return `${user.username || user.email} • ${user.email}${orgName ? ` — ${orgName}` : ''}`;
	};

	const emptySummary = (type: OrgTypeKey): TypeSummary => ({
		type,
		totalInstitutions: 0,
		activeInstitutions: 0,
		pendingInstitutions: 0,
		rejectedInstitutions: 0,
		adminCount: 0,
		santriCount: 0,
		alumniCount: 0,
		jamaahCount: 0,
		ustadzCount: 0,
		ustadzahCount: 0,
		tamirCount: 0,
		bendaharaCount: 0
	});

	const statusBadgeClass = (status?: string | null) => {
		switch ((status ?? '').toLowerCase()) {
			case 'active':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'pending':
				return 'border-amber-200 bg-amber-50 text-amber-700';
			case 'rejected':
				return 'border-rose-200 bg-rose-50 text-rose-700';
			default:
				return 'border-slate-200 bg-slate-100 text-slate-600';
		}
	};

	let noAdminCount = 0;
	let trafficTotal = 0;
	$: noAdminCount = orgsWithoutAdmin(data.institutions ?? []).length;
	$: trafficTotal = liveStats.trafficSources.reduce((sum, source) => sum + (source.total ?? 0), 0);

	let highlightCards: Array<{ label: string; value: string; note: string; accent: string; tone: string }> = [];
	$: highlightCards = [
		{
			label: 'Login Hari Ini',
			value: formatNumber(liveStats.loginsToday),
			note: 'Akun aktif sepanjang hari ini',
			accent: 'from-emerald-400 to-teal-500',
			tone: 'text-emerald-700'
		},
		{
			label: 'Registrasi Baru',
			value: formatNumber(liveStats.registrationsToday),
			note: 'Akun baru terdaftar hari ini',
			accent: 'from-sky-400 to-cyan-500',
			tone: 'text-sky-700'
		},
		{
			label: 'Traffic Interaksi',
			value: formatNumber(trafficTotal),
			note: 'Total klik interaksi terbaru',
			accent: 'from-amber-400 to-orange-500',
			tone: 'text-amber-700'
		},
		{
			label: 'Lembaga Tanpa Admin',
			value: formatNumber(noAdminCount),
			note: 'Butuh perhatian segera',
			accent: 'from-rose-400 to-pink-500',
			tone: 'text-rose-700'
		}
	];

	type InstitutionCard = {
		type: OrgTypeKey;
		label: string;
		group: 'education' | 'community';
		totalInstitutions: number;
		activeInstitutions: number;
		pendingInstitutions: number;
		rejectedInstitutions: number;
		primaryLabel: string;
		primaryCount: number;
		staffLabel: string;
		staffCount: number;
		adminCount: number;
		tone: string;
		accent: string;
		alumniCount: number;
	};

	let institutionCards: InstitutionCard[] = [];
	let educationCards: InstitutionCard[] = [];
	let communityCards: InstitutionCard[] = [];
	$: {
		const rows = data.institutionSummary ?? [];
		institutionCards = orgTypeOrder.map((type) => {
			const row =
				rows.find((item) => item.type === type) ??
				emptySummary(type);
			const config = orgTypeConfig[type];
			const isCommunity = config.group === 'community';
			const primaryLabel = isCommunity ? 'Jamaah' : 'Santri';
			const primaryCount = isCommunity ? row.jamaahCount : row.santriCount;
			const staffLabel = isCommunity ? 'Pengurus' : 'Pengajar';
			const staffCount = isCommunity
				? row.tamirCount + row.bendaharaCount
				: row.ustadzCount + row.ustadzahCount;

			return {
				type,
				label: config.label,
				group: config.group,
				totalInstitutions: row.totalInstitutions,
				activeInstitutions: row.activeInstitutions,
				pendingInstitutions: row.pendingInstitutions,
				rejectedInstitutions: row.rejectedInstitutions,
				primaryLabel,
				primaryCount,
				staffLabel,
				staffCount,
				adminCount: row.adminCount,
				tone: config.tone,
				accent: config.accent,
				alumniCount: row.alumniCount
			};
		});

		educationCards = institutionCards.filter((card) => card.group === 'education');
		communityCards = institutionCards.filter((card) => card.group === 'community');
	}

	const toQuery = () => {
		const params = new URLSearchParams();
		if (filterRole && filterRole !== 'all') params.set('role', filterRole);
		if (filterAction && filterAction !== 'all') params.set('action', filterAction);
		if (filterRange) params.set('range', filterRange);
		return params.toString();
	};

	const refreshLive = async () => {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			const query = toQuery();
			const res = await fetch(`/admin/super/overview/live${query ? `?${query}` : ''}`);
			if (res.ok) {
				const payload = await res.json();
				recentActivities = payload.recentActivities ?? [];
				lastRefreshed = Date.now();
			}
		} catch {
			// keep the previous state if refresh fails
		} finally {
			isRefreshing = false;
		}
	};

	const formatShortTime = (value?: number | null) => {
		if (!value) return '-';
		return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	};

	onMount(() => {
		refreshLive();
		pollTimer = setInterval(refreshLive, 12000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});
</script>

<svelte:head>
	<title>Super Admin Command Center</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap"
	/>
</svelte:head>

<div class="super-admin-shell relative space-y-10 pb-16">
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]"></div>
		<div class="absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-200/40 blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200/40 blur-[140px]"></div>
	</div>

	<header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 p-6 text-white shadow-2xl md:p-8">
		<div class="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/40 blur-3xl"></div>
		<div class="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-amber-400/30 blur-3xl"></div>
		<div class="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-xl">
				<p class="text-xs uppercase tracking-[0.4em] text-white/60">Super Admin</p>
				<h1 class="mt-3 text-3xl font-semibold md:text-4xl">System Command Center</h1>
				<p class="mt-2 text-sm text-white/70">
					Monitor seluruh lembaga, pergerakan akun, dan performa platform secara real-time.
				</p>
				<div class="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
					<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
					Status sistem: LIVE
				</div>
			</div>
			<div class="grid w-full gap-3 sm:grid-cols-3 lg:max-w-md">
				<div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
					<p class="text-xs text-white/60">Total Lembaga</p>
					<p class="mt-2 text-2xl font-semibold">{formatNumber(data.stats.totalInstitutions)}</p>
				</div>
				<div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
					<p class="text-xs text-white/60">Total User</p>
					<p class="mt-2 text-2xl font-semibold">{formatNumber(data.stats.totalUsers)}</p>
				</div>
				<div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
					<p class="text-xs text-white/60">Total Transaksi</p>
					<p class="mt-2 text-2xl font-semibold">{formatNumber(data.stats.totalTransactions)}</p>
				</div>
			</div>
		</div>
	</header>

	<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each highlightCards as card, idx}
			<div
				class="reveal rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg backdrop-blur"
				style={`animation-delay: ${idx * 80}ms;`}
			>
				<div class="flex items-start justify-between">
					<div>
						<p class="text-[11px] uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
						<p class={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
						<p class="mt-1 text-xs text-slate-500">{card.note}</p>
					</div>
					<div class={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.accent} opacity-80`}></div>
				</div>
			</div>
		{/each}
	</section>

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur" style="animation-delay: 90ms;">
			<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 class="section-title text-xl font-semibold text-slate-900">Lembaga Pendidikan</h2>
					<p class="text-xs text-slate-500">Pondok, TPQ, dan Rumah Tahfidz terpisah dari lembaga jamaah.</p>
				</div>
				<a href="#institution-list" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
					Lihat daftar lembaga
				</a>
			</div>
			<div class="mt-5 grid gap-4 md:grid-cols-3">
				{#each educationCards as card}
					<a
						href="#institution-list"
						class="group rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
					>
						<div class="flex items-start justify-between">
							<div>
								<p class="text-[11px] uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
								<p class={`mt-2 text-2xl font-semibold ${card.accent}`}>{formatNumber(card.totalInstitutions)}</p>
								<p class="text-xs text-slate-500">
									Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}
								</p>
							</div>
							<div class={`h-10 w-10 rounded-2xl bg-gradient-to-br ${card.tone}`}></div>
						</div>
						<div class="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{card.primaryLabel}</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.primaryCount)}</p>
							</div>
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{card.staffLabel}</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.staffCount)}</p>
							</div>
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Admin</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.adminCount)}</p>
							</div>
						</div>
						{#if card.alumniCount}
							<p class="mt-2 text-xs text-slate-400">Alumni {formatNumber(card.alumniCount)}</p>
						{/if}
					</a>
				{/each}
			</div>
		</div>

		<div class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur" style="animation-delay: 140ms;">
			<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 class="section-title text-xl font-semibold text-slate-900">Lembaga Jamaah</h2>
					<p class="text-xs text-slate-500">Masjid dan musholla fokus jamaah, tidak bercampur santri.</p>
				</div>
				<a href="#institution-list" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
					Lihat daftar lembaga
				</a>
			</div>
			<div class="mt-5 grid gap-4 md:grid-cols-2">
				{#each communityCards as card}
					<a
						href="#institution-list"
						class="group rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
					>
						<div class="flex items-start justify-between">
							<div>
								<p class="text-[11px] uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
								<p class={`mt-2 text-2xl font-semibold ${card.accent}`}>{formatNumber(card.totalInstitutions)}</p>
								<p class="text-xs text-slate-500">
									Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}
								</p>
							</div>
							<div class={`h-10 w-10 rounded-2xl bg-gradient-to-br ${card.tone}`}></div>
						</div>
						<div class="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{card.primaryLabel}</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.primaryCount)}</p>
							</div>
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{card.staffLabel}</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.staffCount)}</p>
							</div>
							<div>
								<p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Admin</p>
								<p class="text-sm font-semibold text-slate-900">{formatNumber(card.adminCount)}</p>
							</div>
						</div>
						{#if card.rejectedInstitutions}
							<p class="mt-2 text-xs text-rose-600">Ditolak {formatNumber(card.rejectedInstitutions)}</p>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-3">
		<div class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur lg:col-span-2" style="animation-delay: 120ms;">
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="section-title text-xl font-semibold text-slate-900">Live Activity Feed</h2>
						<p class="text-xs text-slate-500">Aktivitas terbaru dari seluruh sistem.</p>
					</div>
					<span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
						{recentActivities.length} event
					</span>
				</div>
				<div class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
					<div class="grid gap-2 md:grid-cols-3">
						<label class="text-xs text-slate-500">
							Role
							<select class="select select-bordered select-sm mt-1 w-full" bind:value={filterRole} on:change={refreshLive}>
								{#each roleOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</label>
						<label class="text-xs text-slate-500">
							Aksi
							<select class="select select-bordered select-sm mt-1 w-full" bind:value={filterAction} on:change={refreshLive}>
								{#each actionOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</label>
						<label class="text-xs text-slate-500">
							Rentang
							<select class="select select-bordered select-sm mt-1 w-full" bind:value={filterRange} on:change={refreshLive}>
								{#each rangeOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</label>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
						<div class="flex items-center gap-2">
							<span class="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
							<span>Auto-refresh setiap 12 detik</span>
						</div>
						<div class="flex items-center gap-3">
							{#if lastRefreshed}
								<span>Terakhir update {formatShortTime(lastRefreshed)}</span>
							{/if}
							<button
								class="btn btn-xs btn-outline"
								type="button"
								on:click={refreshLive}
								disabled={isRefreshing}
							>
								{isRefreshing ? 'Sync...' : 'Refresh'}
							</button>
						</div>
					</div>
				</div>
			</div>
			{#if recentActivities.length === 0}
				<p class="mt-6 text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
			{:else}
				<div class="mt-6 space-y-5">
					{#each recentActivities as activity, index}
						{@const meta = parseMetadata(activity.metadata)}
						<div class="flex gap-4">
							<div class="relative">
								<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xs font-semibold text-emerald-700">
									{actionLabel(activity.action).slice(0, 2).toUpperCase()}
								</div>
								{#if index < recentActivities.length - 1}
									<div class="absolute left-1/2 top-11 h-full w-px -translate-x-1/2 bg-slate-200"></div>
								{/if}
							</div>
							<div class="flex-1">
								<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold text-slate-900">{actorLabel(activity)}</p>
											{#if activity.role}
												<span class="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
													{activity.role}
												</span>
											{/if}
										</div>
										<p class="text-xs text-slate-500">{actionLabel(activity.action)}</p>
										{#if meta?.path}
											<p class="text-xs text-slate-400">{meta.path}</p>
										{:else if meta?.source}
											<p class="text-xs text-slate-400">{meta.source}</p>
										{:else if meta?.orgName}
											<p class="text-xs text-slate-400">{meta.orgName}</p>
										{/if}
									</div>
									<div class="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur" style="animation-delay: 200ms;">
			<div>
				<h2 class="section-title text-xl font-semibold text-slate-900">System Pulse</h2>
				<p class="text-xs text-slate-500">Ringkasan trafik dan aktivitas harian.</p>
			</div>
			<div class="mt-5 grid grid-cols-2 gap-3">
				<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
					<p class="text-[11px] uppercase tracking-[0.3em] text-emerald-700">Login</p>
					<p class="mt-2 text-xl font-semibold text-emerald-900">{formatNumber(liveStats.loginsToday)}</p>
				</div>
				<div class="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
					<p class="text-[11px] uppercase tracking-[0.3em] text-sky-700">Register</p>
					<p class="mt-2 text-xl font-semibold text-sky-900">{formatNumber(liveStats.registrationsToday)}</p>
				</div>
			</div>
			<div class="mt-6">
				<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Traffic Sources</p>
				{#if liveStats.trafficSources.length === 0}
					<p class="mt-3 text-sm text-slate-500">Belum ada data klik.</p>
				{:else}
					<div class="mt-4 space-y-3">
						{#each liveStats.trafficSources as source}
							<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-slate-900">{actionLabel(source.action)}</p>
									<span class="text-sm font-semibold text-slate-700">{formatNumber(source.total)}</span>
								</div>
								{#if source.lastSeen}
									<p class="mt-1 text-xs text-slate-500">Last seen {formatDateTime(source.lastSeen)}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur" style="animation-delay: 120ms;">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="section-title text-xl font-semibold text-slate-900">Global User Search</h2>
				<p class="text-xs text-slate-500">Cari user berdasarkan nama atau email di seluruh database.</p>
			</div>
			<form method="GET" class="flex w-full max-w-md gap-2">
				<input
					type="text"
					name="q"
					value={data.searchQuery}
					placeholder="Cari nama atau email..."
					class="input input-bordered w-full"
				/>
				<button class="btn btn-primary" type="submit">Cari</button>
			</form>
		</div>
		<div class="mt-6">
			{#if data.searchQuery.length >= 2}
				{#if data.searchResults.length === 0}
					<p class="text-sm text-slate-500">Tidak ada user ditemukan.</p>
				{:else}
					<div class="overflow-auto rounded-2xl border border-slate-200 bg-white">
						<table class="table table-zebra w-full text-sm">
							<thead>
								<tr>
									<th>Nama</th>
									<th>Email</th>
									<th>Role</th>
									<th>Lembaga</th>
								</tr>
							</thead>
							<tbody>
								{#each data.searchResults as user}
									<tr>
										<td class="font-medium text-slate-900">{user.username || '-'}</td>
										<td>{user.email}</td>
										<td>{user.role}</td>
										<td>{user.orgName ? `${user.orgName} (${orgTypeName(user.orgType)})` : '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else}
				<p class="text-sm text-slate-500">Masukkan minimal 2 karakter untuk mencari.</p>
			{/if}
		</div>
	</section>

	<section class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur" style="animation-delay: 160ms;">
		<div>
			<h2 class="section-title text-xl font-semibold text-slate-900">Admin Control Room</h2>
			<p class="text-xs text-slate-500">Kelola admin lembaga dari satu tempat.</p>
		</div>
		{#if hasOrgWithoutAdmin(data.institutions)}
			<div class="mt-6 grid gap-4 lg:grid-cols-2">
				<form method="POST" action="?/assignExistingAdmin" class="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5">
					<h3 class="text-sm font-semibold text-slate-900">Tetapkan Admin dari User Terdaftar</h3>
					<p class="text-xs text-slate-500">Pilih user yang sudah ada untuk menjadi admin lembaga.</p>
					<p class="text-xs text-slate-400">User akan dipindah ke lembaga yang dipilih.</p>
					<div class="mt-4 grid gap-3 min-w-0">
						<select name="orgId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih lembaga</option>
							{#each orgsWithoutAdmin(data.institutions) as org}
								<option value={org.id}>{orgLabel(org)}</option>
							{/each}
						</select>
						<select name="userId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih user</option>
							{#each data.availableUsers as user}
								<option value={user.id}>{userLabel(user)}</option>
							{/each}
						</select>
						<button class="btn btn-primary btn-sm" type="submit">Set Admin</button>
					</div>
				</form>
				<form method="POST" action="?/createAdmin" class="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5">
					<h3 class="text-sm font-semibold text-slate-900">Tambah Admin Baru</h3>
					<p class="text-xs text-slate-500">Buat akun admin baru untuk lembaga tanpa admin.</p>
					<div class="mt-4 grid gap-3 min-w-0">
						<select name="orgId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih lembaga</option>
							{#each orgsWithoutAdmin(data.institutions) as org}
								<option value={org.id}>{orgLabel(org)}</option>
							{/each}
						</select>
						<input name="name" class="input input-bordered w-full min-w-0" placeholder="Nama admin" required />
						<input name="email" type="email" class="input input-bordered w-full min-w-0" placeholder="Email admin" required />
						<input
							name="password"
							type="password"
							class="input input-bordered w-full min-w-0"
							placeholder="Password (min 6)"
							minlength="6"
							required
						/>
						<button class="btn btn-secondary btn-sm" type="submit">Buat Admin</button>
					</div>
				</form>
			</div>
		{:else}
			<p class="mt-4 text-xs text-slate-500">Semua lembaga sudah memiliki admin.</p>
		{/if}
	</section>

	<section
		id="institution-list"
		class="reveal rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur"
		style="animation-delay: 200ms;"
	>
		<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="section-title text-xl font-semibold text-slate-900">Daftar Lembaga</h2>
				<p class="text-xs text-slate-500">Gunakan ghost login untuk masuk ke dashboard lembaga.</p>
			</div>
			<span class="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600">
				{formatNumber(data.institutions.length)} lembaga
			</span>
		</div>
		{#if data.institutions.length === 0}
			<p class="mt-4 text-sm text-slate-500">Belum ada lembaga terdaftar.</p>
		{:else}
			<div class="mt-5 overflow-auto rounded-2xl border border-slate-200 bg-white">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Nama</th>
							<th>Tipe</th>
							<th>Status</th>
							<th class="text-right">Anggota</th>
							<th>Dibuat</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.institutions as org}
							<tr>
								<td class="font-medium text-slate-900">{org.name}</td>
								<td>{orgTypeLabel[org.type] ?? org.type}</td>
								<td>
									<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(org.status)}`}>
										{org.status}
									</span>
								</td>
								<td class="text-right">{formatNumber(org.totalMembers)}</td>
								<td>{formatDate(org.createdAt)}</td>
								<td>
									{#if org.adminCount}
										<a class="btn btn-xs btn-outline" href={`/admin/super/impersonate?orgId=${org.id}`}>
											Login Sebagai Admin
										</a>
									{:else}
										<span class="text-xs text-slate-400">Admin belum ada</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	:global(.super-admin-shell) {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}

	:global(.super-admin-shell .section-title) {
		font-family: 'Space Grotesk', 'Times New Roman', serif;
	}

	:global(.super-admin-shell .reveal) {
		animation: reveal 0.6s ease both;
	}

	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
