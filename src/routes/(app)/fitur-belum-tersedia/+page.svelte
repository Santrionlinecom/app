<script lang="ts">
	import { page } from '$app/stores';

	$: featureName = $page.url.searchParams.get('fitur') || 'Fitur';
</script>

<svelte:head>
	<title>{featureName} - SantriOnline</title>
</svelte:head>

<section class="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-10">
	<div class="w-full rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-8">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">SantriOnline</p>
		<h1 class="mt-3 text-2xl font-black text-slate-900">{featureName}</h1>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Fitur ini sedang disiapkan untuk lembaga Anda.
		</p>
		<a
			href="/dashboard"
			class="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
		>
			Kembali ke Dashboard
		</a>
	</div>
</section>
