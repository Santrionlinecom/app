<script lang="ts">
	import type { ActionData } from './$types';

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

	const values = (form && 'values' in form ? form.values : {}) as BookFormValues;
	let title = values.title ?? '';
	let coverUrl = values.coverUrl ?? '';
	let isCoverUploading = false;
	let coverUploadError = '';

	$: slugPreview = slugify(title) || 'slug-otomatis';
	$: coverPreviewUrl = coverUrl.trim();

	const uploadCover = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		coverUploadError = '';

		if (!file) return;
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			coverUploadError = 'Format cover harus JPG, PNG, atau WebP.';
			input.value = '';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			coverUploadError = 'Ukuran cover maksimal 2MB.';
			input.value = '';
			return;
		}

		isCoverUploading = true;
		try {
			const uploadForm = new FormData();
			uploadForm.append('file', file);

			const response = await fetch('/api/upload/buku-cover', {
				method: 'POST',
				body: uploadForm
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok || typeof result.url !== 'string') {
				throw new Error(result.error || 'Gagal upload cover.');
			}

			coverUrl = result.url;
		} catch (err) {
			coverUploadError = err instanceof Error ? err.message : 'Gagal upload cover.';
		} finally {
			isCoverUploading = false;
			input.value = '';
		}
	};
</script>

<svelte:head>
	<title>Buat Buku Baru - Studio Buku</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 pb-10">
	<header class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<a href="/buku/studio" class="text-sm font-medium text-emerald-700 hover:text-emerald-800">Kembali ke Studio</a>
		<h1 class="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">Buat buku baru</h1>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Buku baru otomatis dibuat sebagai draft. Slug dibuat dari judul dan akan dibuat unik oleh server.
		</p>
	</header>

	<form method="POST" class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
		{#if form?.error}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{form.error}
			</div>
		{/if}

		<div class="grid gap-5">
			<label class="block">
				<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Judul Buku</span>
				<input
					name="title"
					class="input input-bordered mt-2 w-full"
					placeholder="Contoh: Langit Kecil di Pesantren"
					bind:value={title}
					required
					minlength="3"
					maxlength="140"
				/>
			</label>

			<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Slug Otomatis</p>
				<p class="mt-2 break-all text-sm font-semibold text-slate-900">/buku/{slugPreview}</p>
			</div>

			<label class="block">
				<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sinopsis</span>
				<textarea
					name="description"
					class="textarea textarea-bordered mt-2 min-h-36 w-full"
					placeholder="Tulis sinopsis singkat buku."
					maxlength="5000"
				>{values.description ?? ''}</textarea>
			</label>

			<div class="grid gap-5 md:grid-cols-2">
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Kategori</span>
					<input
						name="category"
						class="input input-bordered mt-2 w-full"
						placeholder="Novel Santri, Cerita Anak, Motivasi"
						value={values.category ?? ''}
						maxlength="80"
					/>
				</label>
				<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<label for="cover_upload" class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
						Upload Cover
					</label>
					<input
						id="cover_upload"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						class="file-input file-input-bordered mt-2 w-full"
						disabled={isCoverUploading}
						on:change={uploadCover}
					/>
					<p class="mt-2 text-xs leading-5 text-slate-500">
						Format JPG, PNG, atau WebP maksimal 2MB. URL cover akan terisi otomatis setelah upload.
					</p>
					{#if isCoverUploading}
						<p class="mt-2 text-xs font-semibold text-emerald-700">Mengupload cover...</p>
					{/if}
					{#if coverUploadError}
						<p class="mt-2 text-xs font-semibold text-rose-600">{coverUploadError}</p>
					{/if}
				</div>
			</div>

			<div class="grid gap-5 md:grid-cols-[12rem_1fr] md:items-start">
				<div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
					{#if coverPreviewUrl}
						<img src={coverPreviewUrl} alt="Preview cover buku" class="aspect-[3/4] w-full object-cover" />
					{:else}
						<div class="flex aspect-[3/4] items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
							Preview Cover
						</div>
					{/if}
				</div>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cover URL Manual</span>
					<input
						name="coverUrl"
						type="url"
						class="input input-bordered mt-2 w-full"
						placeholder="https://..."
						bind:value={coverUrl}
					/>
					<p class="mt-2 text-xs leading-5 text-slate-500">
						Field ini tetap tersedia sebagai fallback. Jika upload berhasil, URL R2 publik otomatis masuk di sini.
					</p>
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
						value={values.freeChapterLimit ?? 7}
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
						value={values.pricePerChapter ?? 300}
					/>
				</label>
			</div>
		</div>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row">
			<button type="submit" class="btn btn-primary" disabled={isCoverUploading}>
				{isCoverUploading ? 'Menunggu Upload...' : 'Simpan Draft Buku'}
			</button>
			<a href="/buku/studio" class="btn btn-outline">Batal</a>
		</div>
	</form>
</div>
