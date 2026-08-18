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
			desc: 'Materi Aswaja bertahap agar santri meyakini iman dengan sadar, bukan sekadar hafal istilah.'
		},
		{
			icon: HeartHandshake,
			title: 'Adab & syariat',
			desc: 'Shalat, Qur’an, birrul walidain, adab guru, adab digital, dan menjaga lisan jadi kebiasaan.'
		},
		{
			icon: ClipboardCheck,
			title: 'Amal & habit',
			desc: 'Misi harian, streak, dan badge mengarahkan anak menang kecil setiap hari.'
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
			desc: 'Orang tua, guru, musyrif, dan lembaga terhubung dalam satu alur pembinaan.'
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
			eyebrow: 'Kitab Digital',
			title: 'Qur’an, kitab, dan rujukan',
			desc: 'Mushaf, tafsir, kitab, dan rujukan Aswaja sebagai fondasi ilmu yang hidup.'
		},
		{
			eyebrow: 'Habit System',
			title: 'Misi, streak, dan badge',
			desc: 'Anak diarahkan menang kecil setiap hari agar ibadah, adab, dan belajar terasa keren.'
		},
		{
			eyebrow: 'Operasional',
			title: 'Lembaga lebih tertata',
			desc: 'Multi-lembaga, role, addon, coin, kas, aset, kalender, dan laporan dalam satu tempat.'
		}
	];

	const quickLinks = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Habit Santri', href: '/habit', icon: CalendarCheck },
		{ label: 'Mushaf Qur’an', href: '/kitab/quran', icon: BookOpenText },
		{ label: 'Kitab & Ilmu', href: '/kitab', icon: BookOpenCheck },
		{ label: 'Data Lembaga', href: '/lembaga', icon: Building2 },
		{ label: 'Addon Lembaga', href: '/addon', icon: WalletCards }
	];

	const readiness = [
		'Aqidah + Adab + Amal + Ilmu + Skill + Komunitas + Habit',
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
		content="SantriOnline adalah sistem pembinaan generasi muslim: aqidah, adab, amal, ilmu, skill, komunitas, dan habit untuk TPQ, pondok, rumah tahfidz, masjid, dan musholla."
	/>
</svelte:head>

<div class="home-root min-h-screen overflow-hidden bg-so-cream text-so-ink">
	<section class="so-hero relative isolate overflow-hidden px-4 sm:px-6 lg:px-8">
		<div class="hero-grid-lines" aria-hidden="true"></div>
		<div class="hero-glow hero-glow-one" aria-hidden="true"></div>
		<div class="hero-glow hero-glow-two" aria-hidden="true"></div>

		<div class="hero-layout mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
			<div class="hero-copy relative z-10">
				<div class="hero-badge inline-flex max-w-full items-center gap-2 rounded-full">
					<span class="hero-badge-dot"></span>
					<span class="hero-badge-text">SantriOnline · Sistem Pembinaan Generasi</span>
				</div>

				<h1 class="hero-title">
					Membentuk generasi muslim.
					<span>Berilmu. Beradab. Siap masa depan.</span>
				</h1>
				<p class="hero-lead">
					Bukan sekadar aplikasi lembaga. SantriOnline menyatukan aqidah Aswaja, habit ibadah, adab, ilmu agama, skill, serta pendampingan dalam satu perjalanan pembinaan.
				</p>

				<div class="hero-audience" aria-label="Lembaga yang didukung">
					<span>TPQ</span><i></i><span>Pondok</span><i></i><span>Rumah Tahfidz</span><i></i><span>Masjid</span>
				</div>

				<div class="hero-actions flex flex-col gap-3 sm:flex-row">
					<a class="btn-gold h-14 px-6" href={primaryAction.href}>
						<svelte:component this={primaryAction.icon} class="h-5 w-5" strokeWidth={2.5} />
						{primaryAction.label}
					</a>
					<a class="btn-glass h-14 px-6" href={secondaryAction.href}>
						<svelte:component this={secondaryAction.icon} class="h-5 w-5" strokeWidth={2.5} />
						{secondaryAction.label}
					</a>
				</div>

				<div class="hero-proof">
					<CheckCircle2 class="h-4 w-4" strokeWidth={2.5} />
					<span>Aqidah + Adab + Amal + Ilmu + Skill + Komunitas + Habit</span>
				</div>
			</div>

			<div class="hero-visual relative z-10" aria-label="Pratinjau dashboard pembinaan SantriOnline">
				<div class="floating-note floating-note-habit">
					<CalendarCheck class="h-4 w-4" strokeWidth={2.4} />
					<div><strong>Habit terjaga</strong><span>3 misi selesai</span></div>
				</div>
				<div class="floating-note floating-note-badge">
					<Medal class="h-4 w-4" strokeWidth={2.4} />
					<div><strong>Badge Amanah</strong><span>adab menjadi identitas</span></div>
				</div>

				<div class="product-window">
					<div class="product-window-bar">
						<div class="product-brand">
							<div class="product-mark"><Compass class="h-5 w-5" strokeWidth={2.4} /></div>
							<div><strong>Mission Control</strong><span>Rapor pembinaan santri</span></div>
						</div>
						<div class="window-dots"><i></i><i></i><i></i></div>
					</div>

					<div class="progress-card">
						<div>
							<span class="preview-eyebrow">Misi hari ini</span>
							<strong>Menang kecil setiap hari.</strong>
							<p>Subuh, Qur’an, adab, ilmu, dan skill tumbuh menjadi kebiasaan.</p>
						</div>
						<div class="progress-ring"><b>3/5</b><span>selesai</span></div>
					</div>

					<div class="mission-list">
						<div class="mission-row mission-done">
							<span class="mission-check"><CheckCircle2 class="h-4 w-4" /></span>
							<div><strong>Shalat Subuh tepat waktu</strong><span>Habit ibadah · selesai</span></div>
							<b>+10</b>
						</div>
						<div class="mission-row mission-done">
							<span class="mission-check"><BookOpenCheck class="h-4 w-4" /></span>
							<div><strong>Baca Qur’an dan maknanya</strong><span>Ilmu yang hidup · selesai</span></div>
							<b>+15</b>
						</div>
						<div class="mission-row">
							<span class="mission-check"><HeartHandshake class="h-4 w-4" /></span>
							<div><strong>Berbuat baik kepada orang tua</strong><span>Adab harian · lanjutkan</span></div>
							<b>+10</b>
						</div>
					</div>

					<div class="preview-stats">
						<div><span>Streak</span><strong>12 hari</strong></div>
						<div><span>Setoran</span><strong>Review guru</strong></div>
						<div><span>Rapor</span><strong>Tumbuh baik</strong></div>
					</div>
				</div>
			</div>
		</div>

		<div class="hero-rail mx-auto max-w-7xl">
			<div><ShieldCheck class="h-5 w-5" strokeWidth={2.3} /><span><b>Aqidah</b> keyakinan sadar</span></div>
			<div><HeartHandshake class="h-5 w-5" strokeWidth={2.3} /><span><b>Adab</b> menjadi kebiasaan</span></div>
			<div><ClipboardCheck class="h-5 w-5" strokeWidth={2.3} /><span><b>Amal</b> konsisten setiap hari</span></div>
			<div><BrainCircuit class="h-5 w-5" strokeWidth={2.3} /><span><b>Skill</b> siap dunia nyata</span></div>
		</div>
	</section>

	<section class="border-y border-so-border/80 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16" aria-labelledby="meaning-title">
		<div class="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
			<div class="section-head">
				<p>Mengenal SantriOnline</p>
				<h2 id="meaning-title">Santri adalah semangat belajar sepanjang hayat.</h2>
			</div>
			<div class="rounded-[28px] border border-so-border bg-so-cream p-6 sm:p-8">
				<p class="text-lg font-semibold leading-8 text-so-ink">Dalam semangat SantriOnline, siapa saja dapat terus mengaji, belajar, menjaga adab, dan mengikuti bimbingan ulama dengan memanfaatkan teknologi digital.</p>
				<p class="mt-4 leading-7 text-so-muted"><strong class="text-so-green">Teknologi tidak menggantikan ulama, guru, atau pesantren.</strong> SantriOnline menjadi jembatan agar kesibukan dan jarak tidak memutus semangat mencari ilmu.</p>
				<a href="/blog/apa-itu-santri-online" class="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-so-green px-6 py-3 font-bold text-white">Baca Penjelasan Lengkap <ArrowRight class="h-4 w-4" /></a>
			</div>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="section-head">
				<p>Fondasi SantriOnline</p>
				<h2>Enam pilar yang menjaga arah produk tetap tarbiyah.</h2>
				<span>Setiap fitur harus membantu pembinaan, bukan hanya menambah menu.</span>
			</div>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
				<span>Fitur dibuat bertahap agar lembaga bisa menjaga biaya, fokus, dan kualitas pembinaan.</span>
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

	<section class="bg-so-green px-4 py-12 text-white sm:px-6 lg:px-8">
		<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
			<div>
				<p class="text-xs font-black uppercase tracking-[0.24em] text-so-gold-2">Addon & Pembayaran</p>
				<h2 class="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl md:text-5xl">Aktifkan modul sesuai kebutuhan, tanpa memaksa lembaga kecil membayar besar.</h2>
				<p class="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/75 md:text-base">Katalog addon sekarang diarahkan sebagai permintaan gratis/konfirmasi admin, sehingga lembaga bisa mulai dari kebutuhan paling mendesak.</p>
				<div class="mt-7 flex flex-col gap-3 sm:flex-row">
					<a class="btn-gold h-12 px-5" href="/addon"><CreditCard class="h-4 w-4" strokeWidth={2.4} />Lihat Addon</a>
					<a class="btn-glass h-12 px-5" href="/coins"><WalletCards class="h-4 w-4" strokeWidth={2.4} />Coin & Wallet</a>
				</div>
			</div>
			<div class="rounded-[1.6rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
				{#each readiness as item}
					<div class="check-row"><CheckCircle2 class="h-5 w-5 text-so-gold-2" strokeWidth={2.4} /><span>{item}</span></div>
				{/each}
			</div>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl rounded-[2rem] border border-so-border bg-white p-5 shadow-sm md:p-8">
			<div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
				<div>
					<p class="text-xs font-black uppercase tracking-[0.22em] text-so-accent-ink">Akses Cepat</p>
					<h2 class="mt-3 text-3xl font-black tracking-[-0.05em] text-so-green md:text-4xl">Masuk ke bagian yang paling sering dipakai.</h2>
					<p class="mt-4 text-sm font-semibold leading-7 text-so-muted">Halaman depan dibuat lebih jelas sebagai pintu pembinaan, dashboard lembaga, kitab, addon, dan konten publik.</p>
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

	.so-hero {
		display: flex;
		flex-direction: column;
		min-height: calc(100svh - 3.5rem);
		padding-top: clamp(3.5rem, 6vw, 6rem);
		padding-bottom: 1.25rem;
		background:
			radial-gradient(circle at 12% 12%, rgb(232 201 122 / 0.18), transparent 27rem),
			radial-gradient(circle at 88% 30%, rgb(82 143 108 / 0.28), transparent 30rem),
			linear-gradient(135deg, #081c15 0%, #0f2f24 48%, #163f30 100%);
	}

	.hero-grid-lines {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px);
		background-size: 58px 58px;
		mask-image: linear-gradient(to bottom, black, transparent 88%);
		pointer-events: none;
	}

	.hero-layout {
		position: relative;
		width: 100%;
		flex: 1 1 auto;
		padding-bottom: clamp(2.25rem, 4vw, 4rem);
	}

	.hero-glow {
		position: absolute;
		border-radius: 9999px;
		filter: blur(64px);
		opacity: 0.42;
		pointer-events: none;
	}

	.hero-glow-one {
		right: -7rem;
		top: 8rem;
		height: 24rem;
		width: 24rem;
		background: var(--color-so-gold);
	}

	.hero-glow-two {
		bottom: -9rem;
		left: 14%;
		height: 22rem;
		width: 22rem;
		background: #2d6a4f;
	}

	.hero-badge {
		border: 1px solid rgb(255 255 255 / 0.16);
		background: rgb(255 255 255 / 0.08);
		padding: 0.65rem 0.95rem;
		font-size: 0.7rem;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgb(255 255 255 / 0.86);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
		backdrop-filter: blur(14px);
	}

	.hero-badge-dot {
		height: 0.5rem;
		width: 0.5rem;
		flex: 0 0 auto;
		border-radius: 9999px;
		background: #7ad9a5;
		box-shadow: 0 0 0 5px rgb(122 217 165 / 0.12), 0 0 18px rgb(122 217 165 / 0.5);
	}

	.hero-title {
		margin-top: 1.5rem;
		max-width: 14ch;
		font-size: clamp(3rem, 4.5vw, 4.7rem);
		font-weight: 950;
		line-height: 0.96;
		letter-spacing: -0.065em;
		color: #ffffff;
		text-wrap: balance;
	}

	.hero-title span {
		display: block;
		background: linear-gradient(100deg, #ffffff 0%, #f0d98f 52%, #d8b95f 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.hero-lead {
		margin-top: 1.45rem;
		max-width: 42rem;
		font-size: clamp(0.96rem, 1.25vw, 1.1rem);
		font-weight: 600;
		line-height: 1.8;
		color: rgb(255 255 255 / 0.72);
	}

	.hero-audience {
		margin-top: 1.15rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgb(255 255 255 / 0.58);
	}

	.hero-audience i {
		height: 0.25rem;
		width: 0.25rem;
		border-radius: 9999px;
		background: var(--color-so-gold-2);
	}

	.hero-actions {
		margin-top: 1.75rem;
	}

	.hero-proof {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.73rem;
		font-weight: 750;
		line-height: 1.5;
		color: rgb(255 255 255 / 0.56);
	}

	.hero-proof :global(svg) {
		flex: 0 0 auto;
		color: var(--color-so-gold-2);
	}

	.hero-visual {
		padding: 2rem 1rem 1rem;
		perspective: 1200px;
	}

	.product-window {
		position: relative;
		border: 1px solid rgb(255 255 255 / 0.2);
		border-radius: 2rem;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(247 245 238 / 0.98));
		padding: 1.25rem;
		box-shadow: 0 38px 90px rgb(0 0 0 / 0.36), inset 0 1px 0 rgb(255 255 255 / 0.9);
		transform: rotateY(-2deg) rotateX(1deg);
	}

	.product-window::before {
		content: '';
		position: absolute;
		inset: -0.65rem;
		z-index: -1;
		border: 1px solid rgb(255 255 255 / 0.12);
		border-radius: 2.35rem;
		background: rgb(255 255 255 / 0.06);
		backdrop-filter: blur(12px);
	}

	.product-window-bar,
	.product-brand {
		display: flex;
		align-items: center;
	}

	.product-window-bar {
		justify-content: space-between;
		gap: 1rem;
	}

	.product-brand {
		gap: 0.7rem;
	}

	.product-mark {
		display: grid;
		height: 2.6rem;
		width: 2.6rem;
		place-items: center;
		border-radius: 0.9rem;
		background: var(--color-so-green);
		color: var(--color-so-gold-2);
	}

	.product-brand strong,
	.product-brand span {
		display: block;
	}

	.product-brand strong {
		font-size: 0.85rem;
		font-weight: 950;
		color: var(--color-so-green);
	}

	.product-brand span {
		margin-top: 0.15rem;
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--color-so-muted);
	}

	.window-dots {
		display: flex;
		gap: 0.35rem;
	}

	.window-dots i {
		height: 0.45rem;
		width: 0.45rem;
		border-radius: 9999px;
		background: #d9d4c8;
	}

	.window-dots i:first-child {
		background: var(--color-so-gold);
	}

	.progress-card {
		margin-top: 1rem;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		border-radius: 1.35rem;
		background: linear-gradient(135deg, #143f2f, #236346);
		padding: 1.15rem;
		color: white;
		box-shadow: 0 15px 28px rgb(15 47 36 / 0.18);
	}

	.preview-eyebrow {
		font-size: 0.61rem;
		font-weight: 950;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-so-gold-2);
	}

	.progress-card > div:first-child > strong {
		margin-top: 0.35rem;
		display: block;
		font-size: 1.18rem;
		font-weight: 950;
		letter-spacing: -0.035em;
	}

	.progress-card p {
		margin-top: 0.35rem;
		max-width: 23rem;
		font-size: 0.69rem;
		font-weight: 650;
		line-height: 1.55;
		color: rgb(255 255 255 / 0.68);
	}

	.progress-ring {
		display: grid;
		height: 4.5rem;
		width: 4.5rem;
		place-content: center;
		border-radius: 9999px;
		background: radial-gradient(circle at center, #1b4d39 59%, transparent 61%), conic-gradient(var(--color-so-gold-2) 0 60%, rgb(255 255 255 / 0.14) 60% 100%);
		text-align: center;
	}

	.progress-ring b,
	.progress-ring span {
		display: block;
	}

	.progress-ring b {
		font-size: 0.95rem;
		font-weight: 950;
	}

	.progress-ring span {
		font-size: 0.55rem;
		font-weight: 750;
		color: rgb(255 255 255 / 0.62);
	}

	.mission-list {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.55rem;
	}

	.mission-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.65rem;
		border: 1px solid #e8e4dc;
		border-radius: 1.05rem;
		background: rgb(255 255 255 / 0.82);
		padding: 0.75rem;
	}

	.mission-check {
		display: grid;
		height: 2.1rem;
		width: 2.1rem;
		place-items: center;
		border-radius: 0.75rem;
		background: #f1eee5;
		color: var(--color-so-gold);
	}

	.mission-done .mission-check {
		background: #e3f4e9;
		color: #218252;
	}

	.mission-row strong,
	.mission-row span {
		display: block;
	}

	.mission-row strong {
		font-size: 0.73rem;
		font-weight: 900;
		color: var(--color-so-green);
	}

	.mission-row span {
		margin-top: 0.15rem;
		font-size: 0.61rem;
		font-weight: 650;
		color: var(--color-so-muted);
	}

	.mission-row > b {
		font-size: 0.65rem;
		font-weight: 950;
		color: var(--color-so-gold);
	}

	.preview-stats {
		margin-top: 0.75rem;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.55rem;
	}

	.preview-stats > div {
		border-radius: 0.95rem;
		background: #f0ede5;
		padding: 0.75rem;
	}

	.preview-stats span,
	.preview-stats strong {
		display: block;
	}

	.preview-stats span {
		font-size: 0.56rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-so-muted);
	}

	.preview-stats strong {
		margin-top: 0.25rem;
		font-size: 0.68rem;
		font-weight: 950;
		color: var(--color-so-green);
	}

	.floating-note {
		position: absolute;
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		border: 1px solid rgb(255 255 255 / 0.25);
		border-radius: 1rem;
		background: rgb(9 31 23 / 0.78);
		padding: 0.7rem 0.85rem;
		color: var(--color-so-gold-2);
		box-shadow: 0 18px 34px rgb(0 0 0 / 0.24);
		backdrop-filter: blur(18px);
	}

	.floating-note strong,
	.floating-note span {
		display: block;
	}

	.floating-note strong {
		font-size: 0.67rem;
		font-weight: 950;
		color: white;
	}

	.floating-note span {
		margin-top: 0.1rem;
		font-size: 0.57rem;
		font-weight: 700;
		color: rgb(255 255 255 / 0.58);
	}

	.floating-note-habit {
		right: -0.5rem;
		top: -0.35rem;
	}

	.floating-note-badge {
		bottom: 0.1rem;
		left: -0.5rem;
	}

	.hero-rail {
		position: relative;
		z-index: 2;
		width: 100%;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-top: 1px solid rgb(255 255 255 / 0.12);
	}

	.hero-rail > div {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border-right: 1px solid rgb(255 255 255 / 0.1);
		padding: 1rem 1.1rem;
		color: var(--color-so-gold-2);
	}

	.hero-rail > div:last-child {
		border-right: 0;
	}

	.hero-rail span {
		font-size: 0.68rem;
		font-weight: 650;
		color: rgb(255 255 255 / 0.58);
	}

	.hero-rail b {
		display: block;
		font-size: 0.77rem;
		font-weight: 950;
		color: white;
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
		background: var(--color-so-gold);
		color: var(--color-so-green-3);
		box-shadow: 0 18px 34px rgba(9, 23, 16, 0.16);
	}

	.btn-glass {
		border: 1px solid rgb(255 255 255 / 0.28);
		background: rgb(255 255 255 / 0.1);
		color: #ffffff;
		backdrop-filter: blur(14px);
	}

	.btn-dark {
		background: var(--color-so-green);
		color: #ffffff;
	}

	.btn-gold:hover,
	.btn-glass:hover,
	.btn-dark:hover,
	.quick-link:hover {
		transform: translateY(-2px);
	}

	.section-head p {
		font-size: 0.75rem;
		font-weight: 950;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-so-gold);
	}

	.section-head h2 {
		margin-top: 0.75rem;
		max-width: 54rem;
		font-size: clamp(2rem, 4.8vw, 3.6rem);
		font-weight: 950;
		line-height: 0.98;
		letter-spacing: -0.055em;
		color: var(--color-so-green);
	}

	.section-head span {
		margin-top: 1rem;
		display: block;
		max-width: 42rem;
		font-size: 0.96rem;
		font-weight: 650;
		line-height: 1.8;
		color: var(--color-so-muted);
	}

	.sticky-block {
		position: sticky;
		top: 1rem;
	}

	.pillar-card,
	.workspace-card,
	.lane-card {
		border: 1px solid var(--color-so-border);
		border-radius: 1.5rem;
		background: var(--color-so-surface);
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
		color: var(--color-so-green);
	}

	.pillar-card p,
	.workspace-card p,
	.lane-card span {
		margin-top: 0.55rem;
		font-size: 0.875rem;
		font-weight: 620;
		line-height: 1.7;
		color: var(--color-so-muted);
	}

	.icon-badge {
		display: grid;
		height: 2.75rem;
		width: 2.75rem;
		place-items: center;
		border-radius: 1rem;
		background: var(--color-so-green);
		color: var(--color-so-gold-2);
	}

	.workspace-card {
		background: linear-gradient(180deg, var(--color-so-surface), var(--color-so-cream));
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
		color: var(--color-so-gold);
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
		border: 1px solid var(--color-so-border);
		background: var(--color-so-surface);
		padding: 0 1rem;
		color: var(--color-so-green);
	}

	.quick-link:hover {
		border-color: var(--color-so-gold);
		box-shadow: 0 12px 22px rgba(31, 45, 36, 0.08);
	}

	@media (max-width: 1023px) {
		.sticky-block {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.so-hero {
			display: block;
			min-height: auto;
			padding: 2rem 1rem 0.75rem;
			background:
				radial-gradient(circle at 50% 0%, rgb(201 168 76 / 0.18), transparent 17rem),
				linear-gradient(180deg, #0b281e 0%, #123729 68%, #0d2d22 100%);
		}

		.hero-grid-lines {
			background-size: 42px 42px;
			opacity: 0.7;
		}

		.hero-layout {
			gap: 2.25rem !important;
			padding-bottom: 1.75rem;
		}

		.hero-glow {
			display: block;
			opacity: 0.2;
		}

		.hero-copy {
			display: flex;
			width: 100%;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.hero-badge {
			justify-content: center;
			padding: 0.55rem 0.75rem;
			font-size: 0.59rem;
			letter-spacing: 0.08em;
			line-height: 1.35;
			text-align: center;
		}

		.hero-badge-text {
			white-space: normal;
			text-wrap: balance;
		}

		.hero-title {
			margin-top: 1.15rem;
			max-width: 17ch;
			width: 100%;
			font-size: clamp(2.05rem, 9.2vw, 2.65rem);
			line-height: 1.02;
			letter-spacing: -0.055em;
			text-align: center;
		}

		.hero-lead {
			margin-top: 1rem;
			max-width: 34rem;
			width: 100%;
			font-size: 0.91rem;
			line-height: 1.72;
			text-align: center;
		}

		.hero-audience {
			justify-content: center;
			gap: 0.45rem;
			font-size: 0.61rem;
			letter-spacing: 0.055em;
		}

		.hero-actions {
			margin-top: 1.25rem;
			width: 100%;
			align-items: stretch;
		}

		.hero-actions > a {
			width: 100%;
			min-height: 3.15rem;
		}

		.hero-proof {
			justify-content: center;
			font-size: 0.65rem;
			text-align: left;
		}

		.btn-gold {
			background: var(--color-so-gold);
			color: var(--color-so-green-3);
			box-shadow: none;
		}

		.btn-glass {
			border-color: rgb(255 255 255 / 0.2);
			background: rgb(255 255 255 / 0.08);
			color: white;
		}

		.hero-visual {
			padding: 0 0.25rem 0.5rem;
		}

		.product-window {
			border-radius: 1.45rem;
			padding: 0.85rem;
			transform: none;
		}

		.product-window::before {
			inset: -0.4rem;
			border-radius: 1.7rem;
		}

		.floating-note {
			display: none;
		}

		.progress-card {
			padding: 0.9rem;
		}

		.progress-card > div:first-child > strong {
			font-size: 1rem;
		}

		.progress-card p {
			font-size: 0.63rem;
		}

		.progress-ring {
			height: 3.8rem;
			width: 3.8rem;
		}

		.mission-row {
			padding: 0.65rem;
		}

		.mission-check {
			height: 1.9rem;
			width: 1.9rem;
		}

		.preview-stats {
			grid-template-columns: 1fr;
		}

		.preview-stats > div {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.65rem 0.75rem;
		}

		.preview-stats strong {
			margin-top: 0;
		}

		.hero-rail {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.hero-rail > div {
			border-bottom: 1px solid rgb(255 255 255 / 0.09);
			padding: 0.8rem 0.45rem;
		}

		.hero-rail > div:nth-child(2) {
			border-right: 0;
		}

		.hero-rail span {
			font-size: 0.59rem;
		}

		.hero-rail b {
			font-size: 0.68rem;
		}

		.section-head {
			text-align: center;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.section-head h2 {
			max-width: 20ch;
			letter-spacing: -0.04em;
			line-height: 1.12;
			text-wrap: balance;
		}

		.section-head span {
			max-width: 34rem;
			text-align: center;
		}

		.pillar-card,
		.workspace-card,
		.lane-card {
			padding: 1.15rem 1.1rem 1.2rem;
			text-align: center;
		}

		.pillar-card .icon-badge,
		.workspace-card .icon-badge {
			margin-left: auto;
			margin-right: auto;
		}

		.lane-card {
			min-height: 0;
			text-align: left;
		}

		section.px-4 {
			padding-top: 2.25rem;
			padding-bottom: 2.25rem;
		}
	}
</style>
