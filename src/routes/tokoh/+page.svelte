<script lang="ts">
	import {
		getSanadFiguresByGeneration,
		sanadGenerations,
		sanadMilestones,
		type SanadFigure,
		wahyuPrelude
	} from '$lib/data/sanad';

	type ClusterGroup = {
		label: string;
		figures: SanadFigure[];
	};

	const clusterOrder = [
		'Imam Mazhab dan Turats Klasik',
		'Perawi dan Musnid Penghubung',
		'Walisongo dan Dakwah Jawa',
		'Hadramaut dan Jejaring Alawiyyin',
		'Ulama Nusantara dan Pesantren'
	];

	function getClusterRank(label: string) {
		const index = clusterOrder.indexOf(label);
		return index === -1 ? clusterOrder.length : index;
	}

	function buildClusterGroups(figures: SanadFigure[], fallbackLabel: string): ClusterGroup[] {
		const grouped = new Map<string, SanadFigure[]>();

		for (const figure of figures) {
			const key = figure.cluster ?? fallbackLabel;
			const bucket = grouped.get(key) ?? [];

			bucket.push(figure);
			grouped.set(key, bucket);
		}

		return [...grouped.entries()]
			.sort((a, b) => {
				const rankDiff = getClusterRank(a[0]) - getClusterRank(b[0]);

				if (rankDiff !== 0) {
					return rankDiff;
				}

				return (a[1][0]?.order ?? 0) - (b[1][0]?.order ?? 0);
			})
			.map(([label, figures]) => ({ label, figures }));
	}

	const groupedFigures = sanadGenerations.map((section) => {
		const figures = getSanadFiguresByGeneration(section.key);

		return {
			...section,
			figures,
			clusters: buildClusterGroups(figures, section.label)
		};
	});
</script>

<svelte:head>
	<title>Rantai Sanad Tokoh Islam - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-16 top-10 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-sky-200/70">Tokoh Islam</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Rantai sanad dari wahyu sampai ulama Nusantara</h1>
			<p class="mt-4 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
				Halaman ini sekarang difokuskan sebagai graph sanad: dari Allah melalui Jibril kepada
				Rasulullah SAW, lalu ke sahabat, tabi`in, tabi`ut tabi`in, imam mazhab, Walisongo,
				habaib Hadramaut, dan ulama pesantren Nusantara. Setiap tokoh utama bisa dibuka
				sebagai node yang punya tautan balik ke jalur sebelumnya dan sesudahnya.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Pembuka Wahyu</p>
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

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sejarah Singkat</p>
		<h2 class="mt-3 text-2xl font-semibold text-slate-900">Bagaimana Islam tersebar dalam rantai ini</h2>
		<div class="mt-5 grid gap-4 lg:grid-cols-3">
			{#each sanadMilestones as step}
				<article class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{step.year}</p>
					<h3 class="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-700">{step.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	{#each groupedFigures as section}
		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Lapisan Sanad</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">{section.label}</h2>
				</div>
				<p class="text-sm text-slate-500">{section.figures.length} tokoh inti</p>
			</div>

			{#each section.clusters as cluster, clusterIndex}
				<div class={clusterIndex === 0 ? 'mt-5' : 'mt-8'}>
					{#if section.clusters.length > 1}
						<div class="mb-4 flex items-center justify-between gap-3">
							<h3 class="text-lg font-semibold text-slate-900">{cluster.label}</h3>
							<p class="text-sm text-slate-500">{cluster.figures.length} tokoh</p>
						</div>
					{/if}

					<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{#each cluster.figures as figure}
							<a href={`/tokoh/${figure.slug}`} class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
								<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{figure.periodLabel}</p>
								<h3 class="mt-3 text-xl font-semibold text-slate-900">{figure.name}</h3>
								<p class="mt-2 text-sm font-medium text-slate-700">{figure.title}</p>
								<p class="mt-3 text-sm leading-7 text-slate-600">{figure.summary}</p>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</section>
	{/each}

	<section class="rounded-[1.75rem] border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Catatan struktur</h2>
		<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
			<p>
				Graph ini disusun sebagai rantai sanad inti, bukan daftar semua tokoh Islam yang pernah hidup.
				Fokusnya adalah simpul-simpul besar peralihan ilmu dari Rasulullah ke generasi sesudahnya,
				hingga masuk ke jaringan Walisongo, habaib Hadramaut, dan pesantren Nusantara.
			</p>
			<p>
				Untuk konteks kenabian yang lebih luas di luar jalur sanad Rasulullah SAW, halaman
				<a href="/nabi" class="font-semibold text-sky-700 hover:text-sky-800"> Nabi & Rasul</a>
				tetap tersedia. Untuk konteks kekuasaan, buka juga halaman
				<a href="/dinasti" class="font-semibold text-sky-700 hover:text-sky-800"> Dinasti Islam</a>.
			</p>
		</div>
	</section>
</div>
