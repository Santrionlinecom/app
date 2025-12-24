<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatDate = (value: number) =>
		new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	const formatCurrency = (value: number | null | undefined) => `Rp ${formatNumber(value ?? 0)}`;

	const statusLabel: Record<string, string> = {
		open: 'Open',
		closed: 'Closed'
	};

	const jenisLabel: Record<string, string> = {
		beras: 'Beras',
		uang: 'Uang'
	};

	const statusHewanLabel: Record<string, string> = {
		hidup: 'Hidup',
		sembelih: 'Sembelih',
		bagi: 'Bagi'
	};

	const kasTypeLabel: Record<string, string> = {
		masuk: 'Pemasukan',
		keluar: 'Pengeluaran'
	};

	const receiverDefault = data.currentUser?.username || data.currentUser?.email || '';
	const orgLabel = data.org?.type === 'musholla' ? 'Musholla' : 'Masjid';

	let zakatProgramId = data.activeProgramId || data.programs[0]?.id || '';
	let qurbanProgramId = data.activeProgramId || data.programs[0]?.id || '';
	let diterimaOleh = receiverDefault;

	const refreshOnSuccess = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				location.reload();
			}
		};
	};
</script>

<svelte:head>
	<title>Solusi Ummah - {data.org?.name ?? 'Lembaga'}</title>
</svelte:head>

<div class="space-y-8">
	<header class="space-y-2">
		<p class="text-xs uppercase tracking-[0.3em] text-emerald-600">Solusi Ummah</p>
		<h1 class="text-2xl md:text-3xl font-bold text-slate-900">Zakat &amp; Qurban - {data.org?.name}</h1>
		<p class="text-sm text-slate-500">Kelola pencatatan zakat dan qurban untuk lembaga ini saja.</p>
	</header>

	<div class="grid gap-4 md:grid-cols-3">
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total Beras</p>
			<p class="text-2xl font-bold text-emerald-600">{formatNumber(data.totals?.beras)} kg</p>
			<p class="text-xs text-slate-400">Akumulasi lokal</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total Uang</p>
			<p class="text-2xl font-bold text-blue-600">Rp {formatNumber(data.totals?.uang)}</p>
			<p class="text-xs text-slate-400">Akumulasi lokal</p>
		</div>
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-slate-500">Total Jiwa</p>
			<p class="text-2xl font-bold text-slate-900">{formatNumber(data.totals?.jiwa)}</p>
			<p class="text-xs text-slate-400">Dari semua transaksi</p>
		</div>
	</div>

	{#if data.canManageKas}
		<section class="grid gap-6 lg:grid-cols-2">
			<div class="rounded-2xl border bg-white p-6 shadow-sm">
				<h2 class="text-lg font-semibold text-slate-900">Kas {orgLabel}</h2>
				<p class="text-xs text-slate-500">Catat pemasukan dan pengeluaran untuk laporan transparan.</p>
				<div class="mt-4 grid gap-3 md:grid-cols-3">
					<div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
						<p class="text-xs uppercase text-emerald-700">Saldo</p>
						<p class="text-lg font-bold text-emerald-700">{formatCurrency(data.kasSummary?.saldo)}</p>
					</div>
					<div class="rounded-xl border border-blue-100 bg-blue-50 p-3">
						<p class="text-xs uppercase text-blue-700">Pemasukan</p>
						<p class="text-lg font-bold text-blue-700">{formatCurrency(data.kasSummary?.masuk)}</p>
					</div>
					<div class="rounded-xl border border-amber-100 bg-amber-50 p-3">
						<p class="text-xs uppercase text-amber-700">Pengeluaran</p>
						<p class="text-lg font-bold text-amber-700">{formatCurrency(data.kasSummary?.keluar)}</p>
					</div>
				</div>

				<form method="POST" action="?/addKas" class="mt-6 space-y-4" use:enhance={refreshOnSuccess}>
					<div class="grid gap-3 md:grid-cols-2">
						<input type="date" name="tanggal" class="input input-bordered w-full" required />
						<select name="tipe" class="select select-bordered w-full" required>
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
							required
						/>
						<textarea
							name="keterangan"
							rows="2"
							placeholder="Keterangan singkat"
							class="textarea textarea-bordered w-full md:col-span-2"
						></textarea>
					</div>
					<button class="btn btn-primary w-full">Simpan Kas</button>
				</form>
			</div>

			<div class="rounded-2xl border bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-slate-900">Rekap Kas Terbaru</h2>
					<span class="text-xs text-slate-400">{data.kasEntries.length} transaksi</span>
				</div>
				{#if data.kasEntries.length === 0}
					<p class="mt-4 text-sm text-slate-500">Belum ada catatan kas.</p>
				{:else}
					<div class="mt-4 overflow-auto">
						<table class="table table-zebra w-full text-sm">
							<thead>
								<tr>
									<th>Tanggal</th>
									<th>Kategori</th>
									<th>Keterangan</th>
									<th>Tipe</th>
									<th>Nominal</th>
								</tr>
							</thead>
							<tbody>
								{#each data.kasEntries as row}
									<tr>
										<td>{formatDate(row.tanggal)}</td>
										<td>{row.kategori}</td>
										<td>{row.keterangan || '-'}</td>
										<td>{kasTypeLabel[row.tipe] ?? row.tipe}</td>
										<td class={row.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}>
											{row.tipe === 'masuk' ? '+' : '-'} {formatCurrency(row.nominal)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-slate-900">Program Amal</h2>
				<span class="text-xs text-slate-400">{data.programs.length} program</span>
			</div>
			<form
				method="POST"
				action="?/createProgram"
				class="mt-4 grid gap-3 md:grid-cols-3"
				use:enhance={refreshOnSuccess}
			>
				<input
					type="text"
					name="namaProgram"
					placeholder="Nama program"
					class="input input-bordered w-full"
					required
				/>
				<input
					type="number"
					name="tahun"
					placeholder="Tahun"
					class="input input-bordered w-full"
					min="2000"
					required
				/>
				<select name="status" class="select select-bordered w-full">
					<option value="open">Open</option>
					<option value="closed">Closed</option>
				</select>
				<div class="md:col-span-3">
					<button class="btn btn-primary w-full">Tambah Program</button>
				</div>
			</form>

			{#if data.programs.length === 0}
				<p class="mt-4 text-sm text-slate-500">Buat program dulu untuk mulai input zakat atau qurban.</p>
			{:else}
				<div class="mt-4 space-y-2">
					{#each data.programs as program}
						<div class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
							<div>
								<p class="font-medium text-slate-800">{program.namaProgram}</p>
								<p class="text-xs text-slate-500">{program.tahun}</p>
							</div>
							<span class="badge badge-outline">{statusLabel[program.status] ?? program.status}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Input Zakat</h2>
			<p class="text-xs text-slate-500">Simpan transaksi zakat secepat mungkin.</p>
			<form method="POST" action="?/addZakat" class="mt-4 space-y-4" use:enhance={refreshOnSuccess}>
				<div class="grid gap-3 md:grid-cols-2">
					<select
						name="programId"
						class="select select-bordered w-full"
						bind:value={zakatProgramId}
						disabled={!data.programs.length}
						required
					>
						<option value="" disabled>Pilih program</option>
						{#each data.programs as program}
							<option value={program.id}>{program.namaProgram}</option>
						{/each}
					</select>
					<input
						type="text"
						name="namaMuzakki"
						placeholder="Nama muzakki"
						class="input input-bordered w-full"
						required
					/>
					<input
						type="number"
						name="jumlahJiwa"
						placeholder="Jumlah jiwa"
						class="input input-bordered w-full"
						min="1"
						required
					/>
					<select name="jenisBayar" class="select select-bordered w-full" required>
						<option value="beras">Beras</option>
						<option value="uang">Uang</option>
					</select>
					<input
						type="number"
						name="nominal"
						placeholder="Nominal (kg / rupiah)"
						class="input input-bordered w-full"
						min="0"
						required
					/>
					<input
						type="text"
						name="diterimaOleh"
						placeholder="Diterima oleh"
						class="input input-bordered w-full"
						bind:value={diterimaOleh}
						required
					/>
				</div>
				<button class="btn btn-primary w-full" disabled={!data.programs.length}>Simpan Zakat</button>
			</form>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Input Qurban</h2>
			<p class="text-xs text-slate-500">Pisahkan nama sohibul qurban dengan koma jika patungan.</p>
			<form method="POST" action="?/addQurban" class="mt-4 space-y-4" use:enhance={refreshOnSuccess}>
				<div class="grid gap-3 md:grid-cols-2">
					<select
						name="programId"
						class="select select-bordered w-full"
						bind:value={qurbanProgramId}
						disabled={!data.programs.length}
						required
					>
						<option value="" disabled>Pilih program</option>
						{#each data.programs as program}
							<option value={program.id}>{program.namaProgram}</option>
						{/each}
					</select>
					<select name="jenisHewan" class="select select-bordered w-full" required>
						<option value="sapi">Sapi</option>
						<option value="kambing">Kambing</option>
						<option value="domba">Domba</option>
						<option value="kerbau">Kerbau</option>
					</select>
					<select name="statusHewan" class="select select-bordered w-full" required>
						<option value="hidup">Hidup</option>
						<option value="sembelih">Sembelih</option>
						<option value="bagi">Bagi</option>
					</select>
					<input
						type="text"
						name="namaSohibul"
						placeholder="Nama sohibul qurban"
						class="input input-bordered w-full md:col-span-2"
						required
					/>
				</div>
				<button class="btn btn-primary w-full" disabled={!data.programs.length}>Simpan Qurban</button>
			</form>
		</div>

		<div class="rounded-2xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Rekap Zakat Terbaru</h2>
			{#if data.zakat.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada transaksi zakat.</p>
			{:else}
				<div class="mt-4 overflow-auto">
					<table class="table table-zebra w-full text-sm">
						<thead>
							<tr>
								<th>Nama</th>
								<th>Program</th>
								<th>Jenis</th>
								<th>Nominal</th>
								<th>Jiwa</th>
								<th>Tanggal</th>
							</tr>
						</thead>
						<tbody>
							{#each data.zakat as row}
								<tr>
									<td>{row.namaMuzakki}</td>
									<td>{row.namaProgram}</td>
									<td>{jenisLabel[row.jenisBayar] ?? row.jenisBayar}</td>
									<td>
										{row.jenisBayar === 'uang'
											? `Rp ${formatNumber(row.nominal)}`
											: `${formatNumber(row.nominal)} kg`}
									</td>
									<td>{row.jumlahJiwa}</td>
									<td>{formatDate(row.createdAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-900">Rekap Qurban Terbaru</h2>
		{#if data.qurban.length === 0}
			<p class="mt-4 text-sm text-slate-500">Belum ada data qurban.</p>
		{:else}
			<div class="mt-4 overflow-auto">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Nama Sohibul</th>
							<th>Jenis</th>
							<th>Status</th>
							<th>Program</th>
							<th>Tanggal</th>
						</tr>
					</thead>
					<tbody>
						{#each data.qurban as row}
							<tr>
								<td>{row.namaSohibulQurban.join(', ')}</td>
								<td>{row.jenisHewan}</td>
								<td>{statusHewanLabel[row.statusHewan] ?? row.statusHewan}</td>
								<td>{row.namaProgram}</td>
								<td>{formatDate(row.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
