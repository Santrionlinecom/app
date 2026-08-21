<script lang="ts">
	// src/routes/(app)/rapor/+page.svelte
	// Rapor santri + tombol bagikan. Nada: bangga tanpa memaksa.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tersalin = $state('');

	function tanggalIndo(iso: string) {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(iso));
	}

	async function salinTautan(slug: string) {
		const url = `${location.origin}/s/${slug}`;
		try {
			await navigator.clipboard.writeText(url);
			tersalin = slug;
			setTimeout(() => (tersalin = ''), 2000);
		} catch {
			tersalin = '';
		}
	}
</script>

<svelte:head>
	<title>Rapor Saya | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	<header class="mb-8">
		<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Rapor</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Rapor Saya</h1>
		<p class="mt-3 leading-7 text-slate-600">
			Anda yang menentukan apakah rapor ini dibagikan. Bawaannya privat.
		</p>
	</header>

	{#if form?.sukses}
		<p class="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800" role="status">
			{form.sukses}
		</p>
	{/if}
	{#if form?.pesan}
		<p class="mb-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="alert">
			{form.pesan}
		</p>
	{/if}

	{#if data.rapor.length > 0}
		<div class="space-y-4">
			{#each data.rapor as r (r.id)}
				{@const publik = r.is_public === 1 && !r.dicabut_at}
				<article class="rounded-2xl border border-slate-200 bg-white p-6">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="text-lg font-bold text-slate-900">{r.title}</h2>
						<span class={`rounded-full px-3 py-1 text-xs font-bold ${publik ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
							{publik ? 'Bisa dibagikan' : 'Privat'}
						</span>
					</div>

					<p class="mt-1 text-sm text-slate-500">
						{#if r.lembaga_nama}{r.lembaga_nama} · {/if}
						Terbit {tanggalIndo(r.issued_at)}
					</p>

					<div class="mt-4 flex flex-wrap items-center gap-3">
						<form method="POST" action="?/ubahPublikasi" use:enhance>
							<input type="hidden" name="raporId" value={r.id} />
							<input type="hidden" name="publik" value={publik ? 'tidak' : 'ya'} />
							<button type="submit" class={`min-h-[44px] rounded-xl px-5 font-bold transition ${publik ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-emerald-800 text-white hover:bg-emerald-900'}`}>
								{publik ? 'Jadikan privat' : 'Izinkan dibagikan'}
							</button>
						</form>

						{#if publik && r.slug}
							<a href={`/s/${r.slug}`} class="text-sm font-bold text-emerald-800 hover:underline">
								Lihat halaman
							</a>
							<button type="button" onclick={() => salinTautan(r.slug!)} class="text-sm font-bold text-emerald-800 hover:underline">
								{tersalin === r.slug ? 'Tautan tersalin ✓' : 'Salin tautan'}
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<section class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p class="font-bold text-slate-900">Belum ada rapor</p>
			<p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
				Rapor diterbitkan oleh lembaga tempat Anda belajar setelah satu periode berjalan.
			</p>
		</section>
	{/if}
</main>
