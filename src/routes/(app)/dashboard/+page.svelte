<script lang="ts">
	import type { PageData } from './$types';
	import { SURAH_DATA } from '$lib/surah-data';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value);

	const formatDate = (value: string | number | null | undefined) => {
		if (!value) return '-';
		const date = typeof value === 'number' ? new Date(value) : new Date(value);
		if (Number.isNaN(date.getTime())) return '-';
		return date.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	let role = '';
	let isAdmin = false;
	let isUstadz = false;
	let isStaff = false;
	let isStudent = false;
	let isEducationalOrg = false;
	let isCommunityOrg = false;
	let displayName = 'Pengguna';
	let orgName = 'Lembaga';

	let pending: any[] = [];
	let students: any[] = [];
	let checklist: any[] = [];
	let series: any[] = [];
	let stats = { approved: 0, submitted: 0, todayApproved: 0 };
	let finance: any = null;
	let communitySchedule: any[] = [];
	let kasWeeklyIn = 0;
	let canManageCommunity = false;
	let isCommunityManager = false;
	let assets: AssetRow[] = [];

	let assetId = '';
	let assetName = '';
	let assetCategory = '';
	let assetQuantity = '1';
	let assetCondition = '';
	let assetLocation = '';
	let assetNotes = '';
	let assetAcquiredAt = '';
	let assetFormRef: HTMLFormElement | null = null;


	type QuickLink = { label: string; desc: string; href: string; tone: string };
	type StatHighlight = { label: string; value: string; href: string };
	type AssetRow = {
		id: string;
		name: string;
		category: string | null;
		quantity: number;
		condition: string | null;
		location: string | null;
		notes: string | null;
		acquiredAt: string | null;
	};

	let quickLinks: QuickLink[] = [];
	let statHighlights: StatHighlight[] = [];

	let surahLookup = new Map<number, string>();
	let studentHighlights: any[] = [];
	let pendingHighlights: any[] = [];
	let seriesBars: { label: string; value: number; height: number }[] = [];
	let topChecklist: any[] = [];

	$: {
		role = data?.role ?? '';
		isAdmin = role === 'admin' || role.replace('-', '_').toUpperCase() === 'SUPER_ADMIN';
		isUstadz = role === 'ustadz' || role === 'ustadzah';
		isStaff = isAdmin || isUstadz;
		isStudent = role === 'santri' || role === 'alumni';
		isEducationalOrg = Boolean(data?.isEducationalOrg);
		isCommunityOrg = Boolean(data?.isCommunityOrg);
		displayName = data?.currentUser?.username || data?.currentUser?.email || 'Pengguna';
		orgName = data?.org?.name || 'Lembaga';

		pending = data?.pending ?? [];
		students = data?.students ?? [];
		checklist = data?.checklist ?? [];
		series = data?.series ?? [];
		stats = data?.stats ?? { approved: 0, submitted: 0, todayApproved: 0 };
		finance = data?.finance ?? null;
			communitySchedule = data?.communitySchedule ?? [];
			kasWeeklyIn = data?.kasWeeklyIn ?? 0;
			canManageCommunity = Boolean(data?.canManageCommunity);
			isCommunityManager = canManageCommunity;
			assets = (data?.assets ?? []) as AssetRow[];

		const surahSource = data?.surahs?.length ? data.surahs : SURAH_DATA;
		surahLookup = new Map(surahSource.map((s: any) => [s.number, s.name]));

		studentHighlights = [...students]
			.sort((a: any, b: any) => (b.approvedAyah ?? 0) - (a.approvedAyah ?? 0))
			.slice(0, 6);
		pendingHighlights = pending.slice(0, 6);

		const seriesMax = Math.max(1, ...series.map((item: any) => item.approved ?? 0));
		seriesBars = series.map((item: any) => ({
			label: item.label,
			value: item.approved ?? 0,
			height: Math.round(((item.approved ?? 0) / seriesMax) * 100)
		}));

		topChecklist = [...checklist]
			.filter((row: any) => (row.disetujui ?? 0) > 0)
			.sort((a: any, b: any) => (b.disetujui ?? 0) - (a.disetujui ?? 0))
			.slice(0, 6);

			if (isCommunityOrg) {
				if (isCommunityManager) {
					quickLinks = [
						{
							label: 'Keuangan',
							desc: 'Kelola kas dan transaksi',
							href: '/keuangan',
							tone: 'from-amber-50 to-orange-100 text-amber-800'
						},
						{
							label: 'Kalender',
							desc: 'Agenda kegiatan komunitas',
							href: '/kalender',
							tone: 'from-teal-50 to-emerald-100 text-emerald-800'
						},
						{
							label: 'Akun',
							desc: 'Profil dan pengaturan',
							href: '/akun',
							tone: 'from-slate-50 to-slate-100 text-slate-800'
						}
					];

					statHighlights = [
						{
							label: 'Saldo Kas',
							value: formatCurrency(finance?.kas?.saldo ?? 0),
							href: '/keuangan'
						},
						{
							label: 'Pemasukan 7 hari',
							value: formatCurrency(kasWeeklyIn),
							href: '/keuangan'
						},
						{
							label: 'Agenda Mendatang',
							value: String(communitySchedule.length),
							href: '/kalender'
						}
					];
				} else {
					quickLinks = [
						{
							label: 'Kalender',
							desc: 'Lihat agenda kegiatan komunitas',
							href: '/kalender',
							tone: 'from-teal-50 to-emerald-100 text-emerald-800'
						},
						{
							label: 'Dashboard',
							desc: 'Ringkasan aktivitas komunitas',
							href: '/dashboard',
							tone: 'from-sky-50 to-indigo-100 text-indigo-800'
						},
						{
							label: 'Akun',
							desc: 'Profil dan pengaturan',
							href: '/akun',
							tone: 'from-slate-50 to-slate-100 text-slate-800'
						}
					];

					statHighlights = [
						{
							label: 'Agenda Mendatang',
							value: String(communitySchedule.length),
							href: '/kalender'
						},
						{
							label: 'Aktivitas 7 hari',
							value: formatCurrency(kasWeeklyIn),
							href: '/dashboard'
						},
						{
							label: 'Peran',
							value: role.toUpperCase(),
							href: '/akun'
						}
					];
				}
			} else if (isStudent) {
			quickLinks = [
				{
					label: 'Pencapaian Hafalan',
					desc: 'Lihat rekap setoran resmi',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'from-emerald-50 to-teal-100 text-emerald-800'
				},
				{
					label: "Muroja'ah Mandiri",
					desc: 'Catat latihan mandiri',
					href: '/dashboard/hafalan-mandiri',
					tone: 'from-sky-50 to-indigo-100 text-indigo-800'
				},
				{
					label: 'Hafalan Belum Lancar',
					desc: 'Daftar ayat yang perlu perhatian',
					href: '/dashboard/hafalan-belum-lancar',
					tone: 'from-amber-50 to-orange-100 text-amber-800'
				}
			];

			statHighlights = [
				{
					label: 'Disetujui',
					value: String(stats.approved ?? 0),
					href: '/dashboard/pencapaian-hafalan'
				},
				{
					label: 'Setor',
					value: String(stats.submitted ?? 0),
					href: '/dashboard/pencapaian-hafalan'
				},
				{
					label: 'Progres',
					value: `${Math.round((data?.percentage ?? 0) * 100) / 100}%`,
					href: '/dashboard/pencapaian-hafalan'
				}
			];
		} else if (isStaff) {
			quickLinks = [
				{
					label: 'Review Setoran',
					desc: 'Validasi setoran santri',
					href: '/tpq/akademik/review',
					tone: 'from-amber-50 to-orange-100 text-amber-800'
				},
				{
					label: 'Kelola Santri',
					desc: 'Data santri dan status',
					href: '/dashboard/kelola-santri',
					tone: 'from-teal-50 to-emerald-100 text-emerald-800'
				},
				{
					label: 'Pencapaian Hafalan',
					desc: 'Rekap progres santri',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'from-sky-50 to-indigo-100 text-indigo-800'
				}
			];

			const approvedTotal = students.reduce(
				(sum: number, student: any) => sum + (student.approvedAyah ?? 0),
				0
			);

			statHighlights = [
				{
					label: 'Setoran Menunggu',
					value: String(pending.length),
					href: '/tpq/akademik/review'
				},
				{
					label: 'Santri Aktif',
					value: String(students.length),
					href: '/dashboard/kelola-santri'
				},
				{
					label: 'Total Ayat Disetujui',
					value: String(approvedTotal),
					href: '/dashboard/pencapaian-hafalan'
				}
			];
		} else {
			quickLinks = [
				{
					label: 'Akun',
					desc: 'Profil dan pengaturan',
					href: '/akun',
					tone: 'from-slate-50 to-slate-100 text-slate-800'
				}
			];
			statHighlights = [];
		}
	}

	const getSurahName = (num: number) => surahLookup.get(num) ?? `Surah ${num}`;

	const startEditAsset = (asset: AssetRow) => {
		assetId = asset.id;
		assetName = asset.name;
		assetCategory = asset.category ?? '';
		assetQuantity = `${asset.quantity ?? 1}`;
		assetCondition = asset.condition ?? '';
		assetLocation = asset.location ?? '';
		assetNotes = asset.notes ?? '';
		assetAcquiredAt = asset.acquiredAt ?? '';
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
			assetFormRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const resetAssetForm = () => {
		assetId = '';
		assetName = '';
		assetCategory = '';
		assetQuantity = '1';
		assetCondition = '';
		assetLocation = '';
		assetNotes = '';
		assetAcquiredAt = '';
	};

	const refreshOnSuccess = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				location.reload();
			}
		};
	};
</script>

<svelte:head>
	<title>Dashboard | SantriOnline</title>
</svelte:head>

<div class="space-y-6">
	<section class="fade-in grid grid-cols-1 gap-6 lg:grid-cols-3" style="animation-delay: 40ms;">
		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">
				{isCommunityOrg ? 'Community Mode' : 'Education Mode'}
			</p>
			<h2 class="app-title mt-2 text-2xl font-semibold text-slate-900">Halo, {displayName}</h2>
			<p class="mt-2 text-sm text-slate-600">
				{#if isCommunityOrg}
					Pantau aktivitas komunitas {orgName} dan tetap terhubung dengan agenda terbaru.
				{:else if isStudent}
					Ikuti progres hafalan Anda di {orgName} dan fokuskan target harian.
				{:else if isStaff}
					Pantau setoran, progres santri, dan aktivitas harian di {orgName}.
				{:else}
					Selamat datang di dashboard {orgName}.
				{/if}
			</p>
			<div class="mt-6 flex items-center gap-4">
				{#if isCommunityOrg}
					<div class="flex-1 rounded-2xl bg-amber-50 px-4 py-3">
						<p class="text-xs text-amber-700">Pemasukan 7 hari</p>
						<p class="text-xl font-semibold text-amber-900 tabular-nums tracking-tight leading-tight break-words sm:text-2xl">
							{formatCurrency(kasWeeklyIn)}
						</p>
					</div>
					<div class="flex-1 rounded-2xl bg-emerald-50 px-4 py-3">
						<p class="text-xs text-emerald-700">Agenda mendatang</p>
						<p class="text-2xl font-semibold text-emerald-900 tabular-nums tracking-tight leading-tight">
							{communitySchedule.length}
						</p>
					</div>
				{:else if isStudent}
					<div class="flex-1 rounded-2xl bg-teal-50 px-4 py-3">
						<p class="text-xs text-teal-700">Disetujui</p>
						<p class="text-2xl font-semibold text-teal-900 tabular-nums tracking-tight leading-tight">
							{stats.approved ?? 0}
						</p>
					</div>
					<div class="flex-1 rounded-2xl bg-amber-50 px-4 py-3">
						<p class="text-xs text-amber-700">Hari ini</p>
						<p class="text-2xl font-semibold text-amber-900 tabular-nums tracking-tight leading-tight">
							{stats.todayApproved ?? 0}
						</p>
					</div>
				{:else if isStaff}
					<div class="flex-1 rounded-2xl bg-amber-50 px-4 py-3">
						<p class="text-xs text-amber-700">Setoran menunggu</p>
						<p class="text-2xl font-semibold text-amber-900 tabular-nums tracking-tight leading-tight">
							{pending.length}
						</p>
					</div>
					<div class="flex-1 rounded-2xl bg-teal-50 px-4 py-3">
						<p class="text-xs text-teal-700">Santri aktif</p>
						<p class="text-2xl font-semibold text-teal-900 tabular-nums tracking-tight leading-tight">
							{students.length}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Menu cepat</p>
			<h3 class="app-title mt-2 text-xl font-semibold text-slate-900">Akses utama</h3>
			<div class="mt-4 grid gap-3">
				{#each quickLinks as item}
					<a
						href={item.href}
						class={`group block rounded-2xl border border-white/70 bg-gradient-to-br ${item.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}
					>
						<p class="text-sm font-semibold">{item.label}</p>
						<p class="mt-1 text-xs text-slate-600 group-hover:text-slate-700">{item.desc}</p>
					</a>
				{/each}
			</div>
		</div>

		<div class="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Stat cepat</p>
			<h3 class="app-title mt-2 text-xl font-semibold text-slate-900">Ringkasan</h3>
			<div class="mt-4 space-y-3">
				{#if statHighlights.length > 0}
					{#each statHighlights as stat}
						<a
							href={stat.href}
							class="flex flex-col gap-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
						>
							<span class="min-w-0">{stat.label}</span>
							<span class="font-semibold text-slate-900 tabular-nums tracking-tight sm:text-right">
								{stat.value}
							</span>
						</a>
					{/each}
				{:else}
					<p class="text-sm text-slate-500">Belum ada ringkasan untuk ditampilkan.</p>
				{/if}
			</div>
		</div>
	</section>

	{#if isCommunityOrg}
		<section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur xl:col-span-2" style="animation-delay: 120ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Transaksi Kas Terbaru</h3>
					<a class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/keuangan">
						Lihat keuangan
					</a>
				</div>
				{#if finance?.kas?.entries?.length}
					<div class="mt-5 space-y-3">
						{#each finance.kas.entries as entry}
							<div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
								<div>
									<p class="font-semibold text-slate-900">{entry.kategori}</p>
									<p class="text-xs text-slate-500">{formatDate(entry.tanggal)}</p>
								</div>
								<div class="text-right">
									<p class={`text-sm font-semibold ${entry.tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-700'}`}>
										{entry.tipe === 'masuk' ? '+' : '-'}{formatCurrency(entry.nominal)}
									</p>
									<p class="text-xs text-slate-500">{entry.keterangan || '-'}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Belum ada transaksi kas terbaru.</p>
				{/if}
			</div>

			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 200ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Agenda 2 Minggu</h3>
					<a class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/kalender">
						Lihat kalender
					</a>
				</div>
				{#if communitySchedule.length}
					<div class="mt-5 space-y-3">
						{#each communitySchedule as item}
							<div class="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
								<p class="font-semibold text-slate-900">{item.title}</p>
								<p class="text-xs text-slate-500">{formatDate(item.eventDate)}</p>
								{#if item.content}
									<p class="mt-1 text-xs text-slate-500">{item.content}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Belum ada agenda yang dijadwalkan.</p>
				{/if}
			</div>
		</section>
		{#if canManageCommunity}
			<section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${assetId ? 'xl:col-span-2' : ''}`}>
					<h3 class="app-title text-xl font-semibold text-slate-900">Kelola Aset</h3>
					<p class="text-xs text-slate-500">Inventaris lembaga yang tampil di halaman publik.</p>
					<div class="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
						<h4 class="text-sm font-semibold text-emerald-700">Import Excel</h4>
						<p class="mt-1 text-xs text-emerald-700/80">
							Kolom wajib: <strong>name</strong>, <strong>quantity</strong>. Opsional:
							<strong>category</strong>, <strong>condition</strong>, <strong>location</strong>, <strong>acquired_at</strong>, <strong>notes</strong>.
						</p>
						<form
							method="POST"
							action="?/importAssets"
							enctype="multipart/form-data"
							class="mt-3 space-y-3"
							use:enhance={refreshOnSuccess}
						>
							<a href="/templates/aset-template.xlsx" class="btn btn-outline w-full" download>
								Download Template
							</a>
							<input
								type="file"
								name="file"
								accept=".xlsx,.xls,.csv"
								class="file-input file-input-bordered w-full"
								required
							/>
							<button class="btn btn-primary w-full">Upload Aset</button>
						</form>
					</div>
					<form
						method="POST"
						action={assetId ? '?/updateAsset' : '?/addAsset'}
						class="mt-4 space-y-4"
						use:enhance={refreshOnSuccess}
						bind:this={assetFormRef}
					>
						{#if assetId}
							<input type="hidden" name="id" value={assetId} />
							<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
								Sedang mengedit aset. Simpan untuk memperbarui atau batalkan untuk input baru.
							</div>
						{/if}
						<div class="grid gap-3 md:grid-cols-2">
							<input
								type="text"
								name="name"
								placeholder="Nama aset"
								class="input input-bordered w-full md:col-span-2"
								bind:value={assetName}
								required
							/>
							<input
								type="text"
								name="category"
								placeholder="Kategori (misal: fasilitas)"
								class="input input-bordered w-full"
								bind:value={assetCategory}
							/>
							<input
								type="number"
								name="quantity"
								min="1"
								placeholder="Jumlah"
								class="input input-bordered w-full"
								bind:value={assetQuantity}
								required
							/>
							<input
								type="text"
								name="condition"
								placeholder="Kondisi (baik, rusak)"
								class="input input-bordered w-full"
								bind:value={assetCondition}
							/>
							<input
								type="text"
								name="location"
								placeholder="Lokasi penyimpanan"
								class="input input-bordered w-full"
								bind:value={assetLocation}
							/>
							<input
								type="date"
								name="acquiredAt"
								class="input input-bordered w-full"
								bind:value={assetAcquiredAt}
							/>
							<textarea
								name="notes"
								rows="2"
								placeholder="Catatan"
								class="textarea textarea-bordered w-full md:col-span-2"
								bind:value={assetNotes}
							></textarea>
						</div>
						<div class="flex flex-col gap-2 sm:flex-row">
							<button class="btn btn-primary w-full sm:flex-1">
								{assetId ? 'Perbarui Aset' : 'Simpan Aset'}
							</button>
							{#if assetId}
								<button type="button" class="btn btn-outline w-full sm:flex-1" on:click={resetAssetForm}>
									Batal Edit
								</button>
							{/if}
						</div>
					</form>
				</div>

				<div class={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur ${assetId ? 'xl:col-span-2' : ''}`}>
					<div class="flex items-center justify-between">
						<h3 class="app-title text-xl font-semibold text-slate-900">Daftar Aset</h3>
						<span class="text-xs text-slate-400">{assets.length} item</span>
					</div>
					{#if assets.length === 0}
						<p class="mt-4 text-sm text-slate-500">Belum ada data aset.</p>
					{:else}
						<div class="mt-4 space-y-3 md:hidden">
							{#each assets as asset}
								<div
									class={`rounded-2xl border p-4 shadow-sm ${
										assetId === asset.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
									}`}
								>
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
									<div class="mt-3 flex flex-wrap gap-2">
										<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
											Edit
										</button>
										<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
											<input type="hidden" name="id" value={asset.id} />
											<button
												type="submit"
												class="btn btn-xs btn-ghost text-red-600"
												on:click={(event) => {
													if (!confirm('Hapus aset ini?')) {
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
										<th>Nama</th>
										<th>Kategori</th>
										<th>Jumlah</th>
										<th>Kondisi</th>
										<th>Lokasi</th>
										<th>Tanggal</th>
										<th>Catatan</th>
										<th>Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each assets as asset}
										<tr class={assetId === asset.id ? 'bg-amber-50' : ''}>
											<td>{asset.name}</td>
											<td>{asset.category || '-'}</td>
											<td>{asset.quantity}</td>
											<td>{asset.condition || '-'}</td>
											<td>{asset.location || '-'}</td>
											<td>{formatDate(asset.acquiredAt)}</td>
											<td>{asset.notes || '-'}</td>
											<td>
												<div class="flex flex-wrap gap-2">
													<button type="button" class="btn btn-xs btn-outline" on:click={() => startEditAsset(asset)}>
														Edit
													</button>
													<form method="POST" action="?/deleteAsset" use:enhance={refreshOnSuccess}>
														<input type="hidden" name="id" value={asset.id} />
														<button
															type="submit"
															class="btn btn-xs btn-ghost text-red-600"
															on:click={(event) => {
																if (!confirm('Hapus aset ini?')) {
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

		{/if}
	{:else if isEducationalOrg && isStudent}
		<section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur xl:col-span-2" style="animation-delay: 120ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Aktivitas 7 Hari Terakhir</h3>
					<span class="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
						{stats.todayApproved ?? 0} disetujui hari ini
					</span>
				</div>
				{#if seriesBars.length}
					<div class="mt-6 flex h-44 items-end gap-3">
						{#each seriesBars as entry}
							<div class="flex-1 text-center">
								<div
									class="mx-auto w-full rounded-2xl bg-gradient-to-t from-teal-600 via-cyan-500 to-emerald-400"
									style={`height: ${entry.height}%`}
								></div>
								<p class="mt-2 text-xs text-slate-500">{entry.label}</p>
								<p class="text-xs font-semibold text-slate-700">{entry.value}</p>
							</div>
						{/each}
					</div>
					<p class="mt-4 text-xs text-slate-500">Data berdasarkan setoran yang disetujui.</p>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Belum ada aktivitas setoran dalam 7 hari terakhir.</p>
				{/if}
			</div>

			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 200ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Surah Terbanyak</h3>
					<a class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/dashboard/pencapaian-hafalan">
						Lihat detail
					</a>
				</div>
				{#if topChecklist.length}
					<div class="mt-5 space-y-3">
						{#each topChecklist as row}
							<div class="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
								<div class="flex items-center justify-between">
									<div>
										<p class="font-semibold text-slate-900">{row.name || getSurahName(row.surahNumber)}</p>
										<p class="text-xs text-slate-500">
											{row.disetujui}/{row.totalAyah} ayat disetujui
										</p>
									</div>
									<span class="text-xs font-semibold text-emerald-700">
										{row.totalAyah ? Math.round((row.disetujui / row.totalAyah) * 100) : 0}%
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Belum ada setoran yang disetujui.</p>
				{/if}
			</div>
		</section>
	{:else if isEducationalOrg && isStaff}
		<section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 120ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Progress Santri</h3>
					<a class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/dashboard/kelola-santri">
						Lihat semua
					</a>
				</div>
				{#if studentHighlights.length}
					<div class="mt-5 space-y-3">
						{#each studentHighlights as student}
							<div class="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
								<div class="flex items-center justify-between">
									<div>
										<p class="font-semibold text-slate-900">{student.username || student.email}</p>
										<p class="text-xs text-slate-500">{student.email}</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-semibold text-emerald-700">
											{Math.round(student.percentage ?? 0)}%
										</p>
										<p class="text-xs text-slate-500">{student.approvedAyah ?? 0} ayat</p>
									</div>
								</div>
								<div class="mt-2 h-2 rounded-full bg-slate-200">
									<div
										class="h-2 rounded-full bg-emerald-500"
										style={`width: ${Math.min(100, Math.round(student.percentage ?? 0))}%`}
									></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Belum ada data santri.</p>
				{/if}
			</div>

			<div class="fade-in rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur" style="animation-delay: 200ms;">
				<div class="flex items-center justify-between">
					<h3 class="app-title text-xl font-semibold text-slate-900">Setoran Menunggu</h3>
					<a class="text-xs font-semibold text-emerald-700 hover:text-emerald-800" href="/tpq/akademik/review">
						Lihat semua
					</a>
				</div>
				{#if pendingHighlights.length}
					<div class="mt-5 space-y-3">
						{#each pendingHighlights as item}
							<div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
								<div>
									<p class="font-semibold text-slate-900">
										{getSurahName(item.surahNumber)} · Ayat {item.ayahNumber}
									</p>
									<p class="text-xs text-slate-500">{item.email}</p>
								</div>
								<span class="text-xs text-slate-500">{formatDate(item.tanggalSetor)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Tidak ada setoran yang menunggu.</p>
				{/if}
			</div>
		</section>
	{:else}
		<section class="rounded-3xl border border-white/80 bg-white/80 p-6 text-sm text-slate-500 shadow-xl backdrop-blur">
			Dashboard ini akan menampilkan ringkasan data sesuai peran Anda. Silakan gunakan menu untuk mulai mengisi data.
		</section>
	{/if}
</div>
