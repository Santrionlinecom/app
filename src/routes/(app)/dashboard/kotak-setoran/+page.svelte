<script lang="ts">
	// src/routes/(app)/dashboard/kotak-setoran/+page.svelte
	// Kotak setoran musyrif. Balasan teks WAJIB — itu inti pilar ini.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let mengirim = $state('');

	function tanggalIndo(iso: string) {
		return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(iso));
	}
</script>

<svelte:head>
	<title>Kotak Setoran | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<header class="mb-8">
		<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Musyrif</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
			Kotak Setoran
		</h1>
		<p class="mt-3 max-w-2xl leading-7 text-slate-600">
			{data.menunggu.length} setoran menunggu disimak. Balasan Anda yang membuat santri
			merasa benar-benar didampingi.
		</p>
	</header>

	{#if form?.sukses}
		<p class="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800" role="status">
			Balasan terkirim. Jazakallahu khairan.
		</p>
	{/if}

	{#if data.menunggu.length > 0}
		<div class="space-y-4">
			{#each data.menunggu as s (s.id)}
				<article class="rounded-2xl border border-slate-200 bg-white p-6">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<p class="font-bold text-slate-900">{s.santriNama}</p>
						<p class="text-sm text-slate-500">{s.halaqahNama} · {tanggalIndo(s.tanggal)}</p>
					</div>
					<p class="mt-1 text-slate-700">
						{s.surah} {s.ayatDari}–{s.ayatSampai}
						<span class="text-sm text-slate-500">
							({s.jenis === 'hafalan' ? 'Hafalan' : "Muroja'ah"})
						</span>
					</p>

					<form
						method="POST"
						action="?/balas"
						class="mt-4 space-y-3"
						use:enhance={() => {
							mengirim = s.id;
							return async ({ update }) => {
								await update();
								mengirim = '';
							};
						}}
					>
						<input type="hidden" name="setoranId" value={s.id} />

						<div>
							<label class="block text-sm font-bold text-slate-900" for={`mutu-${s.id}`}>
								Penilaian bacaan
							</label>
							<select id={`mutu-${s.id}`} name="mutu" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 sm:w-auto">
								<option value="lancar">Lancar</option>
								<option value="cukup">Cukup</option>
								<option value="belum">Belum lancar</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-bold text-slate-900" for={`balasan-${s.id}`}>
								Balasan untuk santri <span class="font-normal text-slate-500">(wajib)</span>
							</label>
							<textarea
								id={`balasan-${s.id}`}
								name="balasan"
								rows="3"
								required
								placeholder="Alhamdulillah, tajwidnya sudah rapi. Perhatikan mad pada ayat ke-3 ya…"
								class="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
							></textarea>
						</div>

						<div class="flex flex-wrap gap-3">
							<button
								type="submit"
								name="keputusan"
								value="setuju"
								disabled={mengirim === s.id}
								class="min-h-[48px] rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:bg-slate-300"
							>
								{mengirim === s.id ? 'Mengirim…' : 'Terima setoran'}
							</button>
							<button
								type="submit"
								name="keputusan"
								value="ulangi"
								disabled={mengirim === s.id}
								class="min-h-[48px] rounded-xl border border-slate-300 px-6 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
							>
								Minta diulang
							</button>
						</div>
					</form>
				</article>
			{/each}
		</div>
	{:else}
		<section class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p class="font-bold text-slate-900">Tidak ada setoran menunggu</p>
			<p class="mt-2 text-sm text-slate-600">Semua setoran santri Anda sudah disimak.</p>
		</section>
	{/if}

	{#if form?.pesan}
		<p class="mt-4 text-sm font-semibold text-amber-700" role="alert">{form.pesan}</p>
	{/if}
</main>
