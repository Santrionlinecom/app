<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type ChapterFormValues = {
		chapterNumber?: number;
		title?: string;
		content?: string;
		status?: string;
	};

	const values = (form && 'values' in form ? form.values : {}) as ChapterFormValues;
</script>

<svelte:head>
	<title>Tambah Bab - {data.book.title}</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 pb-10">
	<header class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<a href={`/buku/studio/${data.book.id}/edit#chapters`} class="text-sm font-medium text-emerald-700 hover:text-emerald-800">
			Kembali ke Buku
		</a>
		<h1 class="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">Tambah bab baru</h1>
		<p class="mt-3 text-sm leading-7 text-slate-600">{data.book.title}</p>
	</header>

	<form method="POST" class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
		{#if form?.error}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{form.error}
			</div>
		{/if}

		<div class="grid gap-5">
			<div class="grid gap-5 md:grid-cols-[180px_1fr_220px]">
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nomor Bab</span>
					<input
						name="chapterNumber"
						type="number"
						class="input input-bordered mt-2 w-full"
						min="1"
						max="10000"
						value={values.chapterNumber ?? data.nextChapterNumber}
						required
					/>
				</label>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Judul Bab</span>
					<input
						name="title"
						class="input input-bordered mt-2 w-full"
						value={values.title ?? ''}
						required
						minlength="2"
						maxlength="160"
					/>
				</label>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status Bab</span>
					<select name="status" class="select select-bordered mt-2 w-full">
						<option value="draft" selected={(values.status ?? 'draft') === 'draft'}>Draft</option>
						<option value="published" selected={values.status === 'published'}>Published</option>
					</select>
				</label>
			</div>

			<label class="block">
				<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Konten Bab</span>
				<textarea
					name="content"
					class="textarea textarea-bordered mt-2 min-h-[420px] w-full font-serif text-base leading-8"
					placeholder="Tulis isi bab di sini. Pisahkan paragraf dengan baris kosong agar nyaman dibaca."
					required
				>{values.content ?? ''}</textarea>
			</label>
		</div>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row">
			<button type="submit" class="btn btn-primary">Simpan Bab</button>
			<a href={`/buku/studio/${data.book.id}/edit#chapters`} class="btn btn-outline">Batal</a>
		</div>
	</form>
</div>
