<script lang="ts">
	import type { PageData } from './$types';
	import { SURAH_DATA } from '$lib/surah-data';

	export let data: PageData;

	const alerts = data.alerts ?? [];
	const summary = data.summary ?? { merah: 0, kuning: 0, pending: 0, total: 0 };
	const isEmpty = alerts.length === 0;
	const workflowLink = data.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat';

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
		belum: 'Belum'
	} as const;

	const qualityTones = {
		lancar: 'badge-success',
		cukup: 'badge-warning',
		belum: 'badge-error'
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

	const statusLabel = (status: string) => statusLabels[status as keyof typeof statusLabels] ?? status;
	const statusTone = (status: string) => statusTones[status as keyof typeof statusTones] ?? 'badge-ghost';
	const qualityLabel = (quality: string) => qualityLabels[quality as keyof typeof qualityLabels] ?? quality;
	const qualityTone = (quality: string) => qualityTones[quality as keyof typeof qualityTones] ?? 'badge-ghost';

	const resolvePriority = (row: (typeof alerts)[number]) => {
		if (row.status === 'submitted') {
			return { label: 'Pending', tone: 'badge-warning' };
		}
		if (row.status === 'rejected' || (row.status === 'approved' && row.quality === 'belum')) {
			return { label: 'Merah', tone: 'badge-error' };
		}
		if (row.status === 'approved' && row.quality === 'cukup') {
			return { label: 'Kuning', tone: 'badge-warning' };
		}
		return { label: 'Info', tone: 'badge-ghost' };
	};
</script>

<svelte:head>
	<title>Hafalan Belum Lancar</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-3xl border bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 p-6 text-white shadow-xl">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs uppercase tracking-[0.25em] text-white/80">Monitoring Hafalan</p>
				<h1 class="mt-2 text-2xl font-semibold">Hafalan Belum Lancar</h1>
				<p class="mt-1 text-sm text-white/90">
					Data sinkron dari workflow TPQ Setoran, Review, dan Riwayat.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
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
			</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="grid gap-3 md:grid-cols-4">
			<div class="rounded-xl border border-rose-200 bg-rose-50 p-3">
				<p class="text-xs uppercase tracking-wide text-rose-700">Merah</p>
				<p class="mt-2 text-2xl font-semibold text-rose-700">{summary.merah}</p>
				<p class="text-xs text-rose-700/80">Rejected atau approved kualitas belum.</p>
			</div>
			<div class="rounded-xl border border-amber-200 bg-amber-50 p-3">
				<p class="text-xs uppercase tracking-wide text-amber-700">Kuning</p>
				<p class="mt-2 text-2xl font-semibold text-amber-700">{summary.kuning}</p>
				<p class="text-xs text-amber-700/80">Approved dengan kualitas cukup.</p>
			</div>
			<div class="rounded-xl border border-slate-300 bg-slate-50 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-700">Pending</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.pending}</p>
				<p class="text-xs text-slate-600">Masih menunggu review.</p>
			</div>
			<div class="rounded-xl border bg-white p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Total Alert</p>
				<p class="mt-2 text-2xl font-semibold text-slate-900">{summary.total}</p>
				<p class="text-xs text-slate-500">Dalam scope akses Anda.</p>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-white shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Daftar Hafalan Perlu Perhatian</h2>
				<p class="text-sm text-slate-500">Prioritaskan pending lalu merah sebelum masuk setoran baru.</p>
			</div>
			<a href={workflowLink} class="btn btn-sm btn-warning">Buka Workflow</a>
		</div>

		{#if isEmpty}
			<div class="px-4 py-8 text-sm text-slate-500">Tidak ada hafalan bermasalah pada scope saat ini.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Santri</th>
							<th>Surah</th>
							<th>Ayat</th>
							<th>Status</th>
							<th>Kualitas</th>
							<th>Prioritas</th>
							<th>Catatan</th>
						</tr>
					</thead>
					<tbody>
						{#each alerts as row}
							<tr>
								<td>{formatDate(row.date)}</td>
								<td>
									<div class="space-y-0.5">
										<p class="font-medium text-slate-900">{row.santriName || '-'}</p>
										<p class="text-[11px] text-slate-500">Ustadz: {row.ustadzName || '-'}</p>
									</div>
								</td>
								<td>{row.surah} • {getSurahName(row.surah)}</td>
								<td>{row.ayatFrom}-{row.ayatTo}</td>
								<td><span class="badge {statusTone(row.status)}">{statusLabel(row.status)}</span></td>
								<td><span class="badge {qualityTone(row.quality)}">{qualityLabel(row.quality)}</span></td>
								<td><span class="badge {resolvePriority(row).tone}">{resolvePriority(row).label}</span></td>
								<td class="max-w-xs truncate" title={row.notes || ''}>{row.notes || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
