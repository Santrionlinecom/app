<script lang="ts">
	// src/routes/(app)/halaqah/+page.svelte
	// Halaqah santri. Yang ditonjolkan: balasan musyrif — bukan skor.
	// Satu kalimat dari ustadz lebih berarti dari seratus lencana.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mengirim = $state(false);

	const LABEL_STATUS: Record<string, string> = {
		submitted: 'Menunggu disimak',
		approved: 'Sudah disimak',
		rejected: 'Perlu diulang'
	};

	const LABEL_MUTU: Record<string, string> = {
		lancar: 'Lancar',
		cukup: 'Cukup',
		belum: 'Belum lancar'
	};

	function tanggalIndo(iso: string) {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}
</script>

<svelte:head>
	<title>Halaqah Saya | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<header class="mb-8">
		<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Halaqah</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
			Halaqah Saya
		</h1>
		<p class="mt-3 max-w-2xl leading-7 text-slate-600">
			Setoran Anda disimak dan dibalas langsung oleh musyrif — bukan dinilai mesin.
		</p>
	</header>

	{#if data.halaqah.length > 0}
		<section class="grid gap-4 sm:grid-cols-2">
			{#each data.halaqah as h (h.id)}
				<article class="rounded-2xl border border-slate-200 bg-white p-5">
					<p class="text-lg font-bold text-slate-900">{h.nama}</p>
					{#if h.ustadzNama}
						<p class="mt-1 text-sm text-slate-500">Musyrif: {h.ustadzNama}</p>
					{/if}
					<p class="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
						{h.jumlahAnggota} dari {h.kapasitas} santri
					</p>
				</article>
			{/each}
		</section>

		<section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
			<h2 class="text-lg font-bold text-slate-900">Kirim setoran</h2>

			<form
				method="POST"
				action="?/setor"
				class="mt-4 space-y-4"
				use:enhance={() => {
					mengirim = true;
					return async ({ update }) => {
						await update();
						mengirim = false;
					};
				}}
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-bold text-slate-900" for="halaqohId">Halaqah</label>
						<select id="halaqohId" name="halaqohId" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15">
							{#each data.halaqah as h (h.id)}
								<option value={h.id}>{h.nama}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-bold text-slate-900" for="jenis">Jenis</label>
						<select id="jenis" name="jenis" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15">
							<option value="hafalan">Hafalan baru</option>
							<option value="murojaah">Muroja'ah</option>
						</select>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
					<div>
						<label class="block text-sm font-bold text-slate-900" for="surah">Surah</label>
						<input id="surah" name="surah" placeholder="Al-Baqarah" autocomplete="off" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
					<div>
						<label class="block text-sm font-bold text-slate-900" for="ayatDari">Ayat dari</label>
						<input id="ayatDari" name="ayatDari" type="number" min="1" value="1" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
					<div>
						<label class="block text-sm font-bold text-slate-900" for="ayatSampai">Sampai</label>
						<input id="ayatSampai" name="ayatSampai" type="number" min="1" value="5" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
				</div>

				<div>
					<label class="block text-sm font-bold text-slate-900" for="catatan">Catatan untuk musyrif (opsional)</label>
					<textarea id="catatan" name="catatan" rows="2" placeholder="Bagian yang masih terasa berat…" class="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"></textarea>
				</div>

				<button type="submit" disabled={mengirim} class="min-h-[48px] w-full rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto">
					{mengirim ? 'Mengirim…' : 'Kirim setoran'}
				</button>
			</form>

			{#if form?.pesan}
				<p class="mt-3 text-sm font-semibold text-amber-700" role="alert">{form.pesan}</p>
			{/if}
			{#if form?.sukses}
				<p class="mt-3 text-sm font-semibold text-emerald-800" role="status">
					Setoran terkirim. Musyrif akan menyimak dan membalas.
				</p>
			{/if}
		</section>
	{:else}
		<section class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p class="font-bold text-slate-900">Belum tergabung di halaqah</p>
			<p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
				Mintalah pengurus lembaga memasukkan Anda ke sebuah halaqah. Halaqah sengaja
				dibatasi jumlahnya agar setiap santri benar-benar tersimak.
			</p>
		</section>
	{/if}

	{#if data.setoran.length > 0}
		<section class="mt-10">
			<h2 class="text-lg font-bold text-slate-900">Riwayat setoran</h2>
			<div class="mt-4 space-y-3">
				{#each data.setoran as s (s.id)}
					<article class="rounded-2xl border border-slate-200 bg-white p-5">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<p class="font-bold text-slate-900">
								{s.surah} {s.ayatDari}–{s.ayatSampai}
								<span class="ml-1 text-sm font-medium text-slate-500">
									({s.jenis === 'hafalan' ? 'Hafalan' : "Muroja'ah"})
								</span>
							</p>
							<p class="text-sm text-slate-500">{tanggalIndo(s.tanggal)}</p>
						</div>

						<p class="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
							{LABEL_STATUS[s.status] ?? s.status}
							{#if s.mutu && s.status !== 'submitted'}
								· {LABEL_MUTU[s.mutu] ?? s.mutu}
							{/if}
						</p>

						{#if s.balasan && s.dibalasAt}
							<div class="mt-4 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-4">
								<p class="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
									Balasan musyrif
								</p>
								<p class="mt-1 leading-7 text-slate-800">{s.balasan}</p>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/if}
</main>
