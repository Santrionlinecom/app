export type InstitutionKey = 'tpq' | 'pondok' | 'masjid' | 'musholla' | 'rumah-tahfidz';
export type InstitutionCategory = 'Pendidikan' | 'Kemasjidan';

export type InstitutionConfig = {
	key: InstitutionKey;
	label: string;
	route: `/${InstitutionKey}`;
	registerRoute: `/${InstitutionKey}/daftar`;
	category: InstitutionCategory;
	enabled: boolean;
	description: string;
	registerDescription: string;
	icon: string;
	highlights: string[];
	classes: {
		card: string;
		accent: string;
		badge: string;
	};
};

export const ACTIVE_CTA = 'Mulai';

export const INSTITUTIONS: InstitutionConfig[] = [
	{
		key: 'tpq',
		label: 'TPQ',
		route: '/tpq',
		registerRoute: '/tpq/daftar',
		category: 'Pendidikan',
		enabled: true,
		description: 'Pengelolaan kelas TPQ, santri, dan pembelajaran Al-Quran secara terstruktur.',
		registerDescription: 'Daftarkan TPQ untuk mengelola kelas, santri, dan jadwal belajar.',
		icon: '📘',
		highlights: ['Tahsin dasar', 'Materi harian', 'Monitoring bacaan'],
		classes: {
			card: 'border-lime-200/70 bg-white/90',
			accent: 'text-lime-700',
			badge: 'bg-lime-100 text-lime-700'
		}
	},
	{
		key: 'pondok',
		label: 'Pondok Pesantren',
		route: '/pondok',
		registerRoute: '/pondok/daftar',
		category: 'Pendidikan',
		enabled: false,
		description: 'Pembinaan santri 24 jam dengan kurikulum diniyah dan tahfidz.',
		registerDescription: 'Daftarkan pondok agar bisa menerima pendaftaran santri dan ustadz.',
		icon: '🏫',
		highlights: ['Manajemen santri', 'Materi diniyah', 'Tahfidz dan ujian'],
		classes: {
			card: 'border-indigo-200/70 bg-white/90',
			accent: 'text-indigo-700',
			badge: 'bg-indigo-100 text-indigo-700'
		}
	},
	{
		key: 'masjid',
		label: 'Masjid',
		route: '/masjid',
		registerRoute: '/masjid/daftar',
		category: 'Kemasjidan',
		enabled: false,
		description: 'Transparansi kas, zakat, dan qurban untuk jamaah.',
		registerDescription: 'Buat akun lembaga masjid untuk mengelola jamaah dan program.',
		icon: '🕌',
		highlights: ['Kas transparan', 'Zakat dan qurban', 'Agenda jamaah'],
		classes: {
			card: 'border-emerald-200/70 bg-white/90',
			accent: 'text-emerald-700',
			badge: 'bg-emerald-100 text-emerald-700'
		}
	},
	{
		key: 'musholla',
		label: 'Musholla',
		route: '/musholla',
		registerRoute: '/musholla/daftar',
		category: 'Kemasjidan',
		enabled: false,
		description: 'Pengelolaan kegiatan musholla yang rapi dan mudah dipantau warga.',
		registerDescription: 'Daftarkan musholla untuk mengelola aktivitas dan anggota.',
		icon: '🏠',
		highlights: ['Kas transparan', 'Kegiatan rutin', 'Pelayanan warga'],
		classes: {
			card: 'border-cyan-200/70 bg-white/90',
			accent: 'text-cyan-700',
			badge: 'bg-cyan-100 text-cyan-700'
		}
	},
	{
		key: 'rumah-tahfidz',
		label: 'Rumah Tahfidz',
		route: '/rumah-tahfidz',
		registerRoute: '/rumah-tahfidz/daftar',
		category: 'Pendidikan',
		enabled: false,
		description: 'Fokus hafalan dengan target dan evaluasi yang terukur.',
		registerDescription: 'Daftarkan rumah tahfidz untuk memantau target hafalan dan halaqah.',
		icon: '🎯',
		highlights: ['Halaqoh hafalan', 'Setoran harian', 'Ujian tahfidz'],
		classes: {
			card: 'border-amber-200/70 bg-white/90',
			accent: 'text-amber-800',
			badge: 'bg-amber-100 text-amber-800'
		}
	}
];

export const INSTITUTION_MAP: Record<InstitutionKey, InstitutionConfig> = INSTITUTIONS.reduce(
	(acc, institution) => {
		acc[institution.key] = institution;
		return acc;
	},
	{} as Record<InstitutionKey, InstitutionConfig>
);

export const ENABLED_INSTITUTIONS = INSTITUTIONS.filter((institution) => institution.enabled);
export const DISABLED_INSTITUTIONS = INSTITUTIONS.filter((institution) => !institution.enabled);

export const getInstitutionByKey = (key: InstitutionKey): InstitutionConfig => INSTITUTION_MAP[key];
