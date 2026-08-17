<script lang="ts">
	import { BookOpen, Clock, Coins, Check, Loader2 } from 'lucide-svelte';

	let { data } = $props();

	let sedangDaftar = $state<string | null>(null);
	let pesan = $state<{ teks: string; galat: boolean } | null>(null);

	// Kursus yang baru didaftarkan di sesi ini. Dipisah dari data server agar
	// tombol berubah seketika tanpa menunggu muat ulang, sekaligus tetap ikut
	// diperbarui bila server mengirim data baru.
	let baruDaftar = $state<string[]>([]);
	const terdaftar = $derived([...(data.terdaftar ?? []), ...baruDaftar]);

	const rupiahKoin = (n: number) => (n === 0 ? 'Gratis' : `${n.toLocaleString('id-ID')} koin`);

	const labelLevel = (v: string) =>
		({ dasar: 'Dasar', menengah: 'Menengah', lanjut: 'Lanjut' })[v] ?? v;

	async function daftar(slug: string, id: string) {
		if (!data.masuk) {
			window.location.href = `/auth?redirect=/kursus`;
			return;
		}
		sedangDaftar = slug;
		pesan = null;
		try {
			const res = await fetch('/api/kursus/daftar', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug })
			});
			const hasil = await res.json();
			pesan = { teks: hasil.pesan, galat: !hasil.ok };
			if (hasil.ok && !terdaftar.includes(id)) baruDaftar = [...baruDaftar, id];
		} catch {
			pesan = { teks: 'Gagal menghubungi server. Coba lagi.', galat: true };
		} finally {
			sedangDaftar = null;
		}
	}
</script>

<svelte:head>
	<title>Kursus — SantriOnline</title>
	<meta
		name="description"
		content="Kursus SantriOnline: aqidah, adab, dan panduan platform. Ada yang gratis, ada yang berbayar koin."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10">
	<header class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Kursus</h1>
		<p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
			Belajar bertahap dengan materi berurutan. Sebagian gratis, sebagian berbayar koin.
		</p>
	</header>

	{#if pesan}
		<div
			class="mb-6 rounded-lg border px-4 py-3 text-sm {pesan.galat
				? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
				: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'}"
			role="status"
		>
			{pesan.teks}
			{#if pesan.galat && pesan.teks.includes('topup')}
				<a href="/coin" class="ml-1 font-semibold underline">Topup koin</a>
			{/if}
		</div>
	{/if}

	{#if data.kursus.length === 0}
		<div
			class="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700"
		>
			<BookOpen class="mx-auto h-10 w-10 text-slate-400" />
			<p class="mt-3 text-slate-600 dark:text-slate-400">Belum ada kursus yang terbit.</p>
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2">
			{#each data.kursus as k (k.id)}
				{@const sudah = terdaftar.includes(k.id)}
				<article
					class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
				>
					<div class="mb-3 flex flex-wrap items-center gap-2">
						{#if k.kategori}
							<span
								class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
							>
								{k.kategori}
							</span>
						{/if}
						<span class="text-xs text-slate-500 dark:text-slate-400">{labelLevel(k.level)}</span>
					</div>

					<h2 class="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
						{k.judul}
					</h2>

					{#if k.ringkasan}
						<p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
							{k.ringkasan}
						</p>
					{/if}

					<div class="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
						{#if k.durasi_menit > 0}
							<span class="inline-flex items-center gap-1">
								<Clock class="h-4 w-4" />
								{k.durasi_menit} menit
							</span>
						{/if}
						<span
							class="inline-flex items-center gap-1 font-medium {k.harga_koin === 0
								? 'text-emerald-600 dark:text-emerald-400'
								: 'text-amber-600 dark:text-amber-400'}"
						>
							{#if k.harga_koin > 0}<Coins class="h-4 w-4" />{/if}
							{rupiahKoin(k.harga_koin)}
						</span>
					</div>

					<div class="mt-5">
						{#if sudah}
							<a
								href="/kursus/{k.slug}"
								class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
							>
								<Check class="h-4 w-4" />
								Lanjutkan belajar
							</a>
						{:else}
							<button
								type="button"
								onclick={() => daftar(k.slug, k.id)}
								disabled={sedangDaftar === k.slug}
								class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
							>
								{#if sedangDaftar === k.slug}
									<Loader2 class="h-4 w-4 animate-spin" />
									Memproses...
								{:else}
									{k.harga_koin === 0 ? 'Mulai gratis' : 'Daftar sekarang'}
								{/if}
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
