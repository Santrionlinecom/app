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
		desc: 'Memperkuat spiritual dan ketenangan hati',
		cta: 'Pelajari wirid harian',
		highlight: 'Kumpulan dzikir pagi-petang, doa harian, dan wirid-sanad.',
		bullets: [
			'Dzikir pagi-petang bersumber dari hadits shahih',
			'Kumpulan doa mustajab ulama salaf',
			'Pengingat dzikir dengan tampilan simpel'
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
		desc: 'Khatam Al-Quran bersama santri lainnya',
		cta: 'Gabung jadwal khatam',
		highlight: 'Program khataman berkala dengan target terukur.',
		bullets: [
			'Jadwal khatam mingguan/bulanan',
			'Pembagian juz & reminder progres',
			'Sesi doa khatmil Qur’an bersama'
		]
	},
	{
		slug: 'istighotsah',
		icon: '✨',
		title: 'Istighotsah',
		desc: 'Memohon pertolongan Allah secara berjamaah',
		cta: 'Ikuti jadwal istighotsah',
		highlight: 'Panduan istighotsah ala pesantren dengan doa-doa pilihan.',
		bullets: [
			'Teks doa istighotsah lengkap',
			'Adab dan tata cara berjamaah',
			'Jadwal virtual & luring'
		]
	}
];
