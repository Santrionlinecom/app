<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Globe2 from '@lucide/svelte/icons/globe-2';
	import Printer from '@lucide/svelte/icons/printer';
	import Search from '@lucide/svelte/icons/search';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { annualDesignMoments, designCategories, designTemplates, globalInstitutionNeeds } from '$lib/data/desain';

	const categoryEntries = Object.entries(designCategories);
	const priorityTemplates = designTemplates.slice(0, 10);
</script>

<svelte:head>
	<title>Desain SantriOnline - Template Event Islam, Sekolah, dan Lembaga Muslim Siap Cetak</title>
	<meta name="description" content="Katalog template desain SantriOnline untuk banner Maulid Nabi, Isra Miraj, Ramadhan, Hari Santri, PPDB, MPLS, wisuda tahfidz, sertifikat TPQ, dan kebutuhan lembaga Islam global." />
	<meta name="keywords" content="template desain islam, banner maulid nabi, poster isra miraj, desain hari santri, sertifikat tpq, banner wisuda tahfidz, desain ppdb sekolah islam, cetak banner islami" />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white">
	<section class="relative overflow-hidden border-b border-white/10">
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.28),_transparent_35%)]"></div>
		<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
			<div class="max-w-4xl">
				<p class="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100">
					<Sparkles class="h-4 w-4" /> SEO template + funnel cetak
				</p>
				<h1 class="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
					Desain siap pakai untuk event Islam, sekolah, dan lembaga Muslim.
				</h1>
				<p class="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
					SantriOnline menyediakan referensi desain yang bisa diedit dan diarahkan ke layanan cetak: banner PHBI, poster sekolah, sertifikat TPQ, landing page donasi, sampai konten Islamic center global.
				</p>
				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a href="#template" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 shadow-xl shadow-emerald-500/20">
						Lihat template <ArrowRight class="h-5 w-5" />
					</a>
					<a href="/desain/cetak" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-4 font-bold text-white hover:bg-white/10">
						<Printer class="h-5 w-5" /> Cetak file desain
					</a>
				</div>
			</div>
			<div class="mt-12 grid gap-4 md:grid-cols-3">
				<div class="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
					<Search class="h-8 w-8 text-emerald-300" />
					<p class="mt-4 text-3xl font-black">SEO</p>
					<p class="mt-2 text-sm text-slate-300">Halaman detail dibuat dengan keyword Google Search dan Google Images.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
					<CalendarDays class="h-8 w-8 text-sky-300" />
					<p class="mt-4 text-3xl font-black">12 bulan</p>
					<p class="mt-2 text-sm text-slate-300">Kalender event Islam, sekolah, TPQ, pesantren, dan momen cetak rutin.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
					<Globe2 class="h-8 w-8 text-yellow-300" />
					<p class="mt-4 text-3xl font-black">Global</p>
					<p class="mt-2 text-sm text-slate-300">Riset kebutuhan masjid, madrasah, zakat/wakaf, Islamic center, dan komunitas diaspora.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" id="template">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<p class="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">Template prioritas</p>
				<h2 class="mt-3 text-3xl font-black sm:text-4xl">Mulai dari event yang paling sering dicari dan dicetak</h2>
			</div>
			<a href="/desain/cetak" class="text-sm font-bold text-emerald-300 hover:text-emerald-200">Langsung ke funnel cetak →</a>
		</div>
		<div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
			{#each priorityTemplates as template}
				<a href={`/desain/${template.slug}`} class="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-white/[0.09]">
					<div class={`bg-gradient-to-br ${template.palette} p-6`}>
						<div class="rounded-2xl bg-white/90 p-5 text-slate-950 shadow-2xl">
							<p class="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">{template.formats[0]}</p>
							<h3 class="mt-3 text-2xl font-black leading-tight">{template.previewLines[0]}</h3>
							<p class="mt-3 text-sm font-semibold text-slate-600">{template.previewLines[1]}</p>
							<p class="mt-6 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">{template.previewLines[2]}</p>
						</div>
					</div>
					<div class="p-6">
						<p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{designCategories[template.category].label} · {template.eventMonth}</p>
						<h3 class="mt-2 text-xl font-black text-white group-hover:text-emerald-200">{template.shortTitle}</h3>
						<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{template.description}</p>
						<div class="mt-5 flex flex-wrap gap-2">
							{#each template.formats as format}
								<span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{format}</span>
							{/each}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section class="bg-white py-14 text-slate-950">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<p class="text-sm font-black uppercase tracking-[0.3em] text-emerald-700">Kategori SEO</p>
			<h2 class="mt-3 text-3xl font-black">Peta kategori desain SantriOnline</h2>
			<div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each categoryEntries as [key, category]}
					<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
						<p class="text-xl font-black">{category.label}</p>
						<p class="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
						<p class="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">/{key}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
			<div>
				<p class="text-sm font-black uppercase tracking-[0.3em] text-sky-300">Kalender 12 bulan</p>
				<h2 class="mt-3 text-3xl font-black">Event besar yang berulang dan punya potensi cetak</h2>
				<p class="mt-4 leading-7 text-slate-300">Strateginya: buat template sebelum musim pencarian naik, index di Google, lalu arahkan ke halaman cetak.</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each annualDesignMoments as moment}
					<div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
						<p class="font-black text-emerald-200">{moment.month}</p>
						<ul class="mt-3 space-y-2 text-sm text-slate-300">
							{#each moment.items as item}
								<li>• {item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="bg-emerald-950/60 py-14">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<p class="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">Riset kebutuhan global</p>
			<h2 class="mt-3 max-w-4xl text-3xl font-black">SantriOnline tidak hanya desain event lokal, tapi juga bisa menyediakan kebutuhan lembaga Islam seluruh dunia.</h2>
			<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each globalInstitutionNeeds as need}
					<div class="rounded-3xl border border-emerald-200/15 bg-slate-950/60 p-6">
						<p class="text-lg font-black text-white">{need.title}</p>
						<p class="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">{need.segment}</p>
						<p class="mt-4 text-sm leading-6 text-slate-300">{need.evidence}</p>
						<ul class="mt-4 space-y-2 text-sm text-slate-200">
							{#each need.solutions as solution}
								<li>✓ {solution}</li>
							{/each}
						</ul>
						<p class="mt-4 rounded-2xl bg-emerald-400/10 p-3 text-sm font-bold text-emerald-100">{need.monetization}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
