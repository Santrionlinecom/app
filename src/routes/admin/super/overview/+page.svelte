<script lang="ts">
	export let data;

	const orgTypeLabel: Record<string, string> = {
		pondok: 'Pondok',
		masjid: 'Masjid',
		musholla: 'Musholla',
		tpq: 'TPQ',
		'rumah-tahfidz': 'Rumah Tahfidz'
	};

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatDate = (value?: number | null) =>
		value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
	const toPercent = (signups: number, clicks: number) => {
		if (!clicks) return '0%';
		const rate = (signups / clicks) * 100;
		return `${rate.toFixed(1)}%`;
	};
</script>

<svelte:head>
	<title>Super Admin Overview</title>
</svelte:head>

<div class="space-y-8">
	<header class="rounded-3xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
		<div class="flex items-center justify-between gap-6">
			<div>
				<p class="text-xs uppercase tracking-[0.3em] text-white/60">Super Admin</p>
				<h1 class="mt-2 text-3xl font-bold">Global Overview</h1>
				<p class="mt-1 text-sm text-white/80">Monitoring seluruh lembaga, user, dan aktivitas sistem.</p>
			</div>
			<div class="hidden md:block text-6xl opacity-20">[SYS]</div>
		</div>
	</header>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total Lembaga</p>
			<p class="mt-2 text-3xl font-bold text-slate-900">{formatNumber(data.stats.totalInstitutions)}</p>
			<p class="text-xs text-slate-500">Seluruh lembaga terdaftar</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total User</p>
			<p class="mt-2 text-3xl font-bold text-emerald-600">{formatNumber(data.stats.totalUsers)}</p>
			<p class="text-xs text-slate-500">Gabungan semua lembaga</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total Transaksi Sistem</p>
			<p class="mt-2 text-3xl font-bold text-blue-600">{formatNumber(data.stats.totalTransactions)}</p>
			<p class="text-xs text-slate-500">Kas + zakat + qurban + transaksi</p>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Top Institutions (Anggota Terbanyak)</h2>
			<p class="text-xs text-slate-500">Peringkat berdasarkan jumlah santri/jamaah.</p>
			{#if data.topInstitutions.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada data lembaga.</p>
			{:else}
				<div class="mt-4 overflow-auto">
					<table class="table table-zebra w-full text-sm">
						<thead>
							<tr>
								<th>Nama</th>
								<th>Tipe</th>
								<th>Anggota</th>
							</tr>
						</thead>
						<tbody>
							{#each data.topInstitutions as org}
								<tr>
									<td class="font-medium text-slate-900">{org.name}</td>
									<td>{orgTypeLabel[org.type] ?? org.type}</td>
									<td class="text-right font-semibold">{formatNumber(org.totalMembers)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Traffic Source (Conversion Rate)</h2>
			<p class="text-xs text-slate-500">Klik link pendaftaran vs anggota baru.</p>
			{#if data.trafficSources.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada data trafik.</p>
			{:else}
				<div class="mt-4 overflow-auto">
					<table class="table table-zebra w-full text-sm">
						<thead>
							<tr>
								<th>Lembaga</th>
								<th>Clicks</th>
								<th>Signups</th>
								<th>Conversion</th>
							</tr>
						</thead>
						<tbody>
							{#each data.trafficSources as row}
								<tr>
									<td class="font-medium text-slate-900">{row.name}</td>
									<td class="text-right">{formatNumber(row.clicks)}</td>
									<td class="text-right">{formatNumber(row.signups)}</td>
									<td class="text-right font-semibold">{toPercent(row.signups || 0, row.clicks || 0)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Global User Search</h2>
				<p class="text-xs text-slate-500">Cari user berdasarkan nama atau email di seluruh database.</p>
			</div>
			<form method="GET" class="flex w-full max-w-md gap-2">
				<input
					type="text"
					name="q"
					value={data.searchQuery}
					placeholder="Cari nama atau email..."
					class="input input-bordered w-full"
				/>
				<button class="btn btn-primary" type="submit">Cari</button>
			</form>
		</div>
		{#if data.searchQuery.length >= 2}
			{#if data.searchResults.length === 0}
				<p class="text-sm text-slate-500">Tidak ada user ditemukan.</p>
			{:else}
				<div class="overflow-auto">
					<table class="table table-zebra w-full text-sm">
						<thead>
							<tr>
								<th>Nama</th>
								<th>Email</th>
								<th>Role</th>
								<th>Lembaga</th>
							</tr>
						</thead>
						<tbody>
							{#each data.searchResults as user}
								<tr>
									<td class="font-medium text-slate-900">{user.username || '-'}</td>
									<td>{user.email}</td>
									<td>{user.role}</td>
									<td>{user.orgName ? `${user.orgName} (${orgTypeLabel[user.orgType] ?? user.orgType})` : '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{:else}
			<p class="text-sm text-slate-500">Masukkan minimal 2 karakter untuk mencari.</p>
		{/if}
	</section>

	<section class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
		<div>
			<h2 class="text-lg font-semibold text-slate-900">Daftar Lembaga</h2>
			<p class="text-xs text-slate-500">Gunakan ghost login untuk masuk ke dashboard lembaga.</p>
		</div>
		{#if data.institutions.length === 0}
			<p class="text-sm text-slate-500">Belum ada lembaga terdaftar.</p>
		{:else}
			<div class="overflow-auto">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Nama</th>
							<th>Tipe</th>
							<th>Status</th>
							<th>Anggota</th>
							<th>Dibuat</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.institutions as org}
							<tr>
								<td class="font-medium text-slate-900">{org.name}</td>
								<td>{orgTypeLabel[org.type] ?? org.type}</td>
								<td>{org.status}</td>
								<td class="text-right">{formatNumber(org.totalMembers)}</td>
								<td>{formatDate(org.createdAt)}</td>
								<td>
									{#if org.adminCount}
										<a class="btn btn-xs btn-outline" href={`/admin/super/impersonate?orgId=${org.id}`}>
											Login Sebagai Admin
										</a>
									{:else}
										<span class="text-xs text-slate-400">Admin belum ada</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
