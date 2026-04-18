<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	type Product = PageData['products'][number];

	const formatCurrency = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value ?? 0);

	const formatPrice = (value: number | null | undefined) => {
		const price = Number(value ?? 0);
		return price > 0 ? formatCurrency(price) : 'Gratis';
	};

	const formatDate = (value: number | null | undefined) =>
		value
			? new Date(value).toLocaleDateString('id-ID', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				})
			: '-';

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const shortText = (value: string | null | undefined, length = 160) => {
		const source = plainText(value);
		if (!source) return 'Deskripsi produk akan muncul di sini setelah dilengkapi dari CMS Hub.';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const paymentTypeLabel: Record<string, string> = {
		bank: 'Transfer Bank',
		ewallet: 'E-Wallet',
		qris: 'QRIS',
		manual: 'Manual'
	};

	$: products = Array.isArray(data.products) ? data.products : [];
	$: featuredProducts = products.filter((product: Product) => product.featured);
</script>

<svelte:head>
	<title>Digital Store - Santri Online</title>
	<meta
		name="description"
		content="Katalog produk digital Santri Online yang dikelola dari CMS Hub."
	/>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute -left-16 top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"></div>
		<div class="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
			<div class="max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Digital Store</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Produk digital yang tampil langsung dari CMS Hub</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Halaman ini menampilkan katalog produk digital yang sudah dipublish dari panel super admin. Cocok
					untuk e-book, modul, file panduan, atau materi premium lain yang Anda jual dengan alur pembayaran manual yang rapi.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="#katalog" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Lihat Produk
					</a>
					<a href="/blog" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Kembali ke Blog
					</a>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-3">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Produk Live</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalProducts}</p>
					<p class="mt-1 text-xs text-white/65">Siap tampil di katalog publik.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Unggulan</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.featuredProducts}</p>
					<p class="mt-1 text-xs text-white/65">Produk yang ditandai featured.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Metode Bayar</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.paymentMethods}</p>
					<p class="mt-1 text-xs text-white/65">Terhubung ke produk yang tayang.</p>
				</div>
			</div>
		</div>
	</section>

	{#if featuredProducts.length > 0}
		<section class="space-y-4">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Pilihan Utama</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Produk unggulan</h2>
				</div>
				<p class="text-sm text-slate-500">Diprioritaskan dari pengaturan featured di CMS Hub.</p>
			</div>

			<div class="grid gap-5 lg:grid-cols-2">
				{#each featuredProducts as product}
					<article class="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
						<div class="grid h-full gap-0 md:grid-cols-[0.48fr_0.52fr]">
							<div class="bg-gradient-to-br from-emerald-50 via-white to-slate-100">
								{#if product.coverUrl}
									<img
										src={product.coverUrl}
										alt={`Cover ${product.title}`}
										class="h-full min-h-[220px] w-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div class="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-slate-100 px-6 text-center text-sm text-slate-500">
										Cover produk akan tampil di sini.
									</div>
								{/if}
							</div>
							<div class="p-6">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
										Featured
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
										{formatDate(product.updatedAt)}
									</span>
								</div>
								<h3 class="mt-4 text-2xl font-semibold text-slate-900">{product.title}</h3>
								<p class="mt-2 text-sm leading-7 text-slate-600">
									{shortText(product.summary || product.description, 210)}
								</p>
								<p class="mt-5 text-2xl font-semibold text-emerald-700">{formatPrice(product.price)}</p>
								{#if product.paymentMethods.length > 0}
									<div class="mt-5 flex flex-wrap gap-2">
										{#each product.paymentMethods as method}
											<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
												{paymentTypeLabel[method.type] ?? method.name}
											</span>
										{/each}
									</div>
								{/if}
								<div class="mt-5 flex gap-2">
									<a href={`/digital-store/${product.slug}`} class="btn btn-primary">Lihat Detail</a>
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section id="katalog" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Katalog Publik</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Semua produk digital</h2>
			</div>
			<p class="text-sm text-slate-500">Tersusun otomatis dari produk yang statusnya sudah dipublikasikan.</p>
		</div>

		{#if products.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada produk digital yang dipublikasikan.</p>
				<p class="mt-2 text-sm text-slate-500">
					Tambahkan produk dari Admin &gt; Super Admin &gt; CMS Hub, lalu ubah statusnya menjadi published.
				</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each products as product}
					<article
						id={product.slug}
						class="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
					>
						<div class="relative">
							{#if product.coverUrl}
								<img
									src={product.coverUrl}
									alt={`Cover ${product.title}`}
									class="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 px-6 text-center text-sm text-slate-500">
									Cover belum diunggah.
								</div>
							{/if}

							<div class="absolute left-4 top-4 flex flex-wrap gap-2">
								<span class="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
									Produk Digital
								</span>
								{#if product.featured}
									<span class="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm">
										Unggulan
									</span>
								{/if}
							</div>
						</div>

							<div class="space-y-4 p-5">
							<div>
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Terakhir update {formatDate(product.updatedAt)}</p>
								<h3 class="mt-2 text-xl font-semibold text-slate-900">{product.title}</h3>
								<p class="mt-3 text-sm leading-7 text-slate-600">
									{shortText(product.summary || product.description)}
								</p>
							</div>

							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Harga</p>
								<p class="mt-2 text-2xl font-semibold text-emerald-700">{formatPrice(product.price)}</p>
							</div>

								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Metode pembayaran</p>
									{#if product.paymentMethods.length > 0}
										<div class="mt-3 flex flex-wrap gap-2">
											{#each product.paymentMethods as method}
											<span class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
												{method.name}
											</span>
										{/each}
									</div>
								{:else}
									<p class="mt-3 text-sm text-slate-500">Metode pembayaran belum dihubungkan untuk produk ini.</p>
								{/if}
								</div>

								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Akses File</p>
									<p class="mt-2 text-sm font-semibold text-slate-900">File dibuka setelah bukti pembayaran diverifikasi admin.</p>
								</div>

								<div class="flex gap-2">
									<a href={`/digital-store/${product.slug}`} class="btn btn-primary flex-1">Beli Sekarang</a>
								</div>
							</div>
						</article>
				{/each}
			</div>
		{/if}
	</section>
</div>
