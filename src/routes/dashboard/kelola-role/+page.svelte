<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		ustadz: 'Ustadz/Ustadzah (otomatis sesuai gender)',
		santri: 'Santri',
		alumni: 'Alumni'
	};

	const displayLabels: Record<string, string> = {
		...roleLabels,
		ustadzah: 'Ustadzah'
	};

	const roleColors: Record<string, string> = {
		admin: 'bg-purple-100 text-purple-800 border-purple-300',
		ustadz: 'bg-emerald-100 text-emerald-800 border-emerald-300',
		ustadzah: 'bg-pink-100 text-pink-800 border-pink-300',
		santri: 'bg-blue-100 text-blue-800 border-blue-300',
		alumni: 'bg-amber-100 text-amber-800 border-amber-300'
	};

	const normalizeRole = (role: string) => (role === 'ustadzah' ? 'ustadz' : role);

	let searchQuery = '';
	let filterRole = '';
	let editingUser: string | null = null;
	let selectedRole = '';
	let roleStats: Record<string, number> = { admin: 0, ustadz: 0, santri: 0, alumni: 0 };

	$: filteredUsers = data.users.filter((u: any) => {
		const matchSearch = !searchQuery || 
			u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.email?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchRole = !filterRole || normalizeRole(u.role) === filterRole;
		return matchSearch && matchRole;
	});

	$: roleStats = data.users.reduce(
		(acc: Record<string, number>, u: any) => {
			const key = normalizeRole(u.role);
			if (key in roleLabels) {
				acc[key] = (acc[key] ?? 0) + 1;
			}
			return acc;
		},
		{ admin: 0, ustadz: 0, santri: 0, alumni: 0 }
	);

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const startEdit = (userId: string, currentRole: string) => {
		editingUser = userId;
		selectedRole = normalizeRole(currentRole);
	};

	const cancelEdit = () => {
		editingUser = null;
		selectedRole = '';
	};
</script>

<div class="container">
	<div class="header">
		<div>
			<h1 class="title">Kelola Role Pengguna</h1>
			<p class="subtitle">Ubah role pengguna dalam sistem</p>
		</div>
	</div>

	<div class="filters">
		<input
			type="text"
			placeholder="🔍 Cari nama atau email..."
			bind:value={searchQuery}
			class="search-input"
		/>
		<select bind:value={filterRole} class="filter-select">
			<option value="">Semua Role</option>
			{#each Object.entries(roleLabels) as [value, label]}
				<option {value}>{label}</option>
			{/each}
		</select>
	</div>

	<div class="stats">
		{#each Object.entries(roleLabels) as [role, label]}
			<div class="stat-card {roleColors[role]}">
				<div class="stat-label">{label}</div>
				<div class="stat-value">{roleStats[role] ?? 0}</div>
			</div>
		{/each}
	</div>

	<div class="table-container">
		<table class="users-table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Email</th>
					<th>Gender</th>
					<th>Role</th>
					<th>Bergabung</th>
					<th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers as user}
					<tr>
						<td>{user.username || '-'}</td>
						<td>{user.email}</td>
						<td>
							<span class="gender-badge">
								{user.gender === 'pria' ? '👨 Pria' : user.gender === 'wanita' ? '👩 Wanita' : '-'}
							</span>
						</td>
						<td>
							{#if editingUser === user.id}
								<form method="POST" action="?/updateRole" use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											cancelEdit();
											location.reload();
										}
									};
								}}>
									<input type="hidden" name="userId" value={user.id} />
									<div class="role-edit">
										<select name="newRole" bind:value={selectedRole} class="role-select">
											{#each Object.entries(roleLabels) as [value, label]}
												<option {value}>{label}</option>
											{/each}
										</select>
										<button type="submit" class="btn-save">✓</button>
										<button type="button" on:click={cancelEdit} class="btn-cancel">✕</button>
									</div>
								</form>
							{:else}
								<span class="role-badge {roleColors[user.role] || 'bg-gray-100 text-gray-800 border-gray-200'}">
									{displayLabels[user.role] || user.role}
								</span>
							{/if}
						</td>
						<td>{formatDate(user.created_at)}</td>
						<td>
							{#if editingUser !== user.id}
								<button
									on:click={() => startEdit(user.id, user.role)}
									class="btn-edit"
								>
									✏️ Ubah
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.title {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
		font-size: 0.95rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.search-input {
		flex: 1;
		min-width: 250px;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.95rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.filter-select {
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		background: white;
		cursor: pointer;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 2px solid;
		text-align: center;
	}

	.stat-label {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 1.875rem;
		font-weight: 700;
	}

	.table-container {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.users-table {
		width: 100%;
		border-collapse: collapse;
	}

	.users-table thead {
		background: #f9fafb;
	}

	.users-table th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.users-table td {
		padding: 1rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.9rem;
	}

	.users-table tbody tr:hover {
		background: #f9fafb;
	}

	.gender-badge {
		font-size: 0.875rem;
	}

	.role-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid;
	}

	.role-edit {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.role-select {
		padding: 0.375rem 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.btn-save {
		padding: 0.375rem 0.75rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-save:hover {
		background: #059669;
	}

	.btn-cancel {
		padding: 0.375rem 0.75rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-cancel:hover {
		background: #dc2626;
	}

	.btn-edit {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.btn-edit:hover {
		background: #2563eb;
	}

	@media (max-width: 768px) {
		.table-container {
			overflow-x: auto;
		}

		.users-table {
			min-width: 800px;
		}
	}
</style>
