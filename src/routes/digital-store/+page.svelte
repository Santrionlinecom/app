<script lang="ts">
	import { Coins } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type Product = PageData['products'][number];

	const formatCoin = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);

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
		if (!source) return 'Deskripsi produk akan muncul di sini setelah dilengkapi dari pusat konten.';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const canAfford = (price: number) => data.isLoggedIn && data.coinBalance >= price;

	$: products = Array.isArray(data.products) ? data.products : [];
	$: featuredProducts = products.filter((product: Product) => product.featured);
</script>

<svelte:head>
	<title>Digital Store - Santri Online</title>
	<meta
		name="description"
		content="Katalog produk digital Santri Online. Beli dengan Coin untuk akses instan."
	/>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute -left-16 top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"></div>
		<div class="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
			<div class="max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Digital Store</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Produk digital pilihan SantriOnline</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Beli produk digital menggunakan Coin untuk akses instan. E-book, modul, file panduan, dan materi premium lainnya tersedia di sini.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="#katalog" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Lihat Produk
					</a>
					{#if data.isLoggedIn}
						<a href="/coins/topup" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
							<Coins class="h-4 w-4" />
							Isi Saldo Coin
						</a>
					{:else}
						<a href="/auth" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
							Login
						</a>
					{/if}
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
				{#if data.isLoggedIn}
					<div class="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">Saldo Coin</p>
						<p class="mt-3 flex items-center gap-1 text-3xl font-semibold">
							<Coins class="h-7 w-7" />
							{formatCoin(data.coinBalance)}
						</p>
						<a href="/coins" class="mt-1 text-xs text-emerald-200/80 hover:text-white">Lihat riwayat →</a>
					</div>
				{:else}
					<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Pembayaran</p>
						<p class="mt-3 text-3xl font-semibold">Coin</p>
						<p class="mt-1 text-xs text-white/65">Login untuk membeli.</p>
					</div>
				{/if}
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
				<p class="text-sm text-slate-500">Diprioritaskan dari pengaturan produk pilihan.</p>
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
								<p class="mt-5 flex items-center gap-1 text-2xl font-semibold text-emerald-700">
									<Coins class="h-6 w-6" />
									{formatCoin(product.price)} Coin
								</p>
								{#if data.isLoggedIn && !canAfford(product.price)}
									<p class="mt-2 text-xs text-amber-600">
										Saldo tidak cukup. Butuh {formatCoin(product.price - data.coinBalance)} Coin lagi.
									</p>
								{/if}
								<div class="mt-5 flex gap-2">
									<a href={`/digital-store/${product.slug}`} class="btn btn-primary flex-1">Lihat Detail</a>
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
			<p class="text-sm text-slate-500">Beli dengan Coin untuk akses instan.</p>
		</div>

		{#if products.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada produk digital yang dipublikasikan.</p>
				<p class="mt-2 text-sm text-slate-500">
					Tambahkan produk dari halaman pengelolaan konten, lalu ubah statusnya menjadi terbit.
				</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each products as product}
					{@const affordable = canAfford(product.price)}
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

							<div class={`rounded-2xl p-4 ${affordable ? 'bg-emerald-50' : 'bg-slate-50'}`}>
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Harga</p>
								<p class={`mt-2 flex items-center gap-1 text-2xl font-semibold ${affordable ? 'text-emerald-700' : 'text-slate-700'}`}>
									<Coins class="h-6 w-6" />
									{formatCoin(product.price)} Coin
								</p>
								{#if data.isLoggedIn && !affordable}
									<p class="mt-2 text-xs text-amber-600">
										Butuh {formatCoin(product.price - data.coinBalance)} Coin lagi
									</p>
								{/if}
							</div>

							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Akses File</p>
								<p class="mt-2 text-sm font-semibold text-slate-900">Langsung setelah pembelian dengan Coin</p>
							</div>

							<div class="flex gap-2">
								{#if !data.isLoggedIn}
									<a href="/auth?redirect={encodeURIComponent(`/digital-store/${product.slug}`)}" class="btn btn-primary flex-1">
										Login untuk Beli
									</a>
								{:else if !affordable}
									<a href="/coins/topup" class="btn btn-warning flex-1">
										<Coins class="h-4 w-4" />
										Isi Saldo
									</a>
								{:else}
									<a href={`/digital-store/${product.slug}`} class="btn btn-primary flex-1">Beli Sekarang</a>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>