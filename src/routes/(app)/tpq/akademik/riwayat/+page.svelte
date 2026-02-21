<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const formatDate = (value: string) =>
		new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	const formatDateTime = (value: number | null) =>
		value
			? new Date(value).toLocaleString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '-';
</script>

<svelte:head>
	<title>TPQ Akademik - Riwayat</title>
</svelte:head>

<div class="space-y-6">
	<div class="rounded-3xl border bg-gradient-to-r from-cyan-700 via-sky-700 to-indigo-700 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">TPQ Daily Academic Workflow v1</p>
		<h1 class="mt-2 text-3xl font-bold">Riwayat Setoran</h1>
		<p class="mt-1 text-sm text-white/90">Pantau status setoran: submitted, approved, rejected.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap gap-2 text-sm">
			{#if data.role === 'admin' || data.role === 'ustadz' || data.role === 'ustadzah'}
				<a class="btn btn-sm btn-outline" href="/tpq/akademik/setoran">Setoran</a>
			{/if}
			{#if data.role === 'admin' || data.role === 'koordinator'}
				<a class="btn btn-sm btn-outline" href="/tpq/akademik/review">Review</a>
			{/if}
			<a class="btn btn-sm btn-primary" href="/tpq/akademik/riwayat">Riwayat</a>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Submitted Hari Ini</p>
			<p class="mt-2 text-2xl font-semibold text-amber-600">{data.todaySummary.submitted}</p>
		</div>
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Approved Hari Ini</p>
			<p class="mt-2 text-2xl font-semibold text-emerald-600">{data.todaySummary.approved}</p>
		</div>
		<div class="rounded-xl border bg-white p-4 shadow-sm">
			<p class="text-xs uppercase tracking-wide text-slate-500">Rejected Hari Ini</p>
			<p class="mt-2 text-2xl font-semibold text-rose-600">{data.todaySummary.rejected}</p>
		</div>
	</div>

	<div class="rounded-2xl border bg-white p-5 shadow-sm">
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-slate-900">Filter Riwayat</h2>
			<p class="text-sm text-slate-500">Menampilkan {data.totalRows} data sesuai scope role Anda.</p>
		</div>
		<form method="GET" class="grid gap-3 md:grid-cols-4">
			<label class="form-control">
				<span class="label-text text-sm font-medium">Dari Tanggal</span>
				<input class="input input-bordered" type="date" name="date_from" value={data.filters.dateFrom} />
			</label>
			<label class="form-control">
				<span class="label-text text-sm font-medium">Sampai Tanggal</span>
				<input class="input input-bordered" type="date" name="date_to" value={data.filters.dateTo} />
			</label>
			<label class="form-control">
				<span class="label-text text-sm font-medium">Status</span>
				<select class="select select-bordered" name="status">
					<option value="">Semua</option>
					<option value="submitted" selected={data.filters.status === 'submitted'}>submitted</option>
					<option value="approved" selected={data.filters.status === 'approved'}>approved</option>
					<option value="rejected" selected={data.filters.status === 'rejected'}>rejected</option>
				</select>
			</label>
			<label class="form-control">
				<span class="label-text text-sm font-medium">Tipe</span>
				<select class="select select-bordered" name="type">
					<option value="">Semua</option>
					<option value="hafalan" selected={data.filters.type === 'hafalan'}>hafalan</option>
					<option value="murojaah" selected={data.filters.type === 'murojaah'}>murojaah</option>
				</select>
			</label>

			<label class="form-control">
				<span class="label-text text-sm font-medium">Halaqoh</span>
				<select class="select select-bordered" name="halaqoh_id">
					<option value="">Semua halaqoh</option>
					{#each data.filterOptions.halaqoh as row}
						<option value={row.id} selected={data.filters.halaqohId === row.id}>{row.label}</option>
					{/each}
				</select>
			</label>

			{#if data.canFilterByUser}
				<label class="form-control">
					<span class="label-text text-sm font-medium">Santri</span>
					<select class="select select-bordered" name="santri_user_id">
						<option value="">Semua santri</option>
						{#each data.filterOptions.santri as row}
							<option value={row.id} selected={data.filters.santriUserId === row.id}>{row.label}</option>
						{/each}
					</select>
				</label>
			{/if}

			{#if data.canFilterByUstadz}
				<label class="form-control">
					<span class="label-text text-sm font-medium">Ustadz</span>
					<select class="select select-bordered" name="ustadz_user_id">
						<option value="">Semua ustadz</option>
						{#each data.filterOptions.ustadz as row}
							<option value={row.id} selected={data.filters.ustadzUserId === row.id}>{row.label}</option>
						{/each}
					</select>
				</label>
			{/if}

			<div class="form-control justify-end">
				<span class="label hidden md:inline-flex"><span class="label-text">&nbsp;</span></span>
				<button class="btn btn-primary" type="submit">Terapkan Filter</button>
			</div>
		</form>
	</div>

	<div class="rounded-2xl border bg-white p-5 shadow-sm">
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-slate-900">Daftar Riwayat</h2>
		</div>

		{#if data.riwayat.length === 0}
			<div class="rounded-xl border border-dashed p-5 text-sm text-slate-500">
				Belum ada riwayat setoran pada filter saat ini.
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border">
				<table class="table table-zebra">
					<thead>
						<tr class="bg-slate-50">
							<th>Tanggal</th>
							<th>Santri</th>
							<th>Setoran</th>
							<th>Status</th>
							<th>Review</th>
							<th>Halaqoh</th>
						</tr>
					</thead>
					<tbody>
						{#each data.riwayat as row}
							<tr>
								<td class="text-sm">{formatDate(row.date)}</td>
								<td class="text-sm">
									<div class="font-medium text-slate-900">{row.santriName || '-'}</div>
									<div class="text-xs text-slate-500">{row.ustadzName || '-'}</div>
								</td>
								<td class="text-sm">
									<div class="font-medium text-slate-900">Surah {row.surah} · Ayat {row.ayatFrom}-{row.ayatTo}</div>
									<div class="text-xs text-slate-500 capitalize">{row.type} · {row.quality}</div>
									{#if row.notes}
										<div class="mt-1 text-xs text-slate-500">{row.notes}</div>
									{/if}
								</td>
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
								<td class="text-xs">
									<div>{row.reviewerName || '-'}</div>
									<div class="text-slate-500">{formatDateTime(row.reviewedAt)}</div>
								</td>
								<td class="text-sm">{row.halaqohName || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
