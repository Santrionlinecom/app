<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import {
		ArrowLeft,
		BarChart3,
		BookOpen,
		Clock3,
		CreditCard,
		FileText,
		FileUp,
		LayoutDashboard,
		Menu,
		Newspaper,
		RefreshCw,
		ShoppingBag,
		X
	} from 'lucide-svelte';
	import {
		KITAB_CATEGORY_OPTIONS,
		getKitabCategoryLabel,
		getKitabCategoryToneClass
	} from '$lib/data/kitab-categories';

	export let data: PageData;
	export let form: ActionData | undefined;

	type KitabItem = PageData['kitabLibrary']['items'][number];
	type DigitalProduct = PageData['digitalCommerce']['products'][number];
	type DigitalPaymentMethod = PageData['digitalCommerce']['paymentMethods'][number];
	type DigitalSalesPoint = PageData['digitalCommerce']['salesChart'][number];

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatCurrency = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
			value ?? 0
		);
	const formatBytes = (value: number | null | undefined) => {
		const size = Number(value ?? 0);
		if (!size) return '0 B';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	};
	const formatDate = (value?: number | null) =>
		value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
	const formatDateTime = (value?: number | null) =>
		value
			? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
			: '-';

	const hubNavItems = [
		{
			href: '#ringkasan',
			label: 'Ringkasan',
			note: 'Status konten',
			icon: LayoutDashboard
		},
		{
			href: '#artikel-cms',
			label: 'Artikel',
			note: 'Blog dan berita',
			icon: FileText
		},
		{
			href: '#cms-digital',
			label: 'Produk Digital',
			note: 'Upload dan katalog',
			icon: ShoppingBag
		},
		{
			href: '#kitab-library',
			label: 'Kitab',
			note: 'PDF dan Drive',
			icon: BookOpen
		},
		{
			href: '#payment-methods',
			label: 'Pembayaran',
			note: 'Metode checkout',
			icon: CreditCard
		},
		{
			href: '#sales-chart',
			label: 'Penjualan',
			note: 'Verifikasi order',
			icon: BarChart3
		}
	];

	const plainText = (value: string | null | undefined) => (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	const shortText = (value: string | null | undefined, length = 120) => {
		const source = plainText(value);
		if (!source) return '-';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const normalizeSlug = (value: string) =>
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.replace(/-{2,}/g, '-');

	const paymentTypeLabel: Record<string, string> = {
		bank: 'Bank Transfer',
		ewallet: 'E-Wallet',
		qris: 'QRIS',
		manual: 'Manual'
	};
	const kitabSourceLabel: Record<string, string> = {
		pdf: 'PDF',
		drive: 'Google Drive'
	};
	const kitabCategoryLabel = (value?: string | null) => getKitabCategoryLabel(value);
	const kitabCategoryTone = (value?: string | null) => getKitabCategoryToneClass(value);

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

	const kitabStatusClass = (status?: string | null) => {
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

	const kitabSourceTone = (type?: string | null) => {
		switch ((type ?? '').toLowerCase()) {
			case 'drive':
				return 'border-amber-200 bg-amber-50 text-amber-700';
			default:
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
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

	const paymentIconPath = (type?: string | null) => {
		switch ((type ?? '').toLowerCase()) {
			case 'bank':
				return 'M3 10h18M5 10V8l7-4 7 4v2M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 21h18';
			case 'ewallet':
				return 'M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v10.5A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-10zM16 12h5v4h-5a2 2 0 010-4zM17.5 14h.01M7 8h7';
			case 'qris':
				return 'M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h2v2h-2v-2zM18 14h2v6h-6v-2h4v-4zM14 18h2v2h-2v-2zM6 6v2h2V6H6zM16 6v2h2V6h-2zM6 16v2h2v-2H6z';
			default:
				return 'M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8 8h8M8 11.5h6M8 15h4';
		}
	};

	const paymentGradient = (type?: string | null) => {
		switch ((type ?? '').toLowerCase()) {
			case 'bank':
				return 'from-sky-500 to-blue-600';
			case 'ewallet':
				return 'from-violet-500 to-fuchsia-600';
			case 'qris':
				return 'from-emerald-500 to-teal-600';
			default:
				return 'from-amber-500 to-orange-600';
		}
	};

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

	const kitabCards = [
		{
			label: 'Kitab Live',
			value: data.kitabLibrary.stats.publishedItems,
			note: 'Sudah tayang di /kitab'
		},
		{
			label: 'Draft',
			value: data.kitabLibrary.stats.draftItems,
			note: 'Belum dipublish'
		},
		{
			label: 'Unggulan',
			value: data.kitabLibrary.stats.featuredItems,
			note: 'Diprioritaskan di katalog'
		},
		{
			label: 'Total Koleksi',
			value: data.kitabLibrary.stats.totalItems,
			note: 'Semua item kitab'
		}
	];

	let salesChartMax = 1;
	$: salesChartMax = Math.max(
		...data.digitalCommerce.salesChart.map((point: DigitalSalesPoint) => point.revenue),
		1
	);

	let formError = '';
	$: formError = form && 'error' in form ? form.error ?? '' : '';

	let cmsSidebarOpen = false;

	let isFetchingNews = false;
	let fetchNewsMessage = '';
	let fetchNewsStatus: 'idle' | 'success' | 'error' = 'idle';
	let fetchNewsMessageTimer: ReturnType<typeof setTimeout> | null = null;

	let coverInput: HTMLInputElement | null = null;
	let digitalFileInput: HTMLInputElement | null = null;
	let kitabCoverInput: HTMLInputElement | null = null;
	let openitiImportInput: HTMLInputElement | null = null;
	let uploadingCover = false;
	let uploadingDigitalFile = false;
	let uploadingKitabCover = false;
	let importingOpeniti = false;
	let openitiImportMessage = '';
	let openitiImportStatus: 'idle' | 'success' | 'error' = 'idle';

	let kitabFormSeed = '';
	let kitabId = '';
	let kitabTitle = '';
	let kitabSlug = '';
	let kitabSummary = '';
	let kitabDescription = '';
	let kitabCoverUrl = '';
	let kitabCategory = '';
	let kitabSourceType: 'pdf' | 'drive' = 'pdf';
	let kitabSourceUrl = '';
	let kitabCurrentSourceUrl = '';
	let kitabFileSize = 0;
	let kitabStatus: 'draft' | 'published' | 'archived' = 'draft';
	let kitabFeatured = false;

	let productFormSeed = '';
	let productId = '';
	let productTitle = '';
	let productSlug = '';
	let productSummary = '';
	let productDescription = '';
	let productPrice = '';
	let productCoverUrl = '';
	let productFileUrl = '';
	let productFileSize = 0;
	let productStatus: 'draft' | 'published' | 'archived' = 'draft';
	let productFeatured = false;
	let productPaymentMethodIds: string[] = [];

	let paymentFormSeed = '';
	let paymentMethodId = '';
	let paymentMethodName = '';
	let paymentMethodType: 'bank' | 'ewallet' | 'qris' | 'manual' = 'bank';
	let paymentAccountName = '';
	let paymentAccountNumber = '';
	let paymentAssetUrl = '';
	let paymentInstructions = '';
	let paymentDisplayOrder = 0;
	let paymentIsActive = true;

	const syncKitabForm = (item: KitabItem | null) => {
		kitabId = item?.id ?? '';
		kitabTitle = item?.title ?? '';
		kitabSlug = item?.slug ?? '';
		kitabSummary = item?.summary ?? '';
		kitabDescription = item?.description ?? '';
		kitabCoverUrl = item?.coverUrl ?? '';
		kitabCategory = item?.category ?? '';
		kitabSourceType = (item?.sourceType ?? 'pdf') as 'pdf' | 'drive';
		kitabSourceUrl = item?.sourceType === 'drive' ? item.sourceUrl : '';
		kitabCurrentSourceUrl = item?.sourceType === 'pdf' ? item.sourceUrl : '';
		kitabFileSize = Number(item?.fileSize ?? 0);
		kitabStatus = (item?.status ?? 'draft') as 'draft' | 'published' | 'archived';
		kitabFeatured = Boolean(item?.featured);
	};

	const syncProductForm = (product: DigitalProduct | null) => {
		productId = product?.id ?? '';
		productTitle = product?.title ?? '';
		productSlug = product?.slug ?? '';
		productSummary = product?.summary ?? '';
		productDescription = product?.description ?? '';
		productPrice = product ? String(product.price) : '';
		productCoverUrl = product?.coverUrl ?? '';
		productFileUrl = product?.fileUrl ?? '';
		productFileSize = 0;
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
		paymentAssetUrl = payment?.assetUrl ?? '';
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
		const nextSeed = data.kitabLibrary.editingKitab
			? `edit:${data.kitabLibrary.editingKitab.id}:${data.kitabLibrary.editingKitab.updatedAt}`
			: 'new';
		if (nextSeed !== kitabFormSeed) {
			kitabFormSeed = nextSeed;
			syncKitabForm(data.kitabLibrary.editingKitab);
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

	const generateKitabSlug = () => {
		kitabSlug = normalizeSlug(kitabSlug || kitabTitle);
	};

	const ambilBeritaSekarang = async () => {
		if (isFetchingNews) return;
		isFetchingNews = true;
		fetchNewsStatus = 'idle';
		fetchNewsMessage = 'Mengambil berita dari RSS global...';

		if (fetchNewsMessageTimer) {
			clearTimeout(fetchNewsMessageTimer);
			fetchNewsMessageTimer = null;
		}

		try {
			const response = await fetch('/api/admin/trigger-news', { method: 'POST' });
			const payload = (await response.json().catch(() => ({}))) as {
				success?: boolean;
				message?: string;
				error?: string;
			};

			if (!response.ok || payload.success === false) {
				throw new Error(payload.error || payload.message || 'Gagal mengambil berita.');
			}

			fetchNewsStatus = 'success';
			fetchNewsMessage = payload.message || 'Pengambilan berita dimulai. Tunggu 2-3 menit.';
		} catch (err) {
			fetchNewsStatus = 'error';
			fetchNewsMessage = err instanceof Error ? err.message : 'Gagal mengambil berita.';
		} finally {
			isFetchingNews = false;
			fetchNewsMessageTimer = setTimeout(() => {
				fetchNewsMessage = '';
				fetchNewsStatus = 'idle';
				fetchNewsMessageTimer = null;
			}, 7000);
		}
	};

	const uploadCoverAsset = async (
		file: File,
		onSuccess: (url: string) => void,
		onError: string
	) => {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/upload', { method: 'POST', body: formData });
		if (!response.ok) {
			const payload = await response.json().catch(() => ({}));
			throw new Error(payload?.error || onError);
		}
		const payload = await response.json();
		onSuccess(payload.url ?? '');
	};

	const onPickCover = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		uploadingCover = true;

		try {
			await uploadCoverAsset(
				file,
				(url) => {
					productCoverUrl = url;
				},
				'Upload cover gagal'
			);
		} catch (err) {
			console.error('Upload cover error:', err);
			alert('Gagal mengunggah cover produk.');
		} finally {
			uploadingCover = false;
			if (target) target.value = '';
		}
	};

	const onPickKitabCover = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		uploadingKitabCover = true;

		try {
			await uploadCoverAsset(
				file,
				(url) => {
					kitabCoverUrl = url;
				},
				'Upload cover kitab gagal'
			);
		} catch (err) {
			console.error('Upload kitab cover error:', err);
			alert('Gagal mengunggah cover kitab.');
		} finally {
			uploadingKitabCover = false;
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
			productFileSize = payload.size ?? 0;
		} catch (err) {
			console.error('Upload digital file error:', err);
			alert('Gagal mengunggah file digital.');
		} finally {
			uploadingDigitalFile = false;
			if (target) target.value = '';
		}
	};

	const onPickOpenitiImport = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file || importingOpeniti) return;

		importingOpeniti = true;
		openitiImportMessage = '';
		openitiImportStatus = 'idle';

		try {
			const raw = await file.text();
			const rows = JSON.parse(raw);
			if (!Array.isArray(rows)) {
				throw new Error('File OpenITI harus berupa JSON array hasil parser.');
			}

			const response = await fetch('/api/admin/kitab/openiti-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rows })
			});
			const payload = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
				importedChunks?: number;
				books?: Array<{ title?: string; chunks?: number }>;
			};

			if (!response.ok || payload.ok === false) {
				throw new Error(payload.error || 'Import OpenITI gagal.');
			}

			const bookSummary = (payload.books ?? [])
				.map((book) => `${book.title ?? 'Kitab'} (${formatNumber(book.chunks ?? 0)} chunk)`)
				.join(', ');
			openitiImportStatus = 'success';
			openitiImportMessage = bookSummary
				? `Import selesai: ${bookSummary}.`
				: `Import selesai: ${formatNumber(payload.importedChunks ?? rows.length)} chunk.`;
		} catch (err) {
			openitiImportStatus = 'error';
			openitiImportMessage = err instanceof Error ? err.message : 'Import OpenITI gagal.';
		} finally {
			importingOpeniti = false;
			target.value = '';
		}
	};
</script>

<svelte:head>
	<title>Pusat Konten - Super Admin</title>
</svelte:head>

<div class="super-admin-shell min-h-screen bg-[#f5f7f2] text-slate-900">
	<div class="mx-auto max-w-[1540px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:py-8">
		<div class="mb-4 flex items-center justify-between gap-3 xl:hidden">
			<button
				type="button"
				class="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/88 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur"
				on:click={() => (cmsSidebarOpen = true)}
			>
				<Menu class="h-4 w-4" aria-hidden="true" />
				Menu CMS
			</button>
			<a
				href="/admin/super/overview"
				class="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"
			>
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				Overview
			</a>
		</div>

		{#if cmsSidebarOpen}
			<div class="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu CMS Hub">
				<button
					type="button"
					class="absolute inset-0 bg-slate-950/45"
					aria-label="Tutup menu CMS"
					on:click={() => (cmsSidebarOpen = false)}
				></button>
				<aside class="absolute left-0 top-0 h-full w-[min(88vw,23rem)] overflow-y-auto bg-white p-4 shadow-2xl">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs font-bold uppercase text-emerald-700">Super Admin</p>
							<h2 class="text-lg font-bold text-slate-950">CMS Hub</h2>
						</div>
						<button
							type="button"
							class="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700"
							aria-label="Tutup menu"
							on:click={() => (cmsSidebarOpen = false)}
						>
							<X class="h-4 w-4" aria-hidden="true" />
						</button>
					</div>
					<nav class="mt-5 space-y-2" aria-label="Navigasi CMS Hub mobile">
						{#each hubNavItems as item}
							{@const Icon = item.icon}
							<a
								href={item.href}
								class="cms-nav-link"
								on:click={() => (cmsSidebarOpen = false)}
							>
								<span class="cms-nav-icon">
									<Icon class="h-4 w-4" aria-hidden="true" />
								</span>
								<span class="min-w-0">
									<span class="block text-sm font-bold text-slate-900">{item.label}</span>
									<span class="block text-xs text-slate-500">{item.note}</span>
								</span>
							</a>
						{/each}
					</nav>
				</aside>
			</div>
		{/if}

		<div class="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
			<aside class="hidden xl:block">
				<div class="sticky top-6 space-y-4">
					<div class="rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-xl backdrop-blur">
						<a
							href="/admin/super/overview"
							class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-800"
						>
							<ArrowLeft class="h-4 w-4" aria-hidden="true" />
							Kembali ke overview
						</a>
						<div class="mt-5">
							<p class="text-xs font-bold uppercase text-emerald-700">Pusat Kerja</p>
							<h2 class="mt-2 text-2xl font-black text-slate-950">CMS Hub</h2>
							<p class="mt-2 text-sm leading-6 text-slate-500">
								Kelola artikel, produk digital, kitab publik, metode bayar, dan order dari satu panel.
							</p>
						</div>
						<nav class="mt-5 space-y-2" aria-label="Navigasi CMS Hub">
							{#each hubNavItems as item}
								{@const Icon = item.icon}
								<a href={item.href} class="cms-nav-link">
									<span class="cms-nav-icon">
										<Icon class="h-4 w-4" aria-hidden="true" />
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-bold text-slate-900">{item.label}</span>
										<span class="block text-xs text-slate-500">{item.note}</span>
									</span>
								</a>
							{/each}
						</nav>
					</div>

					<div class="rounded-[2rem] border border-emerald-200 bg-emerald-50/92 p-5 shadow-sm">
						<p class="text-sm font-bold text-emerald-900">Prioritas hari ini</p>
						<p class="mt-2 text-sm leading-6 text-emerald-800/80">
							{formatNumber(data.digitalCommerce.pendingSales.length)} order menunggu verifikasi dan
							{formatNumber(data.cms.stats.draftPosts)} artikel masih draft.
						</p>
						<a
							href="#sales-chart"
							class="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white"
						>
							Cek penjualan
						</a>
					</div>
				</div>
			</aside>

			<main class="min-w-0 space-y-8">
				<section id="ringkasan" class="cms-hero">
					<div class="max-w-3xl">
						<p class="text-sm font-bold uppercase text-emerald-700">Super Admin</p>
						<h1 class="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
							Pusat konten SantriOnline
						</h1>
						<p class="mt-4 text-base leading-8 text-slate-600">
							Ruang kerja untuk menjaga artikel, produk digital, pembayaran, transaksi, dan perpustakaan kitab tetap rapi.
						</p>
					</div>
					<div class="cms-hero-actions">
						<a href="/admin/posts/new">Tulis Artikel</a>
						<a href="#cms-digital">Tambah Produk</a>
						<a href="#kitab-library">Kelola Kitab</a>
					</div>
				</section>

				{#if formError}
					<div class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
						{formError}
					</div>
				{/if}

	<!-- Ringkasan pusat konten -->
	<section class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
			<!-- CMS Artikel Card -->
			<div id="artikel-cms" class="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 p-6 text-white shadow-xl">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div class="max-w-xl">
						<p class="text-xs uppercase text-white/60">CMS Artikel</p>
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
							<p class="text-[11px] uppercase text-white/55">{card.label}</p>
							<p class="mt-3 text-3xl font-semibold">{formatNumber(card.value)}</p>
							<p class="mt-1 text-xs text-white/70">{card.note}</p>
						</div>
					{/each}
				</div>

				<div class="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4">
					<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<Newspaper class="h-4 w-4 text-emerald-200" aria-hidden="true" />
								<p class="text-sm font-semibold text-white">Berita Otomatis</p>
							</div>
							<div class="mt-2 flex items-start gap-2 text-xs leading-6 text-white/70">
								<Clock3 class="mt-1 h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
								<span>Jadwal cron: 06.00, 12.00, dan 18.00 WIB.</span>
							</div>
						</div>
						<button
							type="button"
							on:click={ambilBeritaSekarang}
							disabled={isFetchingNews}
							class="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<RefreshCw class={`h-4 w-4 ${isFetchingNews ? 'animate-spin' : ''}`} aria-hidden="true" />
							<span>{isFetchingNews ? 'Mengambil...' : 'Ambil Berita Sekarang'}</span>
						</button>
					</div>

					{#if fetchNewsMessage}
						<p
							class={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${
								fetchNewsStatus === 'error'
									? 'border-rose-200 bg-rose-50 text-rose-700'
									: fetchNewsStatus === 'success'
										? 'border-emerald-200 bg-emerald-50 text-emerald-700'
										: 'border-white/15 bg-white/10 text-white/75'
							}`}
							aria-live="polite"
						>
							{fetchNewsMessage}
						</p>
					{/if}
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

			<!-- Digital Store Card -->
			<div class="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="text-xs uppercase text-emerald-300/70">Digital Store</p>
						<h3 class="mt-2 text-2xl font-semibold">Studio produk dan perpustakaan kitab</h3>
						<p class="mt-2 text-sm text-white/70">
							Upload produk digital, atur metode bayar, sekaligus kelola kitab publik dari panel super admin yang sama.
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<a href="#kitab-library" class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
							Kelola Kitab
						</a>
						<a href="#sales-chart" class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
							Lihat Grafik
						</a>
					</div>
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-2">
					{#each digitalCards as card}
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
							<p class="text-[11px] uppercase text-white/55">{card.label}</p>
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
							<p class="text-[11px] uppercase text-emerald-200/70">Ready</p>
							<p class="mt-1 text-sm font-semibold text-white">{formatNumber(data.digitalCommerce.stats.totalProducts)} produk</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<a href="#kitab-library" class="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
							Perpustakaan Kitab
						</a>
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

	<!-- Produk Digital Section -->
	<section id="cms-digital" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase text-slate-400">Produk Digital</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Studio upload, metode bayar, dan penjualan</h2>
				<p class="mt-2 text-sm text-slate-500">
					Strukturnya sengaja dibuat seperti CMS: Anda punya editor produk, daftar konten, daftar metode pembayaran, dan area ringkasan penjualan.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a href="#kitab-library" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
					Perpustakaan Kitab
				</a>
				<a href="#payment-methods" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
					Atur Metode Bayar
				</a>
				<a href="#sales-chart" class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
					Grafik Penjualan
				</a>
			</div>
		</div>

		<div class="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
			<!-- Product Form -->
			<form method="POST" action="?/saveProduct" class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-900">
							{data.digitalCommerce.editingProduct ? 'Edit Produk Digital' : 'Produk Digital Baru'}
						</p>
						<p class="text-xs text-slate-500">Simpan file digital, cover produk, harga, dan metode bayar yang ingin ditampilkan.</p>
					</div>
					{#if data.digitalCommerce.editingProduct}
						<a href="/admin/super/cms-hub#cms-digital" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
							Batal Edit
						</a>
					{/if}
				</div>

				<input type="hidden" name="id" bind:value={productId} />

				<div class="mt-5 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Nama Produk</span>
						<input
							name="title"
							class="input input-bordered mt-2 w-full"
							placeholder="E-book Tahsin Premium"
							bind:value={productTitle}
							on:blur={() => {
								if (!productSlug) generateProductSlug();
							}}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Harga (IDR)</span>
						<input name="price" type="number" min="0" class="input input-bordered mt-2 w-full" bind:value={productPrice} />
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Ringkasan Singkat</span>
						<input
							name="summary"
							class="input input-bordered mt-2 w-full"
							placeholder="Konten singkat yang tampil di card produk"
							bind:value={productSummary}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Slug Produk</span>
						<div class="mt-2 flex gap-2">
							<input
								name="slug"
								class="input input-bordered w-full"
								placeholder="ebook-tahsin-premium"
								bind:value={productSlug}
							/>
							<button type="button" class="btn btn-outline btn-sm shrink-0" on:click={generateProductSlug}>
								Auto
							</button>
						</div>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Status</span>
						<select name="status" class="select select-bordered mt-2 w-full" bind:value={productStatus}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</label>
					<label class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
						<input
							type="checkbox"
							name="featured"
							class="checkbox checkbox-sm border-slate-300"
							bind:checked={productFeatured}
						/>
						<span class="min-w-0">
							<span class="block text-sm font-semibold text-slate-900">Produk unggulan</span>
							<span class="mt-1 block text-xs text-slate-500">Tandai produk penting agar mudah diprioritaskan.</span>
						</span>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Cover Produk</span>
						<button
							type="button"
							class="btn btn-outline btn-sm mt-2 w-full"
							on:click={() => coverInput?.click()}
							disabled={uploadingCover}
						>
							{uploadingCover ? 'Uploading...' : 'Upload Cover'}
						</button>
						<input
							bind:this={coverInput}
							type="file"
							accept="image/*"
							class="hidden"
							on:change={onPickCover}
						/>
						{#if productCoverUrl}
							<p class="mt-2 text-xs text-emerald-600">✓ Cover siap dipakai untuk kartu produk</p>
						{/if}
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">File Digital</span>
						<button
							type="button"
							class="btn btn-outline btn-sm mt-2 w-full"
							on:click={() => digitalFileInput?.click()}
							disabled={uploadingDigitalFile}
						>
							{uploadingDigitalFile ? 'Uploading...' : 'Upload File'}
						</button>
						<input
							bind:this={digitalFileInput}
							type="file"
							class="hidden"
							on:change={onPickDigitalFile}
						/>
						{#if productFileUrl}
							<p class="mt-2 text-xs text-emerald-600">
								✓ File siap diunduh{#if productFileSize > 0} ({formatBytes(productFileSize)}){/if}
							</p>
						{/if}
					</label>
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Deskripsi Lengkap</span>
						<textarea
							name="description"
							class="textarea textarea-bordered mt-2 w-full"
							placeholder="Deskripsi detail produk Anda..."
							bind:value={productDescription}
						></textarea>
					</label>
				</div>

				<div class="mt-4">
					<p class="text-xs font-semibold uppercase text-slate-400">Metode Pembayaran</p>
					{#if data.digitalCommerce.paymentMethods.length === 0}
						<div class="mt-2 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
							Tambahkan metode pembayaran terlebih dulu agar produk bisa dihubungkan ke checkout.
						</div>
					{:else}
						<div class="mt-3 grid gap-3 md:grid-cols-2">
							{#each data.digitalCommerce.paymentMethods as method}
								<label class="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
									<input
										type="checkbox"
										name="paymentMethodIds"
										value={method.id}
										class="checkbox checkbox-sm mt-0.5 border-slate-300"
										bind:group={productPaymentMethodIds}
									/>
									<span class="min-w-0">
										<span class="block text-sm font-semibold text-slate-900">{method.name}</span>
										<span class="mt-1 block text-xs text-slate-500">
											{paymentTypeLabel[method.type] ?? method.type}{#if !method.isActive} • Nonaktif{/if}
										</span>
									</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>

				<input type="hidden" name="fileUrl" bind:value={productFileUrl} />
				<input type="hidden" name="coverUrl" bind:value={productCoverUrl} />

				<div class="mt-6 flex gap-2">
					<button type="submit" class="btn btn-primary">
						{data.digitalCommerce.editingProduct ? 'Update Produk' : 'Simpan Produk'}
					</button>
					{#if data.digitalCommerce.editingProduct}
						<button
							type="submit"
							formaction="?/deleteProduct"
							formnovalidate
							class="btn btn-outline btn-error"
							on:click={(e) => {
								if (!confirm('Hapus produk ini?')) e.preventDefault();
							}}
						>
							Hapus
						</button>
					{/if}
				</div>
			</form>

			<!-- Product List Preview -->
			<div class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
				<h3 class="text-sm font-semibold text-slate-900">Produk Terbaru</h3>
				<div class="mt-4 space-y-3 max-h-96 overflow-y-auto">
					{#if data.digitalCommerce.products.length === 0}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center text-sm text-slate-500">
							Belum ada produk
						</div>
					{:else}
						{#each data.digitalCommerce.products.slice(0, 5) as product}
							<div class="rounded-2xl border border-slate-200 bg-white px-3 py-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-slate-900 text-sm">{product.title}</p>
										<p class="text-xs text-slate-600 mt-1">{formatCurrency(product.price)}</p>
										<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-2 ${productStatusClass(product.status)}`}>
											{product.status}
										</span>
									</div>
									<a href={`/admin/super/cms-hub?product=${product.id}#cms-digital`} class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
										Edit
									</a>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Product List -->
		<div class="mt-8">
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
								</div>
							</div>

							<div class="p-5">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-lg font-semibold text-slate-900">{product.title}</p>
										<p class="mt-1 text-xs uppercase text-slate-400">/{product.slug}</p>
									</div>
									<p class="shrink-0 text-sm font-semibold text-emerald-700">{formatCurrency(product.price)}</p>
								</div>

								<p class="mt-3 text-sm text-slate-600">{shortText(product.summary || product.description, 120)}</p>

								<div class="mt-4 flex gap-2">
									<a href={`/admin/super/cms-hub?product=${product.id}#cms-digital`} class="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
										Edit
									</a>
									<form method="POST" action="?/deleteProduct" class="inline">
										<input type="hidden" name="id" value={product.id} />
										<button
											type="submit"
											class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
											on:click={(e) => {
												if (!confirm('Hapus produk ini?')) e.preventDefault();
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

	<section id="kitab-library" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase text-slate-400">Perpustakaan Kitab</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Upload PDF atau hubungkan Google Drive untuk halaman /kitab</h2>
				<p class="mt-2 text-sm text-slate-500">
					Bagian ini mengelola katalog kitab publik. Kitab berstatus <strong>published</strong> akan langsung tampil di <code>/kitab</code>.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
					on:click={() => openitiImportInput?.click()}
					disabled={importingOpeniti}
				>
					<FileUp class="h-4 w-4" aria-hidden="true" />
					<span>{importingOpeniti ? 'Mengimpor...' : 'Import OpenITI JSON'}</span>
				</button>
				<input
					bind:this={openitiImportInput}
					type="file"
					accept="application/json,.json"
					class="hidden"
					on:change={onPickOpenitiImport}
				/>
				<a href="/kitab" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
					Lihat Halaman Publik
				</a>
				<a href="/kitab/quran" class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
					Mushaf Al-Qur'an
				</a>
			</div>
		</div>

		{#if openitiImportMessage}
			<p
				class={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
					openitiImportStatus === 'error'
						? 'border-rose-200 bg-rose-50 text-rose-700'
						: 'border-emerald-200 bg-emerald-50 text-emerald-700'
				}`}
				aria-live="polite"
			>
				{openitiImportMessage}
			</p>
		{/if}

		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each kitabCards as card}
				<div class="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
					<p class="text-[11px] uppercase text-slate-400">{card.label}</p>
					<p class="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(card.value)}</p>
					<p class="mt-1 text-xs text-slate-500">{card.note}</p>
				</div>
			{/each}
		</div>

		<div class="mt-6 grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
			<form
				method="POST"
				action="?/saveKitab"
				enctype="multipart/form-data"
				class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
			>
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-900">
							{data.kitabLibrary.editingKitab ? 'Edit Kitab Publik' : 'Kitab Baru'}
						</p>
						<p class="text-xs text-slate-500">Upload file PDF atau tempel link Google Drive, lalu publish ke halaman kitab publik.</p>
					</div>
					<div class="flex flex-wrap gap-2">
						{#if data.kitabLibrary.editingKitab?.status === 'published'}
							<a href={`/kitab/${data.kitabLibrary.editingKitab.slug}`} class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
								Lihat Publik
							</a>
						{/if}
						{#if data.kitabLibrary.editingKitab}
							<a href="/admin/super/cms-hub#kitab-library" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
								Batal Edit
							</a>
						{/if}
					</div>
				</div>

				<input type="hidden" name="id" bind:value={kitabId} />
				<input type="hidden" name="coverUrl" bind:value={kitabCoverUrl} />

				<div class="mt-5 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Judul Kitab</span>
						<input
							name="title"
							class="input input-bordered mt-2 w-full"
							placeholder="Contoh: Fathul Qarib"
							bind:value={kitabTitle}
							on:blur={() => {
								if (!kitabSlug) generateKitabSlug();
							}}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Slug Kitab</span>
						<div class="mt-2 flex gap-2">
							<input
								name="slug"
								class="input input-bordered w-full"
								placeholder="fathul-qarib"
								bind:value={kitabSlug}
							/>
							<button type="button" class="btn btn-outline btn-sm shrink-0" on:click={generateKitabSlug}>
								Auto
							</button>
						</div>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[1.1fr,0.75fr,0.95fr]">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Ringkasan Singkat</span>
						<input
							name="summary"
							class="input input-bordered mt-2 w-full"
							placeholder="Ringkasan yang tampil di kartu katalog"
							bind:value={kitabSummary}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Kategori Kitab</span>
						<select name="category" class="select select-bordered mt-2 w-full" bind:value={kitabCategory}>
							<option value="">Tanpa kategori</option>
							{#each KITAB_CATEGORY_OPTIONS as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Sumber Kitab</span>
						<select name="sourceType" class="select select-bordered mt-2 w-full" bind:value={kitabSourceType}>
							<option value="pdf">Upload PDF</option>
							<option value="drive">Google Drive</option>
						</select>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Status</span>
						<select name="status" class="select select-bordered mt-2 w-full" bind:value={kitabStatus}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</label>
					<label class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
						<input
							type="checkbox"
							name="featured"
							class="checkbox checkbox-sm border-slate-300"
							bind:checked={kitabFeatured}
						/>
						<span class="min-w-0">
							<span class="block text-sm font-semibold text-slate-900">Kitab unggulan</span>
							<span class="mt-1 block text-xs text-slate-500">Kitab unggulan diprioritaskan di halaman katalog publik.</span>
						</span>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Cover Kitab</span>
						<button
							type="button"
							class="btn btn-outline btn-sm mt-2 w-full"
							on:click={() => kitabCoverInput?.click()}
							disabled={uploadingKitabCover}
						>
							{uploadingKitabCover ? 'Uploading...' : 'Upload Cover'}
						</button>
						<input
							bind:this={kitabCoverInput}
							type="file"
							accept="image/*"
							class="hidden"
							on:change={onPickKitabCover}
						/>
						{#if kitabCoverUrl}
							<p class="mt-2 text-xs text-emerald-600">✓ Cover siap dipakai untuk katalog kitab</p>
						{/if}
					</label>

					{#if kitabSourceType === 'drive'}
						<label class="block">
							<span class="text-xs font-semibold uppercase text-slate-400">Link Google Drive</span>
							<input
								name="driveUrl"
								type="url"
								class="input input-bordered mt-2 w-full"
								placeholder="https://drive.google.com/file/d/..."
								bind:value={kitabSourceUrl}
							/>
							<p class="mt-2 text-xs text-slate-500">Gunakan link file Google Drive yang bisa dibuka publik.</p>
						</label>
					{:else}
						<label class="block">
							<span class="text-xs font-semibold uppercase text-slate-400">File PDF</span>
							<input
								name="pdfFile"
								type="file"
								accept="application/pdf,.pdf"
								class="file-input file-input-bordered mt-2 w-full"
							/>
							{#if kitabCurrentSourceUrl}
								<p class="mt-2 text-xs text-emerald-600">
									✓ PDF aktif sudah tersimpan{#if kitabFileSize > 0} ({formatBytes(kitabFileSize)}){/if}
								</p>
							{:else}
								<p class="mt-2 text-xs text-slate-500">Maksimal 50MB per file PDF.</p>
							{/if}
						</label>
					{/if}
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-semibold uppercase text-slate-400">Deskripsi Lengkap</span>
						<textarea
							name="description"
							class="textarea textarea-bordered mt-2 w-full"
							placeholder="Deskripsi, konteks, atau catatan kitab..."
							bind:value={kitabDescription}
						></textarea>
					</label>
				</div>

				<div class="mt-6 flex gap-2">
					<button type="submit" class="btn btn-primary">
						{data.kitabLibrary.editingKitab ? 'Update Kitab' : 'Simpan Kitab'}
					</button>
					{#if data.kitabLibrary.editingKitab}
						<button
							type="submit"
							formaction="?/deleteKitab"
							formnovalidate
							class="btn btn-outline btn-error"
							on:click={(event) => {
								if (!confirm('Hapus kitab ini?')) event.preventDefault();
							}}
						>
							Hapus
						</button>
					{/if}
				</div>
			</form>

			<div class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
				<h3 class="text-sm font-semibold text-slate-900">Kitab Terbaru</h3>
				<div class="mt-4 space-y-3 max-h-96 overflow-y-auto">
					{#if data.kitabLibrary.items.length === 0}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center text-sm text-slate-500">
							Belum ada kitab
						</div>
					{:else}
						{#each data.kitabLibrary.items.slice(0, 5) as item}
							<div class="rounded-2xl border border-slate-200 bg-white px-3 py-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-slate-900 text-sm">{item.title}</p>
										<p class="text-xs text-slate-600 mt-1">{kitabSourceLabel[item.sourceType] ?? item.sourceType}</p>
										<div class="mt-2 flex flex-wrap gap-2">
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kitabStatusClass(item.status)}`}>
												{item.status}
											</span>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kitabSourceTone(item.sourceType)}`}>
												{kitabSourceLabel[item.sourceType] ?? item.sourceType}
											</span>
											{#if item.category}
												<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kitabCategoryTone(item.category)}`}>
													{kitabCategoryLabel(item.category)}
												</span>
											{/if}
										</div>
									</div>
									<a href={`/admin/super/cms-hub?kitab=${item.id}#kitab-library`} class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
										Edit
									</a>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-8">
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h3 class="text-xl font-semibold text-slate-900">Daftar Kitab Publik</h3>
					<p class="text-sm text-slate-500">Kelola status, sumber, dan akses cepat ke halaman publik dari satu daftar.</p>
				</div>
				<span class="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-600">
					{formatNumber(data.kitabLibrary.items.length)} kitab
				</span>
			</div>

			{#if data.kitabLibrary.items.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
					Belum ada kitab. Gunakan form di atas untuk menambahkan kitab pertama Anda.
				</div>
			{:else}
				<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each data.kitabLibrary.items as item}
						<div class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
							<div class="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50">
								{#if item.coverUrl}
									<img src={item.coverUrl} alt={item.title} class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
										Belum ada cover kitab
									</div>
								{/if}
								<div class="absolute left-4 top-4 flex flex-wrap gap-2">
									<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${kitabStatusClass(item.status)}`}>
										{item.status}
									</span>
									<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${kitabSourceTone(item.sourceType)}`}>
										{kitabSourceLabel[item.sourceType] ?? item.sourceType}
									</span>
									{#if item.category}
										<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${kitabCategoryTone(item.category)}`}>
											{kitabCategoryLabel(item.category)}
										</span>
									{/if}
								</div>
							</div>

							<div class="p-5">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-lg font-semibold text-slate-900">{item.title}</p>
										<p class="mt-1 text-xs uppercase text-slate-400">/{item.slug}</p>
									</div>
									{#if item.featured}
										<span class="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
											Unggulan
										</span>
									{/if}
								</div>

								<p class="mt-3 text-sm text-slate-600">{shortText(item.summary || item.description, 120)}</p>

								<div class="mt-4 flex flex-wrap gap-2">
									<a href={`/admin/super/cms-hub?kitab=${item.id}#kitab-library`} class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
										Edit
									</a>
									{#if item.status === 'published'}
										<a href={`/kitab/${item.slug}`} class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
											Lihat Publik
										</a>
									{/if}
									<form method="POST" action="?/deleteKitab" class="inline">
										<input type="hidden" name="id" value={item.id} />
										<button
											type="submit"
											class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
											on:click={(event) => {
												if (!confirm('Hapus kitab ini?')) event.preventDefault();
											}}
										>
											Hapus
										</button>
									</form>
								</div>

								<p class="mt-4 text-xs text-slate-400">Diperbarui {formatDateTime(item.updatedAt)}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Payment Methods Section -->
	<section id="payment-methods" class="relative overflow-hidden rounded-[2.35rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur xl:p-7">
		<div class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"></div>

		<div class="relative mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div class="flex max-w-3xl gap-4">
				<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
					<CreditCard class="h-7 w-7" />
				</div>
				<div>
					<p class="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Payment Control Center</p>
					<h2 class="section-title mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Metode pembayaran produk digital</h2>
					<p class="mt-2 text-sm leading-6 text-slate-600">
						Atur rekening, e-wallet, QRIS, dan instruksi manual agar checkout terlihat rapi, terpercaya, dan mudah dipahami pelanggan.
					</p>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
				<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
					<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Aktif</p>
					<p class="mt-1 text-2xl font-black text-slate-950">{formatNumber(data.digitalCommerce.stats.activeMethods)}</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
					<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Total</p>
					<p class="mt-1 text-2xl font-black text-slate-950">{formatNumber(data.digitalCommerce.paymentMethods.length)}</p>
				</div>
			</div>
		</div>

		<div class="relative grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
			<form method="POST" action="?/savePaymentMethod" class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div class="flex items-start gap-3">
						<div class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${paymentGradient(paymentMethodType)} text-white shadow-lg shadow-slate-900/10`}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d={paymentIconPath(paymentMethodType)} stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</div>
						<div>
							<p class="text-base font-black text-slate-950">{data.digitalCommerce.editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Metode Pembayaran Baru'}</p>
							<p class="mt-1 text-xs leading-5 text-slate-500">Isi data yang akan tampil di checkout produk digital.</p>
						</div>
					</div>
					{#if data.digitalCommerce.editingPaymentMethod}
						<a href="/admin/super/cms-hub#payment-methods" class="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
							Batal edit
						</a>
					{/if}
				</div>

				<input type="hidden" name="id" bind:value={paymentMethodId} />

				<div class="mt-6 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tipe Pembayaran</span>
						<select name="type" class="select select-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50 font-semibold" bind:value={paymentMethodType}>
							<option value="bank">Bank Transfer</option>
							<option value="ewallet">E-Wallet</option>
							<option value="qris">QRIS</option>
							<option value="manual">Manual</option>
						</select>
					</label>
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Nama Metode</span>
						<input name="name" class="input input-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50 font-semibold" placeholder="Contoh: BCA Transfer" bind:value={paymentMethodName} />
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Nama Pemilik Akun</span>
						<input name="accountName" class="input input-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50" placeholder="Contoh: SantriOnline" bind:value={paymentAccountName} />
					</label>
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Nomor Akun/Rekening</span>
						<input name="accountNumber" class="input input-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50" placeholder="Contoh: 123456789" bind:value={paymentAccountNumber} />
					</label>
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">URL Aset Pembayaran</span>
						<input name="assetUrl" class="input input-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50" placeholder="QRIS atau gambar instruksi pembayaran" bind:value={paymentAssetUrl} />
						<p class="mt-2 text-xs text-slate-500">Gunakan untuk QRIS, logo pembayaran, atau gambar referensi checkout.</p>
					</label>
					{#if paymentAssetUrl}
						<div class="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
							<img src={paymentAssetUrl} alt={`Aset ${paymentMethodName || 'pembayaran'}`} class="max-h-72 w-full rounded-xl border border-slate-200 bg-white object-contain" />
						</div>
					{/if}
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-[0.75fr,1.25fr]">
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Urutan</span>
						<input name="displayOrder" type="number" min="0" class="input input-bordered mt-2 w-full rounded-2xl border-slate-200 bg-slate-50" bind:value={paymentDisplayOrder} />
					</label>
					<label class="flex items-center gap-3 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 px-4 py-4">
						<input type="checkbox" name="isActive" class="checkbox checkbox-sm border-emerald-300" bind:checked={paymentIsActive} />
						<span class="min-w-0">
							<span class="block text-sm font-black text-slate-950">Metode aktif</span>
							<span class="mt-1 block text-xs text-slate-600">Jika nonaktif, jangan tampilkan di checkout.</span>
						</span>
					</label>
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Instruksi Pembayaran</span>
						<textarea name="instructions" class="textarea textarea-bordered mt-2 min-h-32 w-full rounded-2xl border-slate-200 bg-slate-50" placeholder="Contoh: Transfer sesuai nominal, lalu upload bukti pembayaran..." bind:value={paymentInstructions}></textarea>
					</label>
				</div>

				<div class="mt-6 flex flex-col gap-2 sm:flex-row">
					<button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-cyan-700">
						<CreditCard class="h-4 w-4" />
						{data.digitalCommerce.editingPaymentMethod ? 'Update Metode' : 'Simpan Metode'}
					</button>
					{#if data.digitalCommerce.editingPaymentMethod}
						<button type="submit" formaction="?/deletePaymentMethod" formnovalidate class="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700 transition hover:bg-rose-100" on:click={(e) => { if (!confirm('Hapus metode pembayaran ini?')) e.preventDefault(); }}>
							Hapus
						</button>
					{/if}
				</div>
			</form>

			<div class="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Quick Monitor</p>
						<h3 class="mt-1 text-lg font-black text-slate-950">Metode aktif</h3>
					</div>
					<span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{formatNumber(data.digitalCommerce.stats.activeMethods)} aktif</span>
				</div>
				<div class="mt-4 space-y-3 max-h-[28rem] overflow-y-auto pr-1">
					{#if data.digitalCommerce.paymentMethods.length === 0}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">Belum ada metode pembayaran</div>
					{:else}
						{#each data.digitalCommerce.paymentMethods as method}
							<div class="group rounded-2xl border border-white bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
								<div class="flex items-start gap-3">
									<div class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${paymentGradient(method.type)} text-white shadow-lg shadow-slate-900/10`}>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
											<path d={paymentIconPath(method.type)} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<p class="truncate text-sm font-black text-slate-950">{method.name}</p>
												<p class="mt-0.5 text-xs text-slate-500">{paymentTypeLabel[method.type] ?? method.type}</p>
											</div>
											<a href={`/admin/super/cms-hub?payment=${method.id}#payment-methods`} class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100">Edit</a>
										</div>
										<div class="mt-2 flex flex-wrap items-center gap-1.5">
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${paymentTone(method.type)}`}>{method.isActive ? 'Aktif' : 'Nonaktif'}</span>
											{#if method.assetUrl}<span class="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black text-cyan-700">Aset visual</span>{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="relative mt-8">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Payment Directory</p>
					<h3 class="mt-1 text-xl font-black text-slate-950">Daftar Metode Pembayaran</h3>
				</div>
				<p class="text-sm text-slate-500">Audit detail akun, instruksi, aset, dan status aktif.</p>
			</div>
			{#if data.digitalCommerce.paymentMethods.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">Belum ada metode pembayaran. Tambahkan metode di atas untuk memulai.</div>
			{:else}
				<div class="mt-5 grid gap-4 xl:grid-cols-2">
					{#each data.digitalCommerce.paymentMethods as method}
						<div class="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
							<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div class="flex min-w-0 gap-3">
									<div class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${paymentGradient(method.type)} text-white shadow-lg shadow-slate-900/10`}>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d={paymentIconPath(method.type)} stroke-linecap="round" stroke-linejoin="round" /></svg>
									</div>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-base font-black text-slate-950">{method.name}</p>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black ${paymentTone(method.type)}`}>{paymentTypeLabel[method.type] ?? method.type}</span>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black ${method.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{method.isActive ? 'Aktif' : 'Nonaktif'}</span>
										</div>
										<p class="mt-2 text-sm text-slate-600">{method.accountName || '-'} • {method.accountNumber || '-'}</p>
										<p class="mt-1 text-xs leading-5 text-slate-500">{shortText(method.instructions, 130)}</p>
										{#if method.assetUrl}<p class="mt-1 text-xs font-semibold text-cyan-700">Memiliki aset visual checkout.</p>{/if}
									</div>
								</div>
								<div class="flex shrink-0 gap-2">
									<a href={`/admin/super/cms-hub?payment=${method.id}#payment-methods`} class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100">Edit</a>
									<form method="POST" action="?/deletePaymentMethod">
										<input type="hidden" name="id" value={method.id} />
										<button type="submit" class="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100" on:click={(event) => { if (!confirm('Hapus metode pembayaran ini?')) event.preventDefault(); }}>Hapus</button>
									</form>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Sales Chart Section -->
	<section id="sales-chart" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase text-slate-400">Grafik Penjualan</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Ringkasan penjualan 14 hari terakhir</h2>
				<p class="mt-2 text-sm text-slate-500">
					Visualisasi omzet harian, order yang menunggu verifikasi, dan transaksi terbaru untuk membantu Anda memantau performa penjualan.
				</p>
			</div>
		</div>

		<div class="mb-8">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<h3 class="text-lg font-semibold text-slate-900">Butuh Verifikasi</h3>
					<p class="text-sm text-slate-500">Order manual yang masih menunggu pemeriksaan bukti pembayaran.</p>
				</div>
				<span class="rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold text-amber-700">
					{formatNumber(data.digitalCommerce.pendingSales.length)} order pending
				</span>
			</div>

			{#if data.digitalCommerce.pendingSales.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
					Tidak ada order yang menunggu verifikasi.
				</div>
			{:else}
				<div class="mt-4 grid gap-4 xl:grid-cols-2">
					{#each data.digitalCommerce.pendingSales as sale}
						<form method="POST" action="?/updateSaleStatus" class="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-sm">
							<input type="hidden" name="id" value={sale.id} />
							<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-base font-semibold text-slate-900">{sale.productTitle || 'Produk digital'}</p>
										<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${saleStatusClass(sale.status)}`}>
											{sale.status}
										</span>
									</div>
									<p class="mt-2 text-sm text-slate-600">{sale.referenceCode}</p>
									<p class="mt-1 text-sm text-slate-600">{sale.buyerName || sale.buyerContact || 'Pembeli belum tercatat'}</p>
									<p class="mt-1 text-xs text-slate-500">
										{sale.paymentMethodName || 'Metode manual'} • {formatDateTime(sale.createdAt)}
									</p>
								</div>
								<p class="shrink-0 text-lg font-semibold text-emerald-700">{formatCurrency(sale.amount)}</p>
							</div>

							{#if sale.proofUrl}
								<div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p class="text-xs uppercase text-slate-400">Bukti Bayar</p>
									{#if sale.proofUrl.endsWith('.pdf')}
										<a href={sale.proofUrl} target="_blank" rel="noreferrer" class="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
											Buka Bukti PDF
										</a>
									{:else}
										<img src={sale.proofUrl} alt={`Bukti ${sale.referenceCode}`} class="mt-4 w-full rounded-xl border border-slate-200 bg-white object-contain" />
									{/if}
								</div>
							{:else}
								<div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
									Bukti bayar belum diunggah.
								</div>
							{/if}

							<label class="mt-4 block">
								<span class="text-xs font-semibold uppercase text-slate-400">Catatan Admin</span>
								<textarea
									name="adminNotes"
									class="textarea textarea-bordered mt-2 w-full"
									placeholder="Catatan verifikasi atau alasan penolakan..."
								>{sale.adminNotes ?? ''}</textarea>
							</label>

							<div class="mt-4 flex flex-wrap gap-2">
								<button type="submit" name="status" value="paid" class="btn btn-primary">
									Tandai Lunas
								</button>
								<button type="submit" name="status" value="failed" class="btn btn-outline btn-error">
									Tandai Gagal
								</button>
							</div>
						</form>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Sales Chart -->
		<div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="grid gap-4 md:grid-cols-3">
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
					<p class="text-[11px] uppercase text-slate-400">Total Penjualan</p>
					<p class="mt-3 text-3xl font-semibold text-emerald-700">{formatNumber(data.digitalCommerce.stats.totalSales)}</p>
					<p class="mt-1 text-xs text-slate-600">Order tercatat</p>
				</div>
				<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
					<p class="text-[11px] uppercase text-slate-400">Total Omzet</p>
					<p class="mt-3 text-2xl font-semibold text-amber-700">{formatCurrency(data.digitalCommerce.stats.totalRevenue)}</p>
					<p class="mt-1 text-xs text-slate-600">Dari semua penjualan</p>
				</div>
				<div class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
					<p class="text-[11px] uppercase text-slate-400">Rata-rata Order</p>
					<p class="mt-3 text-2xl font-semibold text-sky-700">{formatCurrency(data.digitalCommerce.stats.averageOrderValue)}</p>
					<p class="mt-1 text-xs text-slate-600">Nilai per transaksi</p>
				</div>
			</div>

			<!-- Chart -->
			<div class="mt-8 flex h-64 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-6">
				{#each data.digitalCommerce.salesChart as point}
					<div class="flex flex-1 flex-col items-center gap-2">
						<div
							class="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition hover:from-emerald-600 hover:to-emerald-500"
							style={`height: ${Math.max((point.revenue / salesChartMax) * 100, 2)}%; min-height: 2px;`}
							title={`${point.date}: ${formatCurrency(point.revenue)}`}
						></div>
						<p class="text-[10px] text-slate-500">{point.label}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Recent Sales -->
		<div class="mt-8">
			<h3 class="text-lg font-semibold text-slate-900">Transaksi Terbaru</h3>
			{#if data.digitalCommerce.recentSales.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
					Belum ada transaksi
				</div>
			{:else}
				<div class="mt-4 space-y-3 overflow-x-auto">
					<div class="grid gap-3">
						{#each data.digitalCommerce.recentSales as sale}
							<div class="rounded-2xl border border-slate-200 bg-white px-5 py-4">
								<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold text-slate-900">{sale.productTitle || 'Produk digital'}</p>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${saleStatusClass(sale.status)}`}>
												{sale.status}
											</span>
										</div>
										<p class="mt-2 text-xs uppercase text-slate-400">{sale.referenceCode}</p>
										<p class="mt-2 text-sm text-slate-600">
											{sale.buyerName || sale.buyerContact || 'Pembeli belum tercatat'}
										</p>
										{#if sale.paymentMethodName}
											<p class="mt-1 text-xs text-slate-500">{sale.paymentMethodName}</p>
										{/if}
										{#if sale.proofUrl}
											<a href={sale.proofUrl} target="_blank" rel="noreferrer" class="mt-1 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800">
												Lihat bukti bayar
											</a>
										{/if}
										{#if sale.adminNotes}
											<p class="mt-1 text-xs text-slate-500">{sale.adminNotes}</p>
										{/if}
										{#if sale.verifiedBy || sale.verifiedAt}
											<p class="mt-1 text-xs text-slate-500">
												Diverifikasi {sale.verifiedBy || 'admin'} • {formatDateTime(sale.verifiedAt)}
											</p>
										{/if}
										<p class="mt-1 text-xs text-slate-500">{formatDateTime(sale.paidAt || sale.createdAt)}</p>
									</div>
									<p class="shrink-0 text-lg font-semibold text-emerald-700">{formatCurrency(sale.amount)}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
				</section>
			</main>
		</div>
	</div>
</div>

<style>
	:global(.super-admin-shell) {
		background:
			radial-gradient(circle at top left, rgb(201 168 76 / 0.16), transparent 28rem),
			linear-gradient(135deg, #f8fafc 0%, #f5f7f2 48%, #e8f1ea 100%);
		min-height: 100vh;
		position: relative;
	}

	:global(.super-admin-shell section[id]),
	:global(.super-admin-shell div[id]) {
		scroll-margin-top: 1.5rem;
	}

	.cms-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 1rem;
		border: 1px solid transparent;
		padding: 0.75rem;
		transition:
			background-color 160ms ease,
			border-color 160ms ease,
			transform 160ms ease;
	}

	.cms-nav-link:hover {
		border-color: rgb(16 185 129 / 0.22);
		background: rgb(236 253 245 / 0.85);
		transform: translateX(2px);
	}

	.cms-nav-icon {
		display: grid;
		height: 2.35rem;
		width: 2.35rem;
		flex: none;
		place-items: center;
		border-radius: 0.85rem;
		background: rgb(15 23 42 / 0.06);
		color: #0f5132;
	}

	.cms-nav-link:hover .cms-nav-icon {
		background: #1b4332;
		color: #fff;
	}

	.cms-hero {
		display: grid;
		gap: 1.5rem;
		border: 1px solid rgb(255 255 255 / 0.78);
		border-radius: 2rem;
		background:
			linear-gradient(135deg, rgb(255 255 255 / 0.94), rgb(255 255 255 / 0.78)),
			linear-gradient(135deg, rgb(27 67 50 / 0.12), rgb(201 168 76 / 0.16));
		box-shadow: 0 20px 60px rgb(15 23 42 / 0.08);
		padding: 1.5rem;
		backdrop-filter: blur(18px);
	}

	.cms-hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.cms-hero-actions a {
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.9rem;
		border: 1px solid rgb(27 67 50 / 0.14);
		background: #fff;
		padding: 0 1rem;
		font-size: 0.875rem;
		font-weight: 800;
		color: #1b4332;
		box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
	}

	.cms-hero-actions a:first-child {
		background: #1b4332;
		color: #fff;
	}

	@media (min-width: 768px) {
		.cms-hero {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
			padding: 2rem;
		}
	}
</style>
