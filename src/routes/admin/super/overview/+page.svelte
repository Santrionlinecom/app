<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	type Institution = PageData['institutions'][number];
	type AvailableUser = PageData['availableUsers'][number];
	type ActivityRow = PageData['liveStats']['recentActivities'][number];

	const liveStats = data.liveStats ?? {
		loginsToday: 0,
		registrationsToday: 0,
		trafficSources: [],
		recentActivities: []
	};

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
	const formatDateTime = (value?: number | null) =>
		value
			? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
			: '-';

	const parseMetadata = (value?: string | null) => {
		if (!value) return null;
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	};

	const actionLabel = (action: string) => {
		const map: Record<string, string> = {
			LOGIN: 'Login',
			REGISTER: 'Register',
			VIEW_PAGE: 'Lihat Halaman',
			CLICK_WA: 'Klik WA',
			VIEW_CERTIFICATE: 'Lihat Sertifikat'
		};
		if (map[action]) return map[action];
		if (action.startsWith('CLICK_')) return `Klik ${action.slice(6).replace(/_/g, ' ')}`;
		return action;
	};

	const actorLabel = (activity: ActivityRow) =>
		activity.username || activity.userEmail || activity.email || 'Pengunjung';

	const orgTypeName = (value?: string | null) => (value ? orgTypeLabel[value] ?? value : '-');
	const orgLabel = (org: Institution) => `${org.name} (${orgTypeLabel[org.type] ?? org.type})`;
	const orgsWithoutAdmin = (orgs: Institution[]) => orgs.filter((org) => !org.adminCount);
	const hasOrgWithoutAdmin = (orgs: Institution[]) => orgs.some((org) => !org.adminCount);
	const userLabel = (user: AvailableUser) => {
		const org = data.institutions?.find((item) => item.id === user.orgId);
		const orgName = org ? org.name : null;
		return `${user.username || user.email} • ${user.email}${orgName ? ` — ${orgName}` : ''}`;
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

	<section class="grid gap-4 lg:grid-cols-3">
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">User Login Hari Ini</p>
			<p class="mt-2 text-3xl font-bold text-emerald-600">{formatNumber(liveStats.loginsToday)}</p>
			<p class="text-xs text-slate-500">Total login hari ini</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">User Baru Hari Ini</p>
			<p class="mt-2 text-3xl font-bold text-blue-600">{formatNumber(liveStats.registrationsToday)}</p>
			<p class="text-xs text-slate-500">Pendaftaran hari ini</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Traffic Source</p>
			{#if liveStats.trafficSources.length === 0}
				<p class="mt-3 text-sm text-slate-500">Belum ada data klik.</p>
			{:else}
				<div class="mt-3 space-y-2 text-sm">
					{#each liveStats.trafficSources as source}
						<div class="flex items-center justify-between">
							<span class="text-slate-700">{actionLabel(source.action)}</span>
							<span class="font-semibold text-slate-900">{formatNumber(source.total)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
		<div>
			<h2 class="text-lg font-semibold text-slate-900">Live Traffic</h2>
			<p class="text-xs text-slate-500">10 aktivitas terbaru dari sistem.</p>
		</div>
		{#if liveStats.recentActivities.length === 0}
			<p class="text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
		{:else}
			<div class="overflow-auto">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Siapa</th>
							<th>Ngapain</th>
							<th>Kapan</th>
						</tr>
					</thead>
					<tbody>
						{#each liveStats.recentActivities as activity}
							{@const meta = parseMetadata(activity.metadata)}
							<tr>
								<td class="font-medium text-slate-900">{actorLabel(activity)}</td>
								<td>
									<div class="font-medium text-slate-900">{actionLabel(activity.action)}</div>
									{#if meta?.path}
										<div class="text-xs text-slate-500">{meta.path}</div>
									{:else if meta?.source}
										<div class="text-xs text-slate-500">{meta.source}</div>
									{:else if meta?.orgName}
										<div class="text-xs text-slate-500">{meta.orgName}</div>
									{/if}
								</td>
								<td>{formatDateTime(activity.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
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
									<td>{user.orgName ? `${user.orgName} (${orgTypeName(user.orgType)})` : '-'}</td>
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
		{#if hasOrgWithoutAdmin(data.institutions)}
			<div class="grid gap-4 lg:grid-cols-2">
				<form method="POST" action="?/assignExistingAdmin" class="min-w-0 rounded-xl border bg-slate-50 p-4">
					<h3 class="text-sm font-semibold text-slate-900">Tetapkan Admin dari User Terdaftar</h3>
					<p class="text-xs text-slate-500">Pilih user yang sudah ada untuk menjadi admin lembaga.</p>
					<p class="text-xs text-slate-400">User akan dipindah ke lembaga yang dipilih.</p>
					<div class="mt-3 grid gap-3 min-w-0">
						<select name="orgId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih lembaga</option>
							{#each orgsWithoutAdmin(data.institutions) as org}
								<option value={org.id}>{orgLabel(org)}</option>
							{/each}
						</select>
						<select name="userId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih user</option>
							{#each data.availableUsers as user}
								<option value={user.id}>{userLabel(user)}</option>
							{/each}
						</select>
						<button class="btn btn-primary btn-sm" type="submit">Set Admin</button>
					</div>
				</form>
				<form method="POST" action="?/createAdmin" class="min-w-0 rounded-xl border bg-slate-50 p-4">
					<h3 class="text-sm font-semibold text-slate-900">Tambah Admin Baru</h3>
					<p class="text-xs text-slate-500">Buat akun admin baru untuk lembaga tanpa admin.</p>
					<div class="mt-3 grid gap-3 min-w-0">
						<select name="orgId" class="select select-bordered w-full min-w-0" required>
							<option value="">Pilih lembaga</option>
							{#each orgsWithoutAdmin(data.institutions) as org}
								<option value={org.id}>{orgLabel(org)}</option>
							{/each}
						</select>
						<input name="name" class="input input-bordered w-full min-w-0" placeholder="Nama admin" required />
						<input name="email" type="email" class="input input-bordered w-full min-w-0" placeholder="Email admin" required />
						<input
							name="password"
							type="password"
							class="input input-bordered w-full min-w-0"
							placeholder="Password (min 6)"
							minlength="6"
							required
						/>
						<button class="btn btn-secondary btn-sm" type="submit">Buat Admin</button>
					</div>
				</form>
			</div>
		{:else}
			<p class="text-xs text-slate-500">Semua lembaga sudah memiliki admin.</p>
		{/if}
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
