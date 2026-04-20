<script lang="ts">
	import type { PageData } from './$types';
	import { toKitabDownloadUrl, toKitabReaderUrl } from '$lib/kitab';

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

	const sourceLabel = {
		pdf: 'PDF',
		drive: 'Google Drive'
	} as const;

	$: item = data.item;
	$: curatedItem = data.curatedItem;
	$: curatedSeries = Array.isArray(data.curatedSeries) ? data.curatedSeries : [];
	$: currentSeriesIndex = curatedItem
		? curatedSeries.findIndex((seriesItem) => seriesItem.slug === curatedItem.slug)
		: -1;
	$: previousSeriesItem =
		currentSeriesIndex > 0 ? curatedSeries[currentSeriesIndex - 1] : null;
	$: nextSeriesItem =
		currentSeriesIndex >= 0 && currentSeriesIndex < curatedSeries.length - 1
			? curatedSeries[currentSeriesIndex + 1]
			: null;
	$: sourceType = item?.sourceType ?? curatedItem?.sourceType ?? 'pdf';
	$: sourceUrl = item?.sourceUrl ?? curatedItem?.sourceUrl ?? '';
	$: readerUrl = sourceUrl ? toKitabReaderUrl(sourceType, sourceUrl) : null;
	$: downloadUrl = sourceUrl ? toKitabDownloadUrl(sourceType, sourceUrl) : null;
	$: pageTitle = curatedItem
		? `${curatedItem.title} - ${curatedItem.seriesTitle}`
		: `${item?.title ?? 'Kitab'} - Perpustakaan Kitab`;
	$: descriptionText = curatedItem
		? plainText(curatedItem.description || curatedItem.summary)
		: plainText(item?.description || item?.summary);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta
		name="description"
		content={descriptionText || `Baca ${pageTitle} dari perpustakaan kitab Santri Online.`}
	/>
</svelte:head>

{#if curatedItem}
	<div class="space-y-8">
		<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(135deg,_#111827_0%,_#1f2937_48%,_#14532d_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
			<div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div class="max-w-3xl">
					<a href="/kitab" class="text-sm text-amber-200 hover:text-white">
						← Kembali ke Perpustakaan Kitab
					</a>
					<div class="mt-4 flex flex-wrap gap-2">
						<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
							{curatedItem.seriesTitle}
						</span>
						<span class="rounded-full border border-amber-300/20 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
							Jilid {curatedItem.seriesOrder} / {curatedSeries.length || curatedItem.seriesOrder}
						</span>
						<span class="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
							{curatedItem.level}
						</span>
					</div>
					<h1 class="mt-4 text-3xl font-bold md:text-5xl">{curatedItem.title}</h1>
					<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">{curatedItem.summary}</p>

					<div class="mt-6 flex flex-wrap gap-3">
						{#if downloadUrl}
							<a
								href={downloadUrl}
								target="_blank"
								rel="noreferrer"
								class="btn border-none bg-white text-slate-900 hover:bg-amber-50"
							>
								Buka PDF Asli
							</a>
						{/if}
						<a href="#modul-seri" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
							Lihat Modul
						</a>
					</div>

					<div class="mt-6 grid gap-3 sm:grid-cols-3">
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Level</p>
							<p class="mt-2 text-lg font-semibold text-white">{curatedItem.level}</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Modul</p>
							<p class="mt-2 text-lg font-semibold text-white">{curatedItem.totalModules}</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Diperbarui</p>
							<p class="mt-2 text-lg font-semibold text-white">{formatDate(curatedItem.updatedAt)}</p>
						</div>
					</div>
				</div>

				<div class="grid gap-4">
					<div class="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
						<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Arah Belajar</p>
						<p class="mt-3 text-sm leading-7 text-white/75">{plainText(curatedItem.description)}</p>
					</div>
					<div class="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
						<p class="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">Tag Utama</p>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each curatedItem.tags as tag}
								<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
									{tag}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Tujuan Jilid</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Apa yang ingin dibangun</h2>
				<div class="mt-6 grid gap-3">
					{#each curatedItem.objectives as objective}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
							{objective}
						</div>
					{/each}
				</div>
				<div class="mt-6 rounded-[1.5rem] border border-amber-100 bg-amber-50 px-5 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Catatan Sumber</p>
					<p class="mt-3 text-sm leading-7 text-amber-950/80">{curatedItem.sourceNote}</p>
				</div>
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Navigasi Seri</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Jalur belajar bahasa Arab</h2>
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Semua jilid di bawah memakai model seri yang sama. Jilid berikutnya tinggal menambah data,
					tanpa membuat halaman statis baru.
				</p>

				<div class="mt-6 space-y-3">
					{#each curatedSeries as seriesItem}
						<a
							href={`/kitab/${seriesItem.slug}`}
							class={`block rounded-2xl border px-4 py-4 transition ${
								seriesItem.slug === curatedItem.slug
									? 'border-emerald-200 bg-emerald-50'
									: 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/60'
							}`}
						>
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-xs uppercase tracking-[0.24em] text-slate-400">
										Jilid {seriesItem.seriesOrder}
									</p>
									<p class="mt-1 text-base font-semibold text-slate-900">{seriesItem.title}</p>
								</div>
								<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
									{seriesItem.totalModules} modul
								</span>
							</div>
							<p class="mt-2 text-sm leading-6 text-slate-600">{seriesItem.summary}</p>
						</a>
					{/each}
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-2">
					{#if previousSeriesItem}
						<a
							href={`/kitab/${previousSeriesItem.slug}`}
							class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
						>
							← {previousSeriesItem.title}
						</a>
					{/if}
					{#if nextSeriesItem}
						<a
							href={`/kitab/${nextSeriesItem.slug}`}
							class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
						>
							Lanjut ke {nextSeriesItem.title} →
						</a>
					{/if}
				</div>
			</article>
		</section>

		<section id="modul-seri" class="space-y-4">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Modul Seri</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Urutan belajar jilid ini</h2>
				</div>
				<p class="text-sm text-slate-500">Setiap modul sengaja diringkas agar mudah dipelajari bertahap dari web.</p>
			</div>

			<div class="grid gap-5">
				{#each curatedItem.modules as module, index}
					<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
						<div class="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
							<div>
								<div class="flex flex-wrap items-center gap-3">
									<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
										Modul {index + 1}
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
										{module.focus}
									</span>
								</div>
								<h3 class="mt-4 text-2xl font-semibold text-slate-900">{module.title}</h3>
								<p class="mt-3 text-sm leading-7 text-slate-600">{module.overview}</p>

								<div class="mt-5 space-y-3">
									{#each module.points as point}
										<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
											{point}
										</div>
									{/each}
								</div>
							</div>

							<div class="space-y-5">
								<div class="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
									<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Contoh Utama</p>
									<div class="mt-4 space-y-3">
										{#each module.examples as example}
											<div class="rounded-2xl border border-amber-100 bg-white px-4 py-4">
												<p class="text-right text-xl font-semibold text-slate-900">{example.arabic}</p>
												<p class="mt-2 text-sm font-semibold text-slate-700">{example.translit}</p>
												<p class="mt-1 text-sm leading-6 text-slate-600">{example.meaning}</p>
											</div>
										{/each}
									</div>
								</div>

								<div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
									<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Latihan Ringkas</p>
									<div class="mt-4 space-y-3">
										{#each module.practice as item}
											<div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
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

		<section class="space-y-4">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Glosarium</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Istilah yang perlu dibiasakan</h2>
				</div>
				<p class="text-sm text-slate-500">Fokus pada pemahaman fungsi istilah, bukan sekadar hafalan bunyi.</p>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				{#each curatedItem.glossary as entry}
					<div class="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-900">{entry.term}</p>
						<p class="mt-2 text-sm leading-7 text-slate-600">{entry.meaning}</p>
					</div>
				{/each}
			</div>
		</section>

		{#if readerUrl}
			<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Viewer Sumber</p>
						<h2 class="mt-2 text-2xl font-semibold text-slate-900">PDF rujukan jilid ini</h2>
					</div>
					<a
						href={downloadUrl}
						target="_blank"
						rel="noreferrer"
						class="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
					>
						Buka di tab baru
					</a>
				</div>
				<div class="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
					<iframe
						src={readerUrl}
						title={`Viewer ${curatedItem.title}`}
						class="h-[75vh] min-h-[640px] w-full bg-white"
						loading="lazy"
					></iframe>
				</div>
			</section>
		{/if}
	</div>
{:else if item}
	<div class="space-y-8">
		<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_48%,_#022c22_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
			<div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
				<div class="max-w-sm">
					<div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-2xl">
						{#if item.coverUrl}
							<img src={item.coverUrl} alt={`Cover ${item.title}`} class="h-full w-full object-cover" />
						{:else}
							<div class="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-white/65">
								Cover kitab belum ditambahkan di CMS Hub.
							</div>
						{/if}
					</div>
				</div>

				<div class="max-w-3xl">
					<a href="/kitab" class="text-sm text-emerald-200 hover:text-white">← Kembali ke Perpustakaan Kitab</a>
					<div class="mt-4 flex flex-wrap gap-2">
						<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
							{sourceLabel[item.sourceType]}
						</span>
						{#if item.featured}
							<span class="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
								Unggulan
							</span>
						{/if}
					</div>
					<h1 class="mt-4 text-3xl font-bold md:text-5xl">{item.title}</h1>
					<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
						{plainText(item.summary || item.description) || 'Detail kitab ini dikelola langsung dari CMS Hub.'}
					</p>

					<div class="mt-6 flex flex-wrap gap-3">
						{#if readerUrl}
							<a href={readerUrl} target="_blank" rel="noreferrer" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
								Buka Viewer
							</a>
						{/if}
						{#if downloadUrl}
							<a href={downloadUrl} target="_blank" rel="noreferrer" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
								Buka Sumber
							</a>
						{/if}
					</div>

					<div class="mt-6 grid gap-3 sm:grid-cols-3">
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Sumber</p>
							<p class="mt-2 text-lg font-semibold text-white">{sourceLabel[item.sourceType]}</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Dipublikasikan</p>
							<p class="mt-2 text-lg font-semibold text-white">{formatDate(item.updatedAt)}</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Status</p>
							<p class="mt-2 text-lg font-semibold text-white capitalize">{item.status}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Viewer Kitab</p>
						<h2 class="mt-2 text-2xl font-semibold text-slate-900">Baca langsung dari halaman ini</h2>
					</div>
					{#if downloadUrl}
						<a href={downloadUrl} target="_blank" rel="noreferrer" class="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
							Buka di tab baru
						</a>
					{/if}
				</div>

				{#if readerUrl}
					<div class="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
						<iframe
							src={readerUrl}
							title={`Viewer ${item.title}`}
							class="h-[75vh] min-h-[640px] w-full bg-white"
							loading="lazy"
						></iframe>
					</div>
				{:else}
					<div class="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
						Viewer belum tersedia untuk kitab ini. Gunakan tombol sumber untuk membuka file langsung.
					</div>
				{/if}
			</article>

			<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Informasi Kitab</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Catatan publik</h2>
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Halaman ini membaca data kitab yang sudah dipublish dari CMS Hub. Jika admin mengubah cover,
					deskripsi, atau sumber file, halaman ini akan ikut berubah otomatis.
				</p>

				<div class="mt-6 space-y-3">
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Ringkasan</p>
						<p class="mt-2 text-sm leading-7 text-slate-700">
							{plainText(item.summary) || 'Ringkasan belum ditambahkan.'}
						</p>
					</div>
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Deskripsi</p>
						<p class="mt-2 text-sm leading-7 text-slate-700">
							{plainText(item.description) || 'Deskripsi lengkap belum ditambahkan.'}
						</p>
					</div>
				</div>
			</article>
		</section>
	</div>
{/if}
