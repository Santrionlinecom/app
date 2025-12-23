<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const orgs = data.orgs ?? [];
	const pending = orgs.filter((o: any) => o.status === 'pending');
	const active = orgs.filter((o: any) => o.status === 'active');

	const formatOrgType = (value?: string) => {
		if (!value) return '-';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return value.charAt(0).toUpperCase() + value.slice(1);
	};
</script>

<svelte:head>
	<title>Kelola Lembaga</title>
</svelte:head>

<section class="space-y-6">
	<header class="rounded-3xl border bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
		<h1 class="text-3xl font-bold">Kelola Lembaga</h1>
		<p class="text-sm text-white/90">Approve lembaga yang mendaftar.</p>
	</header>

	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-amber-600">{pending.length}</div>
			<div class="text-sm text-slate-600">Menunggu Approval</div>
		</div>
		<div class="rounded-2xl border bg-white p-5 shadow-sm">
			<div class="text-2xl font-bold text-emerald-600">{active.length}</div>
			<div class="text-sm text-slate-600">Lembaga Aktif</div>
		</div>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-800 mb-4">Menunggu Approval</h2>
		{#if pending.length === 0}
			<p class="text-sm text-slate-500">Tidak ada lembaga yang menunggu.</p>
		{:else}
			<div class="overflow-x-auto rounded-xl border">
				<table class="table table-zebra">
					<thead>
						<tr class="bg-slate-50">
							<th>Nama</th>
							<th>Jenis</th>
							<th>Slug</th>
							<th>Kontak</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each pending as org}
							<tr>
								<td class="font-medium">{org.name}</td>
								<td class="text-slate-600">{formatOrgType(org.type)}</td>
								<td class="text-slate-600">{org.slug}</td>
								<td class="text-slate-600">{org.contactPhone || '-'}</td>
								<td>
									<form method="POST" use:enhance>
										<input type="hidden" name="orgId" value={org.id} />
										<button class="btn btn-xs btn-success text-white" formaction="?/approve">
											Setujui
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

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-800 mb-4">Lembaga Aktif</h2>
		{#if active.length === 0}
			<p class="text-sm text-slate-500">Belum ada lembaga aktif.</p>
		{:else}
			<div class="grid gap-3 md:grid-cols-2">
				{#each active as org}
					<div class="rounded-xl border p-4">
						<div class="font-semibold text-slate-900">{org.name}</div>
						<div class="text-sm text-slate-600">{formatOrgType(org.type)} • {org.slug}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
