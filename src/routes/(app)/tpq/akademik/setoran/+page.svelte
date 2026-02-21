<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const formatDate = (value: string) =>
		new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	const parseSchedule = (value: string) => {
		try {
			const parsed = JSON.parse(value || '{}') as {
				days?: string[];
				start_time?: string | null;
				end_time?: string | null;
			};
			const days = Array.isArray(parsed.days) && parsed.days.length ? parsed.days.join(', ') : '-';
			const time =
				parsed.start_time && parsed.end_time
					? `${parsed.start_time} - ${parsed.end_time}`
					: parsed.start_time
						? parsed.start_time
						: '-';
			return `${days} | ${time}`;
		} catch {
			return '-';
		}
	};
</script>

<svelte:head>
	<title>TPQ Akademik - Setoran</title>
</svelte:head>

<div class="space-y-6">
	<div class="rounded-3xl border bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">TPQ Daily Academic Workflow v1</p>
		<h1 class="mt-2 text-3xl font-bold">Setoran Harian</h1>
		<p class="mt-1 text-sm text-white/90">
			Input setoran santri dan kirim untuk proses review koordinator/admin.
		</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap gap-2 text-sm">
			<a class="btn btn-sm btn-primary" href="/tpq/akademik/setoran">Setoran</a>
			{#if data.role === 'admin'}
				<a class="btn btn-sm btn-outline" href="/tpq/akademik/review">Review</a>
			{/if}
			<a class="btn btn-sm btn-outline" href="/tpq/akademik/riwayat">Riwayat</a>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-4">
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Tanggal</p>
			<p class="mt-2 text-lg font-semibold text-slate-900">{formatDate(data.selectedDate)}</p>
		</div>
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
			<p class="mt-2 text-2xl font-semibold text-amber-600">{data.todaySummary.submitted}</p>
		</div>
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Approved</p>
			<p class="mt-2 text-2xl font-semibold text-emerald-600">{data.todaySummary.approved}</p>
		</div>
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
			<p class="mt-2 text-2xl font-semibold text-rose-600">{data.todaySummary.rejected}</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-2">
			<div class="rounded-2xl border bg-white p-5 shadow-sm">
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-slate-900">Form Setoran</h2>
					<p class="text-sm text-slate-500">Status otomatis disimpan sebagai `submitted`.</p>
				</div>

				{#if form?.createError}
					<div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
						{form.createError}
					</div>
				{/if}
				{#if form?.createMessage}
					<div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
						{form.createMessage}
					</div>
				{/if}

				<form method="POST" action="?/create" class="grid gap-4 md:grid-cols-2">
					<label class="form-control">
						<span class="label-text text-sm font-medium">Tanggal</span>
						<input
							class="input input-bordered"
							type="date"
							name="date"
							value={data.selectedDate}
							required
						/>
					</label>

					<label class="form-control">
						<span class="label-text text-sm font-medium">Jenis Setoran</span>
						<select class="select select-bordered" name="type" required>
							<option value="hafalan">Hafalan</option>
							<option value="murojaah">Murojaah</option>
						</select>
					</label>

					<label class="form-control md:col-span-2">
						<span class="label-text text-sm font-medium">Santri</span>
						<select class="select select-bordered" name="santri_user_id" required>
							<option value="">Pilih santri</option>
							{#each data.santri as row}
								<option value={row.id}>
									{row.username || row.email}
								</option>
							{/each}
						</select>
					</label>

					{#if data.canChooseUstadz}
						<label class="form-control md:col-span-2">
							<span class="label-text text-sm font-medium">Ustadz Pengampu</span>
							<select class="select select-bordered" name="ustadz_user_id">
								<option value="">Gunakan default (akun Anda)</option>
								{#each data.teachers as row}
									<option value={row.id}>
										{row.username || row.email} ({row.role})
									</option>
								{/each}
							</select>
						</label>
					{/if}

					<label class="form-control md:col-span-2">
						<span class="label-text text-sm font-medium">Halaqoh (opsional)</span>
						<select class="select select-bordered" name="halaqoh_id">
							<option value="">Tanpa halaqoh</option>
							{#each data.halaqoh as row}
								<option value={row.id}>
									{row.name} - {row.ustadzName || '-'}
								</option>
							{/each}
						</select>
					</label>

					<label class="form-control">
						<span class="label-text text-sm font-medium">Surah (1-114)</span>
						<input
							class="input input-bordered"
							type="number"
							name="surah"
							min="1"
							max="114"
							placeholder="Contoh: 2"
							required
						/>
					</label>

					<label class="form-control">
						<span class="label-text text-sm font-medium">Kualitas</span>
						<select class="select select-bordered" name="quality" required>
							<option value="lancar">Lancar</option>
							<option value="cukup">Cukup</option>
							<option value="belum">Belum</option>
						</select>
					</label>

					<label class="form-control">
						<span class="label-text text-sm font-medium">Ayat Mulai</span>
						<input class="input input-bordered" type="number" name="ayat_from" min="1" required />
					</label>

					<label class="form-control">
						<span class="label-text text-sm font-medium">Ayat Akhir</span>
						<input class="input input-bordered" type="number" name="ayat_to" min="1" required />
					</label>

					<label class="form-control md:col-span-2">
						<span class="label-text text-sm font-medium">Catatan (opsional)</span>
						<textarea
							class="textarea textarea-bordered min-h-[80px]"
							name="notes"
							placeholder="Catatan bacaan atau koreksi singkat"
						></textarea>
					</label>

					<div class="md:col-span-2">
						<button class="btn btn-primary" type="submit">Simpan Setoran</button>
					</div>
				</form>
			</div>

			<div class="rounded-2xl border bg-white p-5 shadow-sm">
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-slate-900">Setoran Tanggal {formatDate(data.selectedDate)}</h2>
					<p class="text-sm text-slate-500">Menampilkan data yang sudah diinput pada tanggal terpilih.</p>
				</div>

				{#if data.recentSetoran.length === 0}
					<div class="rounded-xl border border-dashed p-5 text-sm text-slate-500">
						Belum ada setoran pada tanggal ini.
					</div>
				{:else}
					<div class="overflow-x-auto rounded-xl border">
						<table class="table table-zebra">
							<thead>
								<tr class="bg-slate-50">
									<th>Santri</th>
									<th>Surah/Ayat</th>
									<th>Jenis</th>
									<th>Kualitas</th>
									<th>Status</th>
									<th>Halaqoh</th>
								</tr>
							</thead>
							<tbody>
								{#each data.recentSetoran as row}
									<tr>
										<td>
											<div class="font-medium text-slate-900">{row.santriName || '-'}</div>
											<div class="text-xs text-slate-500">{row.ustadzName || '-'}</div>
										</td>
										<td class="text-sm">
											<div>Surah {row.surah}</div>
											<div class="text-xs text-slate-500">Ayat {row.ayatFrom}-{row.ayatTo}</div>
										</td>
										<td class="capitalize">{row.type}</td>
										<td class="capitalize">{row.quality}</td>
										<td>
											<span
												class="badge {row.status === 'approved'
													? 'badge-success'
													: row.status === 'rejected'
														? 'badge-error'
														: 'badge-warning'}"
											>
												{row.status}
											</span>
										</td>
										<td>{row.halaqohName || '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-6">
			<div class="rounded-2xl border bg-white p-5 shadow-sm">
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-slate-900">Buat Halaqoh</h2>
					<p class="text-sm text-slate-500">Opsional, untuk grouping setoran dan filter review.</p>
				</div>

				{#if form?.halaqohError}
					<div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
						{form.halaqohError}
					</div>
				{/if}
				{#if form?.halaqohMessage}
					<div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
						{form.halaqohMessage}
					</div>
				{/if}

				<form method="POST" action="?/createHalaqoh" class="space-y-3">
					<label class="form-control">
						<span class="label-text text-sm font-medium">Nama Halaqoh</span>
						<input class="input input-bordered" name="name" placeholder="Halaqoh Ba'da Ashar" required />
					</label>
					<label class="form-control">
						<span class="label-text text-sm font-medium">Hari (pisahkan koma)</span>
						<input class="input input-bordered" name="days" placeholder="senin,rabu,jumat" />
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label class="form-control">
							<span class="label-text text-sm font-medium">Jam Mulai</span>
							<input class="input input-bordered" type="time" name="start_time" />
						</label>
						<label class="form-control">
							<span class="label-text text-sm font-medium">Jam Selesai</span>
							<input class="input input-bordered" type="time" name="end_time" />
						</label>
					</div>
					{#if data.canChooseUstadz}
						<label class="form-control">
							<span class="label-text text-sm font-medium">Ustadz Pengampu</span>
							<select class="select select-bordered" name="ustadz_user_id">
								<option value="">Gunakan default (akun Anda)</option>
								{#each data.teachers as row}
									<option value={row.id}>
										{row.username || row.email} ({row.role})
									</option>
								{/each}
							</select>
						</label>
					{/if}
					<button class="btn btn-outline w-full" type="submit">Simpan Halaqoh</button>
				</form>
			</div>

			<div class="rounded-2xl border bg-white p-5 shadow-sm">
				<h2 class="text-lg font-semibold text-slate-900">Daftar Halaqoh</h2>
				{#if data.halaqoh.length === 0}
					<p class="mt-3 text-sm text-slate-500">Belum ada halaqoh.</p>
				{:else}
					<div class="mt-3 space-y-3">
						{#each data.halaqoh as row}
							<div class="rounded-xl border bg-slate-50/70 p-3">
								<p class="font-semibold text-slate-900">{row.name}</p>
								<p class="text-xs text-slate-500">{row.ustadzName || '-'}</p>
								<p class="mt-1 text-xs text-slate-500">{parseSchedule(row.scheduleJson)}</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
