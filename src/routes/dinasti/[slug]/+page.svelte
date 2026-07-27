<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Breadcrumb from '$lib/components/seo/Breadcrumb.svelte';
	import SchemaOrg from '$lib/components/seo/SchemaOrg.svelte';
	import DynastyTerritoryMap from '$lib/components/DynastyTerritoryMap.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const d = data.dynasty;
</script>

<SeoHead
	title={`${d.name} — Daulah & Dinasti Islam`}
	description={d.summary}
	keywords={`${d.name}, daulah islam, dinasti islam, ${d.slug}, sejarah peradaban islam`}
	canonical={`/dinasti/${d.slug}`}
/>

<SchemaOrg
	type="breadcrumb"
	data={{
		breadcrumbs: [
			{ name: 'Beranda', url: '/' },
			{ name: 'Dinasti & Daulah Islam', url: '/dinasti' },
			{ name: d.name, url: `/dinasti/${d.slug}` }
		]
	}}
/>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white py-10">
	<div class="mx-auto max-w-4xl space-y-6 px-4">
		<Breadcrumb
			items={[
				{ name: 'Beranda', url: '/' },
				{ name: 'Dinasti & Daulah Islam', url: '/dinasti' },
				{ name: d.name, url: `/dinasti/${d.slug}` }
			]}
		/>

		<header
			class="rounded-[1.75rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-900 p-7 text-white shadow-xl md:p-10"
		>
			<div class="flex flex-wrap gap-2">
				<span class="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">{d.type}</span>
				<span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{d.periodCE}</span>
				<span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{d.periodAH}</span>
			</div>
			<h1 class="mt-4 text-3xl font-black md:text-4xl">{d.name}</h1>
			<p class="mt-3 max-w-2xl text-base leading-8 text-white/90">{d.summary}</p>
		</header>

		<div class="grid gap-4 md:grid-cols-3">
			<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Ibu kota</p>
				<p class="mt-2 text-sm font-medium leading-6 text-slate-800">{d.capital}</p>
			</section>
			<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
				<p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Wilayah inti</p>
				<p class="mt-2 text-sm font-medium leading-6 text-slate-800">{d.regions}</p>
			</section>
		</div>

		{#if d.story}
			<section class="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Uraian sejarah</h2>
				<p class="mt-4 text-sm leading-8 text-slate-700 md:text-base">{d.story}</p>
			</section>
		{/if}

		<section class="rounded-2xl border border-sky-100 bg-sky-50/40 p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">Warisan</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">{d.legacy}</p>
		</section>

		{#if d.highlights?.length}
			<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Sorotan</h2>
				<ul class="mt-4 space-y-2">
					{#each d.highlights as h}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="text-indigo-600">•</span><span>{h}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if d.keyFigures?.length}
			<section class="rounded-2xl border border-indigo-50 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Tokoh penting</h2>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each d.keyFigures as person}
						<span
							class="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-900"
							>{person}</span
						>
					{/each}
				</div>
			</section>
		{/if}

		{#if d.lessons?.length}
			<section class="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Ibrah untuk santri</h2>
				<ul class="mt-4 space-y-2">
					{#each d.lessons as lesson}
						<li class="flex gap-2 text-sm leading-7 text-slate-700">
							<span class="font-bold text-emerald-700">✓</span><span>{lesson}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if d.mapRegions?.length}
			<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Peta wilayah (skema)</h2>
				<div class="mt-4">
					<DynastyTerritoryMap dynasty={d} />
				</div>
			</section>
		{/if}

		{#if d.adabNote}
			<section class="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 text-sm leading-7 text-slate-700">
				<strong>Catatan adab:</strong>
				{d.adabNote}
			</section>
		{/if}

		<nav class="grid gap-3 sm:grid-cols-2">
			{#if data.prev}
				<a
					href={`/dinasti/${data.prev.slug}`}
					class="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm hover:border-indigo-200"
				>
					<p class="text-xs text-slate-500">Sebelumnya</p>
					<p class="font-semibold text-indigo-900">{data.prev.name}</p>
				</a>
			{:else}
				<div></div>
			{/if}
			{#if data.next}
				<a
					href={`/dinasti/${data.next.slug}`}
					class="rounded-2xl border border-slate-200 bg-white p-4 text-right text-sm shadow-sm hover:border-indigo-200"
				>
					<p class="text-xs text-slate-500">Berikutnya</p>
					<p class="font-semibold text-indigo-900">{data.next.name}</p>
				</a>
			{/if}
		</nav>
	</div>
</div>
