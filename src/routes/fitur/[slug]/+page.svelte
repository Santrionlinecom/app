<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const { feature, detail, others } = data;
</script>

<svelte:head>
	<title>{feature.title} - Fitur Santri Online</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
	<div class="mx-auto max-w-6xl px-4 space-y-10">
		<a href="/fitur" class="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800">
			← Kembali ke Semua Fitur
		</a>

		<div class={`relative overflow-hidden rounded-3xl ${detail.theme.hero} p-8 md:p-12 text-white shadow-2xl`}>
			<div class="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-16 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<span class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${detail.theme.chip}`}>
					{detail.heroTagline}
				</span>
				<div class="mt-6 flex items-start gap-4">
					<span class="text-5xl">{feature.icon}</span>
					<div>
						<h1 class="text-3xl md:text-5xl font-bold">{feature.title}</h1>
						<p class="text-base md:text-lg text-white/90 mt-3">{detail.heroSubtitle}</p>
						<p class="text-sm text-white/80 mt-3">{feature.desc}</p>
					</div>
				</div>
				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a href={detail.primaryHref} class="btn bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
						{feature.cta}
					</a>
					<a href="/register" class="btn btn-ghost text-white hover:bg-white/10">Daftar Lembaga</a>
				</div>
			</div>
		</div>

		<div class={`rounded-3xl border-2 ${detail.theme.border} ${detail.theme.soft} p-6 md:p-8 shadow-lg`}>
			<h2 class={`text-2xl font-bold ${detail.theme.accent}`}>Ringkasan Program</h2>
			<p class="text-sm text-slate-700 mt-3">{feature.highlight}</p>
			<ul class="mt-5 grid gap-3 md:grid-cols-3 text-sm text-slate-700">
				{#each feature.bullets as bullet}
					<li class="flex items-start gap-2">
						<span class="mt-1 text-emerald-600">✓</span>
						<span>{bullet}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
				<h2 class="text-2xl font-bold text-slate-900 mb-5">Alur Program</h2>
				<div class="space-y-4">
					{#each detail.steps as step, index}
						<div class="flex gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
								{index + 1}
							</div>
							<div>
								<h3 class="text-base font-semibold text-slate-900">{step.title}</h3>
								<p class="text-sm text-slate-600 mt-1">{step.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
				<h2 class="text-2xl font-bold text-slate-900 mb-5">Hasil yang Didapat</h2>
				<ul class="space-y-3 text-sm text-slate-700">
					{#each detail.outcomes as outcome}
						<li class="flex items-start gap-3">
							<span class="mt-1 text-emerald-600">•</span>
							<span>{outcome}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900 mb-4">Akses di Santri Online</h2>
			<div class="grid gap-4 md:grid-cols-3">
				{#each detail.access as item}
					<a href={item.href} class="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
						<p class="text-sm font-semibold text-slate-900">{item.label}</p>
						<p class="text-xs text-slate-600 mt-2">{item.desc}</p>
						<span class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
							Buka halaman
							<span>→</span>
						</span>
					</a>
				{/each}
			</div>
			{#if detail.note}
				<p class="mt-4 text-xs text-slate-500">{detail.note}</p>
			{/if}
		</div>

		<div class="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900 mb-5">Fitur Lainnya</h2>
			<div class="grid gap-4 md:grid-cols-3">
				{#each others as item}
					<a href={`/fitur/${item.slug}`} class="rounded-2xl border border-slate-200 p-4 hover:border-emerald-200 hover:shadow-md">
						<div class="flex items-center gap-3">
							<span class="text-3xl">{item.icon}</span>
							<div>
								<p class="text-sm font-semibold text-slate-900">{item.title}</p>
								<p class="text-xs text-slate-600">{item.desc}</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>
