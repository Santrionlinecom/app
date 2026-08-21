<script lang="ts">
	// src/routes/(app)/dashboard/halaqoh/+page.svelte
	// Ringkasan halaqoh lembaga. Semua angka datang dari server.
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Halaqoh Santri</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Halaqoh</p>
		<h1 class="mt-2 text-2xl font-semibold">Halaqoh & Setoran</h1>
		<p class="mt-1 text-sm text-white/90">Pantau kelompok kecil santri dan setoran yang menunggu disimak.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Ringkasan</h2>
				<p class="text-sm text-slate-500">Data langsung dari halaqah lembaga Anda.</p>
			</div>
			<a href="/dashboard/kelola-halaqah" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">
				Kelola halaqah
			</a>
		</div>

		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Halaqoh Aktif</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{data.halaqahAktif}</p>
				<p class="text-xs text-slate-500">kelompok berjalan</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Santri Tergabung</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{data.totalSantri}</p>
				<p class="text-xs text-slate-500">anggota aktif</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Setoran Hari Ini</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{data.setoranHariIni}</p>
				<p class="text-xs text-slate-500">tercatat hari ini</p>
			</div>
		</div>

		{#if data.daftar.length > 0}
			<ul class="mt-4 divide-y divide-slate-100 rounded-xl border">
				{#each data.daftar as h (h.id)}
					<li class="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
						<div>
							<p class="font-semibold text-slate-900">{h.nama}</p>
							<p class="text-xs text-slate-500">
								{h.jumlah} / {h.kapasitas} santri
								{#if h.ustadz_nama}· {h.ustadz_nama}{/if}
							</p>
						</div>
						{#if h.menunggu > 0}
							<a href="/dashboard/kotak-setoran" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200">
								{h.menunggu} setoran menunggu
							</a>
						{:else}
							<span class="text-xs text-slate-400">semua tersimak</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
				Belum ada halaqoh. <a href="/dashboard/kelola-halaqah" class="font-bold text-emerald-800 hover:underline">Buat halaqah pertama</a>
				agar santri bisa mulai menyetor.
			</div>
		{/if}
	</div>
</div>
