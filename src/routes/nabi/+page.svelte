<script lang="ts">
	import { nabiList } from '$lib/data/nabi';
	const ordered = [...nabiList].sort((a, b) => a.order - b.order);
</script>

<svelte:head>
	<title>25 Nabi & Rasul</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 md:p-12 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<span class="text-6xl mb-4 block">🕌</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">25 Nabi & Rasul</h1>
				<p class="text-xl md:text-2xl opacity-90 mb-6">Kisah Teladan Para Utusan Allah</p>
				<p class="text-lg opacity-80 max-w-3xl">Pelajari perjalanan hidup, dakwah, dan keteladanan 25 nabi dan rasul yang wajib diimani oleh setiap Muslim.</p>
			</div>
		</div>

		<!-- Grid Nabi -->
		<div class="grid grid-cols-1 gap-6">
			{#each ordered as item}
				<a href="/nabi/{item.slug}" class="group relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<div class="flex items-center gap-3 mb-3">
							<span class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
								{item.order}
							</span>
							<h2 class="text-xl font-bold text-emerald-700">{item.name}</h2>
						</div>
						<p class="text-gray-700 mb-4 line-clamp-3">{item.summary}</p>
						<span class="inline-flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
							Baca Kisah →
						</span>
					</div>
				</a>
			{/each}
		</div>

		<!-- Info Box -->
		<div class="mt-12 rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-lg">
			<h3 class="text-2xl font-bold text-gray-900 mb-4">📖 Tentang Para Nabi</h3>
			<div class="space-y-4 text-gray-700">
				<p>Dalam Islam, kita wajib beriman kepada 25 nabi dan rasul yang disebutkan dalam Al-Quran. Mereka adalah utusan Allah yang membawa risalah tauhid dan petunjuk bagi umat manusia.</p>
				<p>Setiap nabi memiliki kisah dan perjuangan yang unik dalam menyebarkan agama Allah. Dari Nabi Adam AS sebagai manusia pertama, hingga Nabi Muhammad SAW sebagai penutup para nabi.</p>
				<p>Pelajari kisah mereka untuk mengambil teladan dalam kehidupan sehari-hari dan memperkuat iman kita kepada Allah SWT.</p>
			</div>
		</div>
	</div>
</div>
