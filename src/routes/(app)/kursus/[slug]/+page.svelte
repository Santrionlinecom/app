<script lang="ts">
	import { ArrowLeft, Clock, Coins, Lock, BookOpen, Pencil, Check, X, Loader2 } from '@lucide/svelte';

	let { data } = $props();

	let aktif = $state(0);
	let sedangDaftar = $state(false);
	let pesan = $state<{ teks: string; galat: boolean } | null>(null);

	// ----- Mode edit langsung (khusus Super Admin) -----
	let modeEdit = $state(false);
	let sedangSimpan = $state(false);
	let refJudul = $state<HTMLElement | null>(null);
	let refRingkasan = $state<HTMLElement | null>(null);
	let refJudulMateri = $state<HTMLElement | null>(null);
	let refIsiMateri = $state<HTMLElement | null>(null);

	function mulaiEdit() {
		modeEdit = true;
		pesan = null;
	}

	function batalEdit() {
		modeEdit = false;
		// Muat ulang supaya suntingan yang belum disimpan dibuang.
		window.location.reload();
	}

	async function simpanEdit() {
		sedangSimpan = true;
		pesan = null;
		const m = data.materi[aktif];
		try {
			const res = await fetch('/api/kursus/inline-edit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					kursusId: data.kursus.id,
					judul: refJudul?.innerText?.trim(),
					ringkasan: refRingkasan?.innerText?.trim(),
					materi: m
						? [
								{
									id: m.id,
									judul: refJudulMateri?.innerText?.trim(),
									isi: refIsiMateri?.innerHTML
								}
							]
						: []
				})
			});
			const hasil = await res.json();
			if (hasil.ok) {
				pesan = { teks: 'Perubahan tersimpan.', galat: false };
				modeEdit = false;
				setTimeout(() => window.location.reload(), 600);
				return;
			}
			pesan = { teks: hasil.pesan ?? 'Gagal menyimpan.', galat: true };
		} catch {
			pesan = { teks: 'Gagal menghubungi server. Coba lagi.', galat: true };
		} finally {
			sedangSimpan = false;
		}
	}

	/**
	 * Materi ditulis dalam markdown sederhana. Diubah ke HTML tanpa pustaka
	 * tambahan; teks di-escape lebih dulu agar isi kursus tidak bisa
	 * menyuntikkan HTML.
	 */
	function keHtml(teks: string): string {
		const aman = teks
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		return aman
			.split(/\n\n+/)
			.map((blok) => {
				const b = blok.trim();
				if (!b) return '';

				if (b.startsWith('&gt; ')) {
					const isi = b
						.split('\n')
						.map((l) => l.replace(/^&gt;\s?/, ''))
						.join('<br>');
					return `<blockquote>${tebal(isi)}</blockquote>`;
				}
				if (/^\d+\.\s/.test(b)) {
					const li = b
						.split('\n')
						.map((l) => `<li>${tebal(l.replace(/^\d+\.\s*/, ''))}</li>`)
						.join('');
					return `<ol>${li}</ol>`;
				}
				if (b.startsWith('- ')) {
					const li = b
						.split('\n')
						.map((l) => `<li>${tebal(l.replace(/^-\s*/, ''))}</li>`)
						.join('');
					return `<ul>${li}</ul>`;
				}
				return `<p>${tebal(b.replace(/\n/g, '<br>'))}</p>`;
			})
			.join('');
	}

	const tebal = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

	async function daftar() {
		if (!data.masuk) {
			window.location.href = `/auth?redirect=/kursus/${data.kursus.slug}`;
			return;
		}
		sedangDaftar = true;
		pesan = null;
		try {
			const res = await fetch('/api/kursus/daftar', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug: data.kursus.slug })
			});
			const hasil = await res.json();
			if (hasil.ok) {
				window.location.reload();
				return;
			}
			pesan = { teks: hasil.pesan, galat: true };
		} catch {
			pesan = { teks: 'Gagal menghubungi server. Coba lagi.', galat: true };
		} finally {
			sedangDaftar = false;
		}
	}
</script>

<svelte:head>
	<title>{data.kursus.judul} — SantriOnline</title>
	<meta name="description" content={data.kursus.ringkasan ?? data.kursus.judul} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<a
		href="/kursus"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
	>
		<ArrowLeft class="h-4 w-4" />
		Semua kursus
	</a>

	<header class="mb-8">
		{#if data.bolehEdit && modeEdit}
			<div class="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
				✏️ Mode edit aktif — klik teks judul, ringkasan, atau isi materi lalu ketik langsung. Tekan <strong>Simpan</strong> jika sudah.
			</div>
		{/if}
		<h1
			bind:this={refJudul}
			contenteditable={modeEdit}
			class="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl dark:text-white {modeEdit
				? 'rounded-md px-1 outline-dashed outline-2 outline-amber-400 focus:outline-amber-600'
				: ''}"
		>
			{data.kursus.judul}
		</h1>
		{#if data.kursus.ringkasan || modeEdit}
			<p
				bind:this={refRingkasan}
				contenteditable={modeEdit}
				class="mt-3 leading-relaxed text-slate-600 dark:text-slate-400 {modeEdit
					? 'rounded-md px-1 outline-dashed outline-2 outline-amber-400 focus:outline-amber-600'
					: ''}"
			>
				{data.kursus.ringkasan ?? ''}
			</p>
		{/if}
		<div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
			<span class="inline-flex items-center gap-1">
				<BookOpen class="h-4 w-4" />
				{data.materi.length} materi
			</span>
			{#if data.kursus.durasi_menit > 0}
				<span class="inline-flex items-center gap-1">
					<Clock class="h-4 w-4" />
					{data.kursus.durasi_menit} menit
				</span>
			{/if}
			<span
				class="inline-flex items-center gap-1 font-medium {data.kursus.harga_koin === 0
					? 'text-emerald-600 dark:text-emerald-400'
					: 'text-amber-600 dark:text-amber-400'}"
			>
				{#if data.kursus.harga_koin > 0}<Coins class="h-4 w-4" />{/if}
				{data.kursus.harga_koin === 0
					? 'Gratis'
					: `${data.kursus.harga_koin.toLocaleString('id-ID')} koin`}
			</span>
		</div>
	</header>

	{#if pesan}
		<div
			class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
			role="alert"
		>
			{pesan.teks}
			{#if pesan.teks.includes('topup')}
				<a href="/coin" class="ml-1 font-semibold underline">Topup koin</a>
			{/if}
		</div>
	{/if}

	{#if !data.boleh}
		<div
			class="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900"
		>
			<Lock class="mx-auto h-8 w-8 text-slate-400" />
			<p class="mt-3 font-medium text-slate-900 dark:text-white">
				{data.kursus.harga_koin === 0
					? 'Daftar dulu untuk membuka materi'
					: 'Kursus ini berbayar'}
			</p>
			<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
				{data.kursus.harga_koin === 0
					? 'Gratis — cukup satu klik.'
					: `Pendaftaran memotong ${data.kursus.harga_koin.toLocaleString('id-ID')} koin dari saldo Anda.`}
			</p>
			<button
				type="button"
				onclick={daftar}
				disabled={sedangDaftar}
				class="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
			>
				{sedangDaftar
					? 'Memproses...'
					: data.kursus.harga_koin === 0
						? 'Mulai gratis'
						: 'Daftar sekarang'}
			</button>
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-[240px_1fr]">
		<nav class="md:sticky md:top-6 md:self-start">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Daftar materi</p>
			<ol class="space-y-1">
				{#each data.materi as m, i (m.id)}
					<li>
						<button
							type="button"
							onclick={() => (aktif = i)}
							disabled={!data.boleh}
							class="w-full rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 {aktif ===
								i && data.boleh
								? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
								: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
						>
							<span class="mr-1.5 text-slate-400">{i + 1}.</span>
							{m.judul}
						</button>
					</li>
				{/each}
			</ol>
		</nav>

		<div>
			{#if data.boleh && data.materi[aktif]}
				{@const m = data.materi[aktif]}
				<article
					class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
				>
					<h2
						bind:this={refJudulMateri}
						contenteditable={modeEdit}
						class="text-xl font-semibold text-slate-900 dark:text-white {modeEdit
							? 'rounded-md px-1 outline-dashed outline-2 outline-amber-400 focus:outline-amber-600'
							: ''}"
					>
						{m.judul}
					</h2>
					<div
						bind:this={refIsiMateri}
						contenteditable={modeEdit}
						class="materi mt-4 {modeEdit
							? 'min-h-[120px] rounded-md p-2 outline-dashed outline-2 outline-amber-400 focus:outline-amber-600'
							: ''}"
					>
						{#if m.format === 'html'}
							<!-- Sudah HTML hasil suntingan superadmin; sudah dibersihkan di server. -->
							{@html String(m.isi ?? '')}
						{:else}
							{@html keHtml(String(m.isi ?? ''))}
						{/if}
					</div>

					<div
						class="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800"
					>
						<button
							type="button"
							onclick={() => (aktif = Math.max(0, aktif - 1))}
							disabled={aktif === 0}
							class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
						>
							Sebelumnya
						</button>
						<span class="text-xs text-slate-500">{aktif + 1} dari {data.materi.length}</span>
						<button
							type="button"
							onclick={() => (aktif = Math.min(data.materi.length - 1, aktif + 1))}
							disabled={aktif >= data.materi.length - 1}
							class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white dark:text-slate-900"
						>
							Berikutnya
						</button>
					</div>
				</article>
			{:else}
				<div
					class="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700"
				>
					<Lock class="mx-auto h-8 w-8 text-slate-400" />
					<p class="mt-3 text-sm text-slate-600 dark:text-slate-400">
						Materi terbuka setelah Anda mendaftar.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if data.bolehEdit}
	<!-- Kontrol edit langsung: hanya dirender untuk Super Admin -->
	<div class="fixed bottom-6 right-6 z-50 flex items-center gap-2">
		{#if modeEdit}
			<button
				type="button"
				onclick={batalEdit}
				disabled={sedangSimpan}
				class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:opacity-60"
			>
				<X class="h-4 w-4" />
				Batal
			</button>
			<button
				type="button"
				onclick={simpanEdit}
				disabled={sedangSimpan}
				class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
			>
				{#if sedangSimpan}
					<Loader2 class="h-4 w-4 animate-spin" />
					Menyimpan...
				{:else}
					<Check class="h-4 w-4" />
					Simpan
				{/if}
			</button>
		{:else}
			<button
				type="button"
				onclick={mulaiEdit}
				class="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
			>
				<Pencil class="h-4 w-4" />
				Edit Halaman
			</button>
		{/if}
	</div>
{/if}

<style>
	.materi :global(p) {
		margin-bottom: 1rem;
		line-height: 1.75;
		color: rgb(51 65 85);
	}
	.materi :global(ul),
	.materi :global(ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		line-height: 1.75;
		color: rgb(51 65 85);
	}
	.materi :global(ul) {
		list-style-type: disc;
	}
	.materi :global(ol) {
		list-style-type: decimal;
	}
	.materi :global(li) {
		margin-bottom: 0.35rem;
	}
	.materi :global(blockquote) {
		margin-bottom: 1rem;
		border-left: 3px solid rgb(16 185 129);
		padding: 0.5rem 0 0.5rem 1rem;
		font-style: italic;
		color: rgb(71 85 105);
	}
	.materi :global(strong) {
		font-weight: 600;
		color: rgb(15 23 42);
	}
	/*
	 * Mode gelap: teks materi dibuat putih penuh, bukan abu-abu.
	 *
	 * Materi kursus dibaca panjang dan sering di layar HP dengan cahaya
	 * sekitar terang, sehingga abu-abu terasa pudar dan melelahkan.
	 *
	 * Memakai @media prefers-color-scheme, bukan selektor .dark: proyek ini
	 * memakai Tailwind v3 tanpa darkMode:'class', sehingga seluruh utilitas
	 * dark: menempel pada media query dan tidak ada kelas .dark di DOM.
	 */
	@media (prefers-color-scheme: dark) {
		.materi :global(p),
		.materi :global(ul),
		.materi :global(ol),
		.materi :global(li),
		.materi :global(h1),
		.materi :global(h2),
		.materi :global(h3),
		.materi :global(h4),
		.materi :global(td),
		.materi :global(th),
		.materi :global(blockquote),
		.materi :global(strong) {
			color: rgb(255 255 255);
		}
		.materi :global(a) {
			color: rgb(110 231 183);
		}
	}
</style>
