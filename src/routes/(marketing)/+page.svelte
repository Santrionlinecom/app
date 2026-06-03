<script lang="ts">
	import type { PageData } from './$types';
	import { isSuperAdminUser } from '$lib/auth/session-user';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import Building2 from '@lucide/svelte/icons/building-2';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Coins from '@lucide/svelte/icons/coins';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Database from '@lucide/svelte/icons/database';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Home from '@lucide/svelte/icons/home';
	import Landmark from '@lucide/svelte/icons/landmark';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogIn from '@lucide/svelte/icons/log-in';
	import School from '@lucide/svelte/icons/school';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Store from '@lucide/svelte/icons/store';
	import Users from '@lucide/svelte/icons/users';
	import WalletCards from '@lucide/svelte/icons/wallet-cards';

	export let data: PageData;

	const dashboardRoles = new Set([
		'admin',
		'admin_lembaga',
		'ustadz',
		'ustadzah',
		'santri',
		'alumni',
		'tamir',
		'bendahara',
		'jamaah'
	]);

	const institutionTypes = [
		{
			icon: School,
			name: 'TPQ',
			status: 'Prioritas',
			desc: 'Setoran, review, halaqoh, santri, rapor, dan progres hafalan.'
		},
		{
			icon: GraduationCap,
			name: 'Pondok',
			status: 'Multi-lembaga',
			desc: 'Manajemen santri, akademik dasar, hafalan, kas, dan aset.'
		},
		{
			icon: Landmark,
			name: 'Masjid',
			status: 'Addon',
			desc: 'Jamaah, kas, jadwal imam/khotib, agenda, dan aset.'
		},
		{
			icon: Home,
			name: 'Musholla',
			status: 'Addon',
			desc: 'Jamaah, kas musholla, jadwal kegiatan, dan administrasi ringan.'
		},
		{
			icon: BookOpenCheck,
			name: 'Rumah Tahfidz',
			status: 'Addon',
			desc: 'Tahfidz, murojaah, ujian, sertifikat, dan monitoring ayat.'
		}
	];

	const featureGroups = [
		{
			icon: Building2,
			title: 'Lembaga & Role',
			desc: 'Multi-lembaga, switcher lembaga aktif, profil publik, dan akses role-aware.',
			items: ['TPQ', 'Pondok', 'Masjid', 'Musholla', 'Rumah Tahfidz', 'Admin', 'Guru', 'Santri', "Ta'mir"]
		},
		{
			icon: ClipboardCheck,
			title: 'TPQ Akademik',
			desc: 'Workflow harian TPQ dari input setoran sampai review koordinator.',
			items: ['Setoran', 'Review', 'Riwayat', 'Halaqoh', 'Kelola Santri', 'Dashboard TPQ']
		},
		{
			icon: BarChart3,
			title: 'Hafalan & Rapor',
			desc: 'Progress hafalan tervalidasi per ayat, rapor, rekap, dan sertifikat.',
			items: ['Pencapaian Hafalan', 'Belum Lancar', "Muroja'ah", 'Rapor Hafalan', 'Sertifikat']
		},
		{
			icon: BookOpenText,
			title: "Qur'an & Kitab",
			desc: "Mushaf 30 juz, bookmark, progress baca, tafsir, asbab, dan tanya kitab berbasis RAG.",
			items: ['Mushaf', 'Bookmark Ayat', 'Tafsir', 'Asbabun Nuzul', 'Kitab Turats', 'Tanya Kitab']
		},
		{
			icon: Store,
			title: 'Buku & Digital Store',
			desc: 'Katalog buku, DRM, studio penulis, royalti, produk digital, dan unduhan aman.',
			items: ['Buku Digital', 'Buku Saya', 'Studio Penulis', 'Royalti', 'Digital Store', 'DRM']
		},
		{
			icon: WalletCards,
			title: 'Coin & Pembayaran',
			desc: 'Wallet coin, topup, billing addon, Midtrans Snap, webhook, dan order tracking.',
			items: ['Coin', 'Topup', 'Midtrans', 'Addon', 'Payment Orders', 'Billing']
		},
		{
			icon: CalendarDays,
			title: 'Operasional Lembaga',
			desc: 'Kas, jadwal, aset, kalender kegiatan, laporan anggota, dan laporan keuangan.',
			items: ['Keuangan', 'Jadwal', 'Aset', 'Kalender', 'Report PDF', 'Shortlink']
		},
		{
			icon: ShieldCheck,
			title: 'Admin & Konten',
			desc: 'Super admin, CMS, analytics, SEO, lisensi, perangkat, dan generator konten AI.',
			items: ['Super Admin', 'CMS', 'Analytics', 'License', 'SEO', 'AI Konten']
		}
	];

	const operatingFlow = [
		{
			step: '01',
			title: 'Pilih lembaga aktif',
			desc: 'Satu akun dapat berpindah antar lembaga tanpa mencampur data santri, jamaah, kas, atau addon.'
		},
		{
			step: '02',
			title: 'Kerjakan tugas harian',
			desc: 'Guru menginput setoran, koordinator mereview, admin memantau progres dan operasional.'
		},
		{
			step: '03',
			title: 'Aktifkan modul saat perlu',
			desc: 'Fitur premium, coin, buku, dan addon dibayar bertahap sesuai kebutuhan lembaga.'
		}
	];

	const addonPlans = [
		['Santri Unlimited', 'Rp20.000/bulan'],
		['Raport PDF Premium', 'Rp15.000/bulan'],
		['Modul Masjid', 'Rp25.000/bulan'],
		['Modul Tahfidz', 'Rp20.000/bulan'],
		['Modul Musholla', 'Rp15.000/bulan'],
		['Lembaga Tambahan', 'Rp15.000/bulan']
	];

	const publicLinks = [
		{ label: "Mushaf Qur'an", href: '/kitab/quran' },
		{ label: 'Kitab Turats', href: '/kitab' },
		{ label: 'Buku Digital', href: '/buku' },
		{ label: 'Digital Store', href: '/digital-store' },
		{ label: 'Kalender', href: '/kalender' },
		{ label: 'Blog', href: '/blog' }
	];

	$: primaryAction = isSuperAdminUser(data?.user)
		? { href: '/admin/super/overview', label: 'Buka Super Admin', icon: ShieldCheck }
		: dashboardRoles.has(data?.user?.role ?? '')
			? { href: '/dashboard', label: 'Buka Dashboard', icon: LayoutDashboard }
			: { href: '/register', label: 'Mulai Daftar', icon: ArrowRight };

	$: secondaryAction = data?.user
		? { href: '/akun', label: 'Kelola Akun', icon: Users }
		: { href: '/auth', label: 'Masuk', icon: LogIn };
</script>

<svelte:head>
	<title>SantriOnline App - Platform Manajemen Lembaga Islam</title>
	<meta
		name="description"
		content="SantriOnline App membantu TPQ, pondok, masjid, musholla, dan rumah tahfidz mengelola lembaga, santri, jamaah, hafalan, kas, buku digital, coin, dan addon berbayar."
	/>
</svelte:head>

<div class="home-root min-h-screen w-full max-w-full overflow-x-hidden bg-so-cream text-so-ink">
	<section class="hero-band relative overflow-hidden">
		<div class="hero-bg"></div>
		<div class="hero-overlay"></div>
		<div class="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pb-20 md:pt-16 lg:px-8">
			<div class="w-full max-w-4xl min-w-0">
				<div class="flex flex-wrap gap-2">
					<span class="chip chip-primary">Multi-Lembaga</span>
					<span class="chip">TPQ Akademik</span>
					<span class="chip">Midtrans Ready</span>
					<span class="chip">Qur'an & Kitab</span>
				</div>
				<h1 class="mt-6 break-words text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
					SantriOnline App
				</h1>
				<p class="mt-6 max-w-2xl break-words text-base font-semibold leading-relaxed text-white/90 md:text-lg md:leading-relaxed">
					Satu ruang kerja untuk mengelola TPQ, pondok, masjid, musholla, rumah tahfidz, hafalan Qur'an,
					kas, buku digital, coin, addon, dan konten belajar dalam satu ekosistem.
				</p>
				<div class="mt-8 flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row">
					<a class="btn-primary h-14 w-full min-w-0 px-6 sm:w-auto" href={primaryAction.href}>
						<svelte:component this={primaryAction.icon} class="h-5 w-5 shrink-0" strokeWidth={2.5} />
						<span class="truncate">{primaryAction.label}</span>
					</a>
					<a class="btn-secondary h-14 w-full min-w-0 px-6 sm:w-auto" href={secondaryAction.href}>
						<svelte:component this={secondaryAction.icon} class="h-5 w-5 shrink-0" strokeWidth={2.5} />
						<span class="truncate">{secondaryAction.label}</span>
					</a>
				</div>
			</div>

			<div class="mt-12 grid w-full max-w-3xl min-w-0 gap-4 sm:grid-cols-3">
				<div class="metric">
					<p>5</p>
					<span>Tipe lembaga</span>
				</div>
				<div class="metric">
					<p>8</p>
					<span>Kelompok fitur utama</span>
				</div>
				<div class="metric">
					<p>6</p>
					<span>Addon berbayar</span>
				</div>
			</div>
		</div>
	</section>

	<section class="band band-white">
		<div class="mx-auto grid w-full max-w-7xl min-w-0 gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
			<div class="section-head min-w-0">
				<p class="eyebrow">Ringkasan Sistem</p>
				<h2 class="break-words">Semua modul penting langsung terlihat dari halaman pertama.</h2>
				<p class="break-words">
					Halaman ini sekarang berfungsi sebagai peta produk: pengelolaan lembaga, akademik TPQ, hafalan,
					Qur'an, buku, coin, pembayaran, operasional, dan admin sistem.
				</p>
			</div>

			<div class="command-panel min-w-0">
				<div class="panel-header">
					<div>
						<p class="text-xs font-black uppercase text-so-gold">Workspace</p>
						<h3 class="mt-1 text-xl font-black text-so-green">Dashboard Lembaga</h3>
					</div>
					<span class="status-pill">Aktif</span>
				</div>
				<div class="mt-5 grid gap-3 sm:grid-cols-3">
					<div class="snapshot-stat">
						<span>Setoran</span>
						<strong>Review</strong>
					</div>
					<div class="snapshot-stat">
						<span>Kas</span>
						<strong>Report</strong>
					</div>
					<div class="snapshot-stat">
						<span>Addon</span>
						<strong>Snap</strong>
					</div>
				</div>
				<div class="mt-5 grid gap-3 sm:grid-cols-2">
					<a class="snapshot-action" href="/lembaga">
						<Building2 class="h-4 w-4" strokeWidth={2.4} />
						Kelola Lembaga
					</a>
					<a class="snapshot-action" href="/addon">
						<CreditCard class="h-4 w-4" strokeWidth={2.4} />
						Katalog Addon
					</a>
					<a class="snapshot-action" href="/coins">
						<Coins class="h-4 w-4" strokeWidth={2.4} />
						Coin
					</a>
					<a class="snapshot-action" href="/kitab/quran">
						<BookOpenText class="h-4 w-4" strokeWidth={2.4} />
						Mushaf
					</a>
				</div>
			</div>
		</div>
	</section>

	<section id="fitur" class="band">
		<div class="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
			<div class="section-head min-w-0">
				<p class="eyebrow">Semua Fitur</p>
				<h2 class="break-words">Fitur sistem dikelompokkan supaya mudah dipindai.</h2>
				<p class="break-words">Setiap kartu mewakili modul yang sudah ada atau sudah disiapkan dalam aplikasi.</p>
			</div>
			<div class="mt-8 grid w-full min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-4">
				{#each featureGroups as feature}
					<article class="feature-card">
						<div class="feature-icon">
							<svelte:component this={feature.icon} class="h-5 w-5" strokeWidth={2.25} />
						</div>
						<h3>{feature.title}</h3>
						<p>{feature.desc}</p>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each feature.items as item}
								<span class="mini-chip">{item}</span>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="band band-white">
		<div class="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
			<div class="section-head min-w-0">
				<p class="eyebrow">Tipe Lembaga</p>
				<h2 class="break-words">Satu akun dapat mengatur beberapa konteks lembaga.</h2>
				<p class="break-words">Menu dan akses dibuat mengikuti jenis lembaga agar pengguna tidak melihat fitur yang tidak relevan.</p>
			</div>
			<div class="mt-8 grid w-full min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-5">
				{#each institutionTypes as item}
					<article class="type-card">
						<div class="flex items-center justify-between gap-3">
							<span class="type-icon">
								<svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.3} />
							</span>
							<span class="mini-chip">{item.status}</span>
						</div>
						<h3>{item.name}</h3>
						<p>{item.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="band">
		<div class="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
			<div class="grid w-full min-w-0 gap-6 lg:grid-cols-3">
				{#each operatingFlow as item}
					<article class="flow-card">
						<span>{item.step}</span>
						<h3>{item.title}</h3>
						<p>{item.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section id="addon" class="band band-white">
		<div class="mx-auto grid w-full max-w-7xl min-w-0 gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
			<div class="section-head min-w-0">
				<p class="eyebrow">Addon & Pembayaran</p>
				<h2 class="break-words">Bayar modul yang dipakai, mulai dari paket kecil.</h2>
				<p class="break-words">
					Katalog addon, billing, payment order, Midtrans Snap, webhook, dan topup coin sudah diarahkan ke
					alur pembayaran yang sama.
				</p>
				<a class="btn-primary mt-8 h-12 w-full min-w-0 px-5 sm:w-fit" href="/addon">
					<CreditCard class="h-4 w-4" strokeWidth={2.4} />
					Lihat Addon
				</a>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each addonPlans as plan}
					<div class="addon-row">
						<p>{plan[0]}</p>
						<span>{plan[1]}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section id="publik" class="band final-band">
		<div class="mx-auto grid w-full max-w-7xl min-w-0 gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
			<div class="section-head min-w-0">
				<p class="eyebrow">Akses Publik</p>
				<h2 class="break-words">Ekosistem belajar tetap terbuka untuk pengunjung.</h2>
				<p class="break-words">
					Pengunjung dapat membaca Qur'an, kitab, buku, artikel, dan kalender. Pengguna login mendapat
					progres baca, bookmark, coin, dan dashboard lembaga.
				</p>
				<div class="mt-8 grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:max-w-2xl">
					{#each publicLinks as link}
						<a class="public-link" href={link.href}>
							<ArrowRight class="h-4 w-4" strokeWidth={2.4} />
							{link.label}
						</a>
					{/each}
				</div>
			</div>
			<div class="cta-panel min-w-0">
				<Sparkles class="h-6 w-6 shrink-0 text-so-gold-2" strokeWidth={2.4} />
				<h2 class="break-words">Mulai dari satu lembaga, lalu aktifkan fitur lain saat dibutuhkan.</h2>
				<p class="break-words">
					Halaman pertama sekarang menjadi pintu masuk singkat untuk melihat kemampuan sistem dan langsung
					masuk ke dashboard, akun, addon, atau konten publik.
				</p>
				<div class="mt-8 flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row">
					<a class="btn-light h-12 w-full min-w-0 px-5 sm:w-auto" href={primaryAction.href}>
						<svelte:component this={primaryAction.icon} class="h-4 w-4" strokeWidth={2.4} />
						{primaryAction.label}
					</a>
					<a class="btn-ghost-light h-11 w-full px-4 sm:w-auto" href="/lembaga">
						<Database class="h-4 w-4" strokeWidth={2.4} />
						Data Lembaga
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home-root {
		font-family: var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif);
	}

	.hero-band {
		min-height: min(720px, calc(100svh - 3rem));
		display: flex;
		align-items: end;
	}

	.hero-bg,
	.hero-overlay {
		position: absolute;
		inset: 0;
	}

	.hero-bg {
		background-image: url('https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1800&q=80');
		background-position: center;
		background-size: cover;
		transform: scale(1.01);
	}

	.hero-overlay {
		background:
			linear-gradient(90deg, rgba(10, 37, 28, 0.75) 0%, rgba(27, 67, 50, 0.65) 48%, rgba(27, 67, 50, 0.2) 100%),
			linear-gradient(180deg, rgba(10, 37, 28, 0.15) 0%, rgba(10, 37, 28, 0.6) 100%);
	}

	.band {
		background: var(--color-so-cream);
	}

	.band-white {
		background: #ffffff;
	}

	.final-band {
		border-top: 1px solid var(--color-so-border);
	}

	.btn-primary,
	.btn-secondary,
	.btn-light,
	.btn-ghost-light,
	.snapshot-action,
	.public-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 0.875rem;
		font-size: 0.9375rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		transition:
			background-color 180ms ease,
			border-color 180ms ease,
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.btn-primary {
		background: var(--color-so-gold);
		color: #173525;
		box-shadow: 0 4px 12px rgba(201, 168, 76, 0.25);
	}

	.btn-primary:hover,
	.btn-secondary:hover,
	.btn-light:hover,
	.btn-ghost-light:hover,
	.snapshot-action:hover,
	.public-link:hover {
		transform: translateY(-2px);
	}

	.btn-primary:hover {
		box-shadow: 0 6px 16px rgba(201, 168, 76, 0.35);
	}

	.btn-secondary {
		border: 1px solid rgb(255 255 255 / 0.35);
		background: rgb(255 255 255 / 0.1);
		color: #ffffff;
		backdrop-filter: blur(12px);
	}

	.btn-light {
		background: #ffffff;
		color: var(--color-so-green);
	}

	.btn-ghost-light {
		border: 1px solid rgb(255 255 255 / 0.3);
		color: #ffffff;
	}

	.chip,
	.mini-chip,
	.status-pill {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		font-weight: 900;
		letter-spacing: 0;
		white-space: nowrap;
	}

	.chip {
		border: 1px solid rgb(255 255 255 / 0.22);
		background: rgb(255 255 255 / 0.12);
		color: rgb(255 255 255 / 0.9);
		padding: 0.5rem 0.72rem;
		font-size: 0.72rem;
		text-transform: uppercase;
		backdrop-filter: blur(12px);
	}

	.chip-primary {
		border-color: rgb(201 168 76 / 0.75);
		background: rgb(201 168 76 / 0.2);
		color: #fff7d6;
	}

	.mini-chip {
		border: 1px solid var(--color-so-border);
		background: #ffffff;
		color: var(--color-so-muted);
		padding: 0.34rem 0.56rem;
		font-size: 0.72rem;
	}

	.status-pill {
		background: rgb(27 67 50 / 0.1);
		color: var(--color-so-green);
		padding: 0.45rem 0.7rem;
		font-size: 0.74rem;
	}

	.metric,
	.command-panel,
	.feature-card,
	.type-card,
	.flow-card,
	.addon-row,
	.cta-panel {
		border: 1px solid var(--color-so-border);
		background: #ffffff;
		box-shadow: var(--shadow-card);
	}

	.metric {
		border-color: rgb(255 255 255 / 0.22);
		background: rgb(255 255 255 / 0.12);
		border-radius: 1rem;
		padding: 1rem;
		backdrop-filter: blur(14px);
	}

	.metric p {
		font-size: 1.9rem;
		font-weight: 900;
		line-height: 1;
		color: #ffffff;
	}

	.metric span {
		margin-top: 0.55rem;
		display: block;
		font-size: 0.82rem;
		font-weight: 800;
		color: rgb(255 255 255 / 0.78);
	}

	.section-head h2 {
		max-width: 48rem;
		font-size: 1.875rem;
		font-weight: 900;
		line-height: 1.25;
		letter-spacing: -0.02em;
		color: var(--color-so-green);
	}

	.section-head p:not(.eyebrow) {
		margin-top: 1rem;
		max-width: 48rem;
		font-size: 1rem;
		line-height: 1.75;
		color: var(--color-so-muted);
	}

	.eyebrow {
		margin-bottom: 0.6rem;
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0;
		text-transform: uppercase;
		color: var(--color-so-gold);
	}

	.command-panel,
	.feature-card,
	.type-card,
	.flow-card,
	.cta-panel {
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--color-so-border);
		padding-bottom: 1rem;
	}

	.snapshot-stat {
		border-radius: 0.95rem;
		background: var(--color-so-cream);
		padding: 1rem;
	}

	.snapshot-stat span {
		display: block;
		font-size: 0.76rem;
		font-weight: 800;
		color: var(--color-so-muted);
	}

	.snapshot-stat strong {
		margin-top: 0.45rem;
		display: block;
		font-size: 1.15rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.snapshot-action,
	.public-link {
		min-height: 2.75rem;
		border: 1px solid var(--color-so-border);
		background: #ffffff;
		color: var(--color-so-green);
	}

	.snapshot-action:hover,
	.public-link:hover {
		border-color: rgb(27 67 50 / 0.35);
		background: rgb(27 67 50 / 0.04);
	}

	.feature-icon,
	.type-icon {
		display: inline-grid;
		place-items: center;
		border-radius: 0.85rem;
		background: rgb(201 168 76 / 0.16);
		color: var(--color-so-green);
	}

	.feature-icon {
		height: 2.6rem;
		width: 2.6rem;
	}

	.type-icon {
		height: 2.35rem;
		width: 2.35rem;
	}

	.feature-card h3,
	.type-card h3,
	.flow-card h3 {
		margin-top: 1rem;
		font-size: 1.125rem;
		font-weight: 800;
		line-height: 1.4;
		color: var(--color-so-green);
	}

	.feature-card p,
	.type-card p,
	.flow-card p {
		margin-top: 0.75rem;
		font-size: 0.9375rem;
		line-height: 1.65;
		color: var(--color-so-muted);
	}

	.flow-card span {
		display: inline-flex;
		border-radius: 0.8rem;
		background: rgb(201 168 76 / 0.16);
		padding: 0.45rem 0.65rem;
		font-size: 0.8rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.addon-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-radius: 1rem;
		padding: 1rem;
	}

	.addon-row p {
		min-width: 0;
		font-size: 0.9rem;
		font-weight: 900;
		line-height: 1.4;
		color: var(--color-so-green);
	}

	.addon-row span {
		white-space: nowrap;
		font-size: 0.78rem;
		font-weight: 900;
		color: var(--color-so-muted);
	}

	.public-link {
		justify-content: flex-start;
		padding: 0.75rem 0.9rem;
	}

	.cta-panel {
		background: linear-gradient(135deg, var(--color-so-green-3), var(--color-so-green));
		color: #ffffff;
	}

	.cta-panel h2 {
		margin-top: 1rem;
		font-size: 1.5rem;
		font-weight: 900;
		line-height: 1.3;
		letter-spacing: -0.01em;
	}

	.cta-panel p {
		margin-top: 1rem;
		font-size: 1rem;
		line-height: 1.7;
		color: rgb(255 255 255 / 0.85);
	}

	@media (max-width: 639px) {
		.hero-band {
			min-height: auto;
		}

		.addon-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
		}

		.addon-row span {
			white-space: normal;
		}
	}

	@media (min-width: 768px) {
		.section-head h2 {
			font-size: 2.5rem;
			line-height: 1.2;
		}

		.cta-panel h2 {
			font-size: 2rem;
			line-height: 1.25;
		}
	}
</style>
