<script lang="ts">
	import { invalidate } from '$app/navigation';

	export let data;

	let scope = data?.scope ?? null;
	let isAdminView = scope?.isAdmin ?? false;
	let memberRole = scope?.memberRole ?? 'santri';
	let memberLabel = memberRole === 'jamaah' ? 'Jamaah' : 'Santri';

	$: scope = data?.scope ?? null;
	$: isAdminView = scope?.isAdmin ?? false;
	$: memberRole = scope?.memberRole ?? 'santri';
	$: memberLabel = memberRole === 'jamaah' ? 'Jamaah' : 'Santri';

	let santri = Array.isArray(data.santri) ? structuredClone(data.santri) : [];
	let pagination = data?.pagination ?? { page: 1, limit: 10, totalCount: santri.length };
	let remoteStats = data?.stats ?? null;
	let loading = false;
	let formMessage = '';
	let formError = '';
	let searchQuery = '';
	let filterRole = 'all';
	let filterStatus = 'all';
	let downloadingPdfId: string | null = null;
	let canExport = false;
	let form = {
		username: '',
		email: '',
		password: '',
		role: 'santri'
	};

	$: if (!isAdminView && memberRole) {
		form = { ...form, role: memberRole };
	}
	$: canExport = !isAdminView || !!scope?.memberRole;

	$: filteredSantri = santri.filter(s => {
		const matchSearch = !searchQuery || 
			s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.email?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchRole = filterRole === 'all' || s.role === filterRole || (filterRole === 'ustadz' && s.role === 'ustadzah');
		const matchStatus = filterStatus === 'all' || (s.orgStatus || 'active') === filterStatus;
		return matchSearch && matchRole && matchStatus;
	});

	const deriveStats = (list) => ({
		total: list.length,
		santri: list.filter(s => s.role === 'santri').length,
		jamaah: list.filter(s => s.role === 'jamaah').length,
		ustadz: list.filter(s => s.role === 'ustadz' || s.role === 'ustadzah').length,
		admin: list.filter(s => s.role === 'admin').length,
		pending: list.filter(s => (s.orgStatus || 'active') === 'pending').length
	});

	$: stats = remoteStats ?? deriveStats(santri);
	$: if (data?.pagination) pagination = data.pagination;
	$: if (data?.stats) remoteStats = data.stats;

	const resetForm = () => {
		form = { username: '', email: '', password: '', role: 'santri' };
	};

	const refresh = async () => {
		const page = pagination?.page ?? 1;
		const limit = pagination?.limit ?? 10;
		const res = await fetch(`/api/santri?page=${page}&limit=${limit}`);
		const result = res.ok ? await res.json() : { santri: [] };
		santri = structuredClone(result.santri ?? []);
		pagination = result.pagination ?? pagination;
		remoteStats = result.stats ?? remoteStats;
		await invalidate('/dashboard/kelola-santri');
	};

	const submit = async () => {
		formError = '';
		formMessage = '';
		loading = true;
		try {
			const res = await fetch('/api/santri', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result?.message || 'Gagal menambah santri');

			formMessage = 'Santri berhasil ditambah';
			resetForm();
			await refresh();
			setTimeout(() => formMessage = '', 3000);
		} catch (err: any) {
			formError = err?.message ?? 'Gagal menambah santri';
		} finally {
			loading = false;
		}
	};

	const approveMember = async (id: string) => {
		try {
			const res = await fetch(`/api/santri/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orgStatus: 'active' })
			});
			if (!res.ok) throw new Error('Gagal menyetujui');
			await refresh();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menyetujui');
		}
	};

	const removeSantri = async (id: string) => {
		if (!confirm('Hapus santri ini?')) return;
		try {
			const res = await fetch(`/api/santri/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Gagal menghapus santri');
			await refresh();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menghapus santri');
		}
	};

	const getRoleBadgeClass = (role: string) => {
		const classes = {
			admin: 'badge-error',
			ustadz: 'badge-info',
			ustadzah: 'badge-info',
			santri: 'badge-success',
			jamaah: 'badge-accent',
			tamir: 'badge-secondary',
			bendahara: 'badge-warning'
		};
		return classes[role as keyof typeof classes] || 'badge-ghost';
	};

	const canDownloadPdf = (role: string) => role === 'santri' || role === 'jamaah';

	const downloadPdf = async (id: string, name: string) => {
		if (downloadingPdfId) return;
		downloadingPdfId = id;
		try {
			const res = await fetch(`/api/reports/anggota/${id}`);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.message || 'Gagal mengunduh PDF');
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			const safeName = (name || 'anggota').toLowerCase().replace(/[^a-z0-9]+/g, '-');
			link.href = url;
			link.download = `laporan-${safeName || 'anggota'}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal mengunduh PDF');
		} finally {
			downloadingPdfId = null;
		}
	};
</script>

<svelte:head>
	<title>Kelola Santri - Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="rounded-3xl border bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.25em] text-white/80">Admin Panel</p>
				<h1 class="mt-2 text-3xl font-bold">Kelola {isAdminView ? 'Santri' : memberLabel}</h1>
				<p class="mt-1 text-sm text-white/90">Manajemen akun anggota sesuai lembaga</p>
			</div>
			<div class="hidden md:block text-6xl opacity-20">👥</div>
		</div>
	</div>

	<!-- Stats Cards -->
	{#if isAdminView}
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-blue-600">{stats.total}</div>
				<div class="text-sm text-slate-600">Total Pengguna</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-green-600">{stats.santri}</div>
				<div class="text-sm text-slate-600">Santri</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-cyan-600">{stats.ustadz}</div>
				<div class="text-sm text-slate-600">Ustadz/ah</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-red-600">{stats.admin}</div>
				<div class="text-sm text-slate-600">Admin</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-amber-600">{stats.pending}</div>
				<div class="text-sm text-slate-600">Menunggu Approval</div>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-blue-600">{stats.total}</div>
				<div class="text-sm text-slate-600">Total Anggota</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-green-600">{memberRole === 'jamaah' ? stats.jamaah : stats.santri}</div>
				<div class="text-sm text-slate-600">{memberLabel}</div>
			</div>
			<div class="rounded-xl border bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-amber-600">{stats.pending}</div>
				<div class="text-sm text-slate-600">Menunggu Approval</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Table Section -->
		<div class="lg:col-span-2 space-y-4">
			<div class="rounded-2xl border bg-white p-4 shadow-sm">
				<div class="flex flex-col md:flex-row gap-3 mb-4">
					<input 
						type="text" 
						placeholder="🔍 Cari nama atau email..." 
						class="input input-bordered flex-1"
						bind:value={searchQuery}
					/>
					<select class="select select-bordered w-full md:w-auto" bind:value={filterRole}>
						<option value="all">Semua Role</option>
						{#if isAdminView}
							<option value="santri">Santri</option>
							<option value="ustadz">Ustadz</option>
							<option value="jamaah">Jamaah</option>
							<option value="tamir">Ta'mir</option>
							<option value="bendahara">Bendahara</option>
							<option value="admin">Admin</option>
						{:else}
							<option value={memberRole}>{memberLabel}</option>
						{/if}
					</select>
					<select class="select select-bordered w-full md:w-auto" bind:value={filterStatus}>
						<option value="all">Semua Status</option>
						<option value="active">Aktif</option>
						<option value="pending">Pending</option>
					</select>
				</div>
				{#if canExport}
					<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3">
						<div>
							<div class="text-sm font-semibold text-emerald-700">Unduh laporan {memberLabel}</div>
							<div class="text-xs text-emerald-700/80">Format CSV dapat dibuka di Excel atau Google Sheets.</div>
						</div>
						<a class="btn btn-sm btn-outline btn-success" href="/api/reports/anggota">
							⬇️ Download Excel
						</a>
					</div>
				{/if}

				<div class="overflow-x-auto rounded-xl border">
					<table class="table table-zebra">
						<thead>
							<tr class="bg-slate-50">
								<th class="text-slate-700">#</th>
								<th class="text-slate-700">Nama</th>
								<th class="text-slate-700">Email</th>
								<th class="text-slate-700">Role</th>
								<th class="text-slate-700">Status</th>
								<th class="text-slate-700">Terdaftar</th>
								<th class="text-slate-700">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{#if filteredSantri.length === 0}
								<tr>
									<td colspan="7" class="text-center text-slate-500 py-8">
										{#if searchQuery || filterRole !== 'all'}
											Tidak ada hasil yang cocok
										{:else}
											Belum ada data santri
										{/if}
									</td>
								</tr>
							{:else}
								{#each filteredSantri as s, i}
									<tr class="hover">
										<td class="font-medium">{i + 1}</td>
										<td>
											<div class="font-medium text-slate-900">{s.username || '-'}</div>
										</td>
										<td class="text-slate-600">{s.email}</td>
										<td>
											<span class="badge {getRoleBadgeClass(s.role)}">{s.role}</span>
										</td>
										<td>
											<span class="badge {s.orgStatus === 'pending' ? 'badge-warning' : 'badge-success'}">
												{s.orgStatus === 'pending' ? 'Pending' : 'Aktif'}
											</span>
										</td>
										<td class="text-sm text-slate-500">
											{#if s.createdAt}
												{new Date(s.createdAt).toLocaleDateString('id-ID', { 
													day: 'numeric', 
													month: 'short', 
													year: 'numeric' 
												})}
											{:else}
												-
											{/if}
										</td>
										<td>
											{#if canDownloadPdf(s.role)}
												<button
													class="btn btn-xs btn-outline mr-2"
													on:click={() => downloadPdf(s.id, s.username || s.email)}
													disabled={downloadingPdfId === s.id}
												>
													{#if downloadingPdfId === s.id}
														<span class="loading loading-spinner loading-xs"></span>
													{:else}
														📄 PDF
													{/if}
												</button>
											{/if}
											{#if s.orgStatus === 'pending'}
												<button
													class="btn btn-xs btn-success text-white mr-2"
													on:click={() => approveMember(s.id)}
												>
													✅ Setujui
												</button>
											{/if}
											<button 
												class="btn btn-xs btn-error text-white" 
												on:click={() => removeSantri(s.id)}
											>
												🗑️ Hapus
											</button>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>

				<div class="mt-3 text-sm text-slate-500">
					Menampilkan {filteredSantri.length} dari {santri.length} pengguna
				</div>
			</div>
		</div>

		<!-- Form Section -->
		<div class="lg:col-span-1">
			<div class="rounded-2xl border bg-white p-6 shadow-sm sticky top-4">
				<h3 class="text-lg font-bold text-slate-800 mb-4">➕ Tambah {isAdminView ? 'Pengguna Baru' : memberLabel}</h3>
				
				<form on:submit|preventDefault={submit} class="space-y-4">
					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text font-medium">Nama Lengkap</span>
						</label>
						<input 
							id="name" 
							class="input input-bordered" 
							bind:value={form.username} 
							placeholder="Nama santri"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text font-medium">Email</span>
						</label>
						<input 
							id="email" 
							class="input input-bordered" 
							bind:value={form.email} 
							type="email" 
							placeholder="email@contoh.com"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text font-medium">Password</span>
						</label>
						<input 
							id="password" 
							class="input input-bordered" 
							bind:value={form.password} 
							type="password" 
							placeholder="Min. 6 karakter"
							required
							minlength="6"
						/>
					</div>

					<div class="form-control">
						<label class="label" for="role">
							<span class="label-text font-medium">Role</span>
						</label>
						<select id="role" class="select select-bordered" bind:value={form.role} disabled={!isAdminView}>
							{#if isAdminView}
								<option value="santri">🎓 Santri</option>
								<option value="ustadz">👩‍🏫 Ustadz</option>
								<option value="jamaah">🧎‍♂️ Jamaah</option>
								<option value="tamir">🕌 Ta'mir</option>
								<option value="bendahara">💰 Bendahara</option>
								<option value="admin">⚙️ Admin</option>
							{:else}
								<option value={memberRole}>🎓 {memberLabel}</option>
							{/if}
						</select>
					</div>

					{#if formError}
						<div class="alert alert-error shadow-sm">
							<span class="text-sm">❌ {formError}</span>
						</div>
					{/if}

					{#if formMessage}
						<div class="alert alert-success shadow-sm">
							<span class="text-sm">✅ {formMessage}</span>
						</div>
					{/if}

					<button 
						type="submit"
						class="btn btn-primary w-full" 
						disabled={loading}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
							Memproses...
						{:else}
							➕ Tambah Pengguna
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
