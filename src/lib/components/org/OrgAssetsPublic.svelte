<script lang="ts">
	export let org;
	export let assets: Array<{
		id?: string;
		name: string;
		category?: string | null;
		quantity: number;
		condition?: string | null;
		location?: string | null;
		notes?: string | null;
		acquiredAt?: string | null;
	}> = [];

	const formatOrgLabel = (value?: string) => {
		if (value === 'musholla') return 'Musholla';
		if (value === 'masjid') return 'Masjid';
		if (value === 'pondok') return 'Pondok';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return 'Lembaga';
	};

	const formatDate = (value?: string | null) => {
		if (!value) return '-';
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? value
			: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	const orgLabel = formatOrgLabel(org?.type);
	const orgName = org?.name ? `${orgLabel} ${org.name}` : orgLabel;
</script>

<section id="aset" class="max-w-5xl mx-auto px-4 pb-12 space-y-6">
	<div class="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-lg">
		<p class="text-xs uppercase tracking-[0.3em] text-slate-500">Inventaris</p>
		<h2 class="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
			Aset {orgName}
		</h2>
		<p class="text-sm text-slate-600 mt-2">Daftar aset dan inventaris yang dikelola lembaga.</p>
	</div>

	{#if assets.length === 0}
		<div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
			<p class="text-sm text-slate-600">Belum ada data aset yang ditampilkan.</p>
			<p class="text-xs text-slate-500 mt-2">Pengurus dapat menambahkan aset melalui dashboard lembaga.</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Daftar Aset</h3>
				<span class="text-xs text-slate-500">{assets.length} item</span>
			</div>
			<div class="mt-4 space-y-3 md:hidden">
				{#each assets as asset}
					<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<p class="text-sm font-semibold text-slate-900">{asset.name}</p>
							<span class="text-xs text-slate-500">{asset.quantity} unit</span>
						</div>
						<p class="mt-2 text-xs text-slate-500">Kategori: {asset.category || '-'}</p>
						<p class="mt-1 text-xs text-slate-500">Kondisi: {asset.condition || '-'}</p>
						<p class="mt-1 text-xs text-slate-500">Lokasi: {asset.location || '-'}</p>
						<p class="mt-1 text-xs text-slate-500">Tanggal: {formatDate(asset.acquiredAt)}</p>
						{#if asset.notes}
							<p class="mt-2 text-xs text-slate-500">{asset.notes}</p>
						{/if}
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
						</tr>
					</thead>
					<tbody>
						{#each assets as asset}
							<tr>
								<td>{asset.name}</td>
								<td>{asset.category || '-'}</td>
								<td>{asset.quantity}</td>
								<td>{asset.condition || '-'}</td>
								<td>{asset.location || '-'}</td>
								<td>{formatDate(asset.acquiredAt)}</td>
								<td>{asset.notes || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>
