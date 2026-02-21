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
</script>

<svelte:head>
	<title>TPQ Akademik - Review</title>
</svelte:head>

<div class="space-y-6">
	<div class="rounded-3xl border bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">TPQ Daily Academic Workflow v1</p>
		<h1 class="mt-2 text-3xl font-bold">Review Setoran</h1>
		<p class="mt-1 text-sm text-white/90">Koordinator/admin memvalidasi setoran yang masuk.</p>
	</div>

	<div class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-wrap gap-2 text-sm">
			<a class="btn btn-sm btn-outline" href="/tpq/akademik/setoran">Setoran</a>
			<a class="btn btn-sm btn-primary" href="/tpq/akademik/review">Review</a>
			<a class="btn btn-sm btn-outline" href="/tpq/akademik/riwayat">Riwayat</a>
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
			<h2 class="text-lg font-semibold text-slate-900">Filter Review</h2>
			<p class="text-sm text-slate-500">Setoran berstatus `submitted` saja.</p>
		</div>
		<form method="GET" class="grid gap-3 md:grid-cols-4">
			<label class="form-control">
				<span class="label-text text-sm font-medium">Tanggal</span>
				<input class="input input-bordered" type="date" name="date" value={data.filters.date} />
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
			<label class="form-control">
				<span class="label-text text-sm font-medium">Ustadz</span>
				<select class="select select-bordered" name="ustadz_user_id">
					<option value="">Semua ustadz</option>
					{#each data.filterOptions.ustadz as row}
						<option value={row.id} selected={data.filters.ustadzUserId === row.id}>{row.label}</option>
					{/each}
				</select>
			</label>
			<div class="form-control justify-end">
				<span class="label hidden md:inline-flex"><span class="label-text">&nbsp;</span></span>
				<button class="btn btn-primary" type="submit">Terapkan</button>
			</div>
		</form>
	</div>

	<div class="rounded-2xl border bg-white p-5 shadow-sm">
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-slate-900">Daftar Review</h2>
			<p class="text-sm text-slate-500">Total pending: {data.pendingSetoran.length}</p>
		</div>

		{#if form?.reviewError}
			<div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
				{form.reviewError}
			</div>
		{/if}
		{#if form?.reviewMessage}
			<div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
				{form.reviewMessage}
			</div>
		{/if}

		{#if data.pendingSetoran.length === 0}
			<div class="rounded-xl border border-dashed p-5 text-sm text-slate-500">
				Belum ada setoran `submitted` pada filter saat ini.
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border">
				<table class="table table-zebra">
					<thead>
						<tr class="bg-slate-50">
							<th>Tanggal</th>
							<th>Santri</th>
							<th>Setoran</th>
							<th>Ustadz</th>
							<th>Halaqoh</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.pendingSetoran as row}
							<tr>
								<td class="text-sm">{formatDate(row.date)}</td>
								<td class="text-sm">{row.santriName || '-'}</td>
								<td class="text-sm">
									<div class="font-medium text-slate-900">Surah {row.surah} (Ayat {row.ayatFrom}-{row.ayatTo})</div>
									<div class="text-xs text-slate-500 capitalize">
										{row.type} · kualitas {row.quality}
									</div>
									{#if row.notes}
										<div class="mt-1 text-xs text-slate-500">{row.notes}</div>
									{/if}
								</td>
								<td class="text-sm">{row.ustadzName || '-'}</td>
								<td class="text-sm">{row.halaqohName || '-'}</td>
								<td>
									<form method="POST" action="?/review" class="flex gap-2">
										<input type="hidden" name="setoran_id" value={row.id} />
										<button class="btn btn-xs btn-success text-white" type="submit" name="decision" value="approved">
											Approve
										</button>
										<button class="btn btn-xs btn-error text-white" type="submit" name="decision" value="rejected">
											Reject
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
</div>
