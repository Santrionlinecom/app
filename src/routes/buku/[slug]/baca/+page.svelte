<script lang="ts">
	import PdfReader from '$lib/components/drm/PdfReader.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let hasAccess = data.hasAccess;
	let coinBalance = data.user?.coinBalance ?? 0;
	let isUnlocking = false;
	let unlockError = '';

	$: book = data.book;
	$: chapter = data.chapter;
	$: canUnlock = Boolean(data.user && chapter && coinBalance >= data.coinCost);
	$: readerTitle = chapter ? `Bab ${chapter.chapterNumber}: ${chapter.title}` : book.title;
	$: initialPage = data.progress?.currentPage ?? 1;

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

<div class="space-y-6 pb-10">
	<header class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<a href={`/buku/${book.slug}`} class="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
					Kembali ke detail buku
				</a>
				<p class="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Reader Buku</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">{readerTitle}</h1>
				<p class="mt-2 text-sm text-slate-500">{book.title}</p>
			</div>

			{#if chapter && data.chapters.length > 1}
				<div class="flex flex-wrap gap-2">
					{#each data.chapters as item}
						<a
							href={`/buku/${book.slug}/baca?chapter=${item.chapterNumber}`}
							class={`rounded-full border px-3 py-2 text-xs font-bold transition ${
								item.id === chapter.id
									? 'border-emerald-600 bg-emerald-600 text-white'
									: 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700'
							}`}
						>
							Bab {item.chapterNumber}
						</a>
					{/each}
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
	{:else}
		<section class="mx-auto max-w-2xl rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
				🔒
			</div>
			<h2 class="mt-4 text-2xl font-bold text-slate-950">Akses bacaan diperlukan</h2>
			{#if !data.user}
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Masuk lebih dulu untuk membaca buku dan menyimpan progress bacaan.
				</p>
				<a href="/auth" class="btn mt-6 border-none bg-emerald-600 px-7 text-white hover:bg-emerald-700">
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
							class="btn min-h-[48px] border-none bg-emerald-600 px-8 text-white hover:bg-emerald-700"
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
