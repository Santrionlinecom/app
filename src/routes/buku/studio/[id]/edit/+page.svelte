<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type BookFormValues = {
		title?: string;
		description?: string;
		category?: string;
		coverUrl?: string;
		freeChapterLimit?: number;
		pricePerChapter?: number;
	};

	const slugify = (value: string) =>
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.replace(/-{2,}/g, '-');

	const chapterStatusTone = (status: string) =>
		status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';
	const bookStatusLabel = (status: string) =>
		({
			draft: 'Draft',
			pending: 'Menunggu Review',
			published: 'Terbit',
			rejected: 'Ditolak',
			archived: 'Diarsipkan'
		})[status] ?? status;
	const bookStatusTone = (status: string) =>
		({
			draft: 'bg-slate-100 text-slate-700',
			pending: 'bg-amber-100 text-amber-700',
			published: 'bg-emerald-100 text-emerald-700',
			rejected: 'bg-rose-100 text-rose-700',
			archived: 'bg-zinc-100 text-zinc-700'
		})[status] ?? 'bg-slate-100 text-slate-700';

	const values = (form && 'values' in form ? form.values : {}) as BookFormValues;
	let title = values.title ?? data.book.title;
	$: slugPreview = slugify(title) || data.book.slug;
	$: chapters = Array.isArray(data.chapters) ? data.chapters : [];
	$: canSubmitReview = data.book.status === 'draft' || data.book.status === 'rejected';
	$: canEditBook = data.book.status === 'draft' || data.book.status === 'rejected';
</script>

<svelte:head>
	<title>Edit {data.book.title} - Studio Buku</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 pb-10">
	<header class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<a href="/buku/studio" class="text-sm font-medium text-emerald-700 hover:text-emerald-800">Kembali ke Studio</a>
		<div class="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
			<div>
				<h1 class="text-3xl font-semibold text-slate-900 md:text-4xl">Edit buku</h1>
				<p class="mt-3 text-sm leading-7 text-slate-600">
					Atur metadata buku, ajukan review ke admin, lalu kelola bab di bagian bawah.
				</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${bookStatusTone(data.book.status)}`}>
						{bookStatusLabel(data.book.status)}
					</span>
					{#if data.book.status === 'pending'}
						<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 ring-1 ring-amber-200">
							Menunggu keputusan admin
						</span>
					{/if}
				</div>
			</div>
			{#if data.book.status === 'published'}
				<a href={`/buku/${data.book.slug}`} class="btn btn-outline">Lihat Publik</a>
			{/if}
		</div>
	</header>

	<form method="POST" class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
		{#if form?.error}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{form.error}
			</div>
		{:else if data.saved}
			<div class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
				Perubahan buku tersimpan.
			</div>
		{:else if data.reviewSubmitted}
			<div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
				Buku diajukan untuk review admin.
			</div>
		{/if}

		{#if form && 'reviewError' in form && form.reviewError}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{form.reviewError}
			</div>
		{/if}

		{#if data.book.status === 'rejected' && data.book.adminNote}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
				<p class="font-semibold">Catatan admin</p>
				<p class="mt-2 leading-7">{data.book.adminNote}</p>
			</div>
		{/if}

		{#if !canEditBook}
			<div class="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
				Buku dengan status {bookStatusLabel(data.book.status)} bersifat read-only di studio. Perubahan
				konten setelah review belum didukung pada tahap ini.
			</div>
		{/if}

		<div class="grid gap-5">
			<div class="grid gap-5">
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Judul Buku</span>
					<input
						name="title"
						class="input input-bordered mt-2 w-full"
						bind:value={title}
						required
						minlength="3"
						maxlength="140"
						disabled={!canEditBook}
					/>
				</label>
			</div>

			<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Slug Otomatis Saat Disimpan</p>
				<p class="mt-2 break-all text-sm font-semibold text-slate-900">/buku/{slugPreview}</p>
			</div>

			<label class="block">
				<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sinopsis</span>
				<textarea
					name="description"
					class="textarea textarea-bordered mt-2 min-h-40 w-full"
					maxlength="5000"
					disabled={!canEditBook}
				>{values.description ?? data.book.description ?? ''}</textarea>
			</label>

			<div class="grid gap-5 md:grid-cols-2">
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Kategori</span>
					<input
						name="category"
						class="input input-bordered mt-2 w-full"
						value={values.category ?? data.book.category ?? ''}
						maxlength="80"
						disabled={!canEditBook}
					/>
				</label>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cover URL Manual</span>
					<input
						name="coverUrl"
						type="url"
						class="input input-bordered mt-2 w-full"
						value={values.coverUrl ?? data.book.coverUrl ?? ''}
						disabled={!canEditBook}
					/>
				</label>
			</div>

			<div class="grid gap-5 md:grid-cols-2">
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bab Gratis</span>
					<input
						name="freeChapterLimit"
						type="number"
						class="input input-bordered mt-2 w-full"
						min="0"
						max="200"
						value={values.freeChapterLimit ?? data.book.freeChapterLimit}
						disabled={!canEditBook}
					/>
				</label>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Harga Per Bab</span>
					<input
						name="pricePerChapter"
						type="number"
						class="input input-bordered mt-2 w-full"
						min="0"
						max="1000000"
						value={values.pricePerChapter ?? data.book.pricePerChapter}
						disabled={!canEditBook}
					/>
				</label>
			</div>
		</div>

		{#if canEditBook}
			<div class="mt-8 flex flex-col gap-3 sm:flex-row">
				<button type="submit" class="btn btn-primary">Simpan Buku</button>
				<a href={`/buku/studio/${data.book.id}/chapters/new`} class="btn btn-outline">Tambah Bab</a>
			</div>
		{/if}
	</form>

	{#if canSubmitReview}
		<section class="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm md:p-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Moderasi Buku</p>
					<h2 class="mt-2 text-xl font-semibold text-slate-900">Ajukan ke admin untuk diterbitkan</h2>
					<p class="mt-2 text-sm leading-7 text-slate-700">
						Setelah diajukan, status menjadi Menunggu Review dan buku belum tampil publik sampai admin approve.
					</p>
				</div>
				<form method="POST" action="?/submitReview">
					<button type="submit" class="btn btn-primary w-full md:w-auto">Ajukan Review</button>
				</form>
			</div>
		</section>
	{/if}

	<section id="chapters" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Bab Buku</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Daftar bab</h2>
			</div>
			{#if canEditBook}
				<a href={`/buku/studio/${data.book.id}/chapters/new`} class="btn btn-primary w-full md:w-auto">Tambah Bab</a>
			{/if}
		</div>

		{#if chapters.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada bab.</p>
				<p class="mt-2 text-sm text-slate-500">Tambahkan bab pertama agar buku bisa dibaca.</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each chapters as chapter}
					<a
						href={`/buku/studio/${data.book.id}/chapters/${chapter.id}/edit`}
						class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
					>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div class="flex flex-wrap gap-2">
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
										Bab {chapter.chapterNumber}
									</span>
									<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${chapterStatusTone(chapter.status)}`}>
										{chapter.status === 'published' ? 'Published' : 'Draft'}
									</span>
								</div>
								<h3 class="mt-3 text-lg font-semibold text-slate-900">{chapter.title}</h3>
							</div>
							<span class="btn btn-sm btn-outline">{canEditBook ? 'Edit Bab' : 'Lihat Bab'}</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
