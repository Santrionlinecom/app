export type NabiRecord = {
	order: number;
	slug: string;
	name: string;
	father?: string;
	children?: string;
	spouse?: string;
	siblings?: string;
	ruler?: string;
	tribe?: string;
	age?: string;
	era?: string;
	explainer?: string;
	summary: string;
	keyPoints: string[];
	dalil: string[];
	titles?: string[];
	ululAzmi?: boolean;
	story?: string;
	lessons?: string[];
};

export const nabiList: NabiRecord[] = [
	{
		order: 1,
		slug: 'adam',
		name: 'Nabi Adam AS',
		father: 'Diciptakan langsung oleh Allah',
		children: 'Habil, Qabil, Syits, dan keturunan awal manusia',
		spouse: 'Siti Hawa',
		siblings: '—',
		ruler: '—',
		tribe: '—',
		age: '±930 tahun',
		era: 'Pra-sejarah manusia',
		explainer: 'Manusia pertama dan nabi pertama, menjadi bapak umat manusia.',
		summary: 'Manusia pertama, penerima wahyu awal, bertaubat setelah tergelincir.',
		titles: [
		'Abul Basyar',
		'Nabi pertama'
	],
		ululAzmi: false,
		story: 'Nabi Adam AS adalah manusia pertama yang diciptakan Allah sebagai khalifah di bumi. Allah mengajarkan nama-nama kepadanya dan memerintahkan para malaikat sujud penghormatan. Setelah diuji dengan larangan mendekati pohon terlarang, Adam dan Hawa tergelincir, lalu bertaubat dengan doa yang diajarkan Allah. Mereka diturunkan ke bumi untuk memulai kehidupan manusia di atas tauhid, taubat, dan tanggung jawab khilafah.',
		keyPoints: [
		'Diciptakan sebagai khalifah di bumi dan diajarkan nama-nama.',
		'Diuji dengan larangan pohon, kemudian bertaubat.',
		'Menjadi bapak manusia dan penerus tauhid pertama.',
		'Taubat adalah pintu kembali kepada Allah',
		'Ilmu (diajari nama-nama) mendahului tugas di bumi',
		'Manusia diuji, tapi dimuliakan dengan kemampuan bertaubat'
	],
		lessons: [
		'Taubat adalah pintu kembali kepada Allah',
		'Ilmu (diajari nama-nama) mendahului tugas di bumi',
		'Manusia diuji, tapi dimuliakan dengan kemampuan bertaubat',
		'Khilafah di bumi adalah amanah, bukan kesewenangan'
	],
		dalil: [
		'QS Al-Baqarah 2:30-39'
	]
	},
	{
		order: 2,
		slug: 'idris',
		name: 'Nabi Idris AS',
		father: 'Yard bin Mahlail',
		children: 'Tidak disebut rinci',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: '—',
		tribe: 'Keturunan Nabi Syits',
		age: '±865 tahun',
		era: 'Sekitar milenium ke-4 SM',
		explainer: 'Nabi yang tekun ibadah, menulis, dan diangkat derajatnya.',
		summary: 'Dikenal tekun ibadah, menulis, dan diangkat derajatnya.',
		titles: [
		'Shiddiq',
		'Nabi yang diangkat derajatnya'
	],
		ululAzmi: false,
		story: 'Nabi Idris AS disebut dalam Al-Qur’an sebagai orang yang shiddiq dan nabi. Riwayat tafsir banyak mengaitkannya dengan ketekunan ibadah, kejujuran, dan kemuliaan derajat. Kisahnya mengajarkan bahwa ketinggian martabat di sisi Allah terkait dengan sidik, amal saleh, dan keteguhan di jalan tauhid, bukan sekadar status dunia.',
		keyPoints: [
		'Dikenal sebagai shiddiq',
		'Diangkat ke martabat tinggi',
		'Jujur (sidik) adalah fondasi nubuwwah dan adab',
		'Ibadah yang tekun mengangkat derajat',
		'Ilmu dan amal saling menguatkan'
	],
		lessons: [
		'Jujur (sidik) adalah fondasi nubuwwah dan adab',
		'Ibadah yang tekun mengangkat derajat',
		'Ilmu dan amal saling menguatkan'
	],
		dalil: [
		'QS Maryam 19:56-57'
	]
	},
	{
		order: 3,
		slug: 'nuh',
		name: 'Nabi Nuh AS',
		father: 'Lamik bin Mutawasylikh',
		children: 'Sam, Ham, Yafits',
		spouse: 'Wahilah (beriman), satu istri lain ingkar',
		siblings: '—',
		ruler: 'Pemuka kaum Nuh',
		tribe: 'Kaum Nuh',
		age: '±950 tahun berdakwah',
		era: 'Sekitar 3000 SM',
		explainer: 'Ulul azmi yang berdakwah sangat lama menghadapi penolakan.',
		summary: 'Berdakwah berabad-abad, membangun bahtera, selamat dari banjir.',
		titles: [
		'Ulul Azmi',
		'Syaikhul Anbiya'
	],
		ululAzmi: true,
		story: 'Nabi Nuh AS berdakwah sangat lama kepada kaumnya yang tenggelam dalam kesyirikan. Dengan sabar ia menyeru siang-malam, secara terang maupun rahasia. Ketika penolakan memuncak, Allah memerintahkannya membuat bahtera. Banjir besar menenggelamkan orang-orang yang ingkar, sementara Nuh dan pengikut beriman diselamatkan. Kisah Nuh menjadi pelajaran tentang keteguhan dakwah dan akibat menolak peringatan.',
		keyPoints: [
		'Dakwah sabar kepada kaum ingkar',
		'Mukjizat bahtera saat banjir besar',
		'Dakwah butuh sabar panjang, bukan hasil instan',
		'Tidak semua kerabat otomatis selamat tanpa iman',
		'Mukjizat datang setelah ikhtiar dan ketaatan',
		'Kaum yang sombong dibinasakan sebagai ibrah'
	],
		lessons: [
		'Dakwah butuh sabar panjang, bukan hasil instan',
		'Tidak semua kerabat otomatis selamat tanpa iman',
		'Mukjizat datang setelah ikhtiar dan ketaatan',
		'Kaum yang sombong dibinasakan sebagai ibrah'
	],
		dalil: [
		'QS Hud 11:25-49'
	]
	},
	{
		order: 4,
		slug: 'hud',
		name: 'Nabi Hud AS',
		father: 'Shalih bin Arfakhsyadz',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Raja-raja kaum ‘Ad (riwayat Syaddad)',
		tribe: 'Kaum ‘Ad',
		age: 'Tidak disebut',
		era: 'Sekitar 2400–2300 SM',
		explainer: 'Dakwah tauhid kepada kaum ‘Ad yang sombong dan kuat.',
		summary: 'Menyeru kaum ‘Ad untuk meninggalkan kesombongan dan kembali ke tauhid.',
		titles: [
		'Rasul kaum ‘Ad'
	],
		ululAzmi: false,
		story: 'Nabi Hud AS diutus kepada kaum ‘Ad yang kuat secara fisik dan bangga dengan bangunan serta kekuatan mereka. Hud menyeru agar menyembah Allah semata dan meninggalkan kesombongan. Mereka mendustakan, sehingga Allah menimpakan azab angin yang dahsyat. Kisah ini menegaskan bahwa kekuatan material tanpa tauhid tidak menyelamatkan.',
		keyPoints: [
		'Kaum ‘Ad ditimpa angin kencang karena ingkar',
		'Hud menegaskan tawakal kepada Allah',
		'Kekuatan dan peradaban tanpa iman bisa menjadi ujian',
		'Sombong adalah bibit kehancuran',
		'Tawakal kepada Allah lebih utama daripada andalkan kekuatan'
	],
		lessons: [
		'Kekuatan dan peradaban tanpa iman bisa menjadi ujian',
		'Sombong adalah bibit kehancuran',
		'Tawakal kepada Allah lebih utama daripada andalkan kekuatan'
	],
		dalil: [
		'QS Hud 11:50-60'
	]
	},
	{
		order: 5,
		slug: 'saleh',
		name: 'Nabi Shaleh AS',
		father: 'Ubaid bin Asif',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Pemuka Tsamud',
		tribe: 'Kaum Tsamud',
		age: 'Tidak disebut',
		era: 'Sekitar 2200–2000 SM',
		explainer: 'Menghadapi kaum Tsamud dengan mukjizat unta betina.',
		summary: 'Menghadapi kaum Tsamud, mukjizat unta betina, kaum dibinasakan karena melanggarnya.',
		titles: [
		'Rasul kaum Tsamud'
	],
		ululAzmi: false,
		story: 'Nabi Shaleh AS diutus kepada kaum Tsamud. Sebagai tanda, Allah mengeluarkan unta betina sebagai ujian. Kaum yang sombong menyembelih unta itu dan melanggar peringatan, sehingga azab menimpa mereka. Shaleh dan orang-orang beriman diselamatkan. Kisah ini menekankan penghormatan terhadap tanda Allah dan bahaya melampaui batas.',
		keyPoints: [
		'Mukjizat unta betina sebagai ujian',
		'Kaum membangkang dan dibinasakan',
		'Mukjizat adalah ujian, bukan hiburan',
		'Melanggar batas Allah mendatangkan celaka',
		'Iman melindungi dari azab yang menimpa kaum pendusta'
	],
		lessons: [
		'Mukjizat adalah ujian, bukan hiburan',
		'Melanggar batas Allah mendatangkan celaka',
		'Iman melindungi dari azab yang menimpa kaum pendusta'
	],
		dalil: [
		'QS Asy-Syuara 26:141-159'
	]
	},
	{
		order: 6,
		slug: 'ibrahim',
		name: 'Nabi Ibrahim AS',
		father: 'Azar (Tarih)',
		children: 'Ismail, Ishaq',
		spouse: 'Sarah, Hajar',
		siblings: 'Haran, Nahor (riwayat)',
		ruler: 'Nimrod (riwayat) saat awal dakwah',
		tribe: 'Kaum penyembah berhala Babilonia',
		age: '±175 tahun',
		era: 'Sekitar 2000–1800 SM',
		explainer: 'Khalilullah, bapak para nabi, pembawa risalah tauhid luas.',
		summary: 'Khalilullah, penghancur berhala, diuji api, membangun Ka’bah.',
		titles: [
		'Khalilullah',
		'Abul Anbiya',
		'Ulul Azmi'
	],
		ululAzmi: true,
		story: 'Nabi Ibrahim AS dikenal sebagai kekasih Allah. Ia mendakwahi ayah dan kaumnya yang menyembah berhala, menghancurkan berhala sebagai hujjah, lalu dilempar ke api namun diselamatkan Allah. Ia diuji dengan hijrah, pengorbanan, dan perintah menyembelih putranya. Bersama Ismail, ia membangun Ka’bah. Dari garisnya lahir banyak nabi, dan millah Ibrahim menjadi rujukan tauhid yang lurus.',
		keyPoints: [
		'Dialog tauhid dengan ayah dan kaumnya',
		'Diuji dengan api lalu selamat',
		'Membangun Ka’bah bersama Ismail',
		'Tauhid lebih utama daripada tradisi nenek moyang yang batil',
		'Ujian besar mengangkat derajat orang beriman',
		'Pengorbanan karena Allah membuahkan kebaikan luas'
	],
		lessons: [
		'Tauhid lebih utama daripada tradisi nenek moyang yang batil',
		'Ujian besar mengangkat derajat orang beriman',
		'Pengorbanan karena Allah membuahkan kebaikan luas',
		'Doa dan tawakkal adalah senjata da’i'
	],
		dalil: [
		'QS Al-Anbiya 21:51-71',
		'QS Al-Baqarah 2:124-127'
	]
	},
	{
		order: 7,
		slug: 'luth',
		name: 'Nabi Luth AS',
		father: 'Haran (saudara Ibrahim)',
		children: 'Dua putri (riwayat)',
		spouse: 'Seorang istri yang ingkar',
		siblings: 'Keponakan Ibrahim (sepupu/keponakan)',
		ruler: 'Pemuka Sodom',
		tribe: 'Kaum Sodom',
		age: 'Tidak disebut',
		era: 'Sekitar 1900–1800 SM',
		explainer: 'Menyeru kesucian di tengah kaum yang menyimpang.',
		summary: 'Menyeru kaum Sodom pada kesucian; mereka ingkar dan dibinasakan.',
		titles: [
		'Rasul kaum Sodom'
	],
		ululAzmi: false,
		story: 'Nabi Luth AS menyeru kaumnya agar meninggalkan perbuatan keji dan kembali kepada kesucian. Mereka menolak dan mengancam. Allah mengutus malaikat membawa kabar azab; Luth dan keluarganya yang beriman diselamatkan, sementara kaum yang ingkar dibinasakan. Kisahnya mengajarkan penjagaan kehormatan dan keberanian menegur kemungkaran.',
		keyPoints: [
		'Melarang perilaku keji kaumnya',
		'Kaum Sodom dihancurkan sebagai pelajaran',
		'Menjaga kehormatan termasuk inti dakwah nabi',
		'Lingkungan rusak menuntut ketegasan dengan hikmah',
		'Keselamatan terkait iman dan ketaatan, bukan sekadar nasab'
	],
		lessons: [
		'Menjaga kehormatan termasuk inti dakwah nabi',
		'Lingkungan rusak menuntut ketegasan dengan hikmah',
		'Keselamatan terkait iman dan ketaatan, bukan sekadar nasab'
	],
		dalil: [
		'QS Hud 11:77-83'
	]
	},
	{
		order: 8,
		slug: 'ismail',
		name: 'Nabi Ismail AS',
		father: 'Nabi Ibrahim AS',
		children: 'Nabit dan keturunan Arab',
		spouse: 'Perempuan Jurhum (riwayat putri Mudad)',
		siblings: 'Ishaq',
		ruler: 'Kabilah Jurhum di Mekah',
		tribe: 'Arab Jurhum',
		age: '±137 tahun (riwayat)',
		era: 'Sekitar 1900–1750 SM',
		explainer: 'Teladan patuh dan sabar, cikal Rasulullah ﷺ.',
		summary: 'Putra Ibrahim, teladan sabar dan patuh, menjadi cikal kabilah Arab.',
		titles: [
		'Dzabihullah (dalam riwayat)',
		'Pembangun Ka’bah bersama ayahnya'
	],
		ululAzmi: false,
		story: 'Nabi Ismail AS putra Ibrahim yang tumbuh di lembah Bakkah. Ia teladan ketaatan saat ujian penyembelihan: siap menyerahkan diri karena Allah. Bersama ayahnya ia meninggikan fondasi Ka’bah. Dari keturunannya muncul bangsa Arab dan akhirnya Rasulullah ﷺ. Kisah Ismail adalah pelajaran patuh, sabar, dan doa orang tua yang mustajab.',
		keyPoints: [
		'Siap disembelih sebagai ujian ketaatan',
		'Membantu membangun Ka’bah',
		'Ketaatan anak saleh adalah warisan terbesar',
		'Ujian ketaatan membentuk generasi kuat',
		'Ka’bah dibangun di atas tauhid dan pengorbanan'
	],
		lessons: [
		'Ketaatan anak saleh adalah warisan terbesar',
		'Ujian ketaatan membentuk generasi kuat',
		'Ka’bah dibangun di atas tauhid dan pengorbanan'
	],
		dalil: [
		'QS As-Saffat 37:102-107',
		'QS Al-Baqarah 2:125-127'
	]
	},
	{
		order: 9,
		slug: 'ishaq',
		name: 'Nabi Ishaq AS',
		father: 'Nabi Ibrahim AS',
		children: 'Yaqub',
		spouse: 'Rifqah (Rebecca)',
		siblings: 'Ismail',
		ruler: 'Penguasa Syam kuno',
		tribe: 'Bani Israel awal',
		age: '±180 tahun (riwayat)',
		era: 'Sekitar 1900–1700 SM',
		explainer: 'Penerus tauhid di garis keturunan Ibrahim.',
		summary: 'Putra Ibrahim, meneruskan dakwah tauhid di Syam.',
		titles: [
		'Putra Ibrahim',
		'Penerus garis nubuwwah Syam'
	],
		ululAzmi: false,
		story: 'Nabi Ishaq AS adalah kabar gembira bagi Ibrahim dan Sarah di usia lanjut. Ia meneruskan dakwah tauhid di wilayah Syam. Dari Ishaq lahir Yaqub (Israil), dan dari situ garis Bani Israel yang di dalamnya banyak nabi. Kisahnya mengajarkan bahwa karunia Allah datang sesuai kehendak-Nya, dan keluarga nabi dijaga untuk risalah.',
		keyPoints: [
		'Dianugerahi sebagai kabar gembira',
		'Menjaga garis tauhid keluarga Ibrahim',
		'Karunia anak adalah amanah dakwah',
		'Garis nubuwwah dijaga dengan tauhid',
		'Kabar gembira Allah tidak terikat ukuran manusia'
	],
		lessons: [
		'Karunia anak adalah amanah dakwah',
		'Garis nubuwwah dijaga dengan tauhid',
		'Kabar gembira Allah tidak terikat ukuran manusia'
	],
		dalil: [
		'QS Hud 11:71-73'
	]
	},
	{
		order: 10,
		slug: 'yaqub',
		name: 'Nabi Yaqub AS',
		father: 'Nabi Ishaq AS',
		children: '12 putra (Bani Israel), termasuk Yusuf',
		spouse: 'Riwayat menyebut Lea dan Rahel',
		siblings: 'Esau (Ish); saudara lain riwayat',
		ruler: 'Pemuka Syam/Mesir',
		tribe: 'Bani Israel',
		age: '±147 tahun (riwayat)',
		era: 'Sekitar 1800–1600 SM',
		explainer: 'Bergelar Israil, ayah para kabilah Bani Israel.',
		summary: 'Bergelar Israil, ayah 12 kabilah, sabar menghadapi ujian kehilangan Yusuf.',
		titles: [
		'Israil',
		'Ayah 12 kabilah'
	],
		ululAzmi: false,
		story: 'Nabi Yaqub AS, bergelar Israil, adalah ayah para kabilah Bani Israel. Ia diuji dengan kehilangan Yusuf yang sangat dicintainya, namun tetap bersabar dan berbaik sangka kepada Allah. Nasihatnya kepada anak-anak menekankan tauhid hingga akhir hayat. Kisahnya tentang sabar orang tua, doa, dan menjaga keluarga di atas iman.',
		keyPoints: [
		'Menasihati anak-anak tentang tauhid',
		'Sabar dan tawakal menanti Yusuf',
		'Sabar orang tua adalah ibadah besar',
		'Jangan putus asa dari rahmat Allah',
		'Nasihat tauhid harus diwariskan ke anak cucu'
	],
		lessons: [
		'Sabar orang tua adalah ibadah besar',
		'Jangan putus asa dari rahmat Allah',
		'Nasihat tauhid harus diwariskan ke anak cucu'
	],
		dalil: [
		'QS Yusuf 12:83-87'
	]
	},
	{
		order: 11,
		slug: 'yusuf',
		name: 'Nabi Yusuf AS',
		father: 'Nabi Yaqub AS',
		children: 'Efraim, Manasye (riwayat)',
		spouse: 'Asiyah/Zulaikha (riwayat setelah tobat)',
		siblings: '11 saudara Bani Yaqub',
		ruler: 'Raja Mesir (Al-Aziz dan raja berikutnya)',
		tribe: 'Bani Israel di Mesir',
		age: '±110 tahun (riwayat)',
		era: 'Sekitar 1700–1600 SM',
		explainer: 'Kisah ketakwaan, kesabaran, dan kepemimpinan di Mesir.',
		summary: 'Diuji dengan hasad saudara, penjara, lalu memimpin Mesir dengan hikmah.',
		titles: [
		'Shiddiq',
		'Ahli takwil mimpi'
	],
		ululAzmi: false,
		story: 'Nabi Yusuf AS diuji hasad saudara, sumur, perbudakan, godaan, dan penjara. Ia memilih penjara daripada maksiat, lalu Allah angkat derajatnya menjadi pengelola Mesir. Dengan hikmah ia menafsirkan mimpi raja dan menyelamatkan negeri dari paceklik, lalu memaafkan saudara-saudaranya. Surah Yusuf disebut ahsanul qasas — kisah terbaik tentang sabar, kehormatan, dan maaf.',
		keyPoints: [
		'Menolak godaan, memilih penjara daripada maksiat',
		'Menafsirkan mimpi dan menyelamatkan Mesir dari paceklik',
		'Jagalah kehormatan meski sendirian',
		'Ujian bisa menjadi jalan kemuliaan',
		'Ilmu dan amanah mengangkat derajat',
		'Maaf orang beriman lebih mulia daripada balas dendam'
	],
		lessons: [
		'Jagalah kehormatan meski sendirian',
		'Ujian bisa menjadi jalan kemuliaan',
		'Ilmu dan amanah mengangkat derajat',
		'Maaf orang beriman lebih mulia daripada balas dendam'
	],
		dalil: [
		'QS Yusuf 12:23-57'
	]
	},
	{
		order: 12,
		slug: 'ayyub',
		name: 'Nabi Ayyub AS',
		father: 'Mush bin Razah',
		children: 'Riwayat menyebut 14 anak',
		spouse: 'Rahmah binti Afraim (keturunan Yusuf)',
		siblings: 'Riwayat: Zulkifli (tidak pasti)',
		ruler: 'Raja Basan (riwayat)',
		tribe: 'Keturunan Ishaq',
		age: '±93 tahun (riwayat)',
		era: 'Sekitar 1500–1400 SM',
		explainer: 'Teladan sabar dan syukur dalam ujian berat.',
		summary: 'Teladan kesabaran dalam sakit dan kehilangan, tetap bersyukur.',
		titles: [
		'Nabi sabar'
	],
		ululAzmi: false,
		story: 'Nabi Ayyub AS diuji dengan penyakit, kehilangan harta, dan ujian keluarga, namun lidahnya tetap penuh zikir dan doa. Ia tidak mengeluh dengan keluhan yang mencela takdir. Allah lalu mengabulkan doanya dan memulihkan keadaannya. Ayyub menjadi simbol sabar yang aktif: tetap berdoa, tetap berharap, tetap beradab kepada Allah.',
		keyPoints: [
		'Bersabar atas penyakit dan kehilangan harta',
		'Allah memulihkan kesehatan dan keluarganya',
		'Sabar bukan pasrah tanpa doa',
		'Ujian harta dan kesehatan menguji hakikat syukur',
		'Doa orang tertimpa musibah sangat dekat dikabulkan'
	],
		lessons: [
		'Sabar bukan pasrah tanpa doa',
		'Ujian harta dan kesehatan menguji hakikat syukur',
		'Doa orang tertimpa musibah sangat dekat dikabulkan'
	],
		dalil: [
		'QS Al-Anbiya 21:83-84'
	]
	},
	{
		order: 13,
		slug: 'syuaib',
		name: 'Nabi Syu’aib AS',
		father: 'Mikail (riwayat)',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Pemuka Madyan',
		tribe: 'Kaum Madyan',
		age: 'Tidak disebut',
		era: 'Sekitar 1500–1400 SM',
		explainer: 'Menyeru kejujuran muamalah di Madyan dan Aikah.',
		summary: 'Menyeru kejujuran timbangan dan keadilan ekonomi kepada Madyan.',
		titles: [
		'Khatibul Anbiya (sebutan riwayat)',
		'Rasul Madyan'
	],
		ululAzmi: false,
		story: 'Nabi Syu’aib AS menyeru kaum Madyan agar bertauhid dan jujur dalam muamalah: menyempurnakan takaran dan timbangan, tidak merugikan manusia, serta tidak membuat kerusakan di bumi. Mereka mendustakan, sehingga azab menimpa. Syu’aib mengajarkan bahwa agama mencakup pasar, bukan hanya masjid.',
		keyPoints: [
		'Melarang kecurangan dalam takaran',
		'Kaum Madyan dibinasakan karena ingkar',
		'Kejujuran ekonomi bagian dari iman',
		'Curang dalam takaran adalah dosa sosial',
		'Dakwah menyentuh akhlak publik dan pasar'
	],
		lessons: [
		'Kejujuran ekonomi bagian dari iman',
		'Curang dalam takaran adalah dosa sosial',
		'Dakwah menyentuh akhlak publik dan pasar'
	],
		dalil: [
		'QS Hud 11:84-95'
	]
	},
	{
		order: 14,
		slug: 'musa',
		name: 'Nabi Musa AS',
		father: 'Imran',
		children: 'Gersyom, Eliezer (riwayat)',
		spouse: 'Shafura (putri Syu’aib dalam riwayat)',
		siblings: 'Harun, Maryam',
		ruler: 'Fir’aun (riwayat Ramses)',
		tribe: 'Bani Israel',
		age: '±120 tahun (riwayat)',
		era: 'Sekitar 1300–1200 SM',
		explainer: 'Ulul azmi, pembawa Taurat, pembebas Bani Israel.',
		summary: 'Membebaskan Bani Israil dari Fir’aun, menerima Taurat.',
		titles: [
		'Kalimullah',
		'Ulul Azmi',
		'Pembawa Taurat'
	],
		ululAzmi: true,
		story: 'Nabi Musa AS diselamatkan sejak bayi dari Fir’aun, tumbuh di istana, lalu diutus bersama Harun untuk membebaskan Bani Israel. Mukjizat tongkat, tangan bercahaya, dan terbelahnya laut menunjukkan kekuasaan Allah atas tirani. Di Sinai ia menerima Taurat. Perjalanan Musa penuh ujian kepemimpinan: kaum yang keras kepala, penyembahan anak sapi, dan perjalanan panjang menuju ketaatan.',
		keyPoints: [
		'Mukjizat tongkat dan tangan bercahaya',
		'Membelah laut, menenggelamkan Fir’aun',
		'Menerima Taurat di Sinai',
		'Tauhid menantang tirani dan kesewenangan',
		'Pemimpin butuh pendamping dan doa',
		'Mukjizat tidak menggantikan tarbiyah umat yang sabar'
	],
		lessons: [
		'Tauhid menantang tirani dan kesewenangan',
		'Pemimpin butuh pendamping dan doa',
		'Mukjizat tidak menggantikan tarbiyah umat yang sabar',
		'Kitab suci adalah pedoman, bukan sekadar warisan'
	],
		dalil: [
		'QS Taha 20:9-98',
		'QS Al-A’raf 7:103-137'
	]
	},
	{
		order: 15,
		slug: 'harun',
		name: 'Nabi Harun AS',
		father: 'Imran',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: 'Musa, Maryam',
		ruler: 'Fir’aun',
		tribe: 'Bani Israel',
		age: '±123 tahun (riwayat)',
		era: 'Sezaman Musa',
		explainer: 'Pendamping Musa dengan kefasihan bicara.',
		summary: 'Pendamping Musa, menenangkan Bani Israil.',
		titles: [
		'Pendamping Musa',
		'Fasih bicara'
	],
		ululAzmi: false,
		story: 'Nabi Harun AS diutus mendampingi Musa karena kefasihannya. Ia membantu menyampaikan risalah kepada Fir’aun dan menjaga Bani Israel. Saat Musa bermunajat, ujian penyembahan anak sapi terjadi; Harun berusaha menasihati dengan cara yang menjaga persatuan. Kisahnya mengajarkan kolaborasi dakwah dan kehati-hatian dalam memimpin massa.',
		keyPoints: [
		'Diutus mendampingi Musa',
		'Menjaga umat saat Musa bermunajat',
		'Dakwah sering butuh tim, bukan solo hero',
		'Kefasihan ilmu harus digandeng hikmah',
		'Menjaga persatuan saat fitnah adalah tugas berat'
	],
		lessons: [
		'Dakwah sering butuh tim, bukan solo hero',
		'Kefasihan ilmu harus digandeng hikmah',
		'Menjaga persatuan saat fitnah adalah tugas berat'
	],
		dalil: [
		'QS Taha 20:29-32'
	]
	},
	{
		order: 16,
		slug: 'zulkifli',
		name: 'Nabi Zulkifli AS',
		father: 'Riwayat menyebut putra Ayyub (tidak pasti)',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: 'Riwayat: putra Ayyub lainnya',
		ruler: '—',
		tribe: 'Bani Israel (riwayat)',
		age: 'Tidak disebut',
		era: 'Periode pasca Ayyub',
		explainer: 'Nabi yang sabar dan adil memegang amanah.',
		summary: 'Dikenal sabar dan adil dalam memegang amanah.',
		titles: [
		'Nabi yang memegang kifayah/amanah'
	],
		ululAzmi: false,
		story: 'Nabi Zulkifli AS disebut dalam Al-Qur’an bersama orang-orang sabar dan saleh. Para mufasir menjelaskan bahwa ia dikenal memegang amanah, sabar, dan adil. Meski detail kisahnya tidak sepanjang nabi lain di Qur’an, sebutannya cukup menjadi isyarat bahwa sabar dan menunaikan tanggung jawab adalah sifat nabi yang dimuliakan.',
		keyPoints: [
		'Memegang janji, memimpin dengan adil',
		'Disebut bersama nabi sabar lainnya',
		'Amanah adalah mahkota kepemimpinan',
		'Sabar termasuk ciri orang yang dirahmati',
		'Tidak semua kisah harus spektakuler untuk menjadi teladan'
	],
		lessons: [
		'Amanah adalah mahkota kepemimpinan',
		'Sabar termasuk ciri orang yang dirahmati',
		'Tidak semua kisah harus spektakuler untuk menjadi teladan'
	],
		dalil: [
		'QS Al-Anbiya 21:85-86'
	]
	},
	{
		order: 17,
		slug: 'dawud',
		name: 'Nabi Dawud AS',
		father: 'Isya (Yesai)',
		children: 'Sulaiman dan lainnya',
		spouse: 'Beberapa dalam riwayat Bani Israel',
		siblings: 'Beberapa saudara (riwayat Bani Israel)',
		ruler: 'Sendiri sebagai raja',
		tribe: 'Bani Israel',
		age: '±100 tahun (riwayat)',
		era: 'Sekitar 1000 SM',
		explainer: 'Raja sekaligus nabi, ahli dzikir dan keadilan.',
		summary: 'Raja sekaligus nabi; ahli dzikir dan keadilan.',
		titles: [
		'Raja-nabi',
		'Pembawa Zabur'
	],
		ululAzmi: false,
		story: 'Nabi Dawud AS dikaruniai kerajaan dan kenabian. Ia ahli zikir; gunung dan burung bertasbih bersamanya. Allah memberinya Zabur dan kemampuan memutus perkara dengan adil. Dari kisah pengadilan dan taubatnya, umat belajar bahwa kekuasaan harus tunduk pada wahyu, dan kesalahan orang kuat ditutup dengan taubat yang tulus.',
		keyPoints: [
		'Dianugerahi Zabur',
		'Mengadili dengan adil',
		'Suara merdu bertasbih',
		'Kekuasaan adalah ujian, bukan hak istimewa',
		'Adil lebih berat daripada menang perang',
		'Zikir menghidupkan hati pemimpin'
	],
		lessons: [
		'Kekuasaan adalah ujian, bukan hak istimewa',
		'Adil lebih berat daripada menang perang',
		'Zikir menghidupkan hati pemimpin'
	],
		dalil: [
		'QS Shad 38:17-26'
	]
	},
	{
		order: 18,
		slug: 'sulaiman',
		name: 'Nabi Sulaiman AS',
		father: 'Nabi Dawud AS',
		children: 'Tidak disebut jelas',
		spouse: 'Riwayat menyebut Bilqis setelah beriman (tidak pasti)',
		siblings: '—',
		ruler: 'Sendiri sebagai raja',
		tribe: 'Bani Israel',
		age: '±60 tahun (riwayat)',
		era: 'Sekitar 970–931 SM',
		explainer: 'Raja nabi dengan kerajaan luas dan kendali atas jin.',
		summary: 'Mewarisi ilmu Dawud; memimpin manusia, jin, dan burung.',
		titles: [
		'Raja bijak',
		'Pewaris Dawud'
	],
		ululAzmi: false,
		story: 'Nabi Sulaiman AS mewarisi Dawud dalam ilmu dan kerajaan. Allah menundukkan angin, jin, dan burung baginya. Ia memahami bahasa makhluk dan memimpin dengan syukur, bukan kesombongan. Kisah Ratu Saba menunjukkan dakwah dengan surat, dialog, dan hujjah hingga ia tunduk kepada Allah. Sulaiman tetap ingat bahwa semua karunia dari Allah.',
		keyPoints: [
		'Mengatur pasukan jin dan burung',
		'Kisah Ratu Saba yang tunduk pada tauhid',
		'Diberi kemampuan memahami bahasa makhluk',
		'Syukur menjaga nikmat kekuasaan',
		'Dakwah bisa lewat surat, dialog, dan keteladanan',
		'Ilmu membuat pemimpin lebih bijak daripada sekadar kekuatan'
	],
		lessons: [
		'Syukur menjaga nikmat kekuasaan',
		'Dakwah bisa lewat surat, dialog, dan keteladanan',
		'Ilmu membuat pemimpin lebih bijak daripada sekadar kekuatan'
	],
		dalil: [
		'QS An-Naml 27:15-44'
	]
	},
	{
		order: 19,
		slug: 'ilyas',
		name: 'Nabi Ilyas AS',
		father: 'Yasin (riwayat)',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Raja-raja Syam penyembah Ba’al',
		tribe: 'Bani Israel di Syam',
		age: 'Tidak disebut',
		era: 'Sekitar abad 9 SM',
		explainer: 'Dakwah tauhid melawan penyembahan Ba’al.',
		summary: 'Menyeru tauhid kepada penyembah berhala Ba’al di Syam.',
		titles: [
		'Penentang Ba’al'
	],
		ululAzmi: false,
		story: 'Nabi Ilyas AS menyeru Bani Israel yang condong menyembah Ba’al agar kembali kepada Allah semata. Ia menegaskan bahwa Tuhan yang berhak disembah adalah yang menciptakan dan memberi rezeki, bukan berhala. Kisahnya dalam Al-Qur’an menekankan tauhid di tengah budaya syirik yang mengakar.',
		keyPoints: [
		'Menentang penyembahan Ba’al',
		'Mengajak kembali pada Allah Yang Esa',
		'Syirik modern bisa berbentuk sesembahan selain berhala fisik',
		'Dakwah tauhid harus jelas dan tegas',
		'Kaum yang berpaling dari Allah merugi'
	],
		lessons: [
		'Syirik modern bisa berbentuk sesembahan selain berhala fisik',
		'Dakwah tauhid harus jelas dan tegas',
		'Kaum yang berpaling dari Allah merugi'
	],
		dalil: [
		'QS As-Saffat 37:123-132'
	]
	},
	{
		order: 20,
		slug: 'ilyasa',
		name: 'Nabi Ilyasa AS',
		father: 'Akhitub (riwayat)',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Raja-raja Syam',
		tribe: 'Bani Israel',
		age: 'Tidak disebut',
		era: 'Sekitar abad 9–8 SM',
		explainer: 'Penerus Ilyas melanjutkan dakwah tauhid.',
		summary: 'Penerus Ilyas, melanjutkan dakwah tauhid.',
		titles: [
		'Penerus Ilyas'
	],
		ululAzmi: false,
		story: 'Nabi Ilyasa AS disebut dalam Al-Qur’an di antara hamba yang saleh. Ia melanjutkan estafet dakwah tauhid setelah Ilyas. Kehadirannya mengingatkan bahwa risalah tidak berhenti pada satu tokoh; Allah mengutus penerus agar cahaya tauhid tetap menyala di tengah Bani Israel.',
		keyPoints: [
		'Disebut bersama nabi yang mendapat rahmat',
		'Melanjutkan risalah tauhid',
		'Estafet dakwah harus dijaga antar generasi',
		'Kesalehan pribadi menopang misi kolektif',
		'Melanjutkan kebaikan lebih utama daripada mencari popularitas'
	],
		lessons: [
		'Estafet dakwah harus dijaga antar generasi',
		'Kesalehan pribadi menopang misi kolektif',
		'Melanjutkan kebaikan lebih utama daripada mencari popularitas'
	],
		dalil: [
		'QS Shad 38:48'
	]
	},
	{
		order: 21,
		slug: 'yunus',
		name: 'Nabi Yunus AS',
		father: 'Matta',
		children: 'Tidak disebut',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Raja Ninawa (Asyur)',
		tribe: 'Kaum Ninawa',
		age: 'Tidak disebut',
		era: 'Sekitar abad 8 SM',
		explainer: 'Diuji dalam perut ikan, kaumnya akhirnya beriman.',
		summary: 'Diuji di perut ikan, kaum Ninawa akhirnya beriman setelah taubatnya.',
		titles: [
		'Dzun Nun',
		'Sahibul Hut'
	],
		ululAzmi: false,
		story: 'Nabi Yunus AS diutus ke kaum Ninawa. Dalam satu fase ia meninggalkan kaumnya sebelum perintah sempurna, lalu ditelan ikan di lautan gelap. Di sana ia berdoa: “La ilaha illa anta subhanaka inni kuntu minazh-zhalimin.” Allah menyelamatkannya, dan kaumnya akhirnya beriman serta diselamatkan dari azab. Yunus adalah pelajaran taubat, doa di titik nadir, dan rahmat Allah.',
		keyPoints: [
		'Keluar sebelum diizinkan, lalu berdoa dalam kegelapan',
		'Kaum Ninawa bertaubat dan diselamatkan',
		'Jangan putus asa meski di kegelapan terdalam',
		'Mengakui zalim pada diri adalah awal taubat',
		'Kaum yang bertaubat bisa diselamatkan',
		'Sabar menghadapi penolakan adalah bagian risalah'
	],
		lessons: [
		'Jangan putus asa meski di kegelapan terdalam',
		'Mengakui zalim pada diri adalah awal taubat',
		'Kaum yang bertaubat bisa diselamatkan',
		'Sabar menghadapi penolakan adalah bagian risalah'
	],
		dalil: [
		'QS As-Saffat 37:139-148',
		'QS Al-Anbiya 21:87-88'
	]
	},
	{
		order: 22,
		slug: 'zakaria',
		name: 'Nabi Zakaria AS',
		father: 'Barkhiya',
		children: 'Nabi Yahya AS',
		spouse: 'Istri salehah (riwayat: Ashia binti Faqudz)',
		siblings: '—',
		ruler: 'Penguasa Baitul Maqdis/Romawi',
		tribe: 'Bani Israel',
		age: 'Tidak disebut',
		era: 'Sekitar abad 1 SM',
		explainer: 'Doa untuk keturunan dan penjaga Maryam.',
		summary: 'Mendoakan keturunan saleh, menjaga mihrab Maryam.',
		titles: [
		'Penjaga Maryam',
		'Ayah Yahya'
	],
		ululAzmi: false,
		story: 'Nabi Zakaria AS menjaga Maryam di mihrab dan melihat karunia rezeki padanya, lalu berdoa memohon keturunan meski tua. Allah mengabulkan dengan kelahiran Yahya. Doa Zakaria lembut, penuh adab, dan yakin. Kisahnya mengajarkan doa di usia lanjut dan pendidikan anak dalam suasana ibadah.',
		keyPoints: [
		'Diberi kabar gembira Yahya',
		'Teladan doa penuh harap',
		'Doa tidak mengenal ‘terlambat’ menurut ukuran manusia',
		'Lingkungan ibadah menumbuhkan anak saleh',
		'Melihat nikmat orang lain seharusnya memicu doa, bukan iri'
	],
		lessons: [
		'Doa tidak mengenal ‘terlambat’ menurut ukuran manusia',
		'Lingkungan ibadah menumbuhkan anak saleh',
		'Melihat nikmat orang lain seharusnya memicu doa, bukan iri'
	],
		dalil: [
		'QS Maryam 19:2-15'
	]
	},
	{
		order: 23,
		slug: 'yahya',
		name: 'Nabi Yahya AS',
		father: 'Nabi Zakaria AS',
		children: 'Tidak ada (riwayat)',
		spouse: 'Tidak disebut',
		siblings: '—',
		ruler: 'Penguasa Romawi/Yahudi lokal',
		tribe: 'Bani Israel',
		age: 'Syahid muda (riwayat ±30-an)',
		era: 'Sekitar awal Masehi',
		explainer: 'Zuhud, tegas, syahid mempertahankan hukum.',
		summary: 'Putra Zakaria; zuhud, tegas pada kebenaran, syahid mempertahankan hukum.',
		titles: [
		'Hasur',
		'Tegas pada hukum'
	],
		ululAzmi: false,
		story: 'Nabi Yahya AS dikaruniai hikmah sejak kecil, lembut kepada orang tua, dan tegas pada hukum Allah. Ia hidup zuhud dan akhirnya menempuh jalan syahid karena menegakkan kebenaran. Bersama Zakaria, ia menjadi simbol tarbiyah keluarga nabi: ilmu, wara’, dan keberanian moral.',
		keyPoints: [
		'Diberi hikmah sejak kecil',
		'Syahid karena menegakkan kebenaran',
		'Hikmah sejak muda harus dijaga dengan wara’',
		'Tegas pada kebenaran bisa berujung pengorbanan',
		'Birrul walidain adalah akhlak nabi'
	],
		lessons: [
		'Hikmah sejak muda harus dijaga dengan wara’',
		'Tegas pada kebenaran bisa berujung pengorbanan',
		'Birrul walidain adalah akhlak nabi'
	],
		dalil: [
		'QS Maryam 19:12-15'
	]
	},
	{
		order: 24,
		slug: 'isa',
		name: 'Nabi Isa AS',
		father: 'Lahir tanpa ayah',
		children: 'Tidak ada',
		spouse: 'Tidak ada',
		siblings: '—',
		ruler: 'Penguasa Romawi (Herodes/Pilatus era)',
		tribe: 'Bani Israel',
		age: 'Diangkat, diutus usia ±30',
		era: 'Sekitar 1–33 M',
		explainer: 'Ulul azmi, mukjizat banyak, membawa Injil.',
		summary: 'Lahir tanpa ayah, mukjizat menyembuhkan, Injil, mengabarkan Rasul penutup.',
		titles: [
		'Al-Masih',
		'Ruhullah (sebutan syar’i dengan makna yang benar)',
		'Ulul Azmi',
		'Pembawa Injil'
	],
		ululAzmi: true,
		story: 'Nabi Isa AS dilahirkan tanpa ayah sebagai tanda kekuasaan Allah. Sejak bayi ia berbicara membela kesucian Maryam. Ia diutus kepada Bani Israel dengan Injil dan mukjizat: menyembuhkan, menghidupkan atas izin Allah, serta menegaskan tauhid. Ia mengabarkan datangnya Rasul penutup. Umat Islam mengimani Isa tanpa ghuluw: ia hamba dan rasul Allah, bukan tuhan.',
		keyPoints: [
		'Mukjizat menyembuhkan, menghidupkan atas izin Allah',
		'Menegaskan tauhid dan syariat',
		'Memberi kabar tentang Nabi Muhammad ﷺ',
		'Mukjizat tidak meniadakan status kehambaan',
		'Tauhid harus dijaga dari sikap berlebihan (ghuluw)',
		'Kabar gembira tentang Nabi Muhammad adalah bagian risalah Isa'
	],
		lessons: [
		'Mukjizat tidak meniadakan status kehambaan',
		'Tauhid harus dijaga dari sikap berlebihan (ghuluw)',
		'Kabar gembira tentang Nabi Muhammad adalah bagian risalah Isa',
		'Ibu salehah (Maryam) adalah fondasi generasi mulia'
	],
		dalil: [
		'QS Ali Imran 3:45-52',
		'QS As-Saff 61:6'
	]
	},
	{
		order: 25,
		slug: 'muhammad',
		name: 'Nabi Muhammad ﷺ',
		father: 'Abdullah bin Abdul Muthalib',
		children: 'Qasim, Abdullah, Ibrahim, Zainab, Ruqayyah, Ummu Kulthum, Fatimah',
		spouse: 'Khadijah, Saudah, Aisyah, Hafshah, Zainab binti Jahsy, Ummu Salamah, dll.',
		siblings: 'Saudara sepersusuan; saudara tiri (riwayat) dari Bani Hasyim',
		ruler: 'Beliau memimpin Madinah; sebelumnya di bawah Quraisy',
		tribe: 'Quraisy (Bani Hasyim)',
		age: '63 tahun',
		era: '570–632 M',
		explainer: 'Penutup nabi, rahmatan lil ‘alamin, membawa Al-Qur’an.',
		summary: 'Rasul penutup, membawa Al-Qur’an, rahmat bagi alam.',
		titles: [
		'Khatamun Nabiyyin',
		'Rahmatan lil ‘Alamin',
		'Ulul Azmi',
		'Al-Amin'
	],
		ululAzmi: true,
		story: 'Nabi Muhammad ﷺ adalah penutup para nabi. Lahir di Makkah, dikenal al-Amin, diutus di usia 40 tahun dengan Al-Qur’an. Dakwah dimulai diam-diam lalu terang-terangan, menghadapi penyiksaan Quraisy, hijrah ke Madinah, membangun masyarakat beradab, dan menyelesaikan risalah dalam Haji Wada’. Akhlaknya adalah Al-Qur’an. Beliau rahmat bagi alam: menyempurnakan syariat, memuliakan manusia, dan meninggalkan dua pusaka: Kitabullah dan sunnah yang dijaga umat.',
		keyPoints: [
		'Al-Qur’an sebagai mukjizat abadi',
		'Menyempurnakan akhlak',
		'Rahmatan lil alamin',
		'Akhlak adalah dakwah yang paling terang',
		'Kesabaran di Makkah dan ketegasan beradab di Madinah saling melengkapi',
		'Penutup nubuwwah menuntut kita menjaga sunnah, bukan menunggu nabi baru'
	],
		lessons: [
		'Akhlak adalah dakwah yang paling terang',
		'Kesabaran di Makkah dan ketegasan beradab di Madinah saling melengkapi',
		'Penutup nubuwwah menuntut kita menjaga sunnah, bukan menunggu nabi baru',
		'Rahmat Islam bersifat universal: adil, ihsan, dan ilmu'
	],
		dalil: [
		'QS Al-Ahzab 33:40',
		'QS Al-Anbiya 21:107'
	]
	},
];

export const getNabiBySlug = (slug: string) => nabiList.find((n) => n.slug === slug);
export const ululAzmiList = nabiList.filter((n) => n.ululAzmi);
