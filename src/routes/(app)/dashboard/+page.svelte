<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	type InstitutionType = 'PESANTREN' | 'MASJID';

	let institutionType: InstitutionType = 'PESANTREN';
	$: institutionType = (data?.institution_type ?? 'PESANTREN') as InstitutionType;
	$: isPesantren = institutionType === 'PESANTREN';

	const hafalanSeries = [22, 35, 28, 48, 55, 42, 60];
	const hafalanMax = Math.max(...hafalanSeries, 1);
	const hafalanBars = hafalanSeries.map((value) => Math.round((value / hafalanMax) * 100));

	const santriBaru = [
		{ name: 'Ahmad F', note: 'Program tahfidz', date: 'Hari ini' },
		{ name: 'Nabila R', note: 'Kelas diniyah', date: '1 hari lalu' },
		{ name: 'Rafi M', note: 'Masa orientasi', date: '2 hari lalu' }
	];

	const kegiatanMasjid = [
		{ title: 'Kajian Subuh', time: '05:10', day: 'Senin' },
		{ title: 'Majelis Taklim', time: '19:30', day: 'Rabu' },
		{ title: 'Kelas Tahsin', time: '20:00', day: 'Jumat' }
	];

	const saldoKas = 15250000;
	const saldoTrend = 6.4;

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value);
</script>

<svelte:head>
	<title>Dashboard | SantriOnline</title>
</svelte:head>

<div class="space-y-6">
	<section class="fade-in grid grid-cols-1 gap-6 lg:grid-cols-3" style="animation-delay: 40ms;">
		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Institution mode</p>
			<h2 class="app-title mt-2 text-2xl font-semibold text-slate-900">
				{isPesantren ? 'Pesantren Overview' : 'Masjid Overview'}
			</h2>
			<p class="mt-2 text-sm text-slate-600">
				Ringkasan cepat aktivitas harian untuk tim operasional.
			</p>
			<div class="mt-6 flex items-center gap-4">
				<div class="flex-1 rounded-2xl bg-teal-50 px-4 py-3">
					<p class="text-xs text-teal-700">Kunjungan hari ini</p>
					<p class="text-2xl font-semibold text-teal-900">128</p>
				</div>
				<div class="flex-1 rounded-2xl bg-amber-50 px-4 py-3">
					<p class="text-xs text-amber-700">Target mingguan</p>
					<p class="text-2xl font-semibold text-amber-900">87%</p>
				</div>
			</div>
		</div>

		<div class="rounded-3xl border border-white/80 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-xl">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Highlight</p>
			<h3 class="app-title mt-2 text-xl font-semibold text-slate-900">Agenda utama</h3>
			<p class="mt-2 text-sm text-slate-600">
				Pastikan tim siap untuk kegiatan terjadwal hari ini.
			</p>
			<div class="mt-4 rounded-2xl border border-teal-100 bg-white p-4">
				<p class="text-sm font-semibold text-slate-800">Koordinasi program sore</p>
				<p class="mt-1 text-xs text-slate-500">Pukul 15:30 - Ruang rapat utama</p>
			</div>
		</div>

		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Progress</p>
			<h3 class="app-title mt-2 text-xl font-semibold text-slate-900">Momentum pekanan</h3>
			<ul class="mt-4 space-y-3 text-sm text-slate-600">
				<li class="flex items-center justify-between">
					<span>Rencana kerja terselesaikan</span>
					<span class="font-semibold text-slate-900">24/32</span>
				</li>
				<li class="flex items-center justify-between">
					<span>Follow up jamaah</span>
					<span class="font-semibold text-slate-900">18/20</span>
				</li>
				<li class="flex items-center justify-between">
					<span>Evaluasi program</span>
					<span class="font-semibold text-slate-900">7/10</span>
				</li>
			</ul>
		</div>
	</section>

	{#if isPesantren}
		<section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur xl:col-span-2" style="animation-delay: 120ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Grafik Setoran Hafalan</h3>
					<span class="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">7 hari</span>
				</div>
				<div class="mt-6 flex h-44 items-end gap-3">
					{#each hafalanBars as height}
						<div class="flex-1">
							<div
								class="w-full rounded-2xl bg-gradient-to-t from-teal-600 via-cyan-500 to-emerald-400"
								style={`height: ${height}%`}
							></div>
						</div>
					{/each}
				</div>
				<p class="mt-4 text-xs text-slate-500">Data ini akan terhubung ke laporan hafalan terverifikasi.</p>
			</div>

			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 200ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Santri Baru</h3>
					<span class="text-xs text-slate-500">Minggu ini</span>
				</div>
				<ul class="mt-5 space-y-4">
					{#each santriBaru as santri}
						<li class="flex items-start justify-between">
							<div>
								<p class="text-sm font-semibold text-slate-900">{santri.name}</p>
								<p class="text-xs text-slate-500">{santri.note}</p>
							</div>
							<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{santri.date}</span>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{:else}
		<section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 120ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Saldo Kas Masjid</h3>
					<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Realtime</span>
				</div>
				<p class="mt-4 text-3xl font-semibold text-slate-900">{formatCurrency(saldoKas)}</p>
				<p class="mt-2 text-xs text-slate-500">Naik {saldoTrend}% dari pekan lalu</p>
				<div class="mt-6 grid grid-cols-2 gap-3 text-xs">
					<div class="rounded-2xl bg-emerald-50 px-4 py-3">
						<p class="text-emerald-700">Pemasukan</p>
						<p class="mt-1 text-lg font-semibold text-emerald-900">+8.2%</p>
					</div>
					<div class="rounded-2xl bg-rose-50 px-4 py-3">
						<p class="text-rose-700">Pengeluaran</p>
						<p class="mt-1 text-lg font-semibold text-rose-900">-3.1%</p>
					</div>
				</div>
			</div>

			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur xl:col-span-2" style="animation-delay: 200ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Jadwal Kegiatan</h3>
					<span class="text-xs text-slate-500">Pekan berjalan</span>
				</div>
				<div class="mt-5 space-y-4">
					{#each kegiatanMasjid as item}
						<div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
							<div>
								<p class="text-sm font-semibold text-slate-900">{item.title}</p>
								<p class="text-xs text-slate-500">{item.day}</p>
							</div>
							<span class="text-sm font-semibold text-slate-700">{item.time}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>
