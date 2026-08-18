<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	let pertanyaan = $state('');
	let jawaban = $state('');
	let sumber = $state<
		Array<{ judul_kitab?: string; chapter?: string | null; halaman?: string | null }>
	>([]);
	let memuat = $state(false);
	let galat = $state('');

	const tanya = async () => {
		const q = pertanyaan.trim();
		if (!q || memuat) return;
		memuat = true;
		galat = '';
		jawaban = '';
		sumber = [];
		try {
			const res = await fetch('/api/kitab/tanya', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pertanyaan: q, kitabSlug: data.slug })
			});
			const hasil = (await res.json().catch(() => ({}))) as {
				jawaban?: string;
				referensi?: Array<{ judul_kitab?: string; chapter?: string | null; halaman?: string | null }>;
				error?: string;
				message?: string;
			};
			if (!res.ok) {
				galat = hasil.error ?? hasil.message ?? `Gagal bertanya (HTTP ${res.status})`;
				return;
			}
			jawaban = hasil.jawaban ?? '';
			sumber = hasil.referensi ?? [];
			if (!jawaban) galat = 'Belum ada jawaban untuk pertanyaan ini.';
		} catch {
			galat = 'Koneksi bermasalah, coba lagi.';
		} finally {
			memuat = false;
		}
	};
</script>

<svelte:head>
	<title>{data.judul} — Baca | SantriOnline</title>
	<meta name="description" content={data.ringkasan ?? `Baca ${data.judul} di SantriOnline`} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6">
	<nav class="mb-4 text-sm breadcrumbs opacity-70">
		<ul>
			<li><a href="/kitab">Kitab</a></li>
			<li><a href={`/kitab/${data.slug}`}>{data.judul}</a></li>
			<li>Baca</li>
		</ul>
	</nav>

	<header class="mb-6">
		<h1 class="text-2xl font-bold md:text-3xl">{data.judul}</h1>
		<div class="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-70">
			<span class="badge badge-success badge-sm">📖 Versi Baca</span>
			{#if data.pages}<span>{data.pages} halaman</span>{/if}
			<span class="badge badge-info badge-sm">🤖 Bisa Tanya AI</span>
		</div>
	</header>

	<!-- Panel Tanya AI -->
	<section class="card mb-8 border border-base-300 bg-base-200/60">
		<div class="card-body p-4 md:p-6">
			<h2 class="card-title text-base">🤖 Tanya isi kitab ini</h2>
			{#if data.bisaTanya}
				<form
					class="flex flex-col gap-2 sm:flex-row"
					onsubmit={(event) => {
						event.preventDefault();
						tanya();
					}}
				>
					<input
						class="input input-bordered w-full"
						placeholder="Contoh: apa arti dari هذا بيت؟"
						bind:value={pertanyaan}
						maxlength="300"
					/>
					<button class="btn btn-primary" type="submit" disabled={memuat || !pertanyaan.trim()}>
						{memuat ? 'Mencari…' : 'Tanya'}
					</button>
				</form>
				{#if galat}<p class="mt-2 text-sm text-error">{galat}</p>{/if}
				{#if jawaban}
					<div class="prose prose-sm mt-3 max-w-none rounded-lg bg-base-100 p-4">
						<p style="white-space: pre-wrap">{jawaban}</p>
					</div>
					{#if sumber.length}
						<div class="mt-2 flex flex-wrap gap-1 text-xs opacity-70">
							{#each sumber as s}
								<span class="badge badge-outline badge-sm">
									{s.chapter ?? s.judul_kitab}{s.halaman ? ` · hlm ${s.halaman}` : ''}
								</span>
							{/each}
						</div>
					{/if}
				{/if}
			{:else}
				<p class="text-sm opacity-80">
					<a class="link link-primary" href={`/login?redirectTo=${encodeURIComponent($page.url.pathname)}`}>Masuk</a>
					untuk bertanya langsung ke isi kitab dengan AI.
				</p>
			{/if}
		</div>
	</section>

	<!-- Isi kitab -->
	<article class="kitab-baca prose max-w-none prose-headings:scroll-mt-24">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- markdown dirender server-side dari R2 milik sendiri, html:false -->
		{@html data.html}
	</article>
</div>

<style>
	.kitab-baca :global(.arabic-text) {
		font-size: 1.5rem;
		line-height: 2.6;
		font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif;
	}
	.kitab-baca :global(.mixed-arabic) {
		line-height: 2.2;
	}
	.kitab-baca :global(table) {
		display: block;
		overflow-x: auto;
	}
	.kitab-baca :global(td),
	.kitab-baca :global(th) {
		min-width: 6rem;
	}
</style>
