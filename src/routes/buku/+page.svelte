<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	type Book = PageData['books'][number];

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const shortText = (value: string | null | undefined, length = 150) => {
		const source = plainText(value);
		if (!source) return 'Sinopsis buku akan tampil setelah penulis melengkapinya.';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	$: books = Array.isArray(data.books) ? data.books : [];
	$: readingProgress = Array.isArray(data.readingProgress) ? data.readingProgress : [];
	$: featuredBook = books[0] as Book | undefined;
</script>

<svelte:head>
	<title>Buku SantriOnline - Baca Buku dan Novel Digital</title>
	<meta
		name="description"
		content="Katalog buku dan novel digital SantriOnline. Baca bab gratis dari karya santri dan penulis pilihan."
	/>
</svelte:head>

<div class="space-y-8 pb-10">
	<section class="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),_transparent_36%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_45%,_#064e3b_100%)] px-5 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute -right-16 top-4 h-44 w-44 rounded-full bg-amber-200/10 blur-3xl"></div>
		<div class="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl"></div>

		<div class="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
			<div class="max-w-3xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/75">Buku SantriOnline</p>
				<h1 class="mt-3 text-3xl font-bold leading-tight md:text-5xl">
					Baca buku dan novel digital karya santri
				</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Temukan cerita, catatan, dan karya panjang yang sudah dipublikasikan. Beberapa bab awal bisa
					dibaca gratis, sementara bab premium bisa dibuka memakai coin.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="#katalog-buku" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Baca Buku
					</a>
					{#if data.isLoggedIn}
						<a href="/buku/saya" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
							Rak Buku Saya
						</a>
					{/if}
					<a href="/buku/studio" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Tulis Buku
					</a>
					<a href="/coins" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Saldo Coin
					</a>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Buku Terbit</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalBooks}</p>
					<p class="mt-1 text-xs text-white/65">Hanya status published yang tampil.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Bab Published</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalPublishedChapters}</p>
					<p class="mt-1 text-xs text-white/65">Draft tidak ditampilkan ke pembaca.</p>
				</div>
			</div>
		</div>
	</section>

	{#if data.isLoggedIn && readingProgress.length > 0}
		<section class="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm md:p-5">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Lanjut Baca</p>
					<h2 class="mt-1 text-xl font-semibold text-slate-900">Bacaan terakhir Anda</h2>
				</div>
				<p class="text-sm text-slate-500">Progress hanya tampil untuk akun Anda.</p>
			</div>

			<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{#each readingProgress as progress}
					<a
						href={`/buku/${progress.bookSlug}/bab/${progress.chapterNumber}`}
						class="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
					>
						<div class="flex gap-3">
							{#if progress.bookCoverUrl}
								<img
									src={progress.bookCoverUrl}
									alt={`Cover ${progress.bookTitle}`}
									class="h-16 w-12 rounded-lg object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-semibold text-emerald-700">
									Buku
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
									{progress.bookTitle}
								</p>
								<p class="mt-1 truncate text-xs text-slate-500">
									Bab {progress.chapterNumber}: {progress.chapterTitle}
								</p>
								<div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
									<div class="h-full rounded-full bg-emerald-500" style={`width: ${progress.progressPercent}%`}></div>
								</div>
								<p class="mt-1 text-xs text-slate-500">{progress.progressPercent}% terbaca</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if featuredBook}
		<section class="overflow-hidden rounded-[1.75rem] border border-amber-100 bg-white shadow-sm">
			<div class="grid gap-0 lg:grid-cols-[0.42fr_0.58fr]">
				<div class="bg-gradient-to-br from-amber-50 via-white to-emerald-50">
					{#if featuredBook.coverUrl}
						<img
							src={featuredBook.coverUrl}
							alt={`Cover ${featuredBook.title}`}
							class="h-full min-h-[280px] w-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div class="flex h-full min-h-[280px] items-center justify-center px-8 text-center text-sm text-slate-500">
							Cover buku akan tampil di sini.
						</div>
					{/if}
				</div>
				<div class="p-6 md:p-8">
					<div class="flex flex-wrap gap-2">
						<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
							Sorotan
						</span>
						{#if featuredBook.category}
							<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
								{featuredBook.category}
							</span>
						{/if}
					</div>
					<h2 class="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{featuredBook.title}</h2>
					<p class="mt-4 text-sm leading-7 text-slate-600 md:text-base">
						{shortText(featuredBook.description, 260)}
					</p>
					<div class="mt-6 grid gap-3 sm:grid-cols-3">
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bab Published</p>
							<p class="mt-2 text-xl font-semibold text-slate-900">{featuredBook.publishedChapterCount}</p>
						</div>
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bab Gratis</p>
							<p class="mt-2 text-xl font-semibold text-emerald-700">{featuredBook.freeChapterLimit}</p>
						</div>
						<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Harga Bab</p>
							<p class="mt-2 text-xl font-semibold text-slate-900">{featuredBook.pricePerChapter} coin</p>
						</div>
					</div>
					<a href={`/buku/${featuredBook.slug}`} class="btn btn-primary mt-6">Buka Buku</a>
				</div>
			</div>
		</section>
	{/if}

	<section id="katalog-buku" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Katalog Publik</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Semua buku yang sudah terbit</h2>
			</div>
			<p class="text-sm text-slate-500">Bab draft dan buku non-published tidak ditampilkan.</p>
		</div>

		{#if books.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada buku yang dipublikasikan.</p>
				<p class="mt-2 text-sm text-slate-500">Tambahkan data dummy lewat D1 untuk menguji halaman ini.</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each books as book}
					<article class="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
						<div class="relative">
							{#if book.coverUrl}
								<img
									src={book.coverUrl}
									alt={`Cover ${book.title}`}
									class="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-56 items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 text-center text-sm text-slate-500">
									Cover belum tersedia.
								</div>
							{/if}

							<div class="absolute left-4 top-4 flex flex-wrap gap-2">
								<span class="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
									Buku Digital
								</span>
								{#if book.category}
									<span class="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm">
										{book.category}
									</span>
								{/if}
							</div>
						</div>

						<div class="space-y-4 p-5">
							<div>
								<h3 class="text-xl font-semibold text-slate-900">{book.title}</h3>
								<p class="mt-3 text-sm leading-7 text-slate-600">{shortText(book.description)}</p>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
									<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bab</p>
									<p class="mt-2 text-lg font-semibold text-slate-900">{book.publishedChapterCount}</p>
								</div>
								<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
									<p class="text-xs uppercase tracking-[0.22em] text-emerald-600">Gratis</p>
									<p class="mt-2 text-lg font-semibold text-emerald-800">{book.freeChapterLimit} bab</p>
								</div>
							</div>

							<a href={`/buku/${book.slug}`} class="btn btn-primary w-full">Lihat Detail</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>
