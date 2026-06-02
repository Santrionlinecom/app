<script lang="ts">
	import LembagaMap from '$lib/components/admin/LembagaMap.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

	$: stats = data.stats ?? { total: 0, aktif: 0, pending: 0 };
</script>

<svelte:head>
	<title>Peta Sebaran Lembaga - Super Admin SantriOnline</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin Super</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Peta Sebaran Lembaga</h1>
				<p class="mt-1 text-sm text-slate-500">Pantau lokasi lembaga yang sudah mengisi koordinat.</p>
			</div>
		</div>
	</section>

	<section class="grid gap-3 md:grid-cols-3">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Lembaga</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">{formatNumber(stats.total)}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lembaga Aktif</p>
			<p class="mt-3 text-3xl font-bold text-emerald-700">{formatNumber(stats.aktif)}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Menunggu Verifikasi</p>
			<p class="mt-3 text-3xl font-bold text-amber-700">{formatNumber(stats.pending)}</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
		<LembagaMap />
		<p class="mt-3 text-xs text-slate-500">Hanya lembaga yang sudah mengisi koordinat yang ditampilkan</p>
	</section>
</div>
