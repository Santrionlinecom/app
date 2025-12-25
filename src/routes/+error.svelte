<script lang="ts">
	export let status: number;
	export let error: { message?: string };

	const isUnauthorized = status === 401;
	const isForbidden = status === 403;
	const isAuthError = isUnauthorized || isForbidden;
	const isNotFound = status === 404;

	const title = isAuthError
		? isForbidden
			? '403 - Tidak Memiliki Akses'
			: '401 - Silakan Login'
		: isNotFound
			? '404 - Halaman Tidak Ditemukan'
			: 'Terjadi Kesalahan';

	const message = isForbidden
		? 'Maaf anda tidak diizinkan mengakses halaman ini.'
		: isUnauthorized
			? 'Karena anda belum memiliki akses silahkan login terlebih dahulu.'
		: isNotFound
			? 'Halaman yang Anda cari tidak ditemukan.'
			: 'Terjadi gangguan. Silakan coba lagi nanti.';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 py-12 px-4">
	<div class="mx-auto max-w-3xl">
		<div class="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-emerald-600">Santri Online</p>
			<h1 class="mt-4 text-3xl md:text-4xl font-bold text-slate-900">{title}</h1>
			<p class="mt-3 text-sm md:text-base text-slate-600">{message}</p>

			{#if isAuthError}
				<div class="mt-6 grid gap-3 sm:grid-cols-2">
					<a class="btn btn-primary w-full" href="/auth">Login</a>
					<a class="btn btn-outline w-full" href="/register">Daftar</a>
				</div>
				<p class="mt-4 text-xs text-slate-500">
					Jika sudah login namun masih ditolak, hubungi admin lembaga untuk mengaktifkan akses.
				</p>
			{:else}
				<div class="mt-6 flex flex-col gap-3 sm:flex-row">
					<a class="btn btn-primary w-full sm:w-auto" href="/">Kembali ke Beranda</a>
					<a class="btn btn-outline w-full sm:w-auto" href="/auth">Login</a>
				</div>
			{/if}

			{#if error?.message && !isAuthError && !isNotFound}
				<p class="mt-4 text-xs text-slate-400">{error.message}</p>
			{/if}
		</div>
	</div>
</div>
