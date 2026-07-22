<script lang="ts">
	import LembagaMap from '$lib/components/admin/LembagaMap.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

	$: stats = data.stats ?? { total: 0, aktif: 0, pending: 0 };
	$: lembaga = data.lembaga ?? [];
	$: lembagaTanpaKoordinat = data.lembagaTanpaKoordinat ?? [];
	$: mappedCount = lembaga.filter((item) => {
		const lat = Number(item.latitude);
		const lng = Number(item.longitude);
		return (
			Number.isFinite(lat) &&
			Number.isFinite(lng) &&
			!(lat === 0 && lng === 0) &&
			lat >= -11.5 &&
			lat <= 6.5 &&
			lng >= 94.5 &&
			lng <= 141.5
		);
	}).length;
</script>

<svelte:head>
	<title>Peta Sebaran Lembaga - Super Admin SantriOnline</title>
</svelte:head>

<div class="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-12 pt-2 sm:px-6 lg:px-8">
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin Super</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Peta Sebaran Lembaga</h1>
				<p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
					Pantau lokasi lembaga yang sudah mengisi koordinat. Titik hijau = aktif, kuning = menunggu
					verifikasi, merah = status lain.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
					{formatNumber(mappedCount)} titik di peta
				</span>
				<span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
					{formatNumber(lembagaTanpaKoordinat.length)} belum berkoordinat
				</span>
				<a class="btn btn-sm btn-outline" href="#lembaga-tanpa-koordinat">Lengkapi data →</a>
			</div>
		</div>
	</section>

	<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Dengan Koordinat</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">{formatNumber(stats.total)}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lembaga Aktif</p>
			<p class="mt-3 text-3xl font-bold text-emerald-600">{formatNumber(stats.aktif)}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Menunggu Verifikasi</p>
			<p class="mt-3 text-3xl font-bold text-amber-700">{formatNumber(stats.pending)}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tanpa Koordinat</p>
			<p class="mt-3 text-3xl font-bold text-slate-700">{formatNumber(lembagaTanpaKoordinat.length)}</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
		<div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-base font-semibold text-slate-900">Peta interaktif</h2>
				<p class="text-xs text-slate-500">
					Geser/zoom peta. Klik titik untuk detail. Hanya koordinat valid di wilayah Indonesia.
				</p>
			</div>
		</div>
		<LembagaMap {lembaga} />
	</section>

	<section id="lembaga-tanpa-koordinat" class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
		<div class="flex items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Lembaga Tanpa Koordinat</h2>
				<p class="mt-1 text-sm text-slate-500">
					Data ini dapat dipakai admin lembaga untuk melengkapi lokasi di halaman akun.
				</p>
			</div>
			<span class="text-xs font-semibold text-slate-400">{formatNumber(lembagaTanpaKoordinat.length)} item</span>
		</div>
		{#if lembagaTanpaKoordinat.length === 0}
			<p class="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
				Semua lembaga yang terdata sudah memiliki koordinat.
			</p>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Nama Lembaga</th>
							<th>Kota</th>
						</tr>
					</thead>
					<tbody>
						{#each lembagaTanpaKoordinat as item (item.id)}
							<tr>
								<td class="font-medium text-slate-900">{item.nama}</td>
								<td class="text-slate-600">{item.kota || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
