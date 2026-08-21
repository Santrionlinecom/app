<script lang="ts">
	import { tick } from 'svelte';
	import PdfReader from '$lib/components/drm/PdfReader.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let hasAccess = data.hasAccess;
	let coinBalance = data.user?.coinBalance ?? 0;
	let isUnlocking = false;
	let unlockError = '';
	let isChapterListOpen = false;
	let chapterSearch = '';
	let chapterListEl: HTMLElement | null = null;

	$: book = data.book;
	$: chapter = data.chapter;
	$: canUnlock = Boolean(data.user && chapter && coinBalance >= data.coinCost);
	$: readerTitle = chapter ? `Bab ${chapter.chapterNumber}: ${chapter.title}` : book.title;
	$: initialPage = data.progress?.currentPage ?? 1;
	$: chapterIndex = chapter ? data.chapters.findIndex((item) => item.id === chapter.id) : -1;
	$: prevChapter = chapterIndex > 0 ? data.chapters[chapterIndex - 1] : null;
	$: nextChapter =
		chapterIndex >= 0 && chapterIndex < data.chapters.length - 1
			? data.chapters[chapterIndex + 1]
			: null;
	$: filteredChapters = chapterSearch.trim()
		? data.chapters.filter((item) => {
				const query = chapterSearch.trim().toLowerCase();
				return (
					String(item.chapterNumber).includes(query) ||
					item.title.toLowerCase().includes(query)
				);
			})
		: data.chapters;

	async function openChapterList() {
		isChapterListOpen = true;
		chapterSearch = '';
		await tick();
		chapterListEl
			?.querySelector('[data-active="true"]')
			?.scrollIntoView({ block: 'center' });
	}

	function closeChapterList() {
		isChapterListOpen = false;
	}

	function handleDrawerKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeChapterList();
	}

	async function unlockChapter() {
		if (!chapter || isUnlocking) return;
		isUnlocking = true;
		unlockError = '';

		try {
			const response = await fetch('/api/drm/check-access', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bookId: book.id, chapterId: chapter.id })
			});
			const payload = await response.json().catch(() => ({}));

			if (!response.ok || !payload.success) {
				unlockError = payload.message || payload.error || 'Akses belum berhasil dibuka.';
				return;
			}

			coinBalance = Number(payload.balance ?? coinBalance);
			hasAccess = true;
		} catch (err) {
			console.error('Unlock chapter error:', err);
			unlockError = 'Akses belum berhasil dibuka. Coba beberapa saat lagi.';
		} finally {
			isUnlocking = false;
		}
	}
</script>

<svelte:head>
	<title>{readerTitle} - Reader SantriOnline</title>
	<meta
		name="description"
		content={`Baca ${readerTitle} di reader SantriOnline dengan progress tersimpan.`}
	/>
</svelte:head>

<svelte:window on:keydown={isChapterListOpen ? handleDrawerKeydown : undefined} />

<div class="mx-auto min-h-screen w-full max-w-[1440px] space-y-6 px-4 pb-36 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-10">
	<header class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<a href={`/buku/${book.slug}`} class="text-sm font-semibold text-emerald-600 hover:text-emerald-600">
					Kembali ke detail buku
				</a>
				<p class="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Reader Buku</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">{readerTitle}</h1>
				<p class="mt-2 text-sm text-slate-500">{book.title}</p>
			</div>

			{#if chapter && data.chapters.length > 1}
				<div class="flex flex-wrap items-center gap-2">
					{#if prevChapter}
						<a
							href={`/buku/${book.slug}/baca?chapter=${prevChapter.chapterNumber}`}
							class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
						>
							← Bab sebelumnya
						</a>
					{/if}
					<button
						type="button"
						class="rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
						on:click={openChapterList}
					>
						Daftar Bab ({data.chapters.length})
					</button>
					{#if nextChapter}
						<a
							href={`/buku/${book.slug}/baca?chapter=${nextChapter.chapterNumber}`}
							class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
						>
							Bab berikutnya →
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</header>

	{#if hasAccess && data.user}
		<PdfReader
			bookId={book.id}
			chapterId={chapter?.id ?? ''}
			userName={data.user.name}
			initialPage={initialPage}
			totalPages={data.progress?.totalPages ?? 0}
		/>

		{#if chapter && (prevChapter || nextChapter)}
			<nav class="flex items-center justify-between gap-3" aria-label="Navigasi bab">
				{#if prevChapter}
					<a
						href={`/buku/${book.slug}/baca?chapter=${prevChapter.chapterNumber}`}
						class="btn btn-outline min-h-[44px] flex-1 sm:flex-none sm:px-6"
					>
						← Bab {prevChapter.chapterNumber}
					</a>
				{:else}
					<span></span>
				{/if}
				{#if nextChapter}
					<a
						href={`/buku/${book.slug}/baca?chapter=${nextChapter.chapterNumber}`}
						class="btn min-h-[44px] flex-1 border-none bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none sm:px-6"
					>
						Bab {nextChapter.chapterNumber} →
					</a>
				{/if}
			</nav>
		{/if}
	{:else}
		<section class="mx-auto max-w-2xl rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
				🔒
			</div>
			<h2 class="mt-4 text-2xl font-bold text-slate-950">Akses bacaan diperlukan</h2>
			{#if !data.user}
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Masuk lebih dulu untuk membaca buku dan menyimpan progress bacaan.
				</p>
				<a href="/auth" class="btn mt-6 border-none bg-emerald-600 px-7 text-white hover:bg-emerald-600">
					Masuk Sekarang
				</a>
			{:else if chapter}
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Buka {readerTitle} seharga <strong>{data.coinCost} koin</strong>. Progress bacaan akan tersimpan
					di akun kamu.
				</p>
				<p class="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
					Saldo kamu: {coinBalance} koin
				</p>

				{#if unlockError}
					<p class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{unlockError}
					</p>
				{/if}

				<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
					{#if canUnlock}
						<button
							type="button"
							class="btn min-h-[48px] border-none bg-emerald-600 px-8 text-white hover:bg-emerald-600"
							disabled={isUnlocking}
							on:click={unlockChapter}
						>
							{isUnlocking ? 'Membuka Akses...' : 'Buka Sekarang'}
						</button>
					{:else}
						<a href="/coins/topup" class="btn min-h-[48px] border-none bg-amber-500 px-8 text-white hover:bg-amber-600">
							Top Up Koin
						</a>
					{/if}
					<a href={`/buku/${book.slug}`} class="btn btn-outline min-h-[48px] px-8">Lihat Buku</a>
				</div>
			{:else}
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Buku ini belum memiliki bab yang dapat dibaca melalui reader.
				</p>
				<a href={`/buku/${book.slug}`} class="btn btn-outline mt-6 min-h-[48px] px-8">Lihat Buku</a>
			{/if}
		</section>
	{/if}
</div>

{#if isChapterListOpen && chapter}
	<div class="fixed inset-0 z-50 flex justify-end">
		<button
			type="button"
			class="absolute inset-0 bg-slate-950/50"
			aria-label="Tutup daftar bab"
			on:click={closeChapterList}
		></button>
		<div
			class="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Daftar bab"
		>
			<div class="flex items-center justify-between border-b border-slate-200 p-4">
				<h2 class="text-base font-bold text-slate-950">Daftar Bab</h2>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
					on:click={closeChapterList}
				>
					✕
				</button>
			</div>

			<div class="border-b border-slate-100 p-4">
				<input
					type="search"
					placeholder="Cari nomor atau judul bab..."
					class="input input-bordered w-full text-sm"
					bind:value={chapterSearch}
				/>
			</div>

			<div class="flex-1 overflow-y-auto p-2" bind:this={chapterListEl}>
				{#if filteredChapters.length === 0}
					<p class="p-4 text-center text-sm text-slate-500">Bab tidak ditemukan.</p>
				{:else}
					{#each filteredChapters as item (item.id)}
						<a
							href={`/buku/${book.slug}/baca?chapter=${item.chapterNumber}`}
							data-active={item.id === chapter.id}
							class={`flex items-baseline gap-3 rounded-xl px-4 py-3 text-sm transition ${
								item.id === chapter.id
									? 'bg-emerald-600 font-bold text-white'
									: 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
							}`}
							on:click={closeChapterList}
						>
							<span class={`shrink-0 text-xs font-bold ${item.id === chapter.id ? 'text-emerald-100' : 'text-slate-400'}`}>
								{item.chapterNumber}
							</span>
							<span class="min-w-0 truncate">{item.title}</span>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
