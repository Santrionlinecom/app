<script lang="ts">
	// src/routes/(app)/dashboard/kelola-halaqah/+page.svelte
	// Pengurus lembaga mengatur halaqah dan anggotanya.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let mengirim = $state(false);
</script>

<svelte:head>
	<title>Kelola Halaqah | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="rounded-3xl border bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Halaqah</p>
		<h1 class="mt-2 text-2xl font-semibold">Kelola Halaqah & Anggota</h1>
		<p class="mt-1 text-sm text-white/90">
			Halaqah sengaja dibatasi jumlahnya agar setiap santri benar-benar tersimak.
		</p>
	</div>

	{#if form?.sukses}
		<p class="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800" role="status">
			{form.sukses}
		</p>
	{/if}
	{#if form?.pesan}
		<p class="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="alert">
			{form.pesan}
		</p>
	{/if}

	<section class="rounded-2xl border bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-900">Buat halaqah baru</h2>
		<form
			method="POST"
			action="?/buatHalaqah"
			class="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
			use:enhance={() => {
				mengirim = true;
				return async ({ update }) => {
					await update();
					mengirim = false;
				};
			}}
		>
			<div>
				<label class="block text-sm font-bold text-slate-900" for="nama">Nama halaqah</label>
				<input id="nama" name="nama" placeholder="Halaqah Abu Bakar" autocomplete="off" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
			</div>
			<div>
				<label class="block text-sm font-bold text-slate-900" for="kapasitas">Kapasitas</label>
				<input id="kapasitas" name="kapasitas" type="number" min="3" max="30" value="12" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
			</div>
			<button type="submit" disabled={mengirim} class="min-h-[48px] rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:bg-slate-300">
				{mengirim ? 'Menyimpan…' : 'Buat'}
			</button>
		</form>
	</section>

	{#if data.halaqah.length > 0}
		<section class="space-y-4">
			{#each data.halaqah as h (h.id)}
				<article class="rounded-2xl border bg-white p-6 shadow-sm">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h3 class="text-lg font-semibold text-slate-900">{h.nama}</h3>
						<p class="text-sm text-slate-500">
							{h.jumlah} / {h.kapasitas} santri
							{#if h.ustadz_nama}· Musyrif: {h.ustadz_nama}{/if}
						</p>
					</div>

					{#if data.anggotaPerHalaqah[h.id]?.length > 0}
						<ul class="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
							{#each data.anggotaPerHalaqah[h.id] as a (a.userId)}
								<li class="flex items-center justify-between gap-3 px-4 py-3">
									<span class="text-slate-800">{a.nama}</span>
									<form method="POST" action="?/keluarkanAnggota" use:enhance>
										<input type="hidden" name="halaqohId" value={h.id} />
										<input type="hidden" name="santriUserId" value={a.userId} />
										<button type="submit" class="text-sm font-semibold text-slate-500 hover:text-amber-700 hover:underline">
											Keluarkan
										</button>
									</form>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
							Belum ada anggota.
						</p>
					{/if}

					{#if h.jumlah < h.kapasitas && data.santri.length > 0}
						<form method="POST" action="?/tambahAnggota" class="mt-4 flex flex-col gap-3 sm:flex-row" use:enhance>
							<input type="hidden" name="halaqohId" value={h.id} />
							<label class="sr-only" for={`santri-${h.id}`}>Pilih santri</label>
							<select id={`santri-${h.id}`} name="santriUserId" class="min-h-[48px] flex-1 rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15">
								{#each data.santri as s (s.user_id)}
									<option value={s.user_id}>{s.nama}</option>
								{/each}
							</select>
							<button type="submit" class="min-h-[48px] rounded-xl border border-emerald-700 px-5 font-bold text-emerald-800 transition hover:bg-emerald-50">
								Tambah ke halaqah
							</button>
						</form>
					{:else if h.jumlah >= h.kapasitas}
						<p class="mt-4 text-sm font-semibold text-slate-500">
							Halaqah sudah penuh — ini disengaja agar musyrif sanggup menyimak setiap santri.
						</p>
					{/if}
				</article>
			{/each}
		</section>
	{:else}
		<section class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p class="font-bold text-slate-900">Belum ada halaqah</p>
			<p class="mt-2 text-sm text-slate-600">Buat halaqah pertama lewat formulir di atas.</p>
		</section>
	{/if}
</div>
