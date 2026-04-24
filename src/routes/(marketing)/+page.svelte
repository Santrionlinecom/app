<script lang="ts">
	import type { PageData } from './$types';

	import { isSuperAdminUser } from '$lib/auth/session-user';
	import FeatureIcon from '$lib/components/FeatureIcon.svelte';
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
			desc: 'Pendaftaran lembaga, kelas, santri, dan alur belajar Al-Qur’an ditampilkan sebagai jalur utama produk.',
			href: '/tpq',
			cta: 'Buka halaman TPQ',
			bullets: ['Landing lembaga TPQ', 'Alur pendaftaran dan onboarding', 'Fokus operasional lembaga harian'],
			classes: {
				card: 'border-lime-200/80 bg-lime-50/70',
				badge: 'bg-lime-100 text-lime-700',
				link: 'text-lime-700'
			}
		},
		{
			label: 'Kitab',
			title: 'Perpustakaan Kitab',
			desc: 'Kitab fondasi dan seri Durusul Lughah sudah tampil sebagai halaman belajar, bukan hanya viewer PDF.',
			href: '/kitab',
			cta: 'Masuk ke perpustakaan',
			bullets: ['Kategori Aqidah sampai Tasawuf', 'Mode santri per bab', 'Viewer PDF dan halaman edukasi'],
			classes: {
				card: 'border-emerald-200/80 bg-emerald-50/70',
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
			desc: 'Halaman referensi tokoh menampilkan jalur kenabian, generasi salaf, ulama, dan sanad keilmuan secara tematik.',
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
			desc: 'Dinasti-dinasti Islam ditampilkan untuk memberi konteks sejarah keilmuan, politik, dan perkembangan peradaban.',
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
			desc: 'Kalender pasaran dan penanggalan Islam memudahkan agenda rutin, khataman, dan kegiatan pembinaan harian.',
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
			desc: 'Artikel, penguatan tema harian, dan jalur konten publik ikut dimunculkan agar homepage terasa lengkap.',
			href: '/blog',
			cta: 'Baca artikel',
			bullets: ['Materi penguatan santri', 'Halaman publik yang mudah dibagikan', 'Konten pendamping pembelajaran'],
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
			title: 'Daftarkan lembaga',
			desc: 'Homepage langsung mengarahkan calon pengguna ke jalur pendaftaran TPQ atau dashboard jika sudah login.'
		},
		{
			step: '02',
			title: 'Susun kelas dan materi',
			desc: 'Pembelajaran Al-Qur’an, kitab, dan materi pendamping bisa diposisikan dari depan tanpa mencari terlalu jauh.'
		},
		{
			step: '03',
			title: 'Jalankan pembinaan rutin',
			desc: 'Dzikir, istighotsah, khataman, dan hafalan tampil sebagai program aktif yang mudah diakses.'
		},
		{
			step: '04',
			title: 'Pantau dan kembangkan',
			desc: 'Lembaga bisa melanjutkan ke dashboard, sementara publik tetap bisa mengakses referensi kitab dan konten ilmiah.'
		}
	];

	const roleLanes = [
		{
			label: 'Admin lembaga',
			desc: 'Masuk dari halaman depan ke dashboard untuk mengelola lembaga, kelas, dan operasional.'
		},
		{
			label: 'Ustadz/Ustadzah',
			desc: 'Gunakan fitur kitab, mushaf, dan program pembinaan untuk memandu pembelajaran harian.'
		},
		{
			label: 'Santri',
			desc: 'Belajar per bab, membaca mushaf, dan membuka referensi materi dengan tampilan yang lebih ringan.'
		},
		{
			label: 'Publik',
			desc: 'Tetap bisa menjelajahi tokoh, dinasti, kalender, blog, dan halaman-halaman edukasi terbuka.'
		}
	];

	const platformStats = [
		{
			value: String(featurePrograms.length).padStart(2, '0'),
			label: 'Program pembinaan',
			note: 'fitur publik aktif di halaman depan'
		},
		{
			value: String(kitabCategories.length).padStart(2, '0'),
			label: 'Kategori kitab',
			note: 'aqidah, lughoh, tajwid, hadits, fiqih, tasawuf'
		},
		{
			value: String(platformModules.length).padStart(2, '0'),
			label: 'Area produk publik',
			note: 'operasional, referensi, dan konten'
		},
		{
			value: String(activeInstitutions.length).padStart(2, '0'),
			label: 'Lembaga aktif',
			note: 'jalur pendaftaran yang terbuka sekarang'
		}
	];

	$: primaryAction = isSuperAdminUser(data?.user)
		? { href: '/admin/super/overview', label: 'Buka Super Admin' }
		: dashboardRoles.has(data?.user?.role ?? '')
			? { href: '/dashboard', label: 'Buka Dashboard' }
			: { href: '/register', label: 'Daftarkan TPQ' };
</script>

<svelte:head>
	<title>Santri Online - Platform Digital TPQ, Kitab, dan Pembelajaran Santri</title>
	<meta
		name="description"
		content="Platform Santri Online untuk operasional TPQ, pembelajaran Al-Qur'an, kitab, mushaf, tokoh, dinasti, kalender, dan konten pembinaan dalam satu halaman depan."
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
						<span class="home-chip home-chip-solid">Platform Digital Santri</span>
						<span class="home-chip">Fokus operasional TPQ</span>
						<span class="home-chip">Semua area publik ditampilkan</span>
					</div>

					<div class="space-y-4">
						<h1 class="home-title text-[2rem] leading-[1.14] text-slate-950 sm:text-4xl md:text-6xl">
							Platform digital TPQ, kitab, dan pembinaan santri.
						</h1>
						<p class="max-w-3xl text-base leading-7 text-slate-600 md:text-xl md:leading-8">
							Santri Online tidak lagi berhenti di hero promosi. Homepage ini sekarang memetakan jalur
							operasional TPQ, fitur pembinaan, kategori kitab, mushaf, tokoh, sejarah, kalender, dan
							konten publik yang memang sudah tersedia.
						</p>
					</div>

					<div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
						<a href={primaryAction.href} class="home-btn-primary">{primaryAction.label}</a>
						<a href="#fitur-inti" class="home-btn-secondary">Lihat fitur inti</a>
						<a href="/kitab" class="home-btn-ghost">Buka perpustakaan kitab</a>
					</div>

					<div class="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						<a href="#ekosistem" class="home-anchor">Ekosistem Publik</a>
						<a href="#fitur-inti" class="home-anchor">Pembinaan</a>
						<a href="#kitab-kategori" class="home-anchor">Kategori Kitab</a>
						<a href="#alur-produk" class="home-anchor">Alur Produk</a>
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

				<div class="home-panel home-rise" style="animation-delay: 120ms">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Status halaman utama</p>
							<h2 class="mt-2 text-2xl font-bold text-slate-950">Tampilan depan sekarang lebih lengkap</h2>
						</div>
						<span class="home-chip home-chip-tinted">Live</span>
					</div>

					<div class="mt-6 space-y-4">
						<div class="home-summary-card border-emerald-200 bg-emerald-50/80">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-sm font-semibold text-emerald-800">Aktif sekarang</p>
									<p class="mt-2 text-sm leading-6 text-slate-600">
										Fokus produk tetap di TPQ, tetapi homepage juga menampilkan fitur pembinaan dan
										area referensi publik secara utuh.
									</p>
								</div>
								<span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
									TPQ
								</span>
							</div>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							{#each featurePrograms.slice(0, 4) as feature}
								<a href={feature.href} class="home-mini-card">
									<div class="flex items-center justify-between gap-3">
										<span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
											<FeatureIcon slug={feature.slug} className="h-5 w-5" />
										</span>
										<span class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
											Program
										</span>
									</div>
									<h3 class="mt-3 text-base font-semibold text-slate-900">{feature.title}</h3>
									<p class="mt-2 text-sm leading-6 text-slate-500">{feature.highlight}</p>
								</a>
							{/each}
						</div>

						<div class="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5">
							<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
								Jalur cepat
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
		</div>
	</section>

	<section class="container mx-auto px-4 py-6 md:py-8">
		<div class="home-surface grid gap-4 border-slate-200/80 bg-white/80 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
			<div>
				<p class="home-eyebrow text-emerald-600">Posisi Produk</p>
				<h2 class="home-heading mt-2 text-2xl text-slate-950 md:text-3xl">
					Profesional di tampilan, tetap jelas soal fokus produk.
				</h2>
				<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
					Santri Online saat ini dibuka untuk operasional TPQ. Lembaga lain tetap dimunculkan sebagai arah
					pengembangan, tetapi homepage menegaskan apa yang benar-benar live hari ini agar pengguna tidak
					bingung.
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
				<p class="home-eyebrow text-emerald-600">Ekosistem Publik</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
					Semua area yang sudah tersedia sekarang ikut tampil di depan.
				</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Bagian ini menutup kekurangan homepage lama. Pengguna sekarang bisa langsung melihat semua pintu
					produk publik yang sudah hidup tanpa harus menebak-nebak dari menu header.
				</p>
			</div>
			<a href="/tentang" class="home-btn-secondary w-full text-center md:w-auto">Lihat profil platform</a>
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
				<p class="home-eyebrow text-emerald-600">Program Pembinaan</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
					Semua fitur inti sekarang tampil lebih utuh, bukan hanya nama fiturnya.
				</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Setiap program sekarang menampilkan fokus, manfaat, dan butir capability agar landing page terasa
					seperti peta produk yang nyata.
				</p>
			</div>
			<a href="/fitur" class="home-btn-secondary w-full text-center md:w-auto">Lihat direktori fitur</a>
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
							<span class="mt-1 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
								<FeatureIcon slug={feature.slug} className="h-7 w-7" strokeWidth={1.7} />
							</span>
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
						Kitab utama sekarang bisa dibuka langsung dari kategori pelajarannya.
					</h2>
					<p class="mt-3 text-base leading-7 text-slate-600">
						Jalur kitab dibuat jelas supaya guru, santri, dan wali santri cepat masuk ke materi yang
						sesuai: aqidah, lughoh, tajwid, hadits, fiqih, atau tasawuf.
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
			<p class="home-eyebrow text-emerald-600">Alur Produk</p>
			<h2 class="home-heading mt-2 text-3xl text-slate-950 md:text-4xl">
				Alur pemakaian dibuat lebih mudah dibaca dari halaman depan.
			</h2>
			<p class="mt-3 text-base leading-7 text-slate-600">
				Tujuannya bukan membuat homepage ramai, tetapi membuat pengguna langsung paham urutan memakai produk
				dari awal sampai masuk ke pembinaan harian.
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
				<p class="home-eyebrow text-emerald-700">Lembaga Aktif</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950">Pendaftaran yang dibuka sekarang</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Homepage menampilkan status ini secara tegas agar ekspektasi pengguna sesuai dengan kondisi produk.
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
				<p class="home-eyebrow text-slate-500">Roadmap Lembaga</p>
				<h2 class="home-heading mt-2 text-3xl text-slate-950">Arah pengembangan berikutnya</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Pondok, masjid, musholla, dan rumah tahfidz tetap ditampilkan sebagai arah ekspansi. Bedanya,
					sekarang statusnya jelas sebagai roadmap, bukan seolah-olah sudah aktif.
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
					Halaman utama sekarang tidak hanya promosi, tetapi benar-benar menjadi pintu masuk produk.
				</h2>
				<p class="mt-4 text-base leading-8 text-white/88 md:text-lg">
					Pengguna bisa langsung melihat apa yang aktif hari ini, fitur pembinaan apa yang tersedia, kategori
					kitab yang bisa dipelajari, dan area referensi publik yang sudah bisa diakses.
				</p>
				<div class="mt-8 flex flex-col gap-4 sm:flex-row">
					<a href={primaryAction.href} class="btn border-none bg-white text-emerald-700 hover:bg-emerald-50">
						{primaryAction.label}
					</a>
					<a href="/fitur" class="btn border-white/20 bg-white/10 text-white hover:bg-white/15">
						Lihat semua fitur
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
