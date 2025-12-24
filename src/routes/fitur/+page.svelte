<script lang="ts">
	import { FEATURES } from '$lib/features';
</script>

<svelte:head>
	<title>Fitur Santri Online</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50 py-12">
	<div class="mx-auto max-w-6xl px-4">
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<span class="text-xs uppercase tracking-[0.35em] text-white/80">Program Santri Online</span>
				<h1 class="text-3xl md:text-5xl font-bold mt-3">Fitur Unggulan untuk Pembelajaran Islam</h1>
				<p class="text-base md:text-lg text-white/90 mt-4">
					Semua fitur dirancang untuk lembaga, ustadz/ustadzah, dan santri agar pembelajaran lebih terarah, terukur, dan sesuai manhaj Ahlussunnah wal Jama'ah.
				</p>
				<div class="mt-6 flex flex-col gap-3 sm:flex-row">
					<a href="/register" class="btn bg-white text-emerald-600 hover:bg-gray-100 shadow-lg">Daftar Lembaga</a>
					<a href="/auth" class="btn btn-ghost text-white hover:bg-white/10">Masuk Akun</a>
				</div>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each FEATURES as feature}
				<a href={`/fitur/${feature.slug}`} class="group rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
					<div class="flex items-center justify-between">
						<span class="text-4xl">{feature.icon}</span>
						<span class="text-xs uppercase tracking-[0.25em] text-emerald-600">Program</span>
					</div>
					<h2 class="text-xl font-bold text-gray-900 mt-4">{feature.title}</h2>
					<p class="text-sm text-gray-600 mt-2">{feature.desc}</p>
					<p class="text-sm text-gray-700 mt-4">{feature.highlight}</p>
					<ul class="mt-4 space-y-2 text-sm text-gray-600">
						{#each feature.bullets as bullet}
							<li class="flex items-start gap-2">
								<span class="mt-1 text-emerald-600">•</span>
								<span>{bullet}</span>
							</li>
						{/each}
					</ul>
					<div class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
						{feature.cta}
						<span>→</span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
