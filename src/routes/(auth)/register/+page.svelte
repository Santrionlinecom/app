<script lang="ts">
	import {
		ArrowRight,
		BookOpenCheck,
		Check,
		GraduationCap,
		Home,
		Landmark,
		Link2,
		LockKeyhole,
		LogIn,
		MailCheck,
		ShieldCheck,
		Target,
		Users
	} from '@lucide/svelte';
	import { ENABLED_INSTITUTIONS, type InstitutionKey } from '$lib/config/institutions';

	const institutionIcons = {
		tpq: BookOpenCheck,
		pondok: GraduationCap,
		masjid: Landmark,
		musholla: Home,
		'rumah-tahfidz': Target
	} satisfies Record<InstitutionKey, typeof BookOpenCheck>;
</script>

<svelte:head>
	<title>Daftar Akun | SantriOnline</title>
	<meta
		name="description"
		content="Pilih jalur pendaftaran SantriOnline untuk pengelola lembaga, ustadz, atau anggota lembaga."
	/>
</svelte:head>

<main class="min-h-screen overflow-x-hidden bg-[#f6f7f3] text-slate-900">
	<section class="border-b border-emerald-950/10 bg-[#123f34] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
		<div class="mx-auto grid w-full max-w-6xl items-end gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
			<header class="max-w-3xl">
				<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-50">
					<span class="active-dot h-1.5 w-1.5 rounded-full bg-amber-300"></span>
					Pendaftaran SantriOnline
				</div>
				<h1 class="text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
					Pilih jalur pendaftaran yang sesuai
				</h1>
				<p class="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
					Mulai sebagai pengelola lembaga, ustadz, atau anggota. Setiap jalur disiapkan agar akun dan fitur Anda langsung tepat sasaran.
				</p>
			</header>

			<div class="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-center backdrop-blur-sm">
				<div class="px-2">
					<ShieldCheck class="mx-auto h-5 w-5 text-amber-300" strokeWidth={1.8} />
					<p class="mt-2 text-[11px] font-medium leading-4 text-emerald-50/75 sm:text-xs">Data terlindungi</p>
				</div>
				<div class="px-2">
					<MailCheck class="mx-auto h-5 w-5 text-amber-300" strokeWidth={1.8} />
					<p class="mt-2 text-[11px] font-medium leading-4 text-emerald-50/75 sm:text-xs">Notifikasi email</p>
				</div>
				<div class="px-2">
					<LockKeyhole class="mx-auto h-5 w-5 text-amber-300" strokeWidth={1.8} />
					<p class="mt-2 text-[11px] font-medium leading-4 text-emerald-50/75 sm:text-xs">Akses sesuai peran</p>
				</div>
			</div>
		</div>
	</section>

	<section class="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="registration-paths">
		<div class="mx-auto w-full max-w-6xl">
			<div class="max-w-2xl">
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Mulai pendaftaran</p>
				<h2 id="registration-paths" class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
					Pilih jalur pendaftaran
				</h2>
				<p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
					Semua jenis lembaga sudah dapat didaftarkan. Pilih sesuai amanah Anda saat ini.
				</p>
			</div>

			<div class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{#each ENABLED_INSTITUTIONS as institution}
					{@const Icon = institutionIcons[institution.key]}
					<article class="group flex min-h-[320px] flex-col rounded-3xl border border-emerald-900/15 bg-white p-6 shadow-[0_18px_55px_-35px_rgba(15,67,55,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-800/30 sm:p-7">
						<div class="flex items-start justify-between gap-4">
							<div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-amber-300 shadow-sm">
								<svelte:component this={Icon} size={26} strokeWidth={1.8} />
							</div>
							<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
								<span class="active-dot h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
								Aktif
							</span>
						</div>

						<div class="mt-6">
							<p class="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">{institution.category}</p>
							<h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{institution.label}</h3>
							<p class="mt-3 text-sm leading-6 text-slate-600">{institution.registerDescription}</p>
						</div>

						<ul class="mt-5 grid gap-2 text-sm font-medium text-slate-700">
							{#each institution.highlights as highlight}
								<li class="flex items-center gap-2">
									<Check class="h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.5} />
									{highlight}
								</li>
							{/each}
						</ul>

						<a
							href={institution.registerRoute}
							class="mt-auto inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/20"
						>
							Daftarkan {institution.label}
							<ArrowRight size={17} strokeWidth={2.2} class="transition-transform group-hover:translate-x-0.5" />
						</a>
					</article>
				{/each}

				<article class="group flex min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-800/30 sm:p-7">
					<div class="flex items-start justify-between gap-4">
						<div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-900">
							<GraduationCap size={28} strokeWidth={1.8} />
						</div>
						<span class="rounded-full border border-amber-700/15 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Akun pribadi</span>
					</div>

					<div class="mt-6">
						<p class="text-xs font-bold uppercase tracking-[0.15em] text-amber-800">Untuk pendidik</p>
						<h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">Ustadz atau Pengajar</h3>
						<p class="mt-3 text-sm leading-6 text-slate-600">
							Buat akun pengajar untuk mengelola profil, memilih status mengajar, atau bergabung dengan lembaga.
						</p>
					</div>

					<ul class="mt-5 grid gap-2 text-sm font-medium text-slate-700">
						<li class="flex items-center gap-2"><Check class="h-4 w-4 text-amber-700" strokeWidth={2.5} /> Pengajar mandiri</li>
						<li class="flex items-center gap-2"><Check class="h-4 w-4 text-amber-700" strokeWidth={2.5} /> Pemilik lembaga</li>
						<li class="flex items-center gap-2"><Check class="h-4 w-4 text-amber-700" strokeWidth={2.5} /> Staf atau pengajar</li>
					</ul>

					<a
						href="/register/ustadz"
						class="mt-auto inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-950 bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
					>
						Daftar sebagai Ustadz
						<ArrowRight size={17} strokeWidth={2.2} class="transition-transform group-hover:translate-x-0.5" />
					</a>
				</article>
			</div>
		</div>
	</section>

	<section class="border-y border-slate-200 bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
		<div class="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
			<div class="flex min-w-0 items-start gap-4 sm:gap-5">
				<div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
					<Users size={23} strokeWidth={1.9} />
				</div>
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Santri, jamaah, atau anggota</p>
					<h2 class="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Bergabung melalui lembaga Anda</h2>
					<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
						Mintalah <strong class="font-semibold text-slate-800">tautan pendaftaran dari admin lembaga</strong>. Tautan khusus tersebut memastikan akun Anda langsung terhubung ke lembaga dan peran yang benar.
					</p>
					<div class="mt-4 inline-flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
						<Link2 class="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
						Belum menerima tautan? Hubungi pengelola lembaga tempat Anda bergabung.
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
				<p class="text-sm font-semibold text-slate-900">Sudah memiliki akun?</p>
				<p class="mt-1 text-xs leading-5 text-slate-600">Masuk untuk melanjutkan pembelajaran atau pengelolaan lembaga.</p>
				<a
					href="/auth"
					class="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-950 ring-1 ring-inset ring-slate-300 transition hover:bg-emerald-50 hover:ring-emerald-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
				>
					<LogIn size={17} strokeWidth={2} /> Masuk ke akun
				</a>
			</div>
		</div>
	</section>

	<section class="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
		<div class="mx-auto max-w-6xl rounded-3xl border border-emerald-900/15 bg-emerald-50/60 p-6 sm:p-8">
			<p class="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Setelah mendaftar</p>
			<h2 class="mt-2 text-xl font-bold tracking-tight text-slate-900">Akun siap diarahkan ke langkah berikutnya</h2>
			<div class="mt-6 grid gap-5 sm:grid-cols-3">
				<div class="flex gap-3">
					<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-900 text-xs font-bold text-white">1</span>
					<p class="pt-0.5 text-sm leading-6 text-slate-700">Lengkapi data sesuai jalur yang dipilih.</p>
				</div>
				<div class="flex gap-3">
					<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-900 text-xs font-bold text-white">2</span>
					<p class="pt-0.5 text-sm leading-6 text-slate-700">Terima pemberitahuan melalui email setelah akun berhasil dibuat.</p>
				</div>
				<div class="flex gap-3">
					<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-900 text-xs font-bold text-white">3</span>
					<p class="pt-0.5 text-sm leading-6 text-slate-700">Ikuti arahan di dashboard untuk menyiapkan lembaga atau mulai belajar.</p>
				</div>
			</div>
		</div>

		<p class="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-600">
			Dengan melanjutkan pendaftaran, Anda menyetujui
			<a href="/syarat" class="rounded-sm font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Syarat dan Ketentuan</a>
			dan telah membaca
			<a href="/privacy" class="rounded-sm font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Kebijakan Privasi</a> SantriOnline.
		</p>
	</section>
</main>

<style>
	.active-dot {
		animation: active-pulse 1800ms ease-in-out infinite;
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
		.active-dot {
			animation: none;
		}
	}
</style>
