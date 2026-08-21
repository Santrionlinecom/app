<script lang="ts">
	// src/routes/(app)/dashboard/terbitkan-rapor/+page.svelte
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let mengirim = $state(false);

	const hariIni = new Date().toISOString().slice(0, 10);
	const enamBulanLalu = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);

	function tanggalIndo(iso: string) {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}
</script>

<svelte:head>
	<title>Terbitkan Rapor | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="rounded-3xl border bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Rapor</p>
		<h1 class="mt-2 text-2xl font-semibold">Terbitkan Rapor Santri</h1>
		<p class="mt-1 text-sm text-white/90">
			Angka dibekukan saat diterbitkan, sehingga rapor yang sudah dibagikan tidak berubah.
		</p>
	</div>

	{#if form?.sukses}
		<div class="rounded-xl bg-emerald-50 p-4" role="status">
			<p class="text-sm font-semibold text-emerald-800">{form.sukses}</p>
			{#if form.slug}
				<p class="mt-1 text-sm text-emerald-900/80">
					Rapor masih <strong>privat</strong>. Santri yang menentukan apakah ingin membagikannya.
				</p>
			{/if}
		</div>
	{/if}
	{#if form?.pesan}
		<p class="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="alert">
			{form.pesan}
		</p>
	{/if}

	<section class="rounded-2xl border bg-white p-6 shadow-sm">
		{#if data.santri.length > 0}
			<form
				method="POST"
				action="?/terbitkan"
				class="space-y-4"
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
						<label class="block text-sm font-bold text-slate-900" for="santriUserId">Santri</label>
						<select id="santriUserId" name="santriUserId" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15">
							{#each data.santri as s (s.user_id)}
								<option value={s.user_id}>{s.nama}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-bold text-slate-900" for="judul">Judul rapor</label>
						<input id="judul" name="judul" value="Rapor Semester" autocomplete="off" class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-bold text-slate-900" for="mulai">Periode mulai</label>
						<input id="mulai" name="mulai" type="date" value={enamBulanLalu} class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
					<div>
						<label class="block text-sm font-bold text-slate-900" for="selesai">Periode selesai</label>
						<input id="selesai" name="selesai" type="date" value={hariIni} class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
					</div>
				</div>

				<div>
					<label class="block text-sm font-bold text-slate-900" for="catatan">Catatan lembaga</label>
					<textarea id="catatan" name="catatan" rows="3" placeholder="Alhamdulillah, ananda istiqamah menyetor setiap pekan…" class="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"></textarea>
				</div>

				<button type="submit" disabled={mengirim} class="min-h-[48px] w-full rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:bg-slate-300 sm:w-auto">
					{mengirim ? 'Menerbitkan…' : 'Terbitkan rapor'}
				</button>
			</form>
		{:else}
			<p class="text-sm text-slate-600">Belum ada santri aktif di lembaga ini.</p>
		{/if}
	</section>

	{#if data.rapor.length > 0}
		<section class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Rapor yang sudah terbit</h2>
			<ul class="mt-4 divide-y divide-slate-100">
				{#each data.rapor as r (r.id)}
					<li class="flex flex-wrap items-baseline justify-between gap-2 py-3">
						<div>
							<p class="font-semibold text-slate-900">{r.santri_nama}</p>
							<p class="text-sm text-slate-500">{r.title} · {tanggalIndo(r.issued_at)}</p>
						</div>
						<div class="text-right">
							{#if r.is_public === 1 && !r.dicabut_at}
								<a href={`/s/${r.slug}`} class="text-sm font-bold text-emerald-800 hover:underline">
									Publik · lihat
								</a>
							{:else}
								<span class="text-sm text-slate-500">Privat</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
