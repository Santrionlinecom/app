<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { FEATURES } from '$lib/features';

	const privilegedRoles = ['admin', 'ustadz', 'santri'];
	$: showDashboard = data?.user?.role && privilegedRoles.includes(data.user.role);
</script>

<svelte:head>
	<title>Santri Online - Platform Ahlussunnah wal Jama'ah</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
	<!-- Hero Section -->
	<div class="relative overflow-hidden">
		<div class="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-10"></div>
		<div class="relative container mx-auto px-4 py-16 md:py-24">
			<div class="text-center max-w-4xl mx-auto">
				<div class="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg mb-6">
					<span class="text-emerald-600 font-semibold">🕌 Platform Ahlussunnah wal Jama'ah</span>
				</div>

				<h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
					Bergabung dengan<br />
					<span class="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Santri Online</span>
				</h1>

				<p class="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
					Platform edukasi Islam berdasarkan pemahaman Ahlussunnah wal Jama'ah 4 Madzhab. Pelajari Al-Qur'an, Aqidah, Fiqih, Hadits, dan Tasawuf dengan bimbingan ulama.
				</p>

				<div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
					{#if showDashboard}
						<a href="/dashboard" class="btn bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-xl text-lg px-8 py-4">
							📊 Buka Dashboard
						</a>
					{:else}
						<a href="/auth" class="btn bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:bg-white hover:from-white hover:to-white hover:text-black shadow-xl text-lg px-8 py-4 transition-colors duration-200">
							🚀 Mulai Belajar Sekarang
						</a>
					{/if}
					<a href="/tentang" class="btn bg-white text-gray-700 hover:bg-gray-50 shadow-lg text-lg px-8 py-4">
						📖 Pelajari Lebih Lanjut
					</a>
				</div>

				<div class="flex flex-wrap justify-center gap-6 text-sm">
					<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
						<span class="text-2xl">🛡️</span>
						<span class="font-semibold text-gray-700">Manhaj Aswaja</span>
					</div>
					<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
						<span class="text-2xl">⚖️</span>
						<span class="font-semibold text-gray-700">4 Madzhab Fiqih</span>
					</div>
					<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
						<span class="text-2xl">📚</span>
						<span class="font-semibold text-gray-700">Kitab Mu'tabarah</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Grid -->
	<div class="container mx-auto px-4 py-16">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Program Unggulan</h2>
			<p class="text-gray-600 max-w-2xl mx-auto">Berbagai program untuk meningkatkan kualitas spiritual dan keilmuan Anda</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
			{#each FEATURES as feature}
				<a
					href={`/fitur/${feature.slug}`}
					class="group relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
				>
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<span class="text-5xl mb-4 block">{feature.icon}</span>
						<h3 class="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
						<p class="text-gray-600 mb-4">{feature.desc}</p>
						<div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
							Pelajari fitur
							<span>→</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- CTA Section -->
	<div class="container mx-auto px-4 py-16">
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 text-white shadow-2xl">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 text-center max-w-3xl mx-auto">
				<h2 class="text-3xl md:text-4xl font-bold mb-4">Siap Memulai Perjalanan Ilmu?</h2>
				<p class="text-lg opacity-90 mb-8">Bergabunglah dengan ribuan santri yang telah belajar bersama kami</p>
				<a href="/register" class="btn bg-white text-emerald-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4">
					✨ Daftar Sekarang Gratis
				</a>
			</div>
		</div>
	</div>
</div>
