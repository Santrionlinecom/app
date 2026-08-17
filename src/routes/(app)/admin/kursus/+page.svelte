<script lang="ts">
	import { Pencil, Eye, BookOpen, Users } from 'lucide-svelte';

	let { data } = $props();

	const labelStatus = (s: string) =>
		({ published: 'Terbit', draft: 'Draft', archived: 'Arsip' })[s] ?? s;

	const warnaStatus = (s: string) =>
		s === 'published'
			? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
			: s === 'draft'
				? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
				: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
</script>

<svelte:head>
	<title>Kelola Kursus — SantriOnline</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Kelola Kursus</h1>
		<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
			Sunting judul, harga, status, dan isi materi.
		</p>
	</header>

	{#if data.kursus.length === 0}
		<p class="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
			Belum ada kursus.
		</p>
	{:else}
		<div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
			<table class="w-full text-sm">
				<thead class="bg-slate-50 text-left dark:bg-slate-900">
					<tr>
						<th class="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Judul</th>
						<th class="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
						<th class="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Harga</th>
						<th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
							Materi
						</th>
						<th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
							Peserta
						</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
					{#each data.kursus as k (k.id)}
						<tr class="bg-white dark:bg-slate-950">
							<td class="px-4 py-3">
								<span class="font-medium text-slate-900 dark:text-white">{k.judul}</span>
								<span class="mt-0.5 block text-xs text-slate-500">/{k.slug}</span>
							</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {warnaStatus(k.status)}">
									{labelStatus(k.status)}
								</span>
							</td>
							<td class="px-4 py-3 text-slate-700 dark:text-slate-300">
								{k.harga_koin === 0 ? 'Gratis' : `${k.harga_koin.toLocaleString('id-ID')} koin`}
							</td>
							<td class="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
								<span class="inline-flex items-center gap-1">
									<BookOpen class="h-3.5 w-3.5" />
									{k.jumlah_materi}
								</span>
							</td>
							<td class="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
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
										class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
									>
										<Eye class="h-4 w-4" />
									</a>
									<a
										href="/admin/kursus/{k.slug}/edit"
										title="Sunting"
										class="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
									>
										<Pencil class="h-4 w-4" />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
