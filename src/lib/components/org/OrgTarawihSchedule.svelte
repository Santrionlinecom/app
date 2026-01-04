<script lang="ts">
	export let org;
	export let schedule: Array<{
		id?: string;
		urut: number;
		hari: string;
		tanggal: string;
		imam: string;
		bilal?: string | null;
	}> = [];

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
</script>

<section id="jadwal-tarawih" class="max-w-5xl mx-auto px-4 pb-12 space-y-6">
	<div class="rounded-3xl border-2 border-amber-200 bg-white p-6 shadow-lg">
		<p class="text-xs uppercase tracking-[0.3em] text-amber-600">Ramadan</p>
		<h2 class="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
			Jadwal Imam dan Bilal Sholat Tarawih {orgName}
		</h2>
		<p class="text-sm text-slate-600 mt-2">Susunan imam dan bilal per malam tarawih.</p>
	</div>

	{#if schedule.length === 0}
		<div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
			<p class="text-sm text-slate-600">Jadwal tarawih belum tersedia.</p>
			<p class="text-xs text-slate-500 mt-2">Pengurus dapat menambahkan jadwal melalui dashboard lembaga.</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Rangkuman Jadwal</h3>
				<span class="text-xs text-slate-500">{schedule.length} malam</span>
			</div>
			<div class="mt-4 space-y-3 md:hidden">
				{#each schedule as row}
					<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<p class="text-sm font-semibold text-slate-900">{row.urut}. {row.hari}</p>
							<span class="text-xs text-slate-500">{row.tanggal}</span>
						</div>
						<p class="mt-2 text-xs text-slate-500">Imam: {row.imam}</p>
						<p class="mt-1 text-xs text-slate-500">Bilal: {row.bilal || '-'}</p>
					</div>
				{/each}
			</div>
			<div class="mt-4 overflow-auto hidden md:block">
				<table class="table table-zebra w-full text-sm">
					<thead>
						<tr>
							<th>No</th>
							<th>Hari</th>
							<th>Tanggal</th>
							<th>Imam</th>
							<th>Bilal</th>
						</tr>
					</thead>
					<tbody>
						{#each schedule as row}
							<tr>
								<td>{row.urut}</td>
								<td>{row.hari}</td>
								<td>{row.tanggal}</td>
								<td>{row.imam}</td>
								<td>{row.bilal || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>
