<script lang="ts">
	import MediaGalleryModal from '$lib/components/MediaGalleryModal.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type CmsPost = PageData['cms']['posts'][number];
	type DigitalProduct = PageData['digitalCommerce']['products'][number];
	type DigitalPaymentMethod = PageData['digitalCommerce']['paymentMethods'][number];
	type DigitalSale = PageData['digitalCommerce']['recentSales'][number];
	type DigitalSalesPoint = PageData['digitalCommerce']['salesChart'][number];

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
		productFileSize = product?.fileSize ?? 0;
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
			productFileSize = payload.size ?? 0;
		} catch (err) {
			console.error('Upload digital file error:', err);
			alert('Gagal mengunggah file digital.');
		} finally {
			uploadingDigitalFile = false;
			if (target) target.value = '';
		}
	};
</script>

<svelte:head>
	<title>CMS Hub - Super Admin</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-6 py-10">
	<!-- Header -->
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-3">
			<a href="/admin/super/overview" class="text-sm text-slate-500 hover:text-slate-700">← Kembali</a>
		</div>
		<h1 class="text-3xl font-bold text-slate-900">CMS Hub</h1>
		<p class="text-slate-600">Blog dan Produk Digital dalam satu ruang super admin</p>
	</div>

	<!-- CMS Hub Overview Section -->
	<section class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
			<!-- CMS Artikel Card -->
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

			<!-- Digital Store Card -->
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

	<!-- Produk Digital Section -->
	<section id="cms-digital" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
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

				<input type="hidden" name="product-id" bind:value={productId} />

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
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Harga (IDR)</span>
						<input name="price" type="number" min="0" class="input input-bordered mt-2 w-full" bind:value={productPrice} />
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
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
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
						<select name="status" class="select select-bordered mt-2 w-full" bind:value={productStatus}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cover Produk</span>
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
							<p class="mt-2 text-xs text-emerald-600">✓ Cover sudah diupload</p>
						{/if}
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">File Digital</span>
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
							<p class="mt-2 text-xs text-emerald-600">✓ File sudah diupload</p>
						{/if}
					</label>
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Deskripsi Lengkap</span>
						<textarea
							name="description"
							class="textarea textarea-bordered mt-2 w-full"
							placeholder="Deskripsi detail produk Anda..."
							bind:value={productDescription}
						></textarea>
					</label>
				</div>

				<input type="hidden" name="file-url" bind:value={productFileUrl} />
				<input type="hidden" name="file-size" bind:value={productFileSize} />
				<input type="hidden" name="cover-url" bind:value={productCoverUrl} />
				<input type="hidden" name="payment-methods" bind:value={productPaymentMethodIds.join(',')} />

				<div class="mt-6 flex gap-2">
					<button type="submit" class="btn btn-primary">
						{data.digitalCommerce.editingProduct ? 'Update Produk' : 'Simpan Produk'}
					</button>
					{#if data.digitalCommerce.editingProduct}
						<form method="POST" action="?/deleteProduct" class="inline">
							<input type="hidden" name="product-id" value={productId} />
							<button
								type="submit"
								class="btn btn-outline btn-error"
								on:click={(e) => {
									if (!confirm('Hapus produk ini?')) e.preventDefault();
								}}
							>
								Hapus
							</button>
						</form>
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
										<p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">/{product.slug}</p>
									</div>
									<p class="shrink-0 text-sm font-semibold text-emerald-700">{formatCurrency(product.price)}</p>
								</div>

								<p class="mt-3 text-sm text-slate-600">{shortText(product.summary || product.description, 120)}</p>

								<div class="mt-4 flex gap-2">
									<a href={`/admin/super/cms-hub?product=${product.id}#cms-digital`} class="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
										Edit
									</a>
									<form method="POST" action="?/deleteProduct" class="inline">
										<input type="hidden" name="product-id" value={product.id} />
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

	<!-- Payment Methods Section -->
	<section id="payment-methods" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Metode Pembayaran</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Atur cara pembayaran produk digital</h2>
				<p class="mt-2 text-sm text-slate-500">
					Aktifkan berbagai metode pembayaran untuk memudahkan pelanggan. Produk akan menampilkan metode yang sudah diaktifkan.
				</p>
			</div>
		</div>

		<div class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
			<!-- Payment Form -->
			<form method="POST" action="?/savePaymentMethod" class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-900">
							{data.digitalCommerce.editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Metode Pembayaran Baru'}
						</p>
						<p class="text-xs text-slate-500">Tambah atau ubah detail metode pembayaran untuk produk digital Anda.</p>
					</div>
					{#if data.digitalCommerce.editingPaymentMethod}
						<a href="/admin/super/cms-hub#payment-methods" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
							Batal
						</a>
					{/if}
				</div>

				<input type="hidden" name="payment-id" bind:value={paymentMethodId} />

				<div class="mt-5 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tipe Pembayaran</span>
						<select name="type" class="select select-bordered mt-2 w-full" bind:value={paymentMethodType}>
							<option value="bank">Bank Transfer</option>
							<option value="ewallet">E-Wallet</option>
							<option value="qris">QRIS</option>
							<option value="manual">Manual</option>
						</select>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Metode</span>
						<input
							name="name"
							class="input input-bordered mt-2 w-full"
							placeholder="Contoh: BCA Transfer"
							bind:value={paymentMethodName}
						/>
					</label>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Pemilik Akun</span>
						<input
							name="account-name"
							class="input input-bordered mt-2 w-full"
							placeholder="Contoh: Pondok Pesantren Nurul Qur'an"
							bind:value={paymentAccountName}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nomor Akun/Rekening</span>
						<input
							name="account-number"
							class="input input-bordered mt-2 w-full"
							placeholder="Contoh: 123456789"
							bind:value={paymentAccountNumber}
						/>
					</label>
				</div>

				<div class="mt-4">
					<label class="block">
						<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Instruksi Pembayaran</span>
						<textarea
							name="details"
							class="textarea textarea-bordered mt-2 w-full"
							placeholder="Instruksi detail untuk pembayaran..."
							bind:value={paymentInstructions}
						></textarea>
					</label>
				</div>

				<div class="mt-6 flex gap-2">
					<button type="submit" class="btn btn-primary">
						{data.digitalCommerce.editingPaymentMethod ? 'Update Metode' : 'Simpan Metode'}
					</button>
					{#if data.digitalCommerce.editingPaymentMethod}
						<form method="POST" action="?/deletePaymentMethod" class="inline">
							<input type="hidden" name="payment-id" value={paymentMethodId} />
							<button
								type="submit"
								class="btn btn-outline btn-error"
								on:click={(e) => {
									if (!confirm('Hapus metode pembayaran ini?')) e.preventDefault();
								}}
							>
								Hapus
							</button>
						</form>
					{/if}
				</div>
			</form>

			<!-- Payment Methods List -->
			<div class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
				<h3 class="text-sm font-semibold text-slate-900">Metode Aktif</h3>
				<div class="mt-4 space-y-3 max-h-96 overflow-y-auto">
					{#if data.digitalCommerce.paymentMethods.length === 0}
						<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center text-sm text-slate-500">
							Belum ada metode pembayaran
						</div>
					{:else}
						{#each data.digitalCommerce.paymentMethods as method}
							<div class="rounded-2xl border border-slate-200 bg-white px-3 py-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-slate-900 text-sm">{method.name}</p>
										<p class="text-xs text-slate-600 mt-1">{paymentTypeLabel[method.type] ?? method.type}</p>
										<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-2 ${paymentTone(method.type)}`}>
											{method.isActive ? 'Aktif' : 'Nonaktif'}
										</span>
									</div>
									<a href={`/admin/super/cms-hub?payment=${method.id}#payment-methods`} class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
										Edit
									</a>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Payment Methods List Full -->
		<div class="mt-8">
			<h3 class="text-xl font-semibold text-slate-900">Daftar Metode Pembayaran</h3>
			{#if data.digitalCommerce.paymentMethods.length === 0}
				<div class="mt-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
					Belum ada metode pembayaran. Tambahkan metode di atas untuk memulai.
				</div>
			{:else}
				<div class="mt-5 space-y-3">
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
									<a href={`/admin/super/cms-hub?payment=${method.id}#payment-methods`} class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
										Edit
									</a>
									<form method="POST" action="?/deletePaymentMethod">
										<input type="hidden" name="payment-id" value={method.id} />
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
				</div>
			{/if}
		</div>
	</section>

	<!-- Sales Chart Section -->
	<section id="sales-chart" class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Grafik Penjualan</p>
				<h2 class="section-title mt-2 text-2xl font-semibold text-slate-900">Ringkasan penjualan 14 hari terakhir</h2>
				<p class="mt-2 text-sm text-slate-500">
					Visualisasi omzet harian dan daftar transaksi terbaru untuk membantu Anda memantau performa penjualan.
				</p>
			</div>
		</div>

		<!-- Sales Chart -->
		<div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="grid gap-4 md:grid-cols-3">
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
					<p class="text-[11px] uppercase tracking-[0.24em] text-slate-400">Total Penjualan</p>
					<p class="mt-3 text-3xl font-semibold text-emerald-700">{formatNumber(data.digitalCommerce.stats.totalSales)}</p>
					<p class="mt-1 text-xs text-slate-600">Order tercatat</p>
				</div>
				<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
					<p class="text-[11px] uppercase tracking-[0.24em] text-slate-400">Total Omzet</p>
					<p class="mt-3 text-2xl font-semibold text-amber-700">{formatCurrency(data.digitalCommerce.stats.totalRevenue)}</p>
					<p class="mt-1 text-xs text-slate-600">Dari semua penjualan</p>
				</div>
				<div class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
					<p class="text-[11px] uppercase tracking-[0.24em] text-slate-400">Rata-rata Order</p>
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
						<p class="text-[10px] text-slate-500">{point.date}</p>
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
											<p class="text-sm font-semibold text-slate-900">{sale.productTitle}</p>
											<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${saleStatusClass(sale.status)}`}>
												{sale.status}
											</span>
										</div>
										<p class="mt-2 text-sm text-slate-600">{sale.buyerEmail}</p>
										<p class="mt-1 text-xs text-slate-500">{formatDateTime(sale.createdAt)}</p>
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
</div>

<style>
	:global(.super-admin-shell) {
		--tw-bg-opacity: 1;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
		min-height: 100vh;
		position: relative;
	}
</style>
