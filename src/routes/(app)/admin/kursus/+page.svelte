<script lang="ts">
	import { enhance } from '$app/forms';
	import { Pencil, Eye, BookOpen, Users, Plus, Trash2 } from '@lucide/svelte';

	let { data, form } = $props();

	let tambahTerbuka = $state(false);

	const labelStatus = (s: string) =>
		({ published: 'Terbit', draft: 'Draft', archived: 'Arsip' })[s] ?? s;

	// Aplikasi tidak mengaktifkan darkMode di Tailwind, jadi warna ditulis
	// eksplisit untuk latar terang. Varian `dark:` dulu membuat judul putih
	// di atas latar terang ketika HP memakai mode gelap.
	const warnaStatus = (s: string) =>
		s === 'published'
			? 'bg-emerald-50 text-emerald-700'
			: s === 'draft'
				? 'bg-amber-50 text-amber-700'
				: 'bg-slate-100 text-slate-600';

	const labelHarga = (harga: number) =>
		harga === 0 ? 'Gratis' : `${harga.toLocaleString('id-ID')} koin`;
</script>

<svelte:head>
	<title>Kelola Kursus — SantriOnline</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Kelola Kursus</h1>
			<p class="mt-1 text-sm text-slate-600">Sunting judul, harga, status, dan isi materi.</p>
		</div>

		<button
			type="button"
			class="inline-flex items-center gap-2 rounded-xl bg-so-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-so-green-2"
			onclick={() => (tambahTerbuka = !tambahTerbuka)}
		>
			<Plus class="h-4 w-4" />
			Kursus baru
		</button>
	</header>

	{#if form?.pesan}
		<p
			class="mb-4 rounded-xl border px-4 py-3 text-sm font-medium {form.berhasil
				? 'border-emerald-200 bg-emerald-50 text-emerald-800'
				: 'border-rose-200 bg-rose-50 text-rose-800'}"
			role="status"
		>
			{form.pesan}
		</p>
	{/if}

	{#if tambahTerbuka}
		<form
			method="POST"
			action="?/buat"
			use:enhance
			class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
		>
			<label class="block text-sm font-semibold text-slate-700" for="judul-kursus-baru">
				Judul kursus
			</label>
			<p class="mt-0.5 text-xs text-slate-500">
				Kursus dibuat sebagai draft. Rincian lain diisi di halaman sunting.
			</p>
			<div class="mt-2 flex flex-col gap-2 sm:flex-row">
				<input
					id="judul-kursus-baru"
					name="judul"
					required
					placeholder="Misal: Adab Menuntut Ilmu"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
				/>
				<button
					type="submit"
					class="shrink-0 rounded-lg bg-so-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-so-green-2"
				>
					Buat draft
				</button>
			</div>
		</form>
	{/if}

	{#if data.kursus.length === 0}
		<p
			class="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500"
		>
			Belum ada kursus.
		</p>
	{:else}
		<!-- Layar kecil: kartu, supaya tidak ada kolom yang terpotong. -->
		<ul class="space-y-3 md:hidden">
			{#each data.kursus as k (k.id)}
				<li class="rounded-xl border border-slate-200 bg-white p-4">
					<p class="font-semibold leading-snug text-slate-900">{k.judul}</p>
					<p class="mt-0.5 text-xs text-slate-500">/{k.slug}</p>

					<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
						<span class="rounded-full px-2 py-0.5 font-medium {warnaStatus(k.status)}">
							{labelStatus(k.status)}
						</span>
						<span class="font-medium text-slate-700">{labelHarga(k.harga_koin)}</span>
						<span class="inline-flex items-center gap-1 text-slate-600">
							<BookOpen class="h-3.5 w-3.5" />
							{k.jumlah_materi} materi
						</span>
						<span class="inline-flex items-center gap-1 text-slate-600">
							<Users class="h-3.5 w-3.5" />
							{k.jumlah_peserta} peserta
						</span>
					</div>

					<div class="mt-4 flex flex-wrap gap-2">
						<a
							href="/admin/kursus/{k.slug}/edit"
							class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
						>
							<Pencil class="h-4 w-4" />
							Sunting
						</a>
						<a
							href="/kursus/{k.slug}"
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
						>
							<Eye class="h-4 w-4" />
							Lihat
						</a>
						<form
							method="POST"
							action="?/hapus"
							use:enhance
							onsubmit={(event) => {
								if (!confirm(`Hapus kursus "${k.judul}"? Tindakan ini tidak bisa dibatalkan.`)) {
									event.preventDefault();
								}
							}}
						>
							<input type="hidden" name="slug" value={k.slug} />
							<button
								type="submit"
								title="Hapus kursus"
								class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
							>
								<Trash2 class="h-4 w-4" />
								Hapus
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>

		<!-- Layar sedang ke atas: tabel, tetap bisa digeser jika sempit. -->
		<div class="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
			<div class="overflow-x-auto">
				<table class="w-full min-w-[46rem] text-sm">
					<thead class="bg-slate-50 text-left">
						<tr>
							<th class="px-4 py-3 font-semibold text-slate-700">Judul</th>
							<th class="px-4 py-3 font-semibold text-slate-700">Status</th>
							<th class="px-4 py-3 font-semibold text-slate-700">Harga</th>
							<th class="px-4 py-3 text-center font-semibold text-slate-700">Materi</th>
							<th class="px-4 py-3 text-center font-semibold text-slate-700">Peserta</th>
							<th class="px-4 py-3 text-right font-semibold text-slate-700">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each data.kursus as k (k.id)}
							<tr class="bg-white">
								<td class="px-4 py-3">
									<span class="font-medium text-slate-900">{k.judul}</span>
									<span class="mt-0.5 block text-xs text-slate-500">/{k.slug}</span>
								</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {warnaStatus(k.status)}">
										{labelStatus(k.status)}
									</span>
								</td>
								<td class="px-4 py-3 text-slate-700">{labelHarga(k.harga_koin)}</td>
								<td class="px-4 py-3 text-center text-slate-600">
									<span class="inline-flex items-center gap-1">
										<BookOpen class="h-3.5 w-3.5" />
										{k.jumlah_materi}
									</span>
								</td>
								<td class="px-4 py-3 text-center text-slate-600">
									<span class="inline-flex items-center gap-1">
										<Users class="h-3.5 w-3.5" />
										{k.jumlah_peserta}
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<div class="inline-flex gap-1">
										<a
											href="/kursus/{k.slug}"
											target="_blank"
											rel="noreferrer"
											title="Lihat halaman"
											class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
										>
											<Eye class="h-4 w-4" />
										</a>
										<a
											href="/admin/kursus/{k.slug}/edit"
											title="Sunting"
											class="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
										>
											<Pencil class="h-4 w-4" />
										</a>
										<form
											method="POST"
											action="?/hapus"
											use:enhance
											onsubmit={(event) => {
												if (
													!confirm(`Hapus kursus "${k.judul}"? Tindakan ini tidak bisa dibatalkan.`)
												) {
													event.preventDefault();
												}
											}}
										>
											<input type="hidden" name="slug" value={k.slug} />
											<button
												type="submit"
												title="Hapus"
												class="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
