<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import MediaGalleryModal from '$lib/components/MediaGalleryModal.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type Institution = PageData['institutions'][number];
	type InstitutionAdmin = Institution['admins'][number];
	type AvailableUser = PageData['availableUsers'][number];
	type ActivityRow = PageData['liveStats']['recentActivities'][number];
	type LiveActivity = ActivityRow & { role?: string | null };
	type NotificationItem = PageData['notifications'][number];
	type NotificationCounts = PageData['notificationCounts'];
	type AdminUser = { username?: string | null; email?: string | null; role?: string | null };
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
	let notifications: NotificationItem[] = data.notifications ?? [];
	let notificationCounts: NotificationCounts = data.notificationCounts ?? {
		total: 0,
		urgent: 0,
		warning: 0,
		info: 0
	};

	const roleOptions = [
		{ value: 'all', label: 'Semua Role' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'SUPER_ADMIN', label: 'Super Admin' },
		{ value: 'ustadz', label: 'Ustadz' },
		{ value: 'ustadzah', label: 'Ustadzah' },
		{ value: 'santri', label: 'Santri' },
		{ value: 'alumni', label: 'Alumni' },
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

	const santriOnlineIconUrl =
		'https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png';

	const iconPaths = {
		dashboard: 'M4 13h7V4H4v9zM13 20h7V4h-7v16zM4 20h7v-5H4v5z',
		building: 'M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M8.5 10h.01M12 10h.01M15.5 10h.01M8.5 13.5h.01M15.5 13.5h.01',
		users: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0M17.5 7.5h3M19 6v3',
		activity: 'M4 13h4l2-7 4 12 2-5h4',
		search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
		file: 'M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8 7h8M8 10.5h7M8 14h4',
		book: 'M4.5 5.25A2.25 2.25 0 016.75 3H20v15.75H7A2.5 2.5 0 004.5 21V5.25zM7 6.75h9.5M7 10.25h8M7 13.75h5.5M4.5 18.75A2.25 2.25 0 016.75 16.5H20',
		coins: 'M12 3c4.97 0 9 2.24 9 5s-4.03 5-9 5-9-2.24-9-5 4.03-5 9-5zM3 8v4c0 2.76 4.03 5 9 5s9-2.24 9-5V8M3 12v4c0 2.76 4.03 5 9 5s9-2.24 9-5v-4',
		bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
		settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0M18.5 5.5l1.5 1.5M20 5.5L18.5 7',
		wallet: 'M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v10.5A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-10zM16 12h5v4h-5a2 2 0 010-4zM17.5 14h.01M7 8h7',
		shield: 'M12 3l7 3v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
		sparkles: 'M12 3l2.1 5.1 5.4.45-4.1 3.55 1.25 5.25L12 14.55 7.35 17.35 8.6 12.1 4.5 8.55l5.4-.45L12 3zM19 15l1 2.2 2.2.3-1.7 1.5.5 2.2-2-1.15-2 1.15.5-2.2-1.7-1.5 2.2-.3L19 15z'
	};

	const adminNavItems = [
		{ label: 'Dashboard', href: '/admin/super/overview', icon: iconPaths.dashboard, active: true, tone: 'from-emerald-500 to-teal-500' },
		{ label: 'Pencarian User', href: '#global-search', icon: iconPaths.search, tone: 'from-cyan-500 to-blue-500' },
		{ label: 'Admin Control', href: '#admin-control', icon: iconPaths.shield, tone: 'from-violet-500 to-fuchsia-500' },
		{ label: 'Daftar Lembaga', href: '#institution-list', icon: iconPaths.building, tone: 'from-amber-500 to-orange-500' },
		{ label: 'CMS Hub', href: '/admin/super/cms-hub', icon: iconPaths.file, tone: 'from-sky-500 to-cyan-500' },
		{ label: 'Moderasi Buku', href: '/admin/super/buku', icon: iconPaths.book, tone: 'from-rose-500 to-pink-500' },
		{ label: 'Approval Addon', href: '/admin/super/addons', icon: iconPaths.wallet, tone: 'from-indigo-500 to-violet-500' },
		{ label: 'Topup Coin', href: '/admin/super/coin-topups', icon: iconPaths.coins, tone: 'from-amber-400 to-orange-500' },
		{ label: 'Akun', href: '/akun', icon: iconPaths.settings, tone: 'from-slate-600 to-slate-800' }
	];

	const quickActions = [
		{ label: 'CMS Hub', href: '/admin/super/cms-hub', icon: iconPaths.file, tone: 'from-sky-500 to-cyan-500' },
		{ label: 'Buku', href: '/admin/super/buku', icon: iconPaths.book, tone: 'from-rose-500 to-pink-500' },
		{ label: 'Addon', href: '/admin/super/addons', icon: iconPaths.wallet, tone: 'from-indigo-500 to-violet-500' },
		{ label: 'Topup Coin', href: '/admin/super/coin-topups', icon: iconPaths.coins, tone: 'from-amber-400 to-orange-500' },
		{ label: 'Akun', href: '/akun', icon: iconPaths.settings, tone: 'from-slate-600 to-slate-800' }
	];

	let filterRole = 'all';
	let filterAction = 'all';
	let filterRange = '24h';
	let isRefreshing = false;
	let mobileSidebarOpen = false;
	let lastRefreshed: number | null = null;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let formError: string | null = null;
	let notificationOpen = false;

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
	const formatCurrency = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
			value ?? 0
		);
	const formatDate = (value?: number | null) =>
		value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
	const formatDateTime = (value?: number | null) =>
		value
			? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
			: '-';
	const formatShortDate = (value?: number | null) =>
		value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

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
	const normalizeSlug = (value: string) =>
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.replace(/-{2,}/g, '-');
	const plainText = (value: string | null | undefined) => (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	const shortText = (value: string | null | undefined, length = 120) => {
		const source = plainText(value);
		if (!source) return '-';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const orgTypeName = (value?: string | null) => (value ? orgTypeLabel[value] ?? value : '-');
	const orgLabel = (org: Institution) => `${org.name} (${orgTypeLabel[org.type] ?? org.type})`;
	const orgsWithoutAdmin = (orgs: Institution[]) => orgs.filter((org) => !org.adminCount);
	const hasOrgWithoutAdmin = (orgs: Institution[]) => orgs.some((org) => !org.adminCount);
	const adminDisplayName = (admin: InstitutionAdmin) => admin.username || admin.email || admin.id;
	const adminRoleLabel = (admin: InstitutionAdmin) => {
		if (admin.isOwner && admin.isOrgAdmin) return 'Owner + Admin';
		if (admin.isOwner) return 'Owner';
		return 'Admin';
	};
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
	let adminUser: AdminUser | null = null;
	let adminName = 'Admin';
	let adminInitials = 'SA';
	let todayLabel = '';
	$: noAdminCount = orgsWithoutAdmin(data.institutions ?? []).length;
	$: trafficTotal = liveStats.trafficSources.reduce((sum, source) => sum + (source.total ?? 0), 0);
	$: formError = form && 'error' in form && typeof form.error === 'string' ? form.error : null;
	$: adminUser = (data.user ?? null) as AdminUser | null;
	$: adminName = adminUser?.username || adminUser?.email || 'Admin';
	$: adminInitials =
		adminName
			.split(/[.\s@_-]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase() || 'SA';
	$: todayLabel = new Date().toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	let highlightCards: Array<{
		label: string;
		value: string;
		note: string;
		accent: string;
		tone: string;
		icon: string;
	}> = [];
	$: highlightCards = [
		{
			label: 'Total Lembaga',
			value: formatNumber(data.stats.totalInstitutions),
			note: 'Seluruh organisasi terdaftar',
			accent: 'from-emerald-400 to-teal-500',
			tone: 'text-emerald-700',
			icon: iconPaths.building
		},
		{
			label: 'Total User',
			value: formatNumber(data.stats.totalUsers),
			note: 'Akun lintas lembaga',
			accent: 'from-sky-400 to-cyan-500',
			tone: 'text-sky-700',
			icon: iconPaths.users
		},
		{
			label: 'Login Hari Ini',
			value: formatNumber(liveStats.loginsToday),
			note: 'Akun aktif sepanjang hari ini',
			accent: 'from-amber-400 to-orange-500',
			tone: 'text-amber-700',
			icon: iconPaths.activity
		},
		{
			label: 'Lembaga Tanpa Admin',
			value: formatNumber(noAdminCount),
			note: 'Butuh perhatian segera',
			accent: 'from-rose-400 to-pink-500',
			tone: 'text-rose-700',
			icon: iconPaths.shield
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
			const row = rows.find((item) => item.type === type) ?? emptySummary(type);
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
				notifications = payload.notifications ?? notifications;
				notificationCounts = payload.notificationCounts ?? notificationCounts;
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
	const notificationTone = (severity?: string | null) => {
		if (severity === 'urgent') return 'border-rose-200 bg-rose-50 text-rose-700';
		if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
		return 'border-sky-200 bg-sky-50 text-sky-700';
	};
	const notificationIconLabel = (item: NotificationItem) => {
		const map: Record<string, string> = {
			register: 'RG',
			topup: 'TC',
			payment: 'PY',
			message: 'PS',
			institution: 'LB',
			order: 'OD'
		};
		return map[item.kind] ?? 'NT';
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
</svelte:head>

<div class="super-admin-shell min-h-screen bg-so-cream text-so-ink lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
	<aside class="hidden min-h-screen bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white lg:sticky lg:top-0 lg:flex lg:flex-col">
		<a href="/admin/super/overview" class="flex items-center gap-3">
			<img src={santriOnlineIconUrl} alt="SantriOnline" class="h-11 w-11 object-contain" />
			<div>
				<p class="font-display text-xl font-bold leading-none">SantriOnline</p>
				<p class="text-xs font-semibold text-white/65">Super Admin</p>
			</div>
		</a>

		<div class="mt-8 rounded-xl border border-white/10 bg-white/8 p-3">
			<div class="flex items-center gap-3">
				<div class="grid h-11 w-11 place-items-center rounded-lg bg-so-cream text-xs font-black text-so-green">
					{adminInitials}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-bold">{adminName}</p>
					<p class="mt-0.5 text-xs text-white/60">SUPER ADMIN</p>
				</div>
			</div>
		</div>

		<nav class="mt-6 grid gap-1.5">
			{#each adminNavItems as item}
				<a
					href={item.href}
					class={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${item.active ? 'bg-so-gold/24 text-white ring-1 ring-so-gold/30' : 'text-white/78 hover:bg-white/10 hover:text-white'}`}
				>
					<span class={`grid h-8 w-8 place-items-center rounded-lg ${item.active ? 'bg-so-gold text-so-green' : 'bg-white/8 text-white/80 group-hover:bg-white/14'}`}>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d={item.icon} />
						</svg>
					</span>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="mt-auto rounded-xl border border-so-gold/45 bg-so-green-3/55 p-4">
			<div class="flex items-start gap-3">
				<span class="grid h-9 w-9 place-items-center rounded-lg bg-so-gold text-so-green">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
						<path d={iconPaths.sparkles} />
					</svg>
				</span>
				<div>
					<p class="font-display text-base font-bold">Control Center</p>
					<p class="mt-1 text-xs leading-5 text-white/67">Pantau lembaga, user, konten, dan aktivitas sistem dari satu layar.</p>
				</div>
			</div>
		</div>
	</aside>

	{#if mobileSidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				class="absolute inset-0 bg-slate-950/45"
				type="button"
				aria-label="Tutup menu"
				on:click={() => (mobileSidebarOpen = false)}
			></button>
			<aside class="relative h-full w-[286px] bg-gradient-to-b from-so-green-3 via-so-green to-[#07351f] p-5 text-white shadow-2xl">
				<div class="flex items-center justify-between">
					<a href="/admin/super/overview" class="flex items-center gap-3" on:click={() => (mobileSidebarOpen = false)}>
						<img src={santriOnlineIconUrl} alt="SantriOnline" class="h-10 w-10 object-contain" />
						<div>
							<p class="font-display text-lg font-bold leading-none">SantriOnline</p>
							<p class="text-xs text-white/65">Super Admin</p>
						</div>
					</a>
					<button class="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10" type="button" aria-label="Tutup menu" on:click={() => (mobileSidebarOpen = false)}>
						×
					</button>
				</div>
				<nav class="mt-6 grid gap-1.5">
					{#each adminNavItems as item}
						<a
							href={item.href}
							class={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${item.active ? 'bg-so-gold/24 text-white' : 'text-white/78'}`}
							on:click={() => (mobileSidebarOpen = false)}
						>
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d={item.icon} />
							</svg>
							{item.label}
						</a>
					{/each}
				</nav>
			</aside>
		</div>
	{/if}

	<main class="min-w-0 pb-8">
		<header class="sticky top-0 z-30 border-b border-so-border/70 bg-so-cream/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
			<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
				<div class="flex items-center gap-3">
					<button class="grid h-10 w-10 place-items-center rounded-xl border border-so-border bg-white text-so-green shadow-sm lg:hidden" type="button" aria-label="Buka menu" on:click={() => (mobileSidebarOpen = true)}>
						☰
					</button>
					<div>
						<h1 class="font-display text-2xl font-bold tracking-tight text-so-green md:text-3xl">Dashboard</h1>
						<p class="mt-1 text-sm text-so-muted">Beranda ringkasan aktivitas platform</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-3">
					<form method="GET" class="relative min-w-[240px] flex-1 sm:min-w-[320px] xl:w-[360px] xl:flex-none">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-so-muted">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d={iconPaths.search} />
							</svg>
						</span>
						<input class="so-focus h-11 w-full rounded-xl border border-so-border bg-white/90 pl-9 pr-4 text-sm shadow-sm" name="q" value={data.searchQuery} placeholder="Cari user, email, lembaga..." />
					</form>
					<div class="relative">
						<button
							class="grid h-11 w-11 place-items-center rounded-xl border border-so-border bg-white text-so-green shadow-sm transition hover:border-so-green"
							type="button"
							aria-label="Notifikasi"
							aria-expanded={notificationOpen}
							on:click={() => (notificationOpen = !notificationOpen)}
						>
							<span class="relative">
								<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
									<path d={iconPaths.bell} />
								</svg>
								{#if notificationCounts.total > 0}
									<span class="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black leading-none text-white">
										{notificationCounts.total > 9 ? '9+' : notificationCounts.total}
									</span>
								{/if}
							</span>
						</button>
						{#if notificationOpen}
							<div class="absolute right-0 top-12 z-40 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-so-border bg-white shadow-2xl">
								<div class="border-b border-so-border bg-so-cream px-4 py-3">
									<div class="flex items-center justify-between gap-3">
										<div>
											<p class="font-display text-base font-bold text-so-green">Notifikasi Super Admin</p>
											<p class="mt-0.5 text-xs text-so-muted">Akun baru, pesan, topup, order, dan lembaga urgent</p>
										</div>
										<span class="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">
											{formatNumber(notificationCounts.urgent)} urgent
										</span>
									</div>
								</div>
								<div class="max-h-[430px] overflow-auto p-2 scrollbar-soft">
									{#if notifications.length === 0}
										<div class="px-4 py-8 text-center">
											<p class="text-sm font-bold text-so-ink">Belum ada notifikasi penting</p>
											<p class="mt-1 text-xs text-so-muted">Aktivitas urgent akan muncul di sini.</p>
										</div>
									{:else}
										{#each notifications as item}
											<a
												href={item.href}
												class="grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3 rounded-xl px-3 py-3 transition hover:bg-so-green/5"
												on:click={() => (notificationOpen = false)}
											>
												<span class={`grid h-9 w-9 place-items-center rounded-xl border text-[11px] font-black ${notificationTone(item.severity)}`}>
													{notificationIconLabel(item)}
												</span>
												<span class="min-w-0">
													<span class="block truncate text-sm font-bold text-so-ink">{item.title}</span>
													<span class="mt-0.5 block text-xs leading-5 text-so-muted">{item.body}</span>
												</span>
												<time class="whitespace-nowrap text-[11px] font-semibold text-so-muted">{formatShortTime(item.createdAt)}</time>
											</a>
										{/each}
									{/if}
								</div>
								<div class="border-t border-so-border bg-so-cream px-4 py-3">
									<div class="flex items-center justify-between text-xs font-bold text-so-muted">
										<span>{formatNumber(notificationCounts.total)} total</span>
										<a class="text-so-green hover:text-so-green-2" href="/admin/super/coin-topups" on:click={() => (notificationOpen = false)}>Cek topup</a>
									</div>
								</div>
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-3 rounded-xl border border-so-border bg-white px-3 py-2 shadow-sm">
						<div class="grid h-9 w-9 place-items-center rounded-full bg-so-green text-sm font-black text-white">{adminInitials}</div>
						<div class="hidden sm:block">
							<p class="max-w-[140px] truncate text-sm font-bold text-so-ink">{adminName}</p>
							<p class="text-xs text-so-muted">Superadmin</p>
						</div>
					</div>
				</div>
			</div>
		</header>

		<div class="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
			{#if formError}
				<div class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
					{formError}
				</div>
			{/if}

			<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each highlightCards as card}
					<article class="admin-card p-5">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold text-so-muted">{card.label}</p>
								<p class={`mt-2 text-3xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
								<p class="mt-2 text-xs text-so-muted">{card.note}</p>
							</div>
							<div class={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
								<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
									<path d={card.icon} />
								</svg>
							</div>
						</div>
					</article>
				{/each}
			</section>

			<section class="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
				<div class="admin-card overflow-hidden">
					<div class="border-b border-so-border/80 px-5 py-4 sm:px-6">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<h2 class="font-display text-xl font-bold text-so-green">Live Activity Feed</h2>
								<p class="mt-1 text-sm text-so-muted">Aktivitas terbaru dari seluruh sistem</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{recentActivities.length} event</span>
								<button class="inline-flex h-9 items-center gap-2 rounded-xl border border-so-border bg-white px-3 text-xs font-bold text-so-green shadow-sm transition hover:border-so-green" type="button" on:click={refreshLive} disabled={isRefreshing}>
									<svg class={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
										<path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.74-2.74L3 16M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.74 2.74L21 8" />
									</svg>
									{isRefreshing ? 'Sync' : 'Refresh'}
								</button>
							</div>
						</div>
						<div class="mt-4 grid gap-2 md:grid-cols-3">
							<label class="text-xs font-semibold text-so-muted">
								Role
								<select class="so-focus mt-1 h-10 w-full rounded-xl border border-so-border bg-white px-3 text-sm text-so-ink" bind:value={filterRole} on:change={refreshLive}>
									{#each roleOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label class="text-xs font-semibold text-so-muted">
								Aksi
								<select class="so-focus mt-1 h-10 w-full rounded-xl border border-so-border bg-white px-3 text-sm text-so-ink" bind:value={filterAction} on:change={refreshLive}>
									{#each actionOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label class="text-xs font-semibold text-so-muted">
								Rentang
								<select class="so-focus mt-1 h-10 w-full rounded-xl border border-so-border bg-white px-3 text-sm text-so-ink" bind:value={filterRange} on:change={refreshLive}>
									{#each rangeOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</label>
						</div>
					</div>

					<div class="max-h-[470px] overflow-auto px-5 py-4 sm:px-6 scrollbar-soft">
						{#if recentActivities.length === 0}
							<p class="text-sm text-so-muted">Belum ada aktivitas tercatat.</p>
						{:else}
							<div class="space-y-1">
								{#each recentActivities as activity}
									{@const meta = parseMetadata(activity.metadata)}
									<div class="grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 rounded-xl px-2 py-3 transition hover:bg-so-green/5">
										<div class="grid h-9 w-9 place-items-center rounded-lg bg-so-green/10 text-[11px] font-black text-so-green">
											{actionLabel(activity.action).slice(0, 2).toUpperCase()}
										</div>
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<p class="truncate text-sm font-bold text-so-ink">{actorLabel(activity)}</p>
												{#if activity.role}
													<span class="rounded-full border border-so-border bg-stone-50 px-2 py-0.5 text-[10px] font-bold uppercase text-so-muted">{activity.role}</span>
												{/if}
											</div>
											<p class="mt-0.5 text-xs text-so-muted">{actionLabel(activity.action)}</p>
											{#if meta?.path}
												<p class="truncate text-xs text-stone-400">{meta.path}</p>
											{:else if meta?.source}
												<p class="truncate text-xs text-stone-400">{meta.source}</p>
											{:else if meta?.orgName}
												<p class="truncate text-xs text-stone-400">{meta.orgName}</p>
											{/if}
										</div>
										<time class="whitespace-nowrap text-xs text-so-muted">{formatShortTime(activity.createdAt)}</time>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="grid gap-6">
					<section class="admin-card p-5 sm:p-6">
						<div class="flex items-start justify-between gap-4">
							<div>
								<h2 class="font-display text-xl font-bold text-so-green">System Pulse</h2>
								<p class="mt-1 text-sm text-so-muted">{todayLabel}</p>
							</div>
							<span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">LIVE</span>
						</div>
						<div class="mt-5 grid grid-cols-2 gap-3">
							<div class="rounded-xl border border-so-border bg-so-cream p-3">
								<p class="text-xs font-semibold text-so-muted">Register</p>
								<p class="mt-2 text-2xl font-bold text-so-green">{formatNumber(liveStats.registrationsToday)}</p>
							</div>
							<div class="rounded-xl border border-so-border bg-so-cream p-3">
								<p class="text-xs font-semibold text-so-muted">Interaksi</p>
								<p class="mt-2 text-2xl font-bold text-amber-700">{formatNumber(trafficTotal)}</p>
							</div>
						</div>
						<div class="mt-5 space-y-3">
							{#if liveStats.trafficSources.length === 0}
								<p class="text-sm text-so-muted">Belum ada data klik.</p>
							{:else}
								{#each liveStats.trafficSources as source}
									<div>
										<div class="mb-1 flex items-center justify-between gap-3 text-sm">
											<span class="truncate font-bold text-so-ink">{actionLabel(source.action)}</span>
											<span class="font-bold text-so-green">{formatNumber(source.total)}</span>
										</div>
										<div class="h-2 overflow-hidden rounded-full bg-stone-100">
											<div class="h-full rounded-full bg-gradient-to-r from-so-gold to-so-green" style={`width:${Math.max(8, Math.round(((source.total ?? 0) / Math.max(trafficTotal, 1)) * 100))}%`}></div>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</section>

					<section class="admin-card p-5 sm:p-6">
						<h2 class="font-display text-xl font-bold text-so-green">Akses Cepat</h2>
						<div class="mt-4 grid grid-cols-2 gap-3">
							{#each quickActions as item}
								<a href={item.href} class="group rounded-xl border border-so-border bg-white p-3 text-sm font-bold text-so-ink transition hover:border-so-green hover:text-so-green">
									<svg class="mb-2 h-4 w-4 text-so-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
										<path d={item.icon} />
									</svg>
									{item.label}
								</a>
							{/each}
						</div>
					</section>
				</div>
			</section>

			<section class="mt-6 grid gap-6 xl:grid-cols-2">
				<div class="admin-card p-5 sm:p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h2 class="font-display text-xl font-bold text-so-green">Lembaga Pendidikan</h2>
							<p class="mt-1 text-sm text-so-muted">Pondok, TPQ, dan Rumah Tahfidz</p>
						</div>
						<a href="#institution-list" class="text-xs font-bold text-so-green hover:text-so-green-2">Lihat daftar</a>
					</div>
					<div class="mt-5 grid gap-3 md:grid-cols-3">
						{#each educationCards as card}
							<a href="#institution-list" class="rounded-xl border border-so-border bg-white p-4 transition hover:border-so-green">
								<p class="text-xs font-bold text-so-muted">{card.label}</p>
								<p class={`mt-2 text-2xl font-bold tabular-nums ${card.accent}`}>{formatNumber(card.totalInstitutions)}</p>
								<p class="mt-1 text-xs text-so-muted">Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}</p>
								<div class="mt-4 grid grid-cols-3 gap-2 text-xs">
									<div>
										<p class="text-so-muted">{card.primaryLabel}</p>
										<p class="font-bold text-so-ink">{formatNumber(card.primaryCount)}</p>
									</div>
									<div>
										<p class="text-so-muted">{card.staffLabel}</p>
										<p class="font-bold text-so-ink">{formatNumber(card.staffCount)}</p>
									</div>
									<div>
										<p class="text-so-muted">Admin</p>
										<p class="font-bold text-so-ink">{formatNumber(card.adminCount)}</p>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="admin-card p-5 sm:p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h2 class="font-display text-xl font-bold text-so-green">Lembaga Jamaah</h2>
							<p class="mt-1 text-sm text-so-muted">Masjid dan musholla</p>
						</div>
						<a href="#institution-list" class="text-xs font-bold text-so-green hover:text-so-green-2">Lihat daftar</a>
					</div>
					<div class="mt-5 grid gap-3 md:grid-cols-2">
						{#each communityCards as card}
							<a href="#institution-list" class="rounded-xl border border-so-border bg-white p-4 transition hover:border-so-green">
								<p class="text-xs font-bold text-so-muted">{card.label}</p>
								<p class={`mt-2 text-2xl font-bold tabular-nums ${card.accent}`}>{formatNumber(card.totalInstitutions)}</p>
								<p class="mt-1 text-xs text-so-muted">Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}</p>
								<div class="mt-4 grid grid-cols-3 gap-2 text-xs">
									<div>
										<p class="text-so-muted">{card.primaryLabel}</p>
										<p class="font-bold text-so-ink">{formatNumber(card.primaryCount)}</p>
									</div>
									<div>
										<p class="text-so-muted">{card.staffLabel}</p>
										<p class="font-bold text-so-ink">{formatNumber(card.staffCount)}</p>
									</div>
									<div>
										<p class="text-so-muted">Admin</p>
										<p class="font-bold text-so-ink">{formatNumber(card.adminCount)}</p>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>

			<section id="global-search" class="admin-card mt-6 p-5 sm:p-6">
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="font-display text-xl font-bold text-so-green">Global User Search</h2>
						<p class="mt-1 text-sm text-so-muted">Cari user berdasarkan nama atau email di seluruh data pengguna.</p>
					</div>
					<form method="GET" class="flex w-full max-w-md gap-2">
						<input type="text" name="q" value={data.searchQuery} placeholder="Cari nama atau email..." class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-4 text-sm shadow-sm" />
						<button class="h-11 rounded-xl bg-so-green px-5 text-sm font-bold text-white transition hover:bg-so-green-2" type="submit">Cari</button>
					</form>
				</div>
				<div class="mt-5">
					{#if data.searchQuery.length >= 2}
						{#if data.searchResults.length === 0}
							<p class="text-sm text-so-muted">Tidak ada user ditemukan.</p>
						{:else}
							<div class="overflow-auto rounded-xl border border-so-border bg-white">
								<table class="w-full min-w-[760px] text-sm">
									<thead class="bg-so-cream text-left text-xs uppercase text-so-muted">
										<tr>
											<th class="px-4 py-3">Nama</th>
											<th class="px-4 py-3">Email</th>
											<th class="px-4 py-3">Role</th>
											<th class="px-4 py-3">Lembaga</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-so-border">
										{#each data.searchResults as user}
											<tr class="hover:bg-so-green/5">
												<td class="px-4 py-3 font-bold text-so-ink">{user.username || '-'}</td>
												<td class="px-4 py-3 text-so-muted">{user.email}</td>
												<td class="px-4 py-3 text-so-muted">{user.role}</td>
												<td class="px-4 py-3 text-so-muted">{user.orgName ? `${user.orgName} (${orgTypeName(user.orgType)})` : '-'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					{:else}
						<p class="text-sm text-so-muted">Masukkan minimal 2 karakter untuk mencari.</p>
					{/if}
				</div>
			</section>

			<section id="admin-control" class="admin-card mt-6 p-5 sm:p-6">
				<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="font-display text-xl font-bold text-so-green">Admin Control Room</h2>
						<p class="mt-1 text-sm text-so-muted">Kelola admin lembaga dari satu tempat.</p>
					</div>
					<span class="rounded-full border border-so-border bg-white px-3 py-1 text-xs font-bold text-so-muted">{formatNumber(noAdminCount)} tanpa admin</span>
				</div>
				{#if hasOrgWithoutAdmin(data.institutions)}
					<div class="mt-5 grid gap-4 lg:grid-cols-2">
						<form method="POST" action="?/assignExistingAdmin" class="min-w-0 rounded-xl border border-so-border bg-so-cream p-4">
							<h3 class="text-sm font-bold text-so-ink">Tetapkan Admin dari User Terdaftar</h3>
							<p class="mt-1 text-xs text-so-muted">Pilih user yang sudah ada untuk menjadi admin lembaga.</p>
							<div class="mt-4 grid gap-3 min-w-0">
								<select name="orgId" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" required>
									<option value="">Pilih lembaga</option>
									{#each orgsWithoutAdmin(data.institutions) as org}
										<option value={org.id}>{orgLabel(org)}</option>
									{/each}
								</select>
								<select name="userId" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" required>
									<option value="">Pilih user</option>
									{#each data.availableUsers as user}
										<option value={user.id}>{userLabel(user)}</option>
									{/each}
								</select>
								<button class="h-10 rounded-xl bg-so-green px-4 text-sm font-bold text-white transition hover:bg-so-green-2" type="submit">Set Admin</button>
							</div>
						</form>
						<form method="POST" action="?/createAdmin" class="min-w-0 rounded-xl border border-so-border bg-so-cream p-4">
							<h3 class="text-sm font-bold text-so-ink">Tambah Admin Baru</h3>
							<p class="mt-1 text-xs text-so-muted">Buat akun admin baru untuk lembaga tanpa admin.</p>
							<div class="mt-4 grid gap-3 min-w-0">
								<select name="orgId" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" required>
									<option value="">Pilih lembaga</option>
									{#each orgsWithoutAdmin(data.institutions) as org}
										<option value={org.id}>{orgLabel(org)}</option>
									{/each}
								</select>
								<input name="name" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" placeholder="Nama admin" required />
								<input name="email" type="email" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" placeholder="Email admin" required />
								<input name="password" type="password" class="so-focus h-11 w-full min-w-0 rounded-xl border border-so-border bg-white px-3 text-sm" placeholder="Password (min 6)" minlength="6" required />
								<button class="h-10 rounded-xl bg-so-gold px-4 text-sm font-bold text-so-green transition hover:bg-so-gold-2" type="submit">Buat Admin</button>
							</div>
						</form>
					</div>
				{:else}
					<p class="mt-4 text-sm text-so-muted">Semua lembaga sudah memiliki admin.</p>
				{/if}
			</section>

			<section id="institution-list" class="admin-card mt-6 overflow-hidden">
				<div class="flex flex-col gap-2 border-b border-so-border px-5 py-4 md:flex-row md:items-center md:justify-between sm:px-6">
					<div>
						<h2 class="font-display text-xl font-bold text-so-green">Daftar Lembaga</h2>
						<p class="mt-1 text-sm text-so-muted">Pantau siapa admin pengelola setiap lembaga dan gunakan ghost login jika perlu.</p>
					</div>
					<span class="rounded-full border border-so-border bg-white px-4 py-1 text-xs font-bold text-so-muted">{formatNumber(data.institutions.length)} lembaga</span>
				</div>
				{#if data.institutions.length === 0}
					<p class="p-5 text-sm text-so-muted sm:p-6">Belum ada lembaga terdaftar.</p>
				{:else}
					<div class="overflow-auto">
						<table class="w-full min-w-[1120px] text-sm">
							<thead class="bg-so-cream text-left text-xs uppercase text-so-muted">
								<tr>
									<th class="px-5 py-3">Nama</th>
									<th class="px-5 py-3">Tipe</th>
									<th class="px-5 py-3">Status</th>
									<th class="px-5 py-3">Admin Pengelola</th>
									<th class="px-5 py-3 text-right">Anggota</th>
									<th class="px-5 py-3">Dibuat</th>
									<th class="px-5 py-3">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-so-border bg-white">
								{#each data.institutions as org}
									<tr class="hover:bg-so-green/5">
										<td class="px-5 py-3 font-bold text-so-ink">{org.name}</td>
										<td class="px-5 py-3 text-so-muted">{orgTypeLabel[org.type] ?? org.type}</td>
										<td class="px-5 py-3">
											<span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(org.status)}`}>{org.status}</span>
										</td>
										<td class="px-5 py-3">
											{#if org.admins.length}
												<div class="space-y-2">
													{#each org.admins as admin (admin.id)}
														<div class="rounded-xl border border-so-border bg-so-cream px-3 py-2">
															<div class="flex items-start justify-between gap-3">
																<div class="min-w-0">
																	<p class="truncate text-sm font-bold text-so-ink">{adminDisplayName(admin)}</p>
																	<p class="truncate text-xs text-so-muted">{admin.email}</p>
																</div>
																<span class="shrink-0 rounded-full bg-so-green/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-so-green">
																	{adminRoleLabel(admin)}
																</span>
															</div>
														</div>
													{/each}
												</div>
											{:else}
												<span class="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
													Belum ada admin
												</span>
											{/if}
										</td>
										<td class="px-5 py-3 text-right font-bold text-so-ink">{formatNumber(org.totalMembers)}</td>
										<td class="px-5 py-3 text-so-muted">{formatDate(org.createdAt)}</td>
										<td class="px-5 py-3">
											{#if org.adminCount}
												<a class="inline-flex h-9 items-center justify-center rounded-xl border border-so-border bg-white px-3 text-xs font-bold text-so-green transition hover:border-so-green" href={`/admin/super/impersonate?orgId=${org.id}`}>Login Sebagai Admin</a>
											{:else}
												<span class="text-xs font-semibold text-so-muted">Admin belum ada</span>
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
	</main>
</div>

<style>
	:global(body:has(.super-admin-shell)) {
		background: #faf8f3;
	}

	:global(.super-admin-shell) {
		font-family: var(--font-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
	}

	:global(.super-admin-shell .admin-card) {
		border: 1px solid rgb(232 228 220 / 0.95);
		border-radius: var(--radius-so, 12px);
		background: rgb(255 255 255 / 0.88);
		box-shadow: var(--shadow-card, 0 12px 34px rgb(27 67 50 / 0.08));
		backdrop-filter: blur(18px);
	}
</style>
