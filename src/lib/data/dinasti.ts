export type IslamicDynasty = {
	order: number;
	slug: string;
	name: string;
	periodCE: string;
	periodAH: string;
	capital: string;
	regions: string;
	type: string;
	summary: string;
	legacy: string;
	startYearCE: number;
};

export const islamicDynasties: IslamicDynasty[] = [
	{
		order: 1,
		slug: 'umayyah-damaskus',
		name: 'Bani Umayyah (Damaskus)',
		periodCE: '661-750 M',
		periodAH: '41-132 H',
		capital: 'Damaskus',
		regions: 'Syam, Irak, Mesir, Afrika Utara, Andalus, Persia hingga Asia Tengah',
		type: 'Kekhalifahan',
		summary:
			'Dinasti besar pertama pasca-Khulafaur Rasyidin yang menata pemerintahan imperium, administrasi Arab, dan ekspansi lintas benua.',
		legacy:
			'Memindahkan pusat politik ke Damaskus, memperkuat birokrasi, dan mewariskan fondasi arsitektur Islam awal seperti Kubah Shakhrah serta masjid-masjid besar.',
		startYearCE: 661
	},
	{
		order: 2,
		slug: 'abbasiyah',
		name: 'Bani Abbasiyah',
		periodCE: '750-1258 M',
		periodAH: '132-656 H',
		capital: 'Baghdad',
		regions: 'Irak, Persia, Jazirah, dan jaringan pengaruh luas Sunni',
		type: 'Kekhalifahan',
		summary:
			'Menggeser pusat dunia Islam ke Irak dan melahirkan era intelektual besar di Baghdad, Basrah, Kufah, dan kota-kota ilmu lain.',
		legacy:
			'Menjadi payung politik dan simbolik bagi perkembangan hadis, fiqih mazhab, ilmu bahasa, filsafat, astronomi, serta jejaring madrasah klasik.',
		startYearCE: 750
	},
	{
		order: 3,
		slug: 'umayyah-andalus',
		name: 'Bani Umayyah di Andalus',
		periodCE: '756-1031 M',
		periodAH: '138-422 H',
		capital: 'Cordoba',
		regions: 'Andalus dan bagian Semenanjung Iberia',
		type: 'Emirat lalu Kekhalifahan',
		summary:
			'Kelanjutan politik Umayyah di Barat Islam yang menjadikan Cordoba pusat ilmu, seni, urbanisme, dan diplomasi dunia Mediterania.',
		legacy:
			'Masjid Cordoba, perpustakaan besar, dan tradisi ilmu Andalus menjadi warisan utama yang berpengaruh ke Eropa dan Maghrib.',
		startYearCE: 756
	},
	{
		order: 4,
		slug: 'idrisiyah',
		name: 'Dinasti Idrisiyah',
		periodCE: '789-974 M',
		periodAH: '172-363 H',
		capital: 'Walili lalu Fes',
		regions: 'Maghrib al-Aqsa / Maroko',
		type: 'Dinasti regional',
		summary:
			'Salah satu dinasti Muslim awal di Maghrib yang membantu Islamisasi wilayah Maroko dan pertumbuhan kota Fes.',
		legacy:
			'Berperan dalam pembentukan pusat urban dan keilmuan Fes yang kemudian menjadi simpul penting di Afrika Utara.',
		startYearCE: 789
	},
	{
		order: 5,
		slug: 'aghlabiyah',
		name: 'Dinasti Aghlabiyah',
		periodCE: '800-909 M',
		periodAH: '184-296 H',
		capital: 'Qayrawan',
		regions: 'Ifriqiyah, Sicilia, Afrika Utara tengah',
		type: 'Dinasti regional di bawah legitimasi Abbasiyah',
		summary:
			'Menguatkan Islam di Afrika Utara tengah dan membuka jalur ekspansi ke Sicilia sambil tetap mengakui Abbasiyah secara nominal.',
		legacy:
			'Qayrawan berkembang sebagai pusat ilmu, arsitektur, dan koneksi dagang Mediterania.',
		startYearCE: 800
	},
	{
		order: 6,
		slug: 'tuluniyah',
		name: 'Dinasti Tuluniyah',
		periodCE: '868-905 M',
		periodAH: '254-292 H',
		capital: "al-Qata'i",
		regions: 'Mesir dan Syam',
		type: 'Dinasti regional',
		summary:
			'Salah satu dinasti semi-independen paling awal dari orbit Abbasiyah yang menjadikan Mesir basis militer dan ekonomi kuat.',
		legacy:
			'Masjid Ibn Tulun dan pembangunan administrasi Mesir menjadi warisan paling menonjol dari fase ini.',
		startYearCE: 868
	},
	{
		order: 7,
		slug: 'fatimiyah',
		name: 'Dinasti Fatimiyah',
		periodCE: '909-1171 M',
		periodAH: '297-567 H',
		capital: 'al-Mahdiyyah lalu Kairo',
		regions: 'Afrika Utara, Mesir, Hijaz, dan Syam pada periode tertentu',
		type: 'Kekhalifahan Ismailiyah',
		summary:
			'Saingan besar Abbasiyah yang membangun kekhalifahan tersendiri dan mendirikan Kairo sebagai kota kekuasaan baru.',
		legacy:
			'Pendirian al-Azhar, pembangunan Kairo, dan jaringan dagang Laut Tengah - Laut Merah menjadi peninggalan utamanya.',
		startYearCE: 909
	},
	{
		order: 8,
		slug: 'ikhshidiyah',
		name: 'Dinasti Ikhshidiyah',
		periodCE: '935-969 M',
		periodAH: '323-358 H',
		capital: 'Fustat',
		regions: 'Mesir, Palestina, dan Syam selatan',
		type: 'Dinasti regional',
		summary:
			'Meneruskan pola Mesir semi-independen di bawah bayang-bayang Abbasiyah sebelum akhirnya digantikan Fatimiyah.',
		legacy:
			'Menjaga Mesir sebagai wilayah strategis dengan struktur birokrasi dan militer yang tetap kuat.',
		startYearCE: 935
	},
	{
		order: 9,
		slug: 'ghaznawiyah',
		name: 'Dinasti Ghaznawiyah',
		periodCE: '977-1186 M',
		periodAH: '366-582 H',
		capital: 'Ghazni',
		regions: 'Khurasan timur, Afghanistan, dan India utara',
		type: 'Kesultanan',
		summary:
			'Dinasti Turko-Persia yang memperluas pengaruh Islam ke anak benua India dan membangun patronase sastra Persia.',
		legacy:
			'Menjadi penghubung penting antara dunia Iran, Asia Tengah, dan India dalam bidang militer, sastra, dan administrasi.',
		startYearCE: 977
	},
	{
		order: 10,
		slug: 'seljuk-agung',
		name: 'Dinasti Seljuk Agung',
		periodCE: '1037-1194 M',
		periodAH: '429-590 H',
		capital: 'Nishapur, Rayy, lalu Isfahan',
		regions: 'Persia, Irak, Anatolia, Syam pada berbagai fase',
		type: 'Kesultanan Sunni',
		summary:
			'Seljuk menghidupkan kembali kekuatan politik Sunni dan melindungi orbit Abbasiyah lewat sistem sultanat yang kuat.',
		legacy:
			'Nizam al-Mulk, madrasah Nizamiyah, dan konsolidasi politik Sunni menjadi ciri penting eranya.',
		startYearCE: 1037
	},
	{
		order: 11,
		slug: 'murabithun',
		name: 'Dinasti Murabithun (Almoravid)',
		periodCE: '1040-1147 M',
		periodAH: '432-541 H',
		capital: 'Marrakesh',
		regions: 'Maghrib dan Andalus barat',
		type: 'Dinasti regional',
		summary:
			'Menghubungkan Sahara, Maghrib, dan Andalus dalam satu sistem politik yang memperkuat fiqih Maliki.',
		legacy:
			'Menjaga Andalus dari tekanan kerajaan Kristen dan mengokohkan Marrakesh sebagai pusat pemerintahan baru.',
		startYearCE: 1040
	},
	{
		order: 12,
		slug: 'muwahhidun',
		name: 'Dinasti Muwahhidun (Almohad)',
		periodCE: '1121-1269 M',
		periodAH: '515-667 H',
		capital: 'Marrakesh',
		regions: 'Maghrib dan Andalus',
		type: 'Kekuasaan regional',
		summary:
			'Menggantikan Murabithun dan menguasai ruang Maghrib-Andalus dengan proyek reformasi ideologis dan administrasi baru.',
		legacy:
			'Warisan arsitektur dan urbanisme kuat tampak di Marrakesh, Rabat, dan Sevilla.',
		startYearCE: 1121
	},
	{
		order: 13,
		slug: 'zankiyah',
		name: 'Dinasti Zankiyah',
		periodCE: '1127-1250 M',
		periodAH: '521-648 H',
		capital: 'Mosul dan Aleppo',
		regions: 'Jazirah, Irak utara, Syam utara',
		type: 'Dinasti regional',
		summary:
			'Zankiyah menjadi pendahulu penting bagi konsolidasi militer Sunni di Syam dan perjuangan melawan Perang Salib.',
		legacy:
			'Tokoh seperti Imad al-Din Zangi dan Nur al-Din Mahmud membuka jalan bagi kebangkitan Ayyubiyah.',
		startYearCE: 1127
	},
	{
		order: 14,
		slug: 'ayyubiyah',
		name: 'Dinasti Ayyubiyah',
		periodCE: '1171-1260 M',
		periodAH: '567-658 H',
		capital: 'Kairo dan Damaskus',
		regions: 'Mesir, Syam, Hijaz, Yaman pada periode tertentu',
		type: 'Kesultanan Sunni',
		summary:
			'Dinasti Salahuddin yang mengakhiri Fatimiyah dan menyatukan Mesir-Syam untuk menghadapi Perang Salib.',
		legacy:
			'Pemulihan orientasi Sunni di Mesir, kemenangan Hattin, dan pembebasan al-Quds menjadi simbol terbesarnya.',
		startYearCE: 1171
	},
	{
		order: 15,
		slug: 'ghuriyah',
		name: 'Dinasti Ghuriyah',
		periodCE: '1148-1215 M',
		periodAH: '543-612 H',
		capital: 'Firozkoh dan Ghazni',
		regions: 'Afghanistan, Khurasan timur, India utara',
		type: 'Kesultanan',
		summary:
			'Dinasti pegunungan Ghur yang melanjutkan dorongan politik Islam ke India utara setelah fase Ghaznawiyah.',
		legacy:
			'Ekspansinya membuka jalan bagi kesultanan-kesultanan besar di Delhi.',
		startYearCE: 1148
	},
	{
		order: 16,
		slug: 'kesultanan-delhi',
		name: 'Kesultanan Delhi',
		periodCE: '1206-1526 M',
		periodAH: '602-932 H',
		capital: 'Delhi',
		regions: 'India utara dan tengah',
		type: 'Kesultanan',
		summary:
			'Rangkaian dinasti Muslim di Delhi yang menjadi fondasi pemerintahan Islam besar di anak benua India.',
		legacy:
			'Administrasi, arsitektur, dan proses islamisasi kawasan India utara berkembang pesat pada masa ini.',
		startYearCE: 1206
	},
	{
		order: 17,
		slug: 'mamluk',
		name: 'Dinasti Mamluk',
		periodCE: '1250-1517 M',
		periodAH: '648-923 H',
		capital: 'Kairo',
		regions: 'Mesir, Syam, Hijaz',
		type: 'Kesultanan',
		summary:
			'Mamluk mempertahankan pusat dunia Islam barat setelah runtuhnya Baghdad dan menghadapi Mongol serta sisa-sisa Perang Salib.',
		legacy:
			'Kairo menjadi pusat ilmu, wakaf, arsitektur, dan jaringan ulama besar pada era Mamluk.',
		startYearCE: 1250
	},
	{
		order: 18,
		slug: 'utsmaniyah',
		name: 'Dinasti Utsmaniyah',
		periodCE: '1299-1922 M',
		periodAH: '699-1342 H',
		capital: 'Bursa, Edirne, lalu Istanbul',
		regions: 'Anatolia, Balkan, Syam, Mesir, Hijaz, Afrika Utara bagian tertentu',
		type: 'Kesultanan lalu Kekhalifahan',
		summary:
			'Kekuasaan Muslim paling panjang dan luas pada era modern awal yang menghubungkan Anatolia, Arab, dan Eropa tenggara.',
		legacy:
			'Menjadi payung politik banyak wilayah Muslim, mengelola dua kota suci, serta mewariskan tradisi hukum, arsitektur, dan administrasi yang besar.',
		startYearCE: 1299
	},
	{
		order: 19,
		slug: 'safawiyah',
		name: 'Dinasti Safawiyah',
		periodCE: '1501-1736 M',
		periodAH: '907-1148 H',
		capital: 'Tabriz lalu Isfahan',
		regions: 'Iran dan kawasan sekitarnya',
		type: 'Kekuasaan regional besar',
		summary:
			'Safawiyah membentuk Iran awal modern dan menjadi salah satu poros politik utama dunia Islam pada era senjata api.',
		legacy:
			'Isfahan berkembang menjadi pusat seni, arsitektur, dan identitas politik Iran baru.',
		startYearCE: 1501
	},
	{
		order: 20,
		slug: 'mughal',
		name: 'Dinasti Mughal',
		periodCE: '1526-1857 M',
		periodAH: '932-1274 H',
		capital: 'Agra, Fatehpur Sikri, lalu Delhi',
		regions: 'India utara dan sebagian besar anak benua India',
		type: 'Kekaisaran',
		summary:
			'Puncak kekuasaan Muslim di India pada era awal modern dengan ekonomi besar, kota megah, dan patronase budaya luas.',
		legacy:
			'Warisan arsitektur, administrasi, dan urbanisme Mughal bertahan kuat dalam sejarah Asia Selatan hingga kini.',
		startYearCE: 1526
	}
];
