export type TabiinFigure = {
	slug: string;
	name: string;
	era: string;
	center: string;
	role: string;
	focus: string;
	teachers: string[];
	students: string[];
	summary: string;
};

export const tabiinFigures: TabiinFigure[] = [
	{
		slug: 'said-ibn-al-musayyib',
		name: "Sa'id ibn al-Musayyib",
		era: '15-94 H / 637-715 M',
		center: 'Madinah',
		role: "Faqih Madinah, bagian dari al-Fuqaha' al-Sab'ah",
		focus: 'Fiqih, fatwa, hadis',
		teachers: ["Umar ibn al-Khattab", 'Uthman ibn Affan', 'Aisyah', 'Abu Hurairah', "Ibn 'Abbas"],
		students: ['al-Zuhri', 'Qatadah', "Yahya ibn Sa'id al-Ansari"],
		summary:
			'Rujukan utama fiqih Madinah pada generasi tabiin. Ia dikenal kuat dalam fatwa, memahami praktik ahli Madinah, dan menjadi penghubung penting antara sahabat senior dengan generasi kodifikasi awal.'
	},
	{
		slug: 'urwah-ibn-al-zubayr',
		name: 'Urwah ibn al-Zubayr',
		era: '23-94 H / 644-713 M',
		center: 'Madinah',
		role: 'Ahli hadis dan sirah dari keluarga Asma dan al-Zubayr',
		focus: 'Hadis, sirah, fiqih keluarga Nabi',
		teachers: ['Aisyah', 'Asma bint Abi Bakr', 'Abu Hurairah', "Ibn 'Abbas"],
		students: ['Hisham ibn Urwah', 'al-Zuhri'],
		summary:
			'Urwah termasuk jalur terpenting periwayatan hadis rumah tangga Nabi melalui Aisyah. Banyak detail sirah, fiqih, dan adab keluarga Rasulullah tersambung melalui dirinya.'
	},
	{
		slug: 'al-qasim-ibn-muhammad',
		name: 'al-Qasim ibn Muhammad ibn Abi Bakr',
		era: '36-107 H / 656-725 M',
		center: 'Madinah',
		role: "Cucu Abu Bakr dan faqih Madinah",
		focus: 'Fiqih, hadis, adab fatwa',
		teachers: ['Aisyah', 'Abdullah ibn Abbas', 'Abdullah ibn Umar'],
		students: ['Imam Malik', 'Ayyub al-Sakhtiyani'],
		summary:
			'Kehadirannya penting dalam mata rantai ilmu keluarga Abu Bakr dan Aisyah. Ia dikenal tenang, kuat menjaga atsar, dan menjadi salah satu pilar tradisi fiqih Madinah.'
	},
	{
		slug: 'salim-ibn-abdullah',
		name: 'Salim ibn Abdullah ibn Umar',
		era: '61-106 H / 681-725 M',
		center: 'Madinah',
		role: 'Putra Abdullah ibn Umar dan faqih Madinah',
		focus: 'Hadis, fiqih, ibadah',
		teachers: ['Abdullah ibn Umar', 'Aisyah', 'Abu Hurairah'],
		students: ['Imam Malik', 'al-Zuhri'],
		summary:
			'Salim menjadi jalur penting pengajaran ibadah, wara, dan fiqih dari rumah Ibn Umar. Ia sering disebut dalam sanad-sanad emas tradisi Madinah.'
	},
	{
		slug: 'nafi-mawla-ibn-umar',
		name: "Nafi' mawla Ibn Umar",
		era: 'w. 117 H / 735 M',
		center: 'Madinah',
		role: 'Murid utama Abdullah ibn Umar',
		focus: 'Hadis dan praktik ibadah',
		teachers: ['Abdullah ibn Umar'],
		students: ['Imam Malik', 'Ayyub al-Sakhtiyani', 'Ubayd Allah ibn Umar'],
		summary:
			"Nafi' adalah salah satu mata rantai hadis paling terkenal, terutama dalam jalur Malik -> Nafi' -> Ibn Umar. Ia merekam dengan sangat rinci amalan dan fatwa Ibn Umar."
	},
	{
		slug: 'ata-ibn-abi-rabah',
		name: "Ata' ibn Abi Rabah",
		era: '27-114 H / 647-732 M',
		center: 'Makkah',
		role: 'Mufti Makkah dan rujukan manasik',
		focus: 'Fiqih haji, tafsir, hadis',
		teachers: ["Ibn 'Abbas", 'Abu Hurairah', 'Aisyah', 'Jabir ibn Abd Allah'],
		students: ['Ibn Jurayj', 'Amr ibn Dinar', 'Qatadah'],
		summary:
			"Ata' dikenal sebagai otoritas besar Makkah, terutama dalam masalah haji dan tafsir. Banyak murid setelahnya mengangkat tradisi ilmu Haramayn melalui dirinya."
	},
	{
		slug: 'tawus-ibn-kaysan',
		name: 'Tawus ibn Kaysan',
		era: '33-106 H / 653-724 M',
		center: 'Yaman - Makkah',
		role: 'Ulama Yaman yang kuat dalam ibadah dan riwayat',
		focus: 'Tafsir, hadis, zuhud',
		teachers: ["Ibn 'Abbas", 'Aisyah', 'Zayd ibn Thabit', 'Abu Hurairah'],
		students: ['Abdullah ibn Tawus', 'Amr ibn Dinar'],
		summary:
			"Tawus menonjol dalam jalur ilmu Ibn Abbas. Ia menjadi jembatan penting antara pusat ilmu Makkah dengan Yaman, serta dikenal kuat dalam kezuhudan dan keteguhan."
	},
	{
		slug: 'al-hasan-al-basri',
		name: 'al-Hasan al-Basri',
		era: '21-110 H / 642-728 M',
		center: 'Basrah',
		role: 'Penceramah, ahli hikmah, dan tokoh zuhud Basrah',
		focus: 'Tazkiyah, nasihat, akidah awal, tafsir',
		teachers: ['Anas ibn Malik', 'Abdullah ibn Abbas', 'Imran ibn Husayn'],
		students: ['Qatadah', 'Yunus ibn Ubayd', 'Malik ibn Dinar'],
		summary:
			'Al-Hasan al-Basri sangat berpengaruh dalam tradisi nasihat, muhasabah, dan kezuhudan Sunni awal. Ia juga dikenal kritis terhadap kezaliman politik dan menekankan tanggung jawab moral manusia.'
	},
	{
		slug: 'muhammad-ibn-sirin',
		name: 'Muhammad ibn Sirin',
		era: '33-110 H / 653-729 M',
		center: 'Basrah',
		role: 'Muhaddith dan faqih Basrah',
		focus: 'Hadis, fiqih, wara',
		teachers: ['Anas ibn Malik', 'Abu Hurairah', 'Abdullah ibn Abbas'],
		students: ['Ayyub al-Sakhtiyani', 'Qatadah', 'Khalid al-Hadhdha'],
		summary:
			'Ibn Sirin terkenal sebagai ahli hadis dan ketelitian sanad. Namanya juga sering dikaitkan dengan riwayat tentang adab, wara, dan penjelasan mimpi di literatur klasik.'
	},
	{
		slug: 'al-shabi',
		name: "al-Sha'bi",
		era: '19-103 H / 640-721 M',
		center: 'Kufah',
		role: 'Ahli riwayat Kufah yang bertemu banyak sahabat',
		focus: 'Hadis, qadha, fiqih masyarakat',
		teachers: ['Ali ibn Abi Talib', "Ibn 'Umar", "Ibn 'Abbas", 'Abu Musa al-Ashari'],
		students: ['Abu Hanifah', 'Ismail ibn Abi Khalid', 'Mughirah ibn Miqsam'],
		summary:
			"Al-Sha'bi menjadi tokoh penting di Kufah karena keluasan riwayat dan keterlibatannya dalam persoalan masyarakat. Ia membantu mewariskan tradisi ilmu Irak dari para sahabat ke generasi sesudahnya."
	}
];
