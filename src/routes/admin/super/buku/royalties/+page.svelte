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
			all: 'Semua',
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
	<title>Laporan Royalti Buku - Super Admin</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Super Admin</p>
				<h1 class="mt-2 text-3xl font-semibold text-slate-900">Laporan Royalti Buku</h1>
				<p class="mt-2 text-sm leading-7 text-slate-600">
					Pantau pembagian coin dari unlock bab berbayar. Payout belum diproses otomatis.
				</p>
			</div>
			<div class="flex flex-col gap-2 sm:flex-row">
				<a href="/admin/super/buku" class="btn btn-outline">Moderasi Buku</a>
				<a href="/admin/super/overview" class="btn btn-outline">Overview</a>
			</div>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-4">
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Ledger</p>
			<p class="mt-2 text-3xl font-bold text-slate-900">{summary.totalLedgerCount}</p>
		</div>
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Gross Coin</p>
			<p class="mt-2 text-3xl font-bold text-slate-900">{summary.totalGrossCoin.toLocaleString('id-ID')}</p>
		</div>
		<div class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
			<p class="text-xs uppercase tracking-[0.22em] text-emerald-700">Royalti Penulis</p>
			<p class="mt-2 text-3xl font-bold text-emerald-800">{summary.totalAuthorCoin.toLocaleString('id-ID')}</p>
		</div>
		<div class="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
			<p class="text-xs uppercase tracking-[0.22em] text-amber-700">Komisi Platform</p>
			<p class="mt-2 text-3xl font-bold text-amber-800">{summary.totalPlatformCoin.toLocaleString('id-ID')}</p>
		</div>
	</section>

	<div class="flex gap-2 overflow-x-auto pb-2">
		<a
			href="/admin/super/buku/royalties"
			class="btn btn-sm {data.currentStatus === 'all' ? 'btn-primary' : 'btn-outline'}"
		>
			Semua
		</a>
		{#each data.statuses as status}
			<a
				href={`/admin/super/buku/royalties?status=${status}`}
				class="btn btn-sm {data.currentStatus === status ? 'btn-primary' : 'btn-outline'}"
			>
				{statusLabel(status)}
			</a>
		{/each}
	</div>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-100 p-5 md:p-6">
			<h2 class="text-xl font-semibold text-slate-900">Ledger semua penulis</h2>
			<p class="mt-1 text-sm text-slate-500">Menampilkan maksimal 250 transaksi terbaru.</p>
		</div>

		{#if ledger.length === 0}
			<div class="px-6 py-10 text-center">
				<p class="text-base font-semibold text-slate-900">Belum ada ledger royalti.</p>
				<p class="mt-2 text-sm text-slate-500">Ledger akan muncul setelah unlock bab berbayar berhasil.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[980px] text-left">
					<thead class="border-b border-slate-100 bg-slate-50">
						<tr>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Author</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Buku/Bab</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Reader</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Gross</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Penulis</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Platform</th>
							<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each ledger as item}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-4 text-sm text-slate-500">{formatDate(item.createdAt)}</td>
								<td class="px-4 py-4">
									<p class="font-semibold text-slate-900">{item.authorName ?? item.authorEmail ?? item.authorId}</p>
									{#if item.authorEmail}
										<p class="text-xs text-slate-500">{item.authorEmail}</p>
									{/if}
								</td>
								<td class="px-4 py-4">
									<p class="font-semibold text-slate-900">{item.bookTitle ?? item.bookId}</p>
									<p class="text-sm text-slate-500">
										Bab {item.chapterNumber ?? '-'}: {item.chapterTitle ?? item.chapterId}
									</p>
								</td>
								<td class="px-4 py-4">
									<p class="text-sm font-medium text-slate-900">{item.readerName ?? item.readerEmail ?? item.readerId}</p>
									{#if item.readerEmail}
										<p class="text-xs text-slate-500">{item.readerEmail}</p>
									{/if}
								</td>
								<td class="px-4 py-4 font-semibold text-slate-900">{item.grossCoin}</td>
								<td class="px-4 py-4 font-semibold text-emerald-700">{item.authorCoin}</td>
								<td class="px-4 py-4 font-semibold text-amber-700">{item.platformCoin}</td>
								<td class="px-4 py-4">
									<span class={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
										{statusLabel(item.status)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
