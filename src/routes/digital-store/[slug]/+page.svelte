<script lang="ts">
	import { deserialize } from '$app/forms';
	import { page } from '$app/stores';
	import { Coins, Loader2 } from 'lucide-svelte';
	import InsufficientCoinNotice from '$lib/components/InsufficientCoinNotice.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type ToastKind = 'success' | 'error';
	type ToastState = {
		kind: ToastKind;
		message: string;
	};

	const formatCoin = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	let isProcessing = false;
	let toast: ToastState | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let insufficientCoinData: {
		currentBalance: number;
		requiredAmount: number;
		shortfall: number;
		productName: string;
	} | null = null;

	const showToast = (kind: ToastKind, message: string) => {
		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		toast = { kind, message };
		toastTimer = setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 4200);
	};

	const handlePurchase = async (event: Event) => {
		event.preventDefault();
		
		if (!data.isLoggedIn) {
			showToast('error', 'Silakan login terlebih dahulu.');
			setTimeout(() => {
				window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
			}, 1000);
			return;
		}

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		insufficientCoinData = null;
		isProcessing = true;

		try {
			const response = await fetch('?/createOrder', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const payload = result.data as any;
				
				if (payload?.type === 'insufficient_coin') {
					insufficientCoinData = {
						currentBalance: payload.currentBalance ?? 0,
						requiredAmount: payload.requiredAmount ?? data.product.price,
						shortfall: payload.shortfall ?? 0,
						productName: payload.productName ?? data.product.title
					};
					showToast('error', 'Saldo coin tidak cukup. Silakan isi saldo terlebih dahulu.');
					return;
				}
				
				throw new Error(payload?.error ?? 'Gagal membuat pesanan.');
			}

			if (result.type === 'error') {
				throw new Error(result.error?.message ?? 'Gagal membuat pesanan.');
			}

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			showToast('success', 'Pesanan berhasil dibuat!');
		} catch (err) {
			showToast('error', err instanceof Error ? err.message : 'Gagal memproses pesanan.');
		} finally {
			isProcessing = false;
		}
	};

	$: canAfford = data.isLoggedIn && data.coinBalance >= data.product.price;
</script>

<svelte:head>
	<title>{data.product.title} - Digital Store</title>
	<meta
		name="description"
		content={plainText(data.product.summary || data.product.description) || `Beli ${data.product.title} di Santri Online.`}
	/>
</svelte:head>

<div class="space-y-8">
	<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#064e3b_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
			<div class="max-w-sm">
				<div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-2xl">
					{#if data.product.coverUrl}
						<img src={data.product.coverUrl} alt={`Cover ${data.product.title}`} class="h-full w-full object-cover" />
					{:else}
						<div class="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-white/65">
							Cover produk belum ditambahkan.
						</div>
					{/if}
				</div>
			</div>

			<div class="max-w-3xl">
				<a href="/digital-store" class="text-sm text-emerald-200 hover:text-white">← Kembali ke Digital Store</a>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
						Produk Digital
					</span>
					{#if data.product.featured}
						<span class="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
							Unggulan
						</span>
					{/if}
					{#if data.isLoggedIn}
						<span class="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
							<Coins class="inline h-3 w-3" />
							Saldo: {formatCoin(data.coinBalance)} Coin
						</span>
					{/if}
				</div>
				<h1 class="mt-4 text-3xl font-bold md:text-5xl">{data.product.title}</h1>
				<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
					{plainText(data.product.summary || data.product.description) || 'Produk digital ini dikelola dari pusat konten.'}
				</p>

				<div class="mt-6 grid gap-3 sm:grid-cols-3">
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Harga</p>
						<p class="mt-2 flex items-center gap-1 text-lg font-semibold text-white">
							<Coins class="h-5 w-5" />
							{formatCoin(data.product.price)} Coin
						</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Pembayaran</p>
						<p class="mt-2 text-lg font-semibold text-white">Coin</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Akses File</p>
						<p class="mt-2 text-lg font-semibold text-white">Langsung</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	{#if insufficientCoinData}
		<InsufficientCoinNotice
			currentBalance={insufficientCoinData.currentBalance}
			requiredAmount={insufficientCoinData.requiredAmount}
			shortfall={insufficientCoinData.shortfall}
			productName={insufficientCoinData.productName}
		/>
	{/if}

	<section class="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Checkout dengan Coin</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Beli dengan Coin</h2>
				</div>
				<p class="text-sm text-slate-500">Pembayaran langsung menggunakan saldo Coin Anda.</p>
			</div>

			{#if form?.error && form?.type !== 'insufficient_coin'}
				<div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{form.error}
				</div>
			{/if}

			{#if !data.isLoggedIn}
				<div class="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-6 py-8 text-center">
					<p class="text-sm font-semibold text-amber-900">Silakan login terlebih dahulu untuk membeli produk ini.</p>
					<a href="/auth?redirect={encodeURIComponent($page.url.pathname)}" class="btn btn-primary mt-4">
						Login Sekarang
					</a>
				</div>
			{:else}
				<form on:submit={handlePurchase} class="mt-6 space-y-6">
					<div class="grid gap-4 md:grid-cols-2">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Pembeli</span>
							<input
								name="buyerName"
								class="input input-bordered mt-2 w-full"
								placeholder="Nama lengkap"
								required
								disabled={isProcessing}
							/>
						</label>
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">WhatsApp / Kontak</span>
							<input
								name="buyerContact"
								class="input input-bordered mt-2 w-full"
								placeholder="08xxxxxxxxxx"
								required
								disabled={isProcessing}
							/>
						</label>
					</div>

					<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Total Pembayaran</p>
								<p class="mt-1 flex items-center gap-1 text-2xl font-bold text-emerald-900">
									<Coins class="h-6 w-6" />
									{formatCoin(data.product.price)} Coin
								</p>
							</div>
							<div class="text-right">
								<p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Saldo Anda</p>
								<p class="mt-1 flex items-center justify-end gap-1 text-lg font-semibold text-emerald-900">
									<Coins class="h-5 w-5" />
									{formatCoin(data.coinBalance)} Coin
								</p>
							</div>
						</div>
					</div>

					<div class="flex gap-3">
						{#if !canAfford}
							<a href="/coins/topup" class="btn btn-warning flex-1">
								<Coins class="h-4 w-4" />
								Isi Saldo Coin
							</a>
						{:else}
							<button type="submit" class="btn btn-primary flex-1" disabled={isProcessing}>
								{#if isProcessing}
									<Loader2 class="h-4 w-4 animate-spin" />
									Memproses...
								{:else}
									<Coins class="h-4 w-4" />
									Beli Sekarang
								{/if}
							</button>
						{/if}
						<a href="/digital-store" class="btn btn-outline">Kembali</a>
					</div>
				</form>
			{/if}
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Informasi Produk</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Detail Pembelian</h2>

			<div class="mt-6 space-y-4">
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Metode Pembayaran</p>
					<div class="mt-3 flex items-center gap-2">
						<div class="rounded-full bg-emerald-100 p-2">
							<Coins class="h-5 w-5 text-emerald-700" />
						</div>
						<div>
							<p class="text-sm font-semibold text-slate-900">Coin SantriOnline</p>
							<p class="text-xs text-slate-500">Pembayaran instan menggunakan saldo Coin</p>
						</div>
					</div>
				</div>

				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Keuntungan Pembayaran Coin</p>
					<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-700">
						<li class="flex gap-2">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
							<span>Proses pembayaran instan tanpa menunggu</span>
						</li>
						<li class="flex gap-2">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
							<span>Akses file digital langsung setelah pembelian</span>
						</li>
						<li class="flex gap-2">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
							<span>Tidak perlu upload bukti transfer</span>
						</li>
						<li class="flex gap-2">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
							<span>Riwayat transaksi tercatat otomatis</span>
						</li>
					</ul>
				</div>

				{#if !data.isLoggedIn || !canAfford}
					<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.24em] text-amber-700">Perhatian</p>
						<p class="mt-2 text-sm text-amber-800">
							{#if !data.isLoggedIn}
								Anda harus login terlebih dahulu untuk membeli produk ini.
							{:else}
								Saldo Coin Anda tidak mencukupi. Silakan isi saldo terlebih dahulu.
							{/if}
						</p>
					</div>
				{/if}
			</div>
		</article>
	</section>
</div>

{#if toast}
	<div
		class={`fixed bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-soft ${
			toast.kind === 'success'
				? 'border-emerald-200 bg-emerald-50 text-emerald-800'
				: 'border-red-200 bg-red-50 text-red-800'
		}`}
	>
		{toast.message}
	</div>
{/if}