<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const isLoggedIn = !!data?.user;
</script>

<svelte:head>
	<title>Kitab Turats Nusantara</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<span class="text-6xl mb-4 block">📚</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">Kitab Turats Nusantara</h1>
				<p class="text-xl md:text-2xl opacity-90 mb-6">Warisan Ulama untuk Santri</p>
				<p class="text-lg opacity-80 max-w-3xl">Selain menghafal Al-Qur'an, kami mempelajari kitab-kitab dasar rujukan pesantren Ahlussunnah wal Jama'ah dari masa sahabat, tabi'in, hingga para wali di Nusantara.</p>
			</div>
		</div>

		<!-- Al-Quran Featured -->
		<a href="/kitab/quran" class="block mb-12 rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-xl hover:scale-[1.02] transition">
			<div class="flex items-start gap-6">
				<div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl font-bold shadow-lg">
					📖
				</div>
				<div class="flex-1">
					<h2 class="text-3xl font-bold text-gray-900 mb-3">Al-Qur'an</h2>
					<p class="text-gray-700 leading-relaxed mb-4">
						Melanjutkan tradisi hifdz dan tadabbur, kami memulai perjalanan ilmu dengan sejarah turunnya Al-Qur'an melalui Malaikat Jibril kepada Rasulullah ﷺ. Baca kisah dan garis waktunya di halaman Sejarah Quran.
					</p>
					<span class="inline-flex items-center gap-2 text-emerald-600 font-bold text-lg">
						Lihat Sejarah Quran →
					</span>
				</div>
			</div>
		</a>

<!-- Kitab Grid -->
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
	{#each [
		{
			icon: '🔤',
			title: 'Bahasa Arab',
			desc: 'Miftahul Lughoh & Amtsilah Tasrifiyah',
			color: 'border-blue-200'
		},
		{
			icon: '🤲',
			title: 'Aqidah',
			desc: 'Aqidatul Awam dan dasar Aswaja',
			color: 'border-purple-200'
		},
		{
			icon: '⚖️',
			title: 'Fiqih',
			desc: 'Safinatun Najah dan ibadah praktis',
			color: 'border-green-200'
		},
		{
			icon: '📜',
			title: 'Hadits',
			desc: 'Arbain Nawawi dan Mukhtaruh Ahadits',
			color: 'border-amber-200'
		},
		{
			icon: '✨',
			title: 'Tasawuf & Adab',
			desc: 'Bidayatul Hidayah, Minahus Saniyah',
			color: 'border-rose-200',
			wide: true
		}
	] as item}
		<a
			href={isLoggedIn ? '/kitab/coming-soon' : '/register'}
			class={`rounded-2xl border-2 ${item.color} bg-white p-6 shadow-lg transition hover:scale-[1.02] hover:shadow-2xl ${item.wide ? 'md:col-span-2' : ''}`}
		>
			<div class="flex items-center gap-3 mb-4">
				<span class="text-4xl">{item.icon}</span>
				<h2 class="text-2xl font-bold text-slate-800">{item.title}</h2>
			</div>
			<p class="text-gray-700">{item.desc}</p>
			<div class="mt-4 inline-flex items-center gap-2 text-emerald-600 font-semibold">
				{isLoggedIn ? 'Lihat detail (Coming Soon)' : 'Daftar untuk akses'}
				<span>→</span>
			</div>
		</a>
	{/each}
</div>

		<!-- Info Box -->
		<div class="mt-12 rounded-3xl border-2 border-indigo-200 bg-white p-8 shadow-lg">
			<h3 class="text-2xl font-bold text-gray-900 mb-4">📖 Tentang Kitab Turats</h3>
			<p class="text-gray-700 leading-relaxed">
				Daftar kitab ini menjadi fondasi sebelum santri melanjutkan ke turats lanjutan sesuai arahan para masyayikh. Setiap kitab dipilih karena kemudahan pemahaman, kedalaman ilmu, dan kesesuaian dengan tradisi pesantren Nusantara.
			</p>
		</div>
	</div>
</div>
