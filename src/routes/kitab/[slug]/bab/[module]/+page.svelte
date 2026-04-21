<script lang="ts">
	import type { PageData } from './$types';
	import {
		getCuratedKitabModuleHref
	} from '$lib/data/kitab-curated';
	import {
		getKitabCategoryLabel,
		getKitabCategoryToneClass
	} from '$lib/data/kitab-categories';
	import { toKitabDownloadUrl } from '$lib/kitab';

	export let data: PageData;

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const formatDate = (value: number | null | undefined) =>
		value
			? new Date(value).toLocaleDateString('id-ID', {
					day: '2-digit',
					month: 'long',
					year: 'numeric'
				})
			: '-';

	const kitabCategoryLabel = (value?: string | null) => getKitabCategoryLabel(value);
	const kitabCategoryTone = (value?: string | null) => getKitabCategoryToneClass(value);
	let readingMode: 'santri' | 'lengkap' = 'santri';

	$: curatedItem = data.curatedItem;
	$: moduleItem = data.moduleItem;
	$: moduleNumber = data.moduleNumber;
	$: previousModule = data.previousModule;
	$: nextModule = data.nextModule;
	$: relatedChapters = Array.isArray(data.relatedChapters) ? data.relatedChapters : [];
	$: sourceType = data.item?.sourceType ?? curatedItem.sourceType;
	$: sourceUrl = data.item?.sourceUrl ?? curatedItem.sourceUrl;
	$: downloadUrl = sourceUrl ? toKitabDownloadUrl(sourceType, sourceUrl) : null;
	$: pageTitle = `${moduleItem.title} - ${curatedItem.title}`;
	$: descriptionText = plainText(`${moduleItem.focus}. ${moduleItem.overview}`);
	$: santriTitle = moduleItem.title.replace(/^Modul\s+\d+\s*:\s*/i, '').trim();
	$: santriCorePoints = moduleItem.points.slice(0, 3);
	$: santriExamples = moduleItem.examples.slice(0, 2);
	$: santriPractice = moduleItem.practice.slice(0, 2);
	$: santriKeywords = relatedChapters.flatMap((chapter) => chapter.subtopics).slice(0, 4);
	const moduleHref = (moduleId: string) => getCuratedKitabModuleHref(curatedItem.slug, moduleId);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta
		name="description"
		content={descriptionText || `Pelajari ${moduleItem.title} dari ${curatedItem.title}.`}
	/>
</svelte:head>

<div class="space-y-8">
	<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_34%),linear-gradient(135deg,_#111827_0%,_#1f2937_48%,_#14532d_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
			<div class="max-w-3xl">
				<div class="text-sm text-amber-100/85">
					<a href="/kitab" class="hover:text-white">Perpustakaan Kitab</a>
					<span class="px-2">/</span>
					<a href={`/kitab/${curatedItem.slug}`} class="hover:text-white">{curatedItem.title}</a>
					<span class="px-2">/</span>
					<span>{moduleItem.title}</span>
				</div>

				<div class="mt-4 flex flex-wrap gap-2">
					<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${kitabCategoryTone(curatedItem.category)}`}>
						{kitabCategoryLabel(curatedItem.category)}
					</span>
					<span class="rounded-full border border-amber-300/20 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
						Bab {moduleNumber} / {curatedItem.totalModules}
					</span>
					<span class="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
						{curatedItem.level}
					</span>
				</div>

				<h1 class="mt-4 text-3xl font-bold md:text-5xl">{moduleItem.title}</h1>
				<p class="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/80">
					{moduleItem.focus}
				</p>
				<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">{moduleItem.overview}</p>

				<div class="mt-6 flex flex-wrap gap-3">
					<a
						href={`/kitab/${curatedItem.slug}`}
						class="btn border-none bg-white text-slate-900 hover:bg-amber-50"
					>
						Kembali ke Jilid
					</a>
					{#if downloadUrl}
						<a
							href={downloadUrl}
							target="_blank"
							rel="noreferrer"
							class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10"
						>
							Buka PDF Asli
						</a>
					{/if}
				</div>
			</div>

			<div class="grid gap-4">
				<div class="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">
						Fokus Bab
					</p>
					<p class="mt-3 text-sm leading-7 text-white/75">{moduleItem.focus}</p>
				</div>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Posisi</p>
						<p class="mt-2 text-lg font-semibold text-white">Bab {moduleNumber}</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Kitab</p>
						<p class="mt-2 text-lg font-semibold text-white">{curatedItem.title}</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Diperbarui</p>
						<p class="mt-2 text-lg font-semibold text-white">{formatDate(curatedItem.updatedAt)}</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Mode Baca</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Pilih tampilan belajar</h2>
			</div>
			<div class="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
				<button
					type="button"
					class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
						readingMode === 'santri'
							? 'bg-emerald-600 text-white shadow-sm'
							: 'text-slate-600 hover:bg-white'
					}`}
					on:click={() => (readingMode = 'santri')}
				>
					Mode Santri
				</button>
				<button
					type="button"
					class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
						readingMode === 'lengkap'
							? 'bg-slate-900 text-white shadow-sm'
							: 'text-slate-600 hover:bg-white'
					}`}
					on:click={() => (readingMode = 'lengkap')}
				>
					Mode Lengkap
				</button>
			</div>
		</div>
	</section>

	{#if readingMode === 'santri'}
		<section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
			<article class="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Mode Santri</p>
				<h2 class="mt-3 text-3xl font-semibold text-slate-900">{santriTitle}</h2>
				<p class="mt-4 text-base leading-8 text-slate-700">{moduleItem.overview}</p>

				<div class="mt-6 grid gap-3">
					<div class="rounded-2xl border border-white/70 bg-white px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Bab Ini Tentang</p>
						<p class="mt-2 text-base font-semibold text-slate-900">{moduleItem.focus}</p>
					</div>
					<div class="rounded-2xl border border-white/70 bg-white px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Cara Belajar</p>
						<p class="mt-2 text-sm leading-7 text-slate-700">
							Baca pelan, pahami 2-3 inti dulu, lihat contoh, lalu kerjakan latihan sederhana.
						</p>
					</div>
				</div>
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Yang Harus Diingat</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Inti bab untuk santri</h2>
				<div class="mt-6 space-y-3">
					{#each santriCorePoints as point, index}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
								Inti {index + 1}
							</p>
							<p class="mt-2 text-sm leading-7 text-slate-700">{point}</p>
						</div>
					{/each}
				</div>
				{#if santriKeywords.length}
					<div class="mt-6">
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Kata Kunci</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each santriKeywords as keyword}
								<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
									{keyword}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</article>
		</section>

		<section class="grid gap-6 xl:grid-cols-2">
			<article class="rounded-[1.75rem] border border-amber-100 bg-amber-50 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">Contoh Bacaan</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Baca contoh yang paling penting</h2>
				<div class="mt-6 space-y-4">
					{#each santriExamples as example}
						<div class="rounded-2xl border border-amber-100 bg-white px-5 py-5">
							<p class="text-right text-2xl font-semibold text-slate-900 leading-[1.9]">{example.arabic}</p>
							<p class="mt-3 text-base font-semibold text-slate-800">{example.translit}</p>
							<p class="mt-2 text-sm leading-7 text-slate-600">{example.meaning}</p>
						</div>
					{/each}
				</div>
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Latihan Ringan</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Kerjakan sedikit tapi rutin</h2>
				<div class="mt-6 space-y-3">
					{#each santriPractice as item, index}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
								Latihan {index + 1}
							</p>
							<p class="mt-2 text-sm leading-7 text-slate-700">{item}</p>
						</div>
					{/each}
				</div>

				<div class="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-5 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Catatan Guru</p>
					<p class="mt-2 text-sm leading-7 text-emerald-950/80">
						Untuk TPQ, cukup tuntaskan satu bab sekali duduk. Jangan pindah ke bab berikutnya sebelum
						anak paham inti dan berani membaca contoh.
					</p>
				</div>
			</article>
		</section>

		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Urutan Bab</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Lanjut belajar dalam kitab ini</h2>
				</div>
				<p class="text-sm text-slate-500">Fokus tetap pada kitab yang sama, tidak menampilkan kitab lain.</p>
			</div>

			<div class="mt-6 space-y-3">
				{#each curatedItem.modules as module, index}
					<a
						href={moduleHref(module.id)}
						class={`block rounded-2xl border px-4 py-4 transition ${
							module.id === moduleItem.id
								? 'border-emerald-200 bg-emerald-50'
								: 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/60'
						}`}
					>
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Bab {index + 1}</p>
						<p class="mt-2 text-base font-semibold text-slate-900">{module.title}</p>
						<p class="mt-2 text-sm leading-6 text-slate-600">{module.overview}</p>
					</a>
				{/each}
			</div>
		</section>
	{:else}
		<section class="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Inti Bab</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Apa yang harus dikuasai</h2>
				<div class="mt-6 space-y-3">
					{#each moduleItem.points as point}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
							{point}
						</div>
					{/each}
				</div>
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Navigasi Bab</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Semua bab di kitab ini</h2>
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Mode lengkap menampilkan semua detail bab dalam kitab yang sama.
				</p>

				<div class="mt-6 space-y-3">
					{#each curatedItem.modules as module, index}
						<a
							href={moduleHref(module.id)}
							class={`block rounded-2xl border px-4 py-4 transition ${
								module.id === moduleItem.id
									? 'border-emerald-200 bg-emerald-50'
									: 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/60'
							}`}
						>
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-xs uppercase tracking-[0.24em] text-slate-400">
										Bab {index + 1}
									</p>
									<p class="mt-1 text-base font-semibold text-slate-900">{module.title}</p>
								</div>
								<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
									{module.examples.length} contoh
								</span>
							</div>
							<p class="mt-2 text-sm leading-6 text-slate-600">{module.overview}</p>
						</a>
					{/each}
				</div>
			</article>
		</section>

		<section class="grid gap-6 xl:grid-cols-2">
			<article class="rounded-[1.75rem] border border-amber-100 bg-amber-50 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">Contoh Utama</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Bahan baca dan penjelasan</h2>
				<div class="mt-6 space-y-3">
					{#each moduleItem.examples as example}
						<div class="rounded-2xl border border-amber-100 bg-white px-4 py-4">
							<p class="text-right text-xl font-semibold text-slate-900">{example.arabic}</p>
							<p class="mt-2 text-sm font-semibold text-slate-700">{example.translit}</p>
							<p class="mt-1 text-sm leading-6 text-slate-600">{example.meaning}</p>
						</div>
					{/each}
				</div>
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Latihan</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Tugas ringkas untuk penguatan</h2>
				<div class="mt-6 space-y-3">
					{#each moduleItem.practice as item}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
							{item}
						</div>
					{/each}
				</div>
			</article>
		</section>

		{#if relatedChapters.length}
			<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Peta Sumber</p>
						<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bab PDF yang mendasari halaman ini</h2>
					</div>
					<p class="text-sm text-slate-500">
						Bagian ini menunjukkan dari bab/subbab mana modul web ini dirapikan.
					</p>
				</div>

				<div class="mt-6 grid gap-5 lg:grid-cols-2">
					{#each relatedChapters as chapter}
						<article class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
							<div class="flex flex-wrap items-center gap-3">
								<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
									{chapter.moduleSpan}
								</span>
							</div>
							<h3 class="mt-4 text-xl font-semibold text-slate-900">{chapter.title}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-600">{chapter.summary}</p>
							<div class="mt-4 grid gap-3">
								{#each chapter.subtopics as subtopic}
									<div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
										{subtopic}
									</div>
								{/each}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<section class="grid gap-4 md:grid-cols-2">
		{#if previousModule}
			<a
				href={moduleHref(previousModule.id)}
				class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
			>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Bab Sebelumnya</p>
				<p class="mt-2 text-lg font-semibold text-slate-900">{previousModule.title}</p>
				<p class="mt-2 text-sm leading-6 text-slate-600">{previousModule.overview}</p>
			</a>
		{/if}

		{#if nextModule}
			<a
				href={moduleHref(nextModule.id)}
				class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm transition hover:bg-emerald-100"
			>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Bab Berikutnya</p>
				<p class="mt-2 text-lg font-semibold text-slate-900">{nextModule.title}</p>
				<p class="mt-2 text-sm leading-6 text-slate-700">{nextModule.overview}</p>
			</a>
		{/if}
	</section>

</div>
