<script lang="ts">
	import type { PageData } from './$types';
	import { SURAH_DATA } from '$lib/surah-data';
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { isTeachingRole, isMentoringRole } from '$lib/utils/role-helpers';

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
	let isCoordinator = false;
	let isUstadz = false;
	let isStaff = false;
	let isStudent = false;
	let isEducationalOrg = false;
	let isCommunityOrg = false;
	let displayName = 'Pengguna';
	let orgName = 'Lembaga';
	let orgType: string | null = null;
	let dashboardTitle = 'Dashboard Lembaga';
	let dashboardModeLabel = 'Institution Mode';

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
	let tpqDashboard: any = null;
	let tpqCards: TpqSummaryCard[] = [];
	let tpqRecentSetoran: any[] = [];
	let tpqPendingSetoran: any[] = [];
	let tpqAgenda: any[] = [];
	let academicPrimaryHref = '/tpq/akademik/riwayat';

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
	type TpqSummaryCard = { label: string; value: string; desc: string; href: string; tone: string };
	type FeatureCard = { label: string; desc: string; href: string; tone: string };
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
	let featureCards: FeatureCard[] = [];

	let surahLookup = new Map<number, string>();
	let studentHighlights: any[] = [];
	let seriesBars: { label: string; value: number; height: number }[] = [];
	let topChecklist: any[] = [];

	$: {
		role = data?.role ?? '';
		isAdmin = role === 'admin' || role.replace('-', '_').toUpperCase() === 'SUPER_ADMIN';
		isCoordinator = isMentoringRole(role);
		isUstadz = isTeachingRole(role);
		isStaff = isAdmin || isCoordinator || isUstadz;
		isStudent = role === 'santri' || role === 'alumni';
		isEducationalOrg = Boolean(data?.isEducationalOrg);
		isCommunityOrg = Boolean(data?.isCommunityOrg);
		displayName = data?.currentUser?.username || data?.currentUser?.email || 'Pengguna';
		orgName = data?.org?.name || 'Lembaga';
		orgType = data?.org?.type ?? null;
		dashboardTitle =
			orgType === 'tpq'
				? 'Dashboard TPQ'
				: orgType === 'pondok'
					? 'Dashboard Pondok'
					: orgType === 'masjid'
						? 'Dashboard Masjid'
						: orgType === 'musholla'
							? 'Dashboard Musholla'
							: orgType === 'rumah-tahfidz'
								? 'Dashboard Rumah Tahfidz'
								: 'Dashboard Lembaga';
		dashboardModeLabel =
			orgType === 'masjid' || orgType === 'musholla'
				? 'Community Mode'
				: orgType === 'pondok' || orgType === 'tpq' || orgType === 'rumah-tahfidz'
					? 'Education Mode'
					: 'Institution Mode';
		featureCards =
			orgType === 'masjid'
				? [
						{ label: 'Data Jamaah', desc: 'Kelola anggota dan pengurus masjid.', href: '/dashboard/kelola-santri', tone: 'from-emerald-50 to-teal-100 text-emerald-900' },
						{ label: 'Kas Masjid', desc: 'Pantau pemasukan dan pengeluaran kas.', href: '/keuangan', tone: 'from-amber-50 to-orange-100 text-amber-900' },
						{ label: 'Jadwal Imam/Khotib', desc: 'Atur jadwal imam, tarawih, dan khotib.', href: '/dashboard/jadwal', tone: 'from-sky-50 to-cyan-100 text-sky-900' },
						{ label: 'Qurban', desc: 'Pendataan program qurban lembaga.', href: '/fitur-belum-tersedia?fitur=Qurban', tone: 'from-rose-50 to-pink-100 text-rose-900' },
						{ label: 'Pengumuman', desc: 'Informasi untuk jamaah masjid.', href: '/fitur-belum-tersedia?fitur=Pengumuman Masjid', tone: 'from-violet-50 to-indigo-100 text-indigo-900' },
						{ label: 'Sosial Jamaah', desc: 'Feed internal jamaah dan pengurus.', href: '/beranda', tone: 'from-lime-50 to-emerald-100 text-lime-900' }
					]
				: orgType === 'musholla'
					? [
							{ label: 'Data Jamaah', desc: 'Kelola anggota dan pengurus musholla.', href: '/dashboard/kelola-santri', tone: 'from-emerald-50 to-teal-100 text-emerald-900' },
							{ label: 'Kas Musholla', desc: 'Catat kas masuk dan keluar.', href: '/keuangan', tone: 'from-amber-50 to-orange-100 text-amber-900' },
							{ label: 'Jadwal Imam', desc: 'Atur jadwal imam dan kegiatan ibadah.', href: '/dashboard/jadwal', tone: 'from-sky-50 to-cyan-100 text-sky-900' },
							{ label: 'Pengumuman', desc: 'Informasi untuk warga sekitar.', href: '/fitur-belum-tersedia?fitur=Pengumuman Musholla', tone: 'from-violet-50 to-indigo-100 text-indigo-900' },
							{ label: 'Sosial', desc: 'Feed internal jamaah musholla.', href: '/beranda', tone: 'from-lime-50 to-emerald-100 text-lime-900' }
						]
					: orgType === 'pondok'
						? [
								{ label: 'Data Santri', desc: 'Kelola santri dan pengajar pondok.', href: '/dashboard/kelola-santri', tone: 'from-emerald-50 to-teal-100 text-emerald-900' },
								{ label: 'Asrama/Kamar', desc: 'Data kamar dan penempatan santri.', href: '/fitur-belum-tersedia?fitur=Asrama/Kamar', tone: 'from-amber-50 to-orange-100 text-amber-900' },
								{ label: 'Diniyah', desc: 'Materi diniyah dan pembelajaran kitab.', href: '/dashboard/diniyah', tone: 'from-sky-50 to-cyan-100 text-sky-900' },
								{ label: 'Hafalan', desc: 'Pantau progres hafalan santri.', href: '/dashboard/pencapaian-hafalan', tone: 'from-lime-50 to-emerald-100 text-lime-900' },
								{ label: 'Keuangan', desc: 'Keuangan pondok sedang disiapkan.', href: '/fitur-belum-tersedia?fitur=Keuangan Pondok', tone: 'from-rose-50 to-pink-100 text-rose-900' },
								{ label: 'Sosial', desc: 'Feed internal pondok.', href: '/beranda', tone: 'from-violet-50 to-indigo-100 text-indigo-900' }
							]
						: orgType === 'rumah-tahfidz'
							? [
									{ label: 'Data Santri', desc: 'Kelola santri rumah tahfidz.', href: '/dashboard/kelola-santri', tone: 'from-emerald-50 to-teal-100 text-emerald-900' },
									{ label: 'Halaqoh', desc: 'Kelola kelompok hafalan.', href: '/dashboard/halaqoh', tone: 'from-amber-50 to-orange-100 text-amber-900' },
									{ label: 'Setoran Hafalan', desc: 'Alur setoran khusus rumah tahfidz.', href: '/fitur-belum-tersedia?fitur=Setoran Hafalan Rumah Tahfidz', tone: 'from-sky-50 to-cyan-100 text-sky-900' },
									{ label: 'Progress Hafalan', desc: 'Pantau capaian hafalan santri.', href: '/dashboard/pencapaian-hafalan', tone: 'from-lime-50 to-emerald-100 text-lime-900' },
									{ label: 'Jadwal', desc: 'Agenda dan jadwal halaqoh.', href: '/kalender', tone: 'from-rose-50 to-pink-100 text-rose-900' },
									{ label: 'Sosial', desc: 'Feed internal rumah tahfidz.', href: '/beranda', tone: 'from-violet-50 to-indigo-100 text-indigo-900' }
								]
							: [
									{ label: 'Data Santri', desc: 'Kelola data santri TPQ.', href: '/dashboard/kelola-santri', tone: 'from-emerald-50 to-teal-100 text-emerald-900' },
									{ label: 'Setoran Hari Ini', desc: 'Input dan pantau setoran hafalan.', href: '/tpq/akademik/setoran', tone: 'from-amber-50 to-orange-100 text-amber-900' },
									{ label: 'Ujian Tahfidz', desc: 'Kelola ujian dan capaian.', href: '/dashboard/ujian-tahfidz', tone: 'from-sky-50 to-cyan-100 text-sky-900' },
									{ label: 'Rapor Hafalan', desc: 'Lihat rapor dan sertifikat.', href: '/tpq/hafalan-rapor', tone: 'from-lime-50 to-emerald-100 text-lime-900' },
									{ label: 'Akademik', desc: 'Pusat alur akademik TPQ.', href: '/tpq/akademik', tone: 'from-rose-50 to-pink-100 text-rose-900' },
									{ label: 'Sosial Santri', desc: 'Feed internal santri dan pengajar.', href: '/beranda', tone: 'from-violet-50 to-indigo-100 text-indigo-900' }
								];

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
			tpqDashboard = data?.tpqDashboard ?? null;
			tpqRecentSetoran = tpqDashboard?.recentSetoran ?? [];
			tpqPendingSetoran = tpqRecentSetoran.filter((item: any) => item.status === 'submitted');
			tpqAgenda = tpqDashboard?.agenda ?? [];
			academicPrimaryHref = tpqDashboard?.canonicalHref ?? '/tpq/akademik/riwayat';

		const surahSource = data?.surahs?.length ? data.surahs : SURAH_DATA;
		surahLookup = new Map(surahSource.map((s: any) => [s.number, s.name]));

		studentHighlights = [...students]
			.sort((a: any, b: any) => (b.approvedAyah ?? 0) - (a.approvedAyah ?? 0))
			.slice(0, 6);

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

		if (tpqDashboard) {
			const canInput = Boolean(tpqDashboard.canInputSetoran);
			const canReview = Boolean(tpqDashboard.canReviewSetoran);
			tpqCards = [
				{
					label: 'Setoran hari ini',
					value: String(tpqDashboard.today?.total ?? 0),
					desc: `${tpqDashboard.today?.approved ?? 0} disetujui, ${tpqDashboard.today?.submitted ?? 0} menunggu`,
					href: canInput ? '/tpq/akademik/setoran' : '/tpq/akademik/riwayat',
					tone: 'from-emerald-50 to-teal-100 text-emerald-900'
				},
				{
					label: 'Perlu review',
					value: String(tpqDashboard.pendingReview ?? 0),
					desc: canReview ? 'Menunggu keputusan koordinator/admin' : 'Menunggu review koordinator/admin',
					href: canReview ? '/tpq/akademik/review' : '/tpq/akademik/riwayat',
					tone: 'from-amber-50 to-orange-100 text-amber-900'
				},
				{
					label: 'Santri aktif',
					value: String(tpqDashboard.activeSantri ?? 0),
					desc: isUstadz ? 'Santri dalam bimbingan Anda' : 'Santri aktif dalam lembaga',
					href: '/dashboard/kelola-santri',
					tone: 'from-sky-50 to-cyan-100 text-sky-900'
				},
				{
					label: 'Progres hafalan',
					value: `${tpqDashboard.progressPercent ?? 0}%`,
					desc: `${tpqDashboard.approvedAyah ?? 0} ayat disetujui`,
					href: '/dashboard/pencapaian-hafalan',
					tone: 'from-lime-50 to-emerald-100 text-lime-900'
				},
				{
					label: 'Rapor / sertifikat',
					value: `${tpqDashboard.rapor?.lulus ?? 0} lulus`,
					desc: `${tpqDashboard.certificateCount ?? 0} sertifikat tersimpan`,
					href: isStudent ? '/dashboard/rapor-hafalan' : '/tpq/hafalan-rapor',
					tone: 'from-violet-50 to-indigo-100 text-indigo-900'
				},
				{
					label: 'Agenda',
					value: String(tpqAgenda.length),
					desc: 'Agenda lembaga 14 hari ke depan',
					href: '/kalender',
					tone: 'from-rose-50 to-pink-100 text-rose-900'
				}
			];
		} else {
			tpqCards = [];
		}

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
					label: 'Riwayat Setoran',
					desc: 'Lihat status setoran resmi',
					href: '/tpq/akademik/riwayat',
					tone: 'from-emerald-50 to-teal-100 text-emerald-800'
				},
				{
					label: 'Pencapaian Hafalan',
					desc: 'Lihat rekap setoran resmi',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'from-sky-50 to-indigo-100 text-indigo-800'
				},
				{
					label: "Muroja'ah Mandiri",
					desc: 'Catat latihan mandiri',
					href: '/dashboard/hafalan-mandiri',
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
			const staffAcademicLinks: QuickLink[] = [];
			if (tpqDashboard?.canInputSetoran) {
				staffAcademicLinks.push({
					label: 'Input Setoran',
					desc: 'Catat setoran resmi hari ini',
					href: '/tpq/akademik/setoran',
					tone: 'from-emerald-50 to-teal-100 text-emerald-800'
				});
			}
			if (tpqDashboard?.canReviewSetoran) {
				staffAcademicLinks.push({
					label: 'Review Setoran',
					desc: 'Validasi setoran santri',
					href: '/tpq/akademik/review',
					tone: 'from-amber-50 to-orange-100 text-amber-800'
				});
			} else {
				staffAcademicLinks.push({
					label: 'Riwayat Setoran',
					desc: 'Pantau setoran bimbingan',
					href: '/tpq/akademik/riwayat',
					tone: 'from-amber-50 to-orange-100 text-amber-800'
				});
			}

			quickLinks = [
				...staffAcademicLinks.slice(0, 2),
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
					value: String(tpqDashboard?.pendingReview ?? pending.length),
					href: tpqDashboard?.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat'
				},
				{
					label: 'Santri Aktif',
					value: String(tpqDashboard?.activeSantri ?? students.length),
					href: '/dashboard/kelola-santri'
				},
				{
					label: 'Total Ayat Disetujui',
					value: String(tpqDashboard?.approvedAyah ?? approvedTotal),
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

	const getSetoranStatusLabel = (status: string) => {
		if (status === 'approved') return 'Disetujui';
		if (status === 'rejected') return 'Perbaikan';
		return 'Menunggu';
	};

	const getSetoranStatusClass = (status: string) => {
		if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
		if (status === 'rejected') return 'bg-rose-100 text-rose-700';
		return 'bg-amber-100 text-amber-700';
	};

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
	<title>{dashboardTitle} | SantriOnline</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 px-0 sm:space-y-8">
	<section class="fade-in grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3" style="animation-delay: 40ms;">
		<div class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6">
			<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
				{dashboardModeLabel}
			</p>
			<h2 class="app-title mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">{dashboardTitle}</h2>
			<p class="mt-1.5 break-words text-sm font-medium text-emerald-700">Halo, {displayName}</p>
			<p class="mt-2 break-words text-sm text-slate-600">
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
			<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#if isCommunityOrg}
					<div class="min-w-0 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Pemasukan 7 hari</p>
						<p class="mt-1.5 break-words text-2xl font-bold leading-tight text-amber-900 tabular-nums">
							{formatCurrency(kasWeeklyIn)}
						</p>
					</div>
					<div class="min-w-0 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Agenda mendatang</p>
						<p class="mt-1.5 text-2xl font-bold leading-tight text-emerald-900 tabular-nums">
							{communitySchedule.length}
						</p>
					</div>
				{:else if isStudent}
					<div class="min-w-0 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-teal-600">Disetujui</p>
						<p class="mt-1.5 text-2xl font-bold leading-tight text-teal-900 tabular-nums">
							{stats.approved ?? 0}
						</p>
					</div>
					<div class="min-w-0 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Hari ini</p>
						<p class="mt-1.5 text-2xl font-bold leading-tight text-amber-900 tabular-nums">
							{stats.todayApproved ?? 0}
						</p>
					</div>
				{:else if isStaff}
					<div class="min-w-0 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Setoran menunggu</p>
						<p class="mt-1.5 text-2xl font-bold leading-tight text-amber-900 tabular-nums">
							{tpqDashboard?.pendingReview ?? pending.length}
						</p>
					</div>
					<div class="min-w-0 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50/50 px-4 py-3.5 shadow-sm">
						<p class="text-[11px] font-semibold uppercase tracking-wide text-teal-600">Santri aktif</p>
						<p class="mt-1.5 text-2xl font-bold leading-tight text-teal-900 tabular-nums">
							{tpqDashboard?.activeSantri ?? students.length}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6">
			<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Menu cepat</p>
			<h3 class="app-title mt-2 text-xl font-bold text-slate-900">Akses utama</h3>
			<div class="mt-5 grid gap-3">
				{#each quickLinks as item}
					<a
						href={item.href}
						class={`group block min-w-0 rounded-xl border border-slate-100 bg-gradient-to-br ${item.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
					>
						<p class="break-words text-sm font-bold">{item.label}</p>
						<p class="mt-1.5 break-words text-xs leading-relaxed text-slate-600 group-hover:text-slate-700">{item.desc}</p>
					</a>
				{/each}
			</div>
		</div>

		<div class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6">
			<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Stat cepat</p>
			<h3 class="app-title mt-2 text-xl font-bold text-slate-900">Ringkasan</h3>
			<div class="mt-5 space-y-2.5">
				{#if statHighlights.length > 0}
					{#each statHighlights as stat}
						<a
							href={stat.href}
							class="flex min-w-0 flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
						>
							<span class="min-w-0 break-words font-medium">{stat.label}</span>
							<span class="min-w-0 break-words text-base font-bold text-slate-900 tabular-nums sm:text-right">
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

	<section class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 80ms;">
		<div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">Fitur Lembaga</p>
				<h3 class="app-title mt-2 break-words text-2xl font-bold text-slate-900">
					{orgName}
				</h3>
			</div>
			<p class="text-xs text-slate-500 sm:text-sm">Menu disesuaikan dengan tipe lembaga dan role akun.</p>
		</div>

		<div class="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
			{#each featureCards as card}
				<a
					href={card.href}
					class={`min-w-0 rounded-xl border border-slate-100 bg-gradient-to-br ${card.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
				>
					<p class="break-words text-sm font-bold">{card.label}</p>
					<p class="mt-2 break-words text-xs leading-relaxed text-slate-600">{card.desc}</p>
				</a>
			{/each}
		</div>
	</section>

	{#if orgType === 'tpq' && tpqDashboard}
		<section class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 100ms;">
			<div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">TPQ Akademik</p>
					<h3 class="app-title mt-2 break-words text-2xl font-bold text-slate-900">Pusat Operasional TPQ</h3>
					<p class="mt-2 max-w-2xl break-words text-sm leading-relaxed text-slate-600">
						Satu pintu untuk setoran resmi, review, riwayat, rapor, sertifikat, dan agenda lembaga.
					</p>
				</div>
				<div class="flex min-w-0 flex-wrap gap-2">
					<a href={academicPrimaryHref} class="btn btn-sm btn-primary">Buka akademik</a>
					<a href="/tpq/akademik/riwayat" class="btn btn-sm btn-outline">Riwayat</a>
					<a href="/kalender" class="btn btn-sm btn-ghost">Agenda</a>
				</div>
			</div>

			<div class="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
				{#each tpqCards as card}
					<a
						href={card.href}
						class={`min-w-0 rounded-xl border border-slate-100 bg-gradient-to-br ${card.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
					>
						<p class="break-words text-[11px] font-bold uppercase tracking-wide text-slate-600">{card.label}</p>
						<p class="mt-2 break-words text-2xl font-bold tabular-nums tracking-tight">{card.value}</p>
						<p class="mt-1.5 break-words text-xs leading-relaxed text-slate-600">{card.desc}</p>
					</a>
				{/each}
			</div>

			<div class="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
				<div class="min-w-0 rounded-xl border border-slate-100 bg-slate-50/30 p-4 sm:p-5">
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h4 class="text-sm font-bold text-slate-900">Setoran terbaru</h4>
						<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/tpq/akademik/riwayat">
							Lihat riwayat
						</a>
					</div>
					{#if tpqRecentSetoran.length}
						<div class="mt-4 space-y-2.5">
							{#each tpqRecentSetoran as item}
								<div class="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
									<div class="min-w-0">
										<p class="break-words font-semibold text-slate-900">
											{item.santriName || 'Santri'} · {getSurahName(Number(item.surah))} {item.ayatFrom}-{item.ayatTo}
										</p>
										<p class="mt-1 break-words text-xs text-slate-500">
											{formatDate(item.date)} · {item.type === 'murojaah' ? "Muroja'ah" : 'Hafalan'} · {item.ustadzName || 'Pengampu'}
										</p>
									</div>
									<span class={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getSetoranStatusClass(item.status)}`}>
										{getSetoranStatusLabel(item.status)}
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<EmptyState
							icon="📖"
							title="Belum ada setoran"
							description="Setoran hafalan terbaru akan muncul di sini setelah santri mulai menyetor."
							actionLabel="Lihat Riwayat"
							actionHref="/tpq/akademik/riwayat"
							compact={true}
						/>
					{/if}
				</div>

				<div class="min-w-0 rounded-xl border border-slate-100 bg-slate-50/30 p-4 sm:p-5">
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h4 class="text-sm font-bold text-slate-900">Agenda TPQ</h4>
						<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/kalender">
							Buka kalender
						</a>
					</div>
					{#if tpqAgenda.length}
						<div class="mt-4 space-y-2.5">
							{#each tpqAgenda as item}
								<div class="min-w-0 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm">
									<p class="break-words font-semibold text-slate-900">{item.title}</p>
									<p class="mt-1 text-xs text-slate-500">{formatDate(item.eventDate)}</p>
									{#if item.content}
										<p class="mt-2 break-words text-xs leading-5 text-slate-500">{item.content}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<EmptyState
							icon="📆"
							title="Belum ada agenda"
							description="Agenda TPQ 14 hari ke depan akan ditampilkan di sini. Tambahkan melalui kalender."
							actionLabel="Buka Kalender"
							actionHref="/kalender"
							compact={true}
						/>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	{#if isCommunityOrg}
		<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2" style="animation-delay: 120ms;">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Transaksi Kas Terbaru</h3>
					<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/keuangan">
						Lihat keuangan
					</a>
				</div>
				{#if finance?.kas?.entries?.length}
					<div class="mt-5 space-y-2.5">
						{#each finance.kas.entries as entry}
							<div class="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0">
									<p class="break-words font-semibold text-slate-900">{entry.kategori}</p>
									<p class="text-xs text-slate-500">{formatDate(entry.tanggal)}</p>
								</div>
								<div class="min-w-0 sm:text-right">
									<p class={`break-words text-sm font-semibold ${entry.tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-700'}`}>
										{entry.tipe === 'masuk' ? '+' : '-'}{formatCurrency(entry.nominal)}
									</p>
									<p class="break-words text-xs text-slate-500">{entry.keterangan || '-'}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						icon="💰"
						title="Belum ada transaksi"
						description="Transaksi kas akan muncul di sini setelah Anda mencatat pemasukan atau pengeluaran."
						actionLabel="Kelola Keuangan"
						actionHref="/keuangan"
						compact={true}
					/>
				{/if}
			</div>

			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 200ms;">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Agenda 2 Minggu</h3>
					<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/kalender">
						Lihat kalender
					</a>
				</div>
				{#if communitySchedule.length}
					<div class="mt-5 space-y-2.5">
						{#each communitySchedule as item}
							<div class="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm shadow-sm">
								<p class="break-words font-semibold text-slate-900">{item.title}</p>
								<p class="text-xs text-slate-500">{formatDate(item.eventDate)}</p>
								{#if item.content}
									<p class="mt-1 break-words text-xs text-slate-500">{item.content}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						icon="📅"
						title="Belum ada agenda"
						description="Agenda kegiatan komunitas akan muncul di sini. Tambahkan jadwal melalui kalender."
						actionLabel="Buka Kalender"
						actionHref="/kalender"
						compact={true}
					/>
				{/if}
			</div>
		</section>
		{#if canManageCommunity}
			<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
				<div class={`min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}>
					<h3 class="app-title break-words text-xl font-semibold text-slate-900">Kelola Aset</h3>
					<p class="text-xs text-slate-500">Inventaris lembaga yang tampil di halaman publik.</p>
					<div class="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
						<h4 class="text-sm font-semibold text-emerald-700">Import Excel</h4>
						<p class="mt-1 break-words text-xs text-emerald-700/80">
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

				<div class={`min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}>
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h3 class="app-title min-w-0 break-words text-xl font-semibold text-slate-900">Daftar Aset</h3>
						<span class="text-xs text-slate-400">{assets.length} item</span>
					</div>
					{#if assets.length === 0}
						<EmptyState
							icon="🏢"
							title="Belum ada aset"
							description="Inventaris lembaga akan muncul di sini. Tambahkan aset melalui form di samping atau import Excel."
							compact={true}
						/>
					{:else}
						<div class="mt-4 space-y-3 md:hidden">
							{#each assets as asset}
								<div
									class={`rounded-2xl border p-4 shadow-sm ${
										assetId === asset.id ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
									}`}
								>
									<div class="flex min-w-0 items-center justify-between gap-3">
										<p class="min-w-0 break-words text-sm font-semibold text-slate-900">{asset.name}</p>
										<span class="text-xs text-slate-500">{asset.quantity} unit</span>
									</div>
									<p class="mt-2 break-words text-xs text-slate-500">Kategori: {asset.category || '-'}</p>
									<p class="mt-1 break-words text-xs text-slate-500">Kondisi: {asset.condition || '-'}</p>
									<p class="mt-1 break-words text-xs text-slate-500">Lokasi: {asset.location || '-'}</p>
									<p class="mt-1 text-xs text-slate-500">Tanggal: {formatDate(asset.acquiredAt)}</p>
									{#if asset.notes}
										<p class="mt-2 break-words text-xs text-slate-500">{asset.notes}</p>
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
						<div class="mt-4 hidden max-w-full overflow-x-auto md:block">
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
		<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2" style="animation-delay: 120ms;">
				<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Aktivitas 7 Hari Terakhir</h3>
					<span class="w-fit rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
						{stats.todayApproved ?? 0} disetujui hari ini
					</span>
				</div>
				{#if seriesBars.length}
					<div class="mt-6 flex h-44 min-w-0 items-end gap-2 sm:gap-3">
						{#each seriesBars as entry}
							<div class="min-w-0 flex-1 text-center">
								<div
									class="mx-auto w-full rounded-2xl bg-gradient-to-t from-teal-600 via-cyan-500 to-emerald-400"
									style={`height: ${entry.height}%`}
								></div>
								<p class="mt-2 truncate text-xs text-slate-500">{entry.label}</p>
								<p class="text-xs font-semibold text-slate-700">{entry.value}</p>
							</div>
						{/each}
					</div>
					<p class="mt-4 text-xs text-slate-500">Data berdasarkan setoran yang disetujui.</p>
				{:else}
					<EmptyState
						icon="📊"
						title="Belum ada aktivitas"
						description="Grafik aktivitas setoran 7 hari terakhir akan muncul di sini setelah Anda mulai menyetor."
						actionLabel="Lihat Riwayat"
						actionHref="/tpq/akademik/riwayat"
						compact={true}
					/>
				{/if}
			</div>

			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 200ms;">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Surah Terbanyak</h3>
					<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/dashboard/pencapaian-hafalan">
						Lihat detail
					</a>
				</div>
				{#if topChecklist.length}
					<div class="mt-5 space-y-2.5">
						{#each topChecklist as row}
							<div class="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm shadow-sm">
								<div class="flex min-w-0 items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="break-words font-semibold text-slate-900">{row.name || getSurahName(row.surahNumber)}</p>
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
					<EmptyState
						icon="📚"
						title="Belum ada data surah"
						description="Statistik surah yang paling banyak disetujui akan muncul di sini setelah Anda mulai menyetor."
						actionLabel="Lihat Pencapaian"
						actionHref="/dashboard/pencapaian-hafalan"
						compact={true}
					/>
				{/if}
			</div>
		</section>
	{:else if isEducationalOrg && isStaff}
		<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 120ms;">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Progress Santri</h3>
					<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href="/dashboard/kelola-santri">
						Lihat semua
					</a>
				</div>
				{#if studentHighlights.length}
					<div class="mt-5 space-y-2.5">
						{#each studentHighlights as student}
							<div class="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm shadow-sm">
								<div class="flex min-w-0 items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="break-words font-semibold text-slate-900">{student.username || student.email}</p>
										<p class="break-words text-xs text-slate-500">{student.email}</p>
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
					<EmptyState
						icon="👥"
						title="Belum ada santri"
						description="Data santri dan progres hafalan akan muncul di sini setelah Anda menambahkan santri."
						actionLabel="Kelola Santri"
						actionHref="/dashboard/kelola-santri"
						compact={true}
					/>
				{/if}
			</div>

			<div class="fade-in min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6" style="animation-delay: 200ms;">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="app-title min-w-0 break-words text-xl font-bold text-slate-900">Setoran Menunggu</h3>
					<a class="text-xs font-bold text-emerald-600 hover:text-emerald-700" href={tpqDashboard?.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat'}>
						Lihat semua
					</a>
				</div>
				{#if tpqPendingSetoran.length}
					<div class="mt-5 space-y-2.5">
						{#each tpqPendingSetoran as item}
							<div class="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0">
									<p class="break-words font-semibold text-slate-900">
										{item.santriName || 'Santri'} · {getSurahName(Number(item.surah))} {item.ayatFrom}-{item.ayatTo}
									</p>
									<p class="break-words text-xs text-slate-500">
										{formatDate(item.date)} · {item.type === 'murojaah' ? "Muroja'ah" : 'Hafalan'}
									</p>
								</div>
								<span class={`rounded-full px-3 py-1 text-xs font-semibold ${getSetoranStatusClass(item.status)}`}>
									{getSetoranStatusLabel(item.status)}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						icon="✅"
						title="Semua setoran sudah direview"
						description="Tidak ada setoran yang menunggu review. Santri dapat terus menyetor hafalan baru."
						compact={true}
					/>
				{/if}
			</div>
		</section>
	{:else}
		<section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 text-sm text-slate-500 shadow-sm sm:p-6">
			Dashboard ini akan menampilkan ringkasan data sesuai peran Anda. Silakan gunakan menu untuk mulai mengisi data.
		</section>
	{/if}
</div>
