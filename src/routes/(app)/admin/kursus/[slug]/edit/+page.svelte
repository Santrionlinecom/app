<script lang="ts">
	import { enhance } from '$app/forms';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import { ArrowLeft, Eye, Save, Loader2 } from '@lucide/svelte';

	let { data, form } = $props();

	/** Kursus ilmu agama: harga terkunci nol, tidak bisa diubah. */
	const kursusAgama = $derived(Boolean(data.kursusAgama));

	/** Materi yang sedang dibuka di editor. */
	let aktif = $state(0);

	const materiAktif = $derived(data.materi[aktif]);

	/**
	 * Isi yang sedang disunting.
	 *
	 * Blok {#key materiAktif.id} di bawah membuat ulang seluruh formulir
	 * setiap kali materi berganti atau data server diperbarui, sehingga nilai
	 * ini selalu dimulai dari isi terbaru — bukan salinan yang membeku saat
	 * halaman pertama dimuat.
	 */
	let isiSunting = $state('');
	let judulSunting = $state('');

	/**
	 * Menyetel ulang isi editor setiap kali materi berganti atau server
	 * mengirim data baru (mis. setelah menyimpan). Tanpa ini, suntingan
	 * materi pertama akan terbawa ke materi berikutnya.
	 */
	$effect(() => {
		const m = data.materi[aktif];
		if (!m) return;
		judulSunting = m.judul ?? '';
		isiSunting = m.isi ?? '';
	});

	let menyimpan = $state(false);
</script>

<svelte:head>
	<title>Sunting: {data.kursus.judul} — SantriOnline</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<a
			href="/admin/kursus"
			class="inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
		>
			<ArrowLeft class="h-4 w-4" />
			Semua kursus
		</a>
		<a
			href="/kursus/{data.kursus.slug}"
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
		>
			<Eye class="h-4 w-4" />
			Lihat halaman
		</a>
	</div>

	<h1 class="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
		{data.kursus.judul}
	</h1>

	{#if form?.pesan}
		<div
			class="mb-6 rounded-lg border px-4 py-3 text-sm {form.berhasil
				? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
				: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'}"
			role="status"
		>
			{form.pesan}
		</div>
	{/if}

	<!-- Keterangan kursus -->
	<section
		class="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
	>
		<h2 class="mb-4 font-semibold text-slate-900 dark:text-white">Keterangan kursus</h2>

		<form
			method="POST"
			action="?/kursus"
			use:enhance={() => {
				menyimpan = true;
				return async ({ update }) => {
					await update({ reset: false });
					menyimpan = false;
				};
			}}
			class="grid gap-4 sm:grid-cols-2"
		>
			<label class="sm:col-span-2">
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Judul</span>
				<input
					name="judul"
					value={data.kursus.judul}
					required
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				/>
			</label>

			<label class="sm:col-span-2">
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Ringkasan
				</span>
				<textarea
					name="ringkasan"
					rows="2"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					>{data.kursus.ringkasan ?? ''}</textarea
				>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Harga (koin)
				</span>
				<input
					name="harga_koin"
					type="number"
					min="0"
					value={data.kursus.harga_koin}
					disabled={kursusAgama}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
				/>
				{#if kursusAgama}
					<span class="mt-1 block text-xs font-medium text-emerald-700 dark:text-emerald-400">
						Ilmu agama wajib gratis di SantriOnline.
					</span>
				{:else}
					<span class="mt-1 block text-xs text-slate-500">0 berarti gratis</span>
				{/if}
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Durasi (menit)
				</span>
				<input
					name="durasi_menit"
					type="number"
					min="0"
					value={data.kursus.durasi_menit}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				/>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Kategori
				</span>
				<input
					name="kategori"
					value={data.kursus.kategori ?? ''}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				/>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Level</span>
				<select
					name="level"
					value={data.kursus.level}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				>
					<option value="dasar">Dasar</option>
					<option value="menengah">Menengah</option>
					<option value="lanjut">Lanjut</option>
				</select>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
				<select
					name="status"
					value={data.kursus.status}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				>
					<option value="draft">Draft</option>
					<option value="published">Terbit</option>
					<option value="archived">Arsip</option>
				</select>
			</label>

			<div class="sm:col-span-2">
				<button
					type="submit"
					disabled={menyimpan}
					class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900"
				>
					{#if menyimpan}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Save class="h-4 w-4" />
					{/if}
					Simpan keterangan
				</button>
			</div>
		</form>
	</section>

	<!-- Materi -->
	<section class="grid gap-6 md:grid-cols-[220px_1fr]">
		<nav class="md:sticky md:top-6 md:self-start">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Materi</p>
			<ol class="space-y-1">
				{#each data.materi as m, i (m.id)}
					<li>
						<button
							type="button"
							onclick={() => (aktif = i)}
							class="w-full rounded-lg px-3 py-2 text-left text-sm transition {aktif === i
								? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
								: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
						>
							<span class="mr-1.5 text-slate-400">{i + 1}.</span>
							{m.judul}
							{#if m.format !== 'html'}
								<span class="ml-1 text-xs text-amber-600" title="Masih format markdown">•</span>
							{/if}
						</button>
					</li>
				{/each}
			</ol>
			<p class="mt-3 px-3 text-xs leading-relaxed text-slate-500">
				Tanda <span class="text-amber-600">•</span> berarti materi masih markdown. Menyimpannya lewat
				editor akan mengubahnya menjadi HTML.
			</p>
		</nav>

		<div>
			{#if materiAktif}
				{#key materiAktif.id}
					<form
						method="POST"
						action="?/materi"
						use:enhance={() => {
							menyimpan = true;
							return async ({ update }) => {
								await update({ reset: false });
								menyimpan = false;
							};
						}}
						class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
					>
						<input type="hidden" name="id" value={materiAktif.id} />

						<label class="mb-4 block">
							<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Judul materi
							</span>
							<input
								name="judul"
								bind:value={judulSunting}
								required
								class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							/>
						</label>

						<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Isi materi
						</span>
						<RichTextEditor bind:value={isiSunting} />
						<input type="hidden" name="isi" value={isiSunting} />

						<div class="mt-5 flex items-center justify-between">
							<span class="text-xs text-slate-500">
								Materi {aktif + 1} dari {data.materi.length}
							</span>
							<button
								type="submit"
								disabled={menyimpan}
								class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
							>
								{#if menyimpan}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Save class="h-4 w-4" />
								{/if}
								Simpan materi
							</button>
						</div>
					</form>
				{/key}
			{:else}
				<p class="text-sm text-slate-500">Kursus ini belum punya materi.</p>
			{/if}
		</div>
	</section>
</div>
