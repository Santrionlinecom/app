<script lang="ts">
	import { ArrowRight, Building2, Clock3, GraduationCap, LogIn, Users } from 'lucide-svelte';
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
			title: 'Daftar sebagai Guru/Ustadz',
			badge: 'Butuh undangan',
			description:
				'Guru atau ustadz masuk melalui lembaga yang sudah terdaftar agar akses kelas, setoran, dan santri langsung sesuai scope.',
			icon: GraduationCap
		},
		{
			title: 'Daftar sebagai Santri/Jamaah/Anggota',
			badge: 'Butuh undangan',
			description:
				'Santri, jamaah, atau anggota bergabung melalui kode/tautan dari admin lembaga supaya data masuk ke lembaga yang benar.',
			icon: Users
		}
	];
</script>

<svelte:head>
	<title>Daftar Akun SantriOnline</title>
</svelte:head>

<div class="min-h-screen w-full max-w-full overflow-x-hidden bg-so-cream px-3 py-10 text-so-ink sm:px-4 lg:px-8">
	<div class="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
		<header class="min-w-0 space-y-4 text-center">
			<div class="mx-auto flex w-fit items-center gap-2 rounded-full border border-so-gold/50 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-so-green shadow-sm">
				<span class="h-2 w-2 rounded-full bg-so-gold"></span>
				SantriOnline
			</div>
			<div class="mx-auto max-w-3xl space-y-3">
				<h1 class="break-words text-3xl font-black tracking-normal text-so-green sm:text-4xl">
					Daftar Akun SantriOnline
				</h1>
				<p class="break-words text-base font-medium leading-7 text-so-muted sm:text-lg">
					Pilih peran dan jenis lembaga agar fitur yang muncul sesuai kebutuhan Anda.
				</p>
			</div>
		</header>

		<section class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
			<article class="min-w-0 rounded-2xl border border-so-border bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
				<div class="flex min-w-0 items-start gap-3">
					<div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-so-green/10 text-so-green">
						<Building2 size={22} strokeWidth={2.2} />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-bold uppercase tracking-[0.18em] text-so-muted">Jalur utama</p>
						<h2 class="mt-1 break-words text-xl font-black text-so-green">
							Daftar sebagai Pengelola/Admin Lembaga
						</h2>
						<p class="mt-2 break-words text-sm leading-6 text-so-muted">
							Buat ruang kerja lembaga, atur anggota, lalu aktifkan fitur sesuai jenis lembaga.
						</p>
					</div>
				</div>

				<div class="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{#each INSTITUTIONS as option}
						{#if option.enabled}
							<a
								href={option.registerRoute}
								class="group min-w-0 rounded-xl border border-so-green/20 bg-so-green/5 p-4 transition hover:-translate-y-0.5 hover:border-so-green/40 hover:bg-so-green/8 hover:shadow-md"
							>
								<div class="flex min-w-0 items-center justify-between gap-2">
									<p class="break-words text-base font-black text-so-green">
										{institutionLabels[option.key]}
									</p>
									<span class="rounded-full bg-so-gold/20 px-2 py-1 text-[11px] font-bold text-so-green">
										Aktif
									</span>
								</div>
								<p class="mt-2 break-words text-sm leading-6 text-so-muted">
									{option.registerDescription}
								</p>
								<span class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-so-green">
									Mulai sekarang
									<ArrowRight size={15} strokeWidth={2.4} class="transition group-hover:translate-x-0.5" />
								</span>
							</a>
						{:else}
							<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/45 p-4 text-so-muted">
								<div class="flex min-w-0 items-center justify-between gap-2">
									<p class="break-words text-base font-black text-so-ink">
										{institutionLabels[option.key]}
									</p>
									<span class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-so-muted">
										<Clock3 size={12} strokeWidth={2.2} />
										Segera
									</span>
								</div>
								<p class="mt-2 break-words text-sm leading-6">
									{option.registerDescription}
								</p>
							</div>
						{/if}
					{/each}
				</div>
			</article>

			<div class="grid min-w-0 grid-cols-1 gap-4">
				{#each roleCards as card}
					<article class="min-w-0 rounded-2xl border border-so-border bg-white p-4 shadow-sm sm:p-6">
						<div class="flex min-w-0 items-start gap-3">
							<div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-so-green/10 text-so-green">
								<svelte:component this={card.icon} size={22} strokeWidth={2.2} />
							</div>
							<div class="min-w-0">
								<span class="rounded-full bg-so-gold/20 px-2 py-1 text-[11px] font-bold text-so-green">
									{card.badge}
								</span>
								<h2 class="mt-3 break-words text-lg font-black text-so-green">{card.title}</h2>
								<p class="mt-2 break-words text-sm leading-6 text-so-muted">{card.description}</p>
							</div>
						</div>
						<a
							href="/auth"
							class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-so-green px-4 py-3 text-sm font-bold text-white transition hover:bg-so-green-3"
						>
							<LogIn size={16} strokeWidth={2.4} />
							Masuk / minta kode undangan lembaga
						</a>
					</article>
				{/each}
			</div>
		</section>

		<p class="break-words text-center text-sm text-so-muted">
			Sudah punya akun?
			<a href="/auth" class="font-bold text-so-green hover:underline">Masuk di sini</a>
		</p>
	</div>
</div>
