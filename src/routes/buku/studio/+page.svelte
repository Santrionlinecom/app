<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const statusLabel: Record<string, string> = {
		draft: 'Draft',
		pending: 'Menunggu Review',
		published: 'Terbit',
		rejected: 'Ditolak',
		archived: 'Diarsipkan'
	};

	const statusTone = (status: string) =>
		({
			draft: 'bg-slate-100 text-slate-700',
			pending: 'bg-amber-100 text-amber-700',
			published: 'bg-emerald-100 text-emerald-700',
			rejected: 'bg-rose-100 text-rose-700',
			archived: 'bg-zinc-100 text-zinc-700'
		})[status] ?? 'bg-slate-100 text-slate-700';
	const canEditBook = (status: string) => status === 'draft' || status === 'rejected';

	$: books = Array.isArray(data.books) ? data.books : [];
</script>

<svelte:head>
	<title>Studio Buku - SantriOnline</title>
	<meta name="description" content="Dashboard penulis untuk mengelola buku dan bab SantriOnline." />
</svelte:head>

<div class="space-y-8 pb-10">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_50%,_#064e3b_100%)] px-5 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute -right-16 top-0 h-44 w-44 rounded-full bg-emerald-200/10 blur-3xl"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
			<div class="max-w-3xl">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/75">Studio Penulis</p>
				<h1 class="mt-3 text-3xl font-bold leading-tight md:text-5xl">Kelola buku dan bab SantriOnline</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Buat draft buku, susun bab, lalu ajukan review. Buku baru tampil publik setelah admin
					menyetujui penerbitan.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="/buku/studio/new" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Buat Buku Baru
					</a>
					<a href="/buku/studio/earnings" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Lihat Pendapatan
					</a>
					<a href="/buku" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Lihat Katalog
					</a>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Total Buku</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalBooks}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Total Bab</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalChapters}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Draft</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.draftBooks}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Published</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.publishedBooks}</p>
				</div>
			</div>
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Karya Saya</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Buku yang Anda tulis</h2>
			</div>
			<a href="/buku/studio/new" class="btn btn-primary w-full md:w-auto">Buat Buku</a>
		</div>

		{#if books.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada buku.</p>
				<p class="mt-2 text-sm text-slate-500">Mulai dari draft buku pertama, lalu tambahkan bab dari halaman edit.</p>
				<a href="/buku/studio/new" class="btn btn-primary mt-5">Buat Buku Pertama</a>
			</div>
		{:else}
			<div class="grid gap-5 xl:grid-cols-2">
				{#each books as book}
					<article class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
						<div class="grid gap-0 md:grid-cols-[0.36fr_0.64fr]">
							<div class="bg-gradient-to-br from-emerald-50 via-white to-amber-50">
								{#if book.coverUrl}
									<img src={book.coverUrl} alt={`Cover ${book.title}`} class="h-full min-h-[220px] w-full object-cover" />
								{:else}
									<div class="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
										Cover belum diisi.
									</div>
								{/if}
							</div>
							<div class="p-5">
								<div class="flex flex-wrap gap-2">
									<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusTone(book.status)}`}>
										{statusLabel[book.status] ?? book.status}
									</span>
									{#if book.category}
										<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
											{book.category}
										</span>
									{/if}
								</div>
								<h3 class="mt-4 text-2xl font-semibold text-slate-900">{book.title}</h3>
								<p class="mt-2 text-xs text-slate-400">/buku/{book.slug}</p>
								{#if book.status === 'rejected' && book.adminNote}
									<div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
										<p class="font-semibold">Catatan admin</p>
										<p class="mt-1 leading-6">{book.adminNote}</p>
									</div>
								{/if}

								<div class="mt-5 grid grid-cols-3 gap-3">
									<div class="rounded-2xl bg-slate-50 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.2em] text-slate-400">Bab</p>
										<p class="mt-1 text-lg font-semibold text-slate-900">{book.totalChapterCount}</p>
									</div>
									<div class="rounded-2xl bg-emerald-50 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.2em] text-emerald-600">Live</p>
										<p class="mt-1 text-lg font-semibold text-emerald-800">{book.publishedChapterCount}</p>
									</div>
									<div class="rounded-2xl bg-amber-50 px-4 py-3">
										<p class="text-xs uppercase tracking-[0.2em] text-amber-600">Gratis</p>
										<p class="mt-1 text-lg font-semibold text-amber-800">{book.freeChapterLimit}</p>
									</div>
								</div>

								<div class="mt-5 flex flex-col gap-2 sm:flex-row">
									<a href={`/buku/studio/${book.id}/edit`} class="btn btn-primary flex-1">Edit Buku</a>
									{#if canEditBook(book.status)}
										<a href={`/buku/studio/${book.id}/chapters/new`} class="btn btn-outline flex-1">Tambah Bab</a>
									{/if}
									{#if book.status === 'published'}
										<a href={`/buku/${book.slug}`} class="btn btn-ghost flex-1">Lihat Publik</a>
									{/if}
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>
