<script lang="ts">
	import { tabiinFigures } from '$lib/data/tabiin';
	import { getLinkedSanadNames } from '$lib/data/sanad';

	const centers = Array.from(new Set(tabiinFigures.map((figure) => figure.center)));
</script>

<svelte:head>
	<title>Tabi'in - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-950 via-orange-900 to-rose-900 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-16 top-8 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-rose-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-amber-200/70">Generasi Tabi'in</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Murid para sahabat dan penguat fondasi ilmu</h1>
			<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
				Tabi'in adalah generasi yang bertemu sahabat Nabi dan belajar langsung dari mereka. Dari Madinah,
				Makkah, Kufah, hingga Basrah, mereka menyalurkan hadis, fiqih, tafsir, dan adab ke generasi sesudahnya.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Struktur sejarah</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-3">
			<div class="rounded-3xl bg-amber-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Posisi</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Generasi setelah sahabat dan sebelum tabi'ut tabi'in.</p>
			</div>
			<div class="rounded-3xl bg-orange-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">Pusat</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Madinah, Makkah, Kufah, Basrah, dan Yaman menjadi simpul utama.</p>
			</div>
			<div class="rounded-3xl bg-rose-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">Warisan</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Menjaga sanad, memperkuat fatwa, dan memulai pemetaan disiplin ilmu Islam.</p>
			</div>
		</div>
	</section>

	{#each centers as center}
		<section class="space-y-4">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pusat Ilmu</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">{center}</h2>
				</div>
				<p class="text-sm text-slate-500">
					{tabiinFigures.filter((figure) => figure.center === center).length} tokoh utama
				</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				{#each tabiinFigures.filter((figure) => figure.center === center) as figure}
					<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
								{figure.era}
							</span>
							<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
								{figure.focus}
							</span>
						</div>
						<h3 class="mt-4 text-2xl font-semibold text-slate-900">{figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-amber-700">{figure.role}</p>
						<p class="mt-4 text-sm leading-7 text-slate-600">{figure.summary}</p>

						<div class="mt-5 grid gap-4 md:grid-cols-2">
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Guru Sahabat</p>
								<div class="mt-3 flex flex-wrap gap-2">
									{#each getLinkedSanadNames(figure.teachers) as teacher}
										{#if teacher.href}
											<a href={teacher.href} class="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm transition hover:bg-amber-100 hover:text-amber-800">
												{teacher.name}
											</a>
										{:else}
											<span class="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
												{teacher.name}
											</span>
										{/if}
									{/each}
								</div>
							</div>
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Murid Utama</p>
								<div class="mt-3 flex flex-wrap gap-2">
									{#each getLinkedSanadNames(figure.students) as student}
										{#if student.href}
											<a href={student.href} class="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm transition hover:bg-amber-100 hover:text-amber-800">
												{student.name}
											</a>
										{:else}
											<span class="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
												{student.name}
											</span>
										{/if}
									{/each}
								</div>
							</div>
						</div>

						<a href={`/tokoh/${figure.slug}`} class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition hover:text-amber-800">
							Buka rantai sanad
							<span aria-hidden="true">></span>
						</a>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section class="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Kenapa generasi ini penting</h2>
		<p class="mt-4 text-sm leading-7 text-slate-700">
			Dalam sejarah Islam, tabi'in adalah generasi yang paling awal merapikan transfer ilmu setelah
			wafatnya para sahabat. Dari mereka lahir pusat-pusat fatwa lokal, jalur sanad hadis yang kuat,
			serta tradisi adab dan zuhud yang kemudian diwarisi generasi tabi'ut tabi'in dan para imam mazhab.
		</p>
	</section>
</div>
