<script lang="ts">
	// src/routes/(app)/wali/[santriId]/+page.svelte
	// Detail perkembangan anak. Sengaja TIDAK menampilkan peringkat, target,
	// atau penanda merah — anak yang dimarahi karena dashboard bukan hasil
	// yang diinginkan.
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const r = $derived(data.ringkasan);
</script>

<svelte:head>
	<title>Perkembangan {r.nama} | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<a href="/wali" class="text-sm font-semibold text-emerald-800 hover:underline">← Semua santri</a>

	<header class="mt-4 mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{r.nama}</h1>
		{#if r.lembagaNama}
			<p class="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
				{r.lembagaNama}
			</p>
		{/if}
	</header>

	<section class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
		<p class="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Saran percakapan</p>
		<p class="mt-2 leading-7 text-slate-800">{r.saranPercakapan}</p>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-bold text-slate-900">Kebiasaan yang sedang dijaga</h2>

		{#if r.habit.length > 0}
			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				{#each r.habit as h (h.misi)}
					<article class="rounded-2xl border border-slate-200 bg-white p-5">
						<p class="font-bold text-slate-900">{h.judul}</p>
						<div class="mt-3 flex items-baseline gap-2">
							<span class="text-3xl font-extrabold text-emerald-800">{h.streakSekarang}</span>
							<span class="text-sm text-slate-500">hari berturut-turut</span>
						</div>
						<p class="mt-2 text-sm text-slate-500">
							Terbaik sejauh ini {h.streakTerbaik} hari · pekan ini {h.checkinPekanIni} hari
						</p>
					</article>
				{/each}
			</div>
		{:else}
			<p class="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
				Belum ada catatan kebiasaan. Ini bukan tanda kegagalan — mungkin ananda baru memulai.
				Tanyakan kabar belajarnya lebih dulu, bukan angkanya.
			</p>
		{/if}
	</section>

	<p class="mt-10 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
		Anda memantau, bukan mencatat. Centang kebiasaan hanya boleh dilakukan ananda sendiri —
		supaya angka di halaman ini tetap jujur dan berarti.
	</p>
</main>
