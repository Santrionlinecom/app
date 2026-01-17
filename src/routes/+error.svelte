<script lang="ts">
	export let status: number;
	export let error: { message?: string };

	const isUnauthorized = status === 401;
	const isForbidden = status === 403;
	const isNotFound = status === 404;

	const title = isUnauthorized
		? '401 - Tidak Diizinkan'
		: isForbidden
			? '403 - Tidak Memiliki Akses'
			: isNotFound
				? '404 - Halaman Tidak Ditemukan'
				: 'Terjadi Kesalahan';

	const message = isUnauthorized || isForbidden
		? 'Akses ke halaman ini tidak diizinkan.'
		: isNotFound
			? 'Halaman yang Anda cari tidak ditemukan.'
			: 'Terjadi gangguan. Silakan coba lagi nanti.';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-white px-4 py-12">
	<div class="mx-auto max-w-2xl text-center">
		<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Santri Online</p>
		<h1 class="mt-4 text-3xl md:text-4xl font-semibold text-slate-900">{title}</h1>
		<p class="mt-3 text-sm md:text-base text-slate-600">{message}</p>
		<div class="mt-6">
			<a class="btn btn-primary" href="/">Kembali ke Beranda</a>
		</div>

		{#if error?.message && !isNotFound}
			<p class="mt-4 text-xs text-slate-400">{error.message}</p>
		{/if}
	</div>
</div>
