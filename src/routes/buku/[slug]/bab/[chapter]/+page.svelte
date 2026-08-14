<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import InsufficientCoinNotice from '$lib/components/InsufficientCoinNotice.svelte';
	import { estimateBukuReadingMinutes, toBukuParagraphs } from '$lib/utils/buku-reader-text';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | null = null;

	type ReaderFontSize = 'small' | 'normal' | 'large';
	type ReaderTheme = 'light' | 'dark';

	const FONT_KEY = 'santrionline:buku:font-size';
	const THEME_KEY = 'santrionline:buku:theme';

	let fontSize: ReaderFontSize = 'normal';
	let theme: ReaderTheme = 'light';
	let settingsOpen = false;
	let shareStatus = '';
	let progressPercent = Number(data.readingProgress?.progressPercent ?? 0);
	let latestSavedProgress = progressPercent;
	let progressTimer: ReturnType<typeof setTimeout> | undefined;
	let chapterBookmarked = Boolean(data.chapterBookmark);
	let bookmarkBusy = false;
	let bookmarkError = '';

	type InsufficientCoinForm = {
		type: 'insufficient_coin';
		error: string;
		currentBalance?: number;
		requiredAmount?: number;
		shortfall?: number;
		productName?: string;
	};

	function isInsufficientCoinForm(value: unknown): value is InsufficientCoinForm {
		return (
			typeof value === 'object' &&
			value !== null &&
			'type' in value &&
			(value as { type?: unknown }).type === 'insufficient_coin'
		);
	}

	function getFormError(value: unknown): string {
		return typeof value === 'object' &&
			value !== null &&
			'error' in value &&
			typeof (value as { error?: unknown }).error === 'string'
			? (value as { error: string }).error
			: '';
	}

	$: book = data.book;
	$: chapter = data.chapter;
	$: isLocked = data.access === 'locked';
	$: paragraphs = toBukuParagraphs(chapter.content);
	$: readingMinutes = estimateBukuReadingMinutes(chapter.content);
	$: previousChapter = data.previousChapter;
	$: nextChapter = data.nextChapter;
	$: chapterPrice = Number(book.pricePerChapter ?? 0);
	$: insufficientCoinForm = isInsufficientCoinForm(form) ? form : null;
	$: walletBalance = Number(insufficientCoinForm?.currentBalance ?? data.walletBalance ?? 0);
	$: canUnlock = data.isLoggedIn && isLocked && walletBalance >= chapterPrice;
	$: formError = getFormError(form);
	$: articleSizeClass = fontSize === 'small' ? 'text-[17px]' : fontSize === 'large' ? 'text-[22px]' : 'text-[19px]';
	$: pageThemeClass = theme === 'dark' ? 'bg-[#171717] text-stone-100' : 'bg-[#f8f6f1] text-stone-900';
	$: mutedClass = theme === 'dark' ? 'text-stone-400' : 'text-stone-500';
	$: lineClass = theme === 'dark' ? 'border-stone-700' : 'border-stone-300';

	function persistSettings() {
		if (!browser) return;
		localStorage.setItem(FONT_KEY, fontSize);
		localStorage.setItem(THEME_KEY, theme);
	}

	function setFontSize(value: ReaderFontSize) {
		fontSize = value;
		persistSettings();
	}

	function setTheme(value: ReaderTheme) {
		theme = value;
		persistSettings();
	}

	function getScrollProgressPercent() {
		if (!browser) return 0;
		const scrollable = document.documentElement.scrollHeight - window.innerHeight;
		if (scrollable <= 0) return 100;
		return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
	}

	async function saveProgress(percent: number) {
		if (!data.isLoggedIn || isLocked || percent <= latestSavedProgress) return;
		try {
			const response = await fetch('/api/buku/progress', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ bookId: book.id, chapterId: chapter.id, progressPercent: percent })
			});
			if (!response.ok) return;
			const payload = await response.json();
			latestSavedProgress = Number(payload.progress?.progressPercent ?? percent);
		} catch {
			// Reading must remain available even when progress syncing fails.
		}
	}

	function queueProgressSave() {
		if (isLocked) return;
		progressPercent = Math.max(progressPercent, getScrollProgressPercent());
		if (!data.isLoggedIn || progressPercent < latestSavedProgress + 5) return;
		if (progressTimer) clearTimeout(progressTimer);
		progressTimer = setTimeout(() => saveProgress(progressPercent), 700);
	}

	async function toggleBookmark() {
		if (!data.isLoggedIn) {
			window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}
		if (bookmarkBusy) return;
		bookmarkBusy = true;
		bookmarkError = '';
		try {
			const response = await fetch('/api/buku/bookmark', {
				method: chapterBookmarked ? 'DELETE' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ bookId: book.id, chapterId: chapter.id })
			});
			if (!response.ok) throw new Error('Gagal memperbarui bookmark.');
			chapterBookmarked = !chapterBookmarked;
		} catch (error) {
			bookmarkError = error instanceof Error ? error.message : 'Gagal memperbarui bookmark.';
		} finally {
			bookmarkBusy = false;
		}
	}

	async function shareChapter() {
		const url = window.location.href;
		const shareData = { title: `${chapter.title} — ${book.title}`, text: `Baca ${chapter.title} dari ${book.title}`, url };
		try {
			if (navigator.share) await navigator.share(shareData);
			else {
				await navigator.clipboard.writeText(url);
				shareStatus = 'Tautan disalin';
				setTimeout(() => (shareStatus = ''), 1800);
			}
		} catch {
			// User cancelling the native share sheet is not an error.
		}
	}

	onMount(() => {
		const storedFont = localStorage.getItem(FONT_KEY);
		const storedTheme = localStorage.getItem(THEME_KEY);
		if (storedFont === 'small' || storedFont === 'normal' || storedFont === 'large') fontSize = storedFont;
		if (storedTheme === 'light' || storedTheme === 'dark') theme = storedTheme;

		if (!isLocked) {
			window.addEventListener('scroll', queueProgressSave, { passive: true });
			window.addEventListener('resize', queueProgressSave);
			queueProgressSave();
		}
		return () => {
			window.removeEventListener('scroll', queueProgressSave);
			window.removeEventListener('resize', queueProgressSave);
			if (progressTimer) clearTimeout(progressTimer);
			void saveProgress(getScrollProgressPercent());
		};
	});
</script>

<svelte:head>
	<title>{chapter.title} — {book.title} | SantriOnline</title>
	<meta name="description" content={`Baca ${chapter.title} dari buku ${book.title} di SantriOnline.`} />
</svelte:head>

<div class={`min-h-screen transition-colors ${pageThemeClass}`}>
	<header class={`sticky top-0 z-30 border-b backdrop-blur-xl ${lineClass} ${theme === 'dark' ? 'bg-[#171717]/95' : 'bg-[#f8f6f1]/95'}`}>
		<div class="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
			<a href={`/buku/${book.slug}`} class="grid h-10 w-10 place-items-center rounded-full hover:bg-black/10" aria-label="Kembali ke detail buku">←</a>
			<div class="min-w-0 flex-1 text-center">
				<p class={`truncate text-[11px] font-medium uppercase tracking-[0.16em] ${mutedClass}`}>{book.title}</p>
				<p class="truncate text-sm font-semibold">#{chapter.chapterNumber} · {chapter.title}</p>
			</div>
			<button type="button" class="grid h-10 w-10 place-items-center rounded-full hover:bg-black/10" on:click={shareChapter} aria-label="Bagikan bab">↗</button>
		</div>
		<div class="h-0.5 bg-black/10"><div class="h-full bg-emerald-600 transition-[width]" style={`width: ${Math.min(100, progressPercent)}%`}></div></div>
	</header>

	{#if shareStatus}<div class="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-xs text-white shadow-lg">{shareStatus}</div>{/if}

	<main class="mx-auto max-w-3xl px-5 pb-32 pt-10 sm:px-8 sm:pt-14">
		<header class={`mb-9 border-b pb-7 ${lineClass}`}>
			<p class={`mb-3 text-sm font-semibold ${mutedClass}`}>#{chapter.chapterNumber}</p>
			<h1 class="font-serif text-3xl font-bold leading-tight sm:text-4xl">{chapter.title}</h1>
			<div class={`mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm ${mutedClass}`}>
				<span>{readingMinutes > 0 ? `${readingMinutes} menit baca` : 'Bab terkunci'}</span>
				{#if data.isLoggedIn}<span>{Math.round(progressPercent)}% selesai</span>{/if}
			</div>
		</header>

		{#if isLocked}
			<section class={`mx-auto max-w-xl rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${lineClass} ${theme === 'dark' ? 'bg-stone-900' : 'bg-white/70'}`}>
				<p class="text-4xl">🔒</p>
				<h2 class="mt-4 text-xl font-bold">Buka bab ini</h2>
				<p class={`mt-2 text-sm leading-relaxed ${mutedClass}`}>Bab premium ini dapat dibaca dengan {chapterPrice} koin. Saldo Anda: {walletBalance} koin.</p>
				{#if data.isLoggedIn && !canUnlock}
			<div class="mt-5">
				<InsufficientCoinNotice
					currentBalance={Number(insufficientCoinForm?.currentBalance ?? walletBalance)}
					requiredAmount={Number(insufficientCoinForm?.requiredAmount ?? chapterPrice)}
					shortfall={Number(insufficientCoinForm?.shortfall ?? Math.max(0, chapterPrice - walletBalance))}
					productName={String(insufficientCoinForm?.productName ?? `${book.title} - Bab ${chapter.chapterNumber}`)}
				/>
			</div>
		{/if}
				{#if !data.isLoggedIn}
					<a href={`/auth?redirect=${encodeURIComponent(`/buku/${book.slug}/bab/${chapter.chapterNumber}`)}`} class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-6 font-semibold text-white">Masuk untuk melanjutkan</a>
				{:else if canUnlock}
					<form method="POST" action="?/unlock" class="mt-5">
						<button class="min-h-11 rounded-full bg-emerald-700 px-6 font-semibold text-white" type="submit">Buka dengan {chapterPrice} koin</button>
					</form>
				{:else}
					<a href="/coins/topup" class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-6 font-semibold text-white">Isi koin</a>
				{/if}
				{#if formError}<p class="mt-4 text-sm text-red-500">{formError}</p>{/if}
			</section>
		{:else}
			<article class={`reader-copy font-serif leading-[1.9] ${articleSizeClass}`}>
				{#each paragraphs as paragraph}
					<p>{paragraph}</p>
				{/each}
			</article>
		{/if}

		<nav class={`mt-14 grid gap-3 border-t pt-7 sm:grid-cols-2 ${lineClass}`} aria-label="Navigasi bab">
			{#if previousChapter}
				<a class={`rounded-2xl border p-4 transition hover:border-emerald-600 ${lineClass}`} href={`/buku/${book.slug}/bab/${previousChapter.chapterNumber}`}>
					<span class={`text-xs ${mutedClass}`}>← Sebelumnya</span><strong class="mt-1 block text-sm">{previousChapter.title}</strong>
				</a>
			{:else}<span></span>{/if}
			{#if nextChapter}
				<a class={`rounded-2xl border p-4 text-right transition hover:border-emerald-600 ${lineClass}`} href={`/buku/${book.slug}/bab/${nextChapter.chapterNumber}`}>
					<span class={`text-xs ${mutedClass}`}>Selanjutnya →</span><strong class="mt-1 block text-sm">{nextChapter.title}</strong>
				</a>
			{/if}
		</nav>
	</main>

	<footer class={`fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl ${lineClass} ${theme === 'dark' ? 'bg-[#171717]/95' : 'bg-[#f8f6f1]/95'}`}>
		<div class="relative mx-auto grid h-16 max-w-3xl grid-cols-3 px-4">
			<a href={`/buku/${book.slug}`} class="flex flex-col items-center justify-center gap-0.5 text-xs"><span class="text-xl">☰</span><span>Daftar Bab</span></a>
			<button type="button" class="flex flex-col items-center justify-center gap-0.5 text-xs" on:click={toggleBookmark} disabled={bookmarkBusy}><span class="text-xl">{chapterBookmarked ? '♥' : '♡'}</span><span>{chapterBookmarked ? 'Tersimpan' : 'Simpan'}</span></button>
			<button type="button" class="flex flex-col items-center justify-center gap-0.5 text-xs" on:click={() => (settingsOpen = !settingsOpen)} aria-expanded={settingsOpen}><span class="text-xl">Aa</span><span>Pengaturan</span></button>
			{#if settingsOpen}
				<div class={`absolute bottom-20 right-4 w-64 rounded-2xl border p-4 shadow-2xl ${lineClass} ${theme === 'dark' ? 'bg-stone-900' : 'bg-white'}`}>
					<p class="text-xs font-bold uppercase tracking-wide">Ukuran tulisan</p>
					<div class="mt-2 grid grid-cols-3 gap-2">
						{#each ['small', 'normal', 'large'] as size}
							<button type="button" class={`rounded-lg border py-2 text-sm ${fontSize === size ? 'border-emerald-600 bg-emerald-600 text-white' : lineClass}`} on:click={() => setFontSize(size as ReaderFontSize)}>{size === 'small' ? 'Kecil' : size === 'large' ? 'Besar' : 'Normal'}</button>
						{/each}
					</div>
					<p class="mt-4 text-xs font-bold uppercase tracking-wide">Tema</p>
					<div class="mt-2 grid grid-cols-2 gap-2">
						<button type="button" class={`rounded-lg border py-2 text-sm ${theme === 'light' ? 'border-emerald-600 bg-emerald-600 text-white' : lineClass}`} on:click={() => setTheme('light')}>Terang</button>
						<button type="button" class={`rounded-lg border py-2 text-sm ${theme === 'dark' ? 'border-emerald-600 bg-emerald-600 text-white' : lineClass}`} on:click={() => setTheme('dark')}>Gelap</button>
					</div>
				</div>
			{/if}
		</div>
		{#if bookmarkError}<p class="pb-2 text-center text-xs text-red-500">{bookmarkError}</p>{/if}
	</footer>
</div>

<style>
	.reader-copy p { margin: 0 0 1.35em; }
	.reader-copy p:first-child::first-letter { float: left; margin: 0.08em 0.12em 0 0; font-size: 3.2em; font-weight: 700; line-height: 0.8; }
</style>
