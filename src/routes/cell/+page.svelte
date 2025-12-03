<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
	const formatCurrency = (value: number) => formatter.format(value);
	const formatDate = (value: number) =>
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

	const menuItems = [
		{
			title: 'Pulsa',
			desc: 'Isi pulsa semua operator',
			icon: 'M7 11h10m-9 4h8M5 6h14M6 3h12a1 1 0 011 1v16l-5-3-5 3-5-3-5 3V4a1 1 0 011-1z',
			href: '#purchase',
			gradient: 'from-amber-400 to-orange-500'
		},
		{
			title: 'Paket Data',
			desc: 'Kuota internet',
			icon: 'M4 6h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 0l8 5 8-5',
			href: '#purchase',
			gradient: 'from-sky-400 to-cyan-500'
		},
		{
			title: 'Token PLN',
			desc: 'Listrik prabayar',
			icon: 'M13 2L6 14h5v8l7-12h-5l5-8h-5z',
			href: '#purchase',
			gradient: 'from-emerald-400 to-lime-500'
		},
		{
			title: 'Riwayat',
			desc: 'Cek transaksi terakhir',
			icon: 'M5 4h14M5 12h14M5 20h14',
			href: '#history',
			gradient: 'from-purple-400 to-fuchsia-500'
		}
	];

	const statusStyle: Record<'pending' | 'success' | 'failed', string> = {
		pending: 'badge-warning text-white',
		success: 'badge-success text-white',
		failed: 'badge-error text-white'
	};

	const statusLabel: Record<'pending' | 'success' | 'failed', string> = {
		pending: 'Diproses',
		success: 'Berhasil',
		failed: 'Gagal'
	};

	const productLabel: Record<string, string> = {
		pulsa: 'Pulsa',
		data: 'Paket Data',
		pln: 'Token PLN'
	};
</script>

<svelte:head>
	<title>Santri Cell - Isi Pulsa & Tagihan</title>
</svelte:head>

<div class="space-y-8">
	<!-- Saldo Card -->
	<section class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-2xl">
		<div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_25%)]"></div>
		<div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-sm uppercase tracking-[0.2em] text-white/80">Saldo Santri Cell</p>
				<h1 class="text-4xl md:text-5xl font-bold mt-2 leading-tight">{formatCurrency(data.balance)}</h1>
				<p class="text-sm text-white/80 mt-2">Halo {data.userDisplayName ?? 'Santri'}, gunakan saldo untuk membeli pulsa, paket data, atau token PLN.</p>
			</div>
			<div class="flex items-center gap-3">
				<div class="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
					<p class="text-xs uppercase tracking-wide text-white/80">Status</p>
					<p class="text-lg font-semibold">Aktif</p>
				</div>
				<a href="#purchase" class="btn btn-lg bg-white text-emerald-700 hover:bg-slate-50 border-none shadow-xl">
					⚡ Beli Sekarang
				</a>
			</div>
		</div>
	</section>

	<!-- Menu Grid -->
	<section class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		{#each menuItems as item}
			<a
				href={item.href}
				class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
			>
				<div class={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10`}></div>
				<div class="relative flex flex-col gap-2">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-inner">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-7 w-7 stroke-2 text-emerald-600" fill="none" stroke="currentColor">
							<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
					<h3 class="text-base font-semibold text-slate-900">{item.title}</h3>
					<p class="text-sm text-slate-500 leading-snug">{item.desc}</p>
					<span class="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition">
						Pilih layanan
						<span>→</span>
					</span>
				</div>
			</a>
		{/each}
	</section>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Purchase form -->
		<section id="purchase" class="card border border-slate-100 bg-white shadow-xl">
			<div class="card-body space-y-4">
				<div class="flex items-center gap-3">
					<div class="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">🛒</div>
					<div>
						<h2 class="card-title">Buat Pesanan</h2>
						<p class="text-sm text-slate-500">Pilih produk, isi nomor tujuan, dan nominal.</p>
					</div>
				</div>

				<form method="POST" action="?/purchase" class="space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="form-control">
							<label class="label" for="product-type">
								<span class="label-text font-semibold">Jenis Produk</span>
							</label>
							<select id="product-type" name="productType" class="select select-bordered w-full" required>
								<option value="pulsa">Pulsa</option>
								<option value="data">Paket Data</option>
								<option value="pln">Token PLN</option>
							</select>
						</div>

						<div class="form-control">
							<label class="label" for="amount">
								<span class="label-text font-semibold">Nominal (Rp)</span>
							</label>
							<input
								id="amount"
								name="amount"
								type="number"
								min="1000"
								step="1000"
								placeholder="25000"
								inputmode="numeric"
								class="input input-bordered w-full"
								required
							/>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="destination">
							<span class="label-text font-semibold">Nomor HP / Meteran</span>
						</label>
						<input
							id="destination"
							name="destination"
							type="tel"
							inputmode="numeric"
							pattern="[0-9]{8,16}"
							placeholder="08xxxxxxxxxx atau 12 digit meteran"
							class="input input-bordered w-full"
							required
						/>
						<label class="label">
							<span class="label-text-alt text-slate-400">Gunakan angka saja, tanpa spasi atau tanda baca.</span>
						</label>
					</div>

					{#if form?.success}
						<div class="alert alert-success shadow-sm">
							<span>✅ Pesanan berhasil dikirim! ID: {form.txId}</span>
						</div>
					{:else if form?.message}
						<div class="alert alert-error shadow-sm">
							<span>⚠️ {form.message}</span>
						</div>
					{/if}

					<button type="submit" class="btn btn-primary w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none">
						Proses Pesanan
					</button>
				</form>
			</div>
		</section>

		<!-- Transaction history -->
		<section id="history" class="card border border-slate-100 bg-white shadow-xl">
			<div class="card-body space-y-4">
				<div class="flex items-center gap-3">
					<div class="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">🧾</div>
					<div>
						<h2 class="card-title">Riwayat Transaksi Terakhir</h2>
						<p class="text-sm text-slate-500">5 transaksi terbaru Anda.</p>
					</div>
				</div>

				{#if data.transactions.length === 0}
					<div class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
						Belum ada transaksi. Yuk coba beli pulsa atau token PLN.
					</div>
				{:else}
					<ul class="divide-y divide-slate-100">
						{#each data.transactions as tx}
							<li class="flex items-start justify-between gap-3 py-3">
								<div>
									<p class="font-semibold text-slate-900">
										{productLabel[tx.productType] ?? tx.productType} · {tx.destinationNumber}
									</p>
									<p class="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
								</div>
								<div class="text-right space-y-1">
									<p class="font-bold text-emerald-600">{formatCurrency(tx.amount)}</p>
									<span class={`badge badge-sm ${statusStyle[tx.status]}`}>{statusLabel[tx.status]}</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>
	</div>
</div>
