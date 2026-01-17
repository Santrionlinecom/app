<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	type ImamRow = {
		id: string;
		tanggal: string;
		hari: string | null;
		waktu: string;
		imam: string;
		catatan: string | null;
	};

	type TarawihRow = {
		id: string;
		urut: number;
		hari: string;
		tanggal: string;
		imam: string;
		bilal: string | null;
	};

	type KhotibRow = {
		id: string;
		tanggal: string;
		hari: string | null;
		khotib: string;
		imam: string | null;
		catatan: string | null;
	};

	const orgName = data.org?.name ?? 'Lembaga';
	const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	const formatDate = (value?: string | null) => {
		if (!value) return '-';
		const date = new Date(`${value}T00:00:00`);
		return Number.isNaN(date.getTime())
			? value
			: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const formatDay = (row: { hari?: string | null; tanggal?: string | null }) => {
		if (row.hari) return row.hari;
		if (!row.tanggal) return '-';
		const date = new Date(`${row.tanggal}T00:00:00`);
		if (Number.isNaN(date.getTime())) return '-';
		return dayNames[date.getDay()] ?? '-';
	};

	let imamSchedule: ImamRow[] = [];
	let tarawihSchedule: TarawihRow[] = [];
	let khotibSchedule: KhotibRow[] = [];
	let nextTarawihUrut = 1;

	let imamId = '';
	let imamTanggal = '';
	let imamWaktu = '';
	let imamNama = '';
	let imamCatatan = '';
	let imamFormRef: HTMLFormElement | null = null;

	let tarawihId = '';
	let tarawihUrut = '1';
	let tarawihHari = '';
	let tarawihTanggal = '';
	let tarawihImam = '';
	let tarawihBilal = '';
	let tarawihFormRef: HTMLFormElement | null = null;
	let tarawihInitialized = false;

	let khotibId = '';
	let khotibTanggal = '';
	let khotibNama = '';
	let khotibImam = '';
	let khotibCatatan = '';
	let khotibFormRef: HTMLFormElement | null = null;

	let actionError = '';

	$: {
		imamSchedule = (data.imamSchedule ?? []) as ImamRow[];
		tarawihSchedule = (data.tarawihSchedule ?? []) as TarawihRow[];
		khotibSchedule = (data.khotibSchedule ?? []) as KhotibRow[];
		nextTarawihUrut = data.nextTarawihUrut ?? 1;

		if (!tarawihInitialized) {
			tarawihUrut = `${nextTarawihUrut}`;
			tarawihInitialized = true;
		}
	}

	const startEditImam = (row: ImamRow) => {
		imamId = row.id;
		imamTanggal = row.tanggal;
		imamWaktu = row.waktu;
		imamNama = row.imam;
		imamCatatan = row.catatan ?? '';
		imamFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const resetImamForm = () => {
		imamId = '';
		imamTanggal = '';
		imamWaktu = '';
		imamNama = '';
		imamCatatan = '';
	};

	const startEditTarawih = (row: TarawihRow) => {
		tarawihId = row.id;
		tarawihUrut = `${row.urut}`;
		tarawihHari = row.hari;
		tarawihTanggal = row.tanggal;
		tarawihImam = row.imam;
		tarawihBilal = row.bilal ?? '';
		tarawihFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const resetTarawihForm = () => {
		tarawihId = '';
		tarawihUrut = `${nextTarawihUrut}`;
		tarawihHari = '';
		tarawihTanggal = '';
		tarawihImam = '';
		tarawihBilal = '';
	};

	const startEditKhotib = (row: KhotibRow) => {
		khotibId = row.id;
		khotibTanggal = row.tanggal;
		khotibNama = row.khotib;
		khotibImam = row.imam ?? '';
		khotibCatatan = row.catatan ?? '';
		khotibFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const resetKhotibForm = () => {
		khotibId = '';
		khotibTanggal = '';
		khotibNama = '';
		khotibImam = '';
		khotibCatatan = '';
	};

	const handleAction = () => {
		return async ({ result }: { result: { type: string; data?: { error?: string } } }) => {
			if (result.type === 'success') {
				actionError = '';
				location.reload();
				return;
			}
			if (result.type === 'failure') {
				actionError = result.data?.error ?? 'Gagal memproses jadwal.';
			}
		};
	};
</script>

<svelte:head>
	<title>Jadwal | SantriOnline</title>
</svelte:head>

<div class="space-y-6">
	<header class="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.3em] text-white/80">Dashboard Jadwal</p>
		<h1 class="text-2xl md:text-3xl font-bold mt-2">Kelola Jadwal {orgName}</h1>
		<p class="text-sm text-white/90 mt-1">Imam harian, tarawih Ramadan, dan khotib Jumat.</p>
	</header>

	{#if actionError}
		<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{actionError}
		</div>
	{/if}

	<section class="space-y-6">
		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-emerald-600">Jadwal Harian</p>
			<h2 class="text-xl md:text-2xl font-semibold text-slate-900 mt-2">Jadwal Imam Sholat</h2>
			<p class="text-sm text-slate-600 mt-1">Impor via Excel atau isi manual per waktu sholat.</p>
		</div>

		<div class="grid gap-6 xl:grid-cols-3">
			<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
				<h3 class="text-lg font-semibold text-slate-900">Import Excel</h3>
				<p class="text-xs text-slate-500 mt-2">
					Kolom wajib: <strong>tanggal</strong>, <strong>waktu/sholat</strong>, <strong>imam</strong>.
					Opsional: <strong>hari</strong>, <strong>catatan</strong>.
				</p>
				<form
					method="POST"
					action="?/importImam"
					enctype="multipart/form-data"
					class="mt-4 space-y-3"
					use:enhance={handleAction}
				>
					<a
						href="/templates/jadwal-imam-template.xlsx"
						class="btn btn-outline w-full"
						download
					>
						Download Template
					</a>
					<input
						type="file"
						name="file"
						accept=".xlsx,.xls,.csv"
						class="file-input file-input-bordered w-full"
						required
					/>
					<button class="btn btn-primary w-full">Upload Jadwal</button>
				</form>
			</div>

			<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur xl:col-span-2">
				<h3 class="text-lg font-semibold text-slate-900">Input Manual</h3>
				<form
					method="POST"
					action={imamId ? '?/updateImam' : '?/addImam'}
					class="mt-4 space-y-4"
					use:enhance={handleAction}
					bind:this={imamFormRef}
				>
					{#if imamId}
						<input type="hidden" name="id" value={imamId} />
						<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
							Sedang mengedit jadwal. Simpan untuk memperbarui atau batalkan.
						</div>
					{/if}
					<div class="grid gap-3 md:grid-cols-2">
						<input
							type="date"
							name="tanggal"
							class="input input-bordered w-full"
							bind:value={imamTanggal}
							required
						/>
						<input
							type="text"
							name="waktu"
							list="waktuImamList"
							placeholder="Waktu/Sholat (misal: Subuh)"
							class="input input-bordered w-full"
							bind:value={imamWaktu}
							required
						/>
						<input
							type="text"
							name="imam"
							placeholder="Nama imam"
							class="input input-bordered w-full"
							bind:value={imamNama}
							required
						/>
						<input
							type="text"
							name="catatan"
							placeholder="Catatan (opsional)"
							class="input input-bordered w-full"
							bind:value={imamCatatan}
						/>
					</div>
					<datalist id="waktuImamList">
						<option value="Subuh"></option>
						<option value="Dzuhur"></option>
						<option value="Ashar"></option>
						<option value="Maghrib"></option>
						<option value="Isya"></option>
					</datalist>
					<div class="flex flex-col gap-2 sm:flex-row">
						<button class="btn btn-primary w-full sm:flex-1">
							{imamId ? 'Perbarui Jadwal' : 'Tambah Jadwal'}
						</button>
						{#if imamId}
							<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetImamForm}>
								Batal Edit
							</button>
						{/if}
					</div>
				</form>
			</div>
		</div>

		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Daftar Jadwal Imam</h3>
				<span class="text-xs text-slate-500">{imamSchedule.length} jadwal</span>
			</div>
			{#if imamSchedule.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada jadwal imam.</p>
			{:else}
				<div class="mt-4 space-y-3 md:hidden">
					{#each imamSchedule as row}
						<div class={`rounded-2xl border p-4 shadow-sm ${imamId === row.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
							<div class="flex items-center justify-between">
								<p class="text-sm font-semibold text-slate-900">{row.waktu}</p>
								<span class="text-xs text-slate-500">{formatDate(row.tanggal)}</span>
							</div>
							<p class="mt-2 text-xs text-slate-500">Hari: {formatDay(row)}</p>
							<p class="mt-1 text-xs text-slate-500">Imam: {row.imam}</p>
							{#if row.catatan}
								<p class="mt-1 text-xs text-slate-500">{row.catatan}</p>
							{/if}
							<div class="mt-3 flex flex-wrap gap-2">
								<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditImam(row)}>
									Edit
								</button>
								<form method="POST" action="?/deleteImam" use:enhance={handleAction}>
									<input type="hidden" name="id" value={row.id} />
									<button
										type="submit"
										class="btn btn-xs btn-ghost text-red-600"
										on:click={(event) => {
											if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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
								<th>Hari</th>
								<th>Waktu</th>
								<th>Imam</th>
								<th>Catatan</th>
								<th>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{#each imamSchedule as row}
								<tr class={imamId === row.id ? 'bg-amber-50' : ''}>
									<td>{formatDate(row.tanggal)}</td>
									<td>{formatDay(row)}</td>
									<td>{row.waktu}</td>
									<td>{row.imam}</td>
									<td>{row.catatan || '-'}</td>
									<td>
										<div class="flex flex-wrap gap-2">
											<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditImam(row)}>
												Edit
											</button>
											<form method="POST" action="?/deleteImam" use:enhance={handleAction}>
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="btn btn-xs btn-ghost text-red-600"
													on:click={(event) => {
														if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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

	<section class="space-y-6">
		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-amber-600">Ramadan</p>
			<h2 class="text-xl md:text-2xl font-semibold text-slate-900 mt-2">Jadwal Imam & Bilal Tarawih</h2>
			<p class="text-sm text-slate-600 mt-1">Susunan imam dan bilal untuk 30 malam tarawih.</p>
		</div>

		<div class="grid gap-6 xl:grid-cols-2">
			<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${tarawihId ? 'xl:col-span-2' : ''}`}>
				<h3 class="text-lg font-semibold text-slate-900">Input Jadwal Tarawih</h3>
				<form
					method="POST"
					action={tarawihId ? '?/updateTarawih' : '?/addTarawih'}
					class="mt-4 space-y-4"
					use:enhance={handleAction}
					bind:this={tarawihFormRef}
				>
					{#if tarawihId}
						<input type="hidden" name="id" value={tarawihId} />
						<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
							Sedang mengedit jadwal. Simpan untuk memperbarui atau batalkan.
						</div>
					{/if}
					<div class="grid gap-3 md:grid-cols-2">
						<input
							type="number"
							name="urut"
							min="1"
							max="30"
							placeholder="No. (1-30)"
							class="input input-bordered w-full"
							bind:value={tarawihUrut}
							required
						/>
						<input
							type="text"
							name="hari"
							list="tarawihHariList"
							placeholder="Hari (misal: Kamis)"
							class="input input-bordered w-full"
							bind:value={tarawihHari}
							required
						/>
						<input
							type="text"
							name="tanggal"
							placeholder="Tanggal (misal: 12 Ramadhan 1446 H)"
							class="input input-bordered w-full"
							bind:value={tarawihTanggal}
							required
						/>
						<input
							type="text"
							name="imam"
							placeholder="Nama imam"
							class="input input-bordered w-full"
							bind:value={tarawihImam}
							required
						/>
						<input
							type="text"
							name="bilal"
							placeholder="Nama bilal (opsional)"
							class="input input-bordered w-full"
							bind:value={tarawihBilal}
						/>
					</div>
					<datalist id="tarawihHariList">
						<option value="Senin"></option>
						<option value="Selasa"></option>
						<option value="Rabu"></option>
						<option value="Kamis"></option>
						<option value="Jumat"></option>
						<option value="Sabtu"></option>
						<option value="Ahad"></option>
					</datalist>
					<div class="flex flex-col gap-2 sm:flex-row">
						<button class="btn btn-primary w-full sm:flex-1">
							{tarawihId ? 'Perbarui Jadwal' : 'Tambah Jadwal'}
						</button>
						{#if tarawihId}
							<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetTarawihForm}>
								Batal Edit
							</button>
						{/if}
					</div>
				</form>
			</div>

			<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${tarawihId ? 'xl:col-span-2' : ''}`}>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">Daftar Tarawih</h3>
					<span class="text-xs text-slate-500">{tarawihSchedule.length} malam</span>
				</div>
				{#if tarawihSchedule.length === 0}
					<p class="mt-4 text-sm text-slate-500">Belum ada jadwal tarawih.</p>
				{:else}
					<div class="mt-4 space-y-3 md:hidden">
						{#each tarawihSchedule as row}
							<div class={`rounded-2xl border p-4 shadow-sm ${tarawihId === row.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-slate-900">{row.urut}. {row.hari}</p>
									<span class="text-xs text-slate-500">{row.tanggal}</span>
								</div>
								<p class="mt-2 text-xs text-slate-500">Imam: {row.imam}</p>
								<p class="mt-1 text-xs text-slate-500">Bilal: {row.bilal || '-'}</p>
								<div class="mt-3 flex flex-wrap gap-2">
									<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditTarawih(row)}>
										Edit
									</button>
									<form method="POST" action="?/deleteTarawih" use:enhance={handleAction}>
										<input type="hidden" name="id" value={row.id} />
										<button
											type="submit"
											class="btn btn-xs btn-ghost text-red-600"
											on:click={(event) => {
												if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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
									<th>No</th>
									<th>Hari</th>
									<th>Tanggal</th>
									<th>Imam</th>
									<th>Bilal</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each tarawihSchedule as row}
									<tr class={tarawihId === row.id ? 'bg-amber-50' : ''}>
										<td>{row.urut}</td>
										<td>{row.hari}</td>
										<td>{row.tanggal}</td>
										<td>{row.imam}</td>
										<td>{row.bilal || '-'}</td>
										<td>
											<div class="flex flex-wrap gap-2">
												<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditTarawih(row)}>
													Edit
												</button>
												<form method="POST" action="?/deleteTarawih" use:enhance={handleAction}>
													<input type="hidden" name="id" value={row.id} />
													<button
														type="submit"
														class="btn btn-xs btn-ghost text-red-600"
														on:click={(event) => {
															if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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
		</div>
	</section>

	<section class="space-y-6">
		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-500">Jumat</p>
			<h2 class="text-xl md:text-2xl font-semibold text-slate-900 mt-2">Jadwal Khotib Jumat</h2>
			<p class="text-sm text-slate-600 mt-1">Simpan daftar khotib dan imam sholat Jumat.</p>
		</div>

		<div class="grid gap-6 xl:grid-cols-2">
			<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${khotibId ? 'xl:col-span-2' : ''}`}>
				<h3 class="text-lg font-semibold text-slate-900">Input Jadwal Khotib</h3>
				<form
					method="POST"
					action={khotibId ? '?/updateKhotib' : '?/addKhotib'}
					class="mt-4 space-y-4"
					use:enhance={handleAction}
					bind:this={khotibFormRef}
				>
					{#if khotibId}
						<input type="hidden" name="id" value={khotibId} />
						<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
							Sedang mengedit jadwal. Simpan untuk memperbarui atau batalkan.
						</div>
					{/if}
					<div class="grid gap-3 md:grid-cols-2">
						<input
							type="date"
							name="tanggal"
							class="input input-bordered w-full"
							bind:value={khotibTanggal}
							required
						/>
						<input
							type="text"
							name="khotib"
							placeholder="Nama khotib"
							class="input input-bordered w-full"
							bind:value={khotibNama}
							required
						/>
						<input
							type="text"
							name="imam"
							placeholder="Nama imam (opsional)"
							class="input input-bordered w-full"
							bind:value={khotibImam}
						/>
						<input
							type="text"
							name="catatan"
							placeholder="Catatan / Tema (opsional)"
							class="input input-bordered w-full"
							bind:value={khotibCatatan}
						/>
					</div>
					<div class="flex flex-col gap-2 sm:flex-row">
						<button class="btn btn-primary w-full sm:flex-1">
							{khotibId ? 'Perbarui Jadwal' : 'Tambah Jadwal'}
						</button>
						{#if khotibId}
							<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetKhotibForm}>
								Batal Edit
							</button>
						{/if}
					</div>
				</form>
			</div>

			<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${khotibId ? 'xl:col-span-2' : ''}`}>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">Daftar Khotib Jumat</h3>
					<span class="text-xs text-slate-500">{khotibSchedule.length} jadwal</span>
				</div>
				{#if khotibSchedule.length === 0}
					<p class="mt-4 text-sm text-slate-500">Belum ada jadwal khotib Jumat.</p>
				{:else}
					<div class="mt-4 space-y-3 md:hidden">
						{#each khotibSchedule as row}
							<div class={`rounded-2xl border p-4 shadow-sm ${khotibId === row.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-slate-900">{row.khotib}</p>
									<span class="text-xs text-slate-500">{formatDate(row.tanggal)}</span>
								</div>
								<p class="mt-2 text-xs text-slate-500">Hari: {formatDay(row)}</p>
								<p class="mt-1 text-xs text-slate-500">Imam: {row.imam || '-'}</p>
								{#if row.catatan}
									<p class="mt-1 text-xs text-slate-500">{row.catatan}</p>
								{/if}
								<div class="mt-3 flex flex-wrap gap-2">
									<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditKhotib(row)}>
										Edit
									</button>
									<form method="POST" action="?/deleteKhotib" use:enhance={handleAction}>
										<input type="hidden" name="id" value={row.id} />
										<button
											type="submit"
											class="btn btn-xs btn-ghost text-red-600"
											on:click={(event) => {
												if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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
									<th>Hari</th>
									<th>Khotib</th>
									<th>Imam</th>
									<th>Catatan</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each khotibSchedule as row}
									<tr class={khotibId === row.id ? 'bg-amber-50' : ''}>
										<td>{formatDate(row.tanggal)}</td>
										<td>{formatDay(row)}</td>
										<td>{row.khotib}</td>
										<td>{row.imam || '-'}</td>
										<td>{row.catatan || '-'}</td>
										<td>
											<div class="flex flex-wrap gap-2">
												<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditKhotib(row)}>
													Edit
												</button>
												<form method="POST" action="?/deleteKhotib" use:enhance={handleAction}>
													<input type="hidden" name="id" value={row.id} />
													<button
														type="submit"
														class="btn btn-xs btn-ghost text-red-600"
														on:click={(event) => {
															if (!confirm('Hapus jadwal ini?')) event.preventDefault();
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
		</div>
	</section>
</div>
