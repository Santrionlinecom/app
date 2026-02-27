<script lang="ts">
	import type { PageData } from './$types';
	import { SURAH_DATA } from '$lib/surah-data';

	export let data: PageData;

	let activeTab: 'resmi' | 'mandiri' = 'resmi';
	const isStudent = data.roleScope === 'student';
	if (!isStudent) activeTab = 'resmi';

	const statusLabels = {
		submitted: 'Menunggu Review',
		approved: 'Disetujui',
		rejected: 'Perlu Perbaikan'
	} as const;

	const statusTones = {
		submitted: 'badge-warning',
		approved: 'badge-success',
		rejected: 'badge-error'
	} as const;

	const qualityLabels = {
		lancar: 'Lancar',
		cukup: 'Cukup',
		belum: 'Belum',
		kurang_lancar: 'Kurang Lancar',
		belum_lancar: 'Belum Lancar'
	} as const;

	const qualityTones = {
		lancar: 'badge-success',
		cukup: 'badge-warning',
		belum: 'badge-error',
		kurang_lancar: 'badge-warning',
		belum_lancar: 'badge-error'
	} as const;

	const getSurahName = (value: string | number) => {
		const surahNumber = Number.parseInt(String(value), 10);
		if (!Number.isFinite(surahNumber)) return `Surah ${value}`;
		return SURAH_DATA.find((surah) => surah.number === surahNumber)?.name ?? `Surah ${surahNumber}`;
	};

	const formatDate = (value: string | number | null | undefined) => {
		if (!value) return '-';
		const date = typeof value === 'number' ? new Date(value) : new Date(`${value}`);
		if (Number.isNaN(date.getTime())) return '-';
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const statusLabel = (status: string) =>
		statusLabels[status as keyof typeof statusLabels] ?? status;

	const statusTone = (status: string) =>
		statusTones[status as keyof typeof statusTones] ?? 'badge-ghost';

	const qualityLabel = (quality: string) =>
		qualityLabels[quality as keyof typeof qualityLabels] ?? quality;

	const qualityTone = (quality: string) =>
		qualityTones[quality as keyof typeof qualityTones] ?? 'badge-ghost';

	const attentionSummary = data.attentionRows.reduce(
		(acc, row) => {
			if (row.status === 'submitted') acc.submitted += 1;
			else if (row.status === 'rejected') acc.rejected += 1;
			else acc.needsPractice += 1;
			return acc;
		},
		{ submitted: 0, rejected: 0, needsPractice: 0 }
	);

	const totalAyahQuran = 6236;
	const officialProgressPercent = totalAyahQuran
		? Math.min(100, Math.round((data.official.quality.totalAyat / totalAyahQuran) * 10000) / 100)
		: 0;

	const studentAggregate = data.studentProgress.reduce(
		(acc, row) => {
			acc.students += 1;
			acc.approvedAyah += Number(row.approvedAyah ?? 0);
			acc.percentage += Number(row.percentage ?? 0);
			return acc;
		},
		{ students: 0, approvedAyah: 0, percentage: 0 }
	);

	const averageStudentPercentage = studentAggregate.students
		? Math.round((studentAggregate.percentage / studentAggregate.students) * 100) / 100
		: 0;

	const topStudents = data.studentProgress.slice(0, 20);
	const workflowLink = data.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat';
</script>

<svelte:head>
	<title>Pencapaian Hafalan</title>
</svelte:head>

<div class="space-y-6">
	<section class="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-xl">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Akademik TPQ</p>
				<h1 class="mt-2 text-2xl font-semibold">Pencapaian Hafalan</h1>
				<p class="mt-2 text-sm text-emerald-50">
					Sinkron dengan Setoran, Review, dan Riwayat agar progres hafalan selalu relevan.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<a href="/dashboard" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Dashboard</a>
				{#if data.canInputSetoran}
					<a href="/tpq/akademik/setoran" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Setoran</a>
				{/if}
				{#if data.canReviewSetoran}
					<a href="/tpq/akademik/review" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Review</a>
				{/if}
				{#if data.canViewSetoranHistory}
					<a href="/tpq/akademik/riwayat" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Riwayat</a>
				{/if}
				{#if isStudent}
					<a href="/dashboard/hafalan-mandiri" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Muroja'ah</a>
				{/if}
				<a href="/dashboard/hafalan-belum-lancar" class="btn btn-sm border-white/30 bg-white/15 text-white hover:bg-white/25">Belum Lancar</a>
			</div>
		</div>
	</section>

	{#if isStudent}
		<div class="tabs tabs-boxed w-fit bg-base-200 p-1">
			<button class="tab {activeTab === 'resmi' ? 'tab-active' : ''}" on:click={() => (activeTab = 'resmi')}>
				Setoran Resmi
			</button>
			<button class="tab {activeTab === 'mandiri' ? 'tab-active' : ''}" on:click={() => (activeTab = 'mandiri')}>
				Muroja'ah Mandiri
			</button>
		</div>
	{/if}

	{#if activeTab === 'resmi'}
		<section class="space-y-6">
			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-slate-500">Setoran Hari Ini</p>
					<p class="mt-2 text-2xl font-semibold text-slate-900">{data.summaries.today.total}</p>
				</div>
				<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-amber-700">Menunggu Review</p>
					<p class="mt-2 text-2xl font-semibold text-amber-700">{data.summaries.today.submitted}</p>
				</div>
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-emerald-700">Disetujui Hari Ini</p>
					<p class="mt-2 text-2xl font-semibold text-emerald-700">{data.summaries.today.approved}</p>
				</div>
				<div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-rose-700">Perlu Perbaikan</p>
					<p class="mt-2 text-2xl font-semibold text-rose-700">{data.summaries.today.rejected}</p>
				</div>
			</div>

			{#if isStudent}
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-2xl border bg-white p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-slate-500">Total Ayat Approved</p>
						<p class="mt-2 text-2xl font-semibold text-slate-900">{data.official.quality.totalAyat}</p>
					</div>
					<div class="rounded-2xl border bg-white p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-slate-500">Progress Al-Qur'an</p>
						<p class="mt-2 text-2xl font-semibold text-slate-900">{officialProgressPercent}%</p>
					</div>
					<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-emerald-700">Kualitas Lancar</p>
						<p class="mt-2 text-2xl font-semibold text-emerald-700">{data.official.quality.lancar}</p>
					</div>
					<div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-rose-700">Perlu Penguatan</p>
						<p class="mt-2 text-2xl font-semibold text-rose-700">{data.official.quality.belum}</p>
					</div>
				</div>

				<div class="rounded-2xl border bg-white shadow-sm">
					<div class="border-b px-4 py-3">
						<h2 class="text-base font-semibold text-slate-900">Progress Resmi per Surah</h2>
						<p class="text-sm text-slate-500">Data berasal dari hafalan yang sudah di-approve reviewer.</p>
					</div>
					{#if data.official.bySurah.length === 0}
						<div class="px-4 py-8 text-sm text-slate-500">Belum ada ayat approved. Mulai dari menu Setoran.</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="table table-zebra">
								<thead>
									<tr>
										<th>Surah</th>
										<th class="text-right">Total Ayat</th>
										<th class="text-right">Lancar</th>
										<th class="text-right">Cukup</th>
										<th class="text-right">Belum</th>
									</tr>
								</thead>
								<tbody>
									{#each data.official.bySurah as row}
										<tr>
											<td class="font-medium">{row.surahNumber}. {getSurahName(row.surahNumber)}</td>
											<td class="text-right">{row.totalAyat ?? 0}</td>
											<td class="text-right text-emerald-700">{row.lancar ?? 0}</td>
											<td class="text-right text-amber-700">{row.cukup ?? 0}</td>
											<td class="text-right text-rose-700">{row.belum ?? 0}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{:else}
				<div class="grid gap-3 md:grid-cols-3">
					<div class="rounded-2xl border bg-white p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-slate-500">Jumlah Santri Scope</p>
						<p class="mt-2 text-2xl font-semibold text-slate-900">{studentAggregate.students}</p>
					</div>
					<div class="rounded-2xl border bg-white p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-slate-500">Total Ayat Approved</p>
						<p class="mt-2 text-2xl font-semibold text-slate-900">{studentAggregate.approvedAyah}</p>
					</div>
					<div class="rounded-2xl border bg-white p-4 shadow-sm">
						<p class="text-xs uppercase tracking-wide text-slate-500">Rata-rata Progress</p>
						<p class="mt-2 text-2xl font-semibold text-slate-900">{averageStudentPercentage}%</p>
					</div>
				</div>

				<div class="rounded-2xl border bg-white shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
						<div>
							<h2 class="text-base font-semibold text-slate-900">Progress Santri</h2>
							<p class="text-sm text-slate-500">Sinkron dengan data yang tampil di dashboard utama.</p>
						</div>
						<a href="/dashboard/kelola-santri" class="btn btn-sm btn-outline">Kelola Santri</a>
					</div>
					{#if topStudents.length === 0}
						<div class="px-4 py-8 text-sm text-slate-500">Belum ada data progress santri.</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="table table-zebra">
								<thead>
									<tr>
										<th>Santri</th>
										<th class="text-right">Ayat Approved</th>
										<th class="text-right">Progress</th>
									</tr>
								</thead>
								<tbody>
									{#each topStudents as row}
										<tr>
											<td class="font-medium">{row.username || row.email}</td>
											<td class="text-right">{row.approvedAyah}</td>
											<td class="text-right">{Math.round(row.percentage * 100) / 100}%</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}

			<div class="rounded-2xl border bg-white shadow-sm">
				<div class="border-b px-4 py-3">
					<h2 class="text-base font-semibold text-slate-900">Setoran Terbaru</h2>
					<p class="text-sm text-slate-500">Data ini selaras dengan halaman Riwayat Setoran.</p>
				</div>
				{#if data.recentSetoran.length === 0}
					<div class="px-4 py-8 text-sm text-slate-500">Belum ada data setoran.</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="table table-zebra">
							<thead>
								<tr>
									<th>Tanggal</th>
									<th>Santri</th>
									<th>Surah</th>
									<th>Ayat</th>
									<th>Kualitas</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each data.recentSetoran as row}
									<tr>
										<td>{formatDate(row.date)}</td>
										<td>{row.santriName || '-'}</td>
										<td>{row.surah} • {getSurahName(row.surah)}</td>
										<td>{row.ayatFrom}-{row.ayatTo}</td>
										<td><span class="badge {qualityTone(row.quality)}">{qualityLabel(row.quality)}</span></td>
										<td><span class="badge {statusTone(row.status)}">{statusLabel(row.status)}</span></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="text-base font-semibold text-amber-900">Perlu Tindak Lanjut</h2>
						<p class="text-sm text-amber-800">Submitted, rejected, atau kualitas belum untuk dipantau lanjutan.</p>
					</div>
					<a href={workflowLink} class="btn btn-sm btn-warning">Buka Workflow</a>
				</div>
				<div class="mt-3 grid gap-3 md:grid-cols-3">
					<div class="rounded-xl border border-amber-200 bg-white p-3">
						<p class="text-xs uppercase tracking-wide text-slate-500">Menunggu</p>
						<p class="mt-2 text-xl font-semibold text-amber-700">{attentionSummary.submitted}</p>
					</div>
					<div class="rounded-xl border border-rose-200 bg-white p-3">
						<p class="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
						<p class="mt-2 text-xl font-semibold text-rose-700">{attentionSummary.rejected}</p>
					</div>
					<div class="rounded-xl border border-orange-200 bg-white p-3">
						<p class="text-xs uppercase tracking-wide text-slate-500">Approved Belum</p>
						<p class="mt-2 text-xl font-semibold text-orange-700">{attentionSummary.needsPractice}</p>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<section class="space-y-4">
			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-slate-500">Total Muroja'ah</p>
					<p class="mt-2 text-2xl font-semibold text-slate-900">{data.murojaStats.totalMuroja}</p>
				</div>
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-emerald-700">Lancar</p>
					<p class="mt-2 text-2xl font-semibold text-emerald-700">{data.murojaStats.lancar}</p>
				</div>
				<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-amber-700">Kurang Lancar</p>
					<p class="mt-2 text-2xl font-semibold text-amber-700">{data.murojaStats.kurangLancar}</p>
				</div>
				<div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
					<p class="text-xs uppercase tracking-wide text-rose-700">Belum Lancar</p>
					<p class="mt-2 text-2xl font-semibold text-rose-700">{data.murojaStats.belumLancar}</p>
				</div>
			</div>

			<div class="rounded-2xl border bg-white shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
					<div>
						<h2 class="text-base font-semibold text-slate-900">Muroja'ah per Surah</h2>
						<p class="text-sm text-slate-500">Data pribadi, sinkron dengan halaman Hafalan Mandiri.</p>
					</div>
					<a href="/dashboard/hafalan-mandiri" class="btn btn-sm btn-primary">Tambah Muroja'ah</a>
				</div>
				{#if data.murojaPerSurah.length === 0}
					<div class="px-4 py-8 text-sm text-slate-500">Belum ada riwayat muroja'ah mandiri.</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="table table-zebra">
							<thead>
								<tr>
									<th>Surah</th>
									<th class="text-right">Total Muroja'ah</th>
									<th class="text-right">Terakhir</th>
								</tr>
							</thead>
							<tbody>
								{#each data.murojaPerSurah as row}
									<tr>
										<td class="font-medium">{row.surahNumber}. {getSurahName(row.surahNumber)}</td>
										<td class="text-right">{row.totalMuroja}x</td>
										<td class="text-right">{formatDate(row.lastMuroja)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>
