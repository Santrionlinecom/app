<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Printer from '@lucide/svelte/icons/printer';
	import Search from '@lucide/svelte/icons/search';
	import type { PageData } from './$types';
	import { designCategories } from '$lib/data/desain';

	export let data: PageData;
	const template = data.template;
	const printUrl = `/desain/cetak?template=${template.slug}`;
</script>

<svelte:head>
	<title>{template.title} - Desain SantriOnline</title>
	<meta name="description" content={template.description} />
	<meta name="keywords" content={template.keywords.join(', ')} />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white">
	<section class={`bg-gradient-to-br ${template.palette}`}>
		<div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
			<div>
				<a href="/desain" class="text-sm font-bold text-white/80 hover:text-white">← Kembali ke katalog desain</a>
				<p class="mt-8 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white backdrop-blur">{designCategories[template.category].label} · {template.eventMonth}</p>
				<h1 class="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{template.title}</h1>
				<p class="mt-5 text-lg leading-8 text-white/90">{template.description}</p>
				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a href={printUrl} class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 shadow-xl">
						<Printer class="h-5 w-5" /> {template.cta}
					</a>
					<a href="#seo" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-6 py-4 font-bold text-white hover:bg-white/10">
						<Search class="h-5 w-5" /> Keyword SEO
					</a>
				</div>
			</div>
			<div class="rounded-[2rem] bg-white/95 p-5 text-slate-950 shadow-2xl">
				<div class="rounded-[1.5rem] border-4 border-slate-950/10 p-8 text-center">
					<p class="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">{template.formats[0]} siap edit</p>
					<h2 class="mt-6 text-4xl font-black leading-tight">{template.previewLines[0]}</h2>
					<p class="mx-auto mt-5 max-w-lg text-lg font-semibold text-slate-600">{template.previewLines[1]}</p>
					<div class="mt-8 rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white">{template.previewLines[2]}</div>
					<p class="mt-6 text-sm font-bold text-slate-500">Aksen visual: {template.accent}</p>
				</div>
			</div>
		</div>
	</section>

	<section class="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
		<div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
			<p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">Format</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each template.formats as format}<span class="rounded-full bg-white/10 px-3 py-2 text-sm font-bold">{format}</span>{/each}
			</div>
		</div>
		<div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
			<p class="text-sm font-black uppercase tracking-[0.25em] text-sky-300">Ukuran cetak</p>
			<ul class="mt-4 space-y-2 text-sm text-slate-200">{#each template.printSizes as size}<li>• {size}</li>{/each}</ul>
		</div>
		<div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
			<p class="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">Target</p>
			<ul class="mt-4 space-y-2 text-sm text-slate-200">{#each template.audience as item}<li>• {item}</li>{/each}</ul>
		</div>
	</section>

	<section class="bg-white py-14 text-slate-950">
		<div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
			<div>
				<p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">Field yang bisa diedit</p>
				<h2 class="mt-3 text-3xl font-black">Siapkan data ini sebelum cetak</h2>
				<ul class="mt-6 grid gap-3 sm:grid-cols-2">
					{#each template.editableFields as field}<li class="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold">{field}</li>{/each}
				</ul>
			</div>
			<div id="seo">
				<p class="text-sm font-black uppercase tracking-[0.25em] text-sky-700">Keyword SEO</p>
				<h2 class="mt-3 text-3xl font-black">Halaman ini ditargetkan untuk Google Search dan Google Images</h2>
				<div class="mt-6 flex flex-wrap gap-2">
					{#each template.keywords as keyword}<span class="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">{keyword}</span>{/each}
				</div>
				<a href={printUrl} class="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white">
					Pesan edit / cetak desain ini <ArrowRight class="h-5 w-5" />
				</a>
			</div>
		</div>
	</section>
</div>
