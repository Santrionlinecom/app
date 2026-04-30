<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

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

	const statusLabel = (status: string) =>
		({
			pending: 'Pending',
			paid: 'Paid',
			reversed: 'Reversed'
		})[status] ?? status;

	const statusTone = (status: string) =>
		({
			pending: 'bg-amber-100 text-amber-700',
			paid: 'bg-emerald-100 text-emerald-700',
			reversed: 'bg-rose-100 text-rose-700'
		})[status] ?? 'bg-slate-100 text-slate-700';

	$: summary = data.summary;
	$: ledger = data.ledger ?? [];
</script>

<svelte:head>
	<title>Pendapatan Penulis - Studio Buku</title>
	<meta name="description" content="Riwayat royalti penulis Buku SantriOnline." />
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_36%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_48%,_#064e3b_100%)] p-6 text-white shadow-xl md:p-8">
		<a href="/buku/studio" class="text-sm font-semibold text-emerald-100 hover:text-white">Kembali ke Studio</a>
		<div class="mt-5 grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/75">Royalti Penulis</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Pendapatan buku Anda</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75">
					Royalti dicatat saat pembaca membuka bab berbayar memakai coin.
				</p>
			</div>
			<div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Catatan</p>
				<p class="mt-3 text-sm leading-7 text-white/80">
					Royalti masih berupa pencatatan coin internal. Payout penulis akan dibuat pada tahap berikutnya.
				</p>
			</div>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total Pendapatan</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">{summary.totalEarnedCoin.toLocaleString('id-ID')}</p>
			<p class="mt-1 text-sm text-slate-500">coin royalti tercatat</p>
		</div>
		<div class="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Pending</p>
			<p class="mt-3 text-3xl font-bold text-amber-800">{summary.pendingCoin.toLocaleString('id-ID')}</p>
			<p class="mt-1 text-sm text-amber-700">coin belum payout</p>
		</div>
		<div class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Paid</p>
			<p class="mt-3 text-3xl font-bold text-emerald-800">{summary.paidCoin.toLocaleString('id-ID')}</p>
			<p class="mt-1 text-sm text-emerald-700">coin sudah ditandai paid</p>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Gross Unlock</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.totalGrossCoin.toLocaleString('id-ID')}</p>
		</div>
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bagian Penulis</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.totalAuthorCoin.toLocaleString('id-ID')}</p>
		</div>
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Komisi Platform</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.totalPlatformCoin.toLocaleString('id-ID')}</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-100 p-5 md:p-6">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Riwayat Unlock Berbayar</p>
			<h2 class="mt-2 text-2xl font-semibold text-slate-900">Ledger royalti</h2>
		</div>

		{#if ledger.length === 0}
			<div class="px-6 py-10 text-center">
				<p class="text-base font-semibold text-slate-900">Belum ada royalti.</p>
				<p class="mt-2 text-sm text-slate-500">Royalti akan muncul setelah pembaca membuka bab berbayar.</p>
			</div>
		{:else}
			<div class="divide-y divide-slate-100">
				{#each ledger as item}
					<article class="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:p-6">
						<div>
							<div class="flex flex-wrap gap-2">
								<span class={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
									{statusLabel(item.status)}
								</span>
								<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
									Bab {item.chapterNumber ?? '-'}
								</span>
							</div>
							<h3 class="mt-3 text-lg font-semibold text-slate-900">
								{item.bookTitle ?? 'Buku tidak ditemukan'}
							</h3>
							<p class="mt-1 text-sm text-slate-500">{item.chapterTitle ?? 'Bab tidak ditemukan'}</p>
							<p class="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
						</div>
						<div class="grid grid-cols-3 gap-2 text-right md:min-w-[18rem]">
							<div class="rounded-2xl bg-slate-50 px-3 py-3">
								<p class="text-[10px] uppercase tracking-[0.18em] text-slate-400">Gross</p>
								<p class="mt-1 font-bold text-slate-900">{item.grossCoin}</p>
							</div>
							<div class="rounded-2xl bg-emerald-50 px-3 py-3">
								<p class="text-[10px] uppercase tracking-[0.18em] text-emerald-600">Penulis</p>
								<p class="mt-1 font-bold text-emerald-800">{item.authorCoin}</p>
							</div>
							<div class="rounded-2xl bg-amber-50 px-3 py-3">
								<p class="text-[10px] uppercase tracking-[0.18em] text-amber-600">Platform</p>
								<p class="mt-1 font-bold text-amber-800">{item.platformCoin}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>
