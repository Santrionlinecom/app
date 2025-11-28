<svelte:head>
	<title>Halaqoh Santri</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Halaqoh</p>
		<h1 class="mt-2 text-2xl font-semibold">Jadwal & Kehadiran</h1>
		<p class="mt-1 text-sm text-white/90">Pantau halaqoh, absensi, dan target bacaan per pertemuan.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Ringkasan</h2>
				<p class="text-sm text-slate-500">Daftar halaqoh terbaru dan absensi.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm variant-ghost-primary">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Halaqoh Aktif</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Tambahkan jadwal halaqoh untuk melihat data di sini.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Kehadiran Hari Ini</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Catat absensi santri pada sesi hari ini.</p>
			</div>
		</div>
		<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
			Integrasikan data halaqoh (jadwal, kehadiran, target bacaan) di sini.
		</div>
	</div>
</div>
