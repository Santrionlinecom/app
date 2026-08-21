<script lang="ts">
	// src/routes/(app)/wali/+page.svelte
	// Beranda wali. Nada halaman: menumbuhkan, bukan menghakimi.
	// Tidak ada peringkat antaranak, tidak ada warna merah untuk hari terlewat.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mengirim = $state(false);
</script>

<svelte:head>
	<title>Pantauan Wali | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<header class="mb-8">
		<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Pantauan Wali</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
			Perkembangan ananda
		</h1>
		<p class="mt-3 max-w-2xl leading-7 text-slate-600">
			Halaman ini untuk menemani, bukan menilai. Yang ditampilkan adalah usaha ananda —
			bukan peringkat, bukan rapor kegagalan.
		</p>
	</header>

	{#if data.anak.length > 0}
		<section class="grid gap-4 sm:grid-cols-2">
			{#each data.anak as anak (anak.santriUserId)}
				<a
					href={`/wali/${anak.santriUserId}`}
					class="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
				>
					<p class="text-lg font-bold text-slate-900">{anak.nama}</p>
					<p class="mt-1 text-sm capitalize text-slate-500">
						Anda sebagai {anak.hubungan}
					</p>
					{#if anak.lembagaNama}
						<p class="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
							{anak.lembagaNama}
						</p>
					{/if}
					<p class="mt-4 text-sm font-semibold text-emerald-800 group-hover:underline">
						Lihat perkembangan →
					</p>
				</a>
			{/each}
		</section>
	{:else}
		<section class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p class="font-bold text-slate-900">Belum ada santri yang terhubung</p>
			<p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
				Mintalah kode undangan kepada pengurus lembaga tempat ananda belajar.
				Kode hanya bisa diterbitkan oleh lembaga demi menjaga data setiap santri.
			</p>
		</section>
	{/if}

	<section class="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
		<h2 class="text-lg font-bold text-slate-900">Hubungkan dengan kode undangan</h2>
		<p class="mt-2 text-sm leading-6 text-slate-600">
			Masukkan kode yang diberikan lembaga, misalnya <code class="rounded bg-slate-100 px-1.5 py-0.5">WALI-7F3K2M</code>.
		</p>

		<form
			method="POST"
			action="?/hubungkan"
			class="mt-4 flex flex-col gap-3 sm:flex-row"
			use:enhance={() => {
				mengirim = true;
				return async ({ update }) => {
					await update();
					mengirim = false;
				};
			}}
		>
			<label class="sr-only" for="kode">Kode undangan</label>
			<input
				id="kode"
				name="kode"
				placeholder="WALI-XXXXXX"
				autocomplete="off"
				spellcheck="false"
				class="min-h-[48px] flex-1 rounded-xl border border-slate-300 px-4 font-mono uppercase tracking-wider outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
			/>
			<button
				type="submit"
				disabled={mengirim}
				class="min-h-[48px] rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
			>
				{mengirim ? 'Menghubungkan…' : 'Hubungkan'}
			</button>
		</form>

		{#if form?.pesan}
			<p class="mt-3 text-sm font-semibold text-amber-700" role="alert">{form.pesan}</p>
		{/if}
		{#if form?.sukses}
			<p class="mt-3 text-sm font-semibold text-emerald-800" role="status">
				Berhasil terhubung. Perkembangan ananda sudah bisa dipantau.
			</p>
		{/if}
	</section>
</main>
