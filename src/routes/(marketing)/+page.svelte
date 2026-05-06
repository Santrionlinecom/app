<script lang="ts">
	import type { PageData } from './$types';

	import { isSuperAdminUser } from '$lib/auth/session-user';
	import { ACTIVE_CTA, INSTITUTIONS } from '$lib/config/institutions';
	import { FEATURES } from '$lib/features';

	export let data: PageData;

	const dashboardRoles = new Set(['admin', 'admin_lembaga', 'ustadz', 'ustadzah', 'santri', 'alumni']);

	const activeInstitutions = INSTITUTIONS.filter((institution) => institution.enabled);
	const upcomingInstitutions = INSTITUTIONS.filter((institution) => !institution.enabled);

	const featurePrograms = FEATURES.map((feature) => ({
		...feature,
		href: `/fitur/${feature.slug}`
	}));

	const platformModules = [
		{
			label: 'TPQ',
			title: 'Operasional TPQ',
			desc: 'Pendaftaran lembaga, kelas, santri, dan alur belajar Al-Qur’an ditampilkan dalam satu halaman.',
			href: '/tpq',
			cta: 'Buka halaman TPQ',
			bullets: ['Pendaftaran lembaga', 'Data kelas dan santri', 'Alur belajar harian'],
			classes: {
				card: 'border-lime-200/80 bg-lime-50/70',
				badge: 'bg-lime-100 text-lime-700',
				link: 'text-lime-700'
			}
		},
		{
			label: 'Kitab',
			title: 'Perpustakaan Kitab',
			desc: 'Kitab fondasi dan seri Durusul Lughah bisa dibuka langsung sebagai halaman belajar.',
			href: '/kitab',
			cta: 'Masuk ke perpustakaan',
			bullets: ['Aqidah sampai tasawuf', 'Belajar per bab', 'Pembaca PDF'],
			classes: {
				card: 'border-emerald-200/80 bg-emerald-50/70',
				badge: 'bg-emerald-100 text-emerald-700',
				link: 'text-emerald-700'
			}
		},
		{
			label: 'Buku',
			title: 'Buku Digital SantriOnline',
			desc: 'Kumpulan buku, novel, dan karya panjang dengan bab gratis serta bab berbayar.',
			href: '/buku',
			cta: 'Buka buku digital',
			bullets: ['Karya santri dan penulis muslim', 'Bab gratis dan berbayar', 'Ruang penulis'],
			classes: {
				card: 'border-emerald-200/80 bg-white',
				badge: 'bg-emerald-100 text-emerald-700',
				link: 'text-emerald-700'
			}
		},
		{
			label: 'Qur’an',
			title: 'Mushaf 30 Juz',
			desc: 'Akses mushaf digital per juz untuk membaca, murajaah, dan menghubungkan pembelajaran dengan bacaan langsung.',
			href: '/kitab/quran',
			cta: 'Buka mushaf',
			bullets: ['Tampilan lembar mushaf', 'Navigasi per juz', 'Cocok untuk setoran dan murajaah'],
			classes: {
				card: 'border-cyan-200/80 bg-cyan-50/70',
				badge: 'bg-cyan-100 text-cyan-700',
				link: 'text-cyan-700'
			}
		},
		{
			label: 'Tokoh',
			title: 'Nabi, Sahabat, Ulama',
			desc: 'Halaman tokoh memuat nabi, sahabat, ulama, dan jalur keilmuan dengan ringkas.',
			href: '/tokoh',
			cta: 'Jelajahi tokoh',
			bullets: ['25 nabi dan rasul', 'Sahabat, tabiin, ulama', 'Jaringan ilmu Aswaja'],
			classes: {
				card: 'border-amber-200/80 bg-amber-50/70',
				badge: 'bg-amber-100 text-amber-700',
				link: 'text-amber-700'
			}
		},
		{
			label: 'Dinasti',
			title: 'Peta Peradaban Islam',
			desc: 'Dinasti-dinasti Islam ditampilkan untuk membantu memahami sejarah dan perkembangan peradaban.',
			href: '/dinasti',
			cta: 'Lihat dinasti',
			bullets: ['Urutan dinasti utama', 'Lompatan sejarah Islam', 'Konteks lahirnya ulama dan kitab'],
			classes: {
				card: 'border-rose-200/80 bg-rose-50/70',
				badge: 'bg-rose-100 text-rose-700',
				link: 'text-rose-700'
			}
		},
		{
			label: 'Kalender',
			title: 'Kalender Hijriyah',
			desc: 'Kalender pasaran dan penanggalan Islam membantu mengatur agenda rutin dan kegiatan harian.',
			href: '/kalender',
			cta: 'Buka kalender',
			bullets: ['Hijriyah dan pasaran Jawa', 'Agenda rutin lembaga', 'Ritme kegiatan santri'],
			classes: {
				card: 'border-sky-200/80 bg-sky-50/70',
				badge: 'bg-sky-100 text-sky-700',
				link: 'text-sky-700'
			}
		},
		{
			label: 'Konten',
			title: 'Blog dan Pembinaan',
			desc: 'Artikel, tema harian, dan konten ditampilkan agar mudah dibaca dari depan.',
			href: '/blog',
			cta: 'Baca artikel',
			bullets: ['Materi penguatan santri', 'Halaman yang mudah dibagikan', 'Konten pendamping pembelajaran'],
			classes: {
				card: 'border-slate-200/80 bg-slate-50/80',
				badge: 'bg-slate-100 text-slate-700',
				link: 'text-slate-700'
			}
		}
	];

	const kitabCategories = [
		{
			label: 'Aqidah',
			title: 'Terjemah Akidatul Awam',
			desc: 'Dasar iman yang singkat dan cocok sebagai pondasi keyakinan santri pemula.',
			href: '/kitab/terjemah-aqidatul-awam',
			tone: 'border-violet-200 bg-violet-50 text-violet-700'
		},
		{
			label: 'Lughoh',
			title: 'Bahasa Arab Dasar',
			desc: 'Jalur Durusul Lughah untuk mengenal struktur bahasa Arab kitab secara bertahap.',
			href: '/kitab/bahasa-arab-dasar-1',
			tone: 'border-indigo-200 bg-indigo-50 text-indigo-700'
		},
		{
			label: 'Tajwid',
			title: 'Ilmu Tajwid Lengkap',
			desc: 'Pendamping tahsin untuk makhraj, sifat huruf, dan adab membaca Al-Qur’an.',
			href: '/kitab/ilmu-tajwid-lengkap',
			tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
		},
		{
			label: 'Hadits',
			title: "Syarah Arba'in Nawawiyah",
			desc: 'Hadits inti untuk pembinaan niat, iman, adab, dan akhlak harian.',
			href: '/kitab/terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied',
			tone: 'border-cyan-200 bg-cyan-50 text-cyan-700'
		},
		{
			label: 'Fiqih',
			title: 'Safinatun Najah',
			desc: 'Ruang belajar fiqih ibadah dasar untuk wudhu, shalat, puasa, dan adab praktis.',
			href: '/kitab/safinatun-najah-makna-perkata',
			tone: 'border-amber-200 bg-amber-50 text-amber-700'
		},
		{
			label: 'Tasawuf',
			title: 'Bidayatul Hidayah',
			desc: 'Pembinaan adab, niat, dzikir, dan penjagaan diri dalam rutinitas santri.',
			href: '/kitab/terjemah-bidayatul-hidayah',
			tone: 'border-rose-200 bg-rose-50 text-rose-700'
		}
	];

	const workflowSteps = [
		{
			step: '01',
			title: 'Pilih bagian yang dibutuhkan',
			desc: 'Halaman depan membantu orang menemukan TPQ, kitab, buku, atau materi lain dengan cepat.'
		},
		{
			step: '02',
			title: 'Buka materi atau layanan',
			desc: 'Setiap bagian bisa dibuka langsung tanpa harus berpindah menu terlalu jauh.'
		},
		{
			step: '03',
			title: 'Ikuti kegiatan belajar',
			desc: 'Materi, jadwal, dan bagian yang berkaitan dengan pembinaan bisa diakses dari halaman yang sama.'
		},
		{
			step: '04',
			title: 'Lanjut ke halaman lain',
			desc: 'Jika perlu, pengguna bisa melanjutkan ke halaman yang lebih spesifik sesuai kebutuhan.'
		}
	];

	const roleLanes = [
		{
			label: 'Pengelola lembaga',
			desc: 'Masuk ke halaman yang dibutuhkan untuk mengatur data lembaga dan kelas.'
		},
		{
			label: 'Guru',
			desc: 'Gunakan kitab, mushaf, dan bagian pembinaan untuk mendampingi belajar harian.'
		},
		{
			label: 'Santri',
			desc: 'Belajar per bab, membaca mushaf, dan membuka materi yang diperlukan.'
		},
		{
			label: 'Pengunjung',
			desc: 'Tetap bisa melihat tokoh, dinasti, kalender, blog, dan halaman yang terbuka untuk umum.'
		}
	];

	const platformStats = [
		{
			value: String(featurePrograms.length).padStart(2, '0'),
			label: 'Bagian belajar',
			note: 'halaman yang bisa dibuka dari beranda'
		},
		{
			value: String(kitabCategories.length).padStart(2, '0'),
			label: 'Kategori kitab',
			note: 'aqidah, lughoh, tajwid, hadits, fiqih, tasawuf'
		},
		{
			value: String(platformModules.length).padStart(2, '0'),
			label: 'Bagian utama',
			note: 'TPQ, kitab, buku, dan referensi'
		},
		{
			value: String(activeInstitutions.length).padStart(2, '0'),
			label: 'Pendaftaran dibuka',
			note: 'lembaga yang bisa didaftarkan sekarang'
		}
	];

	type MarketplaceLane = 'Semua' | 'Materi' | 'Belajar' | 'Lembaga';
	type MarketplaceItem = {
		lane: Exclude<MarketplaceLane, 'Semua'>;
		icon: string;
		title: string;
		desc: string;
		href: string;
		badge: string;
		tags: string[];
	};

	const marketplaceItems: MarketplaceItem[] = [
		{
			lane: 'Lembaga',
			icon: '📘',
			title: 'TPQ',
			desc: 'Pendaftaran lembaga, kelas, santri, dan alur belajar dalam satu tempat.',
			href: '/tpq',
			badge: 'Aktif',
			tags: ['Pendaftaran', 'Kelas', 'Setoran']
		},
		{
			lane: 'Materi',
			icon: '📚',
			title: 'Buku Digital',
			desc: 'Kumpulan buku, novel, dan karya panjang dengan bab gratis serta berbayar.',
			href: '/buku',
			badge: 'Buku',
			tags: ['Bacaan', 'Koin', 'Ruang penulis']
		},
		{
			lane: 'Materi',
			icon: '📖',
			title: 'Kitab',
			desc: 'Kumpulan kitab aqidah, lughoh, tajwid, hadits, fiqih, dan tasawuf.',
			href: '/kitab',
			badge: 'Referensi',
			tags: ['Per bab', 'PDF', 'Belajar']
		},
		{
			lane: 'Materi',
			icon: '🕌',
			title: 'Mushaf 30 Juz',
			desc: 'Mushaf digital untuk membaca, murajaah, dan setoran harian.',
			href: '/kitab/quran',
			badge: 'Mushaf',
			tags: ['30 Juz', 'Murajaah', 'Santri']
		},
		{
			lane: 'Materi',
			icon: '👥',
			title: 'Tokoh',
			desc: 'Ringkasan nabi, sahabat, tabiin, dan ulama untuk dibaca umum.',
			href: '/tokoh',
			badge: 'Referensi',
			tags: ['Nabi', 'Sahabat', 'Ulama']
		},
		{
			lane: 'Materi',
			icon: '🏰',
			title: 'Dinasti',
			desc: 'Ringkasan dinasti Islam dan alur sejarah peradaban.',
			href: '/dinasti',
			badge: 'Sejarah',
			tags: ['Timeline', 'Konteks', 'Visual']
		},
		{
			lane: 'Materi',
			icon: '🗓️',
			title: 'Kalender Hijriyah',
			desc: 'Kalender dan agenda untuk membantu mengatur kegiatan harian.',
			href: '/kalender',
			badge: 'Agenda',
			tags: ['Hijriyah', 'Pasaran', 'Rutin']
		},
		{
			lane: 'Materi',
			icon: '📰',
			title: 'Blog & Konten',
			desc: 'Artikel dan konten yang bisa dibaca dari halaman depan.',
			href: '/blog',
			badge: 'Konten',
			tags: ['Artikel', 'Publik', 'Pembinaan']
		},
		{
			lane: 'Belajar',
			icon: '🎓',
			title: 'Belajar Al-Quran',
			desc: 'Tahfidz dan tadabbur dengan setoran terjadwal dan evaluasi rutin.',
			href: '/fitur/belajar-alquran',
			badge: 'Belajar',
			tags: ['Tahfidz', 'Tajwid', 'Setoran']
		},
		{
			lane: 'Belajar',
			icon: '🤲',
			title: 'Dzikir & Doa',
			desc: 'Kumpulan dzikir harian dan doa untuk dipelajari.',
			href: '/fitur/dzikir-doa',
			badge: 'Belajar',
			tags: ['Wirid', 'Doa', 'Harian']
		},
		{
			lane: 'Belajar',
			icon: '🎯',
			title: 'Khataman Rutin',
			desc: 'Jadwal khataman berkala dengan target yang jelas.',
			href: '/fitur/khataman-rutin',
			badge: 'Belajar',
			tags: ['Khatam', 'Target', 'Jadwal']
		},
		{
			lane: 'Belajar',
			icon: '✨',
			title: 'Istighotsah',
			desc: 'Panduan istighotsah berjamaah dengan doa-doa pilihan.',
			href: '/fitur/istighotsah',
			badge: 'Belajar',
			tags: ['Jamaah', 'Doa', 'Luring']
		}
	];

	let marketplaceSearch = '';
	let marketplaceLane: MarketplaceLane = 'Semua';

	$: filteredMarketplaceItems = marketplaceItems.filter((item) => {
		const haystack = [item.title, item.desc, item.badge, item.lane, ...item.tags]
			.join(' ')
			.toLowerCase();
		const query = marketplaceSearch.trim().toLowerCase();
		const matchesSearch = !query || haystack.includes(query);
		const matchesLane = marketplaceLane === 'Semua' || item.lane === marketplaceLane;
		return matchesSearch && matchesLane;
	});

	$: primaryAction = isSuperAdminUser(data?.user)
		? { href: '/admin/super/overview', label: 'Masuk ke akun' }
		: dashboardRoles.has(data?.user?.role ?? '')
			? { href: '/dashboard', label: 'Masuk ke akun' }
			: { href: '/register', label: 'Daftarkan TPQ' };
</script>

<svelte:head>
	<title>Santri Online</title>
	<meta
		name="description"
		content="Santri Online memuat TPQ, kitab, mushaf, buku digital, tokoh, dinasti, kalender, dan halaman belajar lain dalam satu tempat."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen home-root">
	<section class="relative overflow-hidden">
		<div class="home-orb home-orb-left"></div>
		<div class="home-orb home-orb-right"></div>
		<div class="home-grid absolute inset-0 opacity-40"></div>
		<div class="container mx-auto px-4 pb-10 pt-14 md:pb-14 md:pt-20">
			<div class="grid items-start gap-8 xl:grid-cols-[1.08fr_0.92fr]">
				<div class="space-y-7 home-rise">
					<div class="flex flex-wrap items-center gap-3">
						<span class="home-chip home-chip-solid">Beranda</span>
						<span class="home-chip">Pilihan belajar</span>
						<span class="home-chip">app.santrionline.com</span>
					</div>

					<div class="space-y-4">
						<h1 class="home-title text-4xl leading-tight text-slate-950 md:text-6xl">
							Tempat untuk melihat TPQ, kitab, mushaf, buku, dan kegiatan belajar.
						</h1>
						<p class="max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
							Halaman depan ini disusun agar mudah dipahami. Santri Online bisa mencari bagian yang dibutuhkan
							dan langsung membuka halaman yang sesuai.
						</p>
					</div>

					<div class="rounded-[1.6rem] border border-white/70 bg-white/88 p-4 shadow-xl backdrop-blur">
						<div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
							<label class="input input-bordered flex items-center gap-2 rounded-full bg-white">
								<svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
									<path d="m21 21-4.35-4.35" />
									<circle cx="11" cy="11" r="7" />
								</svg>
								<input
									bind:value={marketplaceSearch}
									placeholder="Cari TPQ, buku, kitab, mushaf, atau kegiatan..."
									class="grow bg-transparent text-sm outline-none"
								/>
							</label>
							<a href={primaryAction.href} class="home-btn-primary whitespace-nowrap">{primaryAction.label}</a>
						</div>

						<div class="mt-4 flex flex-wrap gap-2">
							{#each ['Semua', 'Materi', 'Belajar', 'Lembaga'] as lane}
								<button
									type="button"
									class="home-chip"
									class:home-chip-solid={marketplaceLane === lane}
									on:click={() => (marketplaceLane = lane as MarketplaceLane)}
								>
									{lane}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						<a href="#etalase-utama" class="home-anchor">Pilihan Utama</a>
						<a href="#buku-digital" class="home-anchor">Buku Digital</a>
						<a href="#fitur-inti" class="home-anchor">Belajar</a>
						<a href="#kitab-kategori" class="home-anchor">Kategori Kitab</a>
						<a href="#roadmap" class="home-anchor">Sedang Disiapkan</a>
					</div>

					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{#each platformStats as stat}
							<div class="home-stat-card">
								<p class="text-3xl font-extrabold text-slate-950">{stat.value}</p>
								<p class="mt-2 text-sm font-semibold text-slate-800">{stat.label}</p>
								<p class="mt-1 text-sm leading-6 text-slate-500">{stat.note}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="home-panel home-rise space-y-4" style="animation-delay: 120ms">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Pilihan cepat</p>
							<h2 class="mt-2 text-2xl font-bold text-slate-950">Bagian yang sering dibuka</h2>
						</div>
						<span class="home-chip home-chip-tinted">Aktif</span>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						{#each filteredMarketplaceItems.slice(0, 4) as item}
							<a href={item.href} class="home-mini-card">
								<div class="flex items-start justify-between gap-3">
									<span class="text-2xl">{item.icon}</span>
									<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
										{item.badge}
									</span>
								</div>
								<h3 class="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
								<p class="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
							</a>
						{/each}
					</div>

					<div class="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
							Pintasan
						</p>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each platformModules as module}
								<a href={module.href} class="home-quick-link">{module.label}</a>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section id="etalase-utama" class="container mx-auto px-4 py-6 md:py-8">
		<div class="home-surface border-emerald-200/80 bg-white/90 p-5 md:p-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div class="max-w-3xl">
					<p class="home-eyebrow text-emerald-600">Pilihan Utama</p>
					<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
						Bagian yang bisa dibuka langsung dari beranda.
					</h2>
					<p class="mt-3 text-base leading-7 text-slate-600">
						Cari, pilih, dan buka bagian yang diperlukan. TPQ, kitab, mushaf, buku digital, dan
						kegiatan belajar disusun sebagai kartu yang mudah dibaca di layar kecil.
					</p>
				</div>
				<div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
					<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
					{filteredMarketplaceItems.length} bagian ditemukan
				</div>
			</div>

			<div class="mt-5 flex flex-wrap gap-2">
				{#each featurePrograms.slice(0, 4) as feature}
					<span class="home-chip">{feature.title}</span>
				{/each}
			</div>

			<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#if filteredMarketplaceItems.length === 0}
					<div class="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
						Tidak ada item yang cocok dengan pencarian atau filter saat ini.
					</div>
				{:else}
					{#each filteredMarketplaceItems as item}
						<a
							href={item.href}
							class="home-card rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
						>
							<div class="flex items-start justify-between gap-3">
								<span class="text-3xl">{item.icon}</span>
								<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
									{item.lane}
								</span>
							</div>
							<h3 class="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
							<div class="mt-4 flex flex-wrap gap-2">
								{#each item.tags as tag}
									<span class="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
										{tag}
									</span>
								{/each}
							</div>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</section>

	<section id="buku-digital" class="container mx-auto px-4 py-6 md:py-8">
		<div class="home-surface grid gap-5 border-emerald-200/80 bg-white/88 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
			<div>
				<p class="home-eyebrow text-emerald-600">Buku Digital SantriOnline</p>
				<h2 class="home-heading mt-2 text-2xl text-slate-950 md:text-3xl">
					Baca karya santri dan penulis muslim.
				</h2>
				<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
					Bab gratis dan bab berbayar ditampilkan di sini. Penulis yang sudah login bisa membuka ruang
					penulis untuk mengelola karya.
				</p>
			</div>
			<div class="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
				<a href="/buku" class="home-btn-primary">Buka Buku Digital</a>
				<a href="/buku/studio" class="home-btn-secondary">Studio Penulis</a>
			</div>
		</div>
	</section>

	<section class="container mx-auto px-4 py-6 md:py-8">
		<div class="home-surface grid gap-4 border-slate-200/80 bg-white/80 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
			<div>
				<p class="home-eyebrow text-emerald-600">Ringkasan</p>
				<h2 class="home-heading mt-2 text-2xl text-slate-950 md:text-3xl">
					Ringkas, jelas, dan mudah dibaca.
				</h2>
				<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
					Santri Online saat ini terutama dipakai untuk TPQ. Bagian lain tetap ditampilkan agar pengunjung
					tahu apa yang bisa dibuka sekarang dan apa yang masih disiapkan.
				</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each roleLanes as lane}
					<div class="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4">
						<p class="text-sm font-semibold text-slate-900">{lane.label}</p>
						<p class="mt-2 text-sm leading-6 text-slate-500">{lane.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section id="ekosistem" class="container mx-auto px-4 py-10 md:py-14 home-section">
		<div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div class="max-w-3xl">
				<p class="home-eyebrow text-emerald-600">Bagian Lain</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
					Bagian lain yang bisa dibuka dari halaman depan.
				</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Bagian ini membantu orang melihat semua halaman yang tersedia tanpa harus mencari terlalu jauh.
				</p>
			</div>
			<a href="/tentang" class="home-btn-secondary w-full text-center md:w-auto">Lihat profil</a>
		</div>

		<div class="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
			{#each platformModules as module, index}
				<a
					href={module.href}
					class={`home-card rounded-[1.8rem] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${module.classes.card}`}
					style={`animation-delay: ${index * 70}ms`}
				>
					<div class="flex items-center justify-between gap-3">
						<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${module.classes.badge}`}>
							{module.label}
						</span>
						<span class={`text-sm font-semibold ${module.classes.link}`}>{module.cta}</span>
					</div>
					<h3 class="mt-5 text-2xl font-semibold text-slate-950">{module.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{module.desc}</p>
					<ul class="mt-5 space-y-2 text-sm text-slate-600">
						{#each module.bullets as bullet}
							<li class="flex items-start gap-2">
								<span class={`mt-1 text-base leading-none ${module.classes.link}`}>•</span>
								<span>{bullet}</span>
							</li>
						{/each}
					</ul>
				</a>
			{/each}
		</div>
	</section>

	<section id="fitur-inti" class="container mx-auto px-4 py-10 md:py-14 home-section">
		<div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div class="max-w-3xl">
				<p class="home-eyebrow text-emerald-600">Kegiatan Belajar</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
					Kegiatan yang sering dipakai sekarang tampil lebih jelas.
				</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Setiap bagian menampilkan ringkasan singkat supaya pengunjung cepat paham isinya.
				</p>
			</div>
			<a href="/fitur" class="home-btn-secondary w-full text-center md:w-auto">Lihat semua kegiatan</a>
		</div>

		<div class="grid gap-6 xl:grid-cols-2">
			{#each featurePrograms as feature, index}
				<a
					href={feature.href}
					class="home-feature-card group"
					style={`animation-delay: ${index * 80}ms`}
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-start gap-4">
							<span class="mt-1 text-4xl">{feature.icon}</span>
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Fitur aktif</p>
								<h3 class="mt-2 text-2xl font-semibold text-slate-950">{feature.title}</h3>
								<p class="mt-2 text-sm leading-7 text-slate-600">{feature.desc}</p>
							</div>
						</div>
						<span class="home-feature-cta">{feature.cta}</span>
					</div>

					<p class="mt-5 rounded-[1.25rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-7 text-slate-700">
						{feature.highlight}
					</p>

					<ul class="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
						{#each feature.bullets as bullet}
							<li class="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/80 p-4 leading-6">
								{bullet}
							</li>
						{/each}
					</ul>
				</a>
			{/each}
		</div>
	</section>

	<section id="kitab-kategori" class="container mx-auto px-4 py-10 md:py-14 home-section">
		<div class="home-surface border-emerald-100/80 bg-white/88 p-6 md:p-8">
			<div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div class="max-w-3xl">
					<p class="home-eyebrow text-emerald-600">Kategori Kitab</p>
					<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
						Kitab utama bisa dibuka langsung dari kelompok pelajarannya.
					</h2>
					<p class="mt-3 text-base leading-7 text-slate-600">
						Kelompok kitab dibuat jelas supaya guru, santri, dan orang tua cepat menemukan materi yang
						sesuai.
					</p>
				</div>
				<a href="/kitab" class="home-btn-secondary w-full text-center md:w-auto">Lihat semua kitab</a>
			</div>

			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each kitabCategories as category}
					<a href={category.href} class="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
						<span class={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${category.tone}`}>
							{category.label}
						</span>
						<h3 class="mt-4 text-xl font-semibold text-slate-950">{category.title}</h3>
						<p class="mt-3 text-sm leading-7 text-slate-600">{category.desc}</p>
						<span class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
							Buka kitab
							<span>→</span>
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section id="alur-produk" class="container mx-auto px-4 py-10 md:py-14 home-section">
		<div class="mb-10 max-w-3xl">
			<p class="home-eyebrow text-emerald-600">Cara Memakai</p>
			<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
				Cara memakai halaman ini dibuat singkat dan mudah dibaca.
			</h2>
			<p class="mt-3 text-base leading-7 text-slate-600">
				Tujuannya supaya pengunjung langsung tahu harus mulai dari mana.
			</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-4">
			{#each workflowSteps as item}
				<div class="home-workflow-card">
					<span class="home-workflow-step">{item.step}</span>
					<h3 class="mt-6 text-xl font-semibold text-slate-950">{item.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<section id="roadmap" class="container mx-auto px-4 py-10 md:py-14 home-section">
		<div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
			<div class="home-surface border-emerald-200/80 bg-emerald-50/70 p-6 md:p-8">
				<p class="home-eyebrow text-emerald-700">Yang Dibuka Sekarang</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950">Pendaftaran yang dibuka sekarang</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Halaman ini menampilkan bagian yang memang bisa didaftarkan sekarang.
				</p>

				<div class="mt-6 space-y-4">
					{#each activeInstitutions as institution}
						<a
							href={institution.route}
							class={`block rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${institution.classes.card}`}
						>
							<div class="flex items-center justify-between gap-4">
								<div>
									<span class={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${institution.classes.badge}`}>
										{institution.category}
									</span>
									<h3 class={`mt-4 text-2xl font-semibold ${institution.classes.accent}`}>{institution.label}</h3>
								</div>
								<span class="text-3xl">{institution.icon}</span>
							</div>
							<p class="mt-4 text-sm leading-7 text-slate-600">{institution.description}</p>
							<ul class="mt-4 space-y-2 text-sm text-slate-600">
								{#each institution.highlights as highlight}
									<li class="flex items-center gap-2">
										<span class="text-emerald-600">•</span>
										<span>{highlight}</span>
									</li>
								{/each}
							</ul>
							<span class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
								{ACTIVE_CTA}
								<span>→</span>
							</span>
						</a>
					{/each}
				</div>
			</div>

			<div class="home-surface border-slate-200/80 bg-white/88 p-6 md:p-8">
				<p class="home-eyebrow text-slate-500">Sedang Disiapkan</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950">Arah pengembangan berikutnya</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Pondok, masjid, musholla, dan rumah tahfidz tetap ditampilkan sebagai bagian yang sedang
					disiapkan.
				</p>

				<div class="mt-6 grid gap-4 sm:grid-cols-2">
					{#each upcomingInstitutions as institution}
						<div class="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-5">
							<div class="flex items-center justify-between gap-3">
								<span class="text-2xl">{institution.icon}</span>
								<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
									Roadmap
								</span>
							</div>
							<h3 class="mt-4 text-lg font-semibold text-slate-900">{institution.label}</h3>
							<p class="mt-2 text-sm leading-6 text-slate-500">{institution.description}</p>
							<ul class="mt-4 space-y-2 text-sm text-slate-500">
								{#each institution.highlights as highlight}
									<li class="flex items-start gap-2">
										<span class="mt-1 text-slate-400">•</span>
										<span>{highlight}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="container mx-auto px-4 pb-16 pt-10 md:pb-20 md:pt-14">
		<div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white shadow-2xl md:p-12">
			<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs font-semibold uppercase tracking-[0.34em] text-white/75">Ringkasan Akhir</p>
				<h2 class="home-heading mt-3 text-3xl text-white md:text-4xl">
					Halaman utama ini dibuat sebagai pintu masuk yang mudah dipahami.
				</h2>
				<p class="mt-4 text-base leading-8 text-white/88 md:text-lg">
					Pengguna bisa langsung melihat bagian yang tersedia sekarang, kegiatan belajar yang sering
					dipakai, kategori kitab, dan halaman referensi lain yang terbuka.
				</p>
				<div class="mt-8 flex flex-col gap-4 sm:flex-row">
					<a href={primaryAction.href} class="btn border-none bg-white text-emerald-700 hover:bg-emerald-50">
						{primaryAction.label}
					</a>
					<a href="/fitur" class="btn border-white/20 bg-white/10 text-white hover:bg-white/15">
						Lihat semua kegiatan
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home-root {
		--so-display: 'Space Grotesk', 'Manrope', sans-serif;
		--so-body: 'Manrope', sans-serif;
		--so-ink: #0f172a;
		--so-muted: #475569;
		--so-accent: #0f766e;
		background:
			radial-gradient(60% 50% at 10% 10%, rgba(13, 148, 136, 0.16), transparent 62%),
			radial-gradient(38% 36% at 92% 0%, rgba(14, 165, 233, 0.18), transparent 55%),
			linear-gradient(180deg, #f0fdfa 0%, #ffffff 48%, #f8fafc 100%);
		color: var(--so-ink);
		font-family: var(--so-body);
	}

	.home-title,
	.home-heading {
		font-family: var(--so-display);
		letter-spacing: -0.035em;
	}

	.home-eyebrow {
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.34em;
		text-transform: uppercase;
	}

	.home-grid {
		background-image:
			linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
		background-size: 52px 52px;
		mask-image: linear-gradient(180deg, rgba(15, 23, 42, 0.5), transparent 78%);
	}

	.home-chip {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		border: 1px solid rgba(15, 118, 110, 0.12);
		background: rgba(255, 255, 255, 0.84);
		padding: 0.62rem 0.95rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #0f766e;
		backdrop-filter: blur(8px);
	}

	.home-chip-solid {
		border-color: rgba(15, 118, 110, 0.18);
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(6, 182, 212, 0.16));
	}

	.home-chip-tinted {
		border-color: rgba(16, 185, 129, 0.18);
		background: rgba(16, 185, 129, 0.1);
		color: #047857;
	}

	.home-anchor {
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(255, 255, 255, 0.72);
		padding: 0.7rem 1rem;
		color: #334155;
		transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
	}

	.home-anchor:hover {
		transform: translateY(-1px);
		border-color: rgba(15, 118, 110, 0.25);
		background: rgba(255, 255, 255, 0.94);
	}

	.home-btn-primary,
	.home-btn-secondary,
	.home-btn-ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.95rem 1.7rem;
		font-weight: 700;
		transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
	}

	.home-btn-primary {
		background: linear-gradient(135deg, #0f766e, #14b8a6);
		color: #ffffff;
		box-shadow: 0 22px 50px rgba(13, 148, 136, 0.25);
	}

	.home-btn-secondary,
	.home-btn-ghost {
		border: 1px solid rgba(15, 118, 110, 0.16);
		background: rgba(255, 255, 255, 0.86);
		color: #0f766e;
	}

	.home-btn-primary:hover,
	.home-btn-secondary:hover,
	.home-btn-ghost:hover {
		transform: translateY(-2px);
	}

	.home-btn-primary:hover {
		box-shadow: 0 28px 60px rgba(13, 148, 136, 0.32);
	}

	.home-btn-secondary:hover,
	.home-btn-ghost:hover {
		box-shadow: 0 18px 42px rgba(15, 118, 110, 0.16);
	}

	.home-panel,
	.home-surface,
	.home-feature-card,
	.home-workflow-card {
		border-radius: 1.8rem;
		border: 1px solid rgba(148, 163, 184, 0.18);
		backdrop-filter: blur(14px);
	}

	.home-panel {
		background: rgba(255, 255, 255, 0.82);
		padding: 1.5rem;
		box-shadow: 0 28px 60px rgba(15, 23, 42, 0.08);
	}

	.home-surface {
		box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
	}

	.home-stat-card {
		border-radius: 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.16);
		background: rgba(255, 255, 255, 0.82);
		padding: 1.1rem 1rem;
		box-shadow: 0 16px 30px rgba(15, 23, 42, 0.04);
	}

	.home-summary-card {
		border-radius: 1.6rem;
		padding: 1rem;
	}

	.home-mini-card,
	.home-quick-link {
		border-radius: 1.2rem;
		border: 1px solid rgba(148, 163, 184, 0.16);
		background: rgba(255, 255, 255, 0.9);
		transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
	}

	.home-mini-card {
		padding: 1rem;
	}

	.home-mini-card:hover,
	.home-quick-link:hover {
		transform: translateY(-2px);
		border-color: rgba(16, 185, 129, 0.18);
		box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
	}

	.home-quick-link {
		display: inline-flex;
		align-items: center;
		padding: 0.72rem 0.92rem;
		font-size: 0.82rem;
		font-weight: 700;
		color: #334155;
	}

	.home-feature-card {
		position: relative;
		overflow: hidden;
		background:
			radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 30%),
			rgba(255, 255, 255, 0.88);
		padding: 1.6rem;
		box-shadow: 0 20px 52px rgba(15, 23, 42, 0.06);
		transition: transform 0.24s ease, box-shadow 0.24s ease;
	}

	.home-feature-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 26px 60px rgba(15, 23, 42, 0.08);
	}

	.home-feature-cta {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		background: rgba(16, 185, 129, 0.1);
		padding: 0.6rem 0.9rem;
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.4;
		color: #047857;
		text-align: right;
	}

	.home-workflow-card {
		position: relative;
		background: rgba(255, 255, 255, 0.9);
		padding: 1.5rem;
		box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
	}

	.home-workflow-step {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 3rem;
		width: 3rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #0f766e, #14b8a6);
		font-family: var(--so-display);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: white;
		box-shadow: 0 16px 32px rgba(13, 148, 136, 0.22);
	}

	.home-orb {
		position: absolute;
		height: 24rem;
		width: 24rem;
		border-radius: 999px;
		opacity: 0.45;
		animation: drift 16s ease-in-out infinite;
	}

	.home-orb-left {
		left: -8rem;
		top: -7rem;
		background: radial-gradient(circle, rgba(16, 185, 129, 0.36), transparent 60%);
	}

	.home-orb-right {
		right: -11rem;
		top: 2rem;
		background: radial-gradient(circle, rgba(14, 165, 233, 0.34), transparent 60%);
		animation-delay: 1.8s;
	}

	.home-rise,
	.home-card,
	.home-section,
	.home-feature-card {
		animation: rise 0.85s ease both;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes drift {
		0% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(16px, 20px);
		}
		100% {
			transform: translate(0, 0);
		}
	}

	@media (max-width: 767px) {
		.home-feature-cta {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home-rise,
		.home-card,
		.home-section,
		.home-feature-card,
		.home-orb {
			animation: none;
		}

		.home-btn-primary,
		.home-btn-secondary,
		.home-btn-ghost,
		.home-anchor,
		.home-mini-card,
		.home-quick-link {
			transition: none;
		}
	}
</style>
