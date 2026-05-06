<script lang="ts">
	import type { PageData } from './$types';
	import HafalanProgressBar from '$lib/components/tpq/HafalanProgressBar.svelte';

	type RekapView = {
		santriId: string;
		santriNama: string;
		email: string | null;
		totalItem: number;
		totalItemDiisi: number;
		totalLulus: number;
		totalProses: number;
		totalPerbaikan: number;
		persenLulus: number;
	};

	let { data } = $props<{ data: PageData }>();
	let rekapRows = $derived(data.rekap as RekapView[]);

	let totalSantri = $derived(rekapRows.length);
	let rataRata = $derived(
		totalSantri
			? Math.round(
					(rekapRows.reduce((sum: number, row: RekapView) => sum + row.persenLulus, 0) / totalSantri) * 100
				) / 100
			: 0
	);
	let santriLengkap = $derived(
		rekapRows.filter((row: RekapView) => row.totalItem > 0 && row.totalLulus === row.totalItem).length
	);
</script>

<svelte:head>
	<title>Rekap Rapor Hafalan - Santri Online</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Akademik TPQ</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Rekap Rapor Hafalan</h1>
				<p class="mt-2 text-sm text-slate-600">
					{data.totalKategori} kategori dan {data.totalItem} item hafalan untuk seluruh santri.
				</p>
			</div>
			<a href="/tpq/hafalan-rapor" class="btn btn-sm btn-primary">Input Rapor</a>
		</div>
	</section>

	<div class="grid gap-3 md:grid-cols-3">
		<div class="stat rounded-2xl border bg-white shadow-sm">
			<div class="stat-title">Total Santri</div>
			<div class="stat-value text-slate-900">{totalSantri}</div>
		</div>
		<div class="stat rounded-2xl border bg-white shadow-sm">
			<div class="stat-title">Rata-rata Lulus</div>
			<div class="stat-value text-emerald-700">{rataRata}%</div>
		</div>
		<div class="stat rounded-2xl border bg-white shadow-sm">
			<div class="stat-title">Santri Lengkap</div>
			<div class="stat-value text-amber-600">{santriLengkap}</div>
		</div>
	</div>

	<section class="rounded-2xl border bg-white shadow-sm">
		<div class="border-b px-4 py-3">
			<h2 class="font-semibold text-slate-900">Daftar Santri</h2>
		</div>
		{#if rekapRows.length === 0}
			<div class="p-6 text-sm text-slate-500">Belum ada santri aktif di lembaga ini.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Santri</th>
							<th>Progress</th>
							<th class="text-right">Lulus</th>
							<th class="text-right">Proses</th>
							<th class="text-right">Perbaikan</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each rekapRows as row}
							<tr>
								<td>
									<div class="font-medium text-slate-900">{row.santriNama}</div>
									{#if row.email}
										<div class="text-xs text-slate-500">{row.email}</div>
									{/if}
								</td>
								<td class="min-w-56">
									<HafalanProgressBar value={row.totalLulus} max={row.totalItem} label="Kelulusan" />
								</td>
								<td class="text-right">{row.totalLulus}/{row.totalItem}</td>
								<td class="text-right">{row.totalProses}</td>
								<td class="text-right">{row.totalPerbaikan}</td>
								<td class="text-right">
									<a class="btn btn-xs btn-outline" href={`/tpq/hafalan-rapor?santri_id=${encodeURIComponent(row.santriId)}`}>
										Detail
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
