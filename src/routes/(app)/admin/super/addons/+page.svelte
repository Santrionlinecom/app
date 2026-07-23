<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;

	const addonLabels: Record<string, string> = {
		lembaga_tambahan: 'Lembaga Tambahan',
		modul_masjid: 'Modul Masjid',
		modul_tahfidz: 'Modul Rumah Tahfidz',
		modul_musholla: 'Modul Musholla',
		santri_unlimited: 'Santri Unlimited',
		raport_premium: 'Raport PDF Premium'
	};

	const statusLabels: Record<string, string> = {
		trial: 'Menunggu',
		aktif: 'Disetujui',
		expired: 'Ditolak/Nonaktif'
	};

	const statusClasses: Record<string, string> = {
		trial: 'border-amber-200 bg-amber-50 text-amber-700',
		aktif: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		expired: 'border-red-200 bg-red-50 text-red-700'
	};

	const formatAddon = (value: string) => addonLabels[value] ?? value.replace(/_/g, ' ');
	const formatStatus = (value: string) => statusLabels[value] ?? value;
	const getStatusClass = (value: string) => statusClasses[value] ?? 'border-slate-200 bg-slate-50 text-slate-700';

	const formatDate = (value: number | string | null | undefined) => {
		if (!value) return '-';
		const numeric = typeof value === 'number' ? value : Number(value);
		const timestamp = Number.isFinite(numeric) ? numeric : Date.parse(String(value));
		if (!Number.isFinite(timestamp)) return '-';
		const ms = timestamp < 100000000000 ? timestamp * 1000 : timestamp;
		return new Date(ms).toLocaleString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const successMessage = (value: string | null | undefined) => {
		if (value === 'approved') return 'Addon berhasil disetujui dan sudah aktif.';
		if (value === 'rejected') return 'Request addon berhasil ditolak.';
		if (value === 'deactivated' || value === 'revoked') {
			return 'Addon aktif berhasil dinonaktifkan.';
		}
		if (value === 'reactivated') return 'Addon berhasil diaktifkan ulang.';
		return null;
	};

	$: requests = data.requests ?? [];
	$: counts = data.counts;
	$: currentStatus = data.currentStatus;
	$: success = successMessage(data.success);
	$: q = ((data as PageData & { q?: string }).q ?? '');
</script>

<svelte:head>
	<title>Approval Addon - Super Admin SantriOnline</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Super Admin</p>
				<h1 class="mt-2 text-2xl font-bold text-slate-900">Approval Addon</h1>
				<p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
					Setujui, tolak, atau nonaktifkan request addon lembaga. Request user disimpan sebagai status
					<strong>trial</strong> sampai disetujui.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a href="/admin/super/overview" class="btn btn-outline">← Overview</a>
				<a href="/addon" class="btn btn-outline">Lihat halaman user</a>
			</div>
		</div>
	</section>

	{#if success}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
			{success}
		</div>
	{/if}

	<form method="GET" class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
		<input type="hidden" name="status" value={currentStatus} />
		<input
			type="search"
			name="q"
			value={q}
			placeholder="Cari lembaga, slug, email admin, atau tipe addon..."
			class="input input-bordered w-full"
		/>
		<button type="submit" class="btn btn-primary">Cari</button>
	</form>

	<div class="flex w-fit max-w-full gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
		<a
			href={`/admin/super/addons?status=pending${q ? `&q=${encodeURIComponent(q)}` : ''}`}
			class="btn btn-sm {currentStatus === 'pending' ? 'btn-primary' : 'btn-outline'}"
		>
			Menunggu ({counts.pending})
		</a>
		<a
			href={`/admin/super/addons?status=active${q ? `&q=${encodeURIComponent(q)}` : ''}`}
			class="btn btn-sm {currentStatus === 'active' ? 'btn-primary' : 'btn-outline'}"
		>
			Disetujui ({counts.active})
		</a>
		<a
			href={`/admin/super/addons?status=rejected${q ? `&q=${encodeURIComponent(q)}` : ''}`}
			class="btn btn-sm {currentStatus === 'rejected' ? 'btn-primary' : 'btn-outline'}"
		>
			Ditolak/Nonaktif ({counts.rejected})
		</a>
		<a
			href={`/admin/super/addons?status=all${q ? `&q=${encodeURIComponent(q)}` : ''}`}
			class="btn btn-sm {currentStatus === 'all' ? 'btn-primary' : 'btn-outline'}"
		>
			Semua ({counts.all})
		</a>
	</div>

	{#if requests.length === 0}
		<div class="flex min-h-48 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
			<p class="text-base font-semibold text-slate-900">Belum ada request addon.</p>
			<p class="mt-2 text-sm text-slate-500">Tidak ada data addon pada filter ini.</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
			<table class="w-full min-w-[860px] text-left">
				<thead class="border-b border-slate-100 bg-slate-50">
					<tr>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Lembaga</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Addon</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Lembaga</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each requests as req}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-4">
								<p class="font-semibold text-slate-900">{req.lembagaName ?? 'Lembaga tidak ditemukan'}</p>
								<p class="text-xs text-slate-500">{req.lembagaType ?? '-'} · {req.lembagaSlug ?? req.lembagaId}</p>
							</td>
							<td class="px-4 py-4">
								<p class="font-semibold text-slate-900">{formatAddon(req.tipeAddon)}</p>
								<p class="text-xs text-slate-500">{req.tipeAddon}</p>
							</td>
							<td class="px-4 py-4">
								<p class="font-medium text-slate-900">{req.adminName ?? '-'}</p>
								<p class="text-xs text-slate-500">{req.adminEmail ?? '-'}</p>
							</td>
							<td class="px-4 py-4">
								<span class="inline-flex rounded-full border px-3 py-1 text-xs font-bold {getStatusClass(req.status)}">
									{formatStatus(req.status)}
								</span>
							</td>
							<td class="px-4 py-4 text-sm text-slate-500">
								{formatDate(req.createdAt)}
							</td>
							<td class="px-4 py-4">
								{#if req.status === 'trial'}
									<div class="flex flex-col gap-2 sm:flex-row">
										<form method="POST" action="?/approve" use:enhance>
											<input type="hidden" name="id" value={req.id} />
											<button type="submit" class="btn btn-sm btn-primary">Setujui</button>
										</form>
										<form method="POST" action="?/reject" use:enhance>
											<input type="hidden" name="id" value={req.id} />
											<button type="submit" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">Tolak</button>
										</form>
									</div>
								{:else if req.status === 'aktif'}
									<form method="POST" action="?/revoke" use:enhance>
										<input type="hidden" name="id" value={req.id} />
										<button type="submit" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">Nonaktifkan</button>
									</form>
								{:else if req.status === 'expired'}
									<form method="POST" action="?/reactivate" use:enhance>
										<input type="hidden" name="id" value={req.id} />
										<button type="submit" class="btn btn-sm btn-primary">Aktifkan ulang</button>
									</form>
								{:else}
									<span class="text-sm text-slate-400">Tidak ada aksi</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
