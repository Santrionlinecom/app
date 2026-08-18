<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: { error?: string; ok?: boolean } | null;

	const nextSteps = [
		{ title: 'Setoran harian', desc: 'Catat bacaan/hafalan sebagai data dasar ujian.', href: '/tpq/akademik/setoran' },
		{ title: 'Review setoran', desc: 'Setujui setoran sebelum dipakai rekap ujian.', href: '/tpq/akademik/review' },
		{ title: 'Riwayat akademik', desc: 'Lihat histori setoran per santri.', href: '/tpq/akademik/riwayat' }
	];

	const avg =
		data.exams.length > 0
			? Math.round(data.exams.reduce((sum, row) => sum + Number(row.nilai ?? 0), 0) / data.exams.length)
			: null;
</script>

<svelte:head>
	<title>Ujian Tahfidz</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-3xl border border-so-border bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 p-6 text-white shadow-sm">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Akademik lembaga</p>
		<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">Ujian Tahfidz</h1>
		<p class="mt-2 max-w-2xl text-sm leading-7 text-white/90">
			Catat hasil ujian hafalan per santri. Data tersimpan di lembaga aktif.
		</p>
	</section>

	{#if form?.error}
		<p class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{form.error}</p>
	{/if}
	{#if data.note}
		<p class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{data.note}</p>
	{/if}

	<section class="grid gap-3 md:grid-cols-3">
		<div class="rounded-xl border border-so-border bg-slate-50 p-4">
			<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Ujian tercatat</p>
			<p class="mt-2 text-2xl font-bold text-so-ink">{data.exams.length}</p>
		</div>
		<div class="rounded-xl border border-so-border bg-slate-50 p-4">
			<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Santri</p>
			<p class="mt-2 text-2xl font-bold text-so-ink">{data.santri.length}</p>
		</div>
		<div class="rounded-xl border border-so-border bg-slate-50 p-4">
			<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Nilai rata-rata</p>
			<p class="mt-2 text-2xl font-bold text-so-ink">{avg ?? '-'}</p>
		</div>
	</section>

	{#if data.canWrite && data.org}
		<form method="POST" action="?/catat" use:enhance class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold text-so-ink">Catat hasil ujian</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				<label class="text-sm font-semibold text-so-ink">
					Santri
					<select class="select select-bordered mt-1 w-full" name="santri_id" required>
						<option value="">Pilih santri</option>
						{#each data.santri as santri}
							<option value={santri.id}>{santri.nama}</option>
						{/each}
					</select>
				</label>
				<label class="text-sm font-semibold text-so-ink">
					Judul
					<input class="input input-bordered mt-1 w-full" name="judul" maxlength="80" placeholder="Ujian juz 30" />
				</label>
				<label class="text-sm font-semibold text-so-ink">
					Surah
					<select class="select select-bordered mt-1 w-full" name="surah" required>
						{#each data.surahOptions as surah}
							<option value={surah.number}>{surah.number}. {surah.name}</option>
						{/each}
					</select>
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="text-sm font-semibold text-so-ink">
						Ayat dari
						<input class="input input-bordered mt-1 w-full" name="ayat_from" type="number" min="1" value="1" required />
					</label>
					<label class="text-sm font-semibold text-so-ink">
						Ayat sampai
						<input class="input input-bordered mt-1 w-full" name="ayat_to" type="number" min="1" value="7" required />
					</label>
				</div>
				<label class="text-sm font-semibold text-so-ink">
					Nilai (0–100)
					<input class="input input-bordered mt-1 w-full" name="nilai" type="number" min="0" max="100" required />
				</label>
				<label class="text-sm font-semibold text-so-ink md:col-span-2">
					Catatan
					<input class="input input-bordered mt-1 w-full" name="catatan" maxlength="400" placeholder="Lancar / perlu murojaah" />
				</label>
			</div>
			<button class="btn mt-4 bg-so-green text-white hover:bg-so-green/90" type="submit">Simpan hasil</button>
		</form>
	{/if}

	<section class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
		<h2 class="text-lg font-bold text-so-ink">Hasil terakhir</h2>
		<div class="mt-4 overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Santri</th>
						<th>Judul</th>
						<th>Surah</th>
						<th>Ayat</th>
						<th>Nilai</th>
					</tr>
				</thead>
				<tbody>
					{#each data.exams as row}
						<tr>
							<td>{row.santriNama}</td>
							<td>{row.judul}</td>
							<td>{row.surah}</td>
							<td>{row.ayatFrom}–{row.ayatTo}</td>
							<td class="font-bold">{row.nilai}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="text-sm text-so-muted">Belum ada hasil ujian.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
		<h2 class="text-lg font-bold text-so-ink">Lanjut dari setoran</h2>
		<div class="mt-4 grid gap-3 md:grid-cols-3">
			{#each nextSteps as item}
				<a href={item.href} class="rounded-2xl border border-so-border bg-so-cream/50 p-4 transition hover:border-so-green/40">
					<p class="font-bold text-so-green">{item.title}</p>
					<p class="mt-1 text-sm leading-6 text-so-muted">{item.desc}</p>
				</a>
			{/each}
		</div>
	</section>
</div>
