<svelte:head>
	<title>Setoran Hari Ini</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Setoran Hari Ini</p>
		<h1 class="mt-2 text-2xl font-semibold">Pantau Setoran</h1>
		<p class="mt-1 text-sm text-white/90">Daftar setoran harian, status, dan catatan ustadz.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Ringkasan</h2>
				<p class="text-sm text-slate-500">Setoran yang masuk hari ini dan statusnya.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm variant-ghost-primary">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Masuk</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Jumlah setoran yang diterima hari ini.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Disetujui</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Setoran yang sudah diverifikasi.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Catatan</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Komentar terbaru dari ustadz.</p>
			</div>
		</div>
		<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
			Integrasikan data setoran harian (status, nilai, revisi) di sini.
		</div>
	</div>
</div>
