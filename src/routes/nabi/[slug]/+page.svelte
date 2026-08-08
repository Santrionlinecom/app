<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const nabi = data.nabi;
	const list = [...data.list].sort((a, b) => a.order - b.order);
	const idx = list.findIndex((n) => n.slug === nabi.slug);
	const prev = idx > 0 ? list[idx - 1] : null;
	const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

	const colors = [
		'from-emerald-700 to-teal-700',
		'from-blue-700 to-cyan-700',
		'from-violet-700 to-purple-700',
		'from-amber-700 to-orange-700',
		'from-rose-700 to-pink-700',
		'from-indigo-700 to-blue-700',
		'from-teal-700 to-cyan-700',
		'from-green-700 to-emerald-700'
	];
	const gradient = colors[(nabi.order - 1) % colors.length];
</script>

<SeoHead
	title={`${nabi.name} — Kisah, Pelajaran & Dalil`}
	description={nabi.summary}
	keywords={`${nabi.name}, kisah nabi, sirah, ${nabi.slug}`}
	canonical={`/nabi/${nabi.slug}`}
/>

<div class="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 py-10">
	<div class="mx-auto max-w-4xl space-y-6 px-4">
		<a href="/nabi" class="inline-flex text-sm font-semibold text-emerald-700 hover:underline">← Daftar 25 Nabi</a>

		<header class={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${gradient} p-7 text-white shadow-xl md:p-10`}>
			<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<div class="flex flex-wrap items-center gap-3">
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold"
						>{nabi.order}</span
					>
					{#if nabi.ululAzmi}
						<span class="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-50"
							>Ulul Azmi</span
						>
					{/if}
				</div>
				<h1 class="mt-4 text-3xl font-black md:text-4xl">{nabi.name}</h1>
				{#if nabi.titles?.length}
					<p class="mt-2 text-sm font-medium text-white/85">{nabi.titles.join(' · ')}</p>
				{/if}
				<p class="mt-4 max-w-2xl text-base leading-8 text-white/90">{nabi.summary}</p>
			</div>
		</header>

		<div class="grid gap-4 md:grid-cols-2">
			<section class="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Informasi dasar</h2>
				<dl class="mt-4 space-y-3 text-sm text-slate-700">
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Urutan</dt>
						<dd>Nabi ke-{nabi.order}</dd>
					</div>
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Ayah</dt>
						<dd class="text-right">{nabi.father ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Istri</dt>
						<dd class="text-right">{nabi.spouse ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Anak</dt>
						<dd class="text-right">{nabi.children ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="font-semibold text-slate-500">Saudara</dt>
						<dd class="text-right">{nabi.siblings ?? '—'}</dd>
					</div>
				</dl>
			</section>

			<section class="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Konteks sejarah</h2>
				<dl class="mt-4 space-y-3 text-sm text-slate-700">
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Kaum</dt>
						<dd class="text-right">{nabi.tribe ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Penguasa/zaman</dt>
						<dd class="text-right">{nabi.ruler ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3 border-b border-slate-100 pb-2">
						<dt class="font-semibold text-slate-500">Era</dt>
						<dd class="text-right">{nabi.era ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="font-semibold text-slate-500">Usia/riwayat</dt>
						<dd class="text-right">{nabi.age ?? '—'}</dd>
					</div>
				</dl>
			</section>
		</div>

		{#if nabi.explainer}
			<section class="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 shadow-sm">
				<h2 class="text-lg font-bold text-slate-900">Inti keteladanan</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700 md:text-base">{nabi.explainer}</p>
			</section>
		{/if}

		{#if nabi.story}
			<section class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Kisah ringkas</h2>
				<p class="mt-4 text-sm leading-8 text-slate-700 md:text-base">{nabi.story}</p>
			</section>
		{/if}

		<section class="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">Poin penting</h2>
			<ul class="mt-4 space-y-3">
				{#each nabi.keyPoints as point}
					<li class="flex gap-3 text-sm leading-7 text-slate-700">
						<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>
						<span>{point}</span>
					</li>
				{/each}
			</ul>
		</section>

		{#if nabi.lessons?.length}
			<section class="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Pelajaran untuk santri</h2>
				<ul class="mt-4 space-y-3">
					{#each nabi.lessons as lesson}
						<li class="flex gap-3 text-sm leading-7 text-slate-700">
							<span class="font-bold text-teal-700">✓</span>
							<span>{lesson}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">Dalil Al-Qur’an</h2>
			<ul class="mt-4 space-y-2">
				{#each nabi.dalil as d}
					<li class="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">{d}</li>
				{/each}
			</ul>
			<p class="mt-4 text-xs leading-6 text-slate-500">
				Rujukan ringkas. Untuk tafsir mendalam: Ibn Katsir, Al-Qurthubi, dan jalur guru bersanad. Hindari
				israiliyyat yang bertentangan dengan akidah.
			</p>
		</section>

		<nav class="grid gap-3 sm:grid-cols-2">
			{#if prev}
				<a href={`/nabi/${prev.slug}`} class="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm hover:border-emerald-200">
					<p class="text-xs text-slate-500">Sebelumnya</p>
					<p class="font-semibold text-emerald-800">{prev.name}</p>
				</a>
			{:else}
				<div></div>
			{/if}
			{#if next}
				<a
					href={`/nabi/${next.slug}`}
					class="rounded-2xl border border-slate-200 bg-white p-4 text-right text-sm shadow-sm hover:border-emerald-200"
				>
					<p class="text-xs text-slate-500">Berikutnya</p>
					<p class="font-semibold text-emerald-800">{next.name}</p>
				</a>
			{/if}
		</nav>
	</div>
</div>
