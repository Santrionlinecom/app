<svelte:head>
	<title>Review Setoran</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Admin/Ustadz</p>
		<h1 class="mt-2 text-2xl font-semibold">Review Setoran</h1>
		<p class="mt-1 text-sm text-white/90">Kontrol setoran harian, berikan catatan, setujui atau minta perbaikan.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Daftar Setoran</h2>
				<p class="text-sm text-slate-500">Sinkron dengan menu santri agar status jelas.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Masuk Hari Ini</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Jumlah setoran yang diterima.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Disetujui</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Setoran yang sudah divalidasi.</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Perlu Perbaikan</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">-</p>
				<p class="text-xs text-slate-500">Setoran yang perlu revisi.</p>
			</div>
		</div>
		<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
			Integrasikan tabel setoran (status, nilai, audio) dan aksi setujui/tolak agar terlihat di sisi santri.
		</div>
	</div>
</div>
