<script lang="ts">
	import type { PageData } from './$types';
	import HafalanBadge from '$lib/components/tpq/HafalanBadge.svelte';
	import HafalanProgressBar from '$lib/components/tpq/HafalanProgressBar.svelte';

	type KategoriView = {
		id: number;
		nama: string;
		icon: string | null;
		items: Array<{
			id: number;
			nama: string;
			fadhilah: string | null;
			level: string | null;
		}>;
	};
	type PencapaianView = {
		itemId: number;
		status: 'belum' | 'proses' | 'lulus' | 'perlu_perbaikan';
		catatan: string | null;
	};

	let { data } = $props<{ data: PageData }>();

	let kategoriList = $derived.by(() => {
		const map = new Map<number, KategoriView>();
		for (const row of data.rows) {
			if (!map.has(row.kategoriId)) {
				map.set(row.kategoriId, {
					id: row.kategoriId,
					nama: row.kategoriNama,
					icon: row.icon,
					items: []
				});
			}
			if (row.itemId && row.itemNama) {
				map.get(row.kategoriId)?.items.push({
					id: row.itemId,
					nama: row.itemNama,
					fadhilah: row.fadhilah,
					level: row.level
				});
			}
		}
		return Array.from(map.values());
	});

	let pencapaianMap = $derived(
		new Map<number, PencapaianView>(
			(data.pencapaian as PencapaianView[]).map((item: PencapaianView) => [item.itemId, item])
		)
	);
	let totalItem = $derived(kategoriList.reduce((sum, kategori) => sum + kategori.items.length, 0));
	let totalLulus = $derived(
		kategoriList.reduce(
			(sum, kategori) =>
				sum + kategori.items.filter((item) => pencapaianMap.get(item.id)?.status === 'lulus').length,
			0
		)
	);

	const statusFor = (itemId: number) => pencapaianMap.get(itemId)?.status ?? 'belum';
	const lulusKategori = (kategori: KategoriView) =>
		kategori.items.filter((item) => statusFor(item.id) === 'lulus').length;

	let badges = $derived.by(() => {
		const completed = new Set(
			kategoriList
				.filter((kategori) => kategori.items.length > 0 && lulusKategori(kategori) === kategori.items.length)
				.map((kategori) => kategori.nama)
		);
		const result: string[] = [];
		if (completed.has('Juz 30')) result.push('Hafidz Juz 30');
		if (completed.has('Surah Pilihan')) result.push('Hafidz Surah Pilihan');
		if (completed.has('Doa Harian')) result.push('Hafidz Doa Harian');
		if (completed.has('Asmaul Husna')) result.push('Hafidz Asmaul Husna');
		if (completed.has('Aqidah Dasar')) result.push('Kuat Aqidah');
		if (kategoriList.length > 0 && completed.size === kategoriList.length) result.push('Santri Lengkap');
		return result;
	});
</script>

<svelte:head>
	<title>Rapor Hafalan Saya - Santri Online</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Rapor Hafalan</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">{data.santri.nama}</h1>
				<p class="mt-2 text-sm text-slate-600">Pantau pencapaian hafalan yang sudah dinilai guru.</p>
			</div>
			<div class="w-full md:w-72">
				<HafalanProgressBar value={totalLulus} max={totalItem} label="Total Kelulusan" />
			</div>
		</div>
	</section>

	{#if badges.length > 0}
		<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
			<p class="text-sm font-semibold text-amber-900">Badge Pencapaian</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each badges as badge}
					<span class="badge badge-warning gap-1">{badge}</span>
				{/each}
			</div>
		</section>
	{/if}

	{#if kategoriList.length === 0}
		<div class="alert alert-warning">
			<span>Data kategori hafalan belum tersedia.</span>
		</div>
	{:else}
		<div class="grid gap-4 lg:grid-cols-2">
			{#each kategoriList as kategori}
				{@const lulus = lulusKategori(kategori)}
				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<div class="flex items-start gap-3">
						<span class="text-2xl">{kategori.icon ?? '•'}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-3">
								<h2 class="font-semibold text-slate-900">{kategori.nama}</h2>
								<span class="badge badge-ghost">{lulus}/{kategori.items.length}</span>
							</div>
							<div class="mt-2">
								<HafalanProgressBar value={lulus} max={kategori.items.length} label="Progress" />
							</div>
						</div>
					</div>

					<div class="mt-4 divide-y divide-base-200">
						{#each kategori.items as item}
							<div class="py-3">
								<div class="flex items-center justify-between gap-3">
									<p class="text-sm font-medium text-slate-900">{item.nama}</p>
									<HafalanBadge status={statusFor(item.id)} />
								</div>
								{#if pencapaianMap.get(item.id)?.catatan}
									<p class="mt-1 text-xs text-slate-500">Catatan: {pencapaianMap.get(item.id)?.catatan}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
