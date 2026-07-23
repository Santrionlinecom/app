<script lang="ts">
	import { page } from '$app/stores';

	export let status: number;
	export let error: { message?: string };

	const isUnauthorized = status === 401;
	const isForbidden = status === 403;
	const isNotFound = status === 404;

	$: title = isUnauthorized
		? 'Tidak diizinkan'
		: isForbidden
			? 'Akses dibatasi'
			: isNotFound
				? 'Halaman tidak ditemukan'
				: 'Halaman belum siap';

	$: message =
		error?.message ||
		(isUnauthorized || isForbidden
			? 'Anda belum punya akses ke menu ini, atau lembaga/peran belum cocok.'
			: isNotFound
				? 'Menu yang dibuka tidak ada atau sudah dipindah.'
				: 'Ada gangguan saat memuat data. Tetap di dashboard, lalu coba buka ulang atau pilih menu lain.');

	$: isSuperAdmin = String(($page.data?.user as { role?: string } | undefined)?.role ?? '')
		.toUpperCase()
		.includes('SUPER');
	$: homeHref = isSuperAdmin ? '/admin/super/overview' : '/dashboard';

	$: homeLabel = homeHref.includes('super') ? 'Ke Overview' : 'Ke Dashboard';
</script>

<div class="mx-auto max-w-3xl space-y-5">
	<div class="rounded-3xl border border-so-border bg-white p-6 shadow-sm sm:p-8">
		<p class="text-[11px] font-bold uppercase tracking-[0.22em] text-so-muted">SantriOnline App</p>
		<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-so-muted">Kode {status || 500}</p>
		<h1 class="mt-2 font-display text-2xl font-bold text-so-green sm:text-3xl">{title}</h1>
		<p class="mt-3 text-sm leading-7 text-so-ink/80 sm:text-base">{message}</p>

		<div class="mt-6 flex flex-wrap gap-2">
			<a
				href={homeHref}
				class="inline-flex min-h-11 items-center justify-center rounded-xl bg-so-green px-4 text-sm font-bold text-white transition hover:bg-so-green-2"
			>
				{homeLabel}
			</a>
			<a
				href="/akun"
				class="inline-flex min-h-11 items-center justify-center rounded-xl border border-so-border bg-white px-4 text-sm font-bold text-so-green transition hover:bg-so-cream"
			>
				Cek akun
			</a>
			<button
				type="button"
				class="inline-flex min-h-11 items-center justify-center rounded-xl border border-so-border bg-white px-4 text-sm font-bold text-so-ink transition hover:bg-slate-50"
				on:click={() => location.reload()}
			>
				Muat ulang
			</button>
		</div>
	</div>

	<div class="rounded-2xl border border-dashed border-so-border bg-so-cream/60 px-4 py-4 text-sm text-so-muted">
		Halaman admin tetap di dalam dashboard. Jika menu ini untuk lembaga tertentu (misalnya TPQ), pastikan akun sudah terhubung ke lembaga yang benar atau Super Admin sedang mode impersonate lembaga.
	</div>
</div>
