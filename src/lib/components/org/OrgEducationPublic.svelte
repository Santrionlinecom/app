<script lang="ts">
	export let org;

	type FocusItem = { icon: string; title: string; desc: string };
	type ModuleItem = { icon: string; title: string; desc: string; href: string };
	type StepItem = { title: string; desc: string };

	type EducationConfig = {
		label: string;
		tagline: string;
		description: string;
		theme: {
			hero: string;
			border: string;
			soft: string;
			accent: string;
			chip: string;
		};
		focus: FocusItem[];
		modules: ModuleItem[];
		steps: StepItem[];
	};

	const DEFAULT_CONFIG: EducationConfig = {
		label: 'Lembaga Pendidikan',
		tagline: 'Pembinaan santri terukur dengan kurikulum yang jelas.',
		description:
			'Fokus pada manajemen santri, materi ajar, dan penguatan hafalan agar proses belajar lebih rapi dan terpantau.',
		theme: {
			hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
			border: 'border-emerald-200',
			soft: 'bg-emerald-50',
			accent: 'text-emerald-700',
			chip: 'bg-emerald-100 text-emerald-700'
		},
		focus: [
			{ icon: 'SAN', title: 'Manajemen Santri', desc: 'Data santri, ustadz, dan status keanggotaan.' },
			{ icon: 'MAT', title: 'Materi Ajar', desc: 'Materi diniyah, kitab, dan ringkasan pelajaran.' },
			{ icon: 'HFZ', title: 'Hafalan', desc: 'Setoran, murojaah, dan evaluasi tahfidz.' }
		],
		modules: [
			{ icon: 'SAN', title: 'Kelola Santri', desc: 'Tambah, verifikasi, dan kelola santri.', href: '/dashboard/kelola-santri' },
			{ icon: 'DIN', title: 'Materi Diniyah', desc: 'Jadwal materi harian dan kitab rujukan.', href: '/dashboard/diniyah' },
			{ icon: 'HAL', title: 'Halaqoh Hafalan', desc: 'Kelompok setoran dan pembinaan hafalan.', href: '/dashboard/halaqoh' },
			{ icon: 'SET', title: 'Setoran Harian', desc: 'Pantau setoran dan progres hafalan.', href: '/dashboard/setoran-hari-ini' }
		],
		steps: [
			{ title: 'Pendaftaran Santri', desc: 'Data santri dan wali tersimpan rapi sejak awal.' },
			{ title: 'Kurikulum Terstruktur', desc: 'Materi ajar tersusun per hari atau per jenjang.' },
			{ title: 'Monitoring Hafalan', desc: 'Setoran, ujian, dan progres hafalan dipantau.' }
		]
	};

	const CONFIG_MAP: Record<string, EducationConfig> = {
		pondok: {
			label: 'Pondok Pesantren',
			tagline: 'Pembinaan santri 24 jam dengan kurikulum diniyah dan tahfidz.',
			description:
				'Santri belajar adab, ilmu diniyah, dan hafalan secara terpadu dengan pengawasan musyrif serta ustadz.',
			theme: {
				hero: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600',
				border: 'border-indigo-200',
				soft: 'bg-indigo-50',
				accent: 'text-indigo-700',
				chip: 'bg-indigo-100 text-indigo-700'
			},
			focus: [
				{ icon: 'SAN', title: 'Manajemen Santri', desc: 'Data santri, musyrif, dan wali santri terintegrasi.' },
				{ icon: 'DIN', title: 'Materi Diniyah', desc: 'Kitab mutabar, jadwal harian, dan catatan pelajaran.' },
				{ icon: 'HFZ', title: 'Tahfidz dan Ujian', desc: 'Setoran, ujian tahfidz, dan laporan progres.' }
			],
			modules: [
				{ icon: 'SAN', title: 'Kelola Santri', desc: 'Struktur santri, ustadz, dan status keanggotaan.', href: '/dashboard/kelola-santri' },
				{ icon: 'DIN', title: 'Materi Diniyah', desc: 'Kurikulum harian Aqidah, Fiqih, Hadits, dan lainnya.', href: '/dashboard/diniyah' },
				{ icon: 'HAL', title: 'Halaqoh Tahfidz', desc: 'Kelompok setoran dan pembinaan hafalan.', href: '/dashboard/halaqoh' },
				{ icon: 'UJI', title: 'Ujian Tahfidz', desc: 'Evaluasi hafalan dan kualitas bacaan.', href: '/dashboard/ujian-tahfidz' }
			],
			steps: [
				{ title: 'Registrasi Santri', desc: 'Santri baru diverifikasi sebelum aktif.' },
				{ title: 'Kegiatan Diniyah', desc: 'Materi harian terpantau oleh pengajar.' },
				{ title: 'Setoran Hafalan', desc: 'Target hafalan harian dengan evaluasi berkala.' }
			]
		},
		tpq: {
			label: 'TPQ',
			tagline: 'Pembelajaran Al-Quran dasar untuk anak dengan metode terarah.',
			description:
				'Fokus pada pembiasaan baca Al-Quran, tajwid dasar, serta adab belajar untuk santri TPQ.',
			theme: {
				hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-500',
				border: 'border-emerald-200',
				soft: 'bg-emerald-50',
				accent: 'text-emerald-700',
				chip: 'bg-emerald-100 text-emerald-700'
			},
			focus: [
				{ icon: 'TJD', title: 'Tahsin Dasar', desc: 'Iqra, tajwid dasar, dan pembiasaan makhraj.' },
				{ icon: 'SAN', title: 'Pengelolaan Santri', desc: 'Kelas, kelompok belajar, dan laporan kehadiran.' },
				{ icon: 'ADR', title: 'Materi Harian', desc: 'Adab, doa harian, dan latihan hafalan pendek.' }
			],
			modules: [
				{ icon: 'SAN', title: 'Kelola Santri', desc: 'Data santri TPQ dan wali.', href: '/dashboard/kelola-santri' },
				{ icon: 'DIN', title: 'Materi Diniyah', desc: 'Jadwal materi mingguan untuk TPQ.', href: '/dashboard/diniyah' },
				{ icon: 'SET', title: 'Setoran Harian', desc: 'Monitoring bacaan dan hafalan juz amma.', href: '/dashboard/setoran-hari-ini' },
				{ icon: 'CAP', title: 'Pencapaian Hafalan', desc: 'Rekap hafalan santri lebih jelas.', href: '/dashboard/pencapaian-hafalan' }
			],
			steps: [
				{ title: 'Penjadwalan Kelas', desc: 'Atur jadwal belajar dan guru pendamping.' },
				{ title: 'Evaluasi Bacaan', desc: 'Catatan kemajuan bacaan setiap santri.' },
				{ title: 'Penguatan Adab', desc: 'Doa harian dan adab belajar Al-Quran.' }
			]
		},
		'rumah-tahfidz': {
			label: 'Rumah Tahfidz',
			tagline: 'Fokus pembinaan hafalan dengan target yang terukur.',
			description:
				'Rumah tahfidz menekankan setoran, murojaah, dan pendampingan intensif bagi santri penghafal Al-Quran.',
			theme: {
				hero: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600',
				border: 'border-amber-200',
				soft: 'bg-amber-50',
				accent: 'text-amber-800',
				chip: 'bg-amber-100 text-amber-800'
			},
			focus: [
				{ icon: 'HFZ', title: 'Target Hafalan', desc: 'Target mingguan dan bulanan yang jelas.' },
				{ icon: 'SAN', title: 'Pembinaan Santri', desc: 'Halaqoh dan pendampingan musyrif.' },
				{ icon: 'UJI', title: 'Evaluasi Tahfidz', desc: 'Ujian rutin untuk menjaga kualitas hafalan.' }
			],
			modules: [
				{ icon: 'HAL', title: 'Halaqoh Tahfidz', desc: 'Pembagian halaqoh dan setoran harian.', href: '/dashboard/halaqoh' },
				{ icon: 'SET', title: 'Setoran Harian', desc: 'Input setoran dan koreksi bacaan.', href: '/dashboard/setoran-hari-ini' },
				{ icon: 'CAP', title: 'Pencapaian Hafalan', desc: 'Grafik progres hafalan santri.', href: '/dashboard/pencapaian-hafalan' },
				{ icon: 'UJI', title: 'Ujian Tahfidz', desc: 'Rekap hasil ujian dan kualitas hafalan.', href: '/dashboard/ujian-tahfidz' }
			],
			steps: [
				{ title: 'Pembagian Halaqoh', desc: 'Kelompok kecil dengan target hafalan jelas.' },
				{ title: 'Setoran dan Murojaah', desc: 'Rutinitas setoran serta penguatan hafalan.' },
				{ title: 'Ujian Berkala', desc: 'Penilaian kualitas bacaan dan ketahanan hafalan.' }
			]
		}
	};

	const getConfig = (type?: string) => CONFIG_MAP[type ?? ''] ?? DEFAULT_CONFIG;
	$: config = getConfig(org?.type);
</script>

<section class="max-w-5xl mx-auto px-4 pb-12 space-y-6">
	<div class={`rounded-3xl border-2 ${config.theme.border} ${config.theme.soft} p-6 shadow-lg`}>
		<p class={`text-xs uppercase tracking-[0.3em] ${config.theme.accent}`}>Program Pendidikan</p>
		<h2 class="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
			Profil {config.label} {org?.name ?? ''}
		</h2>
		<p class="text-sm text-slate-600 mt-2">{config.tagline}</p>
		<p class="text-sm text-slate-600 mt-2">{config.description}</p>
		<div class="mt-4 flex flex-wrap gap-2">
			<span class={`badge ${config.theme.chip}`}>Manajemen Santri</span>
			<span class={`badge ${config.theme.chip}`}>Materi Ajar</span>
			<span class={`badge ${config.theme.chip}`}>Hafalan</span>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		{#each config.focus as item}
			<div class="rounded-2xl border bg-white p-4 shadow-sm">
				<span class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
					{item.icon}
				</span>
				<p class="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
				<p class="mt-1 text-xs text-slate-500">{item.desc}</p>
			</div>
		{/each}
	</div>

	<div class="rounded-2xl border bg-white p-6 shadow-sm">
		<h3 class="text-lg font-semibold text-slate-900">Modul Utama</h3>
		<p class="text-xs text-slate-500">Akses modul sesuai kebutuhan pembinaan.</p>
		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each config.modules as module}
				<a href={module.href} class="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
					<div class="flex items-start gap-3">
						<span class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
							{module.icon}
						</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">{module.title}</p>
							<p class="text-xs text-slate-500 mt-1">{module.desc}</p>
							<span class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
								Buka modul
								<span>-></span>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<div class="rounded-2xl border bg-white p-6 shadow-sm">
		<h3 class="text-lg font-semibold text-slate-900">Alur Pembinaan</h3>
		<div class="mt-4 space-y-3">
			{#each config.steps as step, index}
				<div class="flex gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
						{index + 1}
					</div>
					<div>
						<p class="text-sm font-semibold text-slate-900">{step.title}</p>
						<p class="text-xs text-slate-500">{step.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="rounded-2xl border bg-white p-6 shadow-sm">
		<h3 class="text-lg font-semibold text-slate-900">Mulai di Santri Online</h3>
		<p class="text-xs text-slate-500">Akses dashboard untuk mengelola santri dan materi ajar.</p>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row">
			<a href="/auth" class="btn btn-primary">Masuk Dashboard</a>
			<a href="/register" class="btn btn-ghost">Daftar Lembaga</a>
		</div>
	</div>
</section>
