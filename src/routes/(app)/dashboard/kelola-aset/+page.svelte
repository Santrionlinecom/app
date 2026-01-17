<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const mode = data.mode ?? 'super';
	const isSuperAdminView = mode === 'super';

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

	const orgs = isSuperAdminView ? ((data.orgs ?? []) as OrgRow[]) : [];
	const pending = orgs.filter((o) => o.status === 'pending');
	const active = orgs.filter((o) => o.status === 'active');
	const rejected = orgs.filter((o) => o.status === 'rejected');

	type AssetRow = {
		id: string;
		name: string;
		category: string | null;
		quantity: number;
		condition: string | null;
		location: string | null;
		notes: string | null;
		acquiredAt: string | null;
	};

	const assets = (data.assets ?? []) as AssetRow[];
	const orgName = data.org?.name ?? 'Lembaga';

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

	const formatAssetDate = (value?: string | null) => {
		if (!value) return '-';
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? value
			: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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

	let assetId = '';
	let assetName = '';
	let assetCategory = '';
	let assetQuantity = '1';
	let assetCondition = '';
	let assetLocation = '';
	let assetNotes = '';
	let assetAcquiredAt = '';
	let assetFormRef: HTMLFormElement | null = null;

	const startEditAsset = (asset: AssetRow) => {
		assetId = asset.id;
		assetName = asset.name;
		assetCategory = asset.category ?? '';
		assetQuantity = `${asset.quantity ?? 1}`;
		assetCondition = asset.condition ?? '';
		assetLocation = asset.location ?? '';
		assetNotes = asset.notes ?? '';
		assetAcquiredAt = asset.acquiredAt ?? '';
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
			assetFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const resetAssetForm = () => {
		assetId = '';
		assetName = '';
		assetCategory = '';
		assetQuantity = '1';
		assetCondition = '';
		assetLocation = '';
		assetNotes = '';
		assetAcquiredAt = '';
	};


	const refreshOnSuccess = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				location.reload();
			}
		};
	};
</script>

<svelte:head>
	<title>{isSuperAdminView ? 'Kelola Lembaga' : 'Aset Lembaga'}</title>
</svelte:head>

{#if isSuperAdminView}
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
										<form method="POST" use:enhance={refreshOnSuccess} class="flex flex-wrap gap-2">
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
{:else}
	<section class="space-y-6">
		<header class="rounded-3xl border bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
			<h1 class="text-3xl font-bold">Kelola Aset</h1>
			<p class="text-sm text-white/90">Kelola inventaris aset untuk {orgName}.</p>
		</header>

		<section class="grid gap-6 lg:grid-cols-2">
			<div class={`rounded-2xl border bg-white p-6 shadow-sm ${assetId ? 'lg:col-span-2' : ''}`}>
				<h2 class="text-lg font-semibold text-slate-900">Data Aset</h2>
				<p class="text-xs text-slate-500">Tambah atau perbarui aset yang dimiliki lembaga.</p>
				<div class="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
					<h4 class="text-sm font-semibold text-emerald-700">Import Excel</h4>
					<p class="mt-1 text-xs text-emerald-700/80">
						Kolom wajib: <strong>name</strong>, <strong>quantity</strong>. Opsional:
						<strong>category</strong>, <strong>condition</strong>, <strong>location</strong>, <strong>acquired_at</strong>, <strong>notes</strong>.
					</p>
					<form
						method="POST"
						action="?/importAssets"
						enctype="multipart/form-data"
						class="mt-3 space-y-3"
						use:enhance={refreshOnSuccess}
					>
						<a href="/templates/aset-template.xlsx" class="btn btn-outline w-full" download>
							Download Template
						</a>
						<input
							type="file"
							name="file"
							accept=".xlsx,.xls,.csv"
							class="file-input file-input-bordered w-full"
							required
						/>
						<button class="btn btn-primary w-full">Upload Aset</button>
					</form>
				</div>
				<form
					method="POST"
					action={assetId ? '?/updateAsset' : '?/addAsset'}
					class="mt-4 space-y-4"
					use:enhance={refreshOnSuccess}
					bind:this={assetFormRef}
				>
					{#if assetId}
						<input type="hidden" name="id" value={assetId} />
						<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
							Sedang mengedit aset. Simpan untuk memperbarui atau batalkan untuk input baru.
						</div>
					{/if}
					<div class="grid gap-3 md:grid-cols-2">
						<input
							type="text"
							name="name"
							placeholder="Nama aset"
							class="input input-bordered w-full md:col-span-2"
							bind:value={assetName}
							required
						/>
						<input
							type="text"
							name="category"
							placeholder="Kategori (misal: fasilitas, inventaris)"
							class="input input-bordered w-full"
							bind:value={assetCategory}
						/>
						<input
							type="number"
							name="quantity"
							min="1"
							placeholder="Jumlah"
							class="input input-bordered w-full"
							bind:value={assetQuantity}
							required
						/>
						<input
							type="text"
							name="condition"
							placeholder="Kondisi (baik, rusak, dll)"
							class="input input-bordered w-full"
							bind:value={assetCondition}
						/>
						<input
							type="text"
							name="location"
							placeholder="Lokasi penyimpanan"
							class="input input-bordered w-full"
							bind:value={assetLocation}
						/>
						<input
							type="date"
							name="acquiredAt"
							class="input input-bordered w-full"
							bind:value={assetAcquiredAt}
						/>
						<textarea
							name="notes"
							rows="2"
							placeholder="Catatan"
							class="textarea textarea-bordered w-full md:col-span-2"
							bind:value={assetNotes}
						></textarea>
					</div>
					<div class="flex flex-col gap-2 sm:flex-row">
						<button class="btn btn-primary w-full sm:flex-1">
							{assetId ? 'Perbarui Aset' : 'Simpan Aset'}
						</button>
						{#if assetId}
							<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetAssetForm}>
								Batal Edit
							</button>
						{/if}
					</div>
				</form>
			</div>

			<div class={`rounded-2xl border bg-white p-6 shadow-sm ${assetId ? 'lg:col-span-2' : ''}`}>
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-slate-900">Daftar Aset</h2>
					<span class="text-xs text-slate-400">{assets.length} item</span>
				</div>
				{#if assets.length === 0}
					<p class="mt-4 text-sm text-slate-500">Belum ada data aset.</p>
				{:else}
					<div class="mt-4 space-y-3 md:hidden">
						{#each assets as asset}
							<div
								class={`rounded-xl border p-4 shadow-sm ${
									assetId === asset.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
								}`}
							>
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-slate-900">{asset.name}</p>
									<span class="text-xs text-slate-500">{asset.quantity} unit</span>
								</div>
								<p class="mt-2 text-xs text-slate-500">Kategori: {asset.category || '-'}</p>
								<p class="mt-1 text-xs text-slate-500">Kondisi: {asset.condition || '-'}</p>
								<p class="mt-1 text-xs text-slate-500">Lokasi: {asset.location || '-'}</p>
								<p class="mt-1 text-xs text-slate-500">Tanggal: {formatAssetDate(asset.acquiredAt)}</p>
								{#if asset.notes}
									<p class="mt-2 text-xs text-slate-500">{asset.notes}</p>
								{/if}
								<div class="mt-3 flex flex-wrap gap-2">
									<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
										Edit
									</button>
									<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
										<input type="hidden" name="id" value={asset.id} />
										<button
											type="submit"
											class="btn btn-xs btn-ghost text-red-600"
											on:click={confirmAction('Hapus aset ini?')}
										>
											Hapus
										</button>
									</form>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-4 overflow-auto hidden md:block">
						<table class="table table-zebra w-full text-sm">
							<thead>
								<tr>
									<th>Nama</th>
									<th>Kategori</th>
									<th>Jumlah</th>
									<th>Kondisi</th>
									<th>Lokasi</th>
									<th>Tanggal</th>
									<th>Catatan</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each assets as asset}
									<tr class={assetId === asset.id ? 'bg-amber-50' : ''}>
										<td>{asset.name}</td>
										<td>{asset.category || '-'}</td>
										<td>{asset.quantity}</td>
										<td>{asset.condition || '-'}</td>
										<td>{asset.location || '-'}</td>
										<td>{formatAssetDate(asset.acquiredAt)}</td>
										<td>{asset.notes || '-'}</td>
										<td>
											<div class="flex flex-wrap gap-2">
												<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
													Edit
												</button>
												<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
													<input type="hidden" name="id" value={asset.id} />
													<button
														type="submit"
														class="btn btn-xs btn-ghost text-red-600"
														on:click={confirmAction('Hapus aset ini?')}
													>
														Hapus
													</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>

	</section>
{/if}
