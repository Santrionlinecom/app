<script lang="ts">
	const nextSteps = [
		{
			title: 'Setoran harian',
			desc: 'Catat bacaan/hafalan santri dulu sebagai data dasar ujian.',
			href: '/tpq/akademik/setoran'
		},
		{
			title: 'Review setoran',
			desc: 'Pastikan setoran sudah disetujui sebelum masuk penilaian ujian.',
			href: '/tpq/akademik/review'
		},
		{
			title: 'Riwayat akademik',
			desc: 'Lihat histori setoran yang bisa dipakai rekap ujian.',
			href: '/tpq/akademik/riwayat'
		}
	];
</script>

<svelte:head>
	<title>Ujian Tahfidz</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-3xl border border-so-border bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 p-6 text-white shadow-sm">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Akademik lembaga</p>
		<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">Ujian Tahfidz</h1>
		<p class="mt-2 max-w-2xl text-sm leading-7 text-white/90">
			Modul penilaian ujian masih disiapkan. Sementara ini pakai alur setoran–review yang sudah aktif di dashboard.
		</p>
	</section>

	<section class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-bold text-so-ink">Status modul</h2>
				<p class="mt-1 text-sm text-so-muted">
					Belum ada jadwal/skor ujian tersimpan. Halaman ini tetap di dalam shell dashboard.
				</p>
			</div>
			<a
				href="/dashboard"
				class="inline-flex min-h-10 items-center justify-center rounded-xl border border-so-border px-4 text-sm font-bold text-so-green transition hover:bg-so-cream"
			>
				Ke Dashboard
			</a>
		</div>

		<div class="mt-4 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border border-so-border bg-slate-50 p-4">
				<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Ujian terjadwal</p>
				<p class="mt-2 text-2xl font-bold text-so-ink">0</p>
			</div>
			<div class="rounded-xl border border-so-border bg-slate-50 p-4">
				<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Peserta</p>
				<p class="mt-2 text-2xl font-bold text-so-ink">0</p>
			</div>
			<div class="rounded-xl border border-so-border bg-slate-50 p-4">
				<p class="text-xs font-semibold uppercase tracking-wide text-so-muted">Nilai rata-rata</p>
				<p class="mt-2 text-2xl font-bold text-so-ink">-</p>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
		<h2 class="text-lg font-bold text-so-ink">Lanjut dari menu yang sudah siap</h2>
		<div class="mt-4 grid gap-3 md:grid-cols-3">
			{#each nextSteps as item}
				<a
					href={item.href}
					class="rounded-2xl border border-so-border bg-so-cream/50 p-4 transition hover:border-so-green/40 hover:bg-so-cream"
				>
					<p class="font-bold text-so-green">{item.title}</p>
					<p class="mt-1 text-sm leading-6 text-so-muted">{item.desc}</p>
				</a>
			{/each}
		</div>
	</section>
</div>
