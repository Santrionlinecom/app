<script lang="ts">
	const days = [
		{
			day: 'Ahad',
			title: 'Aqidah',
			kitab: 'Aqidatul Awam',
			href: '/kitab/terjemah-aqidatul-awam'
		},
		{
			day: 'Senin',
			title: "Tadabbur Qur'an",
			kitab: 'Ilmu Tajwid Lengkap',
			href: '/kitab/ilmu-tajwid-lengkap'
		},
		{
			day: 'Selasa',
			title: 'Hadits',
			kitab: 'Arbain Nawawi',
			href: '/kitab/terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied'
		},
		{
			day: 'Rabu',
			title: 'Fiqih',
			kitab: 'Safinatun Najah',
			href: '/kitab/safinatun-najah-makna-perkata'
		},
		{
			day: 'Kamis',
			title: 'Tasawuf',
			kitab: 'Bidayatul Hidayah',
			href: '/kitab/terjemah-bidayatul-hidayah'
		},
		{
			day: 'Jumat',
			title: "Do'a & Dzikir",
			kitab: 'Bidayatul Hidayah — adab harian',
			href: '/kitab/terjemah-bidayatul-hidayah'
		},
		{
			day: 'Sabtu',
			title: 'B. Arab',
			kitab: 'Bahasa Arab Dasar 1',
			href: '/kitab/bahasa-arab-dasar-1'
		}
	];
</script>

<svelte:head>
	<title>Diniyah Santri</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-3xl border bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">Diniyah</p>
		<h1 class="mt-2 text-2xl font-semibold">Materi Harian</h1>
		<p class="mt-1 text-sm text-white/90">Buka kitab digital sesuai hari. Materi ini sudah ada di Katalog Kitab.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Topik Mingguan</h2>
				<p class="text-sm text-slate-500">Aqidah hingga B. Arab, langsung ke kitabnya.</p>
			</div>
			<a href="/kitab" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Lihat semua kitab</a>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			{#each days as item}
				<a href={item.href} class="rounded-xl border bg-slate-50 p-3 transition hover:border-so-green/40 hover:bg-white">
					<p class="text-xs uppercase tracking-wide text-slate-500">{item.day}</p>
					<p class="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
					<p class="text-xs text-slate-500">{item.kitab}</p>
					<p class="mt-2 text-xs font-bold text-so-green">Buka kitab</p>
				</a>
			{/each}
		</div>
	</div>
</div>
