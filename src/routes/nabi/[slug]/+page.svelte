<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	const nabi = data.nabi;
	
	const colors = [
		'from-emerald-600 to-teal-600',
		'from-blue-600 to-cyan-600',
		'from-purple-600 to-pink-600',
		'from-amber-600 to-orange-600',
		'from-rose-600 to-pink-600',
		'from-indigo-600 to-purple-600',
		'from-teal-600 to-cyan-600',
		'from-green-600 to-emerald-600'
	];
	const colorIndex = (nabi.order - 1) % colors.length;
	const gradient = colors[colorIndex];
</script>

<svelte:head>
	<title>{nabi.name} - Kisah Nabi</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12">
	<div class="max-w-4xl mx-auto px-4">
		<a href="/nabi" class="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6">
			← Kembali ke Daftar Nabi
		</a>

		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r {gradient} p-8 md:p-12 text-white shadow-2xl mb-8">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<div class="flex items-center gap-4 mb-4">
					<span class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-2xl font-bold">
						{nabi.order}
					</span>
					<div>
						<h1 class="text-4xl md:text-5xl font-bold">{nabi.name}</h1>
						<p class="text-xl opacity-90 mt-2">{nabi.summary}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Info Cards -->
		<div class="grid gap-6 md:grid-cols-2 mb-8">
			<div class="rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">📋 Informasi Dasar</h2>
				<div class="space-y-3 text-gray-700">
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Urutan:</span>
						<span>Nabi ke-{nabi.order}</span>
					</div>
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Ayah:</span>
						<span>{nabi.father ?? '—'}</span>
					</div>
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Istri:</span>
						<span>{nabi.spouse ?? '—'}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-semibold">Anak:</span>
						<span>{nabi.children ?? '—'}</span>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">🌍 Konteks Sejarah</h2>
				<div class="space-y-3 text-gray-700">
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Kaum/Tribe:</span>
						<span>{nabi.tribe ?? '—'}</span>
					</div>
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Raja/Zaman:</span>
						<span>{nabi.ruler ?? '—'}</span>
					</div>
					<div class="flex justify-between border-b pb-2">
						<span class="font-semibold">Era:</span>
						<span>{nabi.era ?? '—'}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-semibold">Usia:</span>
						<span>{nabi.age ?? '—'}</span>
					</div>
				</div>
			</div>
		</div>

		{#if nabi.explainer}
			<div class="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg mb-8">
				<h2 class="text-xl font-bold text-gray-900 mb-4">💡 Penjelasan</h2>
				<p class="text-gray-700 leading-relaxed">{nabi.explainer}</p>
			</div>
		{/if}

		<!-- Inti Kisah -->
		<div class="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-lg mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">📖 Inti Kisah</h2>
			<ul class="space-y-3">
				{#each nabi.keyPoints as point}
					<li class="flex items-start gap-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
						<span class="text-gray-700">{point}</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Dalil Al-Quran -->
		<div class="rounded-2xl border-2 border-teal-200 bg-white p-6 shadow-lg mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">📜 Dalil Al-Qur'an</h2>
			<ul class="space-y-3">
				{#each nabi.dalil as d}
					<li class="flex items-start gap-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-sm font-bold flex-shrink-0 mt-0.5">📖</span>
						<span class="text-gray-700">{d}</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Footer Note -->
		<div class="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
			<p class="text-sm text-gray-600 leading-relaxed">
				📚 <strong>Catatan:</strong> Rujukan ringkas dari ayat-ayat Al-Qur'an dan literatur sirah yang mu'tabar. Untuk tafsir lebih mendalam, rujuk kitab tafsir klasik seperti Tafsir Ibn Katsir, Al-Qurthubi, atau jalur guru bersanad.
			</p>
		</div>
	</div>
</div>
