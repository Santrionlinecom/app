<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	type ProgressItem = PageData['readingProgress'][number];
	type BookmarkItem = PageData['bookBookmarks'][number];
	type UnlockItem = PageData['unlockedChapters'][number];

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '';
		const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
		if (Number.isNaN(date.getTime())) return value;
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(date);
	};

	const statusText: Record<string, string> = {
		draft: 'Draft',
		pending: 'Menunggu Review',
		published: 'Published',
		rejected: 'Tidak tersedia',
		archived: 'Tidak tersedia',
		unknown: 'Tidak tersedia'
	};

	const coverAlt = (title: string) => `Cover ${title}`;

	$: readingProgress = Array.isArray(data.readingProgress) ? data.readingProgress : [];
	$: bookBookmarks = Array.isArray(data.bookBookmarks) ? data.bookBookmarks : [];
	$: chapterBookmarks = Array.isArray(data.chapterBookmarks) ? data.chapterBookmarks : [];
	$: unlockedChapters = Array.isArray(data.unlockedChapters) ? data.unlockedChapters : [];
	$: isEmpty =
		readingProgress.length === 0 &&
		bookBookmarks.length === 0 &&
		chapterBookmarks.length === 0 &&
		unlockedChapters.length === 0;
</script>

<svelte:head>
	<title>Rak Buku Saya - Buku SantriOnline</title>
	<meta
		name="description"
		content="Rak Buku Saya untuk melihat lanjut baca, bookmark buku, bookmark bab, dan bab premium yang sudah dibuka."
	/>
</svelte:head>

<div class="space-y-8 pb-10">
	<section class="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_52%,_#064e3b_100%)] px-5 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
			<div class="max-w-3xl">
				<a href="/buku" class="text-sm font-semibold text-emerald-100 hover:text-white">Kembali ke Katalog Buku</a>
				<p class="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/75">Rak Buku Saya</p>
				<h1 class="mt-3 text-3xl font-bold leading-tight md:text-5xl">Semua bacaan Anda di satu tempat</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Lanjutkan bab terakhir, buka bookmark, dan cek bab premium yang sudah terbuka untuk akun Anda.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="/buku" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Lihat Katalog Buku
					</a>
					{#if readingProgress[0]}
						<a
							href={`/buku/${readingProgress[0].bookSlug}/bab/${readingProgress[0].chapterNumber}`}
							class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10"
						>
							Lanjut Baca
						</a>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.22em] text-white/55">Progress</p>
					<p class="mt-2 text-2xl font-semibold">{data.stats.readingProgress}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.22em] text-white/55">Buku Tersimpan</p>
					<p class="mt-2 text-2xl font-semibold">{data.stats.bookBookmarks}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.22em] text-white/55">Bab Tersimpan</p>
					<p class="mt-2 text-2xl font-semibold">{data.stats.chapterBookmarks}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.22em] text-white/55">Bab Terbuka</p>
					<p class="mt-2 text-2xl font-semibold">{data.stats.unlockedChapters}</p>
				</div>
			</div>
		</div>
	</section>

	{#if isEmpty}
		<section class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
			<p class="text-lg font-semibold text-slate-900">
				Belum ada bacaan tersimpan. Mulai baca buku dari katalog SantriOnline.
			</p>
			<a href="/buku" class="btn btn-primary mt-5">Lihat Katalog Buku</a>
		</section>
	{/if}

	{#if !isEmpty}
	<section class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Lanjut Baca</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bacaan terakhir</h2>
			</div>
			<p class="text-sm text-slate-500">Disusun dari aktivitas baca terbaru.</p>
		</div>

		{#if readingProgress.length === 0}
			{@render EmptySection('Belum ada progress baca.')}
		{:else}
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each readingProgress as item}
					{@render ProgressCard(item)}
				{/each}
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Buku Tersimpan</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bookmark buku</h2>
			</div>
			<p class="text-sm text-slate-500">Hanya buku published yang tampil di rak pembaca.</p>
		</div>

		{#if bookBookmarks.length === 0}
			{@render EmptySection('Belum ada buku tersimpan.')}
		{:else}
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each bookBookmarks as item}
					{@render BookBookmarkCard(item)}
				{/each}
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Bab Tersimpan</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bookmark bab</h2>
			</div>
			<p class="text-sm text-slate-500">Bab draft atau buku non-published tidak ditampilkan.</p>
		</div>

		{#if chapterBookmarks.length === 0}
			{@render EmptySection('Belum ada bab tersimpan.')}
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each chapterBookmarks as item}
					{@render ChapterBookmarkCard(item)}
				{/each}
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Bab Terbuka / Sudah Dibeli</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bab premium yang sudah di-unlock</h2>
			</div>
			<p class="text-sm text-slate-500">Unlock lama tetap dicatat untuk akun Anda.</p>
		</div>

		{#if unlockedChapters.length === 0}
			{@render EmptySection('Belum ada bab premium yang terbuka.')}
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each unlockedChapters as item}
					{@render UnlockCard(item)}
				{/each}
			</div>
		{/if}
	</section>
	{/if}
</div>

{#snippet EmptySection(label: string)}
	<div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center shadow-sm">
		<p class="text-sm font-semibold text-slate-700">{label}</p>
		<a href="/buku" class="btn btn-sm btn-outline mt-4">Lihat Katalog Buku</a>
	</div>
{/snippet}

{#snippet Cover(title: string, coverUrl: string | null)}
	{#if coverUrl}
		<img src={coverUrl} alt={coverAlt(title)} class="h-24 w-16 rounded-xl object-cover shadow-sm" loading="lazy" />
	{:else}
		<div class="flex h-24 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-semibold text-emerald-700">
			Buku
		</div>
	{/if}
{/snippet}

{#snippet ProgressCard(item: ProgressItem)}
	<article class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
		<div class="flex gap-4">
			{@render Cover(item.bookTitle, item.bookCoverUrl)}
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-slate-900">{item.bookTitle}</p>
				<p class="mt-1 truncate text-xs text-slate-500">Bab {item.chapterNumber}: {item.chapterTitle}</p>
				<div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
					<div class="h-full rounded-full bg-emerald-500" style={`width: ${item.progressPercent}%`}></div>
				</div>
				<div class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
					<span>{item.progressPercent}% terbaca</span>
					<span>{formatDate(item.lastReadAt)}</span>
				</div>
				<a href={`/buku/${item.bookSlug}/bab/${item.chapterNumber}`} class="btn btn-primary btn-sm mt-4 w-full">
					Lanjut Baca
				</a>
			</div>
		</div>
	</article>
{/snippet}

{#snippet BookBookmarkCard(item: BookmarkItem)}
	<article class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
		<div class="flex gap-4">
			{@render Cover(item.bookTitle, item.bookCoverUrl)}
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap gap-2">
					<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
						Buku
					</span>
					{#if item.bookCategory}
						<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
							{item.bookCategory}
						</span>
					{/if}
				</div>
				<h3 class="mt-3 line-clamp-2 text-lg font-semibold text-slate-900">{item.bookTitle}</h3>
				<p class="mt-2 text-xs text-slate-500">Disimpan {formatDate(item.createdAt)}</p>
				<a href={`/buku/${item.bookSlug}`} class="btn btn-outline btn-sm mt-4 w-full">Buka Buku</a>
			</div>
		</div>
	</article>
{/snippet}

{#snippet ChapterBookmarkCard(item: BookmarkItem)}
	<article class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<p class="text-sm font-semibold text-slate-900">{item.bookTitle}</p>
				<h3 class="mt-2 text-lg font-semibold text-slate-900">
					Bab {item.chapterNumber}: {item.chapterTitle}
				</h3>
				<p class="mt-2 text-xs text-slate-500">Disimpan {formatDate(item.createdAt)}</p>
			</div>
			<a href={`/buku/${item.bookSlug}/bab/${item.chapterNumber}`} class="btn btn-primary btn-sm shrink-0">
				Baca Bab
			</a>
		</div>
	</article>
{/snippet}

{#snippet UnlockCard(item: UnlockItem)}
	<article class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0">
				<div class="flex flex-wrap gap-2">
					<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
						{item.coinSpent} coin
					</span>
					<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
						{item.isAvailable ? 'Tersedia' : item.chapterStatus !== 'published' ? 'Tidak tersedia' : statusText[item.bookStatus] ?? 'Tidak tersedia'}
					</span>
				</div>
				<p class="mt-3 text-sm font-semibold text-slate-900">{item.bookTitle}</p>
				<h3 class="mt-2 text-lg font-semibold text-slate-900">
					Bab {item.chapterNumber}: {item.chapterTitle}
				</h3>
				<p class="mt-2 text-xs text-slate-500">Dibuka {formatDate(item.createdAt)}</p>
			</div>
			{#if item.isAvailable}
				<a href={`/buku/${item.bookSlug}/bab/${item.chapterNumber}`} class="btn btn-primary btn-sm shrink-0">
					Baca Bab
				</a>
			{:else}
				<span class="btn btn-disabled btn-sm shrink-0">Tidak tersedia</span>
			{/if}
		</div>
	</article>
{/snippet}
