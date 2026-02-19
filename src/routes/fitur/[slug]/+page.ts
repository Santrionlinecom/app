import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURES } from '$lib/features';

type FeatureDetail = {
	heroTagline: string;
	heroSubtitle: string;
	primaryHref: string;
	outcomes: string[];
	steps: { title: string; desc: string }[];
	access: { label: string; desc: string; href: string }[];
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
	theme: {
		hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
		border: 'border-emerald-200',
		soft: 'bg-emerald-50',
		accent: 'text-emerald-700',
		chip: 'bg-emerald-100 text-emerald-700'
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
			{ label: 'Setoran Hari Ini', desc: 'Kelola setoran harian dalam satu daftar.', href: '/dashboard/setoran-hari-ini' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
			border: 'border-emerald-200',
			soft: 'bg-emerald-50',
			accent: 'text-emerald-700',
			chip: 'bg-emerald-100 text-emerald-700'
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
		heroTagline: 'Wirid dan Doa Harian',
		heroSubtitle: 'Menguatkan hati melalui dzikir yang bersanad dan doa yang mu\'tabar.',
		primaryHref: '/blog',
		outcomes: ['Ketenangan batin', 'Adab berdzikir terjaga', 'Konsistensi harian'],
		steps: [
			{ title: 'Pilih wirid utama', desc: 'Dzikir pagi-petang, istighfar, dan shalawat.' },
			{ title: 'Jadwalkan rutin', desc: 'Bangun kebiasaan di waktu utama.' },
			{ title: 'Tadabbur makna', desc: 'Pahami makna agar dzikir lebih khusyuk.' }
		],
		access: [
			{ label: 'Artikel Dzikir dan Doa', desc: 'Materi praktis dan ringan untuk diamalkan.', href: '/blog' },
			{ label: 'Rujukan Ulama', desc: 'Kenali ulama sebagai rujukan sanad ilmu.', href: '/ulama' },
			{ label: 'Tanya Kitab', desc: 'Cari dalil dan penjelasan dari kitab mu\'tabar.', href: '/kitab' }
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
			{ title: 'Diskusi dan tanya', desc: 'Gunakan Tanya Kitab untuk mencari rujukan.' }
		],
		access: [
			{ label: 'Tanya Kitab dan Upload PDF', desc: 'Cari jawaban dan referensi kitab.', href: '/kitab' },
			{ label: 'Ringkasan Kajian', desc: 'Bacaan ringan dari materi pesantren.', href: '/blog' },
			{ label: 'Jejak Ulama', desc: 'Belajar dari sanad ulama Ahlussunnah.', href: '/ulama' }
		],
		theme: {
			hero: 'bg-gradient-to-r from-emerald-700 via-green-700 to-lime-600',
			border: 'border-emerald-200',
			soft: 'bg-emerald-50',
			accent: 'text-emerald-800',
			chip: 'bg-emerald-100 text-emerald-800'
		}
	},
	'khataman-rutin': {
		heroTagline: 'Target Khatam Terukur',
		heroSubtitle: 'Program khatam bersama dengan pembagian juz yang jelas.',
		primaryHref: '/dashboard/halaqoh',
		outcomes: ['Target khatam tercapai', 'Semangat kolektif terjaga', 'Laporan progres jelas'],
		steps: [
			{ title: 'Tetapkan periode', desc: 'Tentukan target mingguan atau bulanan.' },
			{ title: 'Bagi juz dan target', desc: 'Pembagian juz lebih adil dan rapi.' },
			{ title: 'Monitoring progres', desc: 'Catat progres agar khatam tepat waktu.' }
		],
		access: [
			{ label: 'Halaqoh Santri', desc: 'Kelola kelompok khataman dan pendamping.', href: '/dashboard/halaqoh' },
			{ label: 'Mushaf Al-Qur\'an', desc: 'Baca langsung mushaf per-juz.', href: '/kitab/quran' },
			{ label: 'Pencapaian Hafalan', desc: 'Pantau progres untuk evaluasi rutin.', href: '/dashboard/pencapaian-hafalan' }
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
		heroTagline: 'Doa Bersama Jamaah',
		heroSubtitle: 'Istighotsah berjamaah dengan adab pesantren dan panduan yang jelas.',
		primaryHref: '/kalender',
		outcomes: ['Doa terstruktur', 'Kebersamaan jamaah', 'Agenda terdokumentasi'],
		steps: [
			{ title: 'Susun agenda', desc: 'Atur jadwal istighotsah rutin.' },
			{ title: 'Panduan bacaan', desc: 'Gunakan doa-doa pilihan yang mu\'tabar.' },
			{ title: 'Pelaksanaan berjamaah', desc: 'Koordinasi tempat dan peserta.' }
		],
		access: [
			{ label: 'Agenda Kegiatan', desc: 'Jadwalkan dan simpan agenda ibadah.', href: '/kalender' },
			{ label: 'Direktori TPQ', desc: 'Informasi TPQ tempat kegiatan belajar dan ibadah.', href: '/tpq' },
			{ label: 'Materi dan Panduan', desc: 'Referensi bacaan lewat artikel pilihan.', href: '/blog' }
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

export const load: PageLoad = ({ params }) => {
	const feature = FEATURES.find((item) => item.slug === params.slug);

	if (!feature) {
		throw error(404, 'Fitur tidak ditemukan');
	}

	const detail = FEATURE_DETAILS[feature.slug] ?? DEFAULT_DETAIL;
	const others = FEATURES.filter((item) => item.slug !== feature.slug);

	return { feature, detail, others };
};
