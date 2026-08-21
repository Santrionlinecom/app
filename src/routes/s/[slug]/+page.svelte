<script lang="ts">
	// src/routes/s/[slug]/+page.svelte
	// Rapor publik — halaman yang dibagikan wali ke grup WA.
	// Harus terlihat pantas dibanggakan, bukan seperti tangkapan layar tabel.
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const r = $derived(data.rapor);

	function tanggalIndo(iso: string) {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(iso));
	}

	const judulBagikan = $derived(`${r.judul} — ${r.santriNama}`);
</script>

<svelte:head>
	<title>{judulBagikan} | SantriOnline</title>
	<meta name="description" content={`Rapor digital ${r.santriNama}${r.lembagaNama ? ` di ${r.lembagaNama}` : ''}, diterbitkan ${tanggalIndo(r.diterbitkanPada)}.`} />
	<meta property="og:title" content={judulBagikan} />
	<meta property="og:description" content={`Capaian belajar ${r.santriNama}${r.lembagaNama ? ` di ${r.lembagaNama}` : ''}.`} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="SantriOnline" />
	<meta property="og:locale" content="id_ID" />
	<!-- Publik atas pilihan pemiliknya, tapi tidak perlu diindeks mesin pencari. -->
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
	<article class="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
		<header class="bg-emerald-900 px-6 py-8 text-center text-white sm:px-10">
			<p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
				{r.lembagaNama ?? 'SantriOnline'}
			</p>
			<h1 class="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{r.judul}</h1>
			<p class="mt-4 text-xl font-bold text-amber-200">{r.santriNama}</p>
			<p class="mt-2 text-sm text-emerald-100/80">
				Periode {tanggalIndo(r.payload.periode.mulai)} – {tanggalIndo(r.payload.periode.selesai)}
			</p>
		</header>

		<div class="px-6 py-8 sm:px-10">
			<section>
				<h2 class="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Hafalan</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-3">
					<div class="rounded-2xl bg-slate-50 p-5 text-center">
						<p class="text-3xl font-extrabold text-emerald-900">{r.payload.hafalan.ayatDisetujui}</p>
						<p class="mt-1 text-sm text-slate-600">ayat disetorkan</p>
					</div>
					<div class="rounded-2xl bg-slate-50 p-5 text-center">
						<p class="text-3xl font-extrabold text-emerald-900">{r.payload.hafalan.setoranDisetujui}</p>
						<p class="mt-1 text-sm text-slate-600">setoran diterima</p>
					</div>
					<div class="rounded-2xl bg-slate-50 p-5 text-center">
						<p class="text-3xl font-extrabold text-emerald-900">{r.payload.hafalan.setoranTotal}</p>
						<p class="mt-1 text-sm text-slate-600">kali menyetor</p>
					</div>
				</div>
			</section>

			{#if r.payload.habit.length > 0}
				<section class="mt-8">
					<h2 class="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
						Kebiasaan yang dijaga
					</h2>
					<div class="mt-4 space-y-2">
						{#each r.payload.habit as h (h.misi)}
							<div class="flex items-baseline justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
								<p class="font-semibold text-slate-800">{h.judul}</p>
								<p class="shrink-0 text-sm text-slate-600">
									{h.hariTerpenuhi} hari · terbaik {h.streakTerbaik} berturut-turut
								</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if r.payload.catatanLembaga}
				<section class="mt-8 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5">
					<h2 class="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
						Catatan lembaga
					</h2>
					<p class="mt-2 leading-7 text-slate-800">{r.payload.catatanLembaga}</p>
				</section>
			{/if}

			<footer class="mt-10 border-t border-slate-200 pt-6 text-center">
				<p class="text-sm text-slate-500">
					Diterbitkan {tanggalIndo(r.diterbitkanPada)}
					{#if r.lembagaNama}oleh {r.lembagaNama}{/if}
				</p>
				<a href="https://santrionline.com" class="mt-3 inline-block text-sm font-bold text-emerald-800 hover:underline">
					SantriOnline — Mengaji Tanpa Batas, Beradab Tanpa Sekat
				</a>
			</footer>
		</div>
	</article>
</main>
