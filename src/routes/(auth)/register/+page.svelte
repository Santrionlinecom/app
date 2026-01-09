<script lang="ts">
	const registerOptions = [
		{
			title: 'Pondok Pesantren',
			description: 'Daftarkan pondok agar bisa menerima pendaftaran santri dan ustadz.',
			href: '/pondok/daftar'
		},
		{
			title: 'Masjid',
			description: 'Buat akun lembaga masjid untuk mengelola jamaah dan program.',
			href: '/masjid/daftar'
		},
		{
			title: 'Musholla',
			description: 'Daftarkan musholla untuk mengelola aktivitas dan anggota.',
			href: '/musholla/daftar'
		},
		{
			title: 'TPQ',
			description: 'Daftarkan TPQ untuk mengelola kelas, santri, dan jadwal belajar.',
			href: '/tpq/daftar'
		},
		{
			title: 'Rumah Tahfidz',
			description: 'Daftarkan rumah tahfidz untuk memantau target hafalan dan halaqah.',
			href: '/rumah-tahfidz/daftar'
		}
	];

	const memberOptions = [
		{ title: 'Pondok Pesantren', href: '/pondok' },
		{ title: 'Masjid', href: '/masjid' },
		{ title: 'Musholla', href: '/musholla' },
		{ title: 'TPQ', href: '/tpq' },
		{ title: 'Rumah Tahfidz', href: '/rumah-tahfidz' }
	];
</script>

<svelte:head>
	<title>Daftar Lembaga</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 py-12 px-4 sm:px-6 lg:px-10">
	<div class="mx-auto w-full max-w-5xl space-y-8">
		<header class="space-y-3 text-center">
			<p class="text-xs uppercase tracking-[0.2em] text-emerald-700">Santri Online</p>
			<h1 class="text-3xl md:text-4xl font-extrabold text-slate-900">Pendaftaran Lembaga</h1>
			<p class="text-base text-slate-600">
				Pilih jenis lembaga untuk didaftarkan. Akun admin lembaga akan dibuat saat pendaftaran.
			</p>
		</header>

		<section class="grid gap-4 md:grid-cols-3">
			{#each registerOptions as option}
				<a
					href={option.href}
					class="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
				>
					<h2 class="text-lg font-semibold text-slate-900">{option.title}</h2>
					<p class="mt-2 text-sm text-slate-600">{option.description}</p>
					<span class="mt-4 inline-block text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
						Daftar sekarang
					</span>
				</a>
			{/each}
		</section>

		<section class="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
			<h3 class="text-lg font-semibold text-slate-900">Daftar Sebagai Anggota</h3>
			<p class="mt-2 text-sm text-slate-600">
				Jika ingin mendaftar sebagai santri, ustadz, jamaah, atau pengurus, silakan pilih lembaga dari daftar berikut.
			</p>
			<div class="mt-4 grid gap-3 md:grid-cols-3">
				{#each memberOptions as option}
					<a
						href={option.href}
						class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
					>
						{option.title}
					</a>
				{/each}
			</div>
		</section>

		<p class="text-center text-sm text-slate-500">
			Sudah punya akun? <a href="/auth" class="font-semibold text-emerald-700 hover:underline">Masuk di sini</a>
		</p>
	</div>
</div>
