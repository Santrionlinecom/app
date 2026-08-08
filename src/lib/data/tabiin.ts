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
	story?: string;
	achievements?: string[];
	lessons?: string[];
	traits?: string[];
};

export const tabiinTimeline = [
	{
		period: '11–40 H',
		title: 'Murid langsung sahabat senior',
		desc: 'Generasi awal tabi’in tumbuh ketika Abu Bakar, Umar, Utsman, Ali, Aisyah, Ibnu Abbas, Ibnu Umar, Abu Hurairah, Anas, dan sahabat besar lain masih menjadi rujukan umat.'
	},
	{
		period: '40–73 H',
		title: 'Masa fitnah dan penguatan sanad',
		desc: 'Peristiwa politik besar membuat ulama tabi’in lebih berhati-hati menerima riwayat. Kesadaran bertanya “dari siapa?” semakin kuat.'
	},
	{
		period: '60–100 H',
		title: 'Madrasah kota mengeras',
		desc: 'Madinah, Makkah, Kufah, Basrah, Syam, dan Yaman punya corak fatwa sesuai sahabat yang tinggal dan mengajar di sana.'
	},
	{
		period: '90–120 H',
		title: 'Menuju kodifikasi',
		desc: 'Murid tabi’in mulai menulis, mengumpulkan atsar, dan menyusun bahan yang kelak menjadi pondasi kitab hadis, tafsir, fiqih, serta sirah.'
	}
];

export const tabiinCenterProfiles = [
	{
		name: 'Madinah',
		focus: 'Fiqih sahabat, hadis keluarga Nabi, amal ahlul Madinah',
		desc: 'Menjaga memori paling dekat dengan kehidupan Rasulullah ﷺ. Banyak tabi’in belajar dari Aisyah, Abu Hurairah, Ibnu Umar, dan sahabat senior.'
	},
	{
		name: 'Makkah',
		focus: 'Tafsir, manasik haji, jalur Ibnu Abbas',
		desc: 'Kuat dalam tafsir dan manasik. Jalur Ibnu Abbas, Atha’, Thawus, dan Amr bin Dinar menjadi poros Haramayn.'
	},
	{
		name: 'Kufah',
		focus: 'Qadha, fiqih masyarakat, riwayat Ali dan Ibnu Mas’ud',
		desc: 'Kota ilmu yang hidup dengan persoalan hukum. Corak Irak kelak berpengaruh pada fiqih ra’y dan mazhab Hanafi.'
	},
	{
		name: 'Basrah',
		focus: 'Hadis, zuhud, nasihat, bahasa',
		desc: 'Melahirkan tradisi tazkiyah dan ketelitian riwayat. Hasan al-Basri dan Ibnu Sirin adalah dua wajah penting kota ini.'
	},
	{
		name: 'Yaman / Makkah',
		focus: 'Tafsir Ibnu Abbas, zuhud, jaringan selatan',
		desc: 'Yaman terhubung Makkah lewat murid Ibnu Abbas seperti Thawus; membawa tafsir dan adab ibadah ke selatan.'
	},
	{
		name: 'Syam',
		focus: 'Hadis, maghazi, fiqih wilayah penaklukan',
		desc: 'Pusat sahabat yang hijrah ke Syam menumbuhkan tabi’in dengan corak jihad, siyasah, dan riwayat sirah.'
	}
];

export const tabiinDisciplineCards = [
	{
		title: 'Hadis dan sanad',
		desc: 'Belajar langsung dari sahabat, lalu mengajarkan dengan menekankan identitas perawi dan kesinambungan sanad.'
	},
	{
		title: 'Fiqih dan fatwa',
		desc: 'Menjawab masalah baru kota Islam dengan Al-Qur’an, sunnah, fatwa sahabat, dan praktik masyarakat ilmu.'
	},
	{
		title: 'Tafsir Al-Qur’an',
		desc: 'Jalur Ibnu Abbas, Ibnu Mas’ud, Ubay, dan Ali diteruskan murid tabi’in di berbagai kota.'
	},
	{
		title: 'Zuhud dan tazkiyah',
		desc: 'Takut kepada Allah, adab lisan, kesederhanaan, dan kritik moral terhadap kezaliman.'
	},
	{
		title: 'Sirah dan maghazi',
		desc: 'Menjaga detail kehidupan Nabi, hijrah, dan perang dari para saksi pertama.'
	},
	{
		title: 'Qira’ah dan bahasa',
		desc: 'Dekat dengan fase awal bacaan Al-Qur’an dan penjagaan makna wahyu.'
	}
];

export const tabiinAdabNotes = [
	'Membaca tabi’in sebagai jembatan, bukan pengganti sahabat.',
	'Melihat perbedaan fatwa sebagai hasil kota, guru, dan persoalan masyarakat yang berbeda.',
	'Mengambil teladan wara’, adab fatwa, ketelitian sanad, dan keberanian menasihati penguasa.',
	'Tidak memaksakan satu tokoh mewakili seluruh generasi.'
];

export const tabiinFigures: TabiinFigure[] = [
	{
		slug: 'said-ibn-al-musayyib',
		name: "Sa'id bin al-Musayyib",
		era: '15–94 H / 637–715 M',
		center: 'Madinah',
		role: "Faqih Madinah, bagian al-Fuqaha' as-Sab'ah",
		focus: 'Fiqih, fatwa, hadis',
		teachers: ['Umar bin Khattab', 'Utsman bin Affan', 'Aisyah', 'Abu Hurairah', 'Ibnu Abbas'],
		students: ['az-Zuhri', 'Qatadah', "Yahya bin Sa'id al-Ansari"],
		summary: 'Rujukan utama fiqih Madinah; penghubung sahabat senior dengan generasi kodifikasi awal.',
		story:
			"Sa'id bin al-Musayyib termasuk fuqaha tujuh Madinah. Ia dikenal berani dalam fatwa, menjaga amal ahlul Madinah, dan selektif terhadap penguasa. Banyak fatwa dan atsar Madinah bersambung lewat dirinya. Ia simbol faqih yang wara’ namun tidak takut berkata benar.",
		achievements: ['Termasuk fuqaha tujuh Madinah', 'Rujukan fatwa lintas generasi', 'Menjaga praktik ahli Madinah'],
		lessons: ['Ilmu tanpa wara’ mudah dijual', 'Fatwa butuh keberanian dan adab', 'Amal kota ilmu adalah hujjah praktis'],
		traits: ['Wara’', 'Tegas', 'Alim']
	},
	{
		slug: 'urwah-ibn-al-zubayr',
		name: 'Urwah bin az-Zubair',
		era: '23–94 H / 644–713 M',
		center: 'Madinah',
		role: 'Ahli hadis dan sirah dari keluarga Asma’ dan az-Zubair',
		focus: 'Hadis, sirah, fiqih keluarga Nabi',
		teachers: ['Aisyah', "Asma' binti Abu Bakar", 'Abu Hurairah', 'Ibnu Abbas'],
		students: ['Hisyam bin Urwah', 'az-Zuhri'],
		summary: 'Jalur terpenting periwayatan rumah tangga Nabi melalui Aisyah; detail sirah dan adab keluarga Rasulullah.',
		story:
			'Urwah adalah keponakan Aisyah. Kedekatan keluarga membuatnya merekam banyak riwayat kehidupan Nabi di rumah. Ia juga penting dalam sirah dan fiqih. Di tengah fitnah, ia memilih jalur ilmu. Warisannya mengalir lewat putranya Hisyam dan az-Zuhri.',
		achievements: ['Sanad keluarga Aisyah', 'Kontribusi besar pada sirah', 'Pilar fuqaha Madinah'],
		lessons: ['Keluarga alim adalah madrasah', 'Sirah menjaga adab, bukan sekadar kronologi', 'Ilmu lebih selamat daripada fitnah politik'],
		traits: ['Teliti', 'Dekat sunnah rumah tangga', 'Tenang']
	},
	{
		slug: 'al-qasim-ibn-muhammad',
		name: 'al-Qasim bin Muhammad bin Abu Bakar',
		era: '36–107 H / 656–725 M',
		center: 'Madinah',
		role: 'Cucu Abu Bakar, faqih Madinah',
		focus: 'Fiqih, hadis, adab fatwa',
		teachers: ['Aisyah', 'Abdullah bin Abbas', 'Abdullah bin Umar'],
		students: ['Imam Malik', 'Ayyub as-Sakhtiyani'],
		summary: 'Mata rantai ilmu keluarga Abu Bakar–Aisyah; tenang, kuat menjaga atsar, pilar tradisi Madinah.',
		story:
			'Al-Qasim mewarisi ketenangan dan sidik keluarga ash-Shiddiq. Ia termasuk fuqaha Madinah yang dihormati karena adab fatwa. Imam Malik mengambil banyak dari corak ini: tidak buru-buru, menghormati amal Madinah, dan menjaga atsar.',
		achievements: ['Fuqaha Madinah', 'Sanad keluarga shiddiq', 'Guru tidak langsung bagi tradisi Maliki'],
		lessons: ['Adab fatwa menenangkan umat', 'Nasab mulia harus diisi ilmu', 'Atsar sahabat dijaga sebelum ra’y'],
		traits: ['Tenang', 'Wara’', 'Faqih']
	},
	{
		slug: 'salim-ibn-abdullah',
		name: 'Salim bin Abdullah bin Umar',
		era: '±35–106 H / 655–725 M',
		center: 'Madinah',
		role: 'Putra Ibnu Umar, faqih Madinah',
		focus: 'Hadis, fiqih, ibadah',
		teachers: ['Abdullah bin Umar', 'Aisyah', 'Abu Hurairah'],
		students: ['Imam Malik', 'az-Zuhri'],
		summary: 'Jalur ibadah, wara’, dan fiqih dari rumah Ibnu Umar; sering disebut dalam sanad emas Madinah.',
		story:
			'Salim tumbuh dalam disiplin Ibnu Umar yang sangat mengikuti jejak Nabi. Ia meneruskan ketelitian amalan dan kehati-hatian berfatwa. Spirit ittiba’ rumah Ibnu Umar mengalir ke generasi kodifikasi lewat murid-muridnya.',
		achievements: ['Pewaris amalan Ibnu Umar', 'Rujukan ibadah Madinah', 'Sanad menuju generasi kodifikasi'],
		lessons: ['Ittiba’ butuh ketekunan harian', 'Rumah alim menghasilkan alim', 'Wara’ dalam ibadah menular ke fatwa'],
		traits: ['Wara’', 'Ittiba’', 'Sederhana']
	},
	{
		slug: 'nafi-mawla-ibn-umar',
		name: "Nafi' mawla Ibnu Umar",
		era: 'w. 117 H / 735 M',
		center: 'Madinah',
		role: 'Murid utama Abdullah bin Umar',
		focus: 'Hadis dan praktik ibadah',
		teachers: ['Abdullah bin Umar'],
		students: ['Imam Malik', 'Ayyub as-Sakhtiyani', 'Ubaidullah bin Umar'],
		summary: "Mata rantai hadis paling masyhur: Malik dari Nafi' dari Ibnu Umar; merekam amalan dan fatwa Ibnu Umar secara rinci.",
		story:
			"Nafi' adalah mawla Ibnu Umar yang menjadi gudang riwayat amalan beliau. Ketelitiannya membuat jalur ini digelar di antara sanad paling sahih oleh banyak ulama. Tanpa Nafi’, banyak detail ibadah dan fatwa Ibnu Umar tidak tersambung sekuat itu ke generasi kitab.",
		achievements: ['Sanad emas menuju Malik', 'Dokumentasi amalan Ibnu Umar', 'Rujukan praktis ibadah'],
		lessons: ['Kedekatan lama dengan guru mengalahkan hafalan kilat', 'Status sosial tidak menghalangi jadi poros sanad', 'Detail amalan adalah warisan'],
		traits: ['Amanah', 'Teliti', 'Setia pada guru']
	},
	{
		slug: 'muhammad-ibn-muslim-az-zuhri',
		name: 'Ibnu Syihab az-Zuhri',
		era: '±50–124 H / 670–742 M',
		center: 'Madinah',
		role: 'Pemuka kodifikasi hadis awal',
		focus: 'Hadis, maghazi, fiqih',
		teachers: ["Sa'id bin al-Musayyib", 'Anas bin Malik', 'Urwah bin az-Zubair'],
		students: ['Imam Malik', 'Sufyan bin Uyainah', 'Ma’mar bin Rasyid'],
		summary: 'Tokoh kunci penulisan/pengumpulan hadis di era Umar bin Abdul Aziz; poros maghazi dan sunnah.',
		story:
			'Az-Zuhri mengembara menuntut riwayat dan berperan besar saat negara mendorong penulisan sunnah. Ia menghubungkan majelis tabi’in Madinah dengan generasi penulis. Maghazi dan susunan bab mulai lebih rapi lewat jaringan muridnya yang tersebar.',
		achievements: ['Dorongan kodifikasi sunnah', 'Jaringan sanad lintas kota', 'Guru para imam abad ke-2'],
		lessons: ['Menulis ilmu menjaga umat', 'Rihlah adalah investasi sanad', 'Negara butuh ulama; ulama butuh adab kuasa'],
		traits: ['Hafiz', 'Aktif menulis', 'Jaringan luas']
	},
	{
		slug: 'ata-ibn-abi-rabah',
		name: "Atha' bin Abi Rabah",
		era: '27–114 H / 647–732 M',
		center: 'Makkah',
		role: 'Mufti Makkah, rujukan manasik',
		focus: 'Fiqih haji, tafsir, hadis',
		teachers: ['Ibnu Abbas', 'Abu Hurairah', 'Aisyah', 'Jabir bin Abdillah'],
		students: ['Ibnu Juraij', 'Amr bin Dinar', 'Qatadah'],
		summary: 'Otoritas besar Makkah dalam haji dan tafsir; meneruskan tradisi Haramayn.',
		story:
			"Atha' adalah mawla yang diangkat derajatnya oleh ilmu. Di musim haji, fatwanya dinanti. Ia mewarisi keluasan Ibnu Abbas dan menjadi guru para penghimpun ilmu Makkah. Keilmuan Haramain dibuka untuk siapa saja yang bersungguh.",
		achievements: ['Mufti manasik terkemuka', 'Jalur tafsir Makkah', 'Guru Ibnu Juraij dan seangkatan'],
		lessons: ['Ilmu mengangkat status', 'Haji butuh faqih, bukan sekadar ritme massal', 'Sabar mengajar di musim ramai'],
		traits: ['Faqih', 'Sabar', 'Rendah hati']
	},
	{
		slug: 'tawus-ibn-kaysan',
		name: 'Thawus bin Kisan',
		era: '33–106 H / 653–724 M',
		center: 'Yaman / Makkah',
		role: 'Ulama Yaman, kuat ibadah dan riwayat',
		focus: 'Tafsir, hadis, zuhud',
		teachers: ['Ibnu Abbas', 'Aisyah', 'Zaid bin Tsabit', 'Abu Hurairah'],
		students: ['Abdullah bin Thawus', 'Amr bin Dinar'],
		summary: 'Jembatan ilmu Ibnu Abbas ke Yaman; dikenal zuhud dan keteguhan.',
		story:
			'Thawus membawa tafsir dan adab dari majelis Ibnu Abbas ke Yaman. Ia dikenal berani menasihati penguasa dan menjaga ibadah. Jaringan selatan Arab banyak berhutang padanya dalam transfer ilmu Haramayn.',
		achievements: ['Menyebarkan tafsir ke Yaman', 'Teladan zuhud', 'Murid Ibnu Abbas terkemuka'],
		lessons: ['Ilmu harus dibawa pulang ke negeri', 'Nasihat penguasa butuh ikhlas', 'Zuhud menguatkan tafsir yang hidup'],
		traits: ['Zuhud', 'Berani', 'Alim']
	},
	{
		slug: 'mujahid-ibn-jabr',
		name: 'Mujahid bin Jabr',
		era: '21–104 H / 642–722 M',
		center: 'Makkah',
		role: 'Imam tafsir dari jalur Ibnu Abbas',
		focus: 'Tafsir, qiraah, hadis',
		teachers: ['Ibnu Abbas', 'Aisyah', 'Abu Hurairah'],
		students: ['Qatadah', 'Ibnu Juraij', "al-A'masy"],
		summary: 'Di antara penafsir paling berpengaruh; banyak ungkapan tafsir klasik merujuknya.',
		story:
			'Mujahid belajar tafsir secara intensif dari Ibnu Abbas. Ia menelusuri makna ayat dengan bahasa dan atsar. Generasi kitab tafsir setelahnya sering menukilnya. Ia contoh thalib tafsir yang tidak puas dengan hafalan permukaan.',
		achievements: ['Pilar tafsir bi al-ma’tsur', 'Murid senior Ibnu Abbas', 'Rujukan mufasir belakangan'],
		lessons: ['Tafsir butuh duduk lama di kaki guru', 'Bahasa Arab alat, bukan tujuan', 'Atsar sahabat menjaga makna'],
		traits: ['Mufasir', 'Tekun', 'Teliti']
	},
	{
		slug: 'ikrimah-mawla-ibn-abbas',
		name: 'Ikrimah mawla Ibnu Abbas',
		era: 'w. 105 H / 723 M',
		center: 'Makkah',
		role: 'Ahli tafsir dan riwayat Ibnu Abbas',
		focus: 'Tafsir, maghazi, hadis',
		teachers: ['Ibnu Abbas', 'Aisyah', 'Abu Hurairah'],
		students: ['Ayyub as-Sakhtiyani', 'Amr bin Dinar'],
		summary: 'Penyambung keluasan ilmu Ibnu Abbas; kuat dalam tafsir dan berita sirah.',
		story:
			'Ikrimah menyertai Ibnu Abbas dan menyebarkan tafsirnya. Perbincangan jarh di sebagian jalur dibahas ulama dengan instrument musthalah—bukan hawa. Jasanya memindahkan ilmu Ibnu Abbas tetap besar dalam literatur tafsir.',
		achievements: ['Transfer tafsir Ibnu Abbas', 'Rihlah mengajar', 'Bahan utama literatur tafsir'],
		lessons: ['Kritik sanad dilakukan beradab', 'Mawla bisa jadi imam tafsir', 'Ilmu guru hidup lewat murid setia'],
		traits: ['Hafalan kuat', 'Aktif rihlah']
	},
	{
		slug: 'al-hasan-al-basri',
		name: 'al-Hasan al-Basri',
		era: '21–110 H / 642–728 M',
		center: 'Basrah',
		role: 'Ahli hikmah, penceramah, tokoh zuhud Basrah',
		focus: 'Tazkiyah, nasihat, tafsir, akidah amaliah',
		teachers: ['Anas bin Malik', 'Ibnu Abbas', 'Imran bin Hushain'],
		students: ['Qatadah', 'Yunus bin Ubaid', 'Malik bin Dinar'],
		summary: 'Berpengaruh dalam muhasabah dan kezuhudan Sunni awal; menekankan tanggung jawab moral.',
		story:
			'Hasan al-Basri menyaksikan dampak fitnah dan kemewahan dinasti. Nasihatnya menembus hati: takut Allah, jujur, dan tidak terlena dunia. Tradisi mau’izhah Sunni banyak berhutang padanya.',
		achievements: ['Imam mau’izhah Basrah', 'Pengaruh tazkiyah lintas abad', 'Kritik moral terhadap kezaliman'],
		lessons: ['Ilmu harus melahirkan takut Allah', 'Lidah alim adalah amanah publik', 'Zuhud bukan anti-kerja, anti-ghurur'],
		traits: ['Hakim', 'Zuhud', 'Fasih']
	},
	{
		slug: 'muhammad-ibn-sirin',
		name: 'Muhammad bin Sirin',
		era: '33–110 H / 653–729 M',
		center: 'Basrah',
		role: 'Muhaddits dan faqih Basrah',
		focus: 'Hadis, fiqih, wara’',
		teachers: ['Anas bin Malik', 'Abu Hurairah', 'Ibnu Abbas'],
		students: ['Ayyub as-Sakhtiyani', 'Qatadah', "Khalid al-Hadzdza'"],
		summary: 'Ahli hadis dan ketelitian sanad; dikaitkan juga dengan adab dan wara’ dalam literatur klasik.',
		story:
			'Ibnu Sirin mewakili wajah Basrah yang teliti. Ia menekankan dari siapa riwayat diambil. Bersama Hasan, Basrah punya dua kutub: mau’izhah dan ketelitian riwayat.',
		achievements: ['Ketelitian sanad', 'Faqih Basrah', 'Teladan wara’'],
		lessons: ['Tanya sanad adalah perlindungan agama', 'Wara’ dalam jual-beli bagian iman', 'Teman alim menular'],
		traits: ['Wara’', 'Teliti', 'Tenang']
	},
	{
		slug: 'qatadah-ibn-diama',
		name: "Qatadah bin Di'amah",
		era: '61–118 H / 680–736 M',
		center: 'Basrah',
		role: 'Hafiz, mufasir, dan rawi produktif',
		focus: 'Tafsir, hadis, bahasa',
		teachers: ['Anas bin Malik', 'Hasan al-Basri', "Sa'id bin al-Musayyib"],
		students: ["Syu'bah", 'Hammam bin Yahya', "Sa'id bin Abi Arubah"],
		summary: 'Dikenal hafalan luar biasa; banyak jalur tafsir dan hadis Basrah melewatinya.',
		story:
			"Qatadah buta secara fisik namun tajam hafalannya. Ia menghimpun tafsir dan riwayat dengan daya ingat yang diakui. Generasi Syu'bah dan penulis Basrah banyak mengambil darinya.",
		achievements: ['Hafiz besar Basrah', 'Kontribusi tafsir', 'Guru para kritikus hadis'],
		lessons: ['Hafalan butuh adab dan seleksi', 'Keterbatasan bukan akhir jalan ilmu', 'Tafsir dan hadis saling menguatkan'],
		traits: ['Hafiz', 'Cepat tangkap', 'Produktif']
	},
	{
		slug: 'al-shabi',
		name: "Asy-Sya'bi",
		era: '19–103 H / 640–721 M',
		center: 'Kufah',
		role: 'Ahli riwayat Kufah, bertemu banyak sahabat',
		focus: 'Hadis, qadha, fiqih masyarakat',
		teachers: ['Ali bin Abi Thalib', 'Ibnu Umar', 'Ibnu Abbas', "Abu Musa al-Asy'ari"],
		students: ['Abu Hanifah', 'Ismail bin Abi Khalid', 'Mughirah bin Miqsam'],
		summary: 'Keluasan riwayat dan keterlibatan qadha; mewariskan tradisi ilmu Irak ke generasi sesudahnya.',
		story:
			"Asy-Sya'bi hidup di persimpangan sahabat dan fitnah Irak. Ia banyak mendengar, lalu menjadi rujukan qadha dan riwayat. Atmosfer keilmuan yang ia bantu bentuk bersifat realistis terhadap persoalan masyarakat.",
		achievements: ['Bertemu banyak sahabat (riwayat)', 'Qadhi/faqih sosial', 'Guru tidak langsung tradisi Hanafi'],
		lessons: ['Fiqih lahir dari problem nyata', 'Jangan ceroboh dalam fitnah', 'Keluasan riwayat butuh filter'],
		traits: ['Luas riwayat', 'Cerdas sosial', 'Fasih']
	},
	{
		slug: 'ibrahim-an-nakhai',
		name: "Ibrahim an-Nakha'i",
		era: '±50–96 H / 670–715 M',
		center: 'Kufah',
		role: 'Faqih Kufah, guru generasi Abu Hanifah',
		focus: 'Fiqih, atsar, ra’y terarah',
		teachers: ['Alqamah bin Qais', 'Aswad bin Yazid', "Asy-Sya'bi"],
		students: ['Hammad bin Abi Sulaiman', "Mansur bin al-Mu'tamir"],
		summary: 'Poros fiqih Kufah yang menyambungkan Ibnu Mas’ud ke Abu Hanifah lewat Hammad.',
		story:
			"An-Nakha'i mewarisi sekolah Ibnu Mas’ud lewat Alqamah dan Aswad. Ia ahli memformulasikan persoalan dengan atsar dan nalar fiqih yang disiplin. Lewat Hammad, ilmu ini sampai ke Abu Hanifah.",
		achievements: ['Pewaris fiqih Ibnu Mas’ud', 'Guru Hammad', 'Fondasi pra-Hanafi'],
		lessons: ['Sanad fiqih sama pentingnya dengan sanad hadis', 'Ra’y harus tertib di bawah nash/atsar', 'Sekolah lokal melahirkan mazhab'],
		traits: ['Faqih', 'Cermat', 'Wara’']
	},
	{
		slug: 'alkamah-bin-qais',
		name: "Alqamah bin Qais an-Nakha'i",
		era: 'w. ±62 H',
		center: 'Kufah',
		role: 'Murid senior Ibnu Mas’ud',
		focus: 'Fiqih, qiraah, atsar',
		teachers: ['Abdullah bin Mas’ud', 'Umar', 'Ali'],
		students: ["Ibrahim an-Nakha'i", 'Aswad bin Yazid'],
		summary: 'Penghubung langsung Ibnu Mas’ud ke fuqaha Kufah; fondasi awal sekolah Irak.',
		story:
			'Alqamah menempel pada Ibnu Mas’ud dalam qiraah dan fiqih. Ia menjadi perpanjangan majelis sahabat di Kufah. Tanpa jembatan seperti Alqamah, corak Irak tidak akan sejelas itu tersambung ke generasi tabi’in yunior.',
		achievements: ['Murid inti Ibnu Mas’ud', 'Peletak sekolah Kufah', 'Sanad qiraah/fiqih'],
		lessons: ['Mulazamah guru kunci penguasaan', 'Kota butuh wakil sahabat yang setia', 'Qiraah dan fiqih saling jaga'],
		traits: ['Setia guru', 'Faqih', 'Qari']
	},
	{
		slug: 'aswad-bin-yazid',
		name: 'Al-Aswad bin Yazid',
		era: 'w. ±75 H',
		center: 'Kufah',
		role: 'Faqih dan ahli ibadah Kufah',
		focus: 'Fiqih, ibadah, atsar',
		teachers: ['Ibnu Mas’ud', 'Aisyah', 'Abu Musa'],
		students: ["Ibrahim an-Nakha'i"],
		summary: 'Tokoh zuhud dan fiqih; bersama Alqamah menguatkan warisan Ibnu Mas’ud.',
		story:
			'Al-Aswad dikenal rajin ibadah dan kuat atsar. Bersama Alqamah ia membentuk lingkungan yang melahirkan an-Nakha’i. Kombinasi fiqih dan ubudiyah ini khas Kufah awal.',
		achievements: ['Pilar fiqih Kufah', 'Teladan ibadah', 'Guru an-Nakha’i'],
		lessons: ['Fiqih tanpa ibadah kering', 'Lingkaran seperjuangan menumbuhkan imam', 'Konsistensi amal harian'],
		traits: ['Abid', 'Faqih']
	},
	{
		slug: 'ums-ad-darda',
		name: "Umm ad-Darda' ash-Shughra",
		era: 'w. ±81 H',
		center: 'Syam',
		role: 'Alimah Syam, ahli ibadah dan fiqih',
		focus: 'Ilmu, tazkiyah, fatwa praktis',
		teachers: ["Abu ad-Darda'", 'Aisyah', 'Salman'],
		students: ['Para penuntut ilmu Syam'],
		summary: 'Contoh perempuan alim di generasi tabi’in; berpengaruh di Syam dalam ilmu dan adab.',
		story:
			"Umm ad-Darda' mewakili kealiman perempuan setelah era sahabat. Ia mengajar, beribadah, dan menjadi rujukan. Rantai ilmu Islam diukur dengan takwa dan kompetensi, bukan eksklusivitas gender.",
		achievements: ['Pengajar di Syam', 'Teladan alimah', 'Penjaga adab ilmu'],
		lessons: ['Perempuan alim tiang peradaban', 'Ilmu dan ibadah tidak dipisah', 'Syam butuh guru lokal'],
		traits: ['Alimah', 'Abidah', 'Bijak']
	},
	{
		slug: 'maimun-bin-mihran',
		name: 'Maimun bin Mihran',
		era: 'w. 117 H',
		center: 'Syam',
		role: 'Faqih dan penasihat di wilayah Jazirah/Syam',
		focus: 'Fiqih, siyasah syar’iyyah, wara’',
		teachers: ['Ibnu Umar', 'Ibnu Abbas', 'Abu Hurairah'],
		students: ['Para ulama Jazirah'],
		summary: 'Dikenal berani menasihati penguasa dan menjaga wara’ dalam jabatan.',
		story:
			'Maimun mewakili tabi’in yang masuk ke ruang kebijakan tanpa kehilangan wara’. Ia menekankan hisab dan keadilan. Model ulama dekat penguasa namun tidak lebur menjadi pelajaran abadi.',
		achievements: ['Nasihat penguasa', 'Faqih wilayah', 'Teladan wara’ jabatan'],
		lessons: ['Jabatan ujian, bukan hadiah', 'Nasihat harus ikhlas', 'Ilmu melindungi dari basah hati'],
		traits: ['Wara’', 'Tegas', 'Faqih']
	},
	{
		slug: 'raja-bin-haiwah',
		name: "Raja' bin Haiwah",
		era: 'w. 112 H',
		center: 'Syam',
		role: 'Ulama Syam, penasihat Umar bin Abdul Aziz',
		focus: 'Fiqih, siyasah, islah',
		teachers: ["Abu ad-Darda' (jalur)", 'Para sahabat/ulama Syam'],
		students: ['Lingkaran Umar bin Abdul Aziz'],
		summary: 'Berperan dalam islah era Umar bin Abdul Aziz; ulama yang mengarahkan kekuasaan ke adab kenabian.',
		story:
			"Raja' bin Haiwah dikenal sebagai orang kepercayaan dalam reformasi Umar bin Abdul Aziz. Ia menunjukkan bahwa tabi’in tidak hanya di mihrab, tetapi juga menata ulang keadilan publik saat ada peluang islah.",
		achievements: ['Kontribusi islah Umar bin Abdul Aziz', 'Ulama Syam terhormat'],
		lessons: ['Islah butuh ilmu, akses, dan niat', 'Dekat penguasa untuk mengubah, bukan untuk dunia', 'Momentum adil harus dimanfaatkan'],
		traits: ['Bijak', 'Islah', 'Amanah']
	}
];

export const getTabiinBySlug = (slug: string) => tabiinFigures.find((f) => f.slug === slug);
export const tabiinCenters = Array.from(new Set(tabiinFigures.map((f) => f.center)));
