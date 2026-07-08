import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURES } from '$lib/features';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/domains/tpq/seed-hafalan-default';

type FeatureDetail = {
	heroTagline: string;
	heroSubtitle: string;
	primaryHref: string;
	outcomes: string[];
	steps: { title: string; desc: string }[];
	access: { label: string; desc: string; href: string }[];
	learningIntegration?: { title: string; desc: string }[];
	routineSchedule?: { title: string; desc: string }[];
	theme: {
		hero: string;
		border: string;
		soft: string;
		accent: string;
		chip: string;
	};
	note?: string;
};

const DEFAULT_DETAIL: FeatureDetail = {
	heroTagline: 'Program Unggulan',
	heroSubtitle: 'Fitur dirancang agar pembelajaran berjalan terukur dan terarah.',
	primaryHref: '/register',
	outcomes: ['Kurikulum lebih tertata', 'Monitoring terpusat', 'Pengalaman belajar nyaman'],
	steps: [
		{ title: 'Pilih program', desc: 'Tentukan program yang sesuai kebutuhan lembaga.' },
		{ title: 'Susun jadwal', desc: 'Rencanakan aktivitas rutin dan target mingguan.' },
		{ title: 'Pantau progres', desc: 'Lihat laporan agar evaluasi lebih mudah.' }
	],
	access: [
		{ label: 'Dashboard Santri Online', desc: 'Kelola semua aktivitas dalam satu tempat.', href: '/dashboard' },
		{ label: 'Daftar Lembaga', desc: 'Buat akun lembaga untuk memulai.', href: '/register' }
	],
	learningIntegration: [
		{ title: 'Terhubung ke kelas', desc: 'Program bisa dipakai sebagai agenda penguatan di kelas TPQ.' },
		{ title: 'Terhubung ke hafalan', desc: 'Target hafalan santri tetap bisa dipantau dari dashboard.' },
		{ title: 'Terhubung ke wali murid', desc: 'Wali murid mendapat gambaran program dan capaian yang sedang dibina.' }
	],
	theme: {
		hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
		border: 'border-emerald-200',
		soft: 'bg-emerald-50',
		accent: 'text-emerald-600',
		chip: 'bg-emerald-100 text-emerald-600'
	}
};

const FEATURE_DETAILS: Record<string, FeatureDetail> = {
	'belajar-alquran': {
		heroTagline: 'Program Tahfidz dan Tahsin',
		heroSubtitle: 'Belajar terstruktur dari makhraj, tajwid, hingga hafalan.',
		primaryHref: '/kitab/quran',
		outcomes: ['Tajwid lebih rapi', 'Hafalan terukur', 'Progres terpantau'],
		steps: [
			{ title: 'Baca dan simak mushaf', desc: 'Akses 30 juz, per-juz, dan tandai target bacaan.' },
			{ title: 'Rencana hafalan harian', desc: 'Susun target dan catat capaian setiap hari.' },
			{ title: 'Setoran dan evaluasi', desc: 'Pantau setoran harian dan hasil ujian tahfidz.' }
		],
		access: [
			{ label: 'Mushaf Al-Qur\'an 30 Juz', desc: 'Baca per-juz dengan tampilan yang nyaman.', href: '/kitab/quran' },
			{ label: 'Pencapaian Hafalan', desc: 'Lihat grafik progres hafalan santri.', href: '/dashboard/pencapaian-hafalan' },
			{ label: 'Setoran Hari Ini', desc: 'Kelola setoran harian dalam satu daftar.', href: '/tpq/akademik/setoran' }
		],
		learningIntegration: [
			{ title: 'Target kelas', desc: 'Guru menetapkan target tahsin, bacaan, dan hafalan sesuai level santri.' },
			{ title: 'Setoran resmi', desc: 'Setoran yang disetujui reviewer tersinkron ke pencapaian hafalan.' },
			{ title: 'Laporan wali', desc: 'Capaian santri lebih mudah dijelaskan kepada wali murid saat evaluasi.' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
			border: 'border-emerald-200',
			soft: 'bg-emerald-50',
			accent: 'text-emerald-600',
			chip: 'bg-emerald-100 text-emerald-600'
		}
	},
	'sholat-jamaah': {
		heroTagline: 'Kedisiplinan Ibadah',
		heroSubtitle: 'Membangun budaya jamaah di lembaga dan komunitas.',
		primaryHref: '/kalender',
		outcomes: ['Kedisiplinan waktu sholat', 'Kebersamaan jamaah', 'Dokumentasi kegiatan rapi'],
		steps: [
			{ title: 'Susun jadwal jamaah', desc: 'Atur agenda sholat dan pengingat rutin.' },
			{ title: 'Koordinasi petugas', desc: 'Rapi dalam pembagian tugas imam dan muadzin.' },
			{ title: 'Catat kehadiran', desc: 'Ringkas laporan jamaah untuk evaluasi.' }
		],
		access: [
			{ label: 'Kalender Kegiatan', desc: 'Jadwal ibadah, kajian, dan agenda lembaga.', href: '/kalender' },
			{ label: 'Direktori TPQ', desc: 'Profil dan aktivitas TPQ dalam satu halaman.', href: '/tpq' },
			{ label: 'Dashboard TPQ', desc: 'Pantau progres kegiatan harian TPQ.', href: '/dashboard' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600',
			border: 'border-blue-200',
			soft: 'bg-blue-50',
			accent: 'text-blue-700',
			chip: 'bg-blue-100 text-blue-700'
		}
	},
	'dzikir-doa': {
		heroTagline: 'Wirid, Doa Harian, dan Adab Amaliyah',
		heroSubtitle: 'Dzikir pagi-petang, doa harian, wirid setelah sholat, dan pembiasaan amaliyah Aswaja untuk santri.',
		primaryHref: '/dashboard/hafalan-mandiri',
		outcomes: ['Amalan harian tertata', 'Doa santri terbina', 'Wali murid tahu target pembiasaan'],
		steps: [
			{ title: 'Mulai dari doa harian', desc: 'Doa makan, tidur, masuk rumah, masjid, kendaraan, dan adab harian dipakai sebagai target dasar.' },
			{ title: 'Bangun wirid kelas', desc: 'Guru membimbing istighfar, tahlil, shalawat, Asmaul Husna, dan doa setelah sholat sesuai kebiasaan pesantren.' },
			{ title: 'Catat sebagai hafalan', desc: 'Materi doa dan dzikir yang sudah masuk katalog hafalan bisa dinilai bersama setoran santri.' }
		],
		access: [
			{ label: 'Hafalan Mandiri', desc: 'Santri bisa murojaah dan menandai kualitas hafalannya.', href: '/dashboard/hafalan-mandiri' },
			{ label: 'Rapor Hafalan', desc: 'Guru dapat menilai doa, bacaan sholat, dan materi hafalan lain.', href: '/tpq/hafalan-rapor' },
			{ label: 'Pencapaian Hafalan', desc: 'Wali dan pengelola melihat progres hafalan yang sudah disetujui.', href: '/dashboard/pencapaian-hafalan' }
		],
		learningIntegration: [
			{ title: 'Materi adab harian', desc: 'Doa harian masuk dalam pembiasaan kelas, bukan hanya bacaan lepas.' },
			{ title: 'Setoran bacaan', desc: 'Guru bisa memasukkan doa dan bacaan sholat ke rapor hafalan sesuai kategori yang tersedia.' },
			{ title: 'Transparansi wali murid', desc: 'Calon santri dan wali melihat daftar materi yang dibina sejak awal masuk.' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600',
			border: 'border-amber-200',
			soft: 'bg-amber-50',
			accent: 'text-amber-800',
			chip: 'bg-amber-100 text-amber-800'
		}
	},
	'kitab-turats': {
		heroTagline: 'Kajian Kitab Mu\'tabar',
		heroSubtitle: 'Pendamping kajian fiqih, aqidah, dan tasawuf sesuai manhaj Aswaja.',
		primaryHref: '/kitab',
		outcomes: ['Pemahaman fiqih kuat', 'Aqidah terjaga', 'Adab belajar terarah'],
		steps: [
			{ title: 'Pilih kitab rujukan', desc: 'Fokus pada kitab fiqih, aqidah, dan tasawuf.' },
			{ title: 'Ringkas inti bab', desc: 'Ambil poin penting untuk bahan penguatan.' },
			{ title: 'Baca dari katalog', desc: 'Akses kitab yang sudah dipublish dari perpustakaan digital.' }
		],
		access: [
			{ label: 'Perpustakaan Kitab', desc: 'Jelajahi kitab PDF dan Google Drive yang sudah dipublish.', href: '/kitab' },
			{ label: 'Ringkasan Kajian', desc: 'Bacaan ringan dari materi pesantren.', href: '/blog' },
			{ label: 'Jejak Ulama', desc: 'Belajar dari sanad ulama Ahlussunnah.', href: '/ulama' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-emerald-600 via-green-700 to-lime-600',
			border: 'border-emerald-200',
			soft: 'bg-emerald-50',
			accent: 'text-emerald-600',
			chip: 'bg-emerald-100 text-emerald-600'
		}
	},
	'khataman-rutin': {
		heroTagline: 'Khataman Bulanan Aswaja',
		heroSubtitle: 'Khataman rutin sebulan sekali dengan opsi Kamis Kliwon atau Jumat Legi, terhubung dengan halaqoh dan progres santri.',
		primaryHref: '/kalender',
		outcomes: ['Agenda bulanan jelas', 'Kebersamaan santri dan wali terbentuk', 'Progres bacaan dan hafalan ikut terbaca'],
		steps: [
			{ title: 'Tetapkan siklus bulanan', desc: 'Lembaga memilih Kamis Kliwon atau Jumat Legi sebagai penanda agenda rutin.' },
			{ title: 'Bagi bacaan dan petugas', desc: 'Guru mengatur pembagian juz, pembaca tahlil, pembawa doa, dan pendamping santri.' },
			{ title: 'Hubungkan ke pembelajaran', desc: 'Khataman dipakai untuk murojaah surah pilihan, adab majelis, dan evaluasi bacaan.' }
		],
		access: [
			{ label: 'Kalender Kegiatan', desc: 'Pasang agenda Kamis Kliwon, Jumat Legi, dan khataman bulanan.', href: '/kalender' },
			{ label: 'Halaqoh Santri', desc: 'Kelola kelompok khataman dan pendamping.', href: '/dashboard/halaqoh' },
			{ label: 'Pencapaian Hafalan', desc: 'Pantau progres hafalan yang relevan dengan agenda rutin.', href: '/dashboard/pencapaian-hafalan' }
		],
		learningIntegration: [
			{ title: 'Murojaah berjamaah', desc: 'Surah pilihan dan Juz 30 bisa dipakai sebagai bahan penguatan sebelum khataman.' },
			{ title: 'Peran santri', desc: 'Santri dilatih membaca, menyimak, memimpin adab majelis, dan menjaga tartil.' },
			{ title: 'Informasi wali', desc: 'Wali murid melihat bahwa kegiatan bulanan terhubung dengan target belajar, bukan agenda terpisah.' }
		],
		routineSchedule: [
			{ title: 'Kamis Kliwon', desc: 'Cocok untuk majelis malam Jumat, pembacaan tahlil, doa arwah, dan khatmil Quran bersama.' },
			{ title: 'Jumat Legi', desc: 'Cocok untuk penguatan amaliyah Jumat, doa bersama, dan silaturahim wali santri.' },
			{ title: 'Sebulan sekali', desc: 'Agenda dibuat konsisten agar mudah diingat santri, wali, guru, dan jamaah.' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600',
			border: 'border-teal-200',
			soft: 'bg-teal-50',
			accent: 'text-teal-700',
			chip: 'bg-teal-100 text-teal-700'
		}
	},
	'istighotsah': {
		heroTagline: 'Istighotsah, Tahlil, dan Doa Bersama',
		heroSubtitle: 'Istighotsah ala pesantren Nahdlatul Ulama dengan agenda rutin, adab berjamaah, dan penguatan pembelajaran santri.',
		primaryHref: '/kalender',
		outcomes: ['Amaliyah Aswaja lebih hidup', 'Agenda NU terdokumentasi', 'Santri belajar adab dan bacaan majelis'],
		steps: [
			{ title: 'Susun agenda', desc: 'Atur istighotsah rutin, termasuk Kamis Kliwon atau Jumat Legi bila dipakai lembaga.' },
			{ title: 'Siapkan bacaan majelis', desc: 'Gunakan istighfar, tahlil, shalawat, Asmaul Husna, dan doa pilihan sesuai bimbingan pengasuh.' },
			{ title: 'Nilai pembelajaran santri', desc: 'Materi yang menjadi target hafalan dicatat sebagai bagian dari rapor dan pencapaian santri.' }
		],
		access: [
			{ label: 'Agenda Kegiatan', desc: 'Jadwalkan istighotsah, tahlil, dan khataman rutin.', href: '/kalender' },
			{ label: 'Dzikir dan Doa', desc: 'Lihat program doa harian yang terhubung ke hafalan.', href: '/fitur/dzikir-doa' },
			{ label: 'Rapor Hafalan', desc: 'Nilai bacaan dan hafalan santri yang sudah ditargetkan.', href: '/tpq/hafalan-rapor' }
		],
		learningIntegration: [
			{ title: 'Adab majelis', desc: 'Santri belajar tertib, menyimak imam, dan menghormati rangkaian doa.' },
			{ title: 'Bacaan bertahap', desc: 'Asmaul Husna, shalawat, doa harian, dan bacaan sholat bisa dijadikan target hafalan.' },
			{ title: 'Penguatan keluarga', desc: 'Wali murid melihat hubungan antara kegiatan amaliyah dan pembentukan karakter santri.' }
		],
		routineSchedule: [
			{ title: 'Kamis Kliwon', desc: 'Dapat dipakai sebagai malam istighotsah, tahlil, dan khataman bersama.' },
			{ title: 'Jumat Legi', desc: 'Dapat dipakai sebagai agenda doa bulanan dan silaturahim wali santri.' },
			{ title: 'Khataman sebulan sekali', desc: 'Istighotsah bisa digabung dengan khatmil Quran sesuai kebiasaan lembaga.' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-600',
			border: 'border-amber-200',
			soft: 'bg-amber-50',
			accent: 'text-amber-800',
			chip: 'bg-amber-100 text-amber-800'
		}
	}
};

export const load: PageServerLoad = ({ params }) => {
	const feature = FEATURES.find((item) => item.slug === params.slug);

	if (!feature) {
		throw error(404, 'Fitur tidak ditemukan');
	}

	const detail = FEATURE_DETAILS[feature.slug] ?? DEFAULT_DETAIL;
	const others = FEATURES.filter((item) => item.slug !== feature.slug);
	const hafalanCatalog = SEED_HAFALAN_DEFAULT.map((category) => ({
		nama: category.nama,
		icon: category.icon,
		items: category.items.map((item) => ({
			nama: item.nama,
			fadhilah: item.fadhilah,
			level: item.level
		}))
	}));

	return { feature, detail, others, hafalanCatalog };
};
