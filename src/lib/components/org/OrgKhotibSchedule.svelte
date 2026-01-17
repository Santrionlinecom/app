<script lang="ts">
	export let org;
	export let schedule: Array<{
		id?: string;
		tanggal: string;
		hari?: string | null;
		khotib: string;
		imam?: string | null;
		catatan?: string | null;
	}> = [];

	const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	const formatOrgLabel = (value?: string) => {
		if (value === 'musholla') return 'Musholla';
		if (value === 'masjid') return 'Masjid';
		if (value === 'pondok') return 'Pondok';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return 'Lembaga';
	};

	const orgLabel = formatOrgLabel(org?.type);
	const orgName = org?.name ? `${orgLabel} ${org.name}` : orgLabel;

	const formatDate = (value?: string | null) => {
		if (!value) return '-';
		const date = new Date(`${value}T00:00:00`);
		return Number.isNaN(date.getTime())
			? value
			: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const formatDay = (value?: string | null, tanggal?: string) => {
		if (value) return value;
		if (!tanggal) return '-';
		const date = new Date(`${tanggal}T00:00:00`);
		if (Number.isNaN(date.getTime())) return '-';
		return dayNames[date.getDay()] ?? '-';
	};
</script>

<section id="jadwal-khotib" class="max-w-5xl mx-auto px-4 pb-12 space-y-6">
	<div class="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-lg">
		<p class="text-xs uppercase tracking-[0.3em] text-slate-500">Jumat</p>
		<h2 class="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
			Jadwal Khotib Jumat {orgName}
		</h2>
		<p class="text-sm text-slate-600 mt-2">Susunan khotib dan imam untuk sholat Jumat.</p>
	</div>

	{#if schedule.length === 0}
		<div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
			<p class="text-sm text-slate-600">Jadwal khotib Jumat belum tersedia.</p>
			<p class="text-xs text-slate-500 mt-2">Pengurus dapat menambahkan jadwal melalui dashboard.</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Rangkuman Jadwal</h3>
				<span class="text-xs text-slate-500">{schedule.length} jadwal</span>
			</div>
			<div class="mt-4 space-y-3 md:hidden">
				{#each schedule as row}
					<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<p class="text-sm font-semibold text-slate-900">{row.khotib}</p>
							<span class="text-xs text-slate-500">{formatDate(row.tanggal)}</span>
						</div>
						<p class="mt-2 text-xs text-slate-500">Hari: {formatDay(row.hari ?? null, row.tanggal)}</p>
						<p class="mt-1 text-xs text-slate-500">Imam: {row.imam || '-'}</p>
						{#if row.catatan}
							<p class="mt-1 text-xs text-slate-500">{row.catatan}</p>
						{/if}
					</div>
				{/each}
			</div>
			<div class="mt-4 overflow-auto hidden md:block">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Hari</th>
							<th>Khotib</th>
							<th>Imam</th>
							<th>Catatan</th>
						</tr>
					</thead>
					<tbody>
						{#each schedule as row}
							<tr>
								<td>{formatDate(row.tanggal)}</td>
								<td>{formatDay(row.hari ?? null, row.tanggal)}</td>
								<td>{row.khotib}</td>
								<td>{row.imam || '-'}</td>
								<td>{row.catatan || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>
