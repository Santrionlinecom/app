<script lang="ts">
	import { nabiList } from '$lib/data/nabi';
	import { ulama } from '$lib/data/ulama';
	import { tabiinFigures } from '$lib/data/tabiin';
	import { tabiutTabiinFigures } from '$lib/data/tabiut-tabiin';

	const tokohCards = [
		{
			label: 'Nabi',
			href: '/nabi',
			count: `${nabiList.length} tokoh`,
			era: 'Wahyu dan risalah',
			desc: 'Para utusan Allah yang menjadi fondasi akidah, akhlak, dan sejarah kenabian.'
		},
		{
			label: 'Sahabat',
			href: '/sahabat',
			count: 'Khulafaur Rasyidin dan Ahlul Badr',
			era: 'Generasi penerima wahyu',
			desc: 'Generasi yang menyaksikan Nabi Muhammad SAW, menjaga sunnah, dan membawa Islam keluar Jazirah Arab.'
		},
		{
			label: "Tabi'in",
			href: '/tabiin',
			count: `${tabiinFigures.length} tokoh utama`,
			era: 'Generasi setelah sahabat',
			desc: 'Murid para sahabat yang menyusun fiqih awal, periwayatan hadis, dan adab dakwah di pusat-pusat ilmu.'
		},
		{
			label: "Tabi'ut Tabi'in",
			href: '/tabiut-tabiin',
			count: `${tabiutTabiinFigures.length} tokoh utama`,
			era: 'Generasi kodifikasi',
			desc: 'Jembatan antara tradisi sahabat-tabiin dengan lahirnya mazhab, kritik hadis, dan kitab-kitab awal.'
		},
		{
			label: 'Ulama',
			href: '/ulama',
			count: `${ulama.length}+ tokoh ulama utama`,
			era: 'Jaringan sanad berlanjut',
			desc: 'Para imam mazhab dan ulama besar yang merawat tradisi Aswaja dari Baghdad, Damaskus, Mesir, hingga Nusantara.'
		}
	];
</script>

<svelte:head>
	<title>Tokoh Islam - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-16 top-10 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-sky-200/70">Tokoh Islam</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Rantai generasi dari nabi sampai ulama</h1>
			<p class="mt-4 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
				Halaman ini memetakan urutan generasi ilmu dalam sejarah Islam: nabi, sahabat, tabi'in,
				tabi'ut tabi'in, lalu ulama. Susunan ini membantu melihat bagaimana sanad ilmu berpindah
				dari wahyu, ke para saksi wahyu, lalu ke generasi periwayat dan pengkodifikasi.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<div class="grid gap-4 md:grid-cols-5">
			{#each ['Nabi', 'Sahabat', "Tabi'in", "Tabi'ut Tabi'in", 'Ulama'] as step, index}
				<div class="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
					<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Tahap {index + 1}</p>
					<p class="mt-3 text-lg font-semibold text-slate-900">{step}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
		{#each tokohCards as card}
			<a
				href={card.href}
				class="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
			>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900 group-hover:text-emerald-700">{card.era}</h2>
				<p class="mt-3 text-sm font-medium text-emerald-700">{card.count}</p>
				<p class="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
				<span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
					Buka halaman
					<span aria-hidden="true">></span>
				</span>
			</a>
		{/each}
	</section>

	<section class="rounded-[1.75rem] border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Cara membaca peta tokoh</h2>
		<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
			<p>
				Nabi adalah sumber wahyu. Sahabat menerima langsung bimbingan Rasulullah SAW. Tabi'in
				adalah murid para sahabat. Tabi'ut Tabi'in ialah murid generasi tabi'in yang mulai
				menguatkan fase kodifikasi. Ulama melanjutkan sanad itu dalam bentuk mazhab, kitab,
				pesantren, dan dakwah lintas wilayah.
			</p>
			<p>
				Di lapangan sejarah, generasi-generasi ini tidak selalu berhenti total lalu berganti. Sebagian
				masa hidup mereka saling bertumpang tindih, tetapi pembagian ini tetap penting sebagai kerangka
				standar dalam ilmu hadis, fiqih, dan sejarah Islam.
			</p>
		</div>
	</section>
</div>
