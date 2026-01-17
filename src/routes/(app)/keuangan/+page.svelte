<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	type KasEntry = {
		id: string;
		tanggal: number;
		tipe: string;
		kategori: string;
		keterangan: string | null;
		nominal: number;
	};

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatDate = (value: number) =>
		new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	const formatCurrency = (value: number | null | undefined) => `Rp ${formatNumber(value ?? 0)}`;

	const kasTypeLabel: Record<string, string> = {
		masuk: 'Pemasukan',
		keluar: 'Pengeluaran'
	};

	let kasId = '';
	let kasTanggal = '';
	let kasTipe = 'masuk';
	let kasKategori = '';
	let kasNominal = '';
	let kasKeterangan = '';
	let kasFormRef: HTMLFormElement | null = null;

	const toDateInput = (value: number) => {
		const date = new Date(value);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const startEditKas = (row: KasEntry) => {
		kasId = row.id;
		kasTanggal = toDateInput(row.tanggal);
		kasTipe = row.tipe;
		kasKategori = row.kategori;
		kasNominal = `${row.nominal}`;
		kasKeterangan = row.keterangan ?? '';
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
			kasFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const resetKasForm = () => {
		kasId = '';
		kasTanggal = '';
		kasTipe = 'masuk';
		kasKategori = '';
		kasNominal = '';
		kasKeterangan = '';
	};

	const refreshOnSuccess = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				location.reload();
			}
		};
	};

	const orgLabel = data.org?.type === 'musholla' ? 'Musholla' : 'Masjid';
</script>

<svelte:head>
	<title>Keuangan | SantriOnline</title>
</svelte:head>

<section class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
	<h2 class="app-title text-2xl font-semibold text-slate-900">Keuangan {orgLabel}</h2>
	<p class="mt-2 text-sm text-slate-600">
		Kelola pemasukan dan pengeluaran. Perubahan otomatis tampil di halaman publik.
	</p>
</section>

<section class="mt-6 grid gap-6 lg:grid-cols-2">
	<div class={`rounded-2xl border bg-white p-6 shadow-sm ${kasId ? 'lg:col-span-2' : ''}`}>
		<h3 class="text-lg font-semibold text-slate-900">Kas {orgLabel}</h3>
		<p class="text-xs text-slate-500">Catat pemasukan dan pengeluaran untuk laporan transparan.</p>
		<div class="mt-4 grid gap-3 md:grid-cols-3">
			<div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
				<p class="text-xs uppercase text-emerald-700">Saldo</p>
				<p class="text-base font-bold text-emerald-700 tabular-nums tracking-tight leading-tight break-words sm:text-lg">
					{formatCurrency(data.kasSummary?.saldo)}
				</p>
			</div>
			<div class="rounded-xl border border-blue-100 bg-blue-50 p-3">
				<p class="text-xs uppercase text-blue-700">Pemasukan</p>
				<p class="text-base font-bold text-blue-700 tabular-nums tracking-tight leading-tight break-words sm:text-lg">
					{formatCurrency(data.kasSummary?.masuk)}
				</p>
			</div>
			<div class="rounded-xl border border-amber-100 bg-amber-50 p-3">
				<p class="text-xs uppercase text-amber-700">Pengeluaran</p>
				<p class="text-base font-bold text-amber-700 tabular-nums tracking-tight leading-tight break-words sm:text-lg">
					{formatCurrency(data.kasSummary?.keluar)}
				</p>
			</div>
		</div>

		<div class="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
			<h4 class="text-sm font-semibold text-emerald-700">Import Excel</h4>
			<p class="mt-1 text-xs text-emerald-700/80">
				Kolom wajib: <strong>tanggal</strong>, <strong>tipe</strong>, <strong>kategori</strong>, <strong>nominal</strong>.
				Opsional: <strong>keterangan</strong>.
			</p>
			<form
				method="POST"
				action="?/importKas"
				enctype="multipart/form-data"
				class="mt-3 space-y-3"
				use:enhance={refreshOnSuccess}
			>
				<a href="/templates/kas-masjid-template.xlsx" class="btn btn-outline w-full" download>
					Download Template
				</a>
				<input
					type="file"
					name="file"
					accept=".xlsx,.xls,.csv"
					class="file-input file-input-bordered w-full"
					required
				/>
				<button class="btn btn-primary w-full">Upload Kas</button>
			</form>
		</div>

		<form
			method="POST"
			action={kasId ? '?/updateKas' : '?/addKas'}
			class="mt-6 space-y-4"
			use:enhance={refreshOnSuccess}
			bind:this={kasFormRef}
		>
			{#if kasId}
				<input type="hidden" name="id" value={kasId} />
				<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
					Sedang mengedit transaksi kas. Simpan untuk memperbarui atau batalkan untuk kembali input baru.
				</div>
			{/if}
			<div class="grid gap-3 md:grid-cols-2">
				<input
					type="date"
					name="tanggal"
					class="input input-bordered w-full"
					bind:value={kasTanggal}
					required
				/>
				<select name="tipe" class="select select-bordered w-full" bind:value={kasTipe} required>
					<option value="masuk">Pemasukan</option>
					<option value="keluar">Pengeluaran</option>
				</select>
				<div class="md:col-span-2">
					<input
						type="text"
						name="kategori"
						list="kategoriKas"
						placeholder="Kategori (misal: infaq, operasional)"
						class="input input-bordered w-full"
						bind:value={kasKategori}
						required
					/>
					<datalist id="kategoriKas">
						<option value="Infaq"></option>
						<option value="Zakat"></option>
						<option value="Qurban"></option>
						<option value="Operasional"></option>
						<option value="Pembangunan"></option>
						<option value="Santunan"></option>
						<option value="Lainnya"></option>
					</datalist>
				</div>
				<input
					type="number"
					name="nominal"
					min="0"
					placeholder="Nominal (rupiah)"
					class="input input-bordered w-full"
					bind:value={kasNominal}
					required
				/>
				<textarea
					name="keterangan"
					rows="2"
					placeholder="Keterangan singkat"
					class="textarea textarea-bordered w-full md:col-span-2"
					bind:value={kasKeterangan}
				></textarea>
			</div>
			<div class="flex flex-col gap-2 sm:flex-row">
				<button class="btn btn-primary w-full sm:flex-1">
					{kasId ? 'Perbarui Kas' : 'Simpan Kas'}
				</button>
				{#if kasId}
					<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetKasForm}>
						Batal Edit
					</button>
				{/if}
			</div>
		</form>
	</div>

	<div class={`rounded-2xl border bg-white p-6 shadow-sm ${kasId ? 'lg:col-span-2' : ''}`}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-slate-900">Rekap Kas Terbaru</h3>
			<span class="text-xs text-slate-400">{data.kasEntries.length} transaksi</span>
		</div>
		{#if data.kasEntries.length === 0}
			<p class="mt-4 text-sm text-slate-500">Belum ada catatan kas.</p>
		{:else}
			<div class="mt-4 space-y-3 md:hidden">
				{#each data.kasEntries as row}
					<div
						class={`rounded-xl border p-4 shadow-sm ${
							kasId === row.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
						}`}
					>
						<div class="flex items-center justify-between">
							<p class="text-sm font-semibold text-slate-900">{formatDate(row.tanggal)}</p>
							<span class={`badge ${row.tipe === 'masuk' ? 'badge-success' : 'badge-warning'}`}>
								{kasTypeLabel[row.tipe] ?? row.tipe}
							</span>
						</div>
						<p class="mt-2 text-xs text-slate-500">{row.kategori}</p>
						<p class="mt-1 text-xs text-slate-500">{row.keterangan || '-'}</p>
						<p class={`mt-3 text-sm font-semibold ${row.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
							{row.tipe === 'masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditKas(row)}>
								Edit
							</button>
							<form method="POST" action="?/deleteKas" use:enhance={refreshOnSuccess}>
								<input type="hidden" name="id" value={row.id} />
								<button
									type="submit"
									class="btn btn-xs btn-ghost text-red-600"
									on:click={(event) => {
										if (!confirm('Hapus transaksi ini?')) {
											event.preventDefault();
										}
									}}
								>
									Hapus
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 hidden overflow-auto md:block">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Kategori</th>
							<th>Keterangan</th>
							<th>Tipe</th>
							<th>Nominal</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.kasEntries as row}
							<tr class={kasId === row.id ? 'bg-amber-50' : ''}>
								<td>{formatDate(row.tanggal)}</td>
								<td>{row.kategori}</td>
								<td>{row.keterangan || '-'}</td>
								<td>{kasTypeLabel[row.tipe] ?? row.tipe}</td>
								<td class={row.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}>
									{row.tipe === 'masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
								</td>
								<td>
									<div class="flex flex-wrap gap-2">
										<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditKas(row)}>
											Edit
										</button>
										<form method="POST" action="?/deleteKas" use:enhance={refreshOnSuccess}>
											<input type="hidden" name="id" value={row.id} />
											<button
												type="submit"
												class="btn btn-xs btn-ghost text-red-600"
												on:click={(event) => {
													if (!confirm('Hapus transaksi ini?')) {
														event.preventDefault();
													}
												}}
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
