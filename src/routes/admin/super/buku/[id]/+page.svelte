<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	const statusLabel: Record<string, string> = {
		draft: 'Draft',
		pending: 'Pending',
		published: 'Published',
		rejected: 'Rejected',
		archived: 'Archived'
	};

	const statusTone = (status: string) =>
		({
			draft: 'bg-slate-100 text-slate-700 border-slate-200',
			pending: 'bg-amber-100 text-amber-700 border-amber-200',
			published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
			rejected: 'bg-rose-100 text-rose-700 border-rose-200',
			archived: 'bg-zinc-100 text-zinc-700 border-zinc-200'
		})[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';

	const formatDate = (value: string | null | undefined) =>
		value
			? new Date(value).toLocaleDateString('id-ID', {
					day: '2-digit',
					month: 'long',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '-';

	$: book = data.book;
	$: chapters = Array.isArray(data.chapters) ? data.chapters : [];
	$: isPending = book.status === 'pending';
	$: isPublished = book.status === 'published';
</script>

<svelte:head>
	<title>{book.title} - Moderasi Buku</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
		<div class="grid gap-0 lg:grid-cols-[0.34fr_0.66fr]">
			<div class="bg-gradient-to-br from-emerald-50 via-white to-amber-50">
				{#if book.coverUrl}
					<img src={book.coverUrl} alt={`Cover ${book.title}`} class="h-full min-h-[320px] w-full object-cover" />
				{:else}
					<div class="flex h-full min-h-[320px] items-center justify-center px-8 text-center text-sm text-slate-500">
						Cover belum tersedia.
					</div>
				{/if}
			</div>
			<div class="p-6 md:p-8">
				<a href={`/admin/super/buku?status=${book.status}`} class="text-sm font-medium text-emerald-700 hover:text-emerald-800">
					Kembali ke daftar {statusLabel[book.status]}
				</a>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusTone(book.status)}`}>
						{statusLabel[book.status]}
					</span>
					{#if book.category}
						<span class="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
							{book.category}
						</span>
					{/if}
				</div>
				<h1 class="mt-4 text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">{book.title}</h1>
				<p class="mt-2 break-all text-xs text-slate-400">/buku/{book.slug}</p>
				<p class="mt-5 text-sm leading-8 text-slate-600 md:text-base">
					{book.description || 'Sinopsis belum diisi.'}
				</p>

				<div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Total Bab</p>
						<p class="mt-2 text-xl font-semibold text-slate-900">{book.totalChapterCount}</p>
					</div>
					<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.22em] text-emerald-600">Bab Published</p>
						<p class="mt-2 text-xl font-semibold text-emerald-800">{book.publishedChapterCount}</p>
					</div>
					<div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.22em] text-amber-600">Bab Gratis</p>
						<p class="mt-2 text-xl font-semibold text-amber-800">{book.freeChapterLimit}</p>
					</div>
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
						<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Harga</p>
						<p class="mt-2 text-xl font-semibold text-slate-900">{book.pricePerChapter} coin</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	{#if form?.error}
		<div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
			{form.error}
		</div>
	{/if}

	{#if data.saved}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
			Status buku berhasil diperbarui: {data.saved}.
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-semibold text-slate-900">Metadata Buku</h2>
			<div class="mt-5 space-y-4 text-sm">
				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Author</p>
					<p class="mt-1 font-semibold text-slate-900">{book.authorName ?? book.authorEmail ?? book.authorId}</p>
					{#if book.authorEmail}
						<p class="text-slate-500">{book.authorEmail}</p>
					{/if}
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Dibuat</p>
					<p class="mt-1 text-slate-700">{formatDate(book.createdAt)}</p>
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.22em] text-slate-400">Diupdate</p>
					<p class="mt-1 text-slate-700">{formatDate(book.updatedAt)}</p>
				</div>
				{#if book.adminNote}
					<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Catatan Admin</p>
						<p class="mt-2 leading-7 text-amber-950/80">{book.adminNote}</p>
					</div>
				{/if}
			</div>
		</section>

		<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-semibold text-slate-900">Aksi Moderasi</h2>
			<p class="mt-2 text-sm leading-7 text-slate-600">
				Approve hanya untuk buku pending. Reject wajib menyertakan catatan. Archive hanya untuk buku published.
			</p>

			<div class="mt-6 space-y-4">
				{#if isPending}
					<form method="POST" action="?/approve">
						<button type="submit" class="btn btn-primary w-full">Approve dan Publish</button>
					</form>

					<form method="POST" action="?/reject" class="space-y-3">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Catatan Penolakan</span>
							<textarea
								name="adminNote"
								class="textarea textarea-bordered mt-2 min-h-28 w-full"
								placeholder="Jelaskan alasan penolakan agar penulis bisa memperbaiki."
								required
							></textarea>
						</label>
						<button type="submit" class="btn btn-outline w-full border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50">
							Reject Buku
						</button>
					</form>
				{:else if isPublished}
					<form method="POST" action="?/archive" class="space-y-3">
						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Catatan Arsip</span>
							<textarea
								name="adminNote"
								class="textarea textarea-bordered mt-2 min-h-24 w-full"
								placeholder="Opsional, misalnya alasan buku perlu diarsipkan."
							></textarea>
						</label>
						<button type="submit" class="btn btn-outline w-full">Archive Buku</button>
					</form>
					<a href={`/buku/${book.slug}`} class="btn btn-primary w-full">Lihat Halaman Publik</a>
				{:else}
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
						Tidak ada aksi moderasi untuk status ini.
					</div>
				{/if}
			</div>
		</section>
	</div>

	<section class="space-y-4">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Daftar Bab</p>
			<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bab yang ditulis</h2>
		</div>

		{#if chapters.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada bab.</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each chapters as chapter}
					<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div class="flex flex-wrap gap-2">
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
										Bab {chapter.chapterNumber}
									</span>
									<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${chapter.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
										{chapter.status === 'published' ? 'Published' : 'Draft'}
									</span>
								</div>
								<h3 class="mt-3 text-lg font-semibold text-slate-900">{chapter.title}</h3>
							</div>
							{#if book.status === 'published' && chapter.status === 'published'}
								<a href={`/buku/${book.slug}/bab/${chapter.chapterNumber}`} class="btn btn-sm btn-outline">Lihat Publik</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
