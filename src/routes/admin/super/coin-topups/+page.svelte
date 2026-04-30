<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '-';
		return new Date(value).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pending':
				return 'Menunggu';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'bg-amber-100 text-amber-700';
			case 'approved':
				return 'bg-emerald-100 text-emerald-700';
			case 'rejected':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-slate-100 text-slate-700';
		}
	};

	$: requests = data.requests ?? [];
	$: currentStatus = data.currentStatus;
	$: counts = data.counts;
</script>

<svelte:head>
	<title>Kelola Topup Koin - Admin SantriOnline</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<!-- Header -->
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin Super</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Kelola Topup Koin</h1>
				<p class="mt-1 text-sm text-slate-500">Verifikasi dan proses request topup koin user.</p>
			</div>
			<a href="/admin/super" class="btn btn-outline">← Kembali</a>
		</div>
	</section>

	<!-- Status Tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		<a
			href="/admin/super/coin-topups?status=pending"
			class="btn btn-sm {currentStatus === 'pending' ? 'btn-primary' : 'btn-outline'}"
		>
			Menunggu ({counts.pending})
		</a>
		<a
			href="/admin/super/coin-topups?status=approved"
			class="btn btn-sm {currentStatus === 'approved' ? 'btn-primary' : 'btn-outline'}"
		>
			Disetujui ({counts.approved})
		</a>
		<a
			href="/admin/super/coin-topups?status=rejected"
			class="btn btn-sm {currentStatus === 'rejected' ? 'btn-primary' : 'btn-outline'}"
		>
			Ditolak ({counts.rejected})
		</a>
	</div>

	<!-- Table -->
	{#if requests.length === 0}
		<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
			<p class="text-base font-semibold text-slate-900">Tidak ada request topup.</p>
			<p class="mt-2 text-sm text-slate-500">Request topup dengan status "{currentStatus}" belum ada.</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
			<table class="w-full min-w-[600px] text-left">
				<thead class="border-b border-slate-100 bg-slate-50">
					<tr>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each requests as req}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-4">
								<p class="font-medium text-slate-900">{req.userName ?? 'Unknown'}</p>
								<p class="text-sm text-slate-500">{req.userEmail ?? '-'}</p>
							</td>
							<td class="px-4 py-4">
								<p class="font-semibold text-slate-900">{req.coinAmount.toLocaleString('id-ID')} koin</p>
								<p class="text-sm text-slate-500">{formatRupiah(req.amountRupiah)}</p>
								{#if req.userNote}
									<p class="mt-1 text-xs text-slate-400 truncate max-w-[200px]" title={req.userNote}>
										{req.userNote}
									</p>
								{/if}
							</td>
							<td class="px-4 py-4">
								<span class="rounded-full px-3 py-1 text-xs font-medium {getStatusColor(req.status)}">
									{getStatusLabel(req.status)}
								</span>
							</td>
							<td class="px-4 py-4 text-sm text-slate-500">
								{formatDate(req.createdAt)}
							</td>
							<td class="px-4 py-4">
								<a href="/admin/super/coin-topups/{req.id}" class="btn btn-sm btn-outline">
									Lihat
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>