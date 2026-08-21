<script lang="ts">
	// src/routes/(app)/lembaga/undangan-wali/+page.svelte
	// Pengurus lembaga menerbitkan kode undangan wali.
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mengirim = $state(false);
	let tersalin = $state(false);

	function formatKedaluwarsa(epoch: number) {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(epoch * 1000));
	}

	async function salin(kode: string) {
		try {
			await navigator.clipboard.writeText(kode);
			tersalin = true;
			setTimeout(() => (tersalin = false), 2000);
		} catch {
			tersalin = false;
		}
	}
</script>

<svelte:head>
	<title>Undangan Wali | SantriOnline</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	<header class="mb-8">
		<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Lembaga</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Undangan Wali Santri</h1>
		<p class="mt-3 leading-7 text-slate-600">
			Terbitkan kode agar orang tua dapat memantau perkembangan ananda. Kode berlaku
			7 hari dan hanya bisa dipakai satu kali.
		</p>
	</header>

	{#if form?.kode}
		<section class="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
			<p class="text-sm font-semibold text-emerald-900">Kode berhasil diterbitkan</p>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<code class="rounded-xl bg-white px-5 py-3 font-mono text-2xl font-bold tracking-widest text-emerald-900">
					{form.kode}
				</code>
				<button
					type="button"
					onclick={() => salin(String(form?.kode))}
					class="min-h-[44px] rounded-xl border border-emerald-300 bg-white px-4 font-semibold text-emerald-900 transition hover:bg-emerald-100"
				>
					{tersalin ? 'Tersalin ✓' : 'Salin'}
				</button>
			</div>
			<p class="mt-3 text-sm text-emerald-900/80">
				Berlaku sampai {formatKedaluwarsa(Number(form.expiresAt))}. Kirimkan kepada wali
				melalui jalur pribadi, bukan grup terbuka.
			</p>
		</section>
	{/if}

	<section class="rounded-2xl border border-slate-200 bg-white p-6">
		{#if data.santri.length > 0}
			<form
				method="POST"
				action="?/terbitkan"
				class="space-y-5"
				use:enhance={() => {
					mengirim = true;
					return async ({ update }) => {
						await update();
						mengirim = false;
					};
				}}
			>
				<div>
					<label class="block text-sm font-bold text-slate-900" for="santriUserId">Santri</label>
					<select
						id="santriUserId"
						name="santriUserId"
						class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
					>
						{#each data.santri as s (s.user_id)}
							<option value={s.user_id}>{s.nama}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-bold text-slate-900" for="hubungan">Hubungan wali</label>
					<select
						id="hubungan"
						name="hubungan"
						class="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
					>
						<option value="ayah">Ayah</option>
						<option value="ibu">Ibu</option>
						<option value="wali">Wali</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={mengirim}
					class="min-h-[48px] w-full rounded-xl bg-emerald-800 px-6 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
				>
					{mengirim ? 'Menerbitkan…' : 'Terbitkan kode'}
				</button>
			</form>
		{:else}
			<p class="text-sm leading-6 text-slate-600">
				Belum ada santri aktif di lembaga ini. Tambahkan santri lebih dulu sebelum
				menerbitkan undangan wali.
			</p>
		{/if}

		{#if form?.pesan}
			<p class="mt-4 text-sm font-semibold text-amber-700" role="alert">{form.pesan}</p>
		{/if}
	</section>
</main>
