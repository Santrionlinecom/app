<script lang="ts">
	import { ArrowRight, Building2, GraduationCap, LogIn, Users } from 'lucide-svelte';
	import { INSTITUTIONS, type InstitutionKey } from '$lib/config/institutions';

	const institutionLabels: Record<InstitutionKey, string> = {
		tpq: 'TPQ',
		pondok: 'Pondok',
		masjid: 'Masjid',
		musholla: 'Musholla',
		'rumah-tahfidz': 'Rumah Tahfidz'
	};

	const roleCards = [
		{
			title: 'Guru/Ustadz',
			badge: 'Butuh Kode Undangan',
			description:
				'Bergabung melalui kode undangan dari admin lembaga. Kode ini memastikan akun Anda terhubung ke lembaga yang tepat dengan akses kelas dan santri yang sesuai.',
			icon: GraduationCap,
			ctaText: 'Masuk dengan Kode'
		},
		{
			title: 'Santri/Jamaah/Anggota',
			badge: 'Butuh Kode Undangan',
			description:
				'Bergabung melalui kode undangan dari admin lembaga. Kode ini memastikan data Anda masuk ke lembaga yang benar dan mendapat akses fitur yang sesuai.',
			icon: Users,
			ctaText: 'Gabung Pakai Kode'
		}
	];

	const featureByInstitution: Record<InstitutionKey, string[]> = {
		tpq: ['Kelas & santri', 'Setoran hafalan', 'Rapor & sertifikat'],
		pondok: ['Santri & ustadz', 'Diniyah', 'Tahfidz & ujian'],
		masjid: ['Jamaah', 'Kas & zakat', 'Jadwal imam/khotib'],
		musholla: ['Anggota warga', 'Kas transparan', 'Agenda kegiatan'],
		'rumah-tahfidz': ['Halaqoh', 'Target hafalan', 'Evaluasi setoran']
	};

	const institutionStatus: Record<InstitutionKey, { ready: boolean; label: string }> = {
		tpq: { ready: true, label: 'Aktif' },
		pondok: { ready: false, label: 'Dalam Pengembangan' },
		masjid: { ready: false, label: 'Dalam Pengembangan' },
		musholla: { ready: false, label: 'Dalam Pengembangan' },
		'rumah-tahfidz': { ready: false, label: 'Dalam Pengembangan' }
	};
</script>

<svelte:head>
	<title>Daftar Akun SantriOnline</title>
</svelte:head>

<div class="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-so-cream via-white to-so-cream/50 px-4 py-12 text-so-ink sm:px-6 lg:px-8 lg:py-16">
	<div class="mx-auto w-full max-w-6xl space-y-8 sm:space-y-10">
		<!-- Header -->
		<header class="min-w-0 space-y-5 text-center">
			<div class="mx-auto flex w-fit items-center gap-2 rounded-full border border-so-gold/30 bg-gradient-to-r from-white to-so-gold/5 px-4 py-1.5 shadow-sm">
				<span class="h-2 w-2 animate-pulse rounded-full bg-so-gold"></span>
				<span class="text-xs font-bold uppercase tracking-[0.2em] text-so-green">SantriOnline</span>
			</div>
			<div class="mx-auto max-w-3xl space-y-4">
				<h1 class="break-words text-4xl font-black leading-tight tracking-tight text-so-green sm:text-5xl">
					Daftar Akun Baru
				</h1>
				<p class="break-words text-base font-medium leading-relaxed text-so-muted sm:text-lg">
					Pilih peran dan jenis lembaga agar fitur yang muncul sesuai kebutuhan Anda
				</p>
			</div>
		</header>

		<!-- Main Content Grid -->
		<section class="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Admin/Pengelola Card (Larger) -->
			<article class="min-w-0 rounded-2xl border border-so-green/10 bg-white p-6 shadow-lg shadow-so-green/5 sm:p-8 lg:col-span-2">
				<div class="flex min-w-0 items-start gap-4">
					<div class="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-so-green to-so-green-3 text-white shadow-md">
						<Building2 size={26} strokeWidth={2.2} />
					</div>
					<div class="min-w-0 flex-1">
						<div class="inline-flex items-center gap-2 rounded-full bg-so-gold/10 px-3 py-1">
							<span class="h-1.5 w-1.5 rounded-full bg-so-gold"></span>
							<p class="text-xs font-bold uppercase tracking-[0.15em] text-so-green">Jalur Utama</p>
						</div>
						<h2 class="mt-3 break-words text-2xl font-black leading-tight text-so-green sm:text-3xl">
							Admin/Pengelola Lembaga
						</h2>
						<p class="mt-3 break-words text-sm leading-relaxed text-so-muted sm:text-base">
							Buat ruang kerja lembaga baru, kelola anggota, dan langsung akses fitur yang relevan untuk jenis lembaga Anda
						</p>
					</div>
				</div>

				<!-- Institution Options -->
				<div class="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each INSTITUTIONS as option}
						{@const status = institutionStatus[option.key]}
						<a
							href={status.ready ? option.registerRoute : '#'}
							class="group relative min-w-0 overflow-hidden rounded-xl border transition-all duration-200 {status.ready
								? 'border-so-green/20 bg-gradient-to-br from-so-green/5 to-so-green/10 hover:-translate-y-1 hover:border-so-green/40 hover:shadow-lg hover:shadow-so-green/10'
								: 'border-so-border/50 bg-gray-50 opacity-75 cursor-not-allowed'}"
						>
							<div class="p-5">
								<div class="flex min-w-0 items-start justify-between gap-2">
									<p class="break-words text-lg font-black text-so-green">
										{institutionLabels[option.key]}
									</p>
									<span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider {status.ready
										? 'bg-so-gold/20 text-so-green'
										: 'bg-gray-200 text-gray-600'}">
										{status.label}
									</span>
								</div>
								<p class="mt-3 break-words text-sm leading-relaxed text-so-muted">
									{option.registerDescription}
								</p>
								<div class="mt-4 flex flex-wrap gap-1.5">
									{#each featureByInstitution[option.key] as feature}
										<span class="rounded-full border border-so-green/15 bg-white px-2.5 py-1 text-[10px] font-bold text-so-green">
											{feature}
										</span>
									{/each}
								</div>
								{#if status.ready}
									<span class="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-so-green transition-transform group-hover:translate-x-1">
										Mulai Sekarang
										<ArrowRight size={16} strokeWidth={2.5} />
									</span>
								{/if}
							</div>
							{#if !status.ready}
								<div class="absolute inset-0 bg-gradient-to-t from-gray-100/80 to-transparent pointer-events-none"></div>
							{/if}
						</a>
					{/each}
				</div>
			</article>

			<!-- Role Cards (Guru & Santri) -->
			<div class="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
				{#each roleCards as card}
					<article class="min-w-0 rounded-2xl border border-so-green/10 bg-white p-6 shadow-lg shadow-so-green/5">
						<div class="flex min-w-0 items-start gap-3">
							<div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-so-green/10 to-so-green/20 text-so-green">
								<svelte:component this={card.icon} size={24} strokeWidth={2.2} />
							</div>
							<div class="min-w-0 flex-1">
								<span class="inline-block rounded-full bg-so-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-so-green">
									{card.badge}
								</span>
								<h2 class="mt-3 break-words text-lg font-black leading-tight text-so-green sm:text-xl">
									{card.title}
								</h2>
							</div>
						</div>
						<p class="mt-4 break-words text-sm leading-relaxed text-so-muted">
							{card.description}
						</p>
						<a
							href="/auth"
							class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-so-green to-so-green-3 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-so-green/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-so-green/30"
						>
							<LogIn size={18} strokeWidth={2.4} />
							{card.ctaText}
						</a>
					</article>
				{/each}
			</div>
		</section>

		<!-- Info Box: Kode Undangan -->
		<div class="mx-auto max-w-3xl rounded-xl border border-so-gold/20 bg-gradient-to-r from-so-gold/5 to-so-gold/10 p-6 shadow-sm">
			<div class="flex items-start gap-3">
				<div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-so-gold/20 text-so-green">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
				</div>
				<div class="min-w-0 flex-1">
					<h3 class="break-words text-base font-bold text-so-green sm:text-lg">Apa itu Kode Undangan?</h3>
					<p class="mt-2 break-words text-sm leading-relaxed text-so-muted">
						Kode undangan diberikan oleh admin lembaga kepada guru/ustadz atau santri/jamaah agar akun mereka terhubung ke lembaga yang tepat. Tanpa kode ini, Anda tidak bisa bergabung sebagai anggota lembaga.
					</p>
				</div>
			</div>
		</div>

		<!-- Footer Link -->
		<p class="break-words text-center text-sm text-so-muted">
			Sudah punya akun?
			<a href="/auth" class="font-bold text-so-green underline-offset-2 hover:underline">Masuk di sini</a>
		</p>
	</div>
</div>