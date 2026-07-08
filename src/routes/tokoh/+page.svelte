<script lang="ts">
	import { nabiList } from '$lib/data/nabi';
	import { ulama } from '$lib/data/ulama';
	import { tabiinFigures } from '$lib/data/tabiin';
	import { tabiutTabiinFigures } from '$lib/data/tabiut-tabiin';

	const ahlulBaitTimeline = [
		{
			period: 'Makkah',
			title: 'Rumah Kenabian dan perlindungan Bani Hasyim',
			desc: 'Khadijah binti Khuwailid menjadi pendukung pertama dakwah Nabi Muhammad SAW. Ali bin Abi Thalib tumbuh dalam asuhan beliau, sementara keluarga besar Bani Hasyim ikut memikul tekanan sosial dan politik Quraisy.'
		},
		{
			period: 'Madinah',
			title: 'Keluarga Nabi dalam masyarakat wahyu',
			desc: 'Fatimah menikah dengan Ali, lalu lahir Hasan dan Husain. Para istri Nabi menjadi rujukan penting dalam hadis, fiqih rumah tangga, adab, ibadah, dan kehidupan pribadi Rasulullah SAW.'
		},
		{
			period: '11 H',
			title: 'Masa setelah wafat Nabi',
			desc: 'Umat Islam menghadapi urusan kepemimpinan, pengumpulan umat, dan penataan negara. Ahlul Bait tetap menjadi keluarga yang dimuliakan, namun sejarah politik awal Islam juga memunculkan perbedaan penilaian di kalangan umat.'
		},
		{
			period: '35-40 H',
			title: 'Kekhalifahan Ali bin Abi Thalib',
			desc: 'Ali menjadi khalifah keempat pada masa fitnah besar. Beliau dikenal sebagai pemimpin pemberani, ahli ilmu, dan anggota Ahlul Bait yang menjadi rujukan kuat dalam tafsir, fiqih, qadha, dan adab zuhud.'
		},
		{
			period: '41 H',
			title: 'Perdamaian Hasan bin Ali',
			desc: 'Hasan memilih jalan rekonsiliasi untuk menghentikan pertumpahan darah antar-Muslim. Keputusan ini sering dibaca sebagai contoh keluasan pandangan Ahlul Bait dalam menjaga keselamatan umat.'
		},
		{
			period: '61 H',
			title: 'Karbala dan syahidnya Husain',
			desc: 'Husain bin Ali gugur di Karbala bersama keluarga dan pengikutnya. Peristiwa ini menjadi luka besar dalam sejarah Islam, sekaligus simbol keberanian melawan kezaliman dan menjaga martabat agama.'
		},
		{
			period: 'Sesudahnya',
			title: 'Jalur ilmu, nasab, dan dakwah',
			desc: 'Keturunan Hasan dan Husain melahirkan banyak imam, ulama, zahid, dan pendakwah. Di berbagai negeri, termasuk Nusantara, keturunan Nabi dikenal dengan sebutan sayyid, syarif, habib, atau gelar lokal lain.'
		}
	];

	const ahlulBaitFigures = [
		{
			name: 'Khadijah binti Khuwailid',
			role: 'Istri pertama Nabi dan pendukung awal dakwah',
			desc: 'Memberi dukungan moral dan materi pada fase paling berat di Makkah.'
		},
		{
			name: 'Fatimah az-Zahra',
			role: 'Putri Nabi dan ibu keturunan Hasan-Husain',
			desc: 'Dikenal karena kesalehan, kesederhanaan, dan kedudukannya yang sangat dicintai Rasulullah SAW.'
		},
		{
			name: 'Ali bin Abi Thalib',
			role: 'Sepupu, menantu Nabi, dan khalifah keempat',
			desc: 'Tokoh ilmu, keberanian, dan pusat banyak jalur riwayat serta nasab Ahlul Bait.'
		},
		{
			name: 'Hasan bin Ali',
			role: 'Cucu Nabi dan tokoh perdamaian',
			desc: 'Dihormati karena memilih rekonsiliasi demi menghindari perang berkepanjangan.'
		},
		{
			name: 'Husain bin Ali',
			role: 'Cucu Nabi dan syahid Karbala',
			desc: 'Menjadi simbol keteguhan, pengorbanan, dan keberanian moral dalam sejarah Islam.'
		},
		{
			name: 'Ummul Mukminin',
			role: 'Para istri Nabi',
			desc: 'Menjadi rujukan penting dalam hadis, adab rumah tangga, fiqih ibadah, dan kehidupan Rasulullah SAW.'
		}
	];

	const sunniViews = [
		'Mencintai dan memuliakan Ahlul Bait adalah bagian dari adab agama. Shalawat dalam salat juga menyebut keluarga Nabi.',
		'Cakupan Ahlul Bait dipahami luas: para istri Nabi dalam konteks ayat Al-Ahzab 33, serta Ali, Fatimah, Hasan, Husain, dan keluarga Bani Hasyim dalam riwayat lain.',
		'Sunni menghormati Ali sebagai khalifah rasyid keempat dan imam besar ilmu, sambil tetap menghormati Abu Bakar, Umar, Utsman, dan para sahabat.',
		'Ahlul Bait dimuliakan, namun tidak dianggap maksum secara mutlak. Perbedaan politik awal Islam dibaca dengan kehati-hatian dan adab kepada seluruh generasi awal.'
	];

	const shiaViews = [
		'Ahlul Bait menjadi pusat otoritas keagamaan setelah Nabi, terutama melalui konsep imamah yang dimulai dari Ali bin Abi Thalib.',
		'Dalam Syiah Dua Belas Imam, imam dipandang sebagai pemimpin rohani yang ditunjuk dan dijaga Allah dari kesalahan dalam menyampaikan tuntunan agama.',
		'Peristiwa Ghadir Khumm, posisi Ali, dan tragedi Karbala menjadi titik penting dalam cara Syiah membaca sejarah kepemimpinan umat.',
		'Karbala diperingati sebagai pelajaran tentang kesetiaan, pengorbanan, dan perlawanan terhadap kezaliman, terutama melalui majelis duka dan ziarah.'
	];

	const sharedViews = [
		'Keduanya sepakat bahwa keluarga Nabi wajib dicintai, dihormati, dan tidak boleh dihina.',
		'Keduanya menempatkan Ali, Fatimah, Hasan, dan Husain sebagai tokoh agung dalam sejarah Islam.',
		'Keduanya melihat Karbala sebagai peristiwa tragis, meskipun cara memaknai dan memperingatinya berbeda.',
		'Keduanya mengakui bahwa Ahlul Bait memberi pengaruh besar dalam ilmu, akhlak, nasab, dan spiritualitas umat Islam.'
	];

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
			label: 'Ahlul Bait',
			href: '#ahlul-bait',
			count: 'Keluarga Nabi dan garis keturunan',
			era: 'Rumah kenabian',
			desc: 'Sejarah keluarga Rasulullah SAW, kedudukan Ali-Fatimah-Hasan-Husain, serta cara Sunni dan Syiah memandang Ahlul Bait.'
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
		<div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
			{#each ['Nabi', 'Sahabat', 'Ahlul Bait', "Tabi'in", "Tabi'ut Tabi'in", 'Ulama'] as step, index}
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
				<h2 class="mt-3 text-2xl font-semibold text-slate-900 group-hover:text-emerald-600">{card.era}</h2>
				<p class="mt-3 text-sm font-medium text-emerald-600">{card.count}</p>
				<p class="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
				<span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
					Buka halaman
					<span aria-hidden="true">></span>
				</span>
			</a>
		{/each}
	</section>

	<section id="ahlul-bait" class="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-sm">
		<div class="bg-[linear-gradient(135deg,#022c22,#0f766e_56%,#164e63)] px-6 py-8 text-white md:px-8">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/80">Ahlul Bait Nabi Muhammad</p>
			<div class="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
				<div>
					<h2 class="text-3xl font-semibold md:text-4xl">Sejarah keluarga Nabi dan dua cara pandang besar umat</h2>
					<p class="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 md:text-base">
						Ahlul Bait berarti keluarga atau penghuni rumah Nabi Muhammad SAW. Dalam sejarah Islam,
						istilah ini dipakai untuk memuliakan keluarga beliau, terutama para istri Nabi, Ali,
						Fatimah, Hasan, Husain, dan keturunan mereka. Perbedaan Sunni dan Syiah terutama muncul
						pada makna otoritas kepemimpinan setelah Nabi, bukan pada kewajiban mencintai keluarga beliau.
					</p>
				</div>
				<div class="rounded-2xl border border-white/15 bg-white/10 p-5">
					<p class="text-sm font-semibold text-emerald-50">Titik temu utama</p>
					<ul class="mt-3 space-y-2 text-sm leading-6 text-white/85">
						{#each sharedViews as view}
							<li>{view}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<div class="space-y-8 p-6 md:p-8">
			<section>
				<h3 class="text-2xl font-semibold text-slate-900">Siapa yang termasuk Ahlul Bait?</h3>
				<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each ahlulBaitFigures as figure}
						<article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
							<p class="text-lg font-semibold text-slate-900">{figure.name}</p>
							<p class="mt-1 text-sm font-medium text-emerald-600">{figure.role}</p>
							<p class="mt-3 text-sm leading-7 text-slate-600">{figure.desc}</p>
						</article>
					{/each}
				</div>
				<p class="mt-4 text-sm leading-7 text-slate-600">
					Dalam kitab tafsir dan hadis, cakupan Ahlul Bait dibahas dari beberapa dalil. Ayat Al-Ahzab
					33 berada dalam rangkaian nasihat kepada istri-istri Nabi, sedangkan hadis kisa memberi
					penekanan khusus kepada Ali, Fatimah, Hasan, dan Husain. Karena itu, banyak ulama menjelaskan
					istilah ini dengan cakupan bertingkat sesuai konteks dalilnya.
				</p>
			</section>

			<section>
				<h3 class="text-2xl font-semibold text-slate-900">Garis sejarah utama</h3>
				<div class="mt-4 grid gap-4">
					{#each ahlulBaitTimeline as item}
						<article class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[8rem_1fr]">
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{item.period}</p>
							<div>
								<h4 class="text-lg font-semibold text-slate-900">{item.title}</h4>
								<p class="mt-2 text-sm leading-7 text-slate-600">{item.desc}</p>
							</div>
						</article>
					{/each}
				</div>
			</section>

			<section class="grid gap-5 lg:grid-cols-2">
				<article class="rounded-2xl border border-sky-200 bg-sky-50 p-6">
					<h3 class="text-2xl font-semibold text-slate-900">Pandangan Sunni</h3>
					<ul class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
						{#each sunniViews as view}
							<li>{view}</li>
						{/each}
					</ul>
				</article>

				<article class="rounded-2xl border border-rose-200 bg-rose-50 p-6">
					<h3 class="text-2xl font-semibold text-slate-900">Pandangan Syiah</h3>
					<ul class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
						{#each shiaViews as view}
							<li>{view}</li>
						{/each}
					</ul>
				</article>
			</section>

			<section class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
				<h3 class="text-2xl font-semibold text-slate-900">Adab membaca perbedaan</h3>
				<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
					<p>
						Perbedaan Sunni dan Syiah tentang Ahlul Bait berhubungan dengan tafsir sejarah, dalil
						kepemimpinan, dan konsep otoritas agama. Membacanya perlu hati-hati: jangan memotong
						peristiwa sejarah dari konteks politiknya, dan jangan menjadikan perbedaan sebagai alasan
						untuk merendahkan keluarga Nabi atau generasi awal Islam.
					</p>
					<p>
						Bagi santri, pintu awal yang paling aman adalah adab: mencintai Nabi, memuliakan keluarga
						beliau, menghormati sahabat, dan belajar kepada guru yang mampu menjelaskan riwayat dengan
						sanad, ilmu, dan ketenangan.
					</p>
				</div>
			</section>
		</div>
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
