<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import HafalanBadge from '$lib/components/tpq/HafalanBadge.svelte';
	import HafalanProgressBar from '$lib/components/tpq/HafalanProgressBar.svelte';
	import { displayRole } from '$lib/utils/role-display';

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
	let santriId = $state('');

	$effect(() => {
		santriId = data.santriId;
	});

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

	const getStatus = (itemId: number) => pencapaianMap.get(itemId)?.status ?? 'belum';
	const getCatatan = (itemId: number) => pencapaianMap.get(itemId)?.catatan ?? '';
	const hitungLulus = (items: KategoriView['items']) =>
		items.filter((item) => getStatus(item.id) === 'lulus').length;

	const onSantriChange = (event: Event) => {
		const id = (event.currentTarget as HTMLSelectElement).value;
		santriId = id;
		goto(id ? `?santri_id=${encodeURIComponent(id)}` : '?');
	};
</script>

<svelte:head>
	<title>Rapor Hafalan - Santri Online</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Akademik TPQ</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Rapor Hafalan Santri</h1>
				<p class="mt-2 text-sm text-slate-600">
					Input pencapaian hafalan per kategori. Role aktif: {displayRole(data.role)}.
				</p>
			</div>
			<a href="/tpq/rapor-rekap" class="btn btn-sm btn-outline">Lihat Rekap</a>
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<label class="form-control w-full">
			<span class="label-text mb-2 font-semibold">Pilih Santri</span>
			<select class="select select-bordered w-full" value={santriId} onchange={onSantriChange}>
				<option value="">Pilih santri</option>
				{#each data.daftarSantri as santri}
					<option value={santri.id}>{santri.nama}</option>
				{/each}
			</select>
		</label>
	</section>

	{#if !santriId}
		<div class="alert">
			<span>Pilih santri terlebih dahulu untuk melihat atau mengisi rapor hafalan.</span>
		</div>
	{:else if kategoriList.length === 0}
		<div class="alert alert-warning">
			<span>Data kategori hafalan belum tersedia untuk lembaga ini.</span>
		</div>
	{:else}
		<div class="space-y-3">
			{#each kategoriList as kategori}
				{@const lulus = hitungLulus(kategori.items)}
				{@const total = kategori.items.length}
				<div class="collapse collapse-arrow rounded-2xl border bg-base-100 shadow-sm">
					<input type="checkbox" checked={lulus < total} />
					<div class="collapse-title">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{kategori.icon ?? '•'}</span>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-3">
									<h2 class="truncate font-semibold text-slate-900">{kategori.nama}</h2>
									<span class="badge badge-ghost">{lulus}/{total}</span>
								</div>
								<HafalanProgressBar value={lulus} max={total} label="Kelulusan" />
							</div>
						</div>
					</div>
					<div class="collapse-content">
						<div class="divide-y divide-base-200">
							{#each kategori.items as item}
								{@const status = getStatus(item.id)}
								<form method="POST" action="?/updateStatus" use:enhance class="grid gap-3 py-3 lg:grid-cols-[1fr,12rem,1fr,6rem] lg:items-center">
									<input type="hidden" name="santri_id" value={santriId} />
									<input type="hidden" name="item_id" value={item.id} />

									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="font-medium text-slate-900">{item.nama}</p>
											<HafalanBadge {status} />
											{#if item.level}
												<span class="badge badge-outline badge-sm capitalize">{item.level}</span>
											{/if}
										</div>
										{#if item.fadhilah}
											<p class="mt-1 text-xs leading-5 text-slate-500">{item.fadhilah}</p>
										{/if}
									</div>

									<select name="status" class="select select-bordered select-sm w-full" value={status}>
										<option value="belum">Belum</option>
										<option value="proses">Proses</option>
										<option value="lulus">Lulus</option>
										<option value="perlu_perbaikan">Perlu Perbaikan</option>
									</select>

									<input
										name="catatan"
										class="input input-bordered input-sm w-full"
										value={getCatatan(item.id)}
										placeholder="Catatan guru"
										maxlength="500"
									/>

									<button class="btn btn-primary btn-sm" type="submit">Simpan</button>
								</form>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
