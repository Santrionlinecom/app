<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type ReaderFontSize = 'small' | 'normal' | 'large';
	type ReaderTheme = 'light' | 'dark';

	const FONT_STORAGE_KEY = 'santrionline:buku-reader-font-size';
	const THEME_STORAGE_KEY = 'santrionline:buku-reader-theme';

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/p>/gi, '\n\n')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/[ \t]+\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();

	const toParagraphs = (value: string | null | undefined) =>
		plainText(value)
			.split(/\n{2,}/)
			.map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
			.filter(Boolean);

	const isReaderFontSize = (value: string | null): value is ReaderFontSize =>
		value === 'small' || value === 'normal' || value === 'large';

	const isReaderTheme = (value: string | null): value is ReaderTheme =>
		value === 'light' || value === 'dark';

	let readerFontSize: ReaderFontSize = 'normal';
	let readerTheme: ReaderTheme = 'light';
	let progressPercent = Number(data.readingProgress?.progressPercent ?? 0);
	let latestSavedProgress = progressPercent;
	let progressTimer: ReturnType<typeof setTimeout> | null = null;
	let chapterBookmarked = Boolean(data.chapterBookmark);
	let bookmarkBusy = false;
	let bookmarkError = '';

	onMount(() => {
		const storedFontSize = localStorage.getItem(FONT_STORAGE_KEY);
		const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

		if (isReaderFontSize(storedFontSize)) {
			readerFontSize = storedFontSize;
		}

		if (isReaderTheme(storedTheme)) {
			readerTheme = storedTheme;
		}
	});

	const setReaderFontSize = (value: ReaderFontSize) => {
		readerFontSize = value;
		if (browser) {
			localStorage.setItem(FONT_STORAGE_KEY, value);
		}
	};

	const setReaderTheme = (value: ReaderTheme) => {
		readerTheme = value;
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, value);
		}
	};

	$: book = data.book;
	$: chapter = data.chapter;
	$: isLocked = data.access === 'locked';
	$: isUnlocked = data.access === 'unlocked';
	$: accessLabel = isLocked ? 'Terkunci' : isUnlocked ? 'Terbuka' : 'Gratis';
	$: paragraphs = toParagraphs(chapter.content);
	$: previousChapter = data.previousChapter;
	$: nextChapter = data.nextChapter;
	$: formBalance =
		form && 'balance' in form && typeof form.balance === 'number' ? form.balance : null;
	$: walletBalance = formBalance ?? data.walletBalance ?? 0;
	$: canUnlock = data.isLoggedIn && isLocked && walletBalance >= book.pricePerChapter;
	$: isDarkReader = readerTheme === 'dark';
	$: readerFontClass =
		readerFontSize === 'small'
			? 'text-[0.98rem] leading-8 md:text-[1.05rem] md:leading-9'
			: readerFontSize === 'large'
				? 'text-[1.18rem] leading-10 md:text-[1.28rem] md:leading-[2.65rem]'
				: 'text-[1.08rem] leading-9 md:text-[1.16rem] md:leading-10';
	$: shellClass = isDarkReader
		? 'bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.12),_transparent_34%),linear-gradient(180deg,_#12110d_0%,_#1c1917_58%,_#0f172a_100%)] text-stone-100'
		: 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fdf6e8_52%,_#ecfdf5_100%)] text-slate-900';
	$: panelClass = isDarkReader
		? 'border-stone-700/80 bg-stone-900/78 text-stone-100 shadow-[0_28px_90px_rgba(0,0,0,0.34)]'
		: 'border-amber-100 bg-[#fff9ea] text-slate-900 shadow-[0_28px_90px_rgba(15,23,42,0.1)]';
	$: paperClass = isDarkReader
		? 'border-stone-700 bg-[#1f1b16] text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
		: 'border-amber-100 bg-[#fffdf6] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';
	$: mutedTextClass = isDarkReader ? 'text-stone-300' : 'text-slate-600';
	$: softCardClass = isDarkReader
		? 'border-stone-700 bg-stone-950/55 text-stone-200'
		: 'border-slate-200 bg-white/82 text-slate-700';

	const getScrollProgressPercent = () => {
		if (!browser) return progressPercent;
		const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
		if (scrollableHeight <= 0) return 100;
		return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollableHeight) * 100)));
	};

	const saveProgressPercent = async (percent: number) => {
		if (!data.isLoggedIn || isLocked) return;
		try {
			const response = await fetch('/api/buku/progress', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					bookId: book.id,
					chapterId: chapter.id,
					progressPercent: percent
				})
			});

			if (!response.ok) return;

			const payload = await response.json().catch(() => ({}));
			const savedPercent = Number(payload.progress?.progressPercent ?? percent);
			latestSavedProgress = Math.max(latestSavedProgress, savedPercent);
			progressPercent = Math.max(progressPercent, latestSavedProgress);
		} catch (_) {
			// Progress baca tidak boleh mengganggu reader.
		}
	};

	const queueProgressSave = () => {
		if (!browser || !data.isLoggedIn || isLocked) return;
		progressPercent = Math.max(progressPercent, getScrollProgressPercent());

		if (progressPercent < 100 && progressPercent < latestSavedProgress + 5) return;
		if (progressTimer) clearTimeout(progressTimer);

		progressTimer = setTimeout(() => {
			void saveProgressPercent(progressPercent);
		}, 700);
	};

	const toggleChapterBookmark = async () => {
		if (bookmarkBusy) return;
		bookmarkBusy = true;
		bookmarkError = '';

		try {
			const response = await fetch('/api/buku/bookmark', {
				method: chapterBookmarked ? 'DELETE' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					bookId: book.id,
					chapterId: chapter.id
				})
			});
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				bookmarkError = payload.error ?? 'Bookmark gagal diproses.';
				return;
			}

			chapterBookmarked = !chapterBookmarked;
		} catch (_) {
			bookmarkError = 'Bookmark gagal diproses.';
		} finally {
			bookmarkBusy = false;
		}
	};

	onMount(() => {
		if (!data.isLoggedIn || isLocked) return;

		const handleScroll = () => queueProgressSave();
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll);
		queueProgressSave();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleScroll);
			if (progressTimer) clearTimeout(progressTimer);
			void saveProgressPercent(progressPercent);
		};
	});
</script>

<svelte:head>
	<title>{chapter.title} - {book.title}</title>
	<meta
		name="description"
		content={`Baca ${chapter.title} dari ${book.title} di Buku SantriOnline.`}
	/>
</svelte:head>

<div class={`min-h-screen px-3 py-4 transition-colors duration-300 sm:px-5 md:px-8 md:py-8 ${shellClass}`}>
	<div class="reader-enter mx-auto max-w-5xl space-y-4 md:space-y-6">
		<nav class={`rounded-3xl border px-4 py-3 text-sm backdrop-blur ${softCardClass}`}>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<a href="/buku" class="font-semibold text-emerald-600 hover:text-emerald-500">Buku</a>
					<span class={isDarkReader ? 'px-2 text-stone-600' : 'px-2 text-slate-300'}>/</span>
					<a
						href={`/buku/${book.slug}`}
						class="font-semibold text-emerald-600 hover:text-emerald-500"
					>
						{book.title}
					</a>
					<span class={isDarkReader ? 'px-2 text-stone-600' : 'px-2 text-slate-300'}>/</span>
					<span class={mutedTextClass}>Bab {chapter.chapterNumber}</span>
				</div>
				<a href={`/buku/${book.slug}`} class="btn btn-sm btn-outline">Daftar Bab</a>
			</div>
		</nav>

		<header class={`overflow-hidden rounded-[2rem] border p-5 backdrop-blur md:p-7 ${softCardClass}`}>
			<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
							Bab {chapter.chapterNumber}
						</span>
						<span
							class={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
								isLocked
									? 'bg-amber-100 text-amber-800'
									: isUnlocked
										? 'bg-sky-100 text-sky-800'
										: 'bg-emerald-100 text-emerald-800'
							}`}
						>
							{accessLabel}
						</span>
						{#if book.category}
							<span
								class={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
									isDarkReader
										? 'bg-stone-800 text-stone-300 ring-1 ring-stone-700'
										: 'bg-white text-slate-500 ring-1 ring-slate-200'
								}`}
							>
								{book.category}
							</span>
						{/if}
					</div>
					<p class={`mt-5 text-xs font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
						{book.title}
					</p>
					<h1 class="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
						{chapter.title}
					</h1>
				</div>

				<div class={`rounded-3xl border p-4 ${softCardClass}`}>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Progress Baca</p>
					<div class="mt-3 grid grid-cols-2 gap-3 text-sm">
						<div>
							<p class="opacity-60">Bab aktif</p>
							<p class="font-bold">Bab {chapter.chapterNumber}</p>
						</div>
						<div>
							<p class="opacity-60">Status</p>
							<p class="font-bold">{accessLabel}</p>
						</div>
					</div>
					{#if data.isLoggedIn && !isLocked}
						<div class="mt-4">
							<div class={`h-2 overflow-hidden rounded-full ${isDarkReader ? 'bg-stone-800' : 'bg-slate-200'}`}>
								<div class="h-full rounded-full bg-emerald-500" style={`width: ${progressPercent}%`}></div>
							</div>
							<p class="mt-2 text-xs opacity-65">{progressPercent}% tersimpan</p>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<section class={`rounded-[2rem] border p-4 backdrop-blur md:p-5 ${softCardClass}`}>
			<div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-[0.22em] opacity-60">Ukuran Font</p>
						<div class="join w-full">
							<button
								type="button"
								class={`btn join-item btn-sm flex-1 ${readerFontSize === 'small' ? 'btn-primary' : 'btn-outline'}`}
								aria-pressed={readerFontSize === 'small'}
								on:click={() => setReaderFontSize('small')}
							>
								Kecil
							</button>
							<button
								type="button"
								class={`btn join-item btn-sm flex-1 ${readerFontSize === 'normal' ? 'btn-primary' : 'btn-outline'}`}
								aria-pressed={readerFontSize === 'normal'}
								on:click={() => setReaderFontSize('normal')}
							>
								Normal
							</button>
							<button
								type="button"
								class={`btn join-item btn-sm flex-1 ${readerFontSize === 'large' ? 'btn-primary' : 'btn-outline'}`}
								aria-pressed={readerFontSize === 'large'}
								on:click={() => setReaderFontSize('large')}
							>
								Besar
							</button>
						</div>
					</div>

					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-[0.22em] opacity-60">Mode Baca</p>
						<div class="join w-full">
							<button
								type="button"
								class={`btn join-item btn-sm flex-1 ${readerTheme === 'light' ? 'btn-primary' : 'btn-outline'}`}
								aria-pressed={readerTheme === 'light'}
								on:click={() => setReaderTheme('light')}
							>
								Terang
							</button>
							<button
								type="button"
								class={`btn join-item btn-sm flex-1 ${readerTheme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
								aria-pressed={readerTheme === 'dark'}
								on:click={() => setReaderTheme('dark')}
							>
								Gelap
							</button>
						</div>
					</div>
				</div>

				<div class="grid gap-2 sm:grid-cols-3 lg:min-w-[28rem]">
					{#if previousChapter}
						<a href={`/buku/${book.slug}/bab/${previousChapter.chapterNumber}`} class="btn btn-outline btn-sm">
							Bab Sebelumnya
						</a>
					{:else}
						<span class="btn btn-disabled btn-sm">Bab Sebelumnya</span>
					{/if}

					{#if nextChapter}
						<a href={`/buku/${book.slug}/bab/${nextChapter.chapterNumber}`} class="btn btn-primary btn-sm">
							Bab Berikutnya
						</a>
					{:else}
						<span class="btn btn-disabled btn-sm">Bab Berikutnya</span>
					{/if}

					{#if data.isLoggedIn}
						<button
							type="button"
							class={`btn btn-sm ${chapterBookmarked ? 'btn-warning' : 'btn-outline'}`}
							disabled={bookmarkBusy}
							on:click={toggleChapterBookmark}
						>
							{chapterBookmarked ? 'Hapus Bookmark' : 'Simpan Bab'}
						</button>
					{:else}
						<a href="/auth" class="btn btn-outline btn-sm">Simpan Bab</a>
					{/if}
				</div>
			</div>
			{#if bookmarkError}
				<p class="mt-3 text-sm text-amber-600">{bookmarkError}</p>
			{/if}
		</section>

		<article class={`relative overflow-hidden rounded-[2.25rem] border p-3 md:p-6 ${panelClass}`}>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-12 rounded-b-full bg-white/20 blur-2xl"></div>
			<div class="absolute bottom-6 left-0 top-6 hidden w-5 rounded-r-full bg-black/5 md:block"></div>

			<div class={`book-paper relative mx-auto max-w-3xl rounded-[1.6rem] border px-5 py-7 sm:px-7 md:px-11 md:py-12 ${paperClass}`}>
				<div class={`mb-8 flex items-start justify-between gap-4 border-b pb-4 ${isDarkReader ? 'border-stone-700' : 'border-amber-100'}`}>
					<div class="min-w-0">
						<p class={`text-[11px] font-semibold uppercase tracking-[0.26em] ${mutedTextClass}`}>
							{book.title}
						</p>
						<p class="mt-1 text-sm font-semibold">Bab {chapter.chapterNumber}</p>
					</div>
					<span
						class={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
							isLocked
								? 'bg-amber-100 text-amber-800'
								: isUnlocked
									? 'bg-sky-100 text-sky-800'
									: 'bg-emerald-100 text-emerald-800'
						}`}
					>
						{accessLabel}
					</span>
				</div>

				{#if isLocked}
					<div
						class={`mx-auto max-w-2xl rounded-[1.5rem] border px-5 py-8 text-center md:px-8 md:py-10 ${
							isDarkReader
								? 'border-amber-700/70 bg-amber-950/30 text-stone-100'
								: 'border-amber-200 bg-amber-50 text-slate-900'
						}`}
					>
						<p class="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Bab Premium</p>
						<h2 class="mt-3 text-2xl font-semibold">Bab ini terkunci</h2>
						<p class={`mt-4 text-sm leading-7 ${isDarkReader ? 'text-stone-300' : 'text-slate-700'}`}>
							Bab ini bisa dibuka permanen memakai coin. Pengurangan coin hanya diproses di server.
						</p>
						<div
							class={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
								isDarkReader
									? 'border-amber-800/80 bg-stone-950/55 text-stone-300'
									: 'border-amber-200 bg-white text-slate-600'
							}`}
						>
							Harga unlock: <span class="font-semibold">{book.pricePerChapter} coin</span>
						</div>

						{#if form?.error}
							<div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
								{form.error}
							</div>
						{/if}

						{#if !data.isLoggedIn}
							<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
								<a href="/auth" class="btn btn-primary">Login untuk Membuka Bab</a>
								<a href={`/buku/${book.slug}`} class="btn btn-outline">Kembali ke Daftar Bab</a>
							</div>
						{:else if !canUnlock}
							<div
								class={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
									isDarkReader
										? 'border-amber-800/80 bg-stone-950/55 text-stone-300'
										: 'border-amber-200 bg-white text-slate-700'
								}`}
							>
								Coin belum cukup. Silakan topup coin terlebih dahulu.
								<p class="mt-2 text-xs opacity-70">Saldo saat ini: {walletBalance} coin.</p>
							</div>
							<a href={`/buku/${book.slug}`} class="btn btn-outline mt-6">Kembali ke Daftar Bab</a>
						{:else}
							<form method="POST" action="?/unlock" class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
								<button type="submit" class="btn btn-primary">
									Buka Bab Ini - {book.pricePerChapter} Coin
								</button>
								<a href={`/buku/${book.slug}`} class="btn btn-outline">Kembali ke Daftar Bab</a>
							</form>
							<p class="mt-3 text-xs opacity-70">
								Saldo setelah unlock: {walletBalance - book.pricePerChapter} coin.
							</p>
						{/if}
					</div>
				{:else if paragraphs.length > 0}
					<div class={`reader-content mx-auto max-w-2xl ${readerFontClass}`}>
						{#each paragraphs as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{:else}
					<div
						class={`rounded-[1.5rem] border border-dashed px-6 py-10 text-center ${
							isDarkReader ? 'border-stone-700 bg-stone-950/40' : 'border-slate-300 bg-slate-50'
						}`}
					>
						<p class="text-base font-semibold">Konten bab belum tersedia.</p>
						<p class={`mt-2 text-sm ${mutedTextClass}`}>
							Bab ini sudah published, tetapi kontennya masih kosong.
						</p>
					</div>
				{/if}
			</div>
		</article>

		<footer class="grid gap-3 sm:grid-cols-2">
			{#if previousChapter}
				<a
					href={`/buku/${book.slug}/bab/${previousChapter.chapterNumber}`}
					class={`group rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 ${
						isDarkReader
							? 'border-stone-700 bg-stone-900/78 hover:border-emerald-500/60'
							: 'border-slate-200 bg-white/85 hover:border-emerald-200 hover:bg-white'
					}`}
				>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] opacity-55">Sebelumnya</p>
					<p class="mt-2 font-semibold">Bab {previousChapter.chapterNumber}: {previousChapter.title}</p>
				</a>
			{:else}
				<div class={`rounded-[1.5rem] border border-dashed p-5 opacity-65 ${softCardClass}`}>
					<p class="text-xs font-semibold uppercase tracking-[0.22em]">Sebelumnya</p>
					<p class="mt-2 font-semibold">Ini bab pertama.</p>
				</div>
			{/if}

			{#if nextChapter}
				<a
					href={`/buku/${book.slug}/bab/${nextChapter.chapterNumber}`}
					class={`group rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 sm:text-right ${
						isDarkReader
							? 'border-stone-700 bg-stone-900/78 hover:border-emerald-500/60'
							: 'border-slate-200 bg-white/85 hover:border-emerald-200 hover:bg-white'
					}`}
				>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] opacity-55">Berikutnya</p>
					<p class="mt-2 font-semibold">Bab {nextChapter.chapterNumber}: {nextChapter.title}</p>
				</a>
			{:else}
				<div class={`rounded-[1.5rem] border border-dashed p-5 opacity-65 sm:text-right ${softCardClass}`}>
					<p class="text-xs font-semibold uppercase tracking-[0.22em]">Berikutnya</p>
					<p class="mt-2 font-semibold">Ini bab terakhir.</p>
				</div>
			{/if}
		</footer>
	</div>
</div>

<style>
	.reader-content {
		font-family:
			'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif;
		letter-spacing: 0.005em;
	}

	.reader-content p + p {
		margin-top: 1.45rem;
	}

	.reader-content p {
		text-wrap: pretty;
	}

	.book-paper::before {
		background:
			linear-gradient(90deg, rgba(120, 75, 30, 0.08), transparent 11%, transparent 89%, rgba(120, 75, 30, 0.06)),
			linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 38%);
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.book-paper > * {
		position: relative;
	}

	@media (prefers-reduced-motion: no-preference) {
		.reader-enter {
			animation: reader-page-enter 420ms ease-out both;
		}
	}

	@keyframes reader-page-enter {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.99);
		}

		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
