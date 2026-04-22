<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const { figure, ancestors, descendants, dynasties, peers, wahyuPrelude } = data;

	const generationStyles: Record<
		string,
		{
			hero: string;
			badge: string;
			panel: string;
		}
	> = {
		rasul: {
			hero: 'from-emerald-700 via-teal-700 to-cyan-700',
			badge: 'bg-emerald-100 text-emerald-800',
			panel: 'border-emerald-200 bg-emerald-50/60'
		},
		sahabat: {
			hero: 'from-amber-700 via-orange-700 to-yellow-700',
			badge: 'bg-amber-100 text-amber-800',
			panel: 'border-amber-200 bg-amber-50/70'
		},
		tabiin: {
			hero: 'from-rose-700 via-orange-700 to-amber-700',
			badge: 'bg-rose-100 text-rose-800',
			panel: 'border-rose-200 bg-rose-50/70'
		},
		'tabiut-tabiin': {
			hero: 'from-teal-800 via-cyan-800 to-sky-800',
			badge: 'bg-cyan-100 text-cyan-800',
			panel: 'border-cyan-200 bg-cyan-50/70'
		},
		ulama: {
			hero: 'from-indigo-800 via-sky-800 to-teal-800',
			badge: 'bg-indigo-100 text-indigo-800',
			panel: 'border-indigo-200 bg-indigo-50/70'
		}
	};

	const tone = generationStyles[figure.generation] ?? generationStyles.ulama;
</script>

<svelte:head>
	<title>{figure.name} - Rantai Sanad Tokoh</title>
</svelte:head>

<div class="space-y-8">
	<section class={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${tone.hero} px-6 py-10 text-white shadow-xl md:px-8`}>
		<div class="absolute -left-20 top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
		<div class="relative">
			<a href="/tokoh" class="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white">
				<span aria-hidden="true">←</span>
				Kembali ke peta sanad
			</a>
			<div class="mt-6 flex flex-wrap items-center gap-2">
				<span class={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${tone.badge}`}>
					{figure.generationLabel}
				</span>
				{#if figure.cluster}
					<span class="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">
						{figure.cluster}
					</span>
				{/if}
				<span class="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">
					{figure.periodLabel}
				</span>
			</div>
			<h1 class="mt-4 text-3xl font-bold md:text-5xl">{figure.name}</h1>
			<p class="mt-3 text-lg font-semibold text-white/90">{figure.title}</p>
			<p class="mt-4 max-w-3xl text-sm leading-7 text-white/80 md:text-base">{figure.summary}</p>

			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<div class="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Wilayah</p>
					<p class="mt-3 text-sm leading-7 text-white">{figure.region}</p>
				</div>
				<div class="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Fokus</p>
					<p class="mt-3 text-sm leading-7 text-white">{figure.focus}</p>
				</div>
				<div class="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Backlink Sanad</p>
					<p class="mt-3 text-sm leading-7 text-white">
						{ancestors.length} jalur sebelumnya, {descendants.length} jalur sesudahnya
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class={`rounded-[1.75rem] border p-6 shadow-sm ${tone.panel}`}>
		<div class="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Ringkasan Sejarah</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Posisi tokoh dalam rantai sanad</h2>
				<p class="mt-4 text-sm leading-7 text-slate-700">{figure.detail}</p>
			</div>
			<div class="rounded-3xl border border-white/70 bg-white p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigasi Cepat</p>
				<div class="mt-4 space-y-3 text-sm">
					<a href="#jalur-sebelum" class="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 transition hover:bg-slate-100">
						Lihat jalur sebelum
					</a>
					<a href="#jalur-sesudah" class="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 transition hover:bg-slate-100">
						Lihat jalur sesudah
					</a>
					<a href="#konteks" class="block rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 transition hover:bg-slate-100">
						Lihat konteks dinasti dan politik
					</a>
					{#if figure.legacyPath}
						<a href={figure.legacyPath} class="block rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800">
							Buka halaman tematik lama
						</a>
					{/if}
				</div>
			</div>
		</div>
	</section>

	{#if wahyuPrelude}
		<section class="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Pembuka Wahyu</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">{wahyuPrelude.title}</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700">{wahyuPrelude.summary}</p>

			<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each wahyuPrelude.stages as stage}
					{#if stage.href}
						<a href={stage.href} class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-1 hover:shadow-md">
							<h3 class="text-lg font-semibold text-slate-900">{stage.label}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-700">{stage.desc}</p>
						</a>
					{:else}
						<div class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
							<h3 class="text-lg font-semibold text-slate-900">{stage.label}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-700">{stage.desc}</p>
						</div>
					{/if}
				{/each}
			</div>

			<div class="mt-5 rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Rujukan Ringkas</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">{wahyuPrelude.references.join(' · ')}</p>
			</div>
		</section>
	{/if}

	<section id="jalur-sebelum" class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Jalur Sebelum</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Guru, sumber, atau jalur yang mendahului</h2>
			</div>
			<p class="text-sm text-slate-500">{ancestors.length} tautan</p>
		</div>

		{#if ancestors.length}
			<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each ancestors as item}
					<a href={`/tokoh/${item.figure.slug}`} class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.figure.generationLabel}</p>
						<h3 class="mt-3 text-lg font-semibold text-slate-900">{item.figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-slate-700">{item.figure.periodLabel}</p>
						<p class="mt-3 text-sm leading-7 text-slate-600">{item.relation}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
				<p class="text-sm leading-7 text-slate-700">
					Halaman ini menjadi titik awal yang ditampilkan di rantai sanad. Untuk Rasulullah SAW, pembuka jalurnya dijelaskan pada bagian wahyu di atas.
				</p>
			</div>
		{/if}
	</section>

	<section id="jalur-sesudah" class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Jalur Sesudah</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Tokoh yang tersambung atau meneruskan</h2>
			</div>
			<p class="text-sm text-slate-500">{descendants.length} tautan</p>
		</div>

		{#if descendants.length}
			<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each descendants as item}
					<a href={`/tokoh/${item.figure.slug}`} class="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.figure.generationLabel}</p>
						<h3 class="mt-3 text-lg font-semibold text-slate-900">{item.figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-slate-700">{item.figure.periodLabel}</p>
						<p class="mt-3 text-sm leading-7 text-slate-600">{item.relation}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
				<p class="text-sm leading-7 text-slate-700">
					Belum ada tokoh lain di graph ini yang dijadikan penerus langsung untuk node ini. Struktur bisa diperluas kapan pun jika ingin menambah ulama atau sanad regional lain.
				</p>
			</div>
		{/if}
	</section>

	<section id="konteks" class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Konteks Sejarah</p>
		<h2 class="mt-3 text-2xl font-semibold text-slate-900">Dinasti dan situasi politik pada masa hidupnya</h2>

		{#if dynasties.length}
			<div class="mt-5 grid gap-4 lg:grid-cols-2">
				{#each dynasties as dynasty}
					<a href={`/dinasti#${dynasty.slug}`} class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700">
								{dynasty.type}
							</span>
							<span class="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
								{dynasty.periodCE}
							</span>
						</div>
						<h3 class="mt-4 text-xl font-semibold text-slate-900">{dynasty.name}</h3>
						<p class="mt-3 text-sm leading-7 text-slate-600">{dynasty.summary}</p>
					</a>
				{/each}
			</div>
		{/if}

		<div class="mt-5 grid gap-4 md:grid-cols-2">
			{#each figure.politicalContexts as context}
				{#if context.href}
					<a href={context.href} class="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
						<h3 class="text-lg font-semibold text-slate-900">{context.label}</h3>
						<p class="mt-3 text-sm leading-7 text-slate-600">{context.note}</p>
					</a>
				{:else}
					<div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
						<h3 class="text-lg font-semibold text-slate-900">{context.label}</h3>
						<p class="mt-3 text-sm leading-7 text-slate-600">{context.note}</p>
					</div>
				{/if}
			{/each}
		</div>
	</section>

	{#if peers.length}
		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Segenerasi</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">
				{figure.cluster ? `Tokoh lain dalam klaster ${figure.cluster}` : 'Tokoh lain pada lapis sanad yang sama'}
			</h2>
			<div class="mt-5 flex flex-wrap gap-3">
				{#each peers as peer}
					<a href={`/tokoh/${peer.slug}`} class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">
						{peer.name}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
