export type Feature = {
	slug: string;
	icon: string;
	title: string;
	desc: string;
	cta: string;
	highlight: string;
	bullets: string[];
};

export const FEATURES: Feature[] = [
	{
		slug: 'belajar-alquran',
		icon: '📖',
		title: 'Belajar Al-Quran',
		desc: 'Tahfidz & tadabbur dengan metode terbukti',
		cta: 'Mulai belajar hari ini',
		highlight: 'Kelas tahfidz, tajwid, dan tadabbur berbasis kurikulum Aswaja.',
		bullets: [
			'Setoran terjadwal dengan bimbingan ustadz/ustadzah',
			'Latihan tajwid interaktif dan evaluasi rutin',
			'Rencana hafalan harian dan monitoring progres'
		]
	},
	{
		slug: 'dzikir-doa',
		icon: '🤲',
		title: 'Dzikir & Doa',
		desc: 'Dzikir, doa harian, dan pembiasaan Aswaja',
		cta: 'Pelajari wirid harian',
		highlight: 'Kumpulan dzikir pagi-petang, doa harian, wirid setelah sholat, dan target hafalan santri.',
		bullets: [
			'Dzikir pagi-petang, istighfar, tahlil, dan shalawat',
			'Doa harian terhubung ke rapor hafalan santri',
			'Materi publik agar wali murid tahu target pembiasaan'
		]
	},
	{
		slug: 'kitab-turats',
		icon: '📚',
		title: 'Kitab Turats',
		desc: 'Mempelajari kitab kuning warisan ulama',
		cta: 'Buka daftar kitab',
		highlight: 'Kajian fiqih, aqidah, dan tasawuf dengan rujukan mu’tabar.',
		bullets: [
			'Ringkasan kitab kuning dan terjemah poin penting',
			'Kajian tematik: adab, akhlak, dan ibadah praktis',
			'Catatan interaktif untuk tiap bab'
		]
	},
	{
		slug: 'khataman-rutin',
		icon: '🎯',
		title: 'Khataman Rutin',
		desc: 'Khataman bulanan Kamis Kliwon atau Jumat Legi',
		cta: 'Gabung jadwal khatam',
		highlight: 'Program khataman sebulan sekali ala pesantren dan Nahdlatul Ulama, terhubung dengan halaqoh santri.',
		bullets: [
			'Jadwal Kamis Kliwon atau Jumat Legi',
			'Pembagian juz, petugas, dan reminder progres',
			'Khatmil Quran bersama santri, guru, dan wali'
		]
	},
	{
		slug: 'istighotsah',
		icon: '✨',
		title: 'Istighotsah',
		desc: 'Istighotsah ala pesantren Nahdlatul Ulama',
		cta: 'Ikuti jadwal istighotsah',
		highlight: 'Panduan istighotsah, tahlil, shalawat, dan doa bersama yang bisa dijadwalkan rutin.',
		bullets: [
			'Agenda Kamis Kliwon, Jumat Legi, atau bulanan',
			'Adab berjamaah dan rangkaian bacaan majelis',
			'Terhubung dengan materi dzikir, doa, dan hafalan'
		]
	}
];
