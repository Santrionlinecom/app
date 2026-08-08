<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const f = data.figure;
</script>

<SeoHead
	title={`${f.name} — Biografi Tabi'in`}
	description={f.summary}
	keywords={`${f.name}, tabiin, biografi ulama`}
	canonical={`/tabiin/${f.slug}`}
/>

<div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50/30 py-10">
	<div class="mx-auto max-w-4xl space-y-6 px-4">
		<a href="/tabiin" class="text-sm font-semibold text-amber-800 hover:underline">← Daftar Tabi’in</a>

		<header class="rounded-[1.75rem] bg-gradient-to-br from-amber-900 via-orange-800 to-rose-800 p-7 text-white shadow-xl md:p-10">
			<p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/90">{f.center}</p>
			<h1 class="mt-3 text-3xl font-black md:text-4xl">{f.name}</h1>
			<p class="mt-2 text-sm text-amber-50/90">{f.era}</p>
			<p class="mt-4 text-base leading-8 text-white/90">{f.role}</p>
			<p class="mt-2 text-sm text-white/75">Fokus: {f.focus}</p>
		</header>

		<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold text-slate-900">Ringkasan</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700 md:text-base">{f.summary}</p>
		</section>

		{#if f.story}
			<section class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Biografi</h2>
				<p class="mt-4 text-sm leading-8 text-slate-700 md:text-base">{f.story}</p>
			</section>
		{/if}

		<div class="grid gap-4 md:grid-cols-2">
			<section class="rounded-2xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Guru (sahabat / senior)</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">{f.teachers.join(', ')}</p>
			</section>
			<section class="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Murid utama</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">{f.students.join(', ')}</p>
			</section>
		</div>

		{#if f.achievements?.length}
			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Jasa & capaian</h2>
				<ul class="mt-3 space-y-2">
					{#each f.achievements as item}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="text-amber-600">•</span><span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if f.lessons?.length}
			<section class="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Pelajaran</h2>
				<ul class="mt-3 space-y-2">
					{#each f.lessons as item}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="font-bold text-teal-700">✓</span><span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if f.traits?.length}
			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Sifat menonjol</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each f.traits as t}
						<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
							>{t}</span
						>
					{/each}
				</div>
			</section>
		{/if}

		<p class="text-xs leading-6 text-slate-500">
			Catatan: biografi ringkas untuk pembinaan. Detail khilafiyah sanad/jarh dirujuk ke kitab rijal dan guru.
		</p>
	</div>
</div>
