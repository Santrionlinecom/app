<!--
	Panel lembaga komunitas (masjid / musholla).

	Ini blok terbesar di dashboard (±400 baris) dan sebelumnya ikut terunduh
	oleh semua peran, padahal hanya dipakai lembaga komunitas. Dipisah agar
	TPQ, pondok, santri, dan staf tidak perlu mengunduhnya.

	State form aset tetap dimiliki halaman induk dan dihubungkan lewat `bind:`,
	sehingga perilaku form tidak berubah sama sekali.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { reveal } from '$lib/motion';

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

	// Data tampilan (satu arah).
	export let finance: any = null;
	export let communitySchedule: any[] = [];
	export let canManageCommunity = false;
	export let assets: AssetRow[] = [];
	export let mediaItems: Array<{ id: string; url: string }> = [];
	export let uploadingMedia = false;
	export let uploadMediaError = '';

	// Pemformat dan aksi milik induk (tetap satu sumber kebenaran).
	export let formatDate: (value: string | number | null | undefined) => string;
	export let formatCurrency: (value: number) => string;
	export let refreshOnSuccess: any;
	export let startEditAsset: (asset: AssetRow) => void;
	export let resetAssetForm: () => void;
	export let uploadOrgMedia: (event: Event) => void;
	export let deleteOrgMedia: (id: string) => void;

	// State form aset (dua arah lewat bind:).
	export let assetId = '';
	export let assetName = '';
	export let assetCategory = '';
	export let assetQuantity = '1';
	export let assetCondition = '';
	export let assetLocation = '';
	export let assetNotes = '';
	export let assetAcquiredAt = '';
	export let assetFormRef: HTMLFormElement | null = null;
	export let mediaFileInput: HTMLInputElement | null = null;

	const confirmDelete = (event: Event) => {
		if (!confirm('Hapus aset ini?')) event.preventDefault();
	};
</script>

<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
	<div class="admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-2" use:reveal={{ delay: 120, distance: 18 }}>
		<div class="flex min-w-0 items-center justify-between gap-3">
			<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
				Transaksi Kas Terbaru
			</h3>
			<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/keuangan">
				Lihat keuangan
			</a>
		</div>
		{#if finance?.kas?.entries?.length}
			<div class="mt-5 space-y-2.5">
				{#each finance.kas.entries as entry}
					<div
						class="flex min-w-0 flex-col gap-2 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="min-w-0">
							<p class="break-words font-semibold text-so-ink">{entry.kategori}</p>
							<p class="text-xs text-so-muted">{formatDate(entry.tanggal)}</p>
						</div>
						<div class="min-w-0 sm:text-right">
							<p
								class={`break-words text-sm font-semibold ${entry.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-700'}`}
							>
								{entry.tipe === 'masuk' ? '+' : '-'}{formatCurrency(entry.nominal)}
							</p>
							<p class="break-words text-xs text-so-muted">{entry.keterangan || '-'}</p>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<EmptyState
				icon="💰"
				title="Belum ada transaksi"
				description="Transaksi kas akan muncul di sini setelah Anda mencatat pemasukan atau pengeluaran."
				actionLabel="Kelola Keuangan"
				actionHref="/keuangan"
				compact={true}
			/>
		{/if}
	</div>

	<div class="admin-card min-w-0 overflow-hidden p-5 sm:p-6" use:reveal={{ delay: 200, distance: 18 }}>
		<div class="flex min-w-0 items-center justify-between gap-3">
			<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">Agenda 2 Minggu</h3>
			<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/kalender">
				Lihat kalender
			</a>
		</div>
		{#if communitySchedule.length}
			<div class="mt-5 space-y-2.5">
				{#each communitySchedule as item}
					<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm">
						<p class="break-words font-semibold text-so-ink">{item.title}</p>
						<p class="text-xs text-so-muted">{formatDate(item.eventDate)}</p>
						{#if item.content}
							<p class="mt-1 break-words text-xs text-so-muted">{item.content}</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<EmptyState
				icon="📅"
				title="Belum ada agenda"
				description="Agenda kegiatan komunitas akan muncul di sini. Tambahkan jadwal melalui kalender."
				actionLabel="Buka Kalender"
				actionHref="/kalender"
				compact={true}
			/>
		{/if}
	</div>
</section>

{#if canManageCommunity}
	<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
		<div class={`admin-card min-w-0 overflow-hidden p-5 sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}>
			<h3 class="font-display break-words text-xl font-bold text-so-green">Kelola Aset</h3>
			<p class="text-xs text-so-muted">Inventaris lembaga yang tampil di halaman publik.</p>
			<div class="mt-4 rounded-xl border border-dashed border-so-green/25 bg-so-green/8 p-4">
				<h4 class="text-sm font-semibold text-so-green">Import Excel</h4>
				<p class="mt-1 break-words text-xs text-so-muted">
					Kolom wajib: <strong>name</strong>, <strong>quantity</strong>. Opsional:
					<strong>category</strong>, <strong>condition</strong>,
					<strong>location</strong>, <strong>acquired_at</strong>,
					<strong>notes</strong>.
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
					<div class="rounded-xl border border-so-gold/35 bg-so-gold/12 p-3 text-xs text-so-green">
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
						placeholder="Kategori (misal: fasilitas)"
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
						placeholder="Kondisi (baik, rusak)"
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

		<div class={`admin-card min-w-0 overflow-hidden p-5 sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}>
			<div class="flex min-w-0 items-center justify-between gap-3">
				<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">Daftar Aset</h3>
				<span class="text-xs text-so-muted">{assets.length} item</span>
			</div>
			{#if assets.length === 0}
				<EmptyState
					icon="🏢"
					title="Belum ada aset"
					description="Inventaris lembaga akan muncul di sini. Tambahkan aset melalui form di samping atau import Excel."
					compact={true}
				/>
			{:else}
				<div class="mt-4 space-y-3 md:hidden">
					{#each assets as asset}
						<div
							class={`rounded-xl border p-4 shadow-sm ${
								assetId === asset.id ? 'border-amber-300 bg-amber-50/60' : 'border-so-border bg-white'
							}`}
						>
							<div class="flex min-w-0 items-center justify-between gap-3">
								<p class="min-w-0 break-words text-sm font-semibold text-so-ink">{asset.name}</p>
								<span class="text-xs text-so-muted">{asset.quantity} unit</span>
							</div>
							<p class="mt-2 break-words text-xs text-so-muted">Kategori: {asset.category || '-'}</p>
							<p class="mt-1 break-words text-xs text-so-muted">Kondisi: {asset.condition || '-'}</p>
							<p class="mt-1 break-words text-xs text-so-muted">Lokasi: {asset.location || '-'}</p>
							<p class="mt-1 text-xs text-so-muted">Tanggal: {formatDate(asset.acquiredAt)}</p>
							{#if asset.notes}
								<p class="mt-2 break-words text-xs text-so-muted">{asset.notes}</p>
							{/if}
							<div class="mt-3 flex flex-wrap gap-2">
								<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
									Edit
								</button>
								<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
									<input type="hidden" name="id" value={asset.id} />
									<button type="submit" class="btn btn-xs btn-ghost text-red-600" on:click={confirmDelete}>
										Hapus
									</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 hidden max-w-full overflow-x-auto rounded-xl border border-so-border md:block">
					<table class="w-full min-w-[920px] text-sm">
						<thead>
							<tr class="bg-so-cream text-left text-xs uppercase text-so-muted">
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
						<tbody class="divide-y divide-so-border bg-white">
							{#each assets as asset}
								<tr class={assetId === asset.id ? 'bg-amber-50' : ''}>
									<td>{asset.name}</td>
									<td>{asset.category || '-'}</td>
									<td>{asset.quantity}</td>
									<td>{asset.condition || '-'}</td>
									<td>{asset.location || '-'}</td>
									<td>{formatDate(asset.acquiredAt)}</td>
									<td>{asset.notes || '-'}</td>
									<td>
										<div class="flex flex-wrap gap-2">
											<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
												Edit
											</button>
											<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
												<input type="hidden" name="id" value={asset.id} />
												<button type="submit" class="btn btn-xs btn-ghost text-red-600" on:click={confirmDelete}>
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

	<section class="admin-card min-w-0 overflow-hidden p-5 sm:p-6">
		<div class="flex min-w-0 items-center justify-between gap-3">
			<div class="min-w-0">
				<h3 class="font-display break-words text-xl font-bold text-so-green">Galeri Lembaga</h3>
				<p class="text-xs text-so-muted">
					Foto kegiatan dan suasana lembaga yang ditampilkan di halaman publik.
				</p>
			</div>
			<span class="text-xs text-so-muted">{mediaItems.length} foto</span>
		</div>

		<div class="mt-4 rounded-xl border border-dashed border-so-green/25 bg-so-green/8 p-4">
			<label for="dashboard-media-upload" class="text-sm font-semibold text-so-green">
				Upload Foto Baru
			</label>
			<p class="mt-1 text-xs text-so-muted">Format: JPG, PNG, WEBP. Maks 10MB.</p>
			<input
				id="dashboard-media-upload"
				type="file"
				accept="image/jpeg,image/png,image/webp"
				class="file-input file-input-bordered file-input-sm mt-2 w-full"
				on:change={uploadOrgMedia}
				bind:this={mediaFileInput}
				disabled={uploadingMedia}
			/>
			{#if uploadingMedia}
				<p class="mt-2 animate-pulse text-xs text-so-green">Mengupload...</p>
			{/if}
			{#if uploadMediaError}
				<p class="mt-2 text-xs text-red-600">{uploadMediaError}</p>
			{/if}
		</div>

		{#if mediaItems.length === 0}
			<div
				class="mt-4 rounded-xl border border-dashed border-so-border bg-so-cream/70 p-6 text-center text-sm text-so-muted"
			>
				Belum ada foto yang ditampilkan.
			</div>
		{:else}
			<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each mediaItems as item}
					<div class="group relative overflow-hidden rounded-xl border border-so-border bg-so-cream">
						<div class="aspect-video">
							<img src={item.url} alt="Foto lembaga" class="h-full w-full object-cover" loading="lazy" />
						</div>
						<button
							type="button"
							class="btn btn-xs btn-error absolute right-2 top-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
							on:click={() => deleteOrgMedia(item.id)}
						>
							Hapus
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}
