<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const flagged = data.flagged ?? [];
	const isEmpty = flagged.length === 0;
	const summary = flagged.reduce(
		(acc, row) => {
			if (row.qualityStatus === 'merah') acc.merah += 1;
			else if (row.qualityStatus === 'kuning') acc.kuning += 1;
			else acc.pending += 1;
			return acc;
		},
		{ merah: 0, kuning: 0, pending: 0 }
	);
</script>

<svelte:head>
	<title>Hafalan Belum Lancar</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Hafalan</p>
		<h1 class="mt-2 text-2xl font-semibold">Hafalan Belum Lancar</h1>
		<p class="mt-1 text-sm text-white/90">
			Terhubung dengan santri: status merah/kuning dan setoran pending.
		</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Monitoring</h2>
				<p class="text-sm text-slate-500">Ustadz/Admin menandai, santri langsung melihat.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Merah</p>
				<p class="mt-2 text-2xl font-semibold text-rose-600">{summary.merah}</p>
				<p class="text-xs text-slate-500">Perlu perbaikan segera.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Kuning</p>
				<p class="mt-2 text-2xl font-semibold text-amber-600">{summary.kuning}</p>
				<p class="text-xs text-slate-500">Perlu latihan ulang.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Pending</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.pending}</p>
				<p class="text-xs text-slate-500">Setoran menunggu persetujuan.</p>
			</div>
		</div>

		<div class="mt-4 rounded-xl border">
			<div class="grid grid-cols-6 bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
				<span>Santri</span>
				<span class="text-center">Surah</span>
				<span class="text-center">Ayat</span>
				<span class="text-center">Status</span>
				<span class="text-center">Quality</span>
				<span class="text-right">Tgl Setor</span>
			</div>
			<div class="divide-y">
				{#if isEmpty}
					<div class="px-4 py-3 text-sm text-slate-500">Belum ada data.</div>
				{:else}
					{#each flagged as row}
						<div class="grid grid-cols-6 items-center px-4 py-3 text-sm">
							<div class="space-y-0.5">
								<p class="font-semibold text-slate-900">{row.username || row.email}</p>
								<p class="text-[11px] text-slate-500">{row.email}</p>
							</div>
							<span class="text-center text-xs text-slate-600">{row.surahNumber}</span>
							<span class="text-center text-xs text-slate-600">{row.ayahNumber}</span>
							<span class="text-center text-xs text-slate-600">{row.status}</span>
							<span class="text-center text-xs text-slate-600">
								{row.qualityStatus ?? 'pending'}
							</span>
							<span class="text-right text-xs text-slate-500">
								{row.tanggalSetor ? new Date(row.tanggalSetor).toLocaleDateString('id-ID') : '-'}
							</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
