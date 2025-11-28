<svelte:head>
	<title>Ujian Tahfidz</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Ujian Tahfidz</p>
		<h1 class="mt-2 text-2xl font-semibold">Simulasi & Penilaian</h1>
		<p class="mt-1 text-sm text-white/90">Rekap ujian, skor, dan catatan per santri.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Ringkasan</h2>
				<p class="text-sm text-slate-500">Siapkan jadwal ujian dan hasil penilaian.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm variant-ghost-primary">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Ujian Terjadwal</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Tambahkan jadwal ujian untuk menampilkan data.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Peserta</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Jumlah santri yang mengikuti ujian.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Nilai Rata-rata</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Rekap nilai terbaru.</p>
			</div>
		</div>
		<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
			Integrasikan modul ujian (skor, komentar, rekaman audio) di sini.
		</div>
	</div>
</div>
