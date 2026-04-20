<script lang="ts">
	import { getCuratedKitabBySlug } from '$lib/data/kitab-curated';

	const material = getCuratedKitabBySlug('bahasa-arab-dasar-1');

	if (!material) {
		throw new Error('Materi bahasa Arab dasar tidak ditemukan.');
	}

	const formatDate = (value: number) =>
		new Date(value).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
</script>

<svelte:head>
	<title>{material.title} - Perpustakaan Kitab</title>
	<meta name="description" content={material.summary} />
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_38%),linear-gradient(135deg,_#111827_0%,_#1f2937_45%,_#172554_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl"></div>
		<div class="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-300/10 blur-3xl"></div>

		<div class="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
			<div class="max-w-4xl">
				<a href="/kitab" class="text-sm text-amber-200 hover:text-white">&larr; Kembali ke Perpustakaan Kitab</a>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
						Materi Native
					</span>
					<span class="rounded-full border border-amber-300/20 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
						{material.level}
					</span>
				</div>
				<h1 class="mt-4 text-3xl font-bold md:text-5xl">{material.title}</h1>
				<p class="mt-4 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
					{material.description}
				</p>

				<div class="mt-6 flex flex-wrap gap-3">
					<a href="#modul-belajar" class="btn border-none bg-white text-slate-900 hover:bg-amber-50">
						Mulai Belajar
					</a>
					<a
						href={material.sourceUrl}
						target="_blank"
						rel="noreferrer"
						class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10"
					>
						Buka PDF Asli
					</a>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Level</p>
					<p class="mt-3 text-2xl font-semibold">{material.level}</p>
					<p class="mt-1 text-xs text-white/65">Dirancang untuk santri pemula.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Jalur Belajar</p>
					<p class="mt-3 text-2xl font-semibold">{material.duration}</p>
					<p class="mt-1 text-xs text-white/65">Modul singkat, bertahap, dan mudah dimurajaah.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:col-span-2">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Sumber Adaptasi</p>
					<p class="mt-3 text-sm leading-7 text-white/80">{material.sourceNote}</p>
				</div>
			</div>
		</div>
	</section>

	<section class="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Target Pembelajaran</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Apa yang akan dikuasai santri?</h2>
			<div class="mt-6 grid gap-3">
				{#each material.objectives as objective}
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
						{objective}
					</div>
				{/each}
			</div>
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Info Materi</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Format ala SantriOnline</h2>
			<div class="mt-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Update</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{formatDate(material.updatedAt)}</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Total Modul</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{material.totalModules} modul</p>
				</div>
			</div>

			<div class="mt-4 rounded-[1.5rem] bg-[linear-gradient(135deg,_#fff7ed_0%,_#fffbeb_50%,_#ecfdf5_100%)] p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Tag Materi</p>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each material.tags as tag}
						<span class="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
							{tag}
						</span>
					{/each}
				</div>
			</div>
		</article>
	</section>

	<section id="modul-belajar" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Jalur Belajar</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">8 modul bahasa Arab dasar</h2>
			</div>
			<p class="text-sm text-slate-500">Baca berurutan, lalu pakai bagian latihan untuk murajaah mandiri.</p>
		</div>

		<div class="space-y-5">
			{#each material.modules as module, index}
				<article class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
					<div class="grid gap-0 xl:grid-cols-[0.32fr_0.68fr]">
						<div class="bg-[linear-gradient(165deg,_#f8fafc_0%,_#f1f5f9_38%,_#ecfccb_100%)] p-6">
							<div class="flex items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
									{index + 1}
								</div>
								<div>
									<p class="text-xs uppercase tracking-[0.24em] text-slate-500">Fokus</p>
									<p class="mt-1 text-sm font-semibold text-slate-900">{module.focus}</p>
								</div>
							</div>
							<h3 class="mt-5 text-2xl font-semibold text-slate-900">{module.title}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-600">{module.overview}</p>
						</div>

						<div class="space-y-5 p-6">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Pokok Materi</p>
								<div class="mt-3 grid gap-3 md:grid-cols-2">
									{#each module.points as point}
										<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
											{point}
										</div>
									{/each}
								</div>
							</div>

							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Contoh Kalimat</p>
								<div class="mt-3 grid gap-3">
									{#each module.examples as example}
										<div class="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
											<div class="text-right text-2xl leading-loose text-slate-900" dir="rtl">
												{example.arabic}
											</div>
											<p class="mt-2 text-sm font-semibold text-emerald-700">{example.translit}</p>
											<p class="mt-1 text-sm leading-7 text-slate-600">{example.meaning}</p>
										</div>
									{/each}
								</div>
							</div>

							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Latihan Ringkas</p>
								<div class="mt-3 grid gap-3 md:grid-cols-3">
									{#each module.practice as item}
										<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
											{item}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Glossarium</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Istilah yang perlu akrab di telinga</h2>
			<div class="mt-6 grid gap-3 md:grid-cols-2">
				{#each material.glossary as item}
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-sm font-semibold text-slate-900">{item.term}</p>
						<p class="mt-2 text-sm leading-7 text-slate-600">{item.meaning}</p>
					</div>
				{/each}
			</div>
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Sumber Asli</p>
					<h2 class="mt-3 text-2xl font-semibold text-slate-900">PDF rujukan untuk murajaah</h2>
				</div>
				<a
					href={material.sourceUrl}
					target="_blank"
					rel="noreferrer"
					class="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
				>
					Buka di tab baru
				</a>
			</div>

			<p class="mt-3 text-sm leading-7 text-slate-600">
				Materi di halaman ini adalah adaptasi web-native. Jika ingin mengecek urutan bab dan panduan asal,
				gunakan viewer PDF di bawah ini.
			</p>

			<div class="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
				<iframe
					src={material.sourceUrl}
					title={`PDF ${material.title}`}
					class="h-[70vh] min-h-[620px] w-full bg-white"
					loading="lazy"
				></iframe>
			</div>
		</article>
	</section>
</div>
