export type TabiutTabiinFigure = {
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

export const tabiutTabiinFigures: TabiutTabiinFigure[] = [
	{
		slug: 'malik-ibn-anas',
		name: 'Imam Malik ibn Anas',
		era: '93-179 H / 711-795 M',
		center: 'Madinah',
		role: 'Imam Dar al-Hijrah, perumus awal mazhab Maliki',
		focus: 'Fiqih Madinah, hadis, usul amal ahl al-Madinah',
		teachers: ["Nafi' mawla Ibn Umar", 'al-Zuhri', 'Hisham ibn Urwah', 'Yahya ibn Said al-Ansari'],
		students: ['Imam al-Shafii', 'Abd al-Rahman ibn al-Qasim', 'Ibn Wahb'],
		summary:
			'Imam Malik menandai fase kodifikasi ilmu di Madinah. Al-Muwatta menggabungkan hadis, fatwa sahabat, dan praktik penduduk Madinah menjadi kerangka fiqih yang rapi.'
	},
	{
		slug: 'al-awzai',
		name: "al-Awza'i",
		era: '88-157 H / 707-774 M',
		center: 'Syam - Beirut',
		role: 'Imam fiqih Syam pada fase awal',
		focus: 'Fiqih, jihad, siyasah, hadis',
		teachers: ['Hasan al-Basri', 'Ata ibn Abi Rabah', 'Qatadah', 'al-Zuhri'],
		students: ['al-Walid ibn Muslim', 'Abu Ishaq al-Fazari'],
		summary:
			"Al-Awza'i menjadi poros keilmuan Syam sebelum mazhab-mazhab besar terkonsolidasi. Pandangannya sangat berpengaruh dalam fiqih Syam, Andalus awal, dan tradisi hadis."
	},
	{
		slug: 'sufyan-al-thawri',
		name: 'Sufyan al-Thawri',
		era: '97-161 H / 716-778 M',
		center: 'Kufah',
		role: 'Imam hadis dan fiqih Irak',
		focus: 'Hadis, fiqih, wara, kritik perawi',
		teachers: ["al-Sha'bi", 'Mansur ibn al-Mutamir', 'Jafar al-Sadiq'],
		students: ['Abd al-Rahman ibn Mahdi', 'Waki ibn al-Jarrah', 'Yahya al-Qattan'],
		summary:
			'Al-Thawri dikenal sebagai imam besar Irak dalam hadis dan fiqih. Ia juga menjadi simbol kezuhudan serta kehati-hatian menghadapi kekuasaan politik.'
	},
	{
		slug: 'shubah-ibn-al-hajjaj',
		name: "Shu'bah ibn al-Hajjaj",
		era: '82-160 H / 701-776 M',
		center: 'Basrah',
		role: 'Pemuka jarh wa ta\'dil generasi awal',
		focus: 'Hadis, kritik sanad, ketelitian perawi',
		teachers: ['Qatadah', 'al-Hakam ibn Utaybah', 'Amr ibn Murrah'],
		students: ['Yahya al-Qattan', 'Abd al-Rahman ibn Mahdi', 'Ali ibn al-Madini'],
		summary:
			"Shu'bah sering disebut amir al-mu'minin fi al-hadith pada zamannya. Ia berjasa besar dalam membangun disiplin kritik perawi dan kehati-hatian sanad."
	},
	{
		slug: 'ibn-jurayj',
		name: 'Ibn Jurayj',
		era: '80-150 H / 699-767 M',
		center: 'Makkah',
		role: 'Penghimpun ilmu Makkah generasi awal',
		focus: 'Fiqih Haramayn, hadis, atsar',
		teachers: ["Ata' ibn Abi Rabah", 'Amr ibn Dinar'],
		students: ['Abd al-Razzaq al-Sanani', 'Sufyan ibn Uyaynah'],
		summary:
			'Ibn Jurayj berperan dalam pengumpulan riwayat dan fikih Makkah. Jalurnya penting untuk meneruskan tradisi para ulama Haramayn ke fase penulisan yang lebih sistematis.'
	},
	{
		slug: 'layth-ibn-sad',
		name: "Layth ibn Sa'd",
		era: '94-175 H / 713-791 M',
		center: 'Mesir',
		role: 'Imam Mesir dan mujtahid besar',
		focus: 'Fiqih, hadis, fatwa masyarakat',
		teachers: ["Nafi' mawla Ibn Umar", 'Ata ibn Abi Rabah', 'Ibn Shihab al-Zuhri'],
		students: ['al-Shafii', 'Abdullah ibn Wahb'],
		summary:
			'Layth menjadi otoritas tertinggi Mesir pada masanya. Keluasan ilmunya diakui para imam, walau mazhabnya tidak bertahan sebagai mazhab formal seperti empat mazhab Sunni.'
	},
	{
		slug: 'abdullah-ibn-al-mubarak',
		name: 'Abdullah ibn al-Mubarak',
		era: '118-181 H / 736-797 M',
		center: 'Khurasan - Marw',
		role: 'Ulama hadis, zuhud, dan jihad',
		focus: 'Hadis, adab, zuhud, rihlah ilmu',
		teachers: ['Sufyan al-Thawri', 'al-Awzai', 'Hammad ibn Zayd'],
		students: ['Ahmad ibn Hanbal', 'Nuaym ibn Hammad'],
		summary:
			'Ibn al-Mubarak merepresentasikan generasi ilmuwan pengembara yang menggabungkan hadis, adab, dan kesungguhan hidup. Karyanya banyak memengaruhi literatur zuhud Sunni.'
	},
	{
		slug: 'sufyan-ibn-uyaynah',
		name: 'Sufyan ibn Uyaynah',
		era: '107-198 H / 725-814 M',
		center: 'Makkah',
		role: 'Muhaddith besar Makkah',
		focus: 'Hadis, tafsir, fiqih',
		teachers: ['Amr ibn Dinar', 'al-Zuhri', 'Ibn Jurayj'],
		students: ['al-Shafii', 'Ahmad ibn Hanbal', 'Ali ibn al-Madini'],
		summary:
			'Ibnu Uyaynah menjadi jembatan penting antara tradisi ilmu Makkah dan generasi imam besar abad ke-2 hingga ke-3 Hijriyah. Jalur riwayatnya tersebar luas dalam kitab hadis.'
	},
	{
		slug: 'waki-ibn-al-jarrah',
		name: 'Waki ibn al-Jarrah',
		era: '128-197 H / 745-812 M',
		center: 'Kufah',
		role: 'Guru hadis dan fiqih Kufah',
		focus: 'Hadis, atsar, fiqih Irak',
		teachers: ['Sufyan al-Thawri', "al-A'mash", 'Misar ibn Kidam'],
		students: ['Ahmad ibn Hanbal', 'Ishaq ibn Rahawayh'],
		summary:
			'Waki dikenal sebagai guru para imam hadis besar. Ia menyalurkan warisan ilmiah Kufah ke fase penyusunan musnad dan kitab-kitab hadis abad ketiga.'
	}
];
