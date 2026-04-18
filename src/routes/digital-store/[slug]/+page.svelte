<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type PaymentMethod = PageData['product']['paymentMethods'][number];

	const formatCurrency = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value ?? 0);

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const paymentTypeLabel: Record<string, string> = {
		bank: 'Transfer Bank',
		ewallet: 'E-Wallet',
		qris: 'QRIS',
		manual: 'Manual'
	};

	let selectedPaymentMethodId = data.product.paymentMethods[0]?.id ?? '';

	$: selectedPaymentMethod =
		data.product.paymentMethods.find((method: PaymentMethod) => method.id === selectedPaymentMethodId) ??
		data.product.paymentMethods[0] ??
		null;
</script>

<svelte:head>
	<title>{data.product.title} - Digital Store</title>
	<meta
		name="description"
		content={plainText(data.product.summary || data.product.description) || `Checkout manual untuk ${data.product.title} di Santri Online.`}
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
				</div>
				<h1 class="mt-4 text-3xl font-bold md:text-5xl">{data.product.title}</h1>
				<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
					{plainText(data.product.summary || data.product.description) || 'Produk digital ini dikelola dari CMS Hub.'}
				</p>

				<div class="mt-6 grid gap-3 sm:grid-cols-3">
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Harga</p>
						<p class="mt-2 text-lg font-semibold text-white">{formatCurrency(data.product.price)}</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Metode Aktif</p>
						<p class="mt-2 text-lg font-semibold text-white">{data.product.paymentMethods.length}</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Akses File</p>
						<p class="mt-2 text-lg font-semibold text-white">Setelah verifikasi</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Checkout Manual</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Pilih metode bayar lalu kirim bukti</h2>
				</div>
				<p class="text-sm text-slate-500">Sistem akan membuat order dan memberi halaman tracking pembayaran.</p>
			</div>

			{#if form?.error}
				<div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{form.error}
				</div>
			{/if}

			{#if data.product.paymentMethods.length === 0}
				<div class="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
					Metode pembayaran belum diatur untuk produk ini.
				</div>
			{:else}
				<form method="POST" action="?/createOrder" enctype="multipart/form-data" class="mt-6 space-y-6">
					<div class="grid gap-4 md:grid-cols-2">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nama Pembeli</span>
							<input
								name="buyerName"
								class="input input-bordered mt-2 w-full"
								placeholder="Nama lengkap"
								required
							/>
						</label>
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">WhatsApp / Kontak</span>
							<input
								name="buyerContact"
								class="input input-bordered mt-2 w-full"
								placeholder="08xxxxxxxxxx"
								required
							/>
						</label>
					</div>

					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Metode Pembayaran</p>
						<div class="mt-3 grid gap-3 md:grid-cols-2">
							{#each data.product.paymentMethods as method}
								<label class={`cursor-pointer rounded-[1.25rem] border px-4 py-4 transition ${selectedPaymentMethodId === method.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
									<input
										type="radio"
										name="paymentMethodId"
										value={method.id}
										class="sr-only"
										bind:group={selectedPaymentMethodId}
									/>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="text-sm font-semibold text-slate-900">{method.name}</p>
											<p class="mt-1 text-xs text-slate-500">{paymentTypeLabel[method.type] ?? method.type}</p>
											{#if method.accountName || method.accountNumber}
												<p class="mt-3 text-sm text-slate-700">
													{method.accountName || '-'}{#if method.accountNumber} • {method.accountNumber}{/if}
												</p>
											{/if}
										</div>
										<div class={`rounded-full px-2 py-1 text-[11px] font-semibold ${selectedPaymentMethodId === method.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}`}>
											Pilih
										</div>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bukti Bayar</p>
						<input
							name="proofFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,application/pdf"
							class="file-input file-input-bordered mt-3 w-full"
						/>
						<p class="mt-2 text-xs text-slate-500">Opsional saat checkout. Anda bisa upload sekarang atau nanti dari halaman order. Maksimal 8MB.</p>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn btn-primary">Buat Order Manual</button>
						<a href="/digital-store" class="btn btn-outline">Kembali</a>
					</div>
				</form>
			{/if}
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Metode Terpilih</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Instruksi pembayaran</h2>

			{#if selectedPaymentMethod}
				<div class="mt-6 space-y-4">
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-slate-900">{selectedPaymentMethod.name}</p>
								<p class="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
									{paymentTypeLabel[selectedPaymentMethod.type] ?? selectedPaymentMethod.type}
								</p>
							</div>
							<p class="text-sm font-semibold text-emerald-700">{formatCurrency(data.product.price)}</p>
						</div>
						{#if selectedPaymentMethod.accountName || selectedPaymentMethod.accountNumber}
							<div class="mt-4 rounded-xl border border-white bg-white px-4 py-4">
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Tujuan Pembayaran</p>
								<p class="mt-2 text-base font-semibold text-slate-900">{selectedPaymentMethod.accountName || '-'}</p>
								<p class="mt-1 text-sm text-slate-600">{selectedPaymentMethod.accountNumber || '-'}</p>
							</div>
						{/if}
					</div>

					{#if selectedPaymentMethod.assetUrl}
						<div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Aset Pembayaran</p>
							<img
								src={selectedPaymentMethod.assetUrl}
								alt={`QR ${selectedPaymentMethod.name}`}
								class="mt-4 w-full rounded-xl border border-slate-200 bg-white object-contain"
							/>
						</div>
					{/if}

					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Langkah Pembayaran</p>
						<ol class="mt-3 space-y-2 text-sm leading-7 text-slate-700">
							<li>1. Transfer atau kirim dana sesuai nominal produk.</li>
							<li>2. Simpan bukti transfer atau screenshot pembayaran.</li>
							<li>3. Buat order manual dari form checkout.</li>
							<li>4. Upload bukti bayar jika belum diunggah saat checkout.</li>
							<li>5. Tunggu verifikasi admin. File digital akan terbuka setelah status lunas.</li>
						</ol>
						{#if selectedPaymentMethod.instructions}
							<p class="mt-4 text-sm text-slate-700">
								<strong>Catatan:</strong> {selectedPaymentMethod.instructions}
							</p>
						{/if}
					</div>
				</div>
			{:else}
				<div class="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
					Pilih metode pembayaran untuk melihat instruksi detail.
				</div>
			{/if}
		</article>
	</section>
</div>
