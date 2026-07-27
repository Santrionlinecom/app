<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Breadcrumb from '$lib/components/seo/Breadcrumb.svelte';
	import SchemaOrg from '$lib/components/seo/SchemaOrg.svelte';
	import InternalLinks from '$lib/components/seo/InternalLinks.svelte';
	import DynastyTerritoryMap from '$lib/components/DynastyTerritoryMap.svelte';
	import {
		dynastiesByStart,
		dynastyAdabNotes,
		dynastyPhases,
		islamicDynasties
	} from '$lib/data/dinasti';

	const orderedDynasties = dynastiesByStart();
	const nusantara = orderedDynasties.filter((d) => d.type.includes('Nusantara'));
	const classic = orderedDynasties.filter((d) => !d.type.includes('Nusantara'));
</script>

<SeoHead
	title="Dinasti & Daulah Islam — Kronologi, Warisan & Nusantara"
	description="Peta daulah dan dinasti Islam pasca-Khulafaur Rasyidin: Umayyah, Abbasiyah, Fatimiyah, Andalus, Seljuk, Ayyubiyah, Mamluk, Utsmani, Mughal, hingga Pasai, Malaka, Demak, Aceh, dan Mataram."
	keywords="daulah islam, dinasti islam, bani umayyah, abbasiyah, fatimiyah, utsmani, mamluk, demak, aceh, sejarah islam, kekhalifahan"
	canonical="/dinasti"
/>

<SchemaOrg
	type="breadcrumb"
	data={{
		breadcrumbs: [
			{ name: 'Beranda', url: '/' },
			{ name: 'Dinasti & Daulah Islam', url: '/dinasti' }
		]
	}}
/>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white py-10 md:py-12">
	<div class="mx-auto max-w-6xl space-y-8 px-4">
		<Breadcrumb items={[{ name: 'Beranda', url: '/' }, { name: 'Dinasti & Daulah Islam', url: '/dinasti' }]} />

		<header
			class="relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950 px-6 py-10 text-white shadow-xl md:px-10"
		>
			<div class="absolute -left-20 top-10 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-sky-200/70">Sejarah politik umat</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Dinasti & Daulah Islam</h1>
				<p class="mt-4 text-sm leading-7 text-white/80 md:text-base">
					Setelah Khulafaur Rasyidin (661 M), politik Islam berkembang ke banyak dinasti dan daulah—
					sebagian menyambung, sebagian paralel. Disusun kronologis agar mudah dibaca, dilengkapi warisan,
					tokoh, dan jejak Nusantara.
				</p>
				<div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
					<span class="rounded-full bg-white/15 px-3 py-1.5">{islamicDynasties.length} entri</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">{classic.length} klasik/global</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">{nusantara.length} Nusantara</span>
				</div>
			</div>
		</header>

		<section class="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Istilah</p>
			<h2 class="mt-2 text-2xl font-bold text-slate-900">Daulah dan Dinasti dalam Sejarah Islam</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Dalam literatur sejarah Islam, kata <strong>daulah</strong> (دولة) merujuk pada periode kekuasaan
				atau dinasti tertentu—seperti Daulah Umayyah, Daulah Abbasiyah, dan Daulah Utsmaniyyah. Halaman ini
				menyajikan rentang daulah dan dinasti Muslim secara kronologis, dari pusat khilafah hingga kesultanan
				Nusantara, dengan sudut pandang Ahlus Sunnah wal Jamaah.
			</p>
		</section>

		<section class="grid gap-4 md:grid-cols-2">
			<article class="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Titik awal</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Khulafaur Rasyidin</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					632–661 M / 11–41 H. Patokan sebelum fase dinasti dan daulah. Lanjut pelajari di
					<a href="/sahabat" class="font-semibold text-indigo-700 hover:underline">halaman Sahabat</a>.
				</p>
			</article>
			<article class="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cara baca</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Sejarah Islam sering bercabang: Abbasiyah, Umayyah Andalus, dan Fatimiyah bisa hidup bersamaan.
					Halaman ini memetakan berdirinya dinasti dan daulah berpengaruh, bukan memaksa satu rantai tanpa cabang.
				</p>
			</article>
		</section>

		<section class="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Fase besar</h2>
			<div class="mt-4 grid gap-3">
				{#each dynastyPhases as phase}
					<article class="grid gap-2 rounded-2xl border border-sky-50 bg-sky-50/40 p-4 md:grid-cols-[9rem_1fr]">
						<p class="text-xs font-bold uppercase tracking-wide text-sky-800">{phase.period}</p>
						<div>
							<h3 class="font-bold text-slate-900">{phase.title}</h3>
							<p class="mt-1 text-sm leading-7 text-slate-700">{phase.desc}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="space-y-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Kronologi</p>
				<h2 class="mt-1 text-2xl font-bold text-slate-900">Dinasti & kekhalifahan utama</h2>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				{#each classic as dynasty}
					<a
						href={`/dinasti/${dynasty.slug}`}
						class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
					>
						<div class="flex flex-wrap gap-2">
							<span
								class="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-800"
								>{dynasty.type}</span
							>
							<span
								class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
								>{dynasty.periodCE}</span
							>
						</div>
						<h3 class="mt-3 text-xl font-bold text-slate-900">{dynasty.name}</h3>
						<p class="mt-1 text-xs text-slate-500">{dynasty.capital} · {dynasty.periodAH}</p>
						<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{dynasty.summary}</p>
						<p class="mt-4 text-sm font-semibold text-indigo-700">Baca lengkap →</p>
					</a>
				{/each}
			</div>
		</section>

		<section class="space-y-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Nusantara</p>
				<h2 class="mt-1 text-2xl font-bold text-slate-900">Kesultanan di kepulauan</h2>
				<p class="mt-2 text-sm text-slate-600">
					Pelengkap peta global: islamisasi pesisir, bandar, dan politik Jawa–Sumatra.
				</p>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each nusantara as dynasty}
					<a
						href={`/dinasti/${dynasty.slug}`}
						class="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
					>
						<span
							class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"
							>{dynasty.periodCE}</span
						>
						<h3 class="mt-3 text-lg font-bold text-slate-900">{dynasty.name}</h3>
						<p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{dynasty.summary}</p>
						<p class="mt-3 text-sm font-semibold text-emerald-700">Detail →</p>
					</a>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">Cuplikan peta wilayah (dinasti klasik)</h2>
			<p class="mt-2 text-sm text-slate-600">Buka detail untuk peta interaktif per dinasti.</p>
			<div class="mt-4 grid gap-4 lg:grid-cols-2">
				{#each classic.slice(0, 2) as dynasty}
					<div class="rounded-2xl border border-white bg-white p-4 shadow-sm">
						<p class="font-semibold text-slate-900">{dynasty.name}</p>
						<div class="mt-3">
							<DynastyTerritoryMap {dynasty} />
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Adab membaca sejarah dinasti</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each dynastyAdabNotes as note}
					<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{note}</div>
				{/each}
			</div>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/sahabat" class="btn border-none bg-indigo-800 text-white hover:bg-indigo-900">Sahabat</a>
				<a href="/tabiin" class="btn btn-outline border-indigo-200 text-indigo-900">Tabi’in</a>
				<a href="/walisongo" class="btn btn-ghost text-slate-700">Walisongo</a>
			</div>
		</section>

		<InternalLinks currentSlug="/dinasti" category="Jelajahi SantriOnline" relatedPosts={[]} />
	</div>
</div>
