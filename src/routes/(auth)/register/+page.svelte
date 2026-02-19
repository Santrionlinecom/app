<script lang="ts">
	import { ACTIVE_CTA, INSTITUTIONS } from '$lib/config/institutions';

	const registerOptions = INSTITUTIONS.filter((option) => option.enabled);
	const memberOptions = INSTITUTIONS.filter((option) => option.enabled);
</script>

<svelte:head>
	<title>Daftar TPQ</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 py-12 px-4 sm:px-6 lg:px-10">
	<div class="mx-auto w-full max-w-5xl space-y-8">
		<header class="space-y-3 text-center">
			<p class="text-xs uppercase tracking-[0.2em] text-emerald-700">Santri Online</p>
			<h1 class="text-3xl md:text-4xl font-extrabold text-slate-900">Pendaftaran TPQ</h1>
			<p class="text-base text-slate-600">
				Daftarkan lembaga TPQ Anda untuk mulai mengelola santri, kelas, dan pembelajaran Al-Quran.
			</p>
		</header>

		<section class="grid gap-4 md:grid-cols-3">
			{#each registerOptions as option}
				<a
					href={option.registerRoute}
					class="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
				>
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-slate-900">{option.label}</h2>
					</div>
					<p class="mt-2 text-sm text-slate-600">{option.registerDescription}</p>
					<span class="mt-4 inline-block text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
						{ACTIVE_CTA} sekarang
					</span>
				</a>
			{/each}
		</section>

		<section class="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
			<h3 class="text-lg font-semibold text-slate-900">Daftar Sebagai Anggota</h3>
			<p class="mt-2 text-sm text-slate-600">
				Jika ingin mendaftar sebagai santri atau ustadz/ustadzah, silakan pilih TPQ berikut.
			</p>
			<div class="mt-4 grid gap-3 md:grid-cols-3">
				{#each memberOptions as option}
					<a
						href={option.route}
						class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
					>
						<span>{option.label}</span>
					</a>
				{/each}
			</div>
		</section>

		<p class="text-center text-sm text-slate-500">
			Sudah punya akun? <a href="/auth" class="font-semibold text-emerald-700 hover:underline">Masuk di sini</a>
		</p>
	</div>
</div>
