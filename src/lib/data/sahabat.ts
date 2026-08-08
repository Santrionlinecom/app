export type SahabatRecord = {
	slug: string;
	name: string;
	kunya?: string;
	laqab?: string;
	born?: string;
	died?: string;
	era?: string;
	rank: number;
	role: string;
	group: string[];
	summary: string;
	story: string;
	achievements: string[];
	lessons: string[];
	traits: string[];
	related?: string[];
};

export const khulafaRasyidin: SahabatRecord[] = [
	{
		slug: 'abu-bakar',
		name: 'Abu Bakar Ash-Shiddiq',
		kunya: 'Abu Bakar',
		laqab: 'Ash-Shiddiq · Al-Atiq',
		born: '±573 M',
		died: '13 H / 634 M',
		era: 'Makkah–Madinah–Khilafah',
		rank: 1,
		role: 'Khalifah pertama, sahabat terdekat Rasulullah ﷺ',
		group: ['Muhajirin', 'Ahlul Badr', 'Al-Asyarah al-Mubasyarah', 'Khulafaur Rasyidin'],
		summary:
			'Orang pertama dari laki-laki dewasa yang membenarkan Nabi tanpa ragu. Memimpin setelah wafat Rasulullah, memadamkan riddah, menegakkan zakat, dan mengawali pengumpulan mushaf.',
		story:
			'Abu Bakar bin Abi Quhafah berasal dari Quraisy yang terhormat, dikenal jujur dalam perdagangan dan lembut akhlaknya. Saat Rasulullah ﷺ menyampaikan wahyu, ia membenarkan tanpa keraguan — karena itu digelar Ash-Shiddiq, terutama setelah membenarkan Isra Mi’raj. Ia menemani hijrah di Gua Tsur, menginfakkan harta untuk memerdekakan budak yang disiksa karena Islam, dan selalu di barisan depan mendukung dakwah. Setelah Rasulullah wafat, di tengah guncangan umat ia berdiri menegaskan: “Siapa yang menyembah Muhammad, maka Muhammad telah wafat; siapa yang menyembah Allah, maka Allah Mahahidup.” Ia dibaiat sebagai khalifah, memerangi penolak zakat dan gerakan riddah, mengirim pasukan Usamah, serta memerintahkan pengumpulan Al-Qur’an setelah banyak huffaz syahid di Yamamah. Kepemimpinannya singkat namun menyelamatkan fondasi agama dan negara.',
		achievements: [
			'Membenarkan Nabi di awal dakwah dan saat Isra Mi’raj',
			'Menemani hijrah; disebut dalam QS At-Taubah 9:40',
			'Memerdekakan budak beriman seperti Bilal',
			'Memadamkan riddah dan menegakkan kewajiban zakat',
			'Mengawali proyek pengumpulan mushaf Al-Qur’an',
			'Menjaga stabilitas umat di masa paling rapuh pasca kenabian'
		],
		lessons: [
			'Sidq (kebenaran) adalah fondasi persahabatan dan kepemimpinan',
			'Harta paling berharga adalah yang diinfakkan untuk agama',
			'Ketegasan diperlukan saat fondasi syariat digoyang',
			'Cinta kepada Rasul tidak menghalangi sikap tegas demi Allah'
		],
		traits: ['Shiddiq', 'Dermawan', 'Lembut tapi tegas', 'Setia'],
		related: ['umar', 'utsman', 'ali']
	},
	{
		slug: 'umar',
		name: 'Umar bin Khattab',
		kunya: 'Abu Hafs',
		laqab: 'Al-Faruq · Amirul Mukminin',
		born: '±584 M',
		died: '23 H / 644 M',
		era: 'Makkah–Madinah–Khilafah',
		rank: 2,
		role: 'Khalifah kedua, penegak keadilan dan arsitek administrasi negara',
		group: ['Muhajirin', 'Ahlul Badr', 'Al-Asyarah al-Mubasyarah', 'Khulafaur Rasyidin'],
		summary:
			'Dari penentang menjadi penolong Islam. Menata baitul mal, diwan, kalender hijriah, perluasan Syam-Persia-Mesir, dan dikenal sebagai simbol keadilan.',
		story:
			'Umar bin Khattab awalnya dikenal kuat dan menentang dakwah. Keislamannya menjadi titik balik yang menguatkan barisan Muslim di Makkah. Ia digelar Al-Faruq karena memisahkan yang hak dan batil. Dalam hijrah dan peperangan, ia termasuk tokoh utama. Saat menjadi khalifah, wilayah Islam meluas cepat, namun yang lebih menonjol adalah sistem: baitul mal, pencatatan diwan, pengangkatan gubernur dengan pengawasan ketat, penegakan hukum tanpa pandang bulu, dan penetapan kalender hijriah. Ia patroli malam, menangis memikirkan rakyat lapar, dan takut hisab. Syahidnya di mihrab menjadi penutup era kepemimpinan yang tegas dan zuhud.',
		achievements: [
			'Keislaman yang menguatkan dakwah secara terbuka di Makkah',
			'Menetapkan kalender hijriah',
			'Membangun administrasi baitul mal dan pengawasan amil',
			'Perluasan wilayah dengan kontrol keadilan sosial',
			'Teladan zuhud pemimpin: takut disoal seekor keledai di tepi sungai'
		],
		lessons: [
			'Taubat orang kuat mengubah sejarah',
			'Keadilan lebih utama daripada popularitas',
			'Negara butuh sistem, bukan hanya semangat',
			'Pemimpin digugat oleh rasa takut kepada Allah'
		],
		traits: ['Tegas', 'Adil', 'Zuhud', 'Visioner'],
		related: ['abu-bakar', 'utsman', 'ali']
	},
	{
		slug: 'utsman',
		name: 'Utsman bin Affan',
		kunya: 'Abu Abdullah',
		laqab: 'Dzun Nurain',
		born: '±576 M',
		died: '35 H / 656 M',
		era: 'Makkah–Madinah–Khilafah',
		rank: 3,
		role: 'Khalifah ketiga, penyalin mushaf standar dan dermawan besar',
		group: ['Muhajirin', 'Al-Asyarah al-Mubasyarah', 'Khulafaur Rasyidin', 'Penulis wahyu'],
		summary:
			'Dinikahkan dengan dua putri Nabi secara berurutan (Dzun Nurain). Membeli sumur Rumah, membiayai pasukan, dan menstandardisasi Mushaf Utsmani.',
		story:
			'Utsman bin Affan dari Bani Umayyah masuk Islam lebih awal melalui ajakan Abu Bakar. Ia pemalu, dermawan, dan ahli baca Al-Qur’an. Karena menikah dengan Ruqayyah lalu Ummu Kultsum, ia digelar Dzun Nurain. Dalam kesulitan Madinah, ia berulang kali berinfak besar: sumur, perlengkapan pasukan, dan bantuan publik. Sebagai khalifah, prestasinya yang paling abadi adalah menyatukan penulisan mushaf pada rasm yang disepakati agar umat tidak tercerai-berai oleh perbedaan salinan, lalu mengirim salinan ke kota-kota besar. Di akhir pemerintahannya ia menghadapi fitnah; ia memilih sabar dan tidak ingin darah Muslim tumpah demi membela dirinya. Syahidnya menjadi luka sejarah yang harus dibaca dengan adab Aswaja: tanpa mencaci sahabat.',
		achievements: [
			'Infak besar untuk kemaslahatan umat dan pasukan',
			'Gelar Dzun Nurain karena pernikahan dengan dua putri Nabi',
			'Standardisasi Mushaf Utsmani dan penyebarannya',
			'Perluasan dakwah dan armada di era pemerintahannya',
			'Sabar menghadapi fitnah hingga syahid'
		],
		lessons: [
			'Harta menjadi berkah saat disalurkan untuk agama',
			'Menjaga kesatuan mushaf adalah menjaga kesatuan umat',
			'Malu (haya’) adalah cabang iman',
			'Fitnah disikapi dengan ilmu dan adab, bukan kebencian'
		],
		traits: ['Dermawan', 'Pemalu', 'Penyabar', 'Ahli Qur’an'],
		related: ['abu-bakar', 'umar', 'ali']
	},
	{
		slug: 'ali',
		name: 'Ali bin Abi Thalib',
		kunya: 'Abul Hasan · Abu Turab',
		laqab: 'Asadullah · Babul Ilmi (sebutan keutamaan)',
		born: '±600 M',
		died: '40 H / 661 M',
		era: 'Makkah–Madinah–Khilafah',
		rank: 4,
		role: 'Khalifah keempat, pintu ilmu, keberanian, dan ketakwaan',
		group: ['Ahlul Bait', 'Muhajirin', 'Ahlul Badr', 'Al-Asyarah al-Mubasyarah', 'Khulafaur Rasyidin'],
		summary:
			'Putra paman Nabi, suami Fatimah, ayah Hasan-Husain. Terkenal keberanian, kefasihan, dan kedalaman ilmu. Memimpin di masa fitnah dengan ijtihad menjaga keutuhan umat.',
		story:
			'Ali bin Abi Thalib tumbuh di rumah kenabian, termasuk orang paling awal beriman dari kalangan anak muda. Ia tidur di ranjang Nabi saat hijrah sebagai pengorbanan berani. Di Badar, Uhud, Khandaq, dan Khaibar namanya harum sebagai pejuang yang tidak gila pujian. Menikah dengan Fatimah az-Zahra, ia menjadi bapak cucu Rasulullah. Ilmu, qadha’, dan kefasihannya menjadi rujukan. Saat diangkat khalifah, umat sedang dilanda fitnah besar pasca syahidnya Utsman. Ali menempuh kebijakan yang menurut ijtihadnya menjaga legitimasi dan keadilan, menghadapi tantangan internal yang sangat berat. Bagi ahlus sunnah, Ali adalah khalifah yang sah, dicintai, dan tidak dicaci; perkara fitnah diserahkan dengan adab kepada kajian ulama yang adil.',
		achievements: [
			'Termasuk paling awal beriman dan dekat dengan tarbiyah Nabi',
			'Pengorbanan di malam hijrah dan ketangguhan di medan perang',
			'Suami Fatimah; ayah Hasan dan Husain',
			'Rujukan ilmu, qadha’, dan kefasihan',
			'Memimpin di masa paling sulit dengan kesabaran dan keberanian'
		],
		lessons: [
			'Ilmu tanpa keberanian mudah dilumpuhkan; keberanian tanpa ilmu berbahaya',
			'Mencintai Ahlul Bait adalah bagian akhlak ahlus sunnah',
			'Fitnah disikapi dengan adab, bukan fanatisme buta',
			'Kepemimpinan di masa sulit menuntut ketakwaan ekstra'
		],
		traits: ['Berani', 'Alim', 'Zuhud', 'Fasih'],
		related: ['abu-bakar', 'umar', 'utsman']
	}
];

export const notableSahabat: SahabatRecord[] = [
	{
		slug: 'khadijah',
		name: 'Khadijah binti Khuwailid',
		kunya: 'Ummul Mukminin',
		laqab: 'Ath-Thahirah',
		born: '±556 M',
		died: '620 M (Amul Huzn)',
		era: 'Makkah',
		rank: 10,
		role: 'Istri pertama Nabi, pendukung dakwah paling awal',
		group: ['Ummahatul Mukminin', 'Pendukung awal dakwah'],
		summary: 'Pedagang terhormat yang menikahi Rasulullah, menenangkan beliau saat wahyu pertama, dan menginfakkan hartanya untuk Islam.',
		story:
			'Khadijah adalah pengusaha Makkah yang terpercaya. Ia melihat amanah Muhammad bin Abdullah lalu menikah dengannya. Saat wahyu pertama turun, dialah yang menenangkan Nabi dan membawanya kepada Waraqah. Sepanjang periode Makkah yang sulit, Khadijah menjadi tiang emosional dan finansial dakwah. Wafatnya berdekatan dengan Abu Thalib menandai Tahun Kesedihan. Baginya, keimanan bukan teori: harta, ketenangan, dan pendampingan total.',
		achievements: [
			'Orang pertama beriman dari kalangan perempuan',
			'Menyokong dakwah dengan harta dan ketenangan',
			'Ibu anak-anak Nabi yang mulia, termasuk Fatimah'
		],
		lessons: [
			'Pasangan saleh adalah tiang dakwah',
			'Harta menjadi berkah saat menopang kebenaran',
			'Menenangkan orang yang diguncang ujian adalah ibadah besar'
		],
		traits: ['Setia', 'Dermawan', 'Bijak', 'Tegar']
	},
	{
		slug: 'aisyah',
		name: 'Aisyah binti Abu Bakar',
		kunya: 'Ummul Mukminin',
		laqab: 'Ash-Shiddiqah binti Ash-Shiddiq',
		born: '±614 M',
		died: '58 H',
		era: 'Madinah',
		rank: 11,
		role: 'Perawi besar, faqihah, dan guru umat',
		group: ['Ummahatul Mukminin', 'Ahli hadis', 'Ahli fiqih'],
		summary: 'Istri Nabi yang paling banyak meriwayatkan dari kehidupan rumah tangga dan syariat harian; rujukan ilmu Madinah.',
		story:
			'Aisyah tumbuh di rumah Abu Bakar dan menjadi Ummul Mukminin. Kecerdasannya membuatnya menghafal, bertanya, dan mengajarkan. Ribuan riwayat berkaitan dengannya: thaharah, shalat, akhlak Nabi di rumah, dan fatwa. Di masa sahabat, banyak tokoh bertanya kepadanya. Membaca biografinya mengajari kita bahwa perempuan berilmu adalah tiang peradaban Islam, dan rumah Nabi adalah madrasah adab.',
		achievements: [
			'Termasuk perawi hadis terbanyak',
			'Rujukan fiqih dan tafsir di Madinah',
			'Menjaga memori kehidupan Nabi secara rinci'
		],
		lessons: [
			'Bertanya adalah pintu ilmu',
			'Ilmu rumah tangga adalah bagian syariat',
			'Perempuan alim adalah warisan umat'
		],
		traits: ['Cerdas', 'Tegas', 'Alimah', 'Fasih']
	},
	{
		slug: 'bilal',
		name: 'Bilal bin Rabah',
		kunya: 'Abu Abdullah',
		laqab: 'Muadzin Rasulullah',
		born: '±580 M',
		died: '±20 H',
		era: 'Makkah–Madinah–Syam',
		rank: 12,
		role: 'Muadzin Nabi dan simbol keteguhan tauhid',
		group: ['Muhajirin', 'Ahlul Badr', 'Mantan budak yang dimuliakan Islam'],
		summary: 'Disiksa karena mengucapkan ahad-ahad, dimerdekakan Abu Bakar, lalu menjadi muadzin yang suaranya menggetarkan Madinah.',
		story:
			'Bilal adalah budak yang disiksa di bawah terik matahari karena bertauhid. Di lidahnya tetap “Ahad, Ahad.” Abu Bakar memerdekakannya. Di Madinah, suaranya dipilih untuk azan. Setelah Nabi wafat, riwayat menyebutkan ia enggan azan seperti dulu karena sedih. Kisah Bilal meruntuhkan kesombongan nasab: kemuliaan di sisi Allah adalah takwa.',
		achievements: [
			'Keteguhan tauhid di bawah siksaan',
			'Muadzin resmi di era Nabi',
			'Simbol persamaan manusia dalam Islam'
		],
		lessons: [
			'Takwa mengalahkan stratifikasi sosial jahiliah',
			'Sabar di ujian awal membuka kemuliaan nanti',
			'Suara kebaikan lebih abadi daripada status dunia'
		],
		traits: ['Tegar', 'Loyal', 'Tawadhu']
	},
	{
		slug: 'hamzah',
		name: 'Hamzah bin Abdul Muthalib',
		kunya: 'Abu Imarah',
		laqab: 'Asadullah · Sayyidusy Syuhada',
		born: '±568 M',
		died: '3 H (Uhud)',
		era: 'Makkah–Madinah',
		rank: 13,
		role: 'Paman Nabi, syahid Uhud, simbol keberanian',
		group: ['Ahlul Bait', 'Ahlul Badr', 'Syuhada Uhud'],
		summary: 'Keislamannya menguatkan barisan di Makkah; syahid di Uhud dengan kehormatan besar.',
		story:
			'Hamzah adalah paman Nabi yang disegani. Saat mendengar Rasulullah diusik, ia membela lalu masuk Islam. Di Badar ia di barisan depan. Di Uhud ia syahid. Gelar singa Allah dan pemimpin syuhada menandakan keberanian yang dilandasi iman, bukan amarah buta.',
		achievements: [
			'Menguatkan dakwah di fase Makkah',
			'Pejuang Badar',
			'Syahid Uhud dengan keutamaan besar'
		],
		lessons: [
			'Membela kebenaran mengubah jalur hidup',
			'Keberanian harus tertib di bawah komando syariat',
			'Syahid adalah puncak pengorbanan pejuang'
		],
		traits: ['Berani', 'Protektif', 'Loyal']
	},
	{
		slug: 'musab-bin-umair',
		name: "Mus'ab bin Umair",
		kunya: 'Abu Abdullah',
		laqab: 'Duta dakwah Madinah',
		born: '—',
		died: '3 H (Uhud)',
		era: 'Makkah–Madinah',
		rank: 14,
		role: 'Utusan dakwah pertama ke Madinah',
		group: ['Muhajirin', 'Ahlul Badr', 'Syuhada Uhud'],
		summary: 'Pemuda kaya yang zuhud setelah Islam; berhasil menyiapkan Madinah sebelum hijrah Nabi.',
		story:
			"Mus'ab bin Umair dulu hidup mewah. Setelah Islam, ia menanggung tekanan keluarga dan memilih akhirat. Diutus ke Madinah, ia mengajar Al-Qur’an dan menyiapkan hati Anshar. Baiat Aqabah dan hijrah sukses berkat fondasi yang ia bantu bangun. Syahid di Uhud dengan kain kafan yang tidak menutupi tubuhnya sempurna — isyarat zuhud dunia.",
		achievements: [
			'Duta pengajar di Madinah sebelum hijrah',
			'Mempersiapkan masyarakat Anshar',
			'Syahid Uhud dalam keadaan zuhud'
		],
		lessons: [
			'Dakwah butuh pendidik, bukan hanya orator',
			'Kemewahan yang ditinggalkan demi iman adalah kemenangan',
			'Hasil dakwah sering dipanen generasi berikutnya'
		],
		traits: ['Zuhud', 'Pendakwah', 'Lembut']
	},
	{
		slug: 'abu-ubaidah',
		name: 'Abu Ubaidah bin Jarrah',
		kunya: 'Abu Ubaidah',
		laqab: 'Aminul Ummah',
		born: '±583 M',
		died: '18 H',
		era: 'Makkah–Madinah–Syam',
		rank: 15,
		role: 'Kepercayaan umat, panglima penaklukan Syam',
		group: ['Muhajirin', 'Ahlul Badr', 'Al-Asyarah al-Mubasyarah'],
		summary: 'Disebut Rasulullah sebagai aminul ummah; memimpin di Syam dengan amanah dan kelembutan.',
		story:
			'Abu Ubaidah dipercaya karena amanahnya. Dalam ekspedisi Syam ia menjadi tokoh kunci. Saat wabah Amwas, ia tetap bersama pasukan dan wafat di jalan pengabdian. Kepercayaannya bukan hasil pencitraan, melainkan rekam jejak panjang di sisi Nabi.',
		achievements: [
			'Termasuk sepuluh yang dijanjikan surga',
			'Panglima terpercaya di Syam',
			'Teladan amanah kepemimpinan'
		],
		lessons: [
			'Amanah lebih berharga daripada jabatan',
			'Pemimpin tinggal bersama rakyat di masa sulit',
			'Kepercayaan dibangun dengan konsistensi'
		],
		traits: ['Amanah', 'Tenang', 'Berani']
	},
	{
		slug: 'salman',
		name: 'Salman al-Farisi',
		kunya: 'Abu Abdullah',
		laqab: 'Salman al-Khair · minna Ahlul Bait (kehormatan maknawi)',
		born: 'Persia',
		died: '±35 H',
		era: 'Pencarian kebenaran–Madinah',
		rank: 16,
		role: 'Pencari kebenaran dan pengusul strategi parit',
		group: ['Sahabat', 'Strateg strategik Khandaq'],
		summary: 'Berpindah dari majusi ke pencarian agama, hingga menemukan Nabi di Madinah; mengusulkan parit pada Perang Khandaq.',
		story:
			'Salman menempuh perjalanan panjang mencari kebenaran antar biara dan negeri, sempat diperbudak, lalu bertemu Rasulullah sesuai tanda yang ia cari. Pada Khandaq ia mengusulkan strategi parit yang belum lazim di Arab. Ia menjadi simbol bahwa Islam terbuka untuk semua bangsa, dan pengalaman hidup bisa menjadi modal strategi umat.',
		achievements: [
			'Perjalanan pencarian kebenaran lintas negeri',
			'Usulan strategi parit di Khandaq',
			'Teladan masuknya non-Arab ke pusat kehormatan Islam'
		],
		lessons: [
			'Mencari kebenaran butuh sabar bertahun-tahun',
			'Ilmu dan pengalaman dari luar bisa menolong umat',
			'Islam meruntuhkan fanatisme kesukuan'
		],
		traits: ['Pencari ilmu', 'Strategis', 'Zuhud']
	},
	{
		slug: 'ibnu-masud',
		name: 'Abdullah bin Mas’ud',
		kunya: 'Abu Abdurrahman',
		laqab: 'Ibnu Ummi Abd',
		born: '—',
		died: '±32 H',
		era: 'Makkah–Madinah–Kufah',
		rank: 17,
		role: 'Ahli Al-Qur’an dan guru besar jalur Kufah',
		group: ['Muhajirin', 'Ahlul Badr', 'Ahli qiraah & fiqih'],
		summary: 'Termasuk paling awal masuk Islam, dekat dengan bacaan Nabi, dan mewariskan tradisi ilmu Kufah.',
		story:
			'Ibnu Mas’ud kecil digembalakan, lalu Islam mengangkatnya. Ia termasuk yang berani terang-terangan membaca Qur’an di Makkah. Kedekatannya dengan bacaan dan sunnah Nabi menjadikannya rujukan. Di Kufah ia menanam sekolah ilmu yang kelak memengaruhi fiqih Irak. Darinya kita belajar: sanad dan adab membaca Al-Qur’an adalah warisan sahabat.',
		achievements: [
			'Termasuk sahabat awal dan Ahlul Badr',
			'Rujukan qiraah dan tafsir praktis',
			'Fondasi ilmu di Kufah'
		],
		lessons: [
			'Kedekatan dengan Al-Qur’an mengangkat derajat',
			'Guru daerah adalah peletak peradaban',
			'Ilmu harus bersanad dan beradab'
		],
		traits: ['Alim', 'Berani', 'Wara’']
	},
	{
		slug: 'zaid-bin-tsabit',
		name: 'Zaid bin Tsabit',
		kunya: 'Abu Kharijah',
		died: '±45 H',
		era: 'Madinah',
		rank: 18,
		role: 'Penulis wahyu dan arsitek pengumpulan mushaf',
		group: ['Anshar', 'Penulis wahyu', 'Ahli farid'],
		summary: 'Ditugaskan mengumpulkan Al-Qur’an di era Abu Bakar dan berperan dalam standardisasi di era Utsman.',
		story:
			'Zaid masih muda saat diperintahkan menulis wahyu. Kecerdasannya membuatnya dipercaya. Saat banyak penghafal syahid, Abu Bakar dan Umar menugaskannya mengumpulkan Al-Qur’an dari pelepah, tulang, dan dada para huffaz dengan metodologi ketat. Di era Utsman ia kembali sentral dalam penyalinan standar. Ia juga ahli waris (faraid).',
		achievements: [
			'Penulis wahyu',
			'Ketua tim pengumpulan mushaf era Abu Bakar',
			'Peran kunci mushaf Utsmani',
			'Ahli faraid'
		],
		lessons: [
			'Anak muda bisa dipercaya tugas besar jika jujur dan cakap',
			'Menjaga mushaf adalah proyek kolektif yang teliti',
			'Dokumentasi ilmu menyelamatkan umat'
		],
		traits: ['Cermat', 'Amanah', 'Alim']
	},
	{
		slug: 'muadz-bin-jabal',
		name: 'Mu’adz bin Jabal',
		kunya: 'Abu Abdurrahman',
		died: '18 H',
		era: 'Madinah–Yaman–Syam',
		rank: 19,
		role: 'Ahli halal-haram, utusan pengajar ke Yaman',
		group: ['Anshar', 'Ahli fiqih', 'Guru wilayah'],
		summary: 'Dipuji sebagai yang paling tahu halal-haram; diutus Nabi ke Yaman dengan metodologi ijtihad yang masyhur.',
		story:
			'Mu’adz adalah pemuda Anshar yang dalam ilmunya. Rasulullah mengutusnya ke Yaman dan bertanya bagaimana ia memutus hukum: Kitabullah, lalu sunnah, lalu ijtihad. Percakapan itu menjadi fondasi usul bagi para qadhi. Ia mengajar tauhid, shalat, dan zakat dengan hikmah. Wafat di masa wabah setelah menunaikan amanah ilmu.',
		achievements: [
			'Utusan pengajar dan qadhi ke Yaman',
			'Rujukan halal-haram',
			'Teladan metodologi berfatwa berjenjang'
		],
		lessons: [
			'Fatwa berjenjang: nash dulu, baru ijtihad',
			'Daerah butuh guru, bukan hanya pasukan',
			'Ilmu yang diamalkan lebih berharga daripada gelar'
		],
		traits: ['Faqih', 'Bijak', 'Pendakwah']
	},
	{
		slug: 'abu-hurairah',
		name: 'Abu Hurairah',
		kunya: 'Abu Hurairah',
		laqab: 'Perawi umat',
		died: '±57 H',
		era: 'Madinah',
		rank: 20,
		role: 'Perawi hadis terbanyak',
		group: ['Sahabat', 'Ahli hadis', 'Ahlu Suffah'],
		summary: 'Menyertai Nabi dengan penuh perhatian pada sunnah; menjadi gudang riwayat amalan harian dan adab.',
		story:
			'Abu Hurairah datang dari Daus dan memilih dekat dengan Nabi di Suffah. Ia fokus menghafal sabda dan perbuatan Nabi. Karena itu riwayatnya sangat banyak, mencakup adab, zikir, muamalah, dan akhlak. Para ulama mengkritik dan membela dengan ilmu musthalah; ahlus sunnah mengakui jasanya yang besar dalam menjaga sunnah praktis.',
		achievements: [
			'Perawi dengan jumlah riwayat sangat besar',
			'Menjaga sunnah harian umat',
			'Teladan fokus thalabul ilmi'
		],
		lessons: [
			'Spesialisasi ilmu adalah kekuatan',
			'Kedekatan dengan majelis ilmu membentuk hafalan',
			'Menjaga sunnah adalah jihad pena dan ingatan'
		],
		traits: ['Penjaga sunnah', 'Sederhana', 'Aktif di majelis']
	},
	{
		slug: 'saad-bin-muadz',
		name: "Sa'd bin Mu'adz",
		kunya: 'Abu Amr',
		died: '5 H',
		era: 'Madinah',
		rank: 21,
		role: 'Pemimpin Aus, penolong Nabi di Madinah',
		group: ['Anshar', 'Ahlul Badr'],
		summary: 'Sayyid Aus yang keislamannya menguatkan Madinah; syahid setelah luka di Khandaq.',
		story:
			"Sa'd bin Mu'adz adalah pemimpin yang disegani. Keislamannya menarik banyak kaumnya. Di Badar dan pembelaan Madinah ia berperan besar. Luka di Khandaq membawa syahidnya; riwayat menyebut ‘arsy Ar-Rahman bergetar karena kematiannya sebagai penghormatan maknawi atas keimanannya. Ia contoh itsar Anshar.",
		achievements: [
			'Memimpin Aus mendukung Nabi',
			'Pejuang Badar dan Khandaq',
			'Teladan itsar Anshar'
		],
		lessons: [
			'Pemimpin lokal yang beriman mengubah kota',
			'Menolong pendatang beriman adalah kemuliaan',
			'Syahid bisa datang dari luka pengabdian'
		],
		traits: ['Pemimpin', 'Loyal', 'Berani']
	}
];

export const allSahabatDetailed: SahabatRecord[] = [...khulafaRasyidin, ...notableSahabat];

export const getSahabatBySlug = (slug: string) => allSahabatDetailed.find((s) => s.slug === slug);

export const historyTimeline = [
	{
		period: '610–615 M',
		title: 'Dakwah awal di Makkah',
		desc: 'Sahabat pertama menerima Islam dalam tekanan Quraisy. Dari rumah al-Arqam mereka belajar tauhid, Al-Qur’an, sabar, dan keberanian menyampaikan kebenaran.'
	},
	{
		period: '615–622 M',
		title: 'Hijrah ke Habasyah dan Madinah',
		desc: 'Sebagian sahabat berhijrah ke Habasyah menjaga iman. Setelah Baiat Aqabah, Anshar membuka Madinah sebagai laboratorium masyarakat Islam.'
	},
	{
		period: '2 H',
		title: 'Badar',
		desc: 'Sekitar 313 sahabat menghadapi Quraisy dengan persiapan terbatas. Badar menjadi tanda keimanan generasi awal dan pertolongan Allah.'
	},
	{
		period: '3–5 H',
		title: 'Uhud dan Khandaq',
		desc: 'Pelajaran disiplin, ketaatan, strategi, luka kekalahan, dan sabar menjaga Madinah dari koalisi besar.'
	},
	{
		period: '6 H',
		title: 'Hudaibiyah dan Baiat Ridwan',
		desc: 'Perjanjian yang tampak berat membuka jalan dakwah lebih luas. Baiat di bawah pohon menjadi keutamaan khusus.'
	},
	{
		period: '8–10 H',
		title: 'Fathu Makkah dan Haji Wada’',
		desc: 'Makkah kembali ke tauhid tanpa dendam massal. Haji Wada’ menyampaikan wasiat darah, harta, amanah, dan pegangan pada wahyu.'
	},
	{
		period: '11–40 H',
		title: 'Masa Khulafaur Rasyidin',
		desc: 'Sahabat menata negara, menjaga mushaf, mengirim guru, membangun administrasi, dan menghadapi fitnah dengan ijtihad beradab.'
	}
];

export const companionGroups = [
	{
		name: 'Muhajirin',
		desc: 'Sahabat yang hijrah dari Makkah, meninggalkan harta dan kampung halaman demi iman dan mengikuti Rasulullah ﷺ.'
	},
	{
		name: 'Anshar',
		desc: 'Penduduk Madinah penolong Nabi dan Muhajirin; teladan itsar, persaudaraan, dan pembelaan dakwah.'
	},
	{
		name: 'Ahlul Badr',
		desc: 'Sahabat perang Badar (masyhur ±313). Keutamaan mereka besar dalam riwayat, dengan catatan angka bisa berbeda antar sumber karena metode hitung.'
	},
	{
		name: 'Ahlu Baiat Ridwan',
		desc: 'Sahabat yang berbaiat di Hudaibiyah saat ketegangan dengan Quraisy; simbol keteguhan membela Nabi.'
	},
	{
		name: 'Ashab Suffah',
		desc: 'Sahabat di serambi Masjid Nabawi yang fokus belajar, beribadah, dan menerima pendidikan langsung.'
	},
	{
		name: 'Ummahatul Mukminin',
		desc: 'Para istri Nabi; sumber hadis, fiqih keluarga, adab, dan potret kehidupan Rasulullah ﷺ.'
	},
	{
		name: 'Al-Asyarah al-Mubasyarah',
		desc: 'Sepuluh sahabat yang dijanjikan surga dalam riwayat masyhur; tidak meniadakan keutamaan sahabat lain.'
	},
	{
		name: 'Penulis wahyu & guru wilayah',
		desc: 'Sahabat yang menulis Al-Qur’an, mengajar qiraah, fiqih, dan menyebarkan ilmu ke Makkah, Madinah, Kufah, Basrah, Syam, Mesir, Yaman.'
	}
];

export const knowledgeRoles = [
	'Menjaga bacaan dan hafalan Al-Qur’an dari Rasulullah ﷺ.',
	'Meriwayatkan hadis, sunnah amaliyah, keputusan hukum, dan adab Nabi.',
	'Mengajarkan fiqih ke pusat ilmu: Madinah, Makkah, Kufah, Basrah, Syam, Mesir, dan Yaman.',
	'Menjadi teladan ijtihad, musyawarah, kepemimpinan, zuhud, keberanian, dan kepedulian sosial.',
	'Menghubungkan generasi tabi’in dengan sumber pertama wahyu dan sunnah.'
];

export const adabNotes = [
	'Membaca sejarah sahabat dengan ilmu, bukan kebencian.',
	'Membedakan kemuliaan generasi sahabat dan kenyataan bahwa mereka manusia yang berijtihad.',
	'Menghindari cercaan kepada sahabat, Ahlul Bait, dan generasi awal Islam.',
	'Menerima keutamaan Khulafaur Rasyidin secara berurutan sesuai ahlus sunnah.',
	'Menyerahkan perkara fitnah besar kepada kajian ulama yang adil dan menjaga lisan.',
	'Mengambil pelajaran akhlak: sidik, amanah, itsar, sabar, syura, dan pengorbanan.'
];
