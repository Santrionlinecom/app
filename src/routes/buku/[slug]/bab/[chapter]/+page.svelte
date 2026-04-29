<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

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

	$: book = data.book;
	$: chapter = data.chapter;
	$: isLocked = data.access === 'locked';
	$: isUnlocked = data.access === 'unlocked';
	$: paragraphs = toParagraphs(chapter.content);
	$: previousChapter = data.previousChapter;
	$: nextChapter = data.nextChapter;
	$: formBalance =
		form && 'balance' in form && typeof form.balance === 'number' ? form.balance : null;
	$: walletBalance = formBalance ?? data.walletBalance ?? 0;
	$: canUnlock = data.isLoggedIn && isLocked && walletBalance >= book.pricePerChapter;
</script>

<svelte:head>
	<title>{chapter.title} - {book.title}</title>
	<meta
		name="description"
		content={`Baca ${chapter.title} dari ${book.title} di Buku SantriOnline.`}
	/>
</svelte:head>

<div class="min-h-screen rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fef7ed_52%,_#ecfdf5_100%)] px-4 py-6 md:px-8 md:py-10">
	<div class="mx-auto max-w-4xl space-y-6">
		<nav class="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<a href="/buku" class="font-medium text-emerald-700 hover:text-emerald-800">Buku</a>
				<span class="px-2 text-slate-300">/</span>
				<a href={`/buku/${book.slug}`} class="font-medium text-emerald-700 hover:text-emerald-800">{book.title}</a>
				<span class="px-2 text-slate-300">/</span>
				<span>Bab {chapter.chapterNumber}</span>
			</div>
			<a href={`/buku/${book.slug}`} class="btn btn-sm btn-outline">Daftar Bab</a>
		</nav>

		<header class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur md:p-8">
			<div class="flex flex-wrap gap-2">
				<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
					Bab {chapter.chapterNumber}
				</span>
				<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${isLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
					{isLocked ? 'Terkunci' : isUnlocked ? 'Terbuka' : 'Gratis'}
				</span>
				{#if book.category}
					<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 ring-1 ring-slate-200">
						{book.category}
					</span>
				{/if}
			</div>
			<h1 class="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">{chapter.title}</h1>
			<p class="mt-3 text-sm leading-7 text-slate-500 md:text-base">{book.title}</p>

			<div class="mt-6 flex flex-col gap-3 sm:flex-row">
				{#if previousChapter}
					<a href={`/buku/${book.slug}/bab/${previousChapter.chapterNumber}`} class="btn btn-outline sm:flex-1">
						Bab Sebelumnya
					</a>
				{:else}
					<span class="btn btn-disabled sm:flex-1">Bab Sebelumnya</span>
				{/if}

				{#if nextChapter}
					<a href={`/buku/${book.slug}/bab/${nextChapter.chapterNumber}`} class="btn btn-primary sm:flex-1">
						Bab Berikutnya
					</a>
				{:else}
					<span class="btn btn-disabled sm:flex-1">Bab Berikutnya</span>
				{/if}
			</div>
		</header>

		<article class="rounded-[1.75rem] border border-amber-100 bg-[#fffaf0] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-9">
			<div class="rounded-[1.25rem] border border-amber-100/80 bg-white px-5 py-7 md:px-10 md:py-10">
				{#if isLocked}
					<div class="mx-auto max-w-2xl rounded-[1.5rem] border border-amber-200 bg-amber-50 px-6 py-10 text-center">
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Bab Premium</p>
						<h2 class="mt-3 text-2xl font-semibold text-slate-900">Bab ini terkunci</h2>
						<p class="mt-4 text-sm leading-7 text-slate-700">
							Bab ini bisa dibuka permanen memakai coin. Pengurangan coin hanya diproses di server.
						</p>
						<div class="mt-6 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm text-slate-600">
							Harga unlock: <span class="font-semibold text-slate-900">{book.pricePerChapter} coin</span>
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
							<div class="mt-5 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm text-slate-700">
								Coin belum cukup. Silakan topup coin terlebih dahulu.
								<p class="mt-2 text-xs text-slate-500">
									Saldo saat ini: {walletBalance} coin.
								</p>
							</div>
							<a href={`/buku/${book.slug}`} class="btn btn-outline mt-6">Kembali ke Daftar Bab</a>
						{:else}
							<form method="POST" action="?/unlock" class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
								<button type="submit" class="btn btn-primary">
									Buka Bab Ini - {book.pricePerChapter} Coin
								</button>
								<a href={`/buku/${book.slug}`} class="btn btn-outline">Kembali ke Daftar Bab</a>
							</form>
							<p class="mt-3 text-xs text-slate-500">
								Saldo setelah unlock: {walletBalance - book.pricePerChapter} coin.
							</p>
						{/if}
					</div>
				{:else if paragraphs.length > 0}
					<div class="reader-content mx-auto max-w-2xl font-serif text-[1.05rem] leading-9 text-slate-800 md:text-lg md:leading-10">
						{#each paragraphs as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{:else}
					<div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
						<p class="text-base font-semibold text-slate-900">Konten bab belum tersedia.</p>
						<p class="mt-2 text-sm text-slate-500">Bab ini sudah published, tetapi kontennya masih kosong.</p>
					</div>
				{/if}
			</div>
		</article>

		<footer class="grid gap-3 sm:grid-cols-2">
			{#if previousChapter}
				<a
					href={`/buku/${book.slug}/bab/${previousChapter.chapterNumber}`}
					class="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5 shadow-sm transition hover:border-emerald-200 hover:bg-white"
				>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Sebelumnya</p>
					<p class="mt-2 font-semibold text-slate-900">Bab {previousChapter.chapterNumber}: {previousChapter.title}</p>
				</a>
			{:else}
				<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/60 p-5 text-slate-400">
					<p class="text-xs font-semibold uppercase tracking-[0.22em]">Sebelumnya</p>
					<p class="mt-2 font-semibold">Ini bab pertama.</p>
				</div>
			{/if}

			{#if nextChapter}
				<a
					href={`/buku/${book.slug}/bab/${nextChapter.chapterNumber}`}
					class="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5 text-right shadow-sm transition hover:border-emerald-200 hover:bg-white"
				>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Berikutnya</p>
					<p class="mt-2 font-semibold text-slate-900">Bab {nextChapter.chapterNumber}: {nextChapter.title}</p>
				</a>
			{:else}
				<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/60 p-5 text-right text-slate-400">
					<p class="text-xs font-semibold uppercase tracking-[0.22em]">Berikutnya</p>
					<p class="mt-2 font-semibold">Ini bab terakhir.</p>
				</div>
			{/if}
		</footer>
	</div>
</div>

<style>
	.reader-content p + p {
		margin-top: 1.35rem;
	}
</style>
