<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const statusLabel: Record<string, string> = {
		draft: 'Draft',
		pending: 'Pending',
		published: 'Published',
		rejected: 'Rejected',
		archived: 'Archived'
	};

	const statusTone = (status: string) =>
		({
			draft: 'bg-slate-100 text-slate-700',
			pending: 'bg-amber-100 text-amber-700',
			published: 'bg-emerald-100 text-emerald-700',
			rejected: 'bg-rose-100 text-rose-700',
			archived: 'bg-zinc-100 text-zinc-700'
		})[status] ?? 'bg-slate-100 text-slate-700';

	const shortText = (value: string | null | undefined, length = 130) => {
		const source = (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		if (!source) return 'Sinopsis belum diisi.';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	$: books = Array.isArray(data.books) ? data.books : [];
</script>

<svelte:head>
	<title>Moderasi Buku - Super Admin</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Super Admin</p>
				<h1 class="mt-2 text-3xl font-semibold text-slate-900">Moderasi Buku</h1>
				<p class="mt-2 text-sm leading-7 text-slate-600">
					Review buku yang diajukan penulis sebelum tampil di katalog publik.
				</p>
			</div>
			<a href="/admin/super/overview" class="btn btn-outline">Kembali ke Overview</a>
		</div>
	</section>

	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each data.statuses as status}
			<a
				href={`/admin/super/buku?status=${status}`}
				class="btn btn-sm {data.currentStatus === status ? 'btn-primary' : 'btn-outline'}"
			>
				{statusLabel[status]} ({data.counts[status] ?? 0})
			</a>
		{/each}
	</div>

	{#if books.length === 0}
		<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
			<p class="text-base font-semibold text-slate-900">Tidak ada buku dengan status {statusLabel[data.currentStatus]}.</p>
			<p class="mt-2 text-sm text-slate-500">Gunakan tab status untuk melihat antrean lain.</p>
		</div>
	{:else}
		<div class="grid gap-5 xl:grid-cols-2">
			{#each books as book}
				<article class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
					<div class="grid gap-0 md:grid-cols-[0.34fr_0.66fr]">
						<div class="bg-gradient-to-br from-emerald-50 via-white to-amber-50">
							{#if book.coverUrl}
								<img src={book.coverUrl} alt={`Cover ${book.title}`} class="h-full min-h-[220px] w-full object-cover" />
							{:else}
								<div class="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
									Cover belum tersedia.
								</div>
							{/if}
						</div>
						<div class="p-5">
							<div class="flex flex-wrap gap-2">
								<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusTone(book.status)}`}>
									{statusLabel[book.status]}
								</span>
								{#if book.category}
									<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
										{book.category}
									</span>
								{/if}
							</div>
							<h2 class="mt-4 text-2xl font-semibold text-slate-900">{book.title}</h2>
							<p class="mt-1 text-xs text-slate-400">/buku/{book.slug}</p>
							<p class="mt-3 text-sm leading-7 text-slate-600">{shortText(book.description)}</p>

							<div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
								<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Author</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{book.authorName ?? book.authorEmail ?? book.authorId}</p>
								{#if book.authorEmail}
									<p class="text-xs text-slate-500">{book.authorEmail}</p>
								{/if}
							</div>

							<div class="mt-4 grid grid-cols-3 gap-3">
								<div class="rounded-2xl bg-slate-50 px-4 py-3">
									<p class="text-xs uppercase tracking-[0.2em] text-slate-400">Bab</p>
									<p class="mt-1 text-lg font-semibold text-slate-900">{book.totalChapterCount}</p>
								</div>
								<div class="rounded-2xl bg-emerald-50 px-4 py-3">
									<p class="text-xs uppercase tracking-[0.2em] text-emerald-600">Published</p>
									<p class="mt-1 text-lg font-semibold text-emerald-800">{book.publishedChapterCount}</p>
								</div>
								<div class="rounded-2xl bg-amber-50 px-4 py-3">
									<p class="text-xs uppercase tracking-[0.2em] text-amber-600">Harga</p>
									<p class="mt-1 text-lg font-semibold text-amber-800">{book.pricePerChapter}</p>
								</div>
							</div>

							<div class="mt-5 flex flex-col gap-2 sm:flex-row">
								<a href={`/admin/super/buku/${book.id}`} class="btn btn-primary flex-1">Review Detail</a>
								{#if book.status === 'published'}
									<a href={`/buku/${book.slug}`} class="btn btn-outline flex-1">Lihat Publik</a>
								{/if}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
