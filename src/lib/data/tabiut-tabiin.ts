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
	story?: string;
	achievements?: string[];
	lessons?: string[];
	traits?: string[];
};

export const tabiutTimeline = [
	{
		period: '80–120 H',
		title: 'Murid besar tabi’in menonjol',
		desc: 'Generasi ini menerima ilmu dari az-Zuhri, Nafi’, Atha’, Qatadah, Hasan al-Basri, dan Asy-Sya’bi. Mereka menghubungkan majelis tabi’in dengan imam abad kedua.'
	},
	{
		period: '120–150 H',
		title: 'Rihlah ilmu makin luas',
		desc: 'Penuntut ilmu berpindah antar kota: Madinah, Makkah, Kufah, Basrah, Syam, Mesir, Yaman, Khurasan. Perbandingan riwayat membuat kritik sanad semakin tajam.'
	},
	{
		period: '130–180 H',
		title: 'Kitab dan metode tersusun',
		desc: 'Hadis, atsar, fatwa, dan bab fiqih dihimpun lebih sistematis. Al-Muwatta, mushannaf awal, dan catatan fatwa kota menandai fase kodifikasi.'
	},
	{
		period: '150–200 H',
		title: 'Jalan menuju imam mazhab dan hadis',
		desc: 'Murid generasi ini menyiapkan fase Syafi’i, Ahmad, Ali bin al-Madini, Yahya bin Ma’in, dan penyusun kitab abad ketiga.'
	}
];

export const tabiutCenterProfiles = [
	{
		name: 'Madinah',
		focus: 'Al-Muwatta, amal ahlul Madinah, fiqih riwayat',
		desc: 'Madinah menjadi simbol kesinambungan amal masyarakat Nabi. Imam Malik menyusun fiqih berpijak pada hadis, atsar, dan praktik penduduk Madinah.'
	},
	{
		name: 'Makkah',
		focus: 'Fiqih Haramayn, tafsir, sanad haji',
		desc: 'Menghubungkan Atha’, Ibnu Juraij, Sufyan bin Uyainah, dan murid yang menjadi guru para imam abad ketiga.'
	},
	{
		name: 'Kufah',
		focus: 'Hadis Irak, fiqih atsar, wara’',
		desc: 'Kuat dalam riwayat Ibnu Mas’ud dan Ali. Sufyan ats-Tsauri dan Waki’ menghubungkan ke tradisi musnad dan kritik hadis.'
	},
	{
		name: 'Basrah',
		focus: 'Kritik sanad, jarh wa ta’dil, ketelitian perawi',
		desc: 'Melahirkan Syu’bah dan Yahya al-Qaththan. Disiplin menilai perawi dan menguji riwayat semakin tegas.'
	},
	{
		name: 'Syam / Beirut',
		focus: 'Fiqih Syam, jihad, tata masyarakat perbatasan',
		desc: 'Al-Auza’i menjadi poros fiqih Syam; pengaruhnya sampai Andalus awal sebelum peta mazhab terkonsolidasi.'
	},
	{
		name: 'Mesir',
		focus: 'Mujtahid kota, fatwa masyarakat, jaringan barat',
		desc: 'Laits bin Sa’d menjadi otoritas Mesir yang diakui para imam, walau mazhab formalnya tidak bertahan seperti empat mazhab.'
	},
	{
		name: 'Khurasan / Marw',
		focus: 'Rihlah, hadis, zuhud, adab',
		desc: 'Abdullah bin al-Mubarak merepresentasikan ilmuwan pengembara yang menggabungkan hadis, adab, dan kesungguhan hidup.'
	}
];

export const tabiutCodificationCards = [
	{
		title: 'Hadis dan atsar',
		desc: 'Riwayat dikumpulkan menurut guru, bab, dan tema. Membandingkan sanad makin penting karena wilayah Islam makin luas.'
	},
	{
		title: 'Fiqih kota',
		desc: 'Fatwa Madinah, Makkah, Kufah, Basrah, Syam, dan Mesir terlihat sebagai tradisi hukum lokal yang menjadi bahan mazhab.'
	},
	{
		title: 'Jarh wa ta’dil',
		desc: 'Penilaian hafalan, kejujuran, ketelitian, dan pertemuan perawi menjadi ilmu tersendiri.'
	},
	{
		title: 'Rihlah ilmiah',
		desc: 'Ulama bepergian jauh untuk mendengar langsung, menguji riwayat, dan membandingkan fatwa antar pusat ilmu.'
	},
	{
		title: 'Zuhud dan adab',
		desc: 'Menjaga kesederhanaan, takut kedudukan, dan memperingatkan bahaya ilmu tanpa amal.'
	},
	{
		title: 'Jalan ke kitab klasik',
		desc: 'Karya dan sanad mereka menjadi bahan musnad, shahih, sunan, rijal, tafsir, dan fiqih setelahnya.'
	}
];

export const tabiutBridgeNotes = [
	'Imam Malik menghubungkan tradisi Madinah dengan murid seperti Imam Syafi’i dan Ibnu Wahb.',
	'Sufyan ats-Tsauri, Waki’, Syu’bah, dan Yahya al-Qaththan memperkuat jalur hadis Irak menuju Ahmad bin Hanbal dan para kritikus hadis.',
	'Ibnu Juraij dan Sufyan bin Uyainah menjaga jaringan Makkah yang memengaruhi Syafi’i, Ahmad, dan ahli hadis setelahnya.',
	'Al-Auza’i, Laits, dan Ibnu al-Mubarak memperlihatkan bahwa sebelum empat mazhab mapan, banyak mujtahid besar berpengaruh di wilayahnya.'
];

export const tabiutAdabNotes = [
	'Melihat generasi ini sebagai fase kerja ilmiah yang berat: menghafal, menguji, bepergian, menulis, dan menyaring riwayat.',
	'Tidak menyederhanakan sejarah mazhab seolah langsung jadi. Metode matang lewat dialog panjang antar kota.',
	'Menghormati imam yang mazhab formalnya tidak bertahan, karena jasa ilmunya tetap masuk kitab-kitab besar.',
	'Mengambil teladan ketelitian sanad, kehati-hatian fatwa, dan keteguhan adab terhadap guru.'
];

export const tabiutTabiinFigures: TabiutTabiinFigure[] = [
	{
		slug: 'malik-ibn-anas',
		name: 'Imam Malik bin Anas',
		era: '93–179 H / 711–795 M',
		center: 'Madinah',
		role: 'Imam Dar al-Hijrah, perumus awal mazhab Maliki',
		focus: 'Fiqih Madinah, hadis, usul amal ahlul Madinah',
		teachers: ["Nafi' mawla Ibnu Umar", 'az-Zuhri', 'Hisyam bin Urwah', "Yahya bin Sa'id al-Ansari"],
		students: ["Imam asy-Syafi'i", 'Abdurrahman bin al-Qasim', 'Ibnu Wahb'],
		summary: 'Menandai fase kodifikasi di Madinah. Al-Muwatta menggabungkan hadis, fatwa sahabat, dan praktik penduduk Madinah.',
		story:
			'Malik tumbuh di kota Nabi dan menolak meninggalkan Madinah untuk jabatan. Ia menyusun Al-Muwatta dengan seleksi ketat dan penghormatan pada amal ahlul Madinah. Fatwanya tenang, wara’, dan berpengaruh sampai Afrika dan Andalus. Lewat muridnya, corak Madinah menjadi mazhab yang hidup hingga kini.',
		achievements: ['Penulis Al-Muwatta', 'Imam fiqih Madinah', 'Guru asy-Syafi’i'],
		lessons: ['Kota ilmu punya “amal” yang dijaga', 'Seleksi riwayat lebih utama daripada menumpuk', 'Wara’ imam menular ke mazhab'],
		traits: ['Wara’', 'Selektif', 'Kokoh di Madinah']
	},
	{
		slug: 'al-awzai',
		name: "Al-Auza'i",
		era: '88–157 H / 707–774 M',
		center: 'Syam / Beirut',
		role: 'Imam fiqih Syam pada fase awal',
		focus: 'Fiqih, jihad, siyasah, hadis',
		teachers: ['Atha’ bin Abi Rabah', 'Qatadah', 'az-Zuhri'],
		students: ['al-Walid bin Muslim', 'Abu Ishaq al-Fazari'],
		summary: 'Poros keilmuan Syam sebelum mazhab besar terkonsolidasi; berpengaruh di Syam dan Andalus awal.',
		story:
			"Al-Auza'i menjadi rujukan fiqih wilayah perbatasan dan masyarakat Syam. Ia dikenal berani, zuhud, dan berpengaruh sebelum peta empat mazhab mengeras. Banyak persoalan siyasah dan jihad era itu dibaca lewat lensanya.",
		achievements: ['Imam Syam', 'Pengaruh Andalus awal', 'Teladan keberanian ulama'],
		lessons: ['Wilayah butuh fiqih kontekstual yang bersanad', 'Ulama perbatasan menjaga umat', 'Mazhab formal bukan satu-satunya ukuran jasa'],
		traits: ['Berani', 'Faqih', 'Zuhud']
	},
	{
		slug: 'sufyan-al-thawri',
		name: 'Sufyan ats-Tsauri',
		era: '97–161 H / 716–778 M',
		center: 'Kufah',
		role: 'Imam hadis dan fiqih Irak',
		focus: 'Hadis, fiqih, wara’, kritik perawi',
		teachers: ["Asy-Sya'bi", "Mansur bin al-Mu'tamir", "Ja'far ash-Shadiq"],
		students: ['Abdurrahman bin Mahdi', "Waki' bin al-Jarrah", 'Yahya al-Qaththan'],
		summary: 'Imam besar Irak dalam hadis dan fiqih; simbol zuhud dan kehati-hatian menghadapi kekuasaan.',
		story:
			'Ats-Tsauri hafiz besar yang juga faqih. Ia menghindari basah hati terhadap penguasa dan menekankan wara’. Murid-muridnya menjadi poros kritik hadis. Ia jembatan antara riwayat Kufah dan generasi Ahmad bin Hanbal.',
		achievements: ['Imam hadis Irak', 'Guru para kritikus sanad', 'Teladan menjauhi fitnah kuasa'],
		lessons: ['Ilmu dan zuhud bisa bersatu', 'Jangan jual agama ke istana', 'Kritik perawi butuh takut Allah'],
		traits: ['Hafiz', 'Zuhud', 'Tegas']
	},
	{
		slug: 'shubah-ibn-al-hajjaj',
		name: "Syu'bah bin al-Hajjaj",
		era: '82–160 H / 701–776 M',
		center: 'Basrah',
		role: 'Pemuka jarh wa ta’dil generasi awal',
		focus: 'Hadis, kritik sanad, ketelitian perawi',
		teachers: ['Qatadah', "al-Hakam bin 'Utaibah", 'Amr bin Murrah'],
		students: ['Yahya al-Qaththan', 'Abdurrahman bin Mahdi', "Ali bin al-Madini"],
		summary: "Sering disebut amirul mu’minin fil hadis pada zamannya; peletak disiplin kritik perawi.",
		story:
			"Syu'bah memimpin ketelitian Basrah: siapa yang hafal, siapa yang mudallis, siapa yang bertemu. Tanpa fondasi ini, kitab shahih belakangan sulit berdiri. Ia guru para imam kritik sanad.",
		achievements: ['Peletak jarh wa ta’dil praktis', 'Guru Yahya al-Qaththan & Ibnu Mahdi', 'Standar ketelitian Basrah'],
		lessons: ['Menjaga sunnah butuh menyaring manusia', 'Ketelitian adalah ibadah', 'Guru kritikus melahirkan kritikus'],
		traits: ['Teliti', 'Tegas', 'Hafiz']
	},
	{
		slug: 'ibn-jurayj',
		name: 'Ibnu Juraij',
		era: '80–150 H / 699–767 M',
		center: 'Makkah',
		role: 'Penghimpun ilmu Makkah generasi awal',
		focus: 'Fiqih Haramayn, hadis, atsar',
		teachers: ["Atha' bin Abi Rabah", 'Amr bin Dinar'],
		students: ["Abdurrazzaq ash-Shan'ani", 'Sufyan bin Uyainah'],
		summary: 'Berperan dalam pengumpulan riwayat dan fiqih Makkah menuju fase penulisan lebih sistematis.',
		story:
			'Ibnu Juraij menuliskan dan merapikan warisan Atha’ dan ulama Makkah. Ia jembatan ke Abdurrazzaq dan Ibnu Uyainah. Tradisi Haramayn tidak hilang saat kota lain mulai menulis lebih masif.',
		achievements: ['Kodifikasi awal Makkah', 'Guru Abdurrazzaq & Ibnu Uyainah', 'Penjaga fiqih manasik/atsar'],
		lessons: ['Menulis menjaga sekolah kota', 'Murid Atha’ harus setia dan produktif', 'Haramayn butuh dokumentasi'],
		traits: ['Penulis', 'Faqih', 'Jaringan luas']
	},
	{
		slug: 'layth-ibn-sad',
		name: "Laits bin Sa'd",
		era: '94–175 H / 713–791 M',
		center: 'Mesir',
		role: 'Imam Mesir dan mujtahid besar',
		focus: 'Fiqih, hadis, fatwa masyarakat',
		teachers: ["Nafi' mawla Ibnu Umar", "Atha' bin Abi Rabah", 'Ibnu Syihab az-Zuhri'],
		students: ["Asy-Syafi'i", 'Abdullah bin Wahb'],
		summary: 'Otoritas tertinggi Mesir pada masanya; keluasan ilmunya diakui meski mazhab formalnya tidak bertahan.',
		story:
			"Laits adalah mujtahid mandiri yang dihormati Malik dan generasi sezaman. Fatwanya menjawab masyarakat Mesir. Bahwa mazhabnya tidak melembaga seperti empat mazhab tidak mengurangi jasanya yang meresap ke jalur Syafi’i dan Maliki lewat murid bersama.",
		achievements: ['Imam Mesir', 'Mujtahid lintas penghargaan', 'Guru tidak langsung jaringan Syafi’i–Maliki'],
		lessons: ['Jasa ilmu lebih abadi daripada label mazhab', 'Kota besar butuh mujtahid lokal', 'Saling hormat antar imam'],
		traits: ['Mujtahid', 'Dermawan', 'Luas ilmu']
	},
	{
		slug: 'abdullah-ibn-al-mubarak',
		name: 'Abdullah bin al-Mubarak',
		era: '118–181 H / 736–797 M',
		center: 'Khurasan / Marw',
		role: 'Ulama hadis, zuhud, dan rihlah',
		focus: 'Hadis, adab, zuhud, rihlah ilmu',
		teachers: ['Sufyan ats-Tsauri', "Al-Auza'i", 'Hammad bin Zaid'],
		students: ['Ahmad bin Hanbal', "Nu'aim bin Hammad"],
		summary: 'Ilmuwan pengembara yang menggabungkan hadis, adab, dan kesungguhan hidup; memengaruhi literatur zuhud Sunni.',
		story:
			'Ibnu al-Mubarak merihlah jauh, berdagang dengan amanah, berjihad, dan menulis tentang zuhud. Ia model sempurna “ilmu + amal + pergerakan”. Ahmad bin Hanbal memuliakannya sebagai imam.',
		achievements: ['Rihlah lintas wilayah', 'Karya zuhud berpengaruh', 'Guru Ahmad bin Hanbal'],
		lessons: ['Ilmu tanpa rihlah sering sempit', 'Harta halal menopang dakwah', 'Zuhud aktif, bukan pasif'],
		traits: ['Pengembara', 'Zuhud', 'Hafiz']
	},
	{
		slug: 'sufyan-ibn-uyaynah',
		name: 'Sufyan bin Uyainah',
		era: '107–198 H / 725–814 M',
		center: 'Makkah',
		role: 'Muhaddits besar Makkah',
		focus: 'Hadis, tafsir, fiqih',
		teachers: ['Amr bin Dinar', 'az-Zuhri', 'Ibnu Juraij'],
		students: ["Asy-Syafi'i", 'Ahmad bin Hanbal', "Ali bin al-Madini"],
		summary: 'Jembatan tradisi Makkah ke imam besar abad ke-2–3 H; jalur riwayatnya tersebar luas.',
		story:
			'Ibnu Uyainah lama tinggal di Makkah dan menjadi tujuan rihlah. Syafi’i dan Ahmad minum dari majelisnya. Ia menjaga sanad Hijaz saat Irak dan Khurasan juga menggeliat.',
		achievements: ['Guru Syafi’i & Ahmad', 'Poros sanad Makkah', 'Panjang umur ilmiah'],
		lessons: ['Konsistensi majelis membentuk imam', 'Hijaz tetap pusat meski kota lain maju', 'Umur panjang ilmu adalah nikmat'],
		traits: ['Muhaddits', 'Panjang sanad', 'Fasih']
	},
	{
		slug: 'waki-ibn-al-jarrah',
		name: "Waki' bin al-Jarrah",
		era: '128–197 H / 745–812 M',
		center: 'Kufah',
		role: 'Guru hadis dan fiqih Kufah',
		focus: 'Hadis, atsar, fiqih Irak',
		teachers: ['Sufyan ats-Tsauri', "al-A'masy", 'Mis’ar bin Kidam'],
		students: ['Ahmad bin Hanbal', 'Ishaq bin Rahuyah'],
		summary: 'Guru para imam hadis besar; menyalurkan warisan Kufah ke fase musnad dan kitab abad ketiga.',
		story:
			"Waki' dikenal hafiz, zuhud, dan sangat dihormati Ahmad. Ia memindahkan kekayaan riwayat Kufah ke generasi penyusunan musnad. Tanpa guru seperti Waki’, jembatan Irak ke Ahmad tidak sekuat itu.",
		achievements: ['Guru Ahmad bin Hanbal', 'Hafiz Kufah', 'Penyalur warisan ats-Tsauri'],
		lessons: ['Guru shalih membentuk imam shalih', 'Hafalan butuh zuhud', 'Kufah tetap relevan di era kodifikasi'],
		traits: ['Hafiz', 'Zuhud', 'Terpercaya']
	},
	{
		slug: 'yahya-al-qattan',
		name: 'Yahya bin Sa’id al-Qaththan',
		era: '120–198 H / 738–813 M',
		center: 'Basrah',
		role: 'Imam jarh wa ta’dil',
		focus: 'Kritik perawi, hadis, ketelitian',
		teachers: ["Syu'bah bin al-Hajjaj", 'Sufyan ats-Tsauri'],
		students: ['Ahmad bin Hanbal', 'Ali bin al-Madini', 'Yahya bin Ma’in'],
		summary: 'Di antara peletak standar ketat penilaian perawi; guru para imam kritik sanad.',
		story:
			'Al-Qaththan mewarisi ketelitian Syu’bah dan menyempurnakannya. Penilaiannya menjadi rujukan. Generasi “kanonik” kritik hadis (Ahmad, Ibnu Ma’in, Ibnu al-Madini) banyak terbentuk di bawah pengaruhnya.',
		achievements: ['Standar jarh wa ta’dil', 'Guru trio kritikus besar', 'Poros Basrah'],
		lessons: ['Ketat demi menjaga agama, bukan menyakiti', 'Guru kritikus melahirkan ekosistem shahih', 'Basrah sekolah ketelitian'],
		traits: ['Ketat', 'Adil', 'Hafiz']
	},
	{
		slug: 'abdurrahman-ibn-mahdi',
		name: 'Abdurrahman bin Mahdi',
		era: '135–198 H / 752–814 M',
		center: 'Basrah',
		role: 'Hafiz dan kritikus hadis',
		focus: 'Hadis, illat, fiqih riwayat',
		teachers: ["Syu'bah", 'Sufyan ats-Tsauri', 'Malik'],
		students: ['Ahmad bin Hanbal', 'Ali bin al-Madini'],
		summary: 'Dianggap seimbang antara riwayat dan dirayah; rujukan illat dan seleksi.',
		story:
			'Ibnu Mahdi menggabungkan keluasan riwayat dan kecerdasan menilai. Ahmad memujinya. Ia jembatan antara imam kota (Malik, Syu’bah, Tsauri) dan generasi shahih.',
		achievements: ['Kritikus seimbang', 'Guru Ahmad', 'Jembatan multi-kota'],
		lessons: ['Jangan hanya hafal, pahami illat', 'Belajar ke banyak imam memperluas lensa', 'Keseimbangan lebih awet daripada ekstrem'],
		traits: ['Cerdas', 'Seimbang', 'Hafiz']
	},
	{
		slug: 'hammad-ibn-abi-sulayman',
		name: 'Hammad bin Abi Sulaiman',
		era: 'w. 120 H',
		center: 'Kufah',
		role: 'Guru fiqih Abu Hanifah',
		focus: 'Fiqih, atsar Kufah',
		teachers: ["Ibrahim an-Nakha'i"],
		students: ['Abu Hanifah', 'Mis’ar'],
		summary: 'Penghubung an-Nakha’i ke Abu Hanifah; poros transfer fiqih Kufah.',
		story:
			'Hammad mewarisi fiqih an-Nakha’i dan mengajarkannya kepada Abu Hanifah. Tanpa mata rantai ini, sekolah Ibnu Mas’ud–Kufah tidak akan sampai sejelas itu ke mazhab Hanafi.',
		achievements: ['Guru Abu Hanifah', 'Pewaris fiqih Kufah', 'Jembatan tabi’in–mazhab'],
		lessons: ['Guru fiqih menentukan corak imam', 'Sanad ra’y yang tertib tetap sanad', 'Kufah membangun fiqih lewat mata rantai'],
		traits: ['Faqih', 'Pengajar']
	},
	{
		slug: 'abu-hanifah',
		name: "Abu Hanifah an-Nu'man",
		era: '80–150 H / 699–767 M',
		center: 'Kufah',
		role: 'Imam mazhab Hanafi, faqih Irak',
		focus: 'Fiqih, usul praktis, qiyas terarah',
		teachers: ['Hammad bin Abi Sulaiman', "Asy-Sya'bi (jalur)"],
		students: ['Abu Yusuf', 'Muhammad bin al-Hasan', 'Zufar'],
		summary: 'Membentuk sekolah fiqih Kufah menjadi mazhab; menjawab persoalan masyarakat dengan nash, atsar, dan nalar tertib.',
		story:
			'Abu Hanifah adalah pedagang yang alim, wara’ dalam muamalah, dan kuat berdiskusi. Ia mewarisi Kufah lalu membangun lingkaran murid yang menuliskan mazhab. Pengaruhnya sampai negara-negara luas. Ia contoh fiqih yang solutif tanpa melepaskan akar atsar.',
		achievements: ['Pendiri mazhab Hanafi', 'Sekolah murid penulis mazhab', 'Fiqih realistis untuk masyarakat'],
		lessons: ['Fiqih untuk manusia nyata', 'Murid penulis mengekalkan imam', 'Wara’ dagang bagian keilmuan'],
		traits: ['Faqih', 'Cerdas', 'Wara’']
	},
	{
		slug: 'abd-al-razzaq',
		name: "Abdurrazzaq ash-Shan'ani",
		era: '126–211 H / 744–827 M',
		center: 'Yaman',
		role: 'Penulis al-Mushannaf, hafiz Yaman',
		focus: 'Hadis, atsar, fiqih riwayat',
		teachers: ['Ma’mar bin Rasyid', 'Ibnu Juraij', 'Sufyan ats-Tsauri'],
		students: ['Ahmad bin Hanbal', 'Ishaq bin Rahuyah', 'Yahya bin Ma’in'],
		summary: 'Al-Mushannaf menjadi khazanah atsar dan hadis tematik; Yaman sebagai tujuan rihlah.',
		story:
			'Abdurrazzaq membuat Yaman magnet rihlah. Karyanya menghimpun atsar sahabat dan tabi’in secara tematik. Banyak imam datang kepadanya. Ia menandai kematangan kodifikasi di luar Hijaz-Irak.',
		achievements: ['Al-Mushannaf', 'Pusat rihlah Yaman', 'Guru para imam kritikus'],
		lessons: ['Penulisan tematik memudahkan fiqih', 'Pusat ilmu bisa lahir di luar kota lama', 'Rihlah ke guru lebih utama daripada ego kota'],
		traits: ['Penulis', 'Hafiz', 'Terbuka untuk rihlah']
	},
	{
		slug: 'ma-mar-bin-rasyid',
		name: 'Ma’mar bin Rasyid',
		era: '96–153 H / 714–770 M',
		center: 'Yaman',
		role: 'Hafiz, guru Abdurrazzaq',
		focus: 'Hadis, maghazi',
		teachers: ['az-Zuhri', 'Qatadah', 'Hammam bin Munabbih'],
		students: ["Abdurrazzaq ash-Shan'ani", 'Sufyan ats-Tsauri'],
		summary: 'Jembatan az-Zuhri ke Yaman; fondasi bagi al-Mushannaf Abdurrazzaq.',
		story:
			'Ma’mar membawa kekayaan riwayat Hijaz-Basrah ke Yaman. Lewat Abdurrazzaq, ilmunya tersebar luas. Ia contoh rihlah yang memindahkan pusat gravitasi sanad.',
		achievements: ['Transfer sanad ke Yaman', 'Guru Abdurrazzaq', 'Hafiz maghazi/hadis'],
		lessons: ['Pindah kota bisa jadi strategi ilmu', 'Guru di balik penulis besar sering tersembunyi', 'Sanad az-Zuhri merambah jauh'],
		traits: ['Hafiz', 'Pengembara']
	},
	{
		slug: 'abu-yusuf',
		name: 'Abu Yusuf Ya’qub',
		era: '113–182 H / 731–798 M',
		center: 'Kufah',
		role: 'Murid Abu Hanifah, qadhi, penulis fiqih publik',
		focus: 'Fiqih, qadha, keuangan publik',
		teachers: ['Abu Hanifah', 'Malik (riwayat pertemuan/rihlah)'],
		students: ['Muhammad bin al-Hasan', 'para qadhi Abbasiah'],
		summary: 'Menuliskan dan mempraktikkan fiqih Hanafi di ruang negara; karya tentang kharaj masyhur.',
		story:
			'Abu Yusuf membawa fiqih dari majelis ke mahkamah. Ia menunjukkan fiqih publik: pajak, qadha, dan administrasi. Mazhab hidup karena ada murid yang menulis dan mempraktikkan di lembaga.',
		achievements: ['Qadhi agung', 'Penulis fiqih publik', 'Pelembagaan mazhab Hanafi'],
		lessons: ['Fiqih butuh pejabat amanah', 'Menulis memudahkan praktik negara', 'Murid menentukan nasib mazhab'],
		traits: ['Faqih', 'Praktisi', 'Penulis']
	}
];

export const getTabiutBySlug = (slug: string) => tabiutTabiinFigures.find((f) => f.slug === slug);
export const tabiutCenters = Array.from(new Set(tabiutTabiinFigures.map((f) => f.center)));
