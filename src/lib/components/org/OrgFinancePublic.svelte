<script lang="ts">
	export let org;
	export let finance;

	type KasEntry = {
		tanggal: number;
		tipe: string;
		kategori: string;
		keterangan: string | null;
		nominal: number;
	};

	let kas = { masuk: 0, keluar: 0, saldo: 0, updatedAt: null, entries: [] as KasEntry[] };
	let zakat = { beras: 0, uang: 0, jiwa: 0, updatedAt: null as number | null };
	let qurban = {
		total: 0,
		status: { hidup: 0, sembelih: 0, bagi: 0 },
		jenis: [] as { jenis: string; total: number }[],
		updatedAt: null as number | null
	};

	const formatNumber = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID').format(value ?? 0);
	const formatCurrency = (value: number | null | undefined) => `Rp ${formatNumber(value ?? 0)}`;
	const formatDate = (value: number | null | undefined) => {
		if (!value) return '-';
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? '-'
			: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};
	const formatOrgLabel = (value?: string) => {
		if (value === 'musholla') return 'Musholla';
		if (value === 'masjid') return 'Masjid';
		if (value === 'pondok') return 'Pondok';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return 'Lembaga';
	};
	const orgLabel = formatOrgLabel(org?.type);
	let orgLabelLower = 'masjid';

	let hasKas = false;
	let hasZakat = false;
	let hasQurban = false;
	let hasData = false;
	let activityTitle = 'Kegiatan Masjid';
	let activityItems: { code: string; title: string; desc: string; href: string }[] = [];

	const statusLabel: Record<string, string> = {
		hidup: 'Hidup',
		sembelih: 'Sembelih',
		bagi: 'Bagi'
	};

	$: {
		kas = finance?.kas ?? { masuk: 0, keluar: 0, saldo: 0, updatedAt: null, entries: [] };
		zakat = finance?.zakat ?? { beras: 0, uang: 0, jiwa: 0, updatedAt: null };
		qurban =
			finance?.qurban ??
			({
				total: 0,
				status: { hidup: 0, sembelih: 0, bagi: 0 },
				jenis: [],
				updatedAt: null
			} as {
				total: number;
				status: { hidup: number; sembelih: number; bagi: number };
				jenis: { jenis: string; total: number }[];
				updatedAt: number | null;
			});
		hasKas = kas.entries.length > 0 || kas.masuk > 0 || kas.keluar > 0;
		hasZakat = zakat.beras > 0 || zakat.uang > 0 || zakat.jiwa > 0;
		hasQurban = qurban.total > 0;
		hasData = hasKas || hasZakat || hasQurban;
		orgLabelLower = orgLabel === 'Musholla' ? 'musholla' : 'masjid';
		activityTitle = orgLabel === 'Musholla' ? 'Kegiatan Musholla' : 'Kegiatan Masjid';
		const ummahHref = org?.slug ? `/org/${org.slug}/ummah` : '/auth';
		activityItems = [
			{
				code: 'JAM',
				title: 'Sholat Jamaah',
				desc: 'Penguatan shaf, jadwal imam, dan kehadiran jamaah.',
				href: '/fitur/sholat-jamaah'
			},
			{
				code: 'KJN',
				title: 'Pengajian Rutin',
				desc: 'Majelis taklim, kajian mingguan, dan ceramah tematik.',
				href: '/kalender'
			},
			{
				code: 'IST',
				title: 'Istighotsah dan Doa',
				desc: 'Agenda dzikir bersama dan doa untuk warga.',
				href: '/fitur/istighotsah'
			},
			{
				code: 'ZQT',
				title: 'Zakat dan Qurban',
				desc: 'Pelayanan zakat, qurban, dan laporan transparan.',
				href: ummahHref
			}
		];
	}
</script>

<section class="max-w-5xl mx-auto px-4 pb-12 space-y-6">
	<div class="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-lg">
		<p class="text-xs uppercase tracking-[0.3em] text-emerald-600">Transparansi Keuangan</p>
		<h2 class="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
			Laporan Keuangan {orgLabel} {org?.name ?? ''}
		</h2>
		<p class="text-sm text-slate-600 mt-2">
			Ringkasan kas, zakat, dan qurban sebagai bentuk akuntabilitas kepada jamaah.
		</p>
	</div>

	{#if !hasData}
		<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
			<p class="text-sm text-slate-600">Belum ada laporan keuangan yang dipublikasikan.</p>
			<p class="text-xs text-slate-500 mt-2">Pengurus {orgLabelLower} dapat mengisi data melalui dashboard.</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
				<p class="text-xs uppercase text-emerald-700">Saldo Kas</p>
				<p class="text-xl font-bold text-emerald-700 tabular-nums tracking-tight leading-tight break-words sm:text-2xl">
					{formatCurrency(kas.saldo)}
				</p>
				<p class="text-xs text-emerald-700/80">Update: {formatDate(kas.updatedAt)}</p>
			</div>
			<div class="rounded-2xl border border-blue-100 bg-blue-50 p-4">
				<p class="text-xs uppercase text-blue-700">Pemasukan</p>
				<p class="text-xl font-bold text-blue-700 tabular-nums tracking-tight leading-tight break-words sm:text-2xl">
					{formatCurrency(kas.masuk)}
				</p>
				<p class="text-xs text-blue-700/80">Kas masuk terakumulasi</p>
			</div>
			<div class="rounded-2xl border border-amber-100 bg-amber-50 p-4">
				<p class="text-xs uppercase text-amber-700">Pengeluaran</p>
				<p class="text-xl font-bold text-amber-700 tabular-nums tracking-tight leading-tight break-words sm:text-2xl">
					{formatCurrency(kas.keluar)}
				</p>
				<p class="text-xs text-amber-700/80">Kas keluar terakumulasi</p>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<div class="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">Zakat</h3>
					<span class="text-xs text-slate-500">Update: {formatDate(zakat.updatedAt)}</span>
				</div>
				<div class="mt-4 grid gap-3 md:grid-cols-3">
					<div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
						<p class="text-xs uppercase text-emerald-700">Zakat Beras</p>
						<p class="text-lg font-bold text-emerald-700">{formatNumber(zakat.beras)} kg</p>
					</div>
					<div class="rounded-xl border border-blue-100 bg-blue-50 p-3">
						<p class="text-xs uppercase text-blue-700">Zakat Uang</p>
						<p class="text-lg font-bold text-blue-700 tabular-nums tracking-tight leading-tight break-words">
							{formatCurrency(zakat.uang)}
						</p>
					</div>
					<div class="rounded-xl border border-slate-100 bg-slate-50 p-3">
						<p class="text-xs uppercase text-slate-600">Total Jiwa</p>
						<p class="text-lg font-bold text-slate-700">{formatNumber(zakat.jiwa)}</p>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">Qurban</h3>
					<span class="text-xs text-slate-500">Update: {formatDate(qurban.updatedAt)}</span>
				</div>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<div class="rounded-xl border border-amber-100 bg-amber-50 p-3">
						<p class="text-xs uppercase text-amber-700">Total Hewan</p>
						<p class="text-lg font-bold text-amber-700">{formatNumber(qurban.total)}</p>
					</div>
					<div class="rounded-xl border border-slate-100 bg-slate-50 p-3">
						<p class="text-xs uppercase text-slate-600">Status</p>
						<div class="mt-2 space-y-1 text-sm text-slate-700">
							{#each Object.entries(qurban.status) as [key, value]}
								<p>{statusLabel[key] ?? key}: {formatNumber(value)}</p>
							{/each}
						</div>
					</div>
				</div>
				{#if qurban.jenis.length}
					<div class="mt-4 flex flex-wrap gap-2">
						{#each qurban.jenis as item}
							<span class="badge badge-outline">{item.jenis} {formatNumber(item.total)}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Laporan Kas Terbaru</h3>
				<span class="text-xs text-slate-500">{kas.entries.length} transaksi</span>
			</div>
			{#if kas.entries.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada catatan kas.</p>
			{:else}
				<div class="mt-4 overflow-auto">
					<table class="table table-zebra w-full text-sm">
						<thead>
							<tr>
								<th>Tanggal</th>
								<th>Kategori</th>
								<th>Keterangan</th>
								<th>Pemasukan</th>
								<th>Pengeluaran</th>
							</tr>
						</thead>
						<tbody>
							{#each kas.entries as row}
								<tr>
									<td>{formatDate(row.tanggal)}</td>
									<td>{row.kategori}</td>
									<td>{row.keterangan || '-'}</td>
									<td class="text-emerald-600">
										{row.tipe === 'masuk' ? formatCurrency(row.nominal) : '-'}
									</td>
									<td class="text-rose-600">
										{row.tipe === 'keluar' ? formatCurrency(row.nominal) : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}

	<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-slate-900">{activityTitle}</h3>
			<a href="/kalender" class="text-xs font-semibold text-emerald-700">Lihat kalender</a>
		</div>
		<p class="text-xs text-slate-500 mt-2">
			Kegiatan {orgLabelLower} terjadwal agar jamaah mengetahui agenda dan layanan yang tersedia.
		</p>
		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each activityItems as item}
				<a href={item.href} class="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
					<div class="flex items-start gap-3">
						<span class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
							{item.code}
						</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">{item.title}</p>
							<p class="text-xs text-slate-500 mt-1">{item.desc}</p>
							<span class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
								Lihat detail
								<span>-></span>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
