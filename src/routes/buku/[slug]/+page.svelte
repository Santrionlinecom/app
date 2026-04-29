<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const descriptionText = (value: string | null | undefined) =>
		plainText(value) || 'Sinopsis buku ini belum dilengkapi.';

	const isFreeChapter = (chapterNumber: number, freeChapterLimit: number) =>
		Number(chapterNumber) > 0 && Number(chapterNumber) <= Number(freeChapterLimit);

	$: book = data.book;
	$: chapters = Array.isArray(data.chapters) ? data.chapters : [];
	$: firstChapter = chapters[0] ?? null;
</script>

<svelte:head>
	<title>{book.title} - Buku SantriOnline</title>
	<meta
		name="description"
		content={descriptionText(book.description)}
	/>
</svelte:head>

<div class="space-y-8 pb-10">
	<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_36%),linear-gradient(135deg,_#111827_0%,_#1f2937_48%,_#064e3b_100%)] px-5 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
			<div class="max-w-sm">
				<div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-2xl">
					{#if book.coverUrl}
						<img src={book.coverUrl} alt={`Cover ${book.title}`} class="h-full w-full object-cover" />
					{:else}
						<div class="flex min-h-[320px] items-center justify-center bg-white/5 px-8 text-center text-sm text-white/65">
							Cover buku belum tersedia.
						</div>
					{/if}
				</div>
			</div>

			<div class="max-w-3xl">
				<a href="/buku" class="text-sm text-emerald-100 hover:text-white">Kembali ke Katalog Buku</a>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
						Published
					</span>
					{#if book.category}
						<span class="rounded-full border border-amber-300/20 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
							{book.category}
						</span>
					{/if}
				</div>

				<h1 class="mt-4 text-3xl font-bold leading-tight md:text-5xl">{book.title}</h1>
				<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
					{descriptionText(book.description)}
				</p>

				<div class="mt-6 grid gap-3 sm:grid-cols-3">
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Bab Published</p>
						<p class="mt-2 text-lg font-semibold text-white">{chapters.length}</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Bab Gratis</p>
						<p class="mt-2 text-lg font-semibold text-white">{book.freeChapterLimit}</p>
					</div>
					<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Harga Terkunci</p>
						<p class="mt-2 text-lg font-semibold text-white">{book.pricePerChapter} coin</p>
					</div>
				</div>

				<div class="mt-6 flex flex-wrap gap-3">
					{#if firstChapter}
						<a
							href={`/buku/${book.slug}/bab/${firstChapter.chapterNumber}`}
							class="btn border-none bg-white text-slate-900 hover:bg-emerald-50"
						>
							Mulai Membaca
						</a>
					{/if}
					<a href="#daftar-bab" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Lihat Daftar Bab
					</a>
				</div>
			</div>
		</div>
	</section>

	<section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Sinopsis</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Tentang buku ini</h2>
			<p class="mt-4 text-sm leading-8 text-slate-600 md:text-base">
				{descriptionText(book.description)}
			</p>
		</article>

		<article class="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Akses Baca</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Bab gratis lebih dulu</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700">
				Bab dengan nomor sampai {book.freeChapterLimit} dapat dibaca penuh. Bab setelahnya sudah ditandai
				terkunci dan akan memakai coin pada tahap berikutnya.
			</p>
		</article>
	</section>

	<section id="daftar-bab" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Daftar Bab</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bab yang sudah dipublikasikan</h2>
			</div>
			<p class="text-sm text-slate-500">Draft tidak tampil di daftar pembaca.</p>
		</div>

		{#if chapters.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada bab published.</p>
				<p class="mt-2 text-sm text-slate-500">Tambahkan bab dengan status published untuk mulai menguji reader.</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each chapters as chapter}
					{@const isFree = isFreeChapter(chapter.chapterNumber, book.freeChapterLimit)}
					<a
						href={`/buku/${book.slug}/bab/${chapter.chapterNumber}`}
						class="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
					>
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
										Bab {chapter.chapterNumber}
									</span>
									<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
										{isFree ? 'Gratis' : 'Terkunci'}
									</span>
								</div>
								<h3 class="mt-3 text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
									{chapter.title}
								</h3>
							</div>
							<span class="btn btn-sm {isFree ? 'btn-primary' : 'btn-outline'}">
								{isFree ? 'Baca Bab' : 'Lihat Info'}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
