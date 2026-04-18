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
	$: readerUrl = toKitabReaderUrl(item.sourceType, item.sourceUrl);
	$: downloadUrl = toKitabDownloadUrl(item.sourceType, item.sourceUrl);
	$: descriptionText = plainText(item.description || item.summary);
</script>

<svelte:head>
	<title>{item.title} - Perpustakaan Kitab</title>
	<meta
		name="description"
		content={descriptionText || `Baca ${item.title} dari perpustakaan kitab Santri Online.`}
	/>
</svelte:head>

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
