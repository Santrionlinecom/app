<script lang="ts">
	import type { PageData } from './$types';
	import { SURAH_DATA } from '$lib/surah-data';
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { isTeachingRole, isMentoringRole } from '$lib/utils/role-helpers';
	import {
		Activity,
		ArrowRight,
		BarChart3,
		BookOpen,
		Building2,
		CalendarDays,
		CheckCircle2,
		ClipboardCheck,
		Clock3,
		Database,
		GraduationCap,
		HardDrive,
		LayoutDashboard,
		Megaphone,
		MessageCircle,
		Search,
		ShieldCheck,
		Sparkles,
		TrendingUp,
		Users,
		Wallet,
		Zap
	} from 'lucide-svelte';

	export let data: PageData;

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value);

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value ?? 0);

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

	type IconComponent = typeof LayoutDashboard;
	type DashboardTone = 'green' | 'gold' | 'sky' | 'slate' | 'rose' | 'violet';
	type DashboardStat = {
		label: string;
		value: string;
		desc: string;
		href: string;
		tone: DashboardTone;
		icon: IconComponent;
		source: string;
	};
	type StatusItem = {
		label: string;
		value: string;
		desc: string;
		tone: DashboardTone;
		icon: IconComponent;
		progress?: number | null;
	};
	type ActivityItem = {
		title: string;
		desc: string;
		meta: string;
		tone: DashboardTone;
		icon: IconComponent;
		href?: string;
	};
	type InsightCard = {
		label: string;
		value: string;
		desc: string;
		tone: DashboardTone;
		icon: IconComponent;
	};
	type ChartBar = {
		label: string;
		value: number;
		display: string;
		height: number;
		tone: string;
	};
	type ContextPill = { label: string; active?: boolean };

	let role = '';
	let isAdmin = false;
	let isSuperAdmin = false;
	let isCoordinator = false;
	let isUstadz = false;
	let isStaff = false;
	let isStudent = false;
	let isEducationalOrg = false;
	let isCommunityOrg = false;
	let displayName = 'Pengguna';
	let orgName = 'Lembaga';
	let orgType: string | null = null;
	let ummahHref = '/fitur-belum-tersedia?fitur=Qurban';
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

	type MediaItem = {
		id: string;
		url: string;
		createdAt?: number;
	};
	let mediaItems: MediaItem[] = [];
	let uploadingMedia = false;
	let uploadMediaError = '';
	let mediaFileInput: HTMLInputElement | null = null;

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
	type TpqSummaryCard = {
		label: string;
		value: string;
		desc: string;
		href: string;
		tone: string;
	};
	type FeatureCard = {
		label: string;
		desc: string;
		href: string;
		tone: string;
	};
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
	let users: any[] = [];
	let orgs: any[] = [];
	let roleLabel = 'Pengguna';
	let orgTypeLabel = 'Lembaga';
	let dashboardSubtitle = '';
	let contextPills: ContextPill[] = [];
	let dashboardStats: DashboardStat[] = [];
	let statusItems: StatusItem[] = [];
	let activityFeed: ActivityItem[] = [];
	let insightCards: InsightCard[] = [];
	let chartBars: ChartBar[] = [];
	let chartTitle = 'Ringkasan tren';
	let chartDesc = 'Belum tersedia';
	let chartMeta = 'Perlu data aktivitas';

	const roleLabelMap: Record<string, string> = {
		SUPER_ADMIN: 'Super Admin',
		support: 'Support',
		auditor: 'Auditor',
		admin: 'Admin Lembaga',
		kepala: 'Kepala Lembaga',
		bendahara: 'Bendahara',
		pembimbing: 'Pembimbing',
		operator: 'Operator',
		sekretaris: 'Sekretaris',
		humas: 'Humas',
		kurikulum: 'Kurikulum',
		pembina: 'Pembina',
		pengajar: 'Pengajar',
		ustadz: 'Pengajar',
		ustadzah: 'Pengajar',
		santri: 'Santri',
		wali: 'Wali Santri',
		alumni: 'Alumni',
		jamaah: 'Jamaah',
		takmir: 'Takmir',
		tamir: 'Takmir',
		imam: 'Imam',
		khotib: 'Khotib',
		muadzin: 'Muadzin'
	};

	const orgTypeLabelMap: Record<string, string> = {
		tpq: 'TPQ',
		pondok: 'Pondok Pesantren',
		masjid: 'Masjid',
		musholla: 'Musholla',
		'rumah-tahfidz': 'Rumah Tahfidz',
		rumah_tahfidz: 'Rumah Tahfidz'
	};

	const getRoleLabel = (value: string) =>
		roleLabelMap[value] ?? roleLabelMap[value.toLowerCase()] ?? (value || 'Pengguna');
	const getOrgTypeLabel = (value: string | null | undefined) =>
		orgTypeLabelMap[value ?? ''] ?? 'Lembaga';
	const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value || 0)));
	const isSoonLink = (href: string) => href.includes('/fitur-belum-tersedia');

	const statToneClasses: Record<
		DashboardTone,
		{ card: string; icon: string; accent: string; badge: string }
	> = {
		green: {
			card: 'border-emerald-100 bg-white hover:border-emerald-200',
			icon: 'bg-emerald-50 text-emerald-700',
			accent: 'bg-emerald-500',
			badge: 'bg-emerald-50 text-emerald-700'
		},
		gold: {
			card: 'border-amber-100 bg-white hover:border-amber-200',
			icon: 'bg-amber-50 text-amber-700',
			accent: 'bg-amber-400',
			badge: 'bg-amber-50 text-amber-700'
		},
		sky: {
			card: 'border-sky-100 bg-white hover:border-sky-200',
			icon: 'bg-sky-50 text-sky-700',
			accent: 'bg-sky-500',
			badge: 'bg-sky-50 text-sky-700'
		},
		slate: {
			card: 'border-slate-200 bg-white hover:border-slate-300',
			icon: 'bg-slate-100 text-slate-700',
			accent: 'bg-slate-400',
			badge: 'bg-slate-100 text-slate-700'
		},
		rose: {
			card: 'border-rose-100 bg-white hover:border-rose-200',
			icon: 'bg-rose-50 text-rose-700',
			accent: 'bg-rose-500',
			badge: 'bg-rose-50 text-rose-700'
		},
		violet: {
			card: 'border-violet-100 bg-white hover:border-violet-200',
			icon: 'bg-violet-50 text-violet-700',
			accent: 'bg-violet-500',
			badge: 'bg-violet-50 text-violet-700'
		}
	};

	const getTone = (tone: DashboardTone) => statToneClasses[tone] ?? statToneClasses.green;

	const getQuickIcon = (label: string): IconComponent => {
		const text = label.toLowerCase();
		if (text.includes('keuangan') || text.includes('kas')) return Wallet;
		if (text.includes('kalender') || text.includes('jadwal') || text.includes('agenda'))
			return CalendarDays;
		if (
			text.includes('santri') ||
			text.includes('jamaah') ||
			text.includes('pengguna') ||
			text.includes('akun')
		)
			return Users;
		if (text.includes('setoran') || text.includes('review') || text.includes('riwayat'))
			return ClipboardCheck;
		if (
			text.includes('hafalan') ||
			text.includes('rapor') ||
			text.includes('diniyah') ||
			text.includes('halaqoh')
		)
			return BookOpen;
		if (text.includes('sosial') || text.includes('pengumuman')) return Megaphone;
		if (text.includes('aset') || text.includes('lembaga')) return Building2;
		return Zap;
	};

	$: {
		role = data?.role ?? '';
		isSuperAdmin = role.replace('-', '_').toUpperCase() === 'SUPER_ADMIN';
		isAdmin = role === 'admin' || isSuperAdmin;
		isCoordinator = isMentoringRole(role);
		isUstadz = isTeachingRole(role);
		isStaff = isAdmin || isCoordinator || isUstadz;
		isStudent = role === 'santri' || role === 'alumni';
		isEducationalOrg = Boolean(data?.isEducationalOrg);
		isCommunityOrg = Boolean(data?.isCommunityOrg);
		displayName = data?.currentUser?.username || data?.currentUser?.email || 'Pengguna';
		orgName = data?.org?.name || 'Lembaga';
		orgType = data?.org?.type ?? null;
		ummahHref = data?.org?.slug
			? `/org/${encodeURIComponent(data.org.slug)}/ummah`
			: '/fitur-belum-tersedia?fitur=Qurban';
		roleLabel = getRoleLabel(role);
		orgTypeLabel = getOrgTypeLabel(orgType);
		dashboardTitle = isSuperAdmin
			? 'Dashboard Super Admin'
			: orgType === 'tpq'
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
		dashboardSubtitle = isSuperAdmin
			? 'Ringkasan platform mengikuti akses super admin.'
			: isCommunityOrg
				? `Pantau jamaah, agenda, kas, dan aset ${orgName} dari satu tempat.`
				: isStudent
					? `Ikuti progres belajar dan hafalan pribadi di ${orgName}.`
					: isStaff
						? `Pantau setoran, kelas, santri, dan agenda ${orgName}.`
						: `Ringkasan aktivitas ${orgName} sesuai izin akun.`;
		contextPills = [
			{ label: roleLabel, active: true },
			{ label: orgTypeLabel },
			{ label: dashboardModeLabel },
			{ label: 'Tampilan mengikuti izin akun' }
		];
		featureCards =
			orgType === 'masjid'
				? [
						{
							label: 'Data Jamaah',
							desc: 'Kelola anggota dan pengurus masjid.',
							href: '/dashboard/kelola-santri',
							tone: 'from-emerald-50 to-teal-100 text-emerald-900'
						},
						{
							label: 'Kas Masjid',
							desc: 'Pantau pemasukan dan pengeluaran kas.',
							href: '/keuangan',
							tone: 'from-amber-50 to-orange-100 text-amber-900'
						},
						{
							label: 'Jadwal Imam/Khotib',
							desc: 'Atur jadwal imam, tarawih, dan khotib.',
							href: '/dashboard/jadwal',
							tone: 'from-sky-50 to-cyan-100 text-sky-900'
						},
						{
							label: 'Qurban',
							desc: 'Pendataan program qurban lembaga.',
							href: ummahHref,
							tone: 'from-rose-50 to-pink-100 text-rose-900'
						},
						{
							label: 'Pengumuman',
							desc: 'Informasi untuk jamaah masjid.',
							href: '/fitur-belum-tersedia?fitur=Pengumuman Masjid',
							tone: 'from-violet-50 to-indigo-100 text-indigo-900'
						},
						{
							label: 'Sosial Jamaah',
							desc: 'Feed internal jamaah dan pengurus.',
							href: '/beranda',
							tone: 'from-lime-50 to-emerald-100 text-lime-900'
						}
					]
				: orgType === 'musholla'
					? [
							{
								label: 'Data Jamaah',
								desc: 'Kelola anggota dan pengurus musholla.',
								href: '/dashboard/kelola-santri',
								tone: 'from-emerald-50 to-teal-100 text-emerald-900'
							},
							{
								label: 'Kas Musholla',
								desc: 'Catat kas masuk dan keluar.',
								href: '/keuangan',
								tone: 'from-amber-50 to-orange-100 text-amber-900'
							},
							{
								label: 'Jadwal Imam',
								desc: 'Atur jadwal imam dan kegiatan ibadah.',
								href: '/dashboard/jadwal',
								tone: 'from-sky-50 to-cyan-100 text-sky-900'
							},
							{
								label: 'Qurban',
								desc: 'Pendataan program qurban musholla.',
								href: ummahHref,
								tone: 'from-rose-50 to-pink-100 text-rose-900'
							},
							{
								label: 'Pengumuman',
								desc: 'Informasi untuk warga sekitar.',
								href: '/fitur-belum-tersedia?fitur=Pengumuman Musholla',
								tone: 'from-violet-50 to-indigo-100 text-indigo-900'
							},
							{
								label: 'Sosial',
								desc: 'Feed internal jamaah musholla.',
								href: '/beranda',
								tone: 'from-lime-50 to-emerald-100 text-lime-900'
							}
						]
					: orgType === 'pondok'
						? [
								{
									label: 'Data Santri',
									desc: 'Kelola santri dan pengajar pondok.',
									href: '/dashboard/kelola-santri',
									tone: 'from-emerald-50 to-teal-100 text-emerald-900'
								},
								{
									label: 'Asrama/Kamar',
									desc: 'Data kamar dan penempatan santri.',
									href: '/fitur-belum-tersedia?fitur=Asrama/Kamar',
									tone: 'from-amber-50 to-orange-100 text-amber-900'
								},
								{
									label: 'Diniyah',
									desc: 'Materi diniyah dan pembelajaran kitab.',
									href: '/dashboard/diniyah',
									tone: 'from-sky-50 to-cyan-100 text-sky-900'
								},
								{
									label: 'Hafalan',
									desc: 'Pantau progres hafalan santri.',
									href: '/dashboard/pencapaian-hafalan',
									tone: 'from-lime-50 to-emerald-100 text-lime-900'
								},
								{
									label: 'Keuangan',
									desc: 'Keuangan pondok sedang disiapkan.',
									href: '/fitur-belum-tersedia?fitur=Keuangan Pondok',
									tone: 'from-rose-50 to-pink-100 text-rose-900'
								},
								{
									label: 'Sosial',
									desc: 'Feed internal pondok.',
									href: '/beranda',
									tone: 'from-violet-50 to-indigo-100 text-indigo-900'
								}
							]
						: orgType === 'rumah-tahfidz'
							? [
									{
										label: 'Data Santri',
										desc: 'Kelola santri rumah tahfidz.',
										href: '/dashboard/kelola-santri',
										tone: 'from-emerald-50 to-teal-100 text-emerald-900'
									},
									{
										label: 'Halaqoh',
										desc: 'Kelola kelompok hafalan.',
										href: '/dashboard/halaqoh',
										tone: 'from-amber-50 to-orange-100 text-amber-900'
									},
									{
										label: 'Setoran Hafalan',
										desc: 'Alur setoran khusus rumah tahfidz.',
										href: '/fitur-belum-tersedia?fitur=Setoran Hafalan Rumah Tahfidz',
										tone: 'from-sky-50 to-cyan-100 text-sky-900'
									},
									{
										label: 'Progress Hafalan',
										desc: 'Pantau capaian hafalan santri.',
										href: '/dashboard/pencapaian-hafalan',
										tone: 'from-lime-50 to-emerald-100 text-lime-900'
									},
									{
										label: 'Jadwal',
										desc: 'Agenda dan jadwal halaqoh.',
										href: '/kalender',
										tone: 'from-rose-50 to-pink-100 text-rose-900'
									},
									{
										label: 'Sosial',
										desc: 'Feed internal rumah tahfidz.',
										href: '/beranda',
										tone: 'from-violet-50 to-indigo-100 text-indigo-900'
									}
								]
							: [
									{
										label: 'Data Santri',
										desc: 'Kelola data santri TPQ.',
										href: '/dashboard/kelola-santri',
										tone: 'from-emerald-50 to-teal-100 text-emerald-900'
									},
									{
										label: 'Setoran Hari Ini',
										desc: 'Input dan pantau setoran hafalan.',
										href: '/tpq/akademik/setoran',
										tone: 'from-amber-50 to-orange-100 text-amber-900'
									},
									{
										label: 'Ujian Tahfidz',
										desc: 'Kelola ujian dan capaian.',
										href: '/dashboard/ujian-tahfidz',
										tone: 'from-sky-50 to-cyan-100 text-sky-900'
									},
									{
										label: 'Rapor Hafalan',
										desc: 'Lihat rapor dan sertifikat.',
										href: '/tpq/hafalan-rapor',
										tone: 'from-lime-50 to-emerald-100 text-lime-900'
									},
									{
										label: 'Akademik',
										desc: 'Pusat alur akademik TPQ.',
										href: '/tpq/akademik',
										tone: 'from-rose-50 to-pink-100 text-rose-900'
									},
									{
										label: 'Sosial Santri',
										desc: 'Feed internal santri dan pengajar.',
										href: '/beranda',
										tone: 'from-violet-50 to-indigo-100 text-indigo-900'
									}
								];

		pending = data?.pending ?? [];
		students = data?.students ?? [];
		users = (data as any)?.users ?? [];
		orgs = (data as any)?.orgs ?? [];
		checklist = data?.checklist ?? [];
		series = data?.series ?? [];
		stats = data?.stats ?? { approved: 0, submitted: 0, todayApproved: 0 };
		finance = data?.finance ?? null;
		communitySchedule = data?.communitySchedule ?? [];
		kasWeeklyIn = data?.kasWeeklyIn ?? 0;
		canManageCommunity = Boolean(data?.canManageCommunity);
		isCommunityManager = canManageCommunity;
		assets = (data?.assets ?? []) as AssetRow[];
		mediaItems = (data?.media ?? []) as MediaItem[];
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
					desc: canReview
						? 'Menunggu keputusan koordinator/admin'
						: 'Menunggu review koordinator/admin',
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

		const hasFinanceData = Boolean(finance?.kas);
		const approvedTotal = students.reduce(
			(sum: number, student: any) => sum + (student.approvedAyah ?? 0),
			0
		);
		const totalApproved = tpqDashboard?.approvedAyah ?? approvedTotal;
		const personalPercent = Math.round(((data as any)?.percentage ?? 0) * 100) / 100;
		const firstAgenda = isCommunityOrg ? communitySchedule[0] : tpqAgenda[0];
		const financeEntries = finance?.kas?.entries ?? [];

		if (isSuperAdmin) {
			dashboardStats = [
				{
					label: 'Total lembaga',
					value: orgs.length ? formatNumber(orgs.length) : 'Belum tersedia',
					desc: orgs.length ? 'Data organisasi existing' : 'Dialihkan ke dashboard super admin',
					href: '/admin/super/overview',
					tone: 'green',
					icon: Building2,
					source: orgs.length ? 'Existing' : 'Belum tersedia'
				},
				{
					label: 'Total pengguna',
					value: users.length ? formatNumber(users.length) : 'Belum tersedia',
					desc: users.length ? 'Data user existing' : 'Gunakan overview super admin',
					href: '/admin/super/overview',
					tone: 'sky',
					icon: Users,
					source: users.length ? 'Existing' : 'Belum tersedia'
				},
				{
					label: 'Lisensi aktif',
					value: 'Belum tersedia',
					desc: 'Perlu integrasi metrics lisensi',
					href: '/admin/super/overview',
					tone: 'gold',
					icon: ShieldCheck,
					source: 'Perlu metrics'
				},
				{
					label: 'AI / storage',
					value: 'Perlu metrics',
					desc: 'Belum ada data usage di load dashboard',
					href: '/admin/super/overview',
					tone: 'slate',
					icon: Database,
					source: 'Placeholder aman'
				}
			];
		} else if (isCommunityOrg) {
			dashboardStats = [
				{
					label: 'Saldo kas',
					value: hasFinanceData ? formatCurrency(finance.kas?.saldo ?? 0) : 'Belum tersedia',
					desc: hasFinanceData ? 'Dari ringkasan kas lembaga' : 'Perlu data kas lembaga',
					href: '/keuangan',
					tone: 'green',
					icon: Wallet,
					source: hasFinanceData ? 'Existing' : 'Belum tersedia'
				},
				{
					label: 'Pemasukan 7 hari',
					value: hasFinanceData ? formatCurrency(kasWeeklyIn) : 'Belum tersedia',
					desc: hasFinanceData ? 'Query kas_masjid 7 hari' : 'Belum ada ringkasan kas',
					href: '/keuangan',
					tone: 'gold',
					icon: TrendingUp,
					source: hasFinanceData ? 'Existing' : 'Belum tersedia'
				},
				{
					label: 'Agenda 14 hari',
					value: formatNumber(communitySchedule.length),
					desc: 'Dari kalender lembaga',
					href: '/kalender',
					tone: 'sky',
					icon: CalendarDays,
					source: 'Existing'
				},
				{
					label: 'Aset lembaga',
					value: canManageCommunity ? formatNumber(assets.length) : 'Sesuai izin',
					desc: canManageCommunity
						? 'Inventaris yang bisa dikelola'
						: 'Pengelolaan aset hanya untuk pengurus',
					href: canManageCommunity ? '/dashboard/kelola-aset' : '/dashboard',
					tone: 'slate',
					icon: Building2,
					source: canManageCommunity ? 'Existing' : 'Role-aware'
				}
			];
		} else if (isStudent) {
			dashboardStats = [
				{
					label: 'Progres pribadi',
					value: `${personalPercent}%`,
					desc: 'Berdasarkan ayat disetujui',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'green',
					icon: GraduationCap,
					source: 'Existing'
				},
				{
					label: 'Ayat disetujui',
					value: formatNumber(stats.approved ?? 0),
					desc: 'Total capaian hafalan',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'sky',
					icon: CheckCircle2,
					source: 'Existing'
				},
				{
					label: 'Setoran diajukan',
					value: formatNumber(stats.submitted ?? 0),
					desc: 'Total setoran pribadi',
					href: '/tpq/akademik/riwayat',
					tone: 'gold',
					icon: ClipboardCheck,
					source: 'Existing'
				},
				{
					label: 'Disetujui hari ini',
					value: formatNumber(stats.todayApproved ?? 0),
					desc: 'Aktivitas hari ini',
					href: '/tpq/akademik/riwayat',
					tone: 'violet',
					icon: Activity,
					source: 'Existing'
				}
			];
		} else if (isStaff) {
			dashboardStats = [
				{
					label: orgType === 'tpq' ? 'Setoran hari ini' : 'Pengguna lembaga',
					value:
						orgType === 'tpq' && tpqDashboard
							? formatNumber(tpqDashboard.today?.total ?? 0)
							: formatNumber(users.length || students.length),
					desc:
						orgType === 'tpq' && tpqDashboard
							? 'Setoran resmi hari ini'
							: 'Data user/santri existing',
					href: orgType === 'tpq' ? academicPrimaryHref : '/dashboard/kelola-santri',
					tone: 'green',
					icon: ClipboardCheck,
					source: 'Existing'
				},
				{
					label: 'Perlu review',
					value: formatNumber(tpqDashboard?.pendingReview ?? pending.length),
					desc: tpqDashboard?.canReviewSetoran
						? 'Menunggu validasi Anda'
						: 'Menunggu koordinator/admin',
					href: tpqDashboard?.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat',
					tone: 'gold',
					icon: Clock3,
					source: 'Existing'
				},
				{
					label: 'Santri aktif',
					value: formatNumber(tpqDashboard?.activeSantri ?? students.length),
					desc: isUstadz ? 'Santri dalam bimbingan Anda' : 'Santri dalam lembaga',
					href: '/dashboard/kelola-santri',
					tone: 'sky',
					icon: Users,
					source: 'Existing'
				},
				{
					label: 'Ayat disetujui',
					value: formatNumber(totalApproved),
					desc: 'Rekap capaian hafalan',
					href: '/dashboard/pencapaian-hafalan',
					tone: 'violet',
					icon: BookOpen,
					source: 'Existing'
				}
			];
		} else {
			dashboardStats = [
				{
					label: 'Peran akun',
					value: roleLabel,
					desc: 'Tampilan mengikuti izin akun',
					href: '/akun',
					tone: 'green',
					icon: ShieldCheck,
					source: 'Session'
				},
				{
					label: 'Lembaga aktif',
					value: orgName,
					desc: orgTypeLabel,
					href: '/dashboard',
					tone: 'sky',
					icon: Building2,
					source: 'Session'
				},
				{
					label: 'Agenda',
					value: isCommunityOrg ? formatNumber(communitySchedule.length) : 'Belum tersedia',
					desc: 'Akan tampil jika data tersedia',
					href: '/kalender',
					tone: 'gold',
					icon: CalendarDays,
					source: isCommunityOrg ? 'Existing' : 'Belum tersedia'
				},
				{
					label: 'Metrics tambahan',
					value: 'Perlu metrics',
					desc: 'Storage, AI, WA belum ada di load dashboard',
					href: '/dashboard',
					tone: 'slate',
					icon: Database,
					source: 'Placeholder aman'
				}
			];
		}

		statusItems = [
			{
				label: 'Izin dashboard',
				value: roleLabel,
				desc: 'Widget disaring dari role dan lembaga aktif.',
				tone: 'green',
				icon: ShieldCheck,
				progress: null
			},
			{
				label: orgType === 'tpq' ? 'TPQ akademik' : 'Data halaman',
				value: orgType === 'tpq' && tpqDashboard ? 'Aktif' : 'Termuat',
				desc:
					orgType === 'tpq' && tpqDashboard
						? 'Setoran, review, riwayat, rapor, dan agenda tersedia.'
						: 'Data berasal dari server load dashboard.',
				tone: orgType === 'tpq' && tpqDashboard ? 'green' : 'sky',
				icon: Activity,
				progress:
					orgType === 'tpq' && tpqDashboard ? clampPercent(tpqDashboard.progressPercent ?? 0) : null
			},
			{
				label: 'D1 / R2 metrics',
				value: 'Perlu integrasi metrics',
				desc: 'Tidak ada usage storage atau database metrics di load ini.',
				tone: 'slate',
				icon: HardDrive,
				progress: null
			},
			{
				label: 'AI / WA summary',
				value: 'Perlu integrasi metrics',
				desc: 'Belum ada token AI atau WhatsApp delivery metrics.',
				tone: 'gold',
				icon: MessageCircle,
				progress: null
			}
		];

		if (tpqRecentSetoran.length) {
			activityFeed = tpqRecentSetoran.slice(0, 5).map((item: any) => ({
				title: `${item.santriName || 'Santri'} menyetor hafalan`,
				desc: `${getSurahName(Number(item.surah))} ${item.ayatFrom}-${item.ayatTo} oleh ${item.ustadzName || 'Pengampu'}`,
				meta: `${formatDate(item.date)} - ${getSetoranStatusLabel(item.status)}`,
				tone: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'rose' : 'gold',
				icon: ClipboardCheck,
				href: '/tpq/akademik/riwayat'
			}));
		} else if (isCommunityOrg && (financeEntries.length || communitySchedule.length)) {
			const financeActivities = financeEntries.slice(0, 3).map((entry: any) => ({
				title: entry.tipe === 'masuk' ? 'Kas masuk' : 'Kas keluar',
				desc: `${entry.kategori || 'Transaksi'} - ${formatCurrency(entry.nominal ?? 0)}`,
				meta: formatDate(entry.tanggal),
				tone: entry.tipe === 'masuk' ? 'green' : 'rose',
				icon: Wallet,
				href: '/keuangan'
			}));
			const agendaActivities = communitySchedule.slice(0, 2).map((item: any) => ({
				title: item.title || 'Agenda komunitas',
				desc: item.content || 'Agenda kegiatan lembaga',
				meta: formatDate(item.eventDate),
				tone: 'sky',
				icon: CalendarDays,
				href: '/kalender'
			}));
			activityFeed = [...financeActivities, ...agendaActivities].slice(0, 5);
		} else if (pending.length) {
			activityFeed = pending.slice(0, 5).map((item: any) => ({
				title: `${item.username || item.santriName || item.email || 'Santri'} menunggu review`,
				desc: item.surah
					? `${getSurahName(Number(item.surah))} ${item.ayatFrom ?? item.ayat_from ?? ''}-${item.ayatTo ?? item.ayat_to ?? ''}`
					: 'Setoran hafalan',
				meta: formatDate(item.createdAt ?? item.created_at ?? item.date),
				tone: 'gold',
				icon: Clock3,
				href: tpqDashboard?.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat'
			}));
		} else {
			activityFeed = [];
		}

		if (isCommunityOrg) {
			insightCards = [
				{
					label: 'Agenda terdekat',
					value: firstAgenda?.title ?? 'Belum tersedia',
					desc: firstAgenda
						? formatDate(firstAgenda.eventDate)
						: 'Tambahkan agenda melalui kalender.',
					tone: 'sky',
					icon: CalendarDays
				},
				{
					label: 'Transaksi kas',
					value: hasFinanceData ? `${financeEntries.length} terbaru` : 'Belum tersedia',
					desc: hasFinanceData ? 'Dari ringkasan kas lembaga.' : 'Perlu data kas lembaga.',
					tone: 'green',
					icon: Wallet
				},
				{
					label: 'Aset lembaga',
					value: canManageCommunity ? formatNumber(assets.length) : 'Sesuai izin',
					desc: canManageCommunity
						? 'Dari inventaris organisasi.'
						: 'Akses aset dibatasi untuk pengurus.',
					tone: 'gold',
					icon: Building2
				}
			];
		} else if (isStudent) {
			const topSurah = topChecklist[0];
			insightCards = [
				{
					label: 'Surah paling maju',
					value:
						topSurah?.name || (topSurah ? getSurahName(topSurah.surahNumber) : 'Belum tersedia'),
					desc: topSurah
						? `${topSurah.disetujui}/${topSurah.totalAyah} ayat disetujui`
						: 'Mulai setoran agar insight muncul.',
					tone: 'green',
					icon: BookOpen
				},
				{
					label: 'Aktivitas 7 hari',
					value: formatNumber(
						series.reduce((sum: number, item: any) => sum + (item.approved ?? 0), 0)
					),
					desc: 'Ayat disetujui dalam grafik existing.',
					tone: 'sky',
					icon: BarChart3
				},
				{
					label: 'Target berikutnya',
					value: 'Belum tersedia',
					desc: 'Perlu data target belajar personal.',
					tone: 'gold',
					icon: Sparkles
				}
			];
		} else if (isStaff) {
			insightCards = [
				{
					label: 'Progress lembaga',
					value: tpqDashboard ? `${tpqDashboard.progressPercent ?? 0}%` : 'Belum tersedia',
					desc: tpqDashboard
						? `${formatNumber(totalApproved)} ayat disetujui`
						: 'Tersedia untuk alur TPQ.',
					tone: 'green',
					icon: TrendingUp
				},
				{
					label: 'Rapor lulus',
					value: tpqDashboard ? formatNumber(tpqDashboard.rapor?.lulus ?? 0) : 'Belum tersedia',
					desc: tpqDashboard
						? `${formatNumber(tpqDashboard.rapor?.total ?? 0)} total rapor`
						: 'Perlu data rapor.',
					tone: 'sky',
					icon: GraduationCap
				},
				{
					label: 'Sertifikat',
					value: tpqDashboard ? formatNumber(tpqDashboard.certificateCount ?? 0) : 'Belum tersedia',
					desc: tpqDashboard ? 'Sertifikat tersimpan di data existing.' : 'Perlu data sertifikat.',
					tone: 'gold',
					icon: ShieldCheck
				}
			];
		} else {
			insightCards = [
				{
					label: 'Insight akun',
					value: roleLabel,
					desc: 'Tampilan mengikuti izin akun.',
					tone: 'green',
					icon: ShieldCheck
				},
				{
					label: 'Metrics sistem',
					value: 'Perlu integrasi metrics',
					desc: 'D1, R2, AI, dan WA belum tersedia di load.',
					tone: 'slate',
					icon: Database
				},
				{
					label: 'Aktivitas',
					value: 'Belum tersedia',
					desc: 'Aktivitas akan muncul setelah ada data terkait.',
					tone: 'gold',
					icon: Activity
				}
			];
		}

		if (seriesBars.length) {
			chartTitle = 'Aktivitas 7 Hari Terakhir';
			chartDesc = 'Data berdasarkan setoran yang disetujui.';
			chartMeta = 'Existing: getDailySeries';
			chartBars = seriesBars.map((entry) => ({
				label: entry.label,
				value: entry.value,
				display: formatNumber(entry.value),
				height: Math.max(8, entry.height),
				tone: 'from-emerald-500 to-teal-400'
			}));
		} else if (financeEntries.length) {
			const latest = financeEntries.slice(0, 6).reverse();
			const maxNominal = Math.max(1, ...latest.map((entry: any) => Math.abs(entry.nominal ?? 0)));
			chartTitle = 'Arus Kas Terbaru';
			chartDesc = 'Visual dari transaksi kas existing.';
			chartMeta = 'Existing: getOrgFinanceSummary';
			chartBars = latest.map((entry: any) => ({
				label: formatDate(entry.tanggal).split(' ')[0],
				value: Math.abs(entry.nominal ?? 0),
				display: formatCurrency(Math.abs(entry.nominal ?? 0)),
				height: Math.max(8, Math.round((Math.abs(entry.nominal ?? 0) / maxNominal) * 100)),
				tone:
					entry.tipe === 'masuk' ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-orange-400'
			}));
		} else if (studentHighlights.length) {
			chartTitle = 'Sebaran Progres Santri';
			chartDesc = isUstadz ? 'Santri dalam bimbingan Anda.' : 'Santri dengan progres tertinggi.';
			chartMeta = 'Existing: getAllStudentsProgress';
			chartBars = studentHighlights.map((student: any) => ({
				label: student.username || student.email || 'Santri',
				value: Math.round(student.percentage ?? 0),
				display: `${Math.round(student.percentage ?? 0)}%`,
				height: Math.max(8, clampPercent(student.percentage ?? 0)),
				tone: 'from-emerald-500 to-teal-400'
			}));
		} else if (tpqDashboard && tpqDashboard.today?.total > 0) {
			const todayRows = [
				{
					label: 'Disetujui',
					value: tpqDashboard.today.approved ?? 0,
					tone: 'from-emerald-500 to-teal-400'
				},
				{
					label: 'Menunggu',
					value: tpqDashboard.today.submitted ?? 0,
					tone: 'from-amber-400 to-orange-400'
				},
				{
					label: 'Perbaikan',
					value: tpqDashboard.today.rejected ?? 0,
					tone: 'from-rose-500 to-orange-400'
				}
			];
			const maxToday = Math.max(1, ...todayRows.map((item) => item.value));
			chartTitle = 'Setoran Hari Ini';
			chartDesc = 'Status setoran resmi hari ini.';
			chartMeta = 'Existing: tpq_setoran';
			chartBars = todayRows.map((item) => ({
				...item,
				display: formatNumber(item.value),
				height: Math.max(8, Math.round((item.value / maxToday) * 100))
			}));
		} else {
			chartTitle = isCommunityOrg
				? 'Arus Kas dan Agenda'
				: isStudent
					? 'Aktivitas Belajar'
					: 'Ringkasan Operasional';
			chartDesc = 'Belum tersedia';
			chartMeta = 'Perlu data aktivitas';
			chartBars = [];
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

	const uploadOrgMedia = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;

		uploadingMedia = true;
		uploadMediaError = '';

		try {
			const formData = new FormData();
			formData.append('file', file);

			const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
			const uploadData = await uploadRes.json();

			if (!uploadRes.ok || !uploadData.url) {
				uploadMediaError = uploadData.error || 'Gagal upload gambar.';
				return;
			}

			const saveRes = await fetch('/api/org/media', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: uploadData.url })
			});
			const saveData = await saveRes.json();

			if (!saveRes.ok) {
				uploadMediaError = saveData.error || 'Gagal menyimpan media.';
				return;
			}

			if (saveData.item) {
				mediaItems = [saveData.item, ...mediaItems];
			}
			if (mediaFileInput) mediaFileInput.value = '';
		} catch (err) {
			uploadMediaError = 'Terjadi kesalahan saat upload.';
		} finally {
			uploadingMedia = false;
		}
	};

	const deleteOrgMedia = async (id: string) => {
		if (!confirm('Hapus foto ini?')) return;

		try {
			const res = await fetch(`/api/org/media/${id}`, { method: 'DELETE' });
			if (res.ok) {
				mediaItems = mediaItems.filter((m) => m.id !== id);
			}
		} catch (err) {
			console.error('Gagal hapus media:', err);
		}
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

<div class="dashboard-command-shell mx-auto w-full max-w-[90rem] space-y-6 text-so-ink">
	<section class="fade-in admin-card min-w-0 overflow-hidden" style="animation-delay: 40ms;">
		<div
			class="grid min-w-0 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-stretch"
		>
			<div class="min-w-0">
				<div class="flex min-w-0 flex-wrap items-center gap-2">
					{#each contextPills as pill}
						<span
							class={`inline-flex min-h-9 max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-bold ${
								pill.active
									? 'border-so-green bg-so-green text-white shadow-sm'
									: 'border-so-border bg-so-cream text-so-muted'
							}`}
						>
							<span class="min-w-0 break-words">{pill.label}</span>
						</span>
					{/each}
				</div>
				<h1
					class="font-display mt-4 break-words text-3xl font-bold leading-tight text-so-green sm:text-4xl"
				>
					{dashboardTitle}
				</h1>
				<p class="mt-2 max-w-3xl break-words text-sm leading-6 text-so-muted sm:text-base">
					{dashboardSubtitle}
				</p>
				<div class="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
					{#each statHighlights as item}
						<a
							href={item.href}
							class="min-w-0 rounded-xl border border-so-border bg-so-cream/75 p-3 transition hover:border-so-green hover:bg-white"
						>
							<p class="break-words text-[11px] font-bold uppercase text-so-muted">{item.label}</p>
							<p class="mt-1 truncate text-lg font-bold text-so-green">{item.value}</p>
						</a>
					{/each}
				</div>
			</div>
			<div class="min-w-0 rounded-xl border border-so-border bg-so-cream p-3 shadow-sm sm:p-4">
				<div
					class="flex min-w-0 items-center gap-3 rounded-xl border border-so-border bg-white px-3 py-3 shadow-sm"
				>
					<Search size={18} class="shrink-0 text-so-muted" strokeWidth={2.2} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-bold text-so-ink">
							{displayName}
						</p>
						<p class="truncate text-xs text-so-muted">
							{orgName} - {roleLabel}
						</p>
					</div>
				</div>
				<div
					class="mt-3 flex min-w-0 items-start gap-2 rounded-xl border border-so-gold/30 bg-white/75 px-3 py-3 text-xs text-so-muted"
				>
					<ShieldCheck size={15} class="mt-0.5 shrink-0 text-so-green" strokeWidth={2.2} />
					<span class="min-w-0 break-words"
						>Ini bukan role switcher. Tampilan mengikuti izin akun aktif.</span
					>
				</div>
			</div>
		</div>
	</section>

	<section
		class="fade-in grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
		style="animation-delay: 70ms;"
	>
		{#each dashboardStats as stat}
			<a
				href={stat.href}
				class="admin-card group relative min-h-[9.25rem] min-w-0 overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-so-green hover:shadow-soft"
			>
				<span class={`absolute inset-x-0 top-0 h-1 ${getTone(stat.tone).accent}`}></span>
				<div class="flex min-w-0 items-start justify-between gap-3">
					<span
						class={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${getTone(stat.tone).icon}`}
					>
						<svelte:component this={stat.icon} size={21} strokeWidth={2.2} />
					</span>
					<span
						class={`min-w-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getTone(stat.tone).badge}`}
					>
						{stat.source}
					</span>
				</div>
				<p class="mt-4 break-words text-xs font-bold uppercase text-so-muted">
					{stat.label}
				</p>
				<p class="mt-1 break-words text-2xl font-bold leading-tight text-so-ink tabular-nums">
					{stat.value}
				</p>
				<div class="mt-2 flex min-w-0 items-end justify-between gap-2">
					<p class="min-w-0 break-words text-xs leading-5 text-so-muted">
						{stat.desc}
					</p>
					<ArrowRight
						size={16}
						class="shrink-0 text-so-muted/45 transition group-hover:text-so-green"
						strokeWidth={2.2}
					/>
				</div>
			</a>
		{/each}
	</section>

	<section class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
		<div
			class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-8"
			style="animation-delay: 100ms;"
		>
			<div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase text-so-green">Overview</p>
					<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green">
						{chartTitle}
					</h2>
					<p class="mt-1 break-words text-sm text-so-muted">{chartDesc}</p>
				</div>
				<span
					class="inline-flex min-h-9 w-fit items-center rounded-full border border-so-border bg-white px-3 py-1.5 text-xs font-bold text-so-muted"
				>
					{chartMeta}
				</span>
			</div>

			{#if chartBars.length}
				<div
					class="soft-grid mt-6 h-72 min-w-0 rounded-xl border border-so-border bg-so-cream p-3 sm:p-4"
				>
					<div class="flex h-full min-w-0 items-end gap-2 sm:gap-3">
						{#each chartBars as entry}
							<div class="flex min-w-0 flex-1 flex-col items-center justify-end">
								<div
									class={`w-full min-w-0 rounded-t-xl bg-gradient-to-t ${entry.tone} shadow-sm`}
									style={`height: ${entry.height}%`}
								></div>
								<p class="mt-2 w-full truncate text-center text-[11px] font-semibold text-so-muted">
									{entry.label}
								</p>
								<p class="w-full truncate text-center text-[11px] font-bold text-so-ink">
									{entry.display}
								</p>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div
					class="mt-6 grid min-h-72 place-items-center rounded-xl border border-dashed border-so-border bg-so-cream/70 p-6 text-center"
				>
					<div class="max-w-sm">
						<BarChart3 class="mx-auto text-so-green/35" size={38} strokeWidth={1.8} />
						<p class="mt-3 text-sm font-bold text-so-green">Belum tersedia</p>
						<p class="mt-1 text-xs leading-5 text-so-muted">
							Chart akan aktif setelah data aktivitas, kas, atau progress tersedia dari server load.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<div
			class="fade-in admin-card min-w-0 overflow-hidden xl:col-span-4"
			style="animation-delay: 130ms;"
		>
			<div class="border-b border-so-border bg-so-cream/55 p-4 sm:p-5">
				<p class="text-xs font-bold uppercase text-so-green">Status Panel</p>
				<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green">
					Kesiapan Operasional
				</h2>
			</div>
			<div class="divide-y divide-so-border">
				{#each statusItems as item}
					<div class="min-w-0 p-4 sm:p-5">
						<div class="flex min-w-0 items-start gap-3">
							<span
								class={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${getTone(item.tone).icon}`}
							>
								<svelte:component this={item.icon} size={20} strokeWidth={2.2} />
							</span>
							<div class="min-w-0 flex-1">
								<div
									class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
								>
									<p class="min-w-0 break-words text-sm font-bold text-so-ink">
										{item.label}
									</p>
									<span
										class={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${getTone(item.tone).badge}`}
									>
										{item.value}
									</span>
								</div>
								<p class="mt-1 break-words text-xs leading-5 text-so-muted">
									{item.desc}
								</p>
								{#if item.progress !== null && item.progress !== undefined}
									<div class="mt-3 h-2 rounded-full bg-so-cream">
										<div
											class={`h-2 rounded-full ${getTone(item.tone).accent}`}
											style={`width: ${item.progress}%`}
										></div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
		<div
			class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-4"
			style="animation-delay: 160ms;"
		>
			<div class="flex min-w-0 items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase text-so-green">Aktivitas</p>
					<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green">Terbaru</h2>
				</div>
				<Activity size={20} class="shrink-0 text-so-green" strokeWidth={2.2} />
			</div>
			{#if activityFeed.length}
				<div class="mt-4 space-y-3">
					{#each activityFeed as item}
						<a
							href={item.href ?? '/dashboard'}
							class="group flex min-w-0 gap-3 rounded-xl border border-so-border bg-so-cream/60 p-3 transition hover:border-so-green hover:bg-white hover:shadow-sm"
						>
							<span
								class={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${getTone(item.tone).icon}`}
							>
								<svelte:component this={item.icon} size={18} strokeWidth={2.2} />
							</span>
							<span class="min-w-0 flex-1">
								<span class="block break-words text-sm font-bold text-so-ink">{item.title}</span>
								<span class="mt-1 block break-words text-xs leading-5 text-so-muted"
									>{item.desc}</span
								>
								<span class="mt-1 block break-words text-[11px] font-semibold text-so-muted/75"
									>{item.meta}</span
								>
							</span>
						</a>
					{/each}
				</div>
			{:else}
				<div
					class="mt-4 rounded-xl border border-dashed border-so-border bg-so-cream/70 p-5 text-sm text-so-muted"
				>
					<p class="font-bold text-so-green">Belum tersedia</p>
					<p class="mt-1 text-xs leading-5">
						Aktivitas akan muncul setelah ada setoran, agenda, atau transaksi existing.
					</p>
				</div>
			{/if}
		</div>

		<div
			class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-4"
			style="animation-delay: 190ms;"
		>
			<div class="flex min-w-0 items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase text-so-green">Quick Actions</p>
					<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green">Akses Cepat</h2>
				</div>
				<Zap size={20} class="shrink-0 text-amber-600" strokeWidth={2.2} />
			</div>
			<div class="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
				{#each quickLinks as item}
					<a
						href={item.href}
						class="group flex min-h-16 min-w-0 items-center gap-3 rounded-xl border border-so-border bg-white p-3 text-left transition hover:border-so-green hover:bg-so-cream/50 hover:shadow-sm"
					>
						<span
							class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-so-green/10 text-so-green"
						>
							<svelte:component this={getQuickIcon(item.label)} size={19} strokeWidth={2.2} />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block break-words text-sm font-bold text-so-ink">{item.label}</span>
							<span class="mt-1 block break-words text-xs leading-5 text-so-muted">{item.desc}</span
							>
						</span>
					</a>
				{/each}
			</div>
		</div>

		<div
			class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-4"
			style="animation-delay: 220ms;"
		>
			<div class="flex min-w-0 items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase text-so-green">Insight</p>
					<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green">
						Fokus Saat Ini
					</h2>
				</div>
				<Sparkles size={20} class="shrink-0 text-amber-600" strokeWidth={2.2} />
			</div>
			<div class="mt-4 space-y-3">
				{#each insightCards as item}
					<div class="flex min-w-0 gap-3 rounded-xl border border-so-border bg-so-cream/60 p-3">
						<span
							class={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${getTone(item.tone).icon}`}
						>
							<svelte:component this={item.icon} size={18} strokeWidth={2.2} />
						</span>
						<div class="min-w-0">
							<p class="break-words text-xs font-bold uppercase text-so-muted">
								{item.label}
							</p>
							<p class="mt-1 break-words text-base font-bold text-so-ink">
								{item.value}
							</p>
							<p class="mt-1 break-words text-xs leading-5 text-so-muted">
								{item.desc}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section
		class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
		style="animation-delay: 250ms;"
	>
		<div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				<p class="text-xs font-bold uppercase text-so-green">Fitur Lembaga</p>
				<h2 class="font-display mt-1 break-words text-xl font-bold text-so-green sm:text-2xl">
					{orgName}
				</h2>
			</div>
			<p class="break-words text-xs text-so-muted sm:text-sm">
				Menu disesuaikan dengan tipe lembaga dan role akun.
			</p>
		</div>

		<div class="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{#each featureCards as card}
				<a
					href={card.href}
					class="group flex min-h-[7rem] min-w-0 flex-col rounded-xl border border-so-border bg-white p-4 transition hover:border-so-green hover:bg-so-cream/50 hover:shadow-sm"
				>
					<div class="flex min-w-0 items-start justify-between gap-3">
						<span
							class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-so-green/10 text-so-green"
						>
							<svelte:component this={getQuickIcon(card.label)} size={19} strokeWidth={2.2} />
						</span>
						{#if isSoonLink(card.href)}
							<span
								class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700"
								>Segera</span
							>
						{/if}
					</div>
					<p class="mt-3 break-words text-sm font-bold text-so-ink">
						{card.label}
					</p>
					<p class="mt-1.5 break-words text-xs leading-5 text-so-muted">
						{card.desc}
					</p>
				</a>
			{/each}
		</div>
	</section>

	{#if orgType === 'tpq' && tpqDashboard}
		<section
			class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
			style="animation-delay: 100ms;"
		>
			<div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-so-green">
						TPQ Akademik
					</p>
					<h3 class="font-display mt-2 break-words text-2xl font-bold text-so-green">
						Pusat Operasional TPQ
					</h3>
					<p class="mt-2 max-w-2xl break-words text-sm leading-relaxed text-so-muted">
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
						class={`min-w-0 rounded-xl border border-so-border bg-gradient-to-br ${card.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-so-green hover:shadow-md`}
					>
						<p class="break-words text-[11px] font-bold uppercase tracking-wide text-so-muted">
							{card.label}
						</p>
						<p class="mt-2 break-words text-2xl font-bold tabular-nums tracking-tight">
							{card.value}
						</p>
						<p class="mt-1.5 break-words text-xs leading-relaxed text-so-muted">
							{card.desc}
						</p>
					</a>
				{/each}
			</div>

			<div class="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
				<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/55 p-4 sm:p-5">
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h4 class="text-sm font-bold text-so-green">Setoran terbaru</h4>
						<a
							class="text-xs font-bold text-so-green hover:text-so-green-2"
							href="/tpq/akademik/riwayat"
						>
							Lihat riwayat
						</a>
					</div>
					{#if tpqRecentSetoran.length}
						<div class="mt-4 space-y-2.5">
							{#each tpqRecentSetoran as item}
								<div
									class="flex min-w-0 flex-col gap-2 rounded-xl border border-so-border bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="min-w-0">
										<p class="break-words font-semibold text-so-ink">
											{item.santriName || 'Santri'} · {getSurahName(Number(item.surah))}
											{item.ayatFrom}-{item.ayatTo}
										</p>
										<p class="mt-1 break-words text-xs text-so-muted">
											{formatDate(item.date)} · {item.type === 'murojaah' ? "Muroja'ah" : 'Hafalan'}
											· {item.ustadzName || 'Pengampu'}
										</p>
									</div>
									<span
										class={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getSetoranStatusClass(item.status)}`}
									>
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

				<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/55 p-4 sm:p-5">
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h4 class="text-sm font-bold text-so-green">Agenda TPQ</h4>
						<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/kalender">
							Buka kalender
						</a>
					</div>
					{#if tpqAgenda.length}
						<div class="mt-4 space-y-2.5">
							{#each tpqAgenda as item}
								<div
									class="min-w-0 rounded-xl border border-so-border bg-white px-4 py-3 text-sm shadow-sm"
								>
									<p class="break-words font-semibold text-so-ink">
										{item.title}
									</p>
									<p class="mt-1 text-xs text-so-muted">
										{formatDate(item.eventDate)}
									</p>
									{#if item.content}
										<p class="mt-2 break-words text-xs leading-5 text-so-muted">
											{item.content}
										</p>
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
			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-2"
				style="animation-delay: 120ms;"
			>
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Transaksi Kas Terbaru
					</h3>
					<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/keuangan">
						Lihat keuangan
					</a>
				</div>
				{#if finance?.kas?.entries?.length}
					<div class="mt-5 space-y-2.5">
						{#each finance.kas.entries as entry}
							<div
								class="flex min-w-0 flex-col gap-2 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="min-w-0">
									<p class="break-words font-semibold text-so-ink">
										{entry.kategori}
									</p>
									<p class="text-xs text-so-muted">
										{formatDate(entry.tanggal)}
									</p>
								</div>
								<div class="min-w-0 sm:text-right">
									<p
										class={`break-words text-sm font-semibold ${entry.tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-700'}`}
									>
										{entry.tipe === 'masuk' ? '+' : '-'}{formatCurrency(entry.nominal)}
									</p>
									<p class="break-words text-xs text-so-muted">
										{entry.keterangan || '-'}
									</p>
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

			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
				style="animation-delay: 200ms;"
			>
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Agenda 2 Minggu
					</h3>
					<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/kalender">
						Lihat kalender
					</a>
				</div>
				{#if communitySchedule.length}
					<div class="mt-5 space-y-2.5">
						{#each communitySchedule as item}
							<div
								class="min-w-0 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm"
							>
								<p class="break-words font-semibold text-so-ink">
									{item.title}
								</p>
								<p class="text-xs text-so-muted">
									{formatDate(item.eventDate)}
								</p>
								{#if item.content}
									<p class="mt-1 break-words text-xs text-so-muted">
										{item.content}
									</p>
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
				<div
					class={`admin-card min-w-0 overflow-hidden p-5 sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}
				>
					<h3 class="font-display break-words text-xl font-bold text-so-green">Kelola Aset</h3>
					<p class="text-xs text-so-muted">Inventaris lembaga yang tampil di halaman publik.</p>
					<div class="mt-4 rounded-xl border border-dashed border-so-green/25 bg-so-green/8 p-4">
						<h4 class="text-sm font-semibold text-so-green">Import Excel</h4>
						<p class="mt-1 break-words text-xs text-so-muted">
							Kolom wajib: <strong>name</strong>, <strong>quantity</strong>. Opsional:
							<strong>category</strong>, <strong>condition</strong>,
							<strong>location</strong>, <strong>acquired_at</strong>,
							<strong>notes</strong>.
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
							<div
								class="rounded-xl border border-so-gold/35 bg-so-gold/12 p-3 text-xs text-so-green"
							>
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
								<button
									type="button"
									class="btn btn-outline w-full sm:flex-1"
									on:click={resetAssetForm}
								>
									Batal Edit
								</button>
							{/if}
						</div>
					</form>
				</div>

				<div
					class={`admin-card min-w-0 overflow-hidden p-5 sm:p-6 ${assetId ? 'xl:col-span-2' : ''}`}
				>
					<div class="flex min-w-0 items-center justify-between gap-3">
						<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
							Daftar Aset
						</h3>
						<span class="text-xs text-so-muted">{assets.length} item</span>
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
									class={`rounded-xl border p-4 shadow-sm ${
										assetId === asset.id
											? 'border-amber-300 bg-amber-50/60'
											: 'border-so-border bg-white'
									}`}
								>
									<div class="flex min-w-0 items-center justify-between gap-3">
										<p class="min-w-0 break-words text-sm font-semibold text-so-ink">
											{asset.name}
										</p>
										<span class="text-xs text-so-muted">{asset.quantity} unit</span>
									</div>
									<p class="mt-2 break-words text-xs text-so-muted">
										Kategori: {asset.category || '-'}
									</p>
									<p class="mt-1 break-words text-xs text-so-muted">
										Kondisi: {asset.condition || '-'}
									</p>
									<p class="mt-1 break-words text-xs text-so-muted">
										Lokasi: {asset.location || '-'}
									</p>
									<p class="mt-1 text-xs text-so-muted">
										Tanggal: {formatDate(asset.acquiredAt)}
									</p>
									{#if asset.notes}
										<p class="mt-2 break-words text-xs text-so-muted">
											{asset.notes}
										</p>
									{/if}
									<div class="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											class="btn btn-xs btn-outline"
											on:click={() => startEditAsset(asset)}
										>
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
						<div
							class="mt-4 hidden max-w-full overflow-x-auto rounded-xl border border-so-border md:block"
						>
							<table class="w-full min-w-[920px] text-sm">
								<thead>
									<tr class="bg-so-cream text-left text-xs uppercase text-so-muted">
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
								<tbody class="divide-y divide-so-border bg-white">
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
													<button
														type="button"
														class="btn btn-xs btn-outline"
														on:click={() => startEditAsset(asset)}
													>
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

			<section class="admin-card min-w-0 overflow-hidden p-5 sm:p-6">
				<div class="flex min-w-0 items-center justify-between gap-3">
					<div class="min-w-0">
						<h3 class="font-display break-words text-xl font-bold text-so-green">Galeri Lembaga</h3>
						<p class="text-xs text-so-muted">Foto kegiatan dan suasana lembaga yang ditampilkan di halaman publik.</p>
					</div>
					<span class="text-xs text-so-muted">{mediaItems.length} foto</span>
				</div>

				<div class="mt-4 rounded-xl border border-dashed border-so-green/25 bg-so-green/8 p-4">
					<label for="dashboard-media-upload" class="text-sm font-semibold text-so-green">Upload Foto Baru</label>
					<p class="mt-1 text-xs text-so-muted">Format: JPG, PNG, WEBP. Maks 10MB.</p>
					<input
						id="dashboard-media-upload"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						class="mt-2 file-input file-input-bordered w-full file-input-sm"
						on:change={uploadOrgMedia}
						bind:this={mediaFileInput}
						disabled={uploadingMedia}
					/>
					{#if uploadingMedia}
						<p class="mt-2 text-xs text-so-green animate-pulse">Mengupload...</p>
					{/if}
					{#if uploadMediaError}
						<p class="mt-2 text-xs text-red-600">{uploadMediaError}</p>
					{/if}
				</div>

				{#if mediaItems.length === 0}
					<div class="mt-4 rounded-xl border border-dashed border-so-border bg-so-cream/70 p-6 text-center text-sm text-so-muted">
						Belum ada foto yang ditampilkan.
					</div>
				{:else}
					<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
						{#each mediaItems as item}
							<div class="group relative overflow-hidden rounded-xl border border-so-border bg-so-cream">
								<div class="aspect-video">
									<img src={item.url} alt="Foto lembaga" class="h-full w-full object-cover" loading="lazy" />
								</div>
								<button
									type="button"
									class="absolute top-2 right-2 btn btn-xs btn-error text-white opacity-0 group-hover:opacity-100 transition-opacity"
									on:click={() => deleteOrgMedia(item.id)}
								>
									Hapus
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{:else if isEducationalOrg && isStudent}
		<section class="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6 xl:col-span-2"
				style="animation-delay: 120ms;"
			>
				<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Aktivitas 7 Hari Terakhir
					</h3>
					<span
						class="w-fit rounded-full border border-so-green/15 bg-so-green/10 px-3 py-1 text-xs font-semibold text-so-green"
					>
						{stats.todayApproved ?? 0} disetujui hari ini
					</span>
				</div>
				{#if seriesBars.length}
					<div
						class="soft-grid mt-6 flex h-44 min-w-0 items-end gap-2 rounded-xl border border-so-border bg-so-cream p-4 sm:gap-3"
					>
						{#each seriesBars as entry}
							<div class="min-w-0 flex-1 text-center">
								<div
									class="mx-auto w-full rounded-2xl bg-gradient-to-t from-teal-600 via-cyan-500 to-emerald-400"
									style={`height: ${entry.height}%`}
								></div>
								<p class="mt-2 truncate text-xs text-slate-500">
									{entry.label}
								</p>
								<p class="text-xs font-semibold text-slate-700">
									{entry.value}
								</p>
							</div>
						{/each}
					</div>
					<p class="mt-4 text-xs text-so-muted">Data berdasarkan setoran yang disetujui.</p>
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

			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
				style="animation-delay: 200ms;"
			>
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Surah Terbanyak
					</h3>
					<a
						class="text-xs font-bold text-so-green hover:text-so-green-2"
						href="/dashboard/pencapaian-hafalan"
					>
						Lihat detail
					</a>
				</div>
				{#if topChecklist.length}
					<div class="mt-5 space-y-2.5">
						{#each topChecklist as row}
							<div
								class="min-w-0 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm"
							>
								<div class="flex min-w-0 items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="break-words font-semibold text-so-ink">
											{row.name || getSurahName(row.surahNumber)}
										</p>
										<p class="text-xs text-so-muted">
											{row.disetujui}/{row.totalAyah} ayat disetujui
										</p>
									</div>
									<span class="text-xs font-semibold text-so-green">
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
			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
				style="animation-delay: 120ms;"
			>
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Progress Santri
					</h3>
					<a
						class="text-xs font-bold text-so-green hover:text-so-green-2"
						href="/dashboard/kelola-santri"
					>
						Lihat semua
					</a>
				</div>
				{#if studentHighlights.length}
					<div class="mt-5 space-y-2.5">
						{#each studentHighlights as student}
							<div
								class="min-w-0 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm"
							>
								<div class="flex min-w-0 items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="break-words font-semibold text-so-ink">
											{student.username || student.email}
										</p>
										<p class="break-words text-xs text-so-muted">
											{student.email}
										</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-semibold text-so-green">
											{Math.round(student.percentage ?? 0)}%
										</p>
										<p class="text-xs text-so-muted">
											{student.approvedAyah ?? 0} ayat
										</p>
									</div>
								</div>
								<div class="mt-2 h-2 rounded-full bg-white">
									<div
										class="h-2 rounded-full bg-so-green"
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

			<div
				class="fade-in admin-card min-w-0 overflow-hidden p-5 sm:p-6"
				style="animation-delay: 200ms;"
			>
				<div class="flex min-w-0 items-center justify-between gap-3">
					<h3 class="font-display min-w-0 break-words text-xl font-bold text-so-green">
						Setoran Menunggu
					</h3>
					<a
						class="text-xs font-bold text-so-green hover:text-so-green-2"
						href={tpqDashboard?.canReviewSetoran ? '/tpq/akademik/review' : '/tpq/akademik/riwayat'}
					>
						Lihat semua
					</a>
				</div>
				{#if tpqPendingSetoran.length}
					<div class="mt-5 space-y-2.5">
						{#each tpqPendingSetoran as item}
							<div
								class="flex min-w-0 flex-col gap-2 rounded-xl border border-so-border bg-so-cream/60 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="min-w-0">
									<p class="break-words font-semibold text-so-ink">
										{item.santriName || 'Santri'} · {getSurahName(Number(item.surah))}
										{item.ayatFrom}-{item.ayatTo}
									</p>
									<p class="break-words text-xs text-so-muted">
										{formatDate(item.date)} · {item.type === 'murojaah' ? "Muroja'ah" : 'Hafalan'}
									</p>
								</div>
								<span
									class={`rounded-full px-3 py-1 text-xs font-semibold ${getSetoranStatusClass(item.status)}`}
								>
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
		<section class="admin-card min-w-0 overflow-hidden p-5 text-sm text-so-muted sm:p-6">
			Dashboard ini akan menampilkan ringkasan data sesuai peran Anda. Silakan gunakan menu untuk
			mulai mengisi data.
		</section>
	{/if}
</div>

<style>
	:global(body:has(.dashboard-command-shell)) {
		background: #faf8f3;
	}

	:global(.dashboard-command-shell) {
		font-family: var(
			--font-sans,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif
		);
	}

	:global(.dashboard-command-shell .admin-card) {
		border: 1px solid rgb(232 228 220 / 0.95);
		border-radius: var(--radius-so, 12px);
		background: rgb(255 255 255 / 0.88);
		box-shadow: var(--shadow-card, 0 12px 34px rgb(27 67 50 / 0.08));
		backdrop-filter: blur(18px);
	}

	:global(.dashboard-command-shell .soft-grid) {
		background-image:
			linear-gradient(rgb(232 228 220 / 0.74) 1px, transparent 1px),
			linear-gradient(90deg, rgb(232 228 220 / 0.48) 1px, transparent 1px);
		background-size:
			100% 25%,
			16.66% 100%;
	}

	:global(.dashboard-command-shell table th),
	:global(.dashboard-command-shell table td) {
		padding: 0.75rem 1rem;
		vertical-align: top;
	}

	:global(.dashboard-command-shell input),
	:global(.dashboard-command-shell textarea),
	:global(.dashboard-command-shell select) {
		max-width: 100%;
		border-color: var(--color-so-border, #e8e4dc);
		background-color: rgb(250 248 243 / 0.45);
	}

	:global(.dashboard-command-shell input:focus),
	:global(.dashboard-command-shell textarea:focus),
	:global(.dashboard-command-shell select:focus) {
		border-color: var(--color-so-gold, #c9a84c);
		box-shadow: 0 0 0 4px rgb(201 168 76 / 0.18);
		outline: none;
	}

	:global(.dashboard-command-shell .btn-primary) {
		border-color: var(--color-so-green, #1b4332);
		background: var(--color-so-green, #1b4332);
		color: #ffffff;
	}

	:global(.dashboard-command-shell .btn-outline) {
		border-color: var(--color-so-border, #e8e4dc);
		color: var(--color-so-green, #1b4332);
	}
</style>
