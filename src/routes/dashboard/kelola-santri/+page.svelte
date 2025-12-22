<script lang="ts">
	import { invalidate } from '$app/navigation';

	export let data;

	let santri = Array.isArray(data.santri) ? structuredClone(data.santri) : [];
	let loading = false;
	let formMessage = '';
	let formError = '';
	let searchQuery = '';
	let filterRole = 'all';
	let filterStatus = 'all';
	let form = {
		username: '',
		email: '',
		password: '',
		role: 'santri'
	};

	$: filteredSantri = santri.filter(s => {
		const matchSearch = !searchQuery || 
			s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.email?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchRole = filterRole === 'all' || s.role === filterRole || (filterRole === 'ustadz' && s.role === 'ustadzah');
		const matchStatus = filterStatus === 'all' || (s.orgStatus || 'active') === filterStatus;
		return matchSearch && matchRole && matchStatus;
	});

	$: stats = {
		total: santri.length,
		santri: santri.filter(s => s.role === 'santri').length,
		ustadz: santri.filter(s => s.role === 'ustadz' || s.role === 'ustadzah').length,
		admin: santri.filter(s => s.role === 'admin').length,
		pending: santri.filter(s => (s.orgStatus || 'active') === 'pending').length
	};

	const resetForm = () => {
		form = { username: '', email: '', password: '', role: 'santri' };
	};

	const refresh = async () => {
		const res = await fetch('/api/santri');
		const result = res.ok ? await res.json() : { santri: [] };
		santri = structuredClone(result.santri ?? []);
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
				<h1 class="mt-2 text-3xl font-bold">Kelola Santri</h1>
				<p class="mt-1 text-sm text-white/90">Manajemen akun dan monitoring progres santri</p>
			</div>
			<div class="hidden md:block text-6xl opacity-20">👥</div>
		</div>
	</div>

	<!-- Stats Cards -->
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
						<option value="santri">Santri</option>
						<option value="ustadz">Ustadz/Ustadzah</option>
						<option value="jamaah">Jamaah</option>
						<option value="tamir">Ta'mir</option>
						<option value="bendahara">Bendahara</option>
						<option value="admin">Admin</option>
					</select>
					<select class="select select-bordered w-full md:w-auto" bind:value={filterStatus}>
						<option value="all">Semua Status</option>
						<option value="active">Aktif</option>
						<option value="pending">Pending</option>
					</select>
				</div>

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
				<h3 class="text-lg font-bold text-slate-800 mb-4">➕ Tambah Pengguna Baru</h3>
				
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
						<select id="role" class="select select-bordered" bind:value={form.role}>
							<option value="santri">🎓 Santri</option>
							<option value="ustadz">👩‍🏫 Ustadz/Ustadzah (otomatis sesuai gender)</option>
							<option value="jamaah">🧎‍♂️ Jamaah</option>
							<option value="tamir">🕌 Ta'mir</option>
							<option value="bendahara">💰 Bendahara</option>
							<option value="admin">⚙️ Admin</option>
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
