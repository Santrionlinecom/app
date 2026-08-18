<script lang="ts">
	import {
		ArrowRight,
		BookOpenCheck,
		CalendarCheck,
		CheckCircle2,
		GraduationCap,
		Landmark,
		MapPin,
		ShieldCheck,
		Target,
		Users,
		WalletCards
	} from '@lucide/svelte';
	import {
		getInstitutionByKey,
		type InstitutionKey
	} from '$lib/config/institutions';

	export let title = '';
	export let subtitle = '';
	export let typePath = 'tpq';
	export let orgs: Array<{
		id: string;
		name: string;
		slug: string;
		status?: 'pending' | 'active' | 'rejected';
		city?: string | null;
		address?: string | null;
		contactPhone?: string | null;
		thumbnailUrl?: string | null;
	}> = [];

	type FaqItem = {
		question: string;
		answer: string;
	};

	type PageCopy = {
		eyebrow: string;
		hero: string;
		cta: string;
		featureDescriptions: string[];
		faq: FaqItem[];
	};

	const copyByType: Record<InstitutionKey, PageCopy> = {
		tpq: {
			eyebrow: 'TPQ dan madrasah mengaji',
			hero: 'Kelola santri, kelas, bacaan, dan laporan perkembangan TPQ dengan alur yang sederhana untuk guru dan wali.',
			cta: 'Daftarkan TPQ',
			featureDescriptions: [
				'Bantu guru menata tahsin dasar, makhraj, dan capaian bacaan santri sejak awal belajar.',
				'Materi harian tersusun rapi agar pengajar mudah menjaga ritme kelas dan adab belajar.',
				'Pantau bacaan, hafalan pendek, dan catatan perkembangan tanpa buku rekap yang tercecer.'
			],
			faq: [
				{
					question: 'Apakah TPQ kecil bisa memakai SantriOnline?',
					answer: 'Bisa. Form dan dashboard dibuat sederhana agar TPQ dengan sedikit kelas tetap mudah memulai.'
				},
				{
					question: 'Apakah data santri dan kelas dapat dipisahkan?',
					answer: 'Bisa. Admin dapat menata data lembaga, santri, ustadz, dan aktivitas pembelajaran sesuai kebutuhan TPQ.'
				},
				{
					question: 'Apakah wali santri harus paham teknologi?',
					answer: 'Tidak. Tampilan publik dan tautan pendaftaran dibuat jelas agar wali cukup mengikuti arahan pengurus.'
				}
			]
		},
		pondok: {
			eyebrow: 'Pondok pesantren',
			hero: 'Satukan data santri, pembinaan diniyah, halaqah, dan agenda pondok dalam ruang kerja yang tenang dan terstruktur.',
			cta: 'Daftarkan Pondok',
			featureDescriptions: [
				'Data santri, musyrif, kamar, dan status pembinaan dapat ditata lebih rapi oleh pengurus.',
				'Materi diniyah dan aktivitas belajar harian lebih mudah dipantau lintas pengajar.',
				'Hafalan, ujian, dan evaluasi santri dapat dicatat sebagai bagian dari pembinaan pondok.'
			],
			faq: [
				{
					question: 'Apakah cocok untuk pondok dengan banyak pengurus?',
					answer: 'Cocok. Akses dapat diarahkan sesuai peran agar admin, ustadz, dan staf bekerja pada data yang tepat.'
				},
				{
					question: 'Apakah fokusnya hanya hafalan?',
					answer: 'Tidak. Pondok dapat memakai SantriOnline untuk santri, materi diniyah, agenda, dan administrasi harian.'
				},
				{
					question: 'Bisakah pondok mulai dari data dasar dulu?',
					answer: 'Bisa. Pengurus dapat mendaftarkan lembaga dulu, lalu melengkapi modul yang paling dibutuhkan.'
				}
			]
		},
		masjid: {
			eyebrow: 'Masjid dan takmir',
			hero: 'Bantu takmir menjaga transparansi kas, agenda jamaah, dan pelayanan masjid dengan tampilan yang mudah dibaca semua usia.',
			cta: 'Daftarkan Masjid',
			featureDescriptions: [
				'Pemasukan dan pengeluaran kas dapat disajikan lebih jelas untuk jamaah dan pengurus.',
				'Program zakat, qurban, dan kegiatan sosial masjid lebih mudah ditata dari satu tempat.',
				'Agenda kajian, imam, khotib, dan kegiatan jamaah dapat dipublikasikan dengan rapi.'
			],
			faq: [
				{
					question: 'Apakah laporan kas bisa dipahami jamaah senior?',
					answer: 'Bisa. Tampilan dibuat kontras, ringkas, dan memakai bahasa Indonesia yang jelas.'
				},
				{
					question: 'Apakah masjid bisa mengelola agenda jamaah?',
					answer: 'Bisa. Takmir dapat menata agenda rutin, kajian, jadwal imam, dan informasi kegiatan.'
				},
				{
					question: 'Apakah data masjid langsung terlihat publik?',
					answer: 'Pengurus tetap mengendalikan informasi yang dilengkapi dan dipublikasikan melalui halaman masjid.'
				}
			]
		},
		musholla: {
			eyebrow: 'Musholla lingkungan',
			hero: 'Rapikan kas, kegiatan rutin, dan pelayanan warga musholla tanpa membuat pengurus harus memakai sistem yang rumit.',
			cta: 'Daftarkan Musholla',
			featureDescriptions: [
				'Kas musholla dapat dicatat transparan agar warga mudah melihat amanah keuangan.',
				'Kegiatan rutin, jadwal imam, dan agenda warga dapat disusun lebih teratur.',
				'Pengurus dapat menata layanan warga, aset, dan kontak penting dalam tampilan sederhana.'
			],
			faq: [
				{
					question: 'Apakah musholla kecil tetap perlu mendaftar?',
					answer: 'Boleh. SantriOnline dibuat ringan sehingga musholla lingkungan dapat mulai dari kas dan agenda dasar.'
				},
				{
					question: 'Apakah warga bisa melihat informasi kegiatan?',
					answer: 'Bisa. Halaman musholla membantu warga menemukan agenda dan informasi yang dibagikan pengurus.'
				},
				{
					question: 'Apakah pengurus senior bisa mengoperasikan?',
					answer: 'Bisa. Label, tombol, dan alur dibuat jelas dengan target sentuh yang nyaman.'
				}
			]
		},
		'rumah-tahfidz': {
			eyebrow: 'Rumah tahfidz',
			hero: 'Pantau santri, halaqah, target hafalan, setoran harian, dan evaluasi tahfidz dalam alur yang fokus.',
			cta: 'Daftarkan Rumah Tahfidz',
			featureDescriptions: [
				'Kelompok halaqah dan pembimbing dapat disusun agar setoran santri lebih mudah diikuti.',
				'Catatan setoran harian membantu menjaga konsistensi hafalan dan murojaah.',
				'Ujian tahfidz dan laporan capaian membantu pengurus melihat kualitas hafalan santri.'
			],
			faq: [
				{
					question: 'Apakah target hafalan bisa dipantau berkala?',
					answer: 'Bisa. Rumah tahfidz dapat memakai data santri, setoran, dan evaluasi untuk memantau capaian.'
				},
				{
					question: 'Apakah cocok untuk halaqah kecil?',
					answer: 'Cocok. Alurnya tetap ringan untuk rumah tahfidz dengan sedikit santri atau beberapa halaqah.'
				},
				{
					question: 'Apakah data hafalan aman?',
					answer: 'Data lembaga dan santri mengikuti akses berbasis peran sehingga pengurus dapat mengelola dengan tertib.'
				}
			]
		}
	};

	const heroIcons = {
		tpq: BookOpenCheck,
		pondok: GraduationCap,
		masjid: Landmark,
		musholla: ShieldCheck,
		'rumah-tahfidz': Target
	} satisfies Record<InstitutionKey, typeof BookOpenCheck>;

	const featureIcons = {
		tpq: [BookOpenCheck, GraduationCap, CheckCircle2],
		pondok: [Users, BookOpenCheck, Target],
		masjid: [WalletCards, ShieldCheck, CalendarCheck],
		musholla: [WalletCards, CalendarCheck, Users],
		'rumah-tahfidz': [Users, BookOpenCheck, Target]
	} satisfies Record<InstitutionKey, Array<typeof BookOpenCheck>>;

	const asInstitutionKey = (value: string): InstitutionKey =>
		value in copyByType ? (value as InstitutionKey) : 'tpq';

	$: institutionKey = asInstitutionKey(typePath);
	$: institution = getInstitutionByKey(institutionKey);
	$: pageCopy = copyByType[institutionKey];
	$: visibleOrgs = orgs.filter((org) => org.status !== 'rejected');
	$: activeOrgs = visibleOrgs.length;
	$: HeroIcon = heroIcons[institutionKey];

	const revealSection = (node: HTMLElement) => {
		node.classList.add('org-reveal');
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('org-reveal-visible');
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				node.classList.add('org-reveal-visible');
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
</script>

<section class="bg-[#f6f7f3] text-slate-900">
	<div class="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
		<div class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full border border-emerald-950/10 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900">
					<svelte:component this={HeroIcon} size={16} strokeWidth={2.2} />
					{pageCopy.eyebrow}
				</div>
				<h1 class="mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
					{title || institution.label} lebih tertata bersama SantriOnline.
				</h1>
				<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{pageCopy.hero}</p>
				<div class="mt-5 flex flex-col gap-3 sm:flex-row">
					<a
						href={institution.registerRoute}
						class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/20"
					>
						{pageCopy.cta}
						<ArrowRight size={18} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
					</a>
					<a
						href="#faq"
						class="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-950/15 bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
					>
						Baca FAQ
					</a>
				</div>
			</div>

			<div class="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(18,63,52,0.55)]">
				<div class="flex items-center gap-4">
					<img src="/santrionline.png" alt="" width="80" height="80" class="h-16 w-16 rounded-2xl object-contain" loading="eager" decoding="async" />
					<div>
						<p class="text-xs font-bold uppercase text-emerald-800">Ruang kerja {institution.label}</p>
						<p class="mt-1 text-lg font-extrabold text-slate-900">{activeOrgs} lembaga terdata</p>
					</div>
				</div>
				<div class="mt-5 grid gap-3">
					{#each institution.highlights as highlight}
						<div class="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
							<CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-800" strokeWidth={2.2} />
							{highlight}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<section use:revealSection class="border-y border-emerald-950/10 bg-white px-4 py-9 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="highlights-title">
	<div class="mx-auto max-w-6xl">
		<div class="max-w-2xl">
			<p class="text-xs font-bold uppercase text-emerald-800">Fitur unggulan</p>
			<h2 id="highlights-title" class="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
				Tiga fokus utama untuk {institution.label}.
			</h2>
			<p class="mt-3 text-sm leading-6 text-slate-600">{subtitle || institution.description}</p>
		</div>

		<div class="mt-7 grid gap-4 md:grid-cols-3">
			{#each institution.highlights.slice(0, 3) as highlight, index}
				{@const FeatureIcon = featureIcons[institutionKey][index] ?? CheckCircle2}
				<article class="rounded-3xl border border-emerald-950/10 bg-[#f6f7f3] p-6">
					<div class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-amber-300">
						<svelte:component this={FeatureIcon} size={23} strokeWidth={2} />
					</div>
					<h3 class="mt-5 text-lg font-extrabold text-slate-900">{highlight}</h3>
					<p class="mt-3 text-sm leading-6 text-slate-600">{pageCopy.featureDescriptions[index]}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<section use:revealSection class="px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
	<div class="mx-auto grid max-w-6xl gap-5 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
		<div>
			<p class="text-xs font-bold uppercase text-amber-300">Pendaftaran lembaga</p>
			<h2 class="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{institution.label} dapat mulai dari data dasar dulu.</h2>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/82">
				Admin cukup mengisi data lembaga dan akun pengelola. Setelah masuk dashboard, fitur dapat dilengkapi bertahap sesuai kesiapan tim.
			</p>
		</div>
		<a
			href={institution.registerRoute}
			class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/35"
		>
			{pageCopy.cta}
			<ArrowRight size={18} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
		</a>
	</div>
</section>

<section id="faq" use:revealSection class="px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8" aria-labelledby="faq-title">
	<div class="mx-auto max-w-6xl">
		<div class="max-w-2xl">
			<p class="text-xs font-bold uppercase text-emerald-800">FAQ</p>
			<h2 id="faq-title" class="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
				Pertanyaan umum sebelum mendaftar.
			</h2>
		</div>

		<div class="mt-7 grid gap-4 lg:grid-cols-3">
			{#each pageCopy.faq as item}
				<article class="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_18px_48px_-38px_rgba(18,63,52,0.5)]">
					<h3 class="text-base font-extrabold leading-6 text-slate-900">{item.question}</h3>
					<p class="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
				</article>
			{/each}
		</div>

		<div class="mt-7 flex items-start gap-3 rounded-3xl border border-emerald-950/10 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
			<MapPin class="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.2} />
			<p>
				Setelah lembaga aktif, pengurus dapat membagikan halaman publik lembaga kepada santri, wali, atau jamaah sesuai kebutuhan.
			</p>
		</div>
	</div>
</section>

<section use:revealSection class="border-t border-emerald-950/10 bg-white px-4 py-9 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="directory-title">
	<div class="mx-auto max-w-6xl">
		<div class="max-w-2xl">
			<p class="text-xs font-bold uppercase text-emerald-800">Direktori</p>
			<h2 id="directory-title" class="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
				{institution.label} yang sudah terdata.
			</h2>
			<p class="mt-3 text-sm leading-6 text-slate-600">
				Pilih lembaga aktif untuk melihat halaman publiknya, atau daftarkan lembaga baru jika belum ada.
			</p>
		</div>

		{#if visibleOrgs.length === 0}
			<div class="mt-7 rounded-3xl border border-emerald-950/10 bg-[#f6f7f3] p-6 text-sm leading-6 text-slate-600">
				Belum ada lembaga aktif. Jadilah yang pertama mendaftar.
			</div>
		{:else}
			<div class="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each visibleOrgs as org}
					<a
						href={`/${typePath}/${org.slug}`}
						class="group rounded-3xl border border-emerald-950/10 bg-[#f6f7f3] p-5 shadow-[0_18px_48px_-38px_rgba(18,63,52,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-900/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
					>
						<div class="aspect-video overflow-hidden rounded-2xl border border-emerald-950/10 bg-white">
							{#if org.thumbnailUrl}
								<img src={org.thumbnailUrl} alt={`Foto ${org.name}`} width="640" height="360" class="h-full w-full object-cover" loading="lazy" />
							{:else}
								<div class="flex h-full items-center justify-center text-xs font-semibold text-slate-400">Belum ada foto</div>
							{/if}
						</div>
						<div class="mt-4 flex flex-wrap items-center justify-between gap-2">
							<h3 class="text-base font-extrabold text-slate-900">{org.name}</h3>
							<span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
								{org.status === 'pending' ? 'Menunggu verifikasi' : 'Aktif'}
							</span>
						</div>
						{#if org.city || org.address}
							<p class="mt-2 text-sm leading-6 text-slate-600">{org.address || ''} {org.city || ''}</p>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	:global(.org-reveal) {
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 400ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.org-reveal-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.org-reveal) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
