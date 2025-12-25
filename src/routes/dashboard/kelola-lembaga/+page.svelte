<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	type OrgRow = {
		id: string;
		name: string;
		slug: string;
		status: string;
		type?: string;
		contactPhone?: string | null;
		city?: string | null;
		createdAt?: number | null;
	};

	const orgs = (data.orgs ?? []) as OrgRow[];
	const pending = orgs.filter((o) => o.status === 'pending');
	const active = orgs.filter((o) => o.status === 'active');
	const rejected = orgs.filter((o) => o.status === 'rejected');

	const formatOrgType = (value?: string) => {
		if (!value) return '-';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return value.charAt(0).toUpperCase() + value.slice(1);
	};

	const formatDate = (value?: number | null) => {
		if (!value) return '-';
		const date = new Date(value);
		return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const statusLabel = (value?: string) => {
		if (value === 'active') return 'Aktif';
		if (value === 'pending') return 'Menunggu';
		if (value === 'rejected') return 'Ditolak';
		return value || '-';
	};

	const statusBadgeClass = (value?: string) => {
		if (value === 'active') return 'badge-success';
		if (value === 'pending') return 'badge-warning';
		if (value === 'rejected') return 'badge-error';
		return 'badge-ghost';
	};

	const confirmAction = (message: string) => (event: Event) => {
		if (!confirm(message)) event.preventDefault();
	};
</script>

<svelte:head>
	<title>Kelola Lembaga</title>
</svelte:head>

<section class="space-y-6">
	<header class="rounded-3xl border bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
		<h1 class="text-3xl font-bold">Kelola Lembaga</h1>
		<p class="text-sm text-white/90">Setujui, tolak, atau hapus lembaga yang terdaftar.</p>
	</header>

	<div class="grid gap-4 md:grid-cols-4">
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-amber-600">{pending.length}</div>
			<div class="text-sm text-slate-600">Menunggu Approval</div>
		</div>
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-emerald-600">{active.length}</div>
			<div class="text-sm text-slate-600">Lembaga Aktif</div>
		</div>
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-red-600">{rejected.length}</div>
			<div class="text-sm text-slate-600">Lembaga Ditolak</div>
		</div>
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-slate-900">{orgs.length}</div>
			<div class="text-sm text-slate-600">Total Lembaga</div>
		</div>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-slate-800">Daftar Lembaga</h2>
			<span class="text-xs text-slate-500">Total {orgs.length}</span>
		</div>
		{#if orgs.length === 0}
			<p class="text-sm text-slate-500">Belum ada lembaga yang terdaftar.</p>
		{:else}
			<div class="overflow-x-auto rounded-xl border">
				<table class="table table-zebra">
					<thead>
						<tr class="bg-slate-50">
							<th>Nama</th>
							<th>Jenis</th>
							<th>Slug</th>
							<th>Kota</th>
							<th>Kontak</th>
							<th>Status</th>
							<th>Terdaftar</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each orgs as org}
							<tr>
								<td class="font-medium">{org.name}</td>
								<td class="text-slate-600">{formatOrgType(org.type)}</td>
								<td class="text-slate-600">{org.slug}</td>
								<td class="text-slate-600">{org.city || '-'}</td>
								<td class="text-slate-600">{org.contactPhone || '-'}</td>
								<td>
									<span class="badge {statusBadgeClass(org.status)}">{statusLabel(org.status)}</span>
								</td>
								<td class="text-slate-600">{formatDate(org.createdAt)}</td>
								<td>
									<form method="POST" use:enhance class="flex flex-wrap gap-2">
										<input type="hidden" name="orgId" value={org.id} />
										{#if org.status === 'pending'}
											<button class="btn btn-xs btn-success text-white" formaction="?/approve">
												Setujui
											</button>
											<button
												class="btn btn-xs btn-warning text-white"
												formaction="?/reject"
												on:click={confirmAction('Tolak lembaga ini?')}
											>
												Tolak
											</button>
										{/if}
										<button
											class="btn btn-xs btn-error text-white"
											formaction="?/remove"
											on:click={confirmAction('Hapus lembaga ini beserta data terkait?')}
										>
											Hapus
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>
