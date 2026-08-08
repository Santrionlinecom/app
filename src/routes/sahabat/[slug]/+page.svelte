<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const s = data.sahabat;
</script>

<SeoHead
	title={`${s.name} — Biografi Sahabat`}
	description={s.summary}
	keywords={`${s.name}, sahabat nabi, biografi sahabat`}
	canonical={`/sahabat/${s.slug}`}
/>

<div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50/30 py-10">
	<div class="mx-auto max-w-4xl space-y-6 px-4">
		<a href="/sahabat" class="text-sm font-semibold text-amber-800 hover:underline">← Daftar Sahabat</a>

		<header class="rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-600 p-7 text-white shadow-xl md:p-10">
			<p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/90">{s.group[0] ?? 'Sahabat'}</p>
			<h1 class="mt-3 text-3xl font-black md:text-4xl">{s.name}</h1>
			{#if s.laqab || s.kunya}
				<p class="mt-2 text-sm text-white/85">{[s.kunya, s.laqab].filter(Boolean).join(' · ')}</p>
			{/if}
			<p class="mt-2 text-sm text-amber-50/90">{s.born ?? '—'} – {s.died ?? '—'}</p>
			<p class="mt-4 max-w-2xl text-base leading-8 text-white/90">{s.role}</p>
		</header>

		<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold text-slate-900">Ringkasan</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700 md:text-base">{s.summary}</p>
			{#if s.group?.length}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each s.group as g}
						<span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{g}</span>
					{/each}
				</div>
			{/if}
		</section>

		<section class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">Biografi</h2>
			<p class="mt-4 text-sm leading-8 text-slate-700 md:text-base">{s.story}</p>
		</section>

		<div class="grid gap-4 md:grid-cols-2">
			<section class="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Jasa & capaian</h2>
				<ul class="mt-3 space-y-2.5">
					{#each s.achievements as item}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="text-orange-600">•</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>
			<section class="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Pelajaran</h2>
				<ul class="mt-3 space-y-2.5">
					{#each s.lessons as item}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="font-bold text-amber-700">✓</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>
		</div>

		{#if s.traits?.length}
			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Sifat yang menonjol</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each s.traits as t}
						<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
							>{t}</span
						>
					{/each}
				</div>
			</section>
		{/if}

		<section class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs leading-6 text-slate-600">
			<strong>Adab:</strong> Kami mencintai seluruh sahabat dan Ahlul Bait. Perkara fitnah dibahas dengan adab ahlus
			sunnah, tanpa mencaci. Untuk kajian mendalam, rujuk sirah dan syarah ulama mu’tabar.
		</section>

		{#if s.related?.length}
			<section class="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Terkait</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each s.related as rel}
						{@const related = data.list.find((item) => item.slug === rel)}
						<a
							href={`/sahabat/${rel}`}
							class="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
						>
							{related?.name ?? rel}
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>
