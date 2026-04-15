<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import MediaGalleryModal from '$lib/components/MediaGalleryModal.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type Institution = PageData['institutions'][number];
	type AvailableUser = PageData['availableUsers'][number];
	type ActivityRow = PageData['liveStats']['recentActivities'][number];
	type LiveActivity = ActivityRow & { role?: string | null };
	type CmsPost = PageData['cms']['posts'][number];
	type DigitalProduct = PageData['digitalCommerce']['products'][number];
	type DigitalPaymentMethod = PageData['digitalCommerce']['paymentMethods'][number];
	type DigitalSale = PageData['digitalCommerce']['recentSales'][number];
	type DigitalSalesPoint = PageData['digitalCommerce']['salesChart'][number];
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
	let formError: string | null = null;

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

	const paymentTypeLabel: Record<string, string> = {
		bank: 'Bank Transfer',
		ewallet: 'E-Wallet',
		qris: 'QRIS',
		manual: 'Manual'
	};

	const cmsStatusClass = (status?: string | null) => {
		switch ((status ?? '').toLowerCase()) {
			case 'published':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'draft':
				return 'border-amber-200 bg-amber-50 text-amber-700';
			default:
				return 'border-slate-200 bg-slate-100 text-slate-600';
		}
	};

	const productStatusClass = (status?: string | null) => {
		switch ((status ?? '').toLowerCase()) {
			case 'published':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'draft':
				return 'border-sky-200 bg-sky-50 text-sky-700';
			case 'archived':
				return 'border-slate-200 bg-slate-100 text-slate-600';
			default:
				return 'border-slate-200 bg-slate-100 text-slate-600';
		}
	};

	const saleStatusClass = (status?: string | null) => {
		switch ((status ?? '').toLowerCase()) {
			case 'paid':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'pending':
				return 'border-amber-200 bg-amber-50 text-amber-700';
			case 'failed':
				return 'border-rose-200 bg-rose-50 text-rose-700';
			case 'refunded':
				return 'border-indigo-200 bg-indigo-50 text-indigo-700';
			default:
				return 'border-slate-200 bg-slate-100 text-slate-600';
		}
	};

	const paymentTone = (type?: string | null) => {
		switch ((type ?? '').toLowerCase()) {
			case 'bank':
				return 'border-sky-200 bg-sky-50 text-sky-700';
			case 'ewallet':
				return 'border-violet-200 bg-violet-50 text-violet-700';
			case 'qris':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			default:
				return 'border-amber-200 bg-amber-50 text-amber-700';
		}
	};

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
	$: formError = form && 'error' in form && typeof form.error === 'string' ? form.error : null;

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

	const cmsOverviewCards = [
		{
			label: 'Artikel',
			value: data.cms.stats.totalPosts,
			note: 'Semua konten blog'
		},
		{
			label: 'Published',
			value: data.cms.stats.publishedPosts,
			note: 'Sudah tayang di /blog'
		},
		{
			label: 'Terjadwal',
			value: data.cms.stats.scheduledPosts,
			note: 'Menunggu waktu publish'
		}
	];

	const digitalCards = [
		{
			label: 'Produk Live',
			value: data.digitalCommerce.stats.publishedProducts,
			note: 'Siap dijual'
		},
		{
			label: 'Metode Aktif',
			value: data.digitalCommerce.stats.activeMethods,
			note: 'Muncul di checkout'
		},
		{
			label: 'Penjualan',
			value: data.digitalCommerce.stats.totalSales,
			note: 'Order tercatat'
		},
		{
			label: 'Omzet',
			value: data.digitalCommerce.stats.totalRevenue,
			note: 'Total pemasukan'
		}
	];

	let salesChartMax = 1;
	$: salesChartMax = Math.max(
		...data.digitalCommerce.salesChart.map((point: DigitalSalesPoint) => point.revenue),
		1
	);

	let coverInput: HTMLInputElement | null = null;
	let digitalFileInput: HTMLInputElement | null = null;
	let uploadingCover = false;
	let uploadingDigitalFile = false;

	let productFormSeed = '';
	let productId = '';
	let productTitle = '';
	let productSlug = '';
	let productSummary = '';
	let productDescription = '';
	let productPrice = '';
	let productCoverUrl = '';
	let productFileUrl = '';
	let productStatus: 'draft' | 'published' | 'archived' = 'draft';
	let productFeatured = false;
	let productPaymentMethodIds: string[] = [];

	let paymentFormSeed = '';
	let paymentMethodId = '';
	let paymentMethodName = '';
	let paymentMethodType: 'bank' | 'ewallet' | 'qris' | 'manual' = 'bank';
	let paymentAccountName = '';
	let paymentAccountNumber = '';
	let paymentInstructions = '';
	let paymentDisplayOrder = 0;
	let paymentIsActive = true;

	const syncProductForm = (product: DigitalProduct | null) => {
		productId = product?.id ?? '';
		productTitle = product?.title ?? '';
		productSlug = product?.slug ?? '';
		productSummary = product?.summary ?? '';
		productDescription = product?.description ?? '';
		productPrice = product ? String(product.price) : '';
		productCoverUrl = product?.coverUrl ?? '';
		productFileUrl = product?.fileUrl ?? '';
		productStatus = (product?.status ?? 'draft') as 'draft' | 'published' | 'archived';
		productFeatured = Boolean(product?.featured);
		productPaymentMethodIds = [...(product?.paymentMethodIds ?? [])];
	};

	const syncPaymentForm = (payment: DigitalPaymentMethod | null) => {
		paymentMethodId = payment?.id ?? '';
		paymentMethodName = payment?.name ?? '';
		paymentMethodType = (payment?.type ?? 'bank') as 'bank' | 'ewallet' | 'qris' | 'manual';
		paymentAccountName = payment?.accountName ?? '';
		paymentAccountNumber = payment?.accountNumber ?? '';
		paymentInstructions = payment?.instructions ?? '';
		paymentDisplayOrder = payment?.displayOrder ?? 0;
		paymentIsActive = payment ? Boolean(payment.isActive) : true;
	};

	$: {
		const nextSeed = data.digitalCommerce.editingProduct
			? `edit:${data.digitalCommerce.editingProduct.id}:${data.digitalCommerce.editingProduct.updatedAt}`
			: 'new';
		if (nextSeed !== productFormSeed) {
			productFormSeed = nextSeed;
			syncProductForm(data.digitalCommerce.editingProduct);
		}
	}

	$: {
		const nextSeed = data.digitalCommerce.editingPaymentMethod
			? `edit:${data.digitalCommerce.editingPaymentMethod.id}:${data.digitalCommerce.editingPaymentMethod.updatedAt}`
			: 'new';
		if (nextSeed !== paymentFormSeed) {
			paymentFormSeed = nextSeed;
			syncPaymentForm(data.digitalCommerce.editingPaymentMethod);
		}
	}

	const generateProductSlug = () => {
		productSlug = normalizeSlug(productSlug || productTitle);
	};

	const onPickCover = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		uploadingCover = true;
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch('/api/upload', { method: 'POST', body: formData });
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || 'Upload cover gagal');
			}
			const payload = await response.json();
			productCoverUrl = payload.url ?? '';
		} catch (err) {
			console.error('Upload cover error:', err);
			alert('Gagal mengunggah cover produk.');
		} finally {
			uploadingCover = false;
			if (target) target.value = '';
		}
	};

	const onPickDigitalFile = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		uploadingDigitalFile = true;
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch('/api/upload/digital', { method: 'POST', body: formData });
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.error || 'Upload file digital gagal');
			}
			const payload = await response.json();
			productFileUrl = payload.url ?? '';
		} catch (err) {
			console.error('Upload digital file error:', err);
			alert('Gagal mengunggah file digital.');
		} finally {
			uploadingDigitalFile = false;
			if (target) target.value = '';
		}
	};

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

	{#if formError}
		<div class="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
			{formError}
		</div>
	{/if}

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
								<p class="text-[11px] uppercase tracking-[0.22em] text-slate-400 leading-snug">{card.label}</p>
								<p class={`mt-2 text-2xl font-semibold tabular-nums ${card.accent}`}>
									{formatNumber(card.totalInstitutions)}
								</p>
								<p class="text-xs text-slate-500">
									Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}
								</p>
							</div>
							<div class={`h-10 w-10 rounded-2xl bg-gradient-to-br ${card.tone}`}></div>
						</div>
						<div class="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">
									{card.primaryLabel}
								</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.primaryCount)}</p>
							</div>
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">
									{card.staffLabel}
								</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.staffCount)}</p>
							</div>
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">Admin</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.adminCount)}</p>
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
								<p class="text-[11px] uppercase tracking-[0.22em] text-slate-400 leading-snug">{card.label}</p>
								<p class={`mt-2 text-2xl font-semibold tabular-nums ${card.accent}`}>
									{formatNumber(card.totalInstitutions)}
								</p>
								<p class="text-xs text-slate-500">
									Aktif {formatNumber(card.activeInstitutions)} • Pending {formatNumber(card.pendingInstitutions)}
								</p>
							</div>
							<div class={`h-10 w-10 rounded-2xl bg-gradient-to-br ${card.tone}`}></div>
						</div>
						<div class="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">
									{card.primaryLabel}
								</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.primaryCount)}</p>
							</div>
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">
									{card.staffLabel}
								</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.staffCount)}</p>
							</div>
							<div class="min-w-0">
								<p class="text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-snug break-words">Admin</p>
								<p class="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(card.adminCount)}</p>
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

	<section
		id="cms-hub"
		class="reveal rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur"
		style="animation-delay: 150ms;"
	>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">CMS Hub</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Blog dan Produk Digital dalam satu ruang super admin</h2>
				<p class="mt-2 text-sm text-slate-500">
					Artikel publik tetap dikelola lewat CMS blog, sedangkan produk digital, metode pembayaran, dan ringkasan penjualan
					bisa langsung dipantau dari halaman ini.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a href="/admin/posts" class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
					Buka CMS Artikel
				</a>
				<a href="/admin/posts/new" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
					Tulis Artikel Baru
				</a>
				<a href="#cms-digital" class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
					Buka Studio Produk
				</a>
			</div>
		</div>

		<div class="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
			<div class="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 p-6 text-white shadow-xl">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div class="max-w-xl">
						<p class="text-xs uppercase tracking-[0.32em] text-white/60">CMS Artikel</p>
						<h3 class="mt-2 text-2xl font-semibold">Akses blog tetap utuh untuk super admin</h3>
						<p class="mt-2 text-sm text-white/70">
							Anda sekarang bisa masuk ke daftar post, tambah artikel baru, dan edit konten tanpa perlu ghost login sebagai admin lembaga.
						</p>
					</div>
					<a href="/admin/posts" class="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
						Lihat Semua Post
					</a>
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-3">
					{#each cmsOverviewCards as card}
						<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">{card.label}</p>
							<p class="mt-3 text-3xl font-semibold">{formatNumber(card.value)}</p>
							<p class="mt-1 text-xs text-white/70">{card.note}</p>
						</div>
					{/each}
				</div>

				<div class="mt-6 space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold text-white">Artikel terbaru</p>
						<a href="/admin/posts/new" class="text-xs font-semibold text-emerald-200 hover:text-white">Tambah artikel</a>
					</div>
					{#if data.cms.posts.length === 0}
						<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-5 text-sm text-white/70">
							Belum ada artikel. Mulai dari post pertama untuk mengisi halaman blog publik.
						</div>
					{:else}
						{#each data.cms.posts as post}
							<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cmsStatusClass(post.status)}`}>
												{post.status}
											</span>
											<span class="text-xs text-white/60">{formatDate(post.created_at)}</span>
										</div>
										<p class="mt-2 text-base font-semibold text-white">{post.title}</p>
										<p class="mt-1 text-sm text-white/70">{shortText(post.excerpt || post.content, 140)}</p>
									</div>
									<div class="flex shrink-0 gap-2">
										{#if post.status === 'published'}
											<a href={`/blog/${post.slug}`} class="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
												Lihat
											</a>
										{/if}
										<a href={`/admin/posts/${post.id}/edit`} class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-50">
											Edit
										</a>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="text-xs uppercase tracking-[0.32em] text-emerald-300/70">Digital Store</p>
						<h3 class="mt-2 text-2xl font-semibold">Studio produk ala link-in-bio</h3>
						<p class="mt-2 text-sm text-white/70">
							Upload file digital, aktifkan metode bayar, lalu pantau omzet dan order dari panel yang sama.
						</p>
					</div>
					<a href="#sales-chart" class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
						Lihat Grafik
					</a>
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-2">
					{#each digitalCards as card}
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">{card.label}</p>
							<p class="mt-3 text-2xl font-semibold">
								{#if card.label === 'Omzet'}
									{formatCurrency(card.value)}
								{:else}
									{formatNumber(card.value)}
								{/if}
							</p>
							<p class="mt-1 text-xs text-white/65">{card.note}</p>
						</div>
					{/each}
				</div>

				<div class="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-white">Rata-rata order</p>
							<p class="mt-2 text-3xl font-semibold text-emerald-300">
								{formatCurrency(data.digitalCommerce.stats.averageOrderValue)}
							</p>
							<p class="mt-1 text-xs text-white/65">Nilai rata-rata tiap penjualan tercatat.</p>
						</div>
						<div class="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-right">
							<p class="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">Ready</p>
							<p class="mt-1 text-sm font-semibold text-white">{formatNumber(data.digitalCommerce.stats.totalProducts)} produk</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<a href="#payment-methods" class="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
							Metode Pembayaran
						</a>
						<a href="#cms-digital" class="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
							Kelola Produk
						</a>
						<a href="#sales-chart" class="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
							Riwayat Penjualan
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section
		id="cms-digital"
		class="reveal rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur"
		style="animation-delay: 170ms;"
	>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Produk Digital</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Studio upload, metode bayar, dan penjualan</h2>
				<p class="mt-2 text-sm text-slate-500">
					Strukturnya sengaja dibuat seperti CMS: Anda punya editor produk, daftar konten, daftar metode pembayaran, dan area ringkasan penjualan.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a href="#payment-methods" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
					Atur Metode Bayar
				</a>
				<a href="#sales-chart" class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
					Grafik Penjualan
				</a>
			</div>
		</div>

		<div class="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
			<form method="POST" action="?/saveProduct" class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-900">
							{data.digitalCommerce.editingProduct ? 'Edit Produk Digital' : 'Produk Digital Baru'}
						</p>
						<p class="text-xs text-slate-500">Simpan file digital, cover produk, harga, dan metode bayar yang ingin ditampilkan.</p>
					</div>
					{#if data.digitalCommerce.editingProduct}
						<a href="/admin/super/overview#cms-digital" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
							Batal Edit
						</a>
					{/if}
				</div>

				<input type="hidden" name="id" bind:value={productId} />

				<div class="mt-5 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Produk</span>
						<input
							name="title"
							class="input input-bordered mt-2 w-full"
							placeholder="E-book Tahsin Premium"
							bind:value={productTitle}
						/>
					</label>
					<div>
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Slug</span>
							<button type="button" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" on:click={generateProductSlug}>
								Buat slug
							</button>
						</div>
						<input
							name="slug"
							class="input input-bordered mt-2 w-full"
							placeholder="ebook-tahsin-premium"
							bind:value={productSlug}
						/>
					</div>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[1fr,200px,180px]">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ringkasan Singkat</span>
						<input
							name="summary"
							class="input input-bordered mt-2 w-full"
							placeholder="Konten singkat yang tampil di card produk"
							bind:value={productSummary}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Harga (IDR)</span>
						<input name="price" type="number" min="0" class="input input-bordered mt-2 w-full" bind:value={productPrice} />
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
						<select name="status" class="select select-bordered mt-2 w-full" bind:value={productStatus}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</label>
				</div>

				<label class="mt-4 block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Deskripsi Produk</span>
					<textarea
						name="description"
						rows="5"
						class="textarea textarea-bordered mt-2 w-full"
						placeholder="Jelaskan isi produk, bonus, cara akses, dan hal lain yang penting untuk pembeli."
						bind:value={productDescription}
					></textarea>
				</label>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					<div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
						<div class="flex items-center justify-between gap-2">
							<div>
								<p class="text-sm font-semibold text-slate-900">Cover Produk</p>
								<p class="text-xs text-slate-500">Bisa upload gambar baru atau pilih dari galeri.</p>
							</div>
							<div class="flex gap-2">
								<MediaGalleryModal onSelect={(url: string) => (productCoverUrl = url)}>
									<svelte:fragment slot="trigger" let:open>
										<button type="button" class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" on:click={open}>
											Galeri
										</button>
									</svelte:fragment>
								</MediaGalleryModal>
								<button type="button" class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100" on:click={() => coverInput?.click()}>
									{uploadingCover ? 'Uploading...' : 'Upload'}
								</button>
							</div>
						</div>

						{#if productCoverUrl}
							<div class="mt-4 space-y-3">
								<img src={productCoverUrl} alt="Cover produk" class="aspect-[4/3] w-full rounded-2xl border border-slate-200 object-cover" />
								<div class="flex flex-wrap gap-2">
									<a href={productCoverUrl} target="_blank" rel="noopener" class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
										Buka
									</a>
									<button type="button" class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100" on:click={() => (productCoverUrl = '')}>
										Hapus
									</button>
								</div>
							</div>
						{:else}
							<div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
								Belum ada cover. Upload gambar atau pilih dari galeri media.
							</div>
						{/if}

						<input type="file" accept="image/*" class="hidden" bind:this={coverInput} on:change={onPickCover} />
						<input type="hidden" name="coverUrl" bind:value={productCoverUrl} />
					</div>

					<div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
						<div class="flex items-center justify-between gap-2">
							<div>
								<p class="text-sm font-semibold text-slate-900">File Digital / Link Akses</p>
								<p class="text-xs text-slate-500">Upload file PDF, ZIP, EPUB, DOCX, MP3, MP4, dan lainnya.</p>
							</div>
							<button type="button" class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100" on:click={() => digitalFileInput?.click()}>
								{uploadingDigitalFile ? 'Uploading...' : 'Upload File'}
							</button>
						</div>

						<label class="mt-4 block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">URL File / Drive / Storage</span>
							<input
								name="fileUrl"
								class="input input-bordered mt-2 w-full"
								placeholder="https://files.santrionline.com/digital-products/..."
								bind:value={productFileUrl}
							/>
						</label>

						{#if productFileUrl}
							<div class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
								<p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">File Aktif</p>
								<p class="mt-2 break-all text-sm text-slate-700">{productFileUrl}</p>
								<div class="mt-3 flex flex-wrap gap-2">
									<a href={productFileUrl} target="_blank" rel="noopener" class="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
										Buka File
									</a>
									<button type="button" class="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50" on:click={() => (productFileUrl = '')}>
										Hapus Link
									</button>
								</div>
							</div>
						{:else}
							<div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
								Belum ada file digital. Produk draft boleh kosong, tetapi produk published wajib punya file atau link.
							</div>
						{/if}

						<input
							type="file"
							accept=".pdf,.zip,.epub,.docx,.xlsx,.pptx,.mp3,.m4a,.wav,.mp4,application/pdf,application/zip,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,audio/mpeg,audio/mp4,audio/wav,video/mp4"
							class="hidden"
							bind:this={digitalFileInput}
							on:change={onPickDigitalFile}
						/>
					</div>
				</div>

				<div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p class="text-sm font-semibold text-slate-900">Metode pembayaran yang tampil</p>
							<p class="text-xs text-slate-500">Pilih metode mana saja yang mau muncul saat produk ini ditawarkan.</p>
						</div>
						<label class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
							<input type="checkbox" name="featured" class="checkbox checkbox-xs" bind:checked={productFeatured} />
							Produk unggulan
						</label>
					</div>

					<div class="mt-4 grid gap-3 md:grid-cols-2">
						{#if data.digitalCommerce.paymentMethods.length === 0}
							<p class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
								Belum ada metode pembayaran. Tambahkan dulu dari panel kanan.
							</p>
						{:else}
							{#each data.digitalCommerce.paymentMethods as method}
								<label class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
									<input
										type="checkbox"
										name="paymentMethodIds"
										value={method.id}
										class="checkbox checkbox-sm mt-1"
										bind:group={productPaymentMethodIds}
									/>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold text-slate-900">{method.name}</p>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${paymentTone(method.type)}`}>
												{paymentTypeLabel[method.type] ?? method.type}
											</span>
											{#if !method.isActive}
												<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
													Nonaktif
												</span>
											{/if}
										</div>
										<p class="mt-1 text-xs text-slate-500">{shortText(method.instructions, 120)}</p>
									</div>
								</label>
							{/each}
						{/if}
					</div>
				</div>

				<div class="mt-5 flex flex-wrap gap-2">
					<button type="submit" class="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
						{data.digitalCommerce.editingProduct ? 'Update Produk' : 'Simpan Produk'}
					</button>
					<a href="/admin/super/overview#cms-digital" class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
						Reset Form
					</a>
				</div>
			</form>

			<div class="space-y-6">
				<form id="payment-methods" method="POST" action="?/savePaymentMethod" class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-slate-900">
								{data.digitalCommerce.editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
							</p>
							<p class="text-xs text-slate-500">Metode yang aktif bisa dipilih di setiap produk digital.</p>
						</div>
						{#if data.digitalCommerce.editingPaymentMethod}
							<a href="/admin/super/overview#payment-methods" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
								Batal
							</a>
						{/if}
					</div>

					<input type="hidden" name="id" bind:value={paymentMethodId} />

					<div class="mt-4 grid gap-4">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Metode</span>
							<input name="name" class="input input-bordered mt-2 w-full" placeholder="BCA Transfer" bind:value={paymentMethodName} />
						</label>
						<div class="grid gap-4 md:grid-cols-2">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tipe</span>
								<select name="type" class="select select-bordered mt-2 w-full" bind:value={paymentMethodType}>
									<option value="bank">Bank Transfer</option>
									<option value="ewallet">E-Wallet</option>
									<option value="qris">QRIS</option>
									<option value="manual">Manual</option>
								</select>
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Urutan Tampil</span>
								<input name="displayOrder" type="number" min="0" class="input input-bordered mt-2 w-full" bind:value={paymentDisplayOrder} />
							</label>
						</div>
						<div class="grid gap-4 md:grid-cols-2">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Pemilik</span>
								<input name="accountName" class="input input-bordered mt-2 w-full" placeholder="Santri Online" bind:value={paymentAccountName} />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nomor / Handle</span>
								<input name="accountNumber" class="input input-bordered mt-2 w-full" placeholder="1234567890 / 0812..." bind:value={paymentAccountNumber} />
							</label>
						</div>
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Instruksi Singkat</span>
							<textarea
								name="instructions"
								rows="4"
								class="textarea textarea-bordered mt-2 w-full"
								placeholder="Contoh: kirim bukti transfer via WhatsApp admin setelah pembayaran selesai."
								bind:value={paymentInstructions}
							></textarea>
						</label>
						<label class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
							<input type="checkbox" name="isActive" class="checkbox checkbox-xs" bind:checked={paymentIsActive} />
							Aktifkan metode ini
						</label>
					</div>

					<div class="mt-5 flex flex-wrap gap-2">
						<button type="submit" class="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
							{data.digitalCommerce.editingPaymentMethod ? 'Update Metode' : 'Simpan Metode'}
						</button>
						<a href="/admin/super/overview#payment-methods" class="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
							Reset
						</a>
					</div>
				</form>

				<form method="POST" action="?/recordSale" class="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
					<div>
						<p class="text-sm font-semibold text-white">Catat Penjualan</p>
						<p class="text-xs text-white/65">Dipakai untuk mengisi statistik dan grafik penjualan di panel super admin.</p>
					</div>

					<div class="mt-4 grid gap-4">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Produk</span>
							<select name="productId" class="select select-bordered mt-2 w-full bg-white text-slate-900">
								<option value="">Pilih produk</option>
								{#each data.digitalCommerce.products as product}
									<option value={product.id}>{product.title} • {formatCurrency(product.price)}</option>
								{/each}
							</select>
						</label>
						<div class="grid gap-4 md:grid-cols-2">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Nama Pembeli</span>
								<input name="buyerName" class="input input-bordered mt-2 w-full bg-white text-slate-900" placeholder="Nama pembeli" />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Kontak</span>
								<input name="buyerContact" class="input input-bordered mt-2 w-full bg-white text-slate-900" placeholder="Email / WhatsApp" />
							</label>
						</div>
						<div class="grid gap-4 md:grid-cols-2">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Jumlah Bayar</span>
								<input name="amount" type="number" min="0" class="input input-bordered mt-2 w-full bg-white text-slate-900" placeholder="Kosongkan untuk harga produk" />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Status</span>
								<select name="status" class="select select-bordered mt-2 w-full bg-white text-slate-900">
									<option value="paid">Paid</option>
									<option value="pending">Pending</option>
									<option value="failed">Failed</option>
									<option value="refunded">Refunded</option>
								</select>
							</label>
						</div>
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Metode Bayar</span>
							<select name="paymentMethodId" class="select select-bordered mt-2 w-full bg-white text-slate-900">
								<option value="">Pilih metode</option>
								{#each data.digitalCommerce.paymentMethods as method}
									<option value={method.id}>{method.name} • {paymentTypeLabel[method.type] ?? method.type}</option>
								{/each}
							</select>
						</label>
					</div>

					<div class="mt-5">
						<button type="submit" class="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50">
							Catat Penjualan
						</button>
					</div>
				</form>
			</div>
		</div>

		<div class="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
			<div id="sales-chart" class="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-emerald-300/70">Sales Chart</p>
						<h3 class="mt-2 text-2xl font-semibold">Grafik penjualan 14 hari terakhir</h3>
						<p class="mt-2 text-sm text-white/70">Modelnya dibuat seperti panel creator commerce: fokus pada omzet, ritme order, dan transaksi terbaru.</p>
					</div>
					<div class="grid gap-2 text-right sm:grid-cols-2 sm:text-left md:text-right">
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
							<p class="text-[11px] uppercase tracking-[0.2em] text-white/50">Omzet</p>
							<p class="mt-2 text-xl font-semibold">{formatCurrency(data.digitalCommerce.stats.totalRevenue)}</p>
						</div>
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
							<p class="text-[11px] uppercase tracking-[0.2em] text-white/50">Order</p>
							<p class="mt-2 text-xl font-semibold">{formatNumber(data.digitalCommerce.stats.totalSales)}</p>
						</div>
					</div>
				</div>

				<div class="mt-6 overflow-x-auto pb-2">
					<div class="flex min-w-[720px] items-end gap-3">
						{#each data.digitalCommerce.salesChart as point}
							<div class="flex min-w-[42px] flex-1 flex-col items-center gap-2">
								<div class="flex h-52 w-full items-end rounded-3xl bg-white/5 px-1.5 py-2">
									<div
										class="w-full rounded-2xl bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_12px_36px_rgba(45,212,191,0.28)]"
										style={`height: ${point.revenue > 0 ? `${Math.max(12, (point.revenue / salesChartMax) * 100)}%` : '8px'}`}
										title={`${point.label}: ${formatCurrency(point.revenue)} • ${formatNumber(point.salesCount)} order`}
									></div>
								</div>
								<div class="text-center">
									<p class="text-[11px] font-semibold text-white">{point.label}</p>
									<p class="text-[10px] text-white/55">{formatNumber(point.salesCount)}x</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="mt-6 space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold text-white">Transaksi terbaru</p>
						<span class="text-xs text-white/55">{data.digitalCommerce.recentSales.length} data terakhir</span>
					</div>
					{#if data.digitalCommerce.recentSales.length === 0}
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/65">
							Belum ada penjualan tercatat. Gunakan form di kanan untuk mulai merekam order pertama.
						</div>
					{:else}
						{#each data.digitalCommerce.recentSales as sale}
							<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${saleStatusClass(sale.status)}`}>
												{sale.status}
											</span>
											<span class="text-xs text-white/55">{sale.paymentMethodName || 'Metode belum dipilih'}</span>
										</div>
										<p class="mt-2 text-base font-semibold text-white">{sale.productTitle || 'Produk terhapus'}</p>
										<p class="mt-1 text-sm text-white/70">
											{sale.buyerName || 'Pembeli anonim'}
											{#if sale.buyerContact}
												• {sale.buyerContact}
											{/if}
										</p>
									</div>
									<div class="shrink-0 text-left md:text-right">
										<p class="text-base font-semibold text-emerald-300">{formatCurrency(sale.amount)}</p>
										<p class="mt-1 text-xs text-white/55">{formatDateTime(sale.paidAt || sale.createdAt)}</p>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-slate-900">Metode Pembayaran Tersimpan</p>
						<p class="text-xs text-slate-500">Atur nama, instruksi, urutan tampil, dan aktif/nonaktif dari sini.</p>
					</div>
					<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
						{formatNumber(data.digitalCommerce.paymentMethods.length)} metode
					</span>
				</div>

				<div class="mt-4 space-y-3">
					{#if data.digitalCommerce.paymentMethods.length === 0}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
							Belum ada metode pembayaran. Tambahkan satu atau lebih agar bisa dipilih di produk digital.
						</div>
					{:else}
						{#each data.digitalCommerce.paymentMethods as method}
							<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold text-slate-900">{method.name}</p>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${paymentTone(method.type)}`}>
												{paymentTypeLabel[method.type] ?? method.type}
											</span>
											{#if !method.isActive}
												<span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
													Nonaktif
												</span>
											{/if}
										</div>
										<p class="mt-2 text-sm text-slate-600">
											{#if method.accountName || method.accountNumber}
												{method.accountName || '-'} • {method.accountNumber || '-'}
											{:else}
												Belum ada detail akun.
											{/if}
										</p>
										<p class="mt-1 text-xs text-slate-500">{shortText(method.instructions, 120)}</p>
									</div>
									<div class="flex shrink-0 gap-2">
										<a href={`/admin/super/overview?payment=${method.id}#payment-methods`} class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
											Edit
										</a>
										<form method="POST" action="?/deletePaymentMethod">
											<input type="hidden" name="id" value={method.id} />
											<button
												type="submit"
												class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
												on:click={(event) => {
													if (!confirm('Hapus metode pembayaran ini?')) event.preventDefault();
												}}
											>
												Hapus
											</button>
										</form>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-6">
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h3 class="text-xl font-semibold text-slate-900">Daftar Produk Digital</h3>
					<p class="text-sm text-slate-500">Status, harga, metode bayar, omzet, dan tindakan cepat semua ada di satu daftar.</p>
				</div>
				<span class="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-600">
					{formatNumber(data.digitalCommerce.products.length)} produk
				</span>
			</div>

			{#if data.digitalCommerce.products.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
					Belum ada produk digital. Gunakan form di atas untuk mengunggah produk pertama Anda.
				</div>
			{:else}
				<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each data.digitalCommerce.products as product}
						<div class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
							<div class="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50">
								{#if product.coverUrl}
									<img src={product.coverUrl} alt={product.title} class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
										Belum ada cover produk
									</div>
								{/if}
								<div class="absolute left-4 top-4 flex flex-wrap gap-2">
									<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${productStatusClass(product.status)}`}>
										{product.status}
									</span>
									{#if product.featured}
										<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
											Unggulan
										</span>
									{/if}
								</div>
							</div>

							<div class="p-5">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-lg font-semibold text-slate-900">{product.title}</p>
										<p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">/{product.slug}</p>
									</div>
									<p class="shrink-0 text-sm font-semibold text-emerald-700">{formatCurrency(product.price)}</p>
								</div>

								<p class="mt-3 text-sm text-slate-600">{shortText(product.summary || product.description, 120)}</p>

								<div class="mt-4 grid grid-cols-2 gap-3">
									<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
										<p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Penjualan</p>
										<p class="mt-2 text-lg font-semibold text-slate-900">{formatNumber(product.salesCount)}</p>
									</div>
									<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
										<p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Omzet</p>
										<p class="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(product.revenue)}</p>
									</div>
								</div>

								<div class="mt-4 flex flex-wrap gap-2">
									{#if product.paymentMethods.length === 0}
										<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
											Belum ada metode bayar
										</span>
									{:else}
										{#each product.paymentMethods as method}
											<span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paymentTone(method.type)}`}>
												{method.name}
											</span>
										{/each}
									{/if}
								</div>

								<div class="mt-5 flex flex-wrap gap-2">
									<a href={`/admin/super/overview?product=${product.id}#cms-digital`} class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
										Edit
									</a>
									{#if product.fileUrl}
										<a href={product.fileUrl} target="_blank" rel="noopener" class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
											Buka File
										</a>
									{/if}
									<form method="POST" action="?/toggleProduct">
										<input type="hidden" name="id" value={product.id} />
										<input type="hidden" name="next" value={product.status === 'published' ? 'draft' : 'published'} />
										<button type="submit" class="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100">
											{product.status === 'published' ? 'Jadikan Draft' : 'Publish'}
										</button>
									</form>
									<form method="POST" action="?/deleteProduct">
										<input type="hidden" name="id" value={product.id} />
										<button
											type="submit"
											class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
											on:click={(event) => {
												if (!confirm('Hapus produk digital ini beserta riwayat penjualannya?')) event.preventDefault();
											}}
										>
											Hapus
										</button>
									</form>
								</div>

								<p class="mt-4 text-xs text-slate-400">Diperbarui {formatDateTime(product.updatedAt)}</p>
							</div>
						</div>
					{/each}
				</div>
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
