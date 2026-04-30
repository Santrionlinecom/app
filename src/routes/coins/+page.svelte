<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '-';
		return new Date(value).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getTransactionLabel = (type: string) => {
		switch (type) {
			case 'topup':
				return 'Topup';
			case 'unlock_chapter':
				return 'Beli Bab';
			case 'adjustment':
				return 'Penyesuaian';
			case 'refund':
				return 'Refund';
			default:
				return type;
		}
	};

	const getTransactionColor = (type: string) => {
		switch (type) {
			case 'topup':
			case 'refund':
				return 'text-emerald-600 bg-emerald-50';
			case 'unlock_chapter':
				return 'text-amber-600 bg-amber-50';
			case 'adjustment':
				return 'text-slate-600 bg-slate-50';
			default:
				return 'text-slate-600 bg-slate-50';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pending':
				return 'Menunggu';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'text-amber-600 bg-amber-50 border-amber-200';
			case 'approved':
				return 'text-emerald-600 bg-emerald-50 border-emerald-200';
			case 'rejected':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-slate-600 bg-slate-50 border-slate-200';
		}
	};

	$: wallet = data.wallet;
	$: transactions = data.transactions ?? [];
	$: topupRequests = data.topupRequests ?? [];
</script>

<svelte:head>
	<title>Koin Saya - SantriOnline</title>
	<meta name="description" content="Kelola koin SantriOnline untuk unlock bab buku." />
</svelte:head>

<div class="space-y-6 pb-10">
	<!-- Header -->
	<section class="rounded-[1.75rem] border border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_45%,_#78350f_100%)] px-5 py-8 text-white shadow-xl md:px-8">
		<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/75">Saldo Koin</p>
				<p class="mt-3 text-5xl font-bold text-white">{wallet.balance.toLocaleString('id-ID')}</p>
				<p class="mt-2 text-sm text-white/65">Koin tersedia untuk membeli bab buku.</p>
			</div>
			<a href="/coins/topup" class="btn border-none bg-amber-400 text-slate-900 hover:bg-amber-300">
				Topup Koin
			</a>
		</div>
	</section>

	<!-- Quick Info -->
	<div class="grid gap-4 sm:grid-cols-2">
		<a href="/buku" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Jelajahi Buku</p>
			<p class="mt-2 text-lg font-semibold text-slate-900">Baca &beli bab</p>
		</a>
		<a href="/digital-store" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Digital Store</p>
			<p class="mt-2 text-lg font-semibold text-slate-900">Koleksi lengkap</p>
		</a>
	</div>

	<!-- Riwayat Transaksi -->
	<section class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-100 p-5 md:p-6">
			<h2 class="text-xl font-semibold text-slate-900">Riwayat Transaksi</h2>
		</div>
		{#if transactions.length === 0}
			<div class="p-8 text-center">
				<p class="text-sm text-slate-500">Belum ada transaksi.</p>
			</div>
		{:else}
			<div class="divide-y divide-slate-100">
				{#each transactions as tx}
					<div class="flex items-center justify-between p-4 md:p-5">
						<div class="flex items-center gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full {getTransactionColor(tx.type)}">
								<span class="text-lg">↑</span>
							</div>
							<div>
								<p class="font-medium text-slate-900">{getTransactionLabel(tx.type)}</p>
								<p class="text-sm text-slate-500">{tx.description ?? '-'}</p>
							</div>
						</div>
						<div class="text-right">
							<p class="font-semibold {tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}">
								{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('id-ID')}
							</p>
							<p class="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Riwayat Topup -->
	<section class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-slate-100 p-5 md:p-6">
			<h2 class="text-xl font-semibold text-slate-900">Riwayat Topup</h2>
			<a href="/coins/topup" class="btn btn-outline btn-sm">Buat Request</a>
		</div>
		{#if topupRequests.length === 0}
			<div class="p-8 text-center">
				<p class="text-sm text-slate-500">Belum ada request topup.</p>
			</div>
		{:else}
			<div class="divide-y divide-slate-100">
				{#each topupRequests as req}
					<div class="flex items-center justify-between p-4 md:p-5">
						<div class="flex items-center gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full border {getStatusColor(req.status)}">
								{#if req.status === 'pending'}
									<span class="text-lg">⏳</span>
								{:else if req.status === 'approved'}
									<span class="text-lg">✓</span>
								{:else}
									<span class="text-lg">✕</span>
								{/if}
							</div>
							<div>
								<p class="font-medium text-slate-900">
									{req.coinAmount.toLocaleString('id-ID')} koin
								</p>
								<p class="text-sm text-slate-500">
									{formatRupiah(req.amountRupiah)} • {req.userNote ?? 'Tanpa catatan'}
								</p>
							</div>
						</div>
						<div class="text-right">
							<span class="rounded-full border px-3 py-1 text-xs font-medium {getStatusColor(req.status)}">
								{getStatusLabel(req.status)}
							</span>
							<p class="mt-1 text-xs text-slate-400">{formatDate(req.createdAt)}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>