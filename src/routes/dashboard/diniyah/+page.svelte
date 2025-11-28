<svelte:head>
	<title>Diniyah Santri</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Diniyah</p>
		<h1 class="mt-2 text-2xl font-semibold">Materi Harian</h1>
		<p class="mt-1 text-sm text-white/90">Daftar kitab yang dipelajari berdasarkan indeks hari.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Topik Mingguan</h2>
				<p class="text-sm text-slate-500">Aqidah hingga B. Arab sesuai hari.</p>
			</div>
			<a href="/dashboard" class="btn btn-sm variant-ghost-primary">Kembali ke dashboard</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Ahad</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Aqidah</p>
				<p class="text-xs text-slate-500">Aqidatul Awam</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Senin</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Tadabbur Qur'an</p>
				<p class="text-xs text-slate-500">Materi ayat pilihan</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Selasa</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Hadits</p>
				<p class="text-xs text-slate-500">Arbain Nawawi</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Rabu</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Fiqih</p>
				<p class="text-xs text-slate-500">Safinatun Najah</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Kamis</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Tasawuf</p>
				<p class="text-xs text-slate-500">Bidayatul Hidayah</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Jumat</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">Do'a & Dzikir</p>
				<p class="text-xs text-slate-500">Wirid & adab harian</p>
			</div>
			<div class="rounded-xl border bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Sabtu</p>
				<p class="mt-1 text-sm font-semibold text-slate-900">B. Arab</p>
				<p class="text-xs text-slate-500">Miftahul Lughoh</p>
			</div>
		</div>
		<div class="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
			Integrasikan ringkasan materi, tugas, dan tautan kitab di sini.
		</div>
	</div>
</div>
