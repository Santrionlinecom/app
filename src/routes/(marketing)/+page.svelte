<script lang="ts">
	import { onMount } from 'svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import SchemaOrg from '$lib/components/seo/SchemaOrg.svelte';
	import { ENABLED_INSTITUTIONS, type InstitutionKey } from '$lib/config/institutions';
	import {
		ArrowRight,
		BookOpenCheck,
		CalendarDays,
		CheckCircle2,
		ClipboardList,
		GraduationCap,
		Home,
		Landmark,
		LibraryBig,
		LogIn,
		ShieldCheck,
		Sparkles,
		Target,
		Users,
		WalletCards
	} from '@lucide/svelte';

	type PublicStats = {
		institutionCount?: number;
		studentCount?: number;
		updatedAt?: string;
	};

	const institutionIcons = {
		tpq: BookOpenCheck,
		pondok: GraduationCap,
		masjid: Landmark,
		musholla: Home,
		'rumah-tahfidz': Target
	} satisfies Record<InstitutionKey, typeof BookOpenCheck>;

	const foundationItems = [
		{
			icon: ShieldCheck,
			title: 'Aman untuk data lembaga',
			desc: 'Akses admin, guru, santri, dan jamaah dibuat sesuai peran.'
		},
		{
			icon: ClipboardList,
			title: 'Administrasi lebih rapi',
			desc: 'Data inti lembaga, santri, kas, agenda, dan aset berada dalam satu tempat.'
		},
		{
			icon: Users,
			title: 'Mudah dipakai semua usia',
			desc: 'Tampilan jelas untuk anak santri, wali, pengajar, takmir, dan admin senior.'
		}
	];

	const managementHighlights = [
		'Pendaftaran lembaga langsung aktif pada jalur yang dipilih.',
		'Pengurus dapat mengelola anggota, kegiatan, dan laporan harian.',
		'Setiap jenis lembaga punya fokus fitur yang sesuai kebutuhan lapangan.'
	];

	let targetInstitutionCount = 0;
	let targetStudentCount = 0;
	let displayedInstitutionCount = 0;
	let displayedStudentCount = 0;
	let statsReady = false;
	let statsInView = false;
	let statsAnimated = false;

	const formatCount = (value: number) => new Intl.NumberFormat('id-ID').format(Math.max(0, Math.round(value)));

	const revealSection = (node: HTMLElement) => {
		node.classList.add('reveal-section');
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('reveal-section-visible');
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				node.classList.add('reveal-section-visible');
				observer.disconnect();
			},
			{ threshold: 0.15 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	};

	const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

	const startStatsCountUp = () => {
		if (statsAnimated || typeof window === 'undefined') return;
		statsAnimated = true;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) {
			displayedInstitutionCount = targetInstitutionCount;
			displayedStudentCount = targetStudentCount;
			return;
		}

		const duration = 900;
		const startedAt = performance.now();

		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / duration, 1);
			const eased = easeOutCubic(progress);
			displayedInstitutionCount = targetInstitutionCount * eased;
			displayedStudentCount = targetStudentCount * eased;

			if (progress < 1) {
				requestAnimationFrame(tick);
			} else {
				displayedInstitutionCount = targetInstitutionCount;
				displayedStudentCount = targetStudentCount;
			}
		};

		requestAnimationFrame(tick);
	};

	onMount(() => {
		let cancelled = false;

		const fetchStats = async () => {
			try {
				const response = await fetch('/api/public/stats');
				if (!response.ok) throw new Error('Statistik belum tersedia');
				const payload = (await response.json()) as PublicStats;
				if (cancelled) return;
				targetInstitutionCount = Number(payload.institutionCount ?? 0);
				targetStudentCount = Number(payload.studentCount ?? 0);
			} catch {
				targetInstitutionCount = 0;
				targetStudentCount = 0;
			} finally {
				if (!cancelled) statsReady = true;
			}
		};

		fetchStats();

		const statsNode = document.querySelector('[data-social-proof]');
		if (!statsNode || typeof IntersectionObserver === 'undefined') {
			statsInView = true;
		} else {
			const observer = new IntersectionObserver(
				([entry]) => {
					if (!entry?.isIntersecting) return;
					statsInView = true;
					observer.disconnect();
				},
				{ threshold: 0.35 }
			);
			observer.observe(statsNode);

			return () => {
				cancelled = true;
				observer.disconnect();
			};
		}

		return () => {
			cancelled = true;
		};
	});

	$: if (statsReady && statsInView) {
		startStatsCountUp();
	}
</script>

<SeoHead
	title="SantriOnline App | Platform Manajemen Lembaga Islam"
	description="SantriOnline membantu TPQ, pondok pesantren, rumah tahfidz, masjid, dan musholla mengelola santri, jamaah, kas, agenda, hafalan, dan administrasi harian."
	keywords="santri online, aplikasi santri, manajemen TPQ, pondok pesantren digital, rumah tahfidz, aplikasi lembaga Islam"
	canonical="https://app.santrionline.com/"
/>
<SchemaOrg type="organization" />
<SchemaOrg type="website" />

<main class="min-h-screen overflow-x-hidden bg-[#f6f7f3] text-slate-900">
	<section class="relative border-b border-emerald-950/10 bg-[#123f34] px-4 pb-8 pt-4 text-white sm:px-6 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-14 lg:pt-14">
		<div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" aria-hidden="true"></div>
		<div class="relative mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
			<div class="max-w-3xl">
				<div class="hero-stagger hero-stagger-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
					<span class="active-dot h-2 w-2 rounded-full bg-amber-300"></span>
					Aktif untuk 5 jenis lembaga
				</div>

				<h1 class="hero-stagger hero-stagger-2 mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] text-white sm:mt-4 sm:text-5xl lg:text-6xl">
					Manajemen lembaga Islam yang hangat dan mudah dipakai.
				</h1>
				<p class="hero-stagger hero-stagger-3 mt-3 max-w-2xl text-sm leading-6 text-emerald-50/82 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">
					SantriOnline membantu TPQ, pondok pesantren, rumah tahfidz, masjid, dan musholla menata data, kegiatan, hafalan, kas, dan laporan harian tanpa membuat pengurus kewalahan.
				</p>

				<div class="hero-stagger hero-stagger-4 mt-4 flex flex-col gap-3 min-[420px]:flex-row sm:mt-5">
					<a
						href="/register"
						class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40"
					>
						Daftarkan Lembaga
						<ArrowRight size={18} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
					</a>
					<a
						href="/auth"
						class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
					>
						<LogIn size={18} strokeWidth={2.2} />
						Masuk
					</a>
				</div>
			</div>

			<div class="hidden lg:block">
				<div class="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
					<div class="rounded-3xl bg-[#f6f7f3] p-5 text-slate-900">
						<div class="flex items-center gap-4">
							<img src="/santrionline.png" alt="Logo SantriOnline" width="96" height="96" class="h-20 w-20 rounded-3xl object-contain" loading="eager" decoding="async" />
							<div>
								<p class="text-xs font-bold uppercase text-emerald-800">SantriOnline</p>
								<p class="mt-1 text-xl font-extrabold leading-tight text-slate-900">Ruang kerja pengurus lembaga</p>
							</div>
						</div>
						<div class="mt-6 grid gap-3">
							<div class="rounded-2xl border border-emerald-900/10 bg-white p-4">
								<p class="text-xs font-semibold text-slate-500">Hari ini</p>
								<p class="mt-1 text-lg font-bold text-emerald-950">Kelas, kas, agenda, dan hafalan terpantau.</p>
							</div>
							<div class="grid grid-cols-3 gap-2">
								{#each ['Santri', 'Jamaah', 'Takmir'] as item}
									<div class="rounded-2xl bg-emerald-50 px-3 py-3 text-center text-xs font-bold text-emerald-900">{item}</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section use:revealSection class="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="institution-title">
		<div class="mx-auto max-w-6xl">
			<div class="max-w-2xl">
				<p class="text-xs font-bold uppercase text-emerald-800">Untuk semua jenis lembaga</p>
				<h2 id="institution-title" class="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
					Pilih jalur daftar yang sesuai dengan amanah Anda.
				</h2>
				<p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
					Semua kartu di bawah mengikuti konfigurasi lembaga aktif, sehingga daftar dan kontennya tetap konsisten di seluruh halaman publik.
				</p>
			</div>

			<div class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each ENABLED_INSTITUTIONS as institution}
					{@const Icon = institutionIcons[institution.key]}
					<a
						href={institution.registerRoute}
						class="group flex min-h-[17rem] flex-col rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_48px_-34px_rgba(18,63,52,0.5)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-900/25 hover:shadow-[0_20px_54px_-32px_rgba(18,63,52,0.62)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
					>
						<div class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-amber-300">
							<svelte:component this={Icon} size={24} strokeWidth={1.9} />
						</div>
						<h3 class="mt-5 text-lg font-extrabold text-slate-900">{institution.label}</h3>
						<p class="mt-3 flex-1 text-sm leading-6 text-slate-600">{institution.description}</p>
						<span class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
							Daftarkan
							<ArrowRight size={16} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section use:revealSection class="border-y border-emerald-950/10 bg-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="proof-title">
		<div class="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
			<div>
				<p class="text-xs font-bold uppercase text-emerald-800">Dipercaya pengurus</p>
				<h2 id="proof-title" class="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
					Lembaga dan santri yang sudah mulai tertata.
				</h2>
				<p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
					Angka di bawah diperbarui berkala dari data pendaftaran yang sudah tercatat.
				</p>
			</div>

			<div data-social-proof class="grid gap-3 sm:grid-cols-3" aria-live="polite">
				<div class="rounded-3xl border border-emerald-950/10 bg-[#f6f7f3] p-5">
					<p class="text-sm font-semibold text-slate-600">Lembaga terdaftar</p>
					<p class="mt-3 text-3xl font-extrabold text-emerald-950">{formatCount(displayedInstitutionCount)}</p>
				</div>
				<div class="rounded-3xl border border-emerald-950/10 bg-[#f6f7f3] p-5">
					<p class="text-sm font-semibold text-slate-600">Santri terdaftar</p>
					<p class="mt-3 text-3xl font-extrabold text-emerald-950">{formatCount(displayedStudentCount)}</p>
				</div>
				<div class="rounded-3xl border border-amber-200 bg-amber-50 p-5">
					<p class="text-sm font-semibold text-amber-900">Jalur aktif</p>
					<p class="mt-3 text-3xl font-extrabold text-emerald-950">{ENABLED_INSTITUTIONS.length}</p>
				</div>
			</div>
		</div>
	</section>

	<section use:revealSection class="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
		<div class="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
			{#each foundationItems as item}
				<article class="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_18px_48px_-36px_rgba(18,63,52,0.45)]">
					<div class="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-950">
						<svelte:component this={item.icon} size={22} strokeWidth={2} />
					</div>
					<h2 class="mt-5 text-xl font-extrabold text-slate-900">{item.title}</h2>
					<p class="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section use:revealSection class="bg-[#123f34] px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
		<div class="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
			<div>
				<p class="text-xs font-bold uppercase text-amber-300">Mulai tertata</p>
				<h2 class="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Satu ruang kerja untuk operasional harian lembaga.</h2>
				<div class="mt-5 grid gap-3">
					{#each managementHighlights as item}
						<div class="flex gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
							<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-amber-300" strokeWidth={2.2} />
							<p class="text-sm leading-6 text-emerald-50/86">{item}</p>
						</div>
					{/each}
				</div>
			</div>
			<div class="rounded-3xl border border-white/12 bg-white/8 p-6">
				<div class="grid gap-3">
					<a
						href="/register"
						class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/35"
					>
						Daftarkan Lembaga
						<ArrowRight size={18} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
					</a>
					<a
						href="/fitur"
						class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/16 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
					>
						<LibraryBig size={18} strokeWidth={2.2} />
						Lihat Fitur
					</a>
				</div>
				<div class="mt-5 grid grid-cols-2 gap-3 text-sm font-semibold text-emerald-50/82">
					<div class="rounded-2xl bg-white/8 p-4"><CalendarDays class="mb-3 h-5 w-5 text-amber-300" /> Agenda</div>
					<div class="rounded-2xl bg-white/8 p-4"><WalletCards class="mb-3 h-5 w-5 text-amber-300" /> Kas</div>
					<div class="rounded-2xl bg-white/8 p-4"><BookOpenCheck class="mb-3 h-5 w-5 text-amber-300" /> Hafalan</div>
					<div class="rounded-2xl bg-white/8 p-4"><Sparkles class="mb-3 h-5 w-5 text-amber-300" /> Laporan</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Ekosistem Santri Online: tautan silang antar properti brand. -->
	<footer class="border-t border-emerald-950/10 bg-[#f6f7f3] px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p>
				Bagian dari ekosistem
				<a class="font-semibold text-emerald-800 hover:underline" href="https://santrionline.com/" rel="noopener">Santri Online</a>
				— pembinaan santri &amp; lembaga Islam Indonesia.
			</p>
			<nav class="flex flex-wrap gap-x-4 gap-y-2 font-semibold" aria-label="Ekosistem SantriOnline">
				<a class="hover:text-emerald-800" href="https://santrionline.com/literasi/apa-itu-santri-online" rel="noopener">Apa Itu Santri Online?</a>
				<a class="hover:text-emerald-800" href="/blog">Artikel</a>
				<a class="hover:text-emerald-800" href="/tentang">Tentang</a>
			</nav>
		</div>
	</footer>
</main>

<style>
	.hero-stagger {
		opacity: 0;
		transform: translateY(12px);
		animation: hero-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.hero-stagger-1 {
		animation-delay: 0ms;
	}

	.hero-stagger-2 {
		animation-delay: 80ms;
	}

	.hero-stagger-3 {
		animation-delay: 160ms;
	}

	.hero-stagger-4 {
		animation-delay: 240ms;
	}

	.active-dot {
		animation: active-pulse 1800ms ease-in-out infinite;
	}

	:global(.reveal-section) {
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 400ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.reveal-section-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	@keyframes hero-enter {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes active-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.68;
			transform: scale(0.86);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-stagger,
		:global(.reveal-section) {
			animation: none;
			opacity: 1;
			transform: none;
			transition: none;
		}

		.active-dot {
			animation: none;
		}
	}
</style>
