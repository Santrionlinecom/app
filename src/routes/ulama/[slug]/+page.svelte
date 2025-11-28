<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	const { scholar } = data;
	
	const regionColors: Record<string, string> = {
		'Baghdad': 'from-purple-600 to-pink-600',
		'Damaskus': 'from-blue-600 to-cyan-600',
		'Mesir': 'from-green-600 to-emerald-600',
		'Hadramaut': 'from-amber-600 to-orange-600',
		'Makkah': 'from-rose-600 to-pink-600',
		'Madinah': 'from-teal-600 to-cyan-600'
	};
	
	const getGradient = (region: string) => {
		for (const [key, value] of Object.entries(regionColors)) {
			if (region.includes(key)) return value;
		}
		return 'from-teal-600 to-cyan-600';
	};
	
	const gradient = getGradient(scholar.region);
</script>

<svelte:head>
	<title>{scholar.nama} - Ulama Ahlussunnah</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-12">
	<div class="max-w-4xl mx-auto px-4">
		<a href="/ulama" class="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6">
			← Kembali ke Jaringan Ulama
		</a>

		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r {gradient} p-8 md:p-12 text-white shadow-2xl mb-8">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<span class="text-6xl mb-4 block">🎓</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">{scholar.nama}</h1>
				<div class="flex flex-wrap gap-3 mb-4">
					<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
						📅 {scholar.era}
					</span>
					<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
						📍 {scholar.region}
					</span>
				</div>
				<p class="text-xl opacity-90">{scholar.legacy}</p>
			</div>
		</div>

		<!-- Story -->
		<div class="rounded-3xl border-2 border-teal-200 bg-white p-8 shadow-xl mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-6">📖 Kisah & Kontribusi</h2>
			<div class="prose prose-lg max-w-none">
				<p class="text-gray-700 leading-relaxed whitespace-pre-line">{scholar.story}</p>
			</div>
		</div>

		<!-- Quote -->
		{#if scholar.quote}
			<div class="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-xl mb-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">💬 Kata Bijak</h2>
				<blockquote class="text-lg text-gray-800 italic leading-relaxed">
					"{scholar.quote}"
				</blockquote>
			</div>
		{/if}

		<!-- Legacy Box -->
		<div class="rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-xl">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">🌟 Warisan Keilmuan</h2>
			<p class="text-gray-700 leading-relaxed">
				{scholar.nama} adalah salah satu ulama besar Ahlussunnah wal Jama'ah yang karyanya menjadi rujukan pesantren di Nusantara. Beliau menjaga sanad keilmuan yang bersambung hingga Rasulullah ﷺ melalui para sahabat dan tabi'in.
			</p>
		</div>
	</div>
</div>
