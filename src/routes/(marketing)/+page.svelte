<script lang="ts">
	import type { PageData } from './$types';
	import { isSuperAdminUser } from '$lib/auth/session-user';

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

	const logoUrl =
		'https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png';

	const institutionTypes = [
		{
			icon: '🕌',
			name: 'TPQ',
			status: 'Aktif',
			desc: 'Santri, setoran hafalan, kelas, dan kas dasar.'
		},
		{
			icon: '🏫',
			name: 'Pondok',
			status: 'Multi-lembaga',
			desc: 'Data santri, hafalan, dan operasional harian.'
		},
		{
			icon: '🕍',
			name: 'Masjid',
			status: 'Addon',
			desc: 'Jamaah, kas, zakat, qurban, dan agenda.'
		},
		{
			icon: '🏠',
			name: 'Musholla',
			status: 'Addon',
			desc: 'Jamaah, kas musholla, dan kegiatan rutin.'
		},
		{
			icon: '📖',
			name: 'Rumah Tahfidz',
			status: 'Addon',
			desc: 'Halaqoh, ujian, ijazah, dan setoran detail.'
		}
	];

	const operatingFlow = [
		{
			step: '01',
			title: 'Buat atau pilih lembaga',
			desc: 'Admin dapat mengelola satu atau beberapa lembaga dari akun yang sama.'
		},
		{
			step: '02',
			title: 'Kelola data inti',
			desc: 'Santri atau jamaah, setoran hafalan, kas, dan agenda dipisahkan per lembaga.'
		},
		{
			step: '03',
			title: 'Aktifkan addon saat perlu',
			desc: 'Fitur premium disiapkan per lembaga agar biaya tetap proporsional.'
		}
	];

	const adminModules = [
		{
			title: 'Multi-Lembaga',
			desc: 'Switcher lembaga, daftar lembaga, dan kepemilikan admin dibuat eksplisit.',
			items: ['Lembaga aktif', 'Owner admin', 'Tambah lembaga']
		},
		{
			title: 'TPQ Akademik',
			desc: 'Flow TPQ tetap menjadi prioritas utama untuk operasional yang sudah berjalan.',
			items: ['Santri', 'Setoran', 'Rapor']
		},
		{
			title: 'Billing Addon',
			desc: 'Katalog addon sudah siap, pembayaran akan menyusul via kanal resmi.',
			items: ['Midtrans', 'BSI', 'Coin SantriOnline']
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
		{ label: 'Kitab', href: '/kitab' },
		{ label: 'Mushaf', href: '/kitab/quran' },
		{ label: 'Buku Digital', href: '/buku' },
		{ label: 'Blog', href: '/blog' }
	];

	$: primaryAction = isSuperAdminUser(data?.user)
		? { href: '/admin/super/overview', label: 'Buka Super Admin' }
		: dashboardRoles.has(data?.user?.role ?? '')
			? { href: '/dashboard', label: 'Buka Dashboard' }
			: { href: '/register', label: 'Mulai Daftar' };

	$: secondaryAction = data?.user
		? { href: '/akun', label: 'Kelola Akun' }
		: { href: '/auth', label: 'Masuk' };
</script>

<svelte:head>
	<title>SantriOnline App - Platform Manajemen Lembaga Islam</title>
	<meta
		name="description"
		content="SantriOnline App membantu admin TPQ, pondok, masjid, musholla, dan rumah tahfidz mengelola lembaga, santri, jamaah, hafalan, kas, dan addon berbayar."
	/>
</svelte:head>

<div class="home-root min-h-screen bg-so-cream text-so-ink">
	<section class="border-b border-so-border bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
			<a href="/" class="flex min-w-0 items-center gap-3">
				<img src={logoUrl} alt="SantriOnline" class="h-10 w-10 rounded-xl object-cover" />
				<div class="min-w-0">
					<p class="truncate text-sm font-black text-so-green">SantriOnline App</p>
					<p class="truncate text-xs font-bold text-so-muted">Manajemen lembaga Islam</p>
				</div>
			</a>
			<nav class="hidden items-center gap-2 md:flex">
				<a class="top-link" href="#platform">Platform</a>
				<a class="top-link" href="#addon">Addon</a>
				<a class="top-link" href="#publik">Publik</a>
			</nav>
			<a class="btn-primary h-10 px-4" href={primaryAction.href}>{primaryAction.label}</a>
		</div>
	</section>

	<section class="relative overflow-hidden">
		<div class="hero-bg"></div>
		<div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_0.92fr] lg:px-8">
			<div class="relative z-10 flex min-h-[520px] flex-col justify-center">
				<div class="flex flex-wrap gap-2">
					<span class="chip chip-primary">Multi-Lembaga</span>
					<span class="chip">TPQ Prioritas</span>
					<span class="chip">Addon Berbayar</span>
				</div>
				<h1 class="mt-6 max-w-4xl text-4xl font-black leading-tight text-so-green sm:text-5xl lg:text-6xl">
					Satu ruang kerja untuk mengelola lembaga Islam dengan rapi.
				</h1>
				<p class="mt-5 max-w-2xl text-base leading-8 text-so-muted md:text-lg">
					SantriOnline App sekarang diarahkan sebagai platform multi-lembaga. Admin dapat mengelola TPQ,
					pondok, masjid, musholla, dan rumah tahfidz dengan data yang dipisahkan per lembaga.
				</p>
				<div class="mt-7 flex flex-col gap-3 sm:flex-row">
					<a class="btn-primary h-12 px-5" href={primaryAction.href}>{primaryAction.label}</a>
					<a class="btn-secondary h-12 px-5" href={secondaryAction.href}>{secondaryAction.label}</a>
				</div>
				<div class="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
					<div class="metric">
						<p>1</p>
						<span>TPQ gratis</span>
					</div>
					<div class="metric">
						<p>30</p>
						<span>santri aktif gratis</span>
					</div>
					<div class="metric">
						<p>6</p>
						<span>addon disiapkan</span>
					</div>
				</div>
			</div>

			<div class="relative z-10 flex items-center">
				<div class="product-frame w-full">
					<div class="product-topbar">
						<div>
							<p class="text-xs font-black uppercase text-so-gold">Dashboard</p>
							<h2 class="mt-1 text-xl font-black text-so-green">TPQ Al-Ikhlas</h2>
						</div>
						<span class="rounded-full bg-so-green px-3 py-1 text-xs font-black text-white">Aktif</span>
					</div>
					<div class="mt-5 grid gap-3 sm:grid-cols-3">
						<div class="snapshot-stat">
							<span>Santri</span>
							<strong>28</strong>
						</div>
						<div class="snapshot-stat">
							<span>Setoran</span>
							<strong>12</strong>
						</div>
						<div class="snapshot-stat">
							<span>Saldo Kas</span>
							<strong>3,4 jt</strong>
						</div>
					</div>
					<div class="mt-5 rounded-xl border border-so-border bg-so-cream p-4">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-black text-so-green">Lembaga yang dikelola</p>
							<a class="text-xs font-black text-so-green" href="/lembaga">Lihat</a>
						</div>
						<div class="mt-4 space-y-3">
							{#each institutionTypes.slice(0, 4) as item}
								<div class="flex items-center gap-3 rounded-xl bg-white p-3">
									<span class="text-xl">{item.icon}</span>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-black text-so-ink">{item.name}</p>
										<p class="truncate text-xs text-so-muted">{item.desc}</p>
									</div>
									<span class="rounded-full bg-so-gold/15 px-2 py-1 text-[10px] font-black text-so-green">
										{item.status}
									</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="mt-5 grid gap-3 sm:grid-cols-2">
						<a class="snapshot-action" href="/addon">Katalog Addon</a>
						<a class="snapshot-action" href="/akun">Akun Admin</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section id="platform" class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<div class="section-head">
			<p class="eyebrow">Platform</p>
			<h2>Dirancang untuk operasional harian, bukan sekadar halaman promosi.</h2>
			<p>
				Beranda ini hanya memuat arah produk utama. Detail akademik, lembaga, dan addon tetap berada di
				halaman masing-masing agar tidak saling menyalin.
			</p>
		</div>
		<div class="mt-6 grid gap-4 lg:grid-cols-3">
			{#each adminModules as item}
				<article class="info-card">
					<h3>{item.title}</h3>
					<p>{item.desc}</p>
					<div class="mt-5 flex flex-wrap gap-2">
						{#each item.items as entry}
							<span class="mini-chip">{entry}</span>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
			<div class="section-head max-w-3xl">
				<p class="eyebrow">Tipe Lembaga</p>
				<h2>Satu akun admin dapat mengelola beberapa lembaga.</h2>
				<p>Setiap tipe lembaga diberi ruang fitur sendiri supaya menu tetap relevan.</p>
			</div>
			<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each institutionTypes as item}
					<article class="type-card">
						<div class="flex items-center justify-between gap-3">
							<span class="text-3xl">{item.icon}</span>
							<span class="mini-chip">{item.status}</span>
						</div>
						<h3>{item.name}</h3>
						<p>{item.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<div class="grid gap-5 lg:grid-cols-3">
			{#each operatingFlow as item}
				<article class="flow-card">
					<span>{item.step}</span>
					<h3>{item.title}</h3>
					<p>{item.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="addon" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid gap-5 rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6 lg:grid-cols-[0.8fr_1.2fr]">
			<div>
				<p class="eyebrow">Addon</p>
				<h2 class="mt-2 text-2xl font-black text-so-green md:text-3xl">Bayar hanya untuk fitur yang dibutuhkan.</h2>
				<p class="mt-3 text-sm leading-7 text-so-muted">
					Model freemium menjaga TPQ kecil tetap bisa mulai gratis, sementara lembaga yang berkembang dapat
					menambah modul secara bertahap.
				</p>
				<a class="btn-primary mt-5 h-11 px-4" href="/addon">Lihat Katalog Addon</a>
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

	<section id="publik" class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<div class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
				<p class="eyebrow">Akses Publik</p>
				<h2 class="mt-2 text-2xl font-black text-so-green md:text-3xl">Tetap ada ruang belajar dan konten terbuka.</h2>
				<p class="mt-3 text-sm leading-7 text-so-muted">
					Kitab, mushaf, buku digital, dan artikel tetap dapat diakses sebagai ekosistem pendukung, namun
					beranda utama kini fokus pada platform manajemen lembaga.
				</p>
				<div class="mt-5 flex flex-wrap gap-2">
					{#each publicLinks as link}
						<a class="public-link" href={link.href}>{link.label}</a>
					{/each}
				</div>
			</div>
			<div class="rounded-so-lg bg-so-green p-5 text-white shadow-soft md:p-6">
				<p class="text-xs font-black uppercase text-so-gold-2">Siap dipakai</p>
				<h2 class="mt-3 text-2xl font-black md:text-3xl">Mulai dari satu TPQ, lalu tambah lembaga saat diperlukan.</h2>
				<p class="mt-4 text-sm leading-7 text-white/82">
					Struktur baru sudah mengarah ke multi-lembaga dan addon. Bagian pembayaran akan dibuka bertahap
					melalui Midtrans, BSI, dan Coin SantriOnline.
				</p>
				<div class="mt-6 flex flex-col gap-3 sm:flex-row">
					<a class="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-so-green" href={primaryAction.href}>
						{primaryAction.label}
					</a>
					<a class="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-sm font-black text-white" href="/lembaga">
						Kelola Lembaga
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home-root {
		--hero-overlay: linear-gradient(135deg, rgba(250, 248, 243, 0.95), rgba(255, 255, 255, 0.86));
		font-family: var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background:
			var(--hero-overlay),
			url('https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1800&q=80');
		background-position: center;
		background-size: cover;
	}

	.top-link,
	.public-link {
		border-radius: 0.75rem;
		padding: 0.65rem 0.85rem;
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--color-so-green);
	}

	.top-link:hover,
	.public-link:hover {
		background: rgb(27 67 50 / 0.07);
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 900;
		transition:
			background-color 160ms ease,
			border-color 160ms ease,
			transform 160ms ease;
	}

	.btn-primary {
		background: var(--color-so-green);
		color: #fff;
	}

	.btn-primary:hover {
		background: var(--color-so-green-2);
		transform: translateY(-1px);
	}

	.btn-secondary {
		border: 1px solid var(--color-so-border);
		background: #fff;
		color: var(--color-so-green);
	}

	.btn-secondary:hover {
		border-color: rgb(27 67 50 / 0.35);
		transform: translateY(-1px);
	}

	.chip,
	.mini-chip {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		border: 1px solid var(--color-so-border);
		background: #fff;
		color: var(--color-so-muted);
		font-size: 0.72rem;
		font-weight: 900;
	}

	.chip {
		padding: 0.55rem 0.8rem;
		text-transform: uppercase;
	}

	.chip-primary {
		border-color: rgb(201 168 76 / 0.5);
		background: rgb(201 168 76 / 0.16);
		color: var(--color-so-green);
	}

	.mini-chip {
		padding: 0.35rem 0.6rem;
	}

	.metric,
	.snapshot-stat,
	.info-card,
	.type-card,
	.flow-card,
	.addon-row {
		border: 1px solid var(--color-so-border);
		background: #fff;
		box-shadow: var(--shadow-card);
	}

	.metric,
	.snapshot-stat {
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.metric p,
	.snapshot-stat strong {
		display: block;
		font-size: 1.7rem;
		font-weight: 900;
		line-height: 1;
		color: var(--color-so-green);
	}

	.metric span,
	.snapshot-stat span {
		margin-top: 0.5rem;
		display: block;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--color-so-muted);
	}

	.product-frame {
		border: 1px solid rgb(255 255 255 / 0.8);
		border-radius: 1.25rem;
		background: rgb(255 255 255 / 0.92);
		padding: 1rem;
		box-shadow: var(--shadow-soft);
		backdrop-filter: blur(14px);
	}

	.product-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--color-so-border);
		padding-bottom: 1rem;
	}

	.snapshot-action {
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		border: 1px solid var(--color-so-border);
		background: #fff;
		font-size: 0.875rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.section-head h2 {
		max-width: 48rem;
		font-size: clamp(1.65rem, 3vw, 2.25rem);
		font-weight: 900;
		line-height: 1.15;
		color: var(--color-so-green);
	}

	.section-head p:not(.eyebrow) {
		margin-top: 0.75rem;
		max-width: 46rem;
		font-size: 0.95rem;
		line-height: 1.75;
		color: var(--color-so-muted);
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		color: var(--color-so-gold);
	}

	.info-card,
	.type-card,
	.flow-card {
		border-radius: var(--radius-lg);
		padding: 1.25rem;
	}

	.info-card h3,
	.type-card h3,
	.flow-card h3 {
		margin-top: 0.75rem;
		font-size: 1.05rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.info-card p,
	.type-card p,
	.flow-card p {
		margin-top: 0.65rem;
		font-size: 0.9rem;
		line-height: 1.7;
		color: var(--color-so-muted);
	}

	.flow-card span {
		display: inline-flex;
		border-radius: 0.75rem;
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
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.addon-row p {
		font-size: 0.9rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.addon-row span {
		white-space: nowrap;
		font-size: 0.78rem;
		font-weight: 900;
		color: var(--color-so-muted);
	}

	.public-link {
		border: 1px solid var(--color-so-border);
		background: var(--color-so-cream);
	}
</style>
