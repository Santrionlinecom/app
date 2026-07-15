<script lang="ts">
	import type { PageData } from './$types';
	import { isSuperAdminUser } from '$lib/auth/session-user';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import BrainCircuit from '@lucide/svelte/icons/brain-circuit';
	import Building2 from '@lucide/svelte/icons/building-2';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Compass from '@lucide/svelte/icons/compass';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Medal from '@lucide/svelte/icons/medal';
	import School from '@lucide/svelte/icons/school';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Users from '@lucide/svelte/icons/users';
	import WalletCards from '@lucide/svelte/icons/wallet-cards';

	export let data: PageData;

	const dashboardRoles = new Set([
		'admin',
		'admin_lembaga',
		'kepala',
		'pengajar',
		'ustadz',
		'ustadzah',
		'pembimbing',
		'operator',
		'santri',
		'alumni',
		'takmir',
		'tamir',
		'bendahara',
		'jamaah'
	]);

	const pillars = [
		{
			icon: ShieldCheck,
			title: 'Aqidah kuat',
			desc: 'Materi Aswaja bertahap agar santri memahami iman, bukan sekadar hafal istilah.'
		},
		{
			icon: HeartHandshake,
			title: 'Adab jadi kebiasaan',
			desc: 'Misi harian untuk shalat, Qur’an, birrul walidain, adab guru, dan adab digital.'
		},
		{
			icon: BookOpenText,
			title: 'Ilmu agama hidup',
			desc: 'Sirah, sahabat, fiqih praktis, akhlak, kitab, dan Qur’an dibuat dekat dengan anak.'
		},
		{
			icon: BrainCircuit,
			title: 'Skill masa depan',
			desc: 'Literasi digital, AI, komunikasi, menulis, desain, bahasa, dan problem solving halal.'
		},
		{
			icon: Users,
			title: 'Komunitas & mentor',
			desc: 'Orang tua, guru, musyrif, dan lembaga punya dashboard pembinaan yang nyambung.'
		}
	];

	const workspaces = [
		{ icon: School, title: 'TPQ', desc: 'Setoran, review, halaqah, santri, rapor, dan progres hafalan.' },
		{ icon: GraduationCap, title: 'Pondok', desc: 'Data santri, akademik dasar, kas, aset, jadwal, dan pembinaan.' },
		{ icon: BookOpenCheck, title: 'Rumah Tahfidz', desc: 'Tahfidz, murojaah, ujian, sertifikat, dan monitoring ayat.' },
		{ icon: Building2, title: 'Masjid/Musholla', desc: 'Jamaah, kas, agenda, imam/khotib, aset, dan administrasi takmir.' }
	];

	const featureLanes = [
		{
			eyebrow: 'Akademik TPQ',
			title: 'Setoran sampai rapor',
			desc: 'Guru input setoran, pembimbing review, admin melihat rekap, wali mendapat gambaran perkembangan.'
		},
		{
			eyebrow: 'Kitab Digital RAG',
			title: 'Qur’an, kitab, dan rujukan',
			desc: 'Mushaf, tafsir, asbabun nuzul, kitab turats, dan tanya kitab sebagai fondasi ilmu.'
		},
		{
			eyebrow: 'Habit System',
			title: 'Misi, streak, dan badge',
			desc: 'Anak diarahkan menang kecil setiap hari agar ibadah, adab, dan belajar terasa hidup.'
		},
		{
			eyebrow: 'Operasional',
			title: 'Lembaga lebih tertata',
			desc: 'Multi-lembaga, role, addon, coin, pembayaran, kas, aset, kalender, dan laporan.'
		}
	];

	const quickLinks = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Katalog Addon', href: '/addon', icon: WalletCards },
		{ label: 'Mushaf Qur’an', href: '/kitab/quran', icon: BookOpenText },
		{ label: 'Kitab Turats', href: '/kitab', icon: BookOpenCheck },
		{ label: 'Data Lembaga', href: '/lembaga', icon: Building2 },
		{ label: 'Kalender', href: '/kalender', icon: CalendarCheck }
	];

	const readiness = [
		'Aqidah + adab + amal, bukan sekadar aplikasi administrasi',
		'Gamifikasi untuk melawan dopamin cepat game dan scrolling',
		'Orang tua, guru, dan lembaga punya peran dalam satu alur',
		'Tetap ringan, cepat, dan hemat biaya operasional'
	];

	$: primaryAction = isSuperAdminUser(data?.user)
		? { href: '/admin/super/overview', label: 'Buka Super Admin', icon: ShieldCheck }
		: dashboardRoles.has(data?.user?.role ?? '')
			? { href: '/dashboard', label: 'Buka Dashboard', icon: LayoutDashboard }
			: { href: '/register', label: 'Mulai Daftar Lembaga', icon: ArrowRight };

	$: secondaryAction = data?.user
		? { href: '/akun', label: 'Kelola Akun', icon: Users }
		: { href: '/auth', label: 'Masuk', icon: LogIn };
</script>

<svelte:head>
	<title>SantriOnline App - Sistem Pembinaan Generasi Muslim</title>
	<meta
		name="description"
		content="SantriOnline App adalah sistem pembinaan generasi muslim untuk TPQ, pondok, rumah tahfidz, masjid, musholla, habit ibadah, adab, akademik, kitab digital, dan operasional lembaga."
	/>
</svelte:head>

<div class="home-root min-h-screen overflow-hidden bg-[#f8f3e7] text-[#1d2d24]">
	<section class="hero relative isolate overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
		<div class="hero-glow hero-glow-one"></div>
		<div class="hero-glow hero-glow-two"></div>
		<div class="mx-auto grid max-w-7xl gap-8 pt-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-10">
			<div class="relative z-10">
				<div class="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f7d878] shadow-sm backdrop-blur">
					<Sparkles class="h-4 w-4 shrink-0" strokeWidth={2.4} />
					<span class="truncate">Aqidah · Adab · Ilmu · Skill · Habit</span>
				</div>

				<h1 class="mt-7 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
					Sistem pembinaan generasi muslim, bukan sekadar aplikasi lembaga.
				</h1>
				<p class="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/84 md:text-lg">
					SantriOnline membantu TPQ, pondok, rumah tahfidz, masjid, dan musholla membentuk santri yang kuat aqidahnya, rapi ibadahnya, tinggi adabnya, hidup ilmunya, dan siap bersaing dengan skill masa depan.
				</p>

				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a class="btn-gold h-14 px-6" href={primaryAction.href}>
						<svelte:component this={primaryAction.icon} class="h-5 w-5" strokeWidth={2.5} />
						{primaryAction.label}
					</a>
					<a class="btn-glass h-14 px-6" href={secondaryAction.href}>
						<svelte:component this={secondaryAction.icon} class="h-5 w-5" strokeWidth={2.5} />
						{secondaryAction.label}
					</a>
				</div>

				<div class="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
					<div class="metric"><strong>5</strong><span>Pilar pembinaan</span></div>
					<div class="metric"><strong>4</strong><span>Ruang kerja lembaga</span></div>
					<div class="metric"><strong>1</strong><span>Ekosistem terpadu</span></div>
				</div>
			</div>

			<div class="relative z-10 rounded-[2rem] border border-white/14 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-5">
				<div class="rounded-[1.5rem] border border-white/16 bg-[#fffaf0] p-4 text-[#183728] shadow-xl md:p-5">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs font-black uppercase tracking-[0.2em] text-[#a98418]">Mission Control</p>
							<h2 class="mt-1 text-2xl font-black tracking-[-0.04em] text-[#123424]">Rapor Pembinaan</h2>
						</div>
						<div class="grid h-12 w-12 place-items-center rounded-2xl bg-[#173d2c] text-[#f7d878]">
							<Compass class="h-6 w-6" strokeWidth={2.4} />
						</div>
					</div>

					<div class="mt-5 grid gap-3 sm:grid-cols-2">
						<div class="dash-card bg-[#173d2c] text-white">
							<p>Habit Ibadah</p>
							<strong>Streak Subuh + Qur’an</strong>
							<span>misi harian santri</span>
						</div>
						<div class="dash-card">
							<p>Akademik TPQ</p>
							<strong>Setoran → Review</strong>
							<span>guru dan pembimbing</span>
						</div>
						<div class="dash-card">
							<p>Adab Digital</p>
							<strong>Badge Amanah</strong>
							<span>lisan, waktu, konten</span>
						</div>
						<div class="dash-card bg-[#f1dfaa]">
							<p>Kitab Digital</p>
							<strong>Rujukan Aswaja</strong>
							<span>Qur’an, tafsir, turats</span>
						</div>
					</div>

					<div class="mt-4 rounded-2xl border border-[#e8d9ad] bg-white p-4">
						<div class="flex items-center gap-3">
							<Medal class="h-5 w-5 text-[#b58a13]" strokeWidth={2.4} />
							<p class="text-sm font-black text-[#173d2c]">Identitas santri digital: beradab, berilmu, disiplin, dan punya misi.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="section-head">
				<p>Fondasi SantriOnline</p>
				<h2>Lima pilar yang menjaga arah produk tetap tarbiyah.</h2>
				<span>Setiap fitur harus membantu pembinaan, bukan hanya menambah menu.</span>
			</div>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each pillars as item}
					<article class="pillar-card">
						<div class="icon-badge"><svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.4} /></div>
						<h3>{item.title}</h3>
						<p>{item.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="bg-white px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
			<div class="section-head sticky-block">
				<p>Ruang Kerja Lembaga</p>
				<h2>Satu akun untuk mengelola lembaga, pembinaan, dan operasional.</h2>
				<span>TPQ tetap prioritas, tapi arsitektur disiapkan untuk pondok, rumah tahfidz, masjid, dan musholla.</span>
				<a class="btn-dark mt-7 h-12 w-fit px-5" href="/lembaga">
					<Building2 class="h-4 w-4" strokeWidth={2.4} />
					Kelola Lembaga
				</a>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each workspaces as item}
					<article class="workspace-card">
						<div class="icon-badge"><svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.4} /></div>
						<h3>{item.title}</h3>
						<p>{item.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="section-head max-w-3xl">
				<p>Alur Produk</p>
				<h2>Dari administrasi harian menuju pembentukan karakter.</h2>
				<span>Fitur dibuat bertahap agar Mas Yogik bisa menjaga biaya, fokus, dan kualitas.</span>
			</div>
			<div class="mt-8 grid gap-5 lg:grid-cols-4">
				{#each featureLanes as lane, index}
					<article class="lane-card">
						<span class="lane-number">0{index + 1}</span>
						<p>{lane.eyebrow}</p>
						<h3>{lane.title}</h3>
						<span>{lane.desc}</span>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="bg-[#173d2c] px-4 py-12 text-white sm:px-6 lg:px-8">
		<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
			<div>
				<p class="text-xs font-black uppercase tracking-[0.24em] text-[#f7d878]">Addon & Pembayaran</p>
				<h2 class="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl md:text-5xl">Aktifkan modul sesuai kebutuhan, tanpa memaksa lembaga kecil membayar besar.</h2>
				<p class="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/75 md:text-base">Katalog addon sekarang diarahkan sebagai permintaan gratis/konfirmasi admin, sehingga lembaga bisa mulai dari kebutuhan paling mendesak.</p>
				<div class="mt-7 flex flex-col gap-3 sm:flex-row">
					<a class="btn-gold h-12 px-5" href="/addon"><CreditCard class="h-4 w-4" strokeWidth={2.4} />Lihat Addon</a>
					<a class="btn-glass h-12 px-5" href="/coins"><WalletCards class="h-4 w-4" strokeWidth={2.4} />Coin & Wallet</a>
				</div>
			</div>
			<div class="rounded-[1.6rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
				{#each readiness as item}
					<div class="check-row"><CheckCircle2 class="h-5 w-5 text-[#f7d878]" strokeWidth={2.4} /><span>{item}</span></div>
				{/each}
			</div>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl rounded-[2rem] border border-[#eadfbe] bg-white p-5 shadow-sm md:p-8">
			<div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
				<div>
					<p class="text-xs font-black uppercase tracking-[0.22em] text-[#a98418]">Akses Cepat</p>
					<h2 class="mt-3 text-3xl font-black tracking-[-0.05em] text-[#173d2c] md:text-4xl">Masuk ke bagian yang paling sering dipakai.</h2>
					<p class="mt-4 text-sm font-semibold leading-7 text-[#647067]">Halaman depan dibuat lebih jelas sebagai pintu pembinaan, dashboard lembaga, kitab, addon, dan konten publik.</p>
				</div>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each quickLinks as link}
						<a class="quick-link" href={link.href}>
							<svelte:component this={link.icon} class="h-4 w-4" strokeWidth={2.4} />
							<span>{link.label}</span>
							<ArrowRight class="ml-auto h-4 w-4" strokeWidth={2.4} />
						</a>
					{/each}
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home-root {
		font-family: var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif);
	}

	.hero {
		background:
			radial-gradient(circle at 16% 18%, rgba(247, 216, 120, 0.22), transparent 28rem),
			linear-gradient(135deg, #0b241a 0%, #173d2c 46%, #22553e 100%);
	}

	.hero-glow {
		position: absolute;
		border-radius: 9999px;
		filter: blur(48px);
		opacity: 0.52;
		pointer-events: none;
	}

	.hero-glow-one {
		right: -8rem;
		top: 4rem;
		height: 18rem;
		width: 18rem;
		background: #c9a84c;
	}

	.hero-glow-two {
		bottom: -7rem;
		left: 20%;
		height: 16rem;
		width: 16rem;
		background: #40755b;
	}

	.btn-gold,
	.btn-glass,
	.btn-dark,
	.quick-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		border-radius: 1rem;
		font-size: 0.92rem;
		font-weight: 900;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background-color 180ms ease,
			border-color 180ms ease;
	}

	.btn-gold {
		background: #f2cc61;
		color: #173223;
		box-shadow: 0 18px 34px rgba(9, 23, 16, 0.16);
	}

	.btn-glass {
		border: 1px solid rgb(255 255 255 / 0.28);
		background: rgb(255 255 255 / 0.1);
		color: #ffffff;
		backdrop-filter: blur(14px);
	}

	.btn-dark {
		background: #173d2c;
		color: #ffffff;
	}

	.btn-gold:hover,
	.btn-glass:hover,
	.btn-dark:hover,
	.quick-link:hover {
		transform: translateY(-2px);
	}

	.metric {
		border: 1px solid rgb(255 255 255 / 0.16);
		border-radius: 1.25rem;
		background: rgb(255 255 255 / 0.1);
		padding: 1rem;
		color: white;
		backdrop-filter: blur(12px);
	}

	.metric strong {
		display: block;
		font-size: 2rem;
		line-height: 1;
		font-weight: 950;
		color: #f7d878;
	}

	.metric span {
		margin-top: 0.35rem;
		display: block;
		font-size: 0.78rem;
		font-weight: 800;
		color: rgb(255 255 255 / 0.74);
	}

	.dash-card {
		min-height: 8rem;
		border-radius: 1.25rem;
		border: 1px solid #eadfbe;
		background: white;
		padding: 1rem;
	}

	.dash-card p,
	.dash-card span {
		font-size: 0.75rem;
		font-weight: 800;
		opacity: 0.72;
	}

	.dash-card strong {
		margin-top: 1.2rem;
		display: block;
		font-size: 1rem;
		font-weight: 950;
		letter-spacing: -0.03em;
	}

	.section-head p {
		font-size: 0.75rem;
		font-weight: 950;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #a98418;
	}

	.section-head h2 {
		margin-top: 0.75rem;
		max-width: 54rem;
		font-size: clamp(2rem, 4.8vw, 3.6rem);
		font-weight: 950;
		line-height: 0.98;
		letter-spacing: -0.055em;
		color: #173d2c;
	}

	.section-head span {
		margin-top: 1rem;
		display: block;
		max-width: 42rem;
		font-size: 0.96rem;
		font-weight: 650;
		line-height: 1.8;
		color: #647067;
	}

	.sticky-block {
		position: sticky;
		top: 1rem;
	}

	.pillar-card,
	.workspace-card,
	.lane-card {
		border: 1px solid #eadfbe;
		border-radius: 1.5rem;
		background: #fffdf7;
		padding: 1.25rem;
		box-shadow: 0 14px 38px rgba(31, 45, 36, 0.06);
	}

	.pillar-card h3,
	.workspace-card h3,
	.lane-card h3 {
		margin-top: 1rem;
		font-size: 1.08rem;
		font-weight: 950;
		letter-spacing: -0.035em;
		color: #173d2c;
	}

	.pillar-card p,
	.workspace-card p,
	.lane-card span {
		margin-top: 0.55rem;
		font-size: 0.875rem;
		font-weight: 620;
		line-height: 1.7;
		color: #647067;
	}

	.icon-badge {
		display: grid;
		height: 2.75rem;
		width: 2.75rem;
		place-items: center;
		border-radius: 1rem;
		background: #173d2c;
		color: #f7d878;
	}

	.workspace-card {
		background: linear-gradient(180deg, #fffdf7, #f8f3e7);
	}

	.lane-card {
		position: relative;
		overflow: hidden;
		min-height: 16rem;
	}

	.lane-number {
		position: absolute;
		right: 1rem;
		top: 0.6rem;
		font-size: 3.8rem;
		font-weight: 950;
		letter-spacing: -0.08em;
		color: rgba(23, 61, 44, 0.08);
	}

	.lane-card > p {
		font-size: 0.72rem;
		font-weight: 950;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #a98418;
	}

	.check-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		border-bottom: 1px solid rgb(255 255 255 / 0.1);
		padding: 1rem 0;
		font-weight: 800;
		line-height: 1.65;
		color: rgb(255 255 255 / 0.82);
	}

	.check-row:last-child {
		border-bottom: 0;
	}

	.quick-link {
		min-height: 3.25rem;
		justify-content: flex-start;
		border: 1px solid #eadfbe;
		background: #fffaf0;
		padding: 0 1rem;
		color: #173d2c;
	}

	.quick-link:hover {
		border-color: #d4b24d;
		box-shadow: 0 12px 22px rgba(31, 45, 36, 0.08);
	}

	@media (max-width: 1023px) {
		.sticky-block {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.hero {
			padding-top: 1rem;
		}

		.section-head h2 {
			letter-spacing: -0.045em;
		}
	}
</style>
