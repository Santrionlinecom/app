<script lang="ts">
	import { page } from '$app/stores';

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

	const message =
		error?.message ||
		(isUnauthorized || isForbidden
			? 'Akses ke halaman ini tidak diizinkan.'
			: isNotFound
				? 'Halaman yang Anda cari tidak ditemukan.'
				: 'Terjadi gangguan. Silakan coba lagi nanti.');

	$: path = $page.url.pathname;
	$: isAppPath =
		path.startsWith('/dashboard') ||
		path.startsWith('/admin') ||
		path.startsWith('/tpq') ||
		path.startsWith('/akademik') ||
		path.startsWith('/lembaga') ||
		path.startsWith('/akun') ||
		path.startsWith('/habit') ||
		path.startsWith('/belajar') ||
		path.startsWith('/buku') ||
		path.startsWith('/coins') ||
		path.startsWith('/beranda');
	$: homeHref = isAppPath ? '/dashboard' : '/';
	$: homeLabel = isAppPath ? 'Ke Dashboard' : 'Kembali ke Beranda';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-white px-4 py-12">
	<div class="mx-auto max-w-2xl text-center">
		<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Santri Online</p>
		<h1 class="mt-4 text-3xl md:text-4xl font-semibold text-slate-900">{title}</h1>
		<p class="mt-3 text-sm md:text-base text-slate-600">{message}</p>
		<div class="mt-6 flex flex-wrap items-center justify-center gap-2">
			<a class="btn btn-primary" href={homeHref}>{homeLabel}</a>
			{#if isAppPath}
				<a class="btn btn-outline" href="/akun">Cek akun</a>
			{/if}
		</div>

		{#if error?.message && error.message !== message}
			<p class="mt-4 text-xs text-slate-400">{error.message}</p>
		{/if}
	</div>
</div>
