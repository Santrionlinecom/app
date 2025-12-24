<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { FEATURES } from '$lib/features';

	const privilegedRoles = ['admin', 'ustadz', 'ustadzah', 'santri', 'jamaah', 'tamir', 'bendahara', 'alumni'];
	$: showDashboard = data?.user?.role && privilegedRoles.includes(data.user.role);

	const orgTypes = [
		{
			label: 'Pondok Pesantren',
			tag: 'Pendidikan',
			desc: 'Pembinaan santri 24 jam dengan kurikulum diniyah dan tahfidz.',
			href: '/pondok',
			icon: '🏫',
			highlights: ['Manajemen santri', 'Materi diniyah', 'Tahfidz & ujian'],
			classes: {
				card: 'border-indigo-200/70 bg-white/90',
				accent: 'text-indigo-700',
				badge: 'bg-indigo-100 text-indigo-700'
			}
		},
		{
			label: 'Masjid',
			tag: 'Kemasjidan',
			desc: 'Transparansi kas, zakat, dan qurban untuk jamaah.',
			href: '/masjid',
			icon: '🕌',
			highlights: ['Kas transparan', 'Zakat & qurban', 'Agenda jamaah'],
			classes: {
				card: 'border-emerald-200/70 bg-white/90',
				accent: 'text-emerald-700',
				badge: 'bg-emerald-100 text-emerald-700'
			}
		},
		{
			label: 'Musholla',
			tag: 'Kemasjidan',
			desc: 'Pengelolaan kegiatan musholla kampung yang rapi.',
			href: '/musholla',
			icon: '🏠',
			highlights: ['Kas transparan', 'Kegiatan rutin', 'Pelayanan warga'],
			classes: {
				card: 'border-cyan-200/70 bg-white/90',
				accent: 'text-cyan-700',
				badge: 'bg-cyan-100 text-cyan-700'
			}
		},
		{
			label: 'TPQ',
			tag: 'Pendidikan',
			desc: 'Pembelajaran Al-Quran dasar dengan pengelolaan kelas.',
			href: '/tpq',
			icon: '📘',
			highlights: ['Tahsin dasar', 'Materi harian', 'Monitoring bacaan'],
			classes: {
				card: 'border-lime-200/70 bg-white/90',
				accent: 'text-lime-700',
				badge: 'bg-lime-100 text-lime-700'
			}
		},
		{
			label: 'Rumah Tahfidz',
			tag: 'Pendidikan',
			desc: 'Fokus hafalan dengan target dan evaluasi terukur.',
			href: '/rumah-tahfidz',
			icon: '🎯',
			highlights: ['Halaqoh hafalan', 'Setoran harian', 'Ujian tahfidz'],
			classes: {
				card: 'border-amber-200/70 bg-white/90',
				accent: 'text-amber-800',
				badge: 'bg-amber-100 text-amber-800'
			}
		}
	];

	const solutionCards = [
		{
			title: 'Lembaga Pendidikan',
			subtitle: 'Pondok - TPQ - Rumah Tahfidz',
			desc: 'Kelola santri, materi ajar, dan hafalan dengan dashboard yang tertata.',
			bullets: ['Database santri dan ustadz/ustadzah', 'Materi diniyah terjadwal', 'Setoran dan ujian hafalan'],
			href: '/fitur/belajar-alquran',
			cta: 'Lihat fitur pendidikan',
			classes: {
				card: 'border-emerald-200',
				accent: 'text-emerald-700',
				badge: 'bg-emerald-100 text-emerald-700',
				bullet: 'text-emerald-600'
			}
		},
		{
			title: 'Masjid & Musholla',
			subtitle: 'Kas - Zakat - Qurban',
			desc: 'Transparansi keuangan dan agenda jamaah agar warga semakin percaya.',
			bullets: ['Kas transparan dan cashflow', 'Rekap zakat & qurban', 'Agenda kajian dan jamaah'],
			href: '/fitur/sholat-jamaah',
			cta: 'Lihat fitur kemasjidan',
			classes: {
				card: 'border-amber-200',
				accent: 'text-amber-800',
				badge: 'bg-amber-100 text-amber-800',
				bullet: 'text-amber-600'
			}
		}
	];
</script>

<svelte:head>
	<title>Santri Online - Platform Lembaga & Pembelajaran Aswaja</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen home-root">
	<section class="relative overflow-hidden">
		<div class="home-orb home-orb-left"></div>
		<div class="home-orb home-orb-right"></div>
		<div class="container mx-auto px-4 py-16 md:py-24">
			<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
				<div class="space-y-6 home-rise">
					<div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-lg backdrop-blur">
						<span class="text-xs uppercase tracking-[0.35em] text-emerald-600">Platform Lembaga Aswaja</span>
					</div>
					<h1 class="home-title text-4xl md:text-6xl text-slate-900 leading-tight">
						Promosi Lembaga Islam &amp; Fitur Pembinaan Santri
					</h1>
					<p class="text-lg md:text-xl text-slate-600 max-w-2xl">
						Daftarkan lembaga dan tampilkan fitur unggulan: manajemen santri, materi ajar, hafalan, hingga
						transparansi kas untuk masjid dan musholla.
					</p>

					<div class="flex flex-col sm:flex-row gap-4">
						{#if showDashboard}
							<a href="/dashboard" class="home-btn-primary">
								📊 Buka Dashboard
							</a>
						{:else}
							<a href="/register" class="home-btn-primary">
								✨ Daftarkan Lembaga
							</a>
						{/if}
						<a href="/fitur" class="home-btn-secondary">Lihat Fitur</a>
					</div>

					<div class="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
						<span class="rounded-full bg-white/80 px-3 py-2">5 Jenis Lembaga</span>
						<span class="rounded-full bg-white/80 px-3 py-2">Dashboard Per Lembaga</span>
						<span class="rounded-full bg-white/80 px-3 py-2">Transparansi Keuangan</span>
					</div>
				</div>

				<div class="home-panel home-rise" style="animation-delay: 120ms">
					<div class="flex items-center justify-between">
						<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Rangkuman</p>
						<a href="/register" class="text-xs font-semibold text-emerald-700">Daftar Lembaga</a>
					</div>
					<div class="mt-4 grid gap-3">
						<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
							<p class="text-sm font-semibold text-emerald-800">Pendidikan</p>
							<p class="text-xs text-slate-600 mt-1">Pondok, TPQ, Rumah Tahfidz</p>
							<p class="text-xs text-slate-600 mt-2">Santri, materi ajar, halaqoh, dan ujian tahfidz.</p>
						</div>
						<div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
							<p class="text-sm font-semibold text-cyan-800">Kemasjidan</p>
							<p class="text-xs text-slate-600 mt-1">Masjid, Musholla</p>
							<p class="text-xs text-slate-600 mt-2">Kas transparan, zakat, qurban, dan agenda jamaah.</p>
						</div>
						<div class="rounded-2xl border border-slate-200 bg-white p-4">
							<p class="text-sm font-semibold text-slate-900">Fitur Unggulan</p>
							<p class="text-xs text-slate-600 mt-2">Tanya kitab, mushaf, dzikir, dan materi pembinaan.</p>
							<a href="/fitur" class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
								Lihat semua fitur
								<span>→</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="container mx-auto px-4 py-12 home-section">
		<div class="text-center max-w-3xl mx-auto mb-10">
			<p class="home-eyebrow text-emerald-600">Promosi Lembaga</p>
			<h2 class="home-heading text-3xl md:text-4xl text-slate-900">Jenis Lembaga yang Tersedia</h2>
			<p class="text-slate-600 mt-3">
				Santri Online menampilkan profil lembaga dan fitur yang sesuai dengan kebutuhan masing-masing.
			</p>
		</div>

		<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
			{#each orgTypes as org, index}
				<a
					href={org.href}
					class={`home-card rounded-2xl border ${org.classes.card} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
					style={`animation-delay: ${index * 90}ms`}
				>
					<div class="flex items-center justify-between">
						<span class={`badge ${org.classes.badge}`}>{org.tag}</span>
						<span class="text-2xl">{org.icon}</span>
					</div>
					<h3 class={`mt-3 text-xl font-semibold ${org.classes.accent}`}>{org.label}</h3>
					<p class="text-sm text-slate-600 mt-2">{org.desc}</p>
					<ul class="mt-3 space-y-1 text-xs text-slate-600">
						{#each org.highlights as highlight}
							<li class="flex items-center gap-2">
								<span class="text-emerald-600">&bull;</span>
								<span>{highlight}</span>
							</li>
						{/each}
					</ul>
					<span class="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
						Lihat lembaga
						<span>→</span>
					</span>
				</a>
			{/each}
		</div>
	</section>

	<section class="container mx-auto px-4 py-12 home-section">
		<div class="grid gap-6 lg:grid-cols-2">
			{#each solutionCards as card, index}
				<div
					class={`home-card rounded-3xl border ${card.classes.card} bg-white p-6 md:p-8 shadow-sm`}
					style={`animation-delay: ${index * 120}ms`}
				>
					<span class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${card.classes.badge}`}>
						{card.subtitle}
					</span>
					<h3 class={`home-heading mt-4 text-2xl ${card.classes.accent}`}>{card.title}</h3>
					<p class="text-sm text-slate-600 mt-2">{card.desc}</p>
					<ul class="mt-4 space-y-2 text-sm text-slate-600">
						{#each card.bullets as bullet}
							<li class="flex items-start gap-2">
								<span class={`${card.classes.bullet} mt-1`}>&bull;</span>
								<span>{bullet}</span>
							</li>
						{/each}
					</ul>
					<a href={card.href} class={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${card.classes.accent}`}>
						{card.cta}
						<span>→</span>
					</a>
				</div>
			{/each}
		</div>
	</section>

	<section class="container mx-auto px-4 py-12 home-section">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
			<div>
				<p class="home-eyebrow text-emerald-600">Fitur Unggulan</p>
				<h2 class="home-heading text-3xl md:text-4xl text-slate-900">Program &amp; Fitur Lembaga</h2>
				<p class="text-slate-600 mt-2 max-w-2xl">
					Setiap fitur dirancang untuk mendukung kebutuhan lembaga dan santri sesuai peran masing-masing.
				</p>
			</div>
			<a href="/fitur" class="home-btn-secondary w-full md:w-auto text-center">Lihat Semua Fitur</a>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each FEATURES as feature, index}
				<a
					href={`/fitur/${feature.slug}`}
					class="home-card group relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
					style={`animation-delay: ${index * 70}ms`}
				>
					<div class="absolute top-0 right-0 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 opacity-60 blur-2xl"></div>
					<div class="relative">
						<span class="text-4xl mb-4 block">{feature.icon}</span>
						<h3 class="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
						<p class="text-sm text-slate-600 mb-4">{feature.desc}</p>
						<span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
							Pelajari fitur
							<span>→</span>
						</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section class="container mx-auto px-4 py-12">
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 text-white shadow-2xl">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 text-center max-w-3xl mx-auto">
				<h2 class="home-heading text-3xl md:text-4xl mb-4">Bangun Lembaga yang Lebih Tertata</h2>
				<p class="text-lg opacity-90 mb-8">
					Promosikan lembaga Anda dan aktifkan fitur sesuai kebutuhan jamaah dan santri.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a href="/register" class="btn bg-white text-emerald-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4">
						Daftar Lembaga
					</a>
					<a href="/fitur" class="btn btn-ghost text-white hover:bg-white/10 text-lg px-8 py-4">
						Lihat Fitur
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
			radial-gradient(60% 50% at 10% 10%, rgba(13, 148, 136, 0.15), transparent 60%),
			radial-gradient(40% 40% at 90% 0%, rgba(34, 211, 238, 0.18), transparent 55%),
			linear-gradient(180deg, #ecfeff 0%, #ffffff 55%, #f8fafc 100%);
		color: var(--so-ink);
		font-family: var(--so-body);
	}

	.home-title,
	.home-heading {
		font-family: var(--so-display);
		letter-spacing: -0.02em;
	}

	.home-eyebrow {
		font-size: 0.75rem;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		font-weight: 600;
	}

	.home-btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #0f766e, #14b8a6);
		padding: 0.9rem 2rem;
		color: #ffffff;
		font-weight: 600;
		box-shadow: 0 20px 45px rgba(13, 148, 136, 0.25);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.home-btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 24px 60px rgba(13, 148, 136, 0.35);
	}

	.home-btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 118, 110, 0.2);
		background: rgba(255, 255, 255, 0.9);
		padding: 0.85rem 2rem;
		font-weight: 600;
		color: #0f766e;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.home-btn-secondary:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 40px rgba(15, 118, 110, 0.2);
	}

	.home-panel {
		border-radius: 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.25);
		background: rgba(255, 255, 255, 0.86);
		padding: 1.5rem;
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
		backdrop-filter: blur(10px);
	}

	.home-orb {
		position: absolute;
		width: 22rem;
		height: 22rem;
		border-radius: 999px;
		filter: blur(0px);
		opacity: 0.45;
		animation: drift 14s ease-in-out infinite;
	}

	.home-orb-left {
		left: -8rem;
		top: -6rem;
		background: radial-gradient(circle, rgba(16, 185, 129, 0.35), transparent 60%);
	}

	.home-orb-right {
		right: -10rem;
		top: 3rem;
		background: radial-gradient(circle, rgba(34, 211, 238, 0.35), transparent 60%);
		animation-delay: 1.5s;
	}

	.home-rise,
	.home-card {
		animation: rise 0.8s ease both;
	}

	.home-section {
		animation: rise 0.9s ease both;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(18px);
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
			transform: translate(12px, 18px);
		}
		100% {
			transform: translate(0, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home-rise,
		.home-card,
		.home-section,
		.home-orb {
			animation: none;
		}
		.home-btn-primary,
		.home-btn-secondary {
			transition: none;
		}
	}
</style>
