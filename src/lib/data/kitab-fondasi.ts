import type { CuratedKitabMaterial } from './kitab-curated';

const SERIES_KEY = 'seri-fondasi-ilmu-santri';
const SERIES_TITLE = 'Seri Fondasi Ilmu Santri';
const UPDATED_AT = Date.UTC(2026, 3, 21);

export const fondasiKitabMaterials: CuratedKitabMaterial[] = [
	{
		slug: 'ilmu-tajwid-lengkap',
		title: 'Ilmu Tajwid Lengkap',
		category: 'quran-tahsin',
		seriesKey: SERIES_KEY,
		seriesTitle: SERIES_TITLE,
		seriesOrder: 1,
		summary:
			'Jalur Qur\'an/Tahsin yang diperluas dari PDF tajwid praktis: dimulai dari pengantar bunyi huruf, lalu bertahap ke nun sukun, mim sukun, idgham, lam ta\'rif, sampai mad.',
		description:
			'Materi ini disusun ulang dari daftar isi dan pembahasan awal PDF "Ilmu Tajwid Lengkap". Fokusnya bukan menyalin isi buku mentah, tetapi memecahnya menjadi tahapan belajar yang lebih mudah dipakai guru TPQ: pengantar ilmu tajwid, hukum nun sukun dan tanwin, hukum mim sukun, macam-macam idgham, lam ta\'rif, qalqalah, serta bab mad dan adab berhenti.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/ilmu-tajwid-lengkap.pdf',
		featured: true,
		updatedAt: UPDATED_AT,
		level: 'Pemula',
		duration: '6 modul',
		totalModules: 6,
		tags: ['Tajwid', 'Tahsin', 'Qur\'an', 'Makhraj', 'Mad'],
		sourceNote:
			'Modul dipetakan dari daftar isi dan bab utama PDF: pelajaran pendahuluan, nun sukun dan tanwin, mim sukun, ghunnah, macam idgham, lam ta\'rif, qalqalah, ha\' dhamir, dan mad.',
		chapterMap: [
			{
				id: 'tajwid-bab-1',
				title: 'Bab 1: Pelajaran Pendahuluan',
				summary:
					'Bab pembuka PDF menyiapkan fondasi tahsin sebelum masuk ke hukum bacaan rinci.',
				moduleSpan: 'Modul 1',
				subtopics: [
					'Definisi ilmu tajwid dan tujuan mempelajarinya',
					'Pengantar huruf hijaiyah, bunyi dasar, dan harakat',
					'Latihan membedakan bunyi huruf yang makhrajnya berdekatan'
				]
			},
			{
				id: 'tajwid-bab-2',
				title: 'Bab 2: Hukum Nun Sukun dan Tanwin I',
				summary:
					'Bab inti pertama PDF memulai hukum bacaan dari nun sukun dan tanwin yang paling sering ditemui saat tilawah.',
				moduleSpan: 'Modul 2',
				subtopics: [
					'Izhar halqi dan huruf-huruf tenggorokan',
					'Idgham bighunnah dan latihan dengung yang stabil',
					'Perbandingan bacaan jelas dan bacaan yang melebur'
				]
			},
			{
				id: 'tajwid-bab-3',
				title: 'Bab 3: Hukum Nun Sukun dan Tanwin II',
				summary:
					'Kelanjutan bab nun sukun di PDF membahas cabang yang paling sering salah dibaca oleh pemula.',
				moduleSpan: 'Modul 3',
				subtopics: [
					'Idgham bilaghunnah ketika bertemu lam dan ra\'',
					'Iqlab ketika nun sukun atau tanwin bertemu ba\'',
					'Ikhfa haqiqi dan latihan bunyi samar yang tidak hilang'
				]
			},
			{
				id: 'tajwid-bab-4',
				title: 'Bab 4: Mim Sukun, Ghunnah, dan Macam Idgham',
				summary:
					'Bab ini memindahkan fokus dari nun ke mim, lalu memperkenalkan pola idgham antarsesama huruf.',
				moduleSpan: 'Modul 4',
				subtopics: [
					'Idhar syafawi, ikhfa syafawi, dan idgham mimi',
					'Mim tasydid dan nun tasydid dengan ghunnah dua harakat',
					'Pengantar macam-macam idgham seperti mutamatsilain dan mutaqaribain'
				]
			},
			{
				id: 'tajwid-bab-5',
				title: 'Bab 5: Lam Ta\'rif dan Huruf-Huruf Khusus',
				summary:
					'Di bagian tengah PDF, hukum bacaan diperkaya dengan lam ta\'rif, qalqalah, dan pembeda bunyi tebal-tipis.',
				moduleSpan: 'Modul 5',
				subtopics: [
					'Lam qamariyah dan lam syamsiyah',
					'Qalqalah, ra\' tebal-tipis, dan lafzul jalalah',
					'Ha\' dhamir sebagai pengantar bacaan sambung'
				]
			},
			{
				id: 'tajwid-bab-6',
				title: 'Bab 6: Mad dan Adab Waqaf',
				summary:
					'Bab penutup PDF merangkum hukum panjang bacaan yang menjadi ukuran penting dalam tahsin.',
				moduleSpan: 'Modul 6',
				subtopics: [
					'Mad asli sebagai dasar semua bacaan panjang',
					'Mad far\'i yang sering muncul: wajib, jaiz, dan aridh lissukun',
					'Adab berhenti dan memulai bacaan bagi santri pemula'
				]
			}
		],
		objectives: [
			'Menguatkan fondasi bunyi huruf, harakat, dan tujuan belajar tajwid sebelum masuk ke hukum bacaan.',
			'Membedakan hukum nun sukun, tanwin, mim sukun, dan ghunnah secara bertahap.',
			'Memahami bab penting yang sering muncul saat tilawah: lam ta\'rif, qalqalah, ra\', lafzul jalalah, dan mad.',
			'Membiasakan murajaah melalui contoh, latihan lisan, dan koreksi tempo baca.'
		],
		modules: [
			{
				id: 'tajwid-1',
				title: 'Modul 1: Pelajaran Pendahuluan dan Bunyi Huruf',
				focus: 'Definisi ilmu tajwid, tujuan mempelajarinya, huruf hijaiyah, dan harakat dasar.',
				overview:
					'Bagian awal ini merapikan pondasi. Santri tidak langsung dibebani istilah cabang, tetapi diajak paham dulu apa itu tajwid, mengapa bacaan harus dijaga, serta bagaimana huruf dan harakat membentuk bunyi yang benar.',
				points: [
					'Ilmu tajwid menjaga lisan dari kesalahan membaca Al-Qur\'an.',
					'Pengantar huruf hijaiyah dan harakat membantu santri membedakan bunyi pendek, panjang, dan tempat keluarnya suara.',
					'Latihan dasar harus dimulai dari ketelitian mendengar dan menirukan bacaan, bukan terburu-buru mengejar banyak hukum.'
				],
				examples: [
					{ arabic: 'بَ - تَ - ثَ', translit: 'ba - ta - tsa', meaning: 'latihan bunyi huruf yang berdekatan' },
					{ arabic: 'الْحَمْدُ', translit: 'al-hamdu', meaning: 'contoh kata yang menuntut kejelasan bunyi huruf dan harakat' }
				],
				practice: [
					'Sebutkan tujuan belajar tajwid dengan bahasamu sendiri.',
					'Latih lima pasang huruf yang paling sering tertukar di kelas.',
					'Baca satu baris Al-Qur\'an perlahan dan tandai bunyi yang paling sulit.'
				]
			},
			{
				id: 'tajwid-2',
				title: 'Modul 2: Nun Sukun dan Tanwin I',
				focus: 'Izhar halqi dan idgham bighunnah.',
				overview:
					'PDF sumber menempatkan bab nun sukun dan tanwin sebagai pembuka inti tajwid. Di modul ini santri mulai belajar melihat pertemuan huruf dan memahami kapan bunyi nun harus dibaca jelas, dan kapan harus dimasukkan dengan dengung.',
				points: [
					'Izhar halqi dibaca jelas karena huruf sesudahnya keluar dari tenggorokan.',
					'Idgham bighunnah memasukkan nun sukun atau tanwin ke huruf tertentu dengan dengung yang terjaga.',
					'Latihan yang baik harus selalu membandingkan contoh izhar dan idgham supaya telinga santri cepat peka.'
				],
				examples: [
					{ arabic: 'مِنْ آمَنَ', translit: 'min amana', meaning: 'contoh izhar halqi karena nun sukun bertemu hamzah' },
					{ arabic: 'مِنْ وَالٍ', translit: 'miw walin', meaning: 'contoh idgham bighunnah saat nun sukun bertemu wau' }
				],
				practice: [
					'Kelompokkan 10 contoh ke izhar halqi atau idgham bighunnah.',
					'Baca dua contoh izhar dan dua contoh idgham dengan tempo lambat.',
					'Latih dengung secukupnya tanpa memperpanjang bunyi melebihi batas.'
				]
			},
			{
				id: 'tajwid-3',
				title: 'Modul 3: Nun Sukun dan Tanwin II',
				focus: 'Idgham bilaghunnah, iqlab, dan ikhfa haqiqi.',
				overview:
					'Setelah mengenal dua hukum awal, santri dibawa ke cabang yang lebih sering menimbulkan kesalahan: idgham tanpa dengung, perubahan bunyi menjadi mim pada iqlab, dan pembacaan samar pada ikhfa.',
				points: [
					'Idgham bilaghunnah terjadi ketika nun sukun atau tanwin bertemu lam atau ra\' tanpa dengung.',
					'Iqlab mengubah bunyi nun sukun atau tanwin menjadi mim ketika bertemu ba\'.',
					'Ikhfa haqiqi menuntut keseimbangan antara kejelasan dan kesamaran bacaan.'
				],
				examples: [
					{ arabic: 'مِنْ رَبِّهِمْ', translit: 'mir rabbihim', meaning: 'contoh idgham bilaghunnah saat nun sukun bertemu ra\'' },
					{ arabic: 'أَنْبِئْهُمْ', translit: "ambi'hum", meaning: 'contoh iqlab karena nun sukun bertemu ba\'' }
				],
				practice: [
					'Bandingkan idgham dengan dengung dan tanpa dengung menggunakan pasangan contoh.',
					'Cari tiga contoh iqlab dan tiga contoh ikhfa dalam mushaf.',
					'Latih posisi bibir saat iqlab agar bunyinya benar-benar berubah menjadi mim.'
				]
			},
			{
				id: 'tajwid-4',
				title: 'Modul 4: Mim Sukun, Ghunnah, dan Macam Idgham',
				focus: 'Idhar syafawi, ikhfa syafawi, idgham mimi, mim dan nun tasydid, serta pengantar idgham mutamatsilain.',
				overview:
					'Bab ini memperluas perhatian santri dari nun ke mim. Guru dapat memakai modul ini untuk menunjukkan bahwa pola pertemuan huruf tidak hanya terjadi pada nun, tetapi juga pada mim sukun dan huruf-huruf yang makhrajnya berdekatan.',
				points: [
					'Idhar syafawi, ikhfa syafawi, dan idgham mimi adalah kunci membaca mim sukun dengan rapi.',
					'Mim tasydid dan nun tasydid dibaca dengan ghunnah yang stabil, tidak terlalu pendek dan tidak berlebihan.',
					'Macam idgham antarhuruf membantu santri memahami kenapa beberapa huruf melebur atau mendekat dalam bacaan.'
				],
				examples: [
					{ arabic: 'لَهُمْ مَا', translit: 'lahum ma', meaning: 'contoh idgham mimi ketika mim sukun bertemu mim' },
					{ arabic: 'ثُمَّ', translit: 'thumma', meaning: 'contoh mim tasydid yang dibaca dengan ghunnah' }
				],
				practice: [
					'Buat tabel sederhana: mim sukun dibaca jelas, samar, atau masuk.',
					'Latih bacaan ghunnah selama dua harakat pada mim dan nun tasydid.',
					'Cari contoh idgham mutamatsilain sederhana dari pelajaran tajwid.'
				]
			},
			{
				id: 'tajwid-5',
				title: 'Modul 5: Lam Ta\'rif, Qalqalah, dan Huruf Tebal-Tipis',
				focus: 'Lam qamariyah, lam syamsiyah, qalqalah, ra\', dan lafzul jalalah.',
				overview:
					'Di tahap ini santri mulai belajar tanda-tanda yang sangat sering muncul di mushaf: lam ta\'rif pada alif-lam, pantulan huruf qalqalah, serta kapan bunyi ra\' dan lafzul jalalah dibaca tebal atau tipis.',
				points: [
					'Lam qamariyah dibaca jelas, sedangkan lam syamsiyah melebur ke huruf sesudahnya.',
					'Qalqalah menuntut pantulan yang jelas pada huruf tertentu ketika sukun.',
					'Tafkhim dan tarqiq pada ra\' serta lafzul jalalah membentuk warna bunyi yang khas dalam tilawah.'
				],
				examples: [
					{ arabic: 'الْقَمَرُ', translit: 'al-qamaru', meaning: 'contoh lam qamariyah' },
					{ arabic: 'الشَّمْسُ', translit: 'asy-syamsu', meaning: 'contoh lam syamsiyah yang melebur' }
				],
				practice: [
					'Pisahkan 10 kata menjadi kelompok qamariyah dan syamsiyah.',
					'Latih bunyi qalqalah pada huruf qaf, tha, ba, jim, dan dal.',
					'Bandingkan contoh ra\' tebal dan ra\' tipis dari ayat yang sudah dikenal.'
				]
			},
			{
				id: 'tajwid-6',
				title: 'Modul 6: Bab Mad dan Adab Berhenti',
				focus: 'Mad asli, mad far\'i yang sering muncul, dan kebiasaan berhenti yang aman untuk pemula.',
				overview:
					'Bab mad adalah penutup besar dalam PDF sumber. Di halaman edukasi ini, mad diringkas menjadi jalur yang lebih mudah: panjang dua harakat, mad wajib, mad jaiz, mad aridh lissukun, lalu ditutup dengan latihan berhenti yang tidak memutus makna secara sembarangan.',
				points: [
					'Mad asli adalah pintu masuk memahami semua bacaan panjang.',
					'Mad far\'i perlu dibedakan berdasarkan sebab hamzah atau sukun.',
					'Waqaf yang baik membantu santri menjaga makna dan irama bacaan.'
				],
				examples: [
					{ arabic: 'قَالُوا', translit: 'qalu', meaning: 'contoh mad asli pada huruf panjang' },
					{ arabic: 'الضَّالِّينَ', translit: 'ad-dallin', meaning: 'contoh bacaan panjang yang perlu dijaga ukurannya' }
				],
				practice: [
					'Beri tanda pada mad asli dan mad far\'i dari satu halaman bacaan.',
					'Baca satu ayat dengan hitungan dua harakat lalu koreksi panjang-pendeknya.',
					'Coba berhenti di akhir ayat dan bedakan dengan berhenti di tengah kalimat.'
				]
			}
		],
		glossary: [
			{ term: 'izhar halqi', meaning: 'membaca nun sukun atau tanwin dengan jelas karena bertemu huruf halqi' },
			{ term: 'idgham bighunnah', meaning: 'memasukkan bunyi nun sukun atau tanwin dengan dengung' },
			{ term: 'iqlab', meaning: 'mengubah bunyi nun sukun atau tanwin menjadi mim ketika bertemu ba\'' },
			{ term: 'ikhfa syafawi', meaning: 'membaca mim sukun secara samar ketika bertemu ba\'' },
			{ term: 'qalqalah', meaning: 'pantulan suara pada huruf tertentu ketika sukun' },
			{ term: 'tafkhim', meaning: 'membaca huruf dengan suara tebal' },
			{ term: 'tarqiq', meaning: 'membaca huruf dengan suara tipis' },
			{ term: 'mad', meaning: 'bacaan panjang pada huruf tertentu' }
		]
	},
	{
		slug: 'terjemah-aqidatul-awam',
		title: 'Terjemah Akidatul Awam',
		category: 'aqidah',
		seriesKey: SERIES_KEY,
		seriesTitle: SERIES_TITLE,
		seriesOrder: 2,
		summary:
			'Jalur aqidah dasar yang diperluas menjadi unit belajar bertahap: mulai dari tauhid dan syahadat, lalu sifat Allah, sifat rasul, sam\'iyyat, hingga adab mencintai Nabi dan menjaga iman.',
		description:
			'PDF "Terjemah Akidatul Awam" di mesin ini tidak memiliki text layer yang bisa diekstrak langsung, sehingga struktur modul disusun mengikuti urutan tema pokok yang lazim diajarkan dari matan tersebut: tauhid, sifat-sifat Allah, sifat para rasul, perkara sam\'iyyat, dan adab cinta Nabi. Hasilnya tetap diarahkan menjadi halaman edukasi yang lebih lengkap dan bertahap untuk anak TPQ.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/terjemah-aqidatul-awam.pdf',
		featured: true,
		updatedAt: UPDATED_AT,
		level: 'Dasar',
		duration: '7 modul',
		totalModules: 7,
		tags: ['Aqidah', 'Tauhid', 'Sifat Allah', 'Rasul', 'Iman'],
		sourceNote:
			'Karena PDF sumber berupa scan tanpa text layer, pemetaan modul mengikuti urutan tema inti Aqidatul Awam dan dirapikan menjadi pelajaran web-native yang bisa diajarkan bertahap.',
		chapterMap: [
			{
				id: 'aqidah-bab-1',
				title: 'Bab 1: Muqaddimah Tauhid dan Syahadat',
				summary:
					'Bagian pembuka direkonstruksi dari urutan tema Aqidatul Awam: tauhid lebih dulu, lalu pengakuan iman melalui syahadat.',
				moduleSpan: 'Modul 1',
				subtopics: [
					'Makna aqidah sebagai pondasi ibadah',
					'Syahadat tahlil dan syahadat risalah',
					'Hubungan tauhid dengan niat, doa, dan ibadah'
				]
			},
			{
				id: 'aqidah-bab-2',
				title: 'Bab 2: Sifat Nafsiyyah dan Salbiyyah',
				summary:
					'Bab tema ini menata keyakinan dasar tentang keberadaan Allah dan penafian kekurangan dari-Nya.',
				moduleSpan: 'Modul 2',
				subtopics: [
					'Wujud sebagai sifat nafsiyyah',
					'Qidam, baqa, mukhalafatu lil hawadits',
					'Qiyamuhu binafsih dan wahdaniyyah'
				]
			},
			{
				id: 'aqidah-bab-3',
				title: 'Bab 3: Sifat Ma\'ani',
				summary:
					'Bab ini merekonstruksi bagian sifat-sifat kesempurnaan Allah yang biasa dijelaskan bertahap dalam matan Aqidatul Awam.',
				moduleSpan: 'Modul 3',
				subtopics: [
					'Qudrat dan iradat',
					'Ilmu dan hayat',
					'Sama\', basar, dan kalam'
				]
			},
			{
				id: 'aqidah-bab-4',
				title: 'Bab 4: Sifat Ma\'nawiyyah dan Tanzih',
				summary:
					'Bab ini menegaskan akibat logis dari sifat ma\'ani dan menjaga adab dalam mensucikan Allah dari penyerupaan.',
				moduleSpan: 'Modul 4',
				subtopics: [
					'Kaunuhu qadiran, muridan, aliman, hayyan',
					'Kaunuhu sami\'an, basiran, mutakalliman',
					'Tanzih: Allah tidak disifati dengan batas, bentuk, dan kelemahan makhluk'
				]
			},
			{
				id: 'aqidah-bab-5',
				title: 'Bab 5: Sifat Rasul',
				summary:
					'Bab kenabian mengalihkan pembahasan dari sifat Allah ke sifat wajib, mustahil, dan jaiz bagi para rasul.',
				moduleSpan: 'Modul 5',
				subtopics: [
					'Shiddiq, amanah, tabligh, dan fathanah',
					'Lawan-lawan sifat wajib rasul',
					'Jaiz bagi rasul pada sisi kemanusiaan yang tidak merusak risalah'
				]
			},
			{
				id: 'aqidah-bab-6',
				title: 'Bab 6: Sam\'iyyat dan Rukun Iman',
				summary:
					'Bab ini menyusun ulang perkara gaib yang diterima berdasarkan wahyu agar cocok diajarkan bertahap di kelas dasar.',
				moduleSpan: 'Modul 6',
				subtopics: [
					'Iman kepada malaikat, kitab, dan rasul',
					'Iman kepada hari akhir',
					'Iman kepada qada dan qadar'
				]
			},
			{
				id: 'aqidah-bab-7',
				title: 'Bab 7: Mahabbah Nabi dan Penjagaan Iman',
				summary:
					'Bab penutup diarahkan ke buah aqidah: cinta Nabi, hormat kepada keluarga dan sahabat, serta menjaga iman dalam keseharian.',
				moduleSpan: 'Modul 7',
				subtopics: [
					'Shalawat sebagai wujud cinta Nabi',
					'Adab kepada Ahlul Bait dan sahabat',
					'Penjagaan iman melalui lisan, pergaulan, dan kebiasaan'
				]
			}
		],
		objectives: [
			'Mengenalkan aqidah sebagai fondasi ibadah, akhlak, dan cara berpikir santri.',
			'Membantu santri mengenal sifat wajib, mustahil, dan jaiz bagi Allah dan rasul dengan bahasa yang lebih ringan.',
			'Menghubungkan pokok-pokok iman dengan adab berdoa, bershalawat, dan menjaga hati.',
			'Membuat materi aqidah lebih mudah diulang melalui modul singkat, istilah inti, dan latihan lisan.'
		],
		modules: [
			{
				id: 'aqidah-1',
				title: 'Modul 1: Muqaddimah Tauhid dan Kalimat Syahadat',
				focus: 'Makna aqidah, mengapa tauhid dipelajari, dan posisi syahadat sebagai pintu iman.',
				overview:
					'Pelajaran dimulai dari pertanyaan paling dasar: mengapa santri harus belajar aqidah. Di tahap ini, syahadat dikenalkan bukan hanya sebagai kalimat yang dihafal, tetapi sebagai pengakuan iman yang membentuk seluruh amal.',
				points: [
					'Aqidah adalah pondasi sebelum santri melangkah ke fiqih, ibadah, dan akhlak.',
					'Syahadat menegaskan siapa yang disembah dan siapa rasul yang diikuti.',
					'Tauhid yang benar akan mempengaruhi niat, doa, rasa takut, dan harapan kepada Allah.'
				],
				examples: [
					{ arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', translit: 'la ilaha illallah', meaning: 'tidak ada ilah yang berhak disembah selain Allah' },
					{ arabic: 'مُحَمَّدٌ رَسُولُ اللّٰهِ', translit: 'muhammadur rasulullah', meaning: 'Muhammad adalah utusan Allah' }
				],
				practice: [
					'Jelaskan perbedaan antara sekadar hafal syahadat dan memahami maknanya.',
					'Sebutkan tiga contoh ibadah yang hanya boleh ditujukan kepada Allah.',
					'Latih membaca syahadat dengan tartib dan penuh penghayatan.'
				]
			},
			{
				id: 'aqidah-2',
				title: 'Modul 2: Sifat Nafsiyyah dan Salbiyyah',
				focus: 'Wujud, qidam, baqa, mukhalafatuhu lil hawadits, qiyamuhu binafsih, dan wahdaniyyah.',
				overview:
					'Di modul ini santri mulai mengenal sifat-sifat dasar yang menegaskan keagungan Allah dan menafikan segala kekurangan dari-Nya. Istilah disederhanakan agar anak tetap bisa menangkap maknanya tanpa tenggelam dalam debat yang berat.',
				points: [
					'Allah itu ada, tidak diawali, tidak diakhiri, dan tidak serupa dengan makhluk.',
					'Allah berdiri sendiri, tidak membutuhkan tempat, penolong, atau penyangga.',
					'Ke-Esa-an Allah harus tampak dalam keyakinan, ibadah, dan pengharapan.'
				],
				examples: [
					{ arabic: 'اللّٰهُ مَوْجُودٌ', translit: 'allahu mawjudun', meaning: 'Allah itu ada' },
					{ arabic: 'لَيْسَ كَمِثْلِهِ شَيْءٌ', translit: 'laysa kamitslihi syaiun', meaning: 'tidak ada sesuatu pun yang serupa dengan-Nya' }
				],
				practice: [
					'Terangkan dengan bahasa sederhana apa arti Allah tidak serupa dengan makhluk.',
					'Sebutkan satu dampak tauhid terhadap cara berdoa.',
					'Latih pengucapan istilah pokok sambil menjelaskan makna ringkasnya.'
				]
			},
			{
				id: 'aqidah-3',
				title: 'Modul 3: Sifat Ma\'ani',
				focus: 'Qudrat, iradat, ilmu, hayat, sama\', basar, dan kalam.',
				overview:
					'Setelah sifat dasar dipahami, santri dibawa mengenal sifat-sifat yang menunjukkan kesempurnaan kekuasaan dan pengetahuan Allah. Guru dapat memakai modul ini untuk menumbuhkan rasa diawasi dan disayangi Allah tanpa menumbuhkan rasa sempit atau takut yang keliru.',
				points: [
					'Allah Maha Kuasa dan kehendak-Nya meliputi seluruh makhluk.',
					'Allah Maha Mengetahui, Maha Mendengar, dan Maha Melihat tanpa keterbatasan seperti makhluk.',
					'Belajar sifat ma\'ani melatih santri untuk lebih jujur dan hati-hati dalam perilaku harian.'
				],
				examples: [
					{ arabic: 'وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', translit: 'wa huwa ala kulli syaiin qadir', meaning: 'Dia Maha Kuasa atas segala sesuatu' },
					{ arabic: 'إِنَّ اللّٰهَ سَمِيعٌ بَصِيرٌ', translit: 'inna allaha samiun basir', meaning: 'sesungguhnya Allah Maha Mendengar lagi Maha Melihat' }
				],
				practice: [
					'Sebutkan sifat ma\'ani satu per satu lalu kaitkan dengan adab keseharian.',
					'Cerita singkatkan satu keadaan ketika kamu merasa Allah selalu melihatmu.',
					'Pilih satu doa yang menunjukkan pengakuan kepada ilmu dan kuasa Allah.'
				]
			},
			{
				id: 'aqidah-4',
				title: 'Modul 4: Sifat Ma\'nawiyyah dan Adab Tanzih',
				focus: 'Kaunuhu qadiran dan kawan-kawannya, serta menjaga keyakinan agar tidak menyerupakan Allah dengan makhluk.',
				overview:
					'Modul ini berfungsi sebagai penguat. Santri diajak memahami bahwa sifat ma\'nawiyyah menegaskan konsekuensi dari sifat ma\'ani: karena Allah berkuasa, maka pasti Dia Maha Berkuasa; karena Allah berilmu, maka pasti Dia Maha Mengetahui, dan seterusnya.',
				points: [
					'Sifat ma\'nawiyyah membantu santri melihat hubungan antara istilah aqidah dan maknanya.',
					'Tanzih berarti mensucikan Allah dari bentuk, arah, dan kelemahan makhluk.',
					'Aqidah yang benar menjaga lisan dari ucapan yang sembrono tentang Allah.'
				],
				examples: [
					{ arabic: 'اللّٰهُ قَادِرٌ', translit: 'allahu qadirun', meaning: 'Allah Maha Berkuasa' },
					{ arabic: 'اللّٰهُ عَلِيمٌ', translit: 'allahu alimun', meaning: 'Allah Maha Mengetahui' }
				],
				practice: [
					'Hubungkan satu sifat ma\'ani dengan satu sifat ma\'nawiyyah yang sesuai.',
					'Jelaskan mengapa Allah tidak boleh dibayangkan seperti makhluk.',
					'Latih menyebut sifat Allah dengan adab dan suara yang tenang.'
				]
			},
			{
				id: 'aqidah-5',
				title: 'Modul 5: Sifat Wajib, Mustahil, dan Jaiz bagi Rasul',
				focus: 'Shiddiq, amanah, tabligh, fathanah, serta lawan-lawan sifat tersebut.',
				overview:
					'Di tahap ini santri dipindahkan dari pembahasan ketuhanan ke pembahasan kenabian. Modul ini penting agar cinta kepada Nabi berdiri di atas keyakinan yang benar tentang tugas dan sifat para rasul.',
				points: [
					'Rasul harus jujur, amanah, menyampaikan wahyu, dan cerdas.',
					'Lawan dari sifat-sifat tersebut mustahil ada pada rasul karena akan merusak risalah.',
					'Jaiz bagi rasul adalah sifat-sifat manusiawi yang tidak mengurangi kehormatan kenabian.'
				],
				examples: [
					{ arabic: 'الصِّدْقُ', translit: 'ash-shidqu', meaning: 'jujur' },
					{ arabic: 'الأَمَانَةُ', translit: 'al-amanah', meaning: 'menjaga amanah' }
				],
				practice: [
					'Sebutkan empat sifat wajib rasul dan satu contoh perilaku yang meneladaninya.',
					'Jelaskan mengapa berdusta mustahil bagi rasul.',
					'Buat satu kalimat pendek tentang amanah Nabi dalam menyampaikan wahyu.'
				]
			},
			{
				id: 'aqidah-6',
				title: 'Modul 6: Sam\'iyyat dan Rukun Iman',
				focus: 'Iman kepada malaikat, kitab, rasul, hari akhir, dan qada qadar.',
				overview:
					'Modul ini merapikan perkara-perkara yang diterima berdasarkan wahyu. Tujuannya bukan memperbanyak rincian yang sulit, tetapi menanamkan keyakinan yang membuahkan rasa takut, harap, sabar, dan syukur.',
				points: [
					'Rukun iman merangkum pokok keyakinan yang wajib dipegang seorang muslim.',
					'Perkara gaib diterima dengan hormat kepada wahyu, bukan dengan spekulasi yang liar.',
					'Iman kepada hari akhir dan takdir membentuk sikap sabar, jujur, dan bertanggung jawab.'
				],
				examples: [
					{ arabic: 'آمَنْتُ بِمَلَائِكَتِهِ وَكُتُبِهِ', translit: "amantu bimala'ikatihi wa kutubihi", meaning: 'aku beriman kepada malaikat-Nya dan kitab-kitab-Nya' },
					{ arabic: 'وَبِالْيَوْمِ الْآخِرِ', translit: 'wa bil-yawmil akhir', meaning: 'dan kepada hari akhir' }
				],
				practice: [
					'Sebutkan rukun iman dari hafalan lalu jelaskan makna singkat masing-masing.',
					'Ceritakan satu akhlak yang lahir dari keyakinan kepada hari akhir.',
					'Latih kalimat pengakuan iman dengan lafaz yang tertib.'
				]
			},
			{
				id: 'aqidah-7',
				title: 'Modul 7: Cinta Nabi, Keluarga, Sahabat, dan Adab Menjaga Iman',
				focus: 'Shalawat, hormat kepada Ahlul Bait dan sahabat, serta penjagaan iman dalam kebiasaan harian.',
				overview:
					'Penutup aqidah diarahkan ke rasa cinta yang benar. Santri diajak membiasakan shalawat, menghormati keluarga dan sahabat Nabi, serta menjaga lisan dan hati agar aqidah tidak berhenti pada istilah saja.',
				points: [
					'Cinta kepada Nabi harus tampak dalam shalawat, adab, dan ketaatan.',
					'Menghormati keluarga Nabi dan sahabat adalah bagian dari akhlak ahli sunnah.',
					'Aqidah yang sehat memengaruhi cara berbicara, memilih teman, dan menyikapi ujian.'
				],
				examples: [
					{ arabic: 'اللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ', translit: 'allahumma shalli ala muhammad', meaning: 'ya Allah limpahkan shalawat kepada Muhammad' },
					{ arabic: 'رَضِيَ اللّٰهُ عَنْهُمْ', translit: 'radhiyallahu anhum', meaning: 'semoga Allah meridhai mereka' }
				],
				practice: [
					'Biasakan shalawat pendek setiap selesai belajar.',
					'Jelaskan satu alasan mengapa kita mencintai Nabi dan para sahabat.',
					'Tulis tiga kebiasaan kecil yang membantu menjaga iman sehari-hari.'
				]
			}
		],
		glossary: [
			{ term: 'tauhid', meaning: 'mengesakan Allah dalam keyakinan, ibadah, dan pengagungan' },
			{ term: 'tanzih', meaning: 'mensucikan Allah dari sifat kekurangan dan penyerupaan dengan makhluk' },
			{ term: 'sifat ma\'ani', meaning: 'sifat-sifat kesempurnaan seperti qudrat, iradat, ilmu, hayat, sama\', basar, dan kalam' },
			{ term: 'sifat ma\'nawiyyah', meaning: 'penegasan bahwa Allah benar-benar bersifat dengan sifat ma\'ani tersebut' },
			{ term: 'sam\'iyyat', meaning: 'perkara gaib yang diterima berdasarkan wahyu' },
			{ term: 'shiddiq', meaning: 'jujur dan benar, salah satu sifat wajib rasul' },
			{ term: 'amanah', meaning: 'terpercaya dalam memegang dan menyampaikan risalah' },
			{ term: 'ahlul bait', meaning: 'keluarga Nabi yang dihormati dalam Islam' }
		]
	},
	{
		slug: 'safinatun-najah-makna-perkata',
		title: 'Safinatun Najah Makna Perkata',
		category: 'fiqih',
		seriesKey: SERIES_KEY,
		seriesTitle: SERIES_TITLE,
		seriesOrder: 3,
		summary:
			'Fiqih dasar mazhab Syafi\'i yang kini dipecah menjadi jalur belajar lebih lengkap: dari rukun iman dan baligh, lalu istinja dan bersuci, sampai shalat, Jumat, puasa, haji, dan jenazah.',
		description:
			'Struktur modul ini dipetakan dari fasal-fasal awal PDF "Safinatun Najah Makna Perkata" yang masih bisa dibaca cukup jelas pada judul-judul pembahasan: rukun iman, syarat istinja, pengertian niat, sebab mandi, wudhu, tayammum, najis, haid-nifas, rukun shalat, syarat sujud, syarat makmum, syarat Jumat, dua khutbah, hingga memandikan mayat dan shalat jenazah.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/safinatun-najah-makna-perkata.pdf',
		featured: true,
		updatedAt: UPDATED_AT,
		level: 'Dasar',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Fiqih', 'Syafi\'i', 'Thaharah', 'Shalat', 'Puasa'],
		sourceNote:
			'Modul dipetakan dari judul-judul fasal pada PDF: rukun iman, istinja, niat, mandi, wudhu, tayammum, najis, haid-nifas, rukun shalat, syarat sujud, waktu shalat, jamaah, Jumat, khutbah, puasa, dan janazah.',
		chapterMap: [
			{
				id: 'fiqih-bab-1',
				title: 'Bab 1: Rukun Islam, Rukun Iman, dan Tanda Baligh',
				summary:
					'Bagian awal PDF meletakkan fondasi taklif sebelum fiqih ibadah diperinci lebih jauh.',
				moduleSpan: 'Modul 1',
				subtopics: [
					'Rukun Islam sebagai pondasi amal',
					'Rukun iman sebagai dasar keyakinan',
					'Tanda baligh dan mulai berlakunya beban syariat'
				]
			},
			{
				id: 'fiqih-bab-2',
				title: 'Bab 2: Istinja, Niat, dan Adab Bersuci',
				summary:
					'Fasal-fasal awal thaharah di PDF membahas pembersihan dasar sebelum ibadah.',
				moduleSpan: 'Modul 2',
				subtopics: [
					'Syarat istinja dan alat bersuci yang dipakai',
					'Pengertian niat dan letaknya di dalam hati',
					'Adab kebersihan sebelum wudhu dan shalat'
				]
			},
			{
				id: 'fiqih-bab-3',
				title: 'Bab 3: Mandi Wajib dan Wudhu',
				summary:
					'Bab ini memuat fasal yang paling sering diajarkan di TPQ dan madrasah dasar: mandi wajib serta rukun wudhu.',
				moduleSpan: 'Modul 3',
				subtopics: [
					'Perkara yang mewajibkan mandi',
					'Fardu wudhu dan sunnah-sunnahnya',
					'Larangan bagi orang yang masih berhadas'
				]
			},
			{
				id: 'fiqih-bab-4',
				title: 'Bab 4: Tayammum, Najis, dan Darah Kebiasaan',
				summary:
					'Bab tengah PDF memperluas pembahasan bersuci ke kondisi uzur dan masalah kenajisan.',
				moduleSpan: 'Modul 4',
				subtopics: [
					'Sebab dan syarat tayammum',
					'Jenis najis dan cara menyucikannya',
					'Pengantar haid, nifas, dan darah kebiasaan'
				]
			},
			{
				id: 'fiqih-bab-5',
				title: 'Bab 5: Syarat, Rukun, dan Bacaan Shalat',
				summary:
					'Fasal shalat di PDF cukup rinci dan menjadi inti jalur fiqih dasar kitab ini.',
				moduleSpan: 'Modul 5',
				subtopics: [
					'Syarat shalat dan pembukaan takbiratul ihram',
					'Rukun shalat, sujud, dan thuma\'ninah',
					'Ketelitian Al-Fatihah dan tasyahhud'
				]
			},
			{
				id: 'fiqih-bab-6',
				title: 'Bab 6: Waktu Shalat, Jamaah, dan Makmum',
				summary:
					'Bab ini menyambungkan shalat pribadi ke shalat berjamaah dan pengaturan waktunya.',
				moduleSpan: 'Modul 6',
				subtopics: [
					'Awal waktu-waktu shalat',
					'Syarat mengikut imam dan tertib jamaah',
					'Pengantar jama\' ta\'khir pada kondisi tertentu'
				]
			},
			{
				id: 'fiqih-bab-7',
				title: 'Bab 7: Jumat dan Dua Khutbah',
				summary:
					'Bagian sosial ibadah di PDF dibangun lewat fasal Jumat dan syarat khutbah.',
				moduleSpan: 'Modul 7',
				subtopics: [
					'Syarat wajib dan sah Jumat',
					'Syarat dua khutbah dan tertibnya',
					'Adab hadir di masjid dan mendengarkan khutbah'
				]
			},
			{
				id: 'fiqih-bab-8',
				title: 'Bab 8: Puasa, Haji, dan Janazah',
				summary:
					'Bab penutup PDF merangkum ibadah tahunan dan kewajiban kolektif terhadap muslim yang wafat.',
				moduleSpan: 'Modul 8',
				subtopics: [
					'Hal-hal yang membatalkan puasa',
					'Pengantar rukun dan kewajiban haji',
					'Memandikan mayat dan rukun shalat jenazah'
				]
			}
		],
		objectives: [
			'Membuat jalur fiqih dasar yang lebih bertahap bagi santri TPQ dan kelas pemula.',
			'Membiasakan santri membedakan mana pengantar, mana syarat, mana rukun, dan mana pembatal.',
			'Menghubungkan kitab dasar dengan praktik nyata: wudhu, shalat, puasa, Jumat, dan adab jenazah.',
			'Menjaga supaya pengajaran fiqih tidak berhenti pada hafalan istilah, tetapi mudah dipraktikkan.'
		],
		modules: [
			{
				id: 'fiqih-1',
				title: 'Modul 1: Mukadimah Iman, Islam, dan Tanda Baligh',
				focus: 'Rukun iman, rukun Islam, dan pengantar taklif sebelum masuk ke bab thaharah.',
				overview:
					'Safinatun Najah tidak berdiri di ruang kosong. Sebelum masuk ke hukum-hukum praktis, santri perlu tahu siapa yang sudah terkena beban syariat dan apa pondasi iman serta Islam yang harus dijaga.',
				points: [
					'Rukun Islam dan rukun iman menjadi bingkai dasar sebelum belajar rincian fiqih.',
					'Tanda baligh penting karena berkaitan dengan mulai berlakunya kewajiban ibadah.',
					'Fiqih yang benar berangkat dari iman yang benar dan kesiapan menerima beban syariat.'
				],
				examples: [
					{ arabic: 'بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ', translit: 'buniyal islamu ala khamsin', meaning: 'Islam dibangun di atas lima perkara' },
					{ arabic: 'الْبُلُوغُ', translit: 'al-bulugh', meaning: 'masa mencapai beban syariat' }
				],
				practice: [
					'Sebutkan lima rukun Islam dan enam rukun iman.',
					'Jelaskan kenapa baligh penting dalam pembahasan fiqih.',
					'Bedakan perkara yang wajib bagi anak kecil dan orang yang sudah baligh.'
				]
			},
			{
				id: 'fiqih-2',
				title: 'Modul 2: Istinja, Niat, dan Adab Bersuci',
				focus: 'Syarat istinja, pengertian niat, dan awal pembiasaan thaharah.',
				overview:
					'Bab-bab awal Safinah menunjukkan bahwa ibadah yang sah dimulai dari kebiasaan bersih yang benar. Modul ini cocok dipakai untuk anak karena sangat dekat dengan praktik harian di rumah dan di masjid.',
				points: [
					'Istinja bukan sekadar membersihkan, tetapi mensucikan tempat keluar najis sesuai syariat.',
					'Niat memberi arah pada amal dan letaknya di dalam hati.',
					'Adab bersuci melatih kerapian, keseriusan, dan rasa hormat terhadap ibadah.'
				],
				examples: [
					{ arabic: 'الاِسْتِنْجَاءُ', translit: "al-istinja'", meaning: 'membersihkan najis dari qubul dan dubur' },
					{ arabic: 'النِّيَّةُ', translit: 'an-niyyah', meaning: 'maksud hati ketika melakukan amal' }
				],
				practice: [
					'Jelaskan perbedaan membersihkan biasa dan istinja menurut syariat.',
					'Latih mengucapkan maksud wudhu dan shalat tanpa menjadikan lisan sebagai inti niat.',
					'Buat daftar adab bersuci yang harus dijaga sebelum shalat.'
				]
			},
			{
				id: 'fiqih-3',
				title: 'Modul 3: Mandi Wajib, Hadas Besar, dan Wudhu',
				focus: 'Sebab mandi, fardu wudhu, sunnah wudhu, dan larangan bagi orang berhadas.',
				overview:
					'Modul ini mengambil rangka utama dari fasal-fasal yang paling sering diajarkan: perkara yang mewajibkan mandi, wudhu sebagai pintu shalat, dan apa saja yang tidak boleh dilakukan saat seseorang masih berhadas.',
				points: [
					'Santri perlu bisa membedakan hadas besar dan hadas kecil sejak awal.',
					'Fardu wudhu harus dikuasai lebih dulu sebelum detail-detail sunnahnya.',
					'Larangan bagi orang berhadas menunjukkan betapa syariat menjaga kesucian ibadah.'
				],
				examples: [
					{ arabic: 'مُوجِبَاتُ الْغُسْلِ', translit: 'mujibatul ghusl', meaning: 'perkara-perkara yang mewajibkan mandi' },
					{ arabic: 'فُرُوضُ الْوُضُوءِ', translit: "furudul wudhu'", meaning: 'rukun-rukun wudhu' }
				],
				practice: [
					'Urutkan fardu wudhu dari awal sampai akhir.',
					'Sebutkan tiga keadaan yang mewajibkan mandi wajib.',
					'Jelaskan dua larangan bagi orang yang masih berhadas kecil.'
				]
			},
			{
				id: 'fiqih-4',
				title: 'Modul 4: Tayammum, Najis, dan Darah Kebiasaan',
				focus: 'Sebab tayammum, syarat-syaratnya, jenis najis, serta pengantar haid dan nifas.',
				overview:
					'Bagian ini memperluas konsep bersuci. Santri diajak memahami bahwa syariat memberi jalan keluar ketika air tidak ada atau tidak bisa dipakai, sekaligus mengenalkan jenis najis dan darah kebiasaan yang sering menjadi pertanyaan di kelas lanjutan.',
				points: [
					'Tayammum adalah keringanan syariat, tetapi tetap memiliki syarat dan tertib.',
					'Najis perlu dibedakan dari sekadar kotor agar santri tidak salah dalam praktik.',
					'Pembahasan haid dan nifas dikenalkan seperlunya sebagai dasar fiqih keluarga dan ibadah.'
				],
				examples: [
					{ arabic: 'أَسْبَابُ التَّيَمُّمِ', translit: "asbabut tayammum", meaning: 'sebab-sebab dibolehkannya tayammum' },
					{ arabic: 'النَّجَاسَةُ', translit: 'an-najasah', meaning: 'benda najis yang menghalangi kesucian ibadah' }
				],
				practice: [
					'Sebutkan kapan tayammum boleh dilakukan.',
					'Kelompokkan contoh najis ke kategori ringan, sedang, atau berat sesuai pengantar yang diajarkan guru.',
					'Diskusikan mengapa bersuci tetap penting meskipun syariat memberi rukhsah.'
				]
			},
			{
				id: 'fiqih-5',
				title: 'Modul 5: Syarat dan Rukun Shalat',
				focus: 'Niat, takbir, Al-Fatihah, ruku\', sujud, tasyahhud, dan bacaan pokok shalat.',
				overview:
					'Fasal-fasal shalat di Safinah sangat rinci, termasuk jumlah tasydid pada bacaan penting. Dalam halaman edukasi ini, inti pembahasannya dirapikan menjadi jalur belajar yang mudah diulang sambil tetap menjaga keseriusan bacaan.',
				points: [
					'Shalat menuntut kesatuan antara syarat, rukun, bacaan, dan thuma\'ninah.',
					'Pembahasan niat dan takbiratul ihram perlu dilatih sampai santri memahami makna dan tertibnya.',
					'Ketelitian pada Al-Fatihah dan tasyahhud menunjukkan bahwa fiqih shalat juga terkait dengan kualitas bacaan.'
				],
				examples: [
					{ arabic: 'أَرْكَانُ الصَّلَاةِ', translit: 'arkanus shalah', meaning: 'rukun-rukun shalat' },
					{ arabic: 'شُرُوطُ السُّجُودِ', translit: "syurutus sujud", meaning: 'syarat-syarat sujud yang benar' }
				],
				practice: [
					'Urutkan rukun shalat dari niat sampai salam.',
					'Latih pembacaan Al-Fatihah dengan memperhatikan tasydid yang penting.',
					'Jelaskan fungsi thuma\'ninah dalam ruku\', i\'tidal, sujud, dan duduk.'
				]
			},
			{
				id: 'fiqih-6',
				title: 'Modul 6: Waktu Shalat, Jamaah, dan Makmum',
				focus: 'Awal waktu shalat, syarat berjamaah, syarat makmum, dan dasar jama\' ta\'khir.',
				overview:
					'Setelah shalat personal dipahami, santri dibawa ke shalat berjamaah dan pengaturan waktu. Ini penting agar mereka tidak hanya tahu gerakan, tetapi juga tahu kapan ibadah dilakukan dan bagaimana mengikuti imam dengan benar.',
				points: [
					'Waktu shalat adalah pintu sah atau tidaknya ibadah.',
					'Menjadi makmum memiliki syarat yang menjaga keteraturan jamaah.',
					'Pengantar jama\' mengajarkan bahwa syariat memiliki rukhsah dalam kondisi tertentu.'
				],
				examples: [
					{ arabic: 'شُرُوطُ الاقْتِدَاءِ', translit: "syurutul iqtida'", meaning: 'syarat sah mengikuti imam' },
					{ arabic: 'شُرُوطُ جَمْعِ التَّأْخِيرِ', translit: "syurutu jam'it ta'khir", meaning: 'syarat-syarat jama\' ta\'khir' }
				],
				practice: [
					'Sebutkan awal masuk waktu shalat yang paling sering kamu hafal.',
					'Jelaskan dua kesalahan umum makmum saat mengikuti imam.',
					'Bandingkan shalat sendiri dan shalat berjamaah dari sisi adab dan tertib.'
				]
			},
			{
				id: 'fiqih-7',
				title: 'Modul 7: Jumat, Khutbah, dan Fiqih Jamaah Umum',
				focus: 'Syarat Jumat, dua khutbah, dan kesiapan menghadiri ibadah bersama masyarakat.',
				overview:
					'Bagian ini menempatkan santri ke ruang sosial. Fiqih tidak berhenti pada ibadah pribadi, tetapi juga mengatur kehadiran muslim dalam ibadah bersama seperti Jumat dan khutbah.',
				points: [
					'Shalat Jumat memiliki syarat yang berbeda dari shalat berjamaah biasa.',
					'Khutbah bukan pelengkap semata, tetapi bagian penting dari ibadah Jumat.',
					'Adab hadir di masjid dan mendengarkan khutbah termasuk bagian dari pembelajaran fiqih.'
				],
				examples: [
					{ arabic: 'شُرُوطُ الْجُمُعَةِ', translit: "syurutul jumu'ah", meaning: 'syarat-syarat shalat Jumat' },
					{ arabic: 'شُرُوطُ الْخُطْبَتَيْنِ', translit: "syuruthul khutbatain", meaning: 'syarat-syarat dua khutbah' }
				],
				practice: [
					'Sebutkan hal yang membedakan Jumat dari shalat Zuhur biasa.',
					'Latih adab datang ke masjid sebelum khutbah.',
					'Jelaskan kenapa khutbah harus dijaga tertib dan tidak disela obrolan.'
				]
			},
			{
				id: 'fiqih-8',
				title: 'Modul 8: Puasa, Haji, dan Janazah',
				focus: 'Pembatal puasa, pengantar ibadah haji, memandikan mayat, dan shalat jenazah.',
				overview:
					'Modul penutup mengikat seluruh jalur fiqih dasar ke beberapa bab yang lebih luas: puasa, haji, dan janazah. Tujuannya bukan menuntaskan semua rincian, tetapi memperlihatkan peta fiqih ibadah secara utuh kepada santri.',
				points: [
					'Puasa mengajarkan penjagaan diri lahir dan batin, bukan sekadar menahan lapar.',
					'Haji dikenalkan sebagai ibadah besar bagi yang mampu, sehingga anak paham posisinya dalam rukun Islam.',
					'Bab jenazah membentuk rasa hormat kepada muslim yang wafat dan mengenalkan fardhu kifayah.'
				],
				examples: [
					{ arabic: 'مُفْطِرَاتُ الصِّيَامِ', translit: 'muftiratus siyam', meaning: 'hal-hal yang membatalkan puasa' },
					{ arabic: 'صَلَاةُ الْجَنَازَةِ', translit: 'shalatul janazah', meaning: 'shalat untuk mayat muslim' }
				],
				practice: [
					'Sebutkan tiga hal yang membatalkan puasa.',
					'Jelaskan mengapa pengurusan jenazah termasuk fardhu kifayah.',
					'Buat peta sederhana: thaharah, shalat, puasa, haji, lalu letakkan posisi masing-masing.'
				]
			}
		],
		glossary: [
			{ term: 'taklif', meaning: 'mulainya beban syariat pada seorang muslim' },
			{ term: 'istinja', meaning: 'membersihkan tempat keluar najis sesuai syariat' },
			{ term: 'hadas besar', meaning: 'keadaan yang mewajibkan mandi' },
			{ term: 'hadas kecil', meaning: 'keadaan yang mewajibkan wudhu' },
			{ term: 'tayammum', meaning: 'bersuci dengan debu suci saat ada uzur dari air' },
			{ term: 'thuma\'ninah', meaning: 'tenang sejenak pada setiap rukun shalat' },
			{ term: 'iqtida', meaning: 'mengikuti imam dalam shalat berjamaah' },
			{ term: 'fardhu kifayah', meaning: 'kewajiban kolektif yang gugur bila sebagian muslim telah melaksanakannya' }
		]
	},
	{
		slug: 'terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied',
		title: 'Terjemah Syarah Arba\'in Nawawiyah - Ibnu Daqiqil \'Ied',
		category: 'hadits',
		seriesKey: SERIES_KEY,
		seriesTitle: SERIES_TITLE,
		seriesOrder: 4,
		summary:
			'Jalur hadits yang diperluas dari pembahasan awal PDF: niat, Islam-Iman-Ihsan, rukun Islam, bid\'ah, halal-haram, nasehat, kehormatan muslim, syubhat, dan adab menjaga hati.',
		description:
			'PDF sumber dapat diekstrak dengan cukup baik pada hadits-hadits awal. Karena itu modul-modul di bawah dipetakan dari hadits 1 sampai sekitar hadits 13 yang tampak jelas di file: hadits niat, hadits Jibril, rukun Islam, penciptaan manusia dan penutup amal, bid\'ah, halal-haram, nasehat, kehormatan muslim, tugas agama sesuai kemampuan, syubhat, dan cinta sesama muslim.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied.pdf',
		featured: true,
		updatedAt: UPDATED_AT,
		level: 'Dasar Menengah',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Hadits', 'Arba\'in', 'Niat', 'Adab', 'Akhlak'],
		sourceNote:
			'Modul dipetakan dari teks hadits dan syarah awal yang muncul jelas di PDF: hadits 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, dan 13.',
		chapterMap: [
			{
				id: 'hadits-bab-1',
				title: 'Bab 1: Hadits 1 tentang Niat',
				summary:
					'PDF membuka pembahasan dengan hadits niat dan syarahnya sebagai pondasi seluruh amal.',
				moduleSpan: 'Modul 1',
				subtopics: [
					'Innamal a\'malu binniyat',
					'Hubungan niat dengan hijrah dan tujuan amal',
					'Latihan ikhlas dalam belajar dan ibadah'
				]
			},
			{
				id: 'hadits-bab-2',
				title: 'Bab 2: Hadits 2 tentang Islam, Iman, dan Ihsan',
				summary:
					'Bab kedua di PDF memetakan agama secara utuh melalui hadits Jibril.',
				moduleSpan: 'Modul 2',
				subtopics: [
					'Rukun Islam',
					'Rukun iman',
					'Ihsan sebagai kualitas ibadah'
				]
			},
			{
				id: 'hadits-bab-3',
				title: 'Bab 3: Hadits 3 tentang Lima Rukun Islam',
				summary:
					'Bab ini memperkuat kerangka amal lahir yang menjadi tiang kehidupan muslim.',
				moduleSpan: 'Modul 3',
				subtopics: [
					'Syahadat dan shalat',
					'Zakat, puasa, dan haji',
					'Hubungan antar-rukun sebagai struktur amal'
				]
			},
			{
				id: 'hadits-bab-4',
				title: 'Bab 4: Hadits 4 tentang Penciptaan dan Akhir Amal',
				summary:
					'PDF memperlihatkan syarah tentang tahap penciptaan manusia dan pentingnya penutup hidup.',
				moduleSpan: 'Modul 4',
				subtopics: [
					'Tahapan penciptaan manusia',
					'Catatan takdir dan amal',
					'Husnul khatimah serta bahaya su\'ul khatimah'
				]
			},
			{
				id: 'hadits-bab-5',
				title: 'Bab 5: Hadits 5 tentang Tertolaknya Bid\'ah',
				summary:
					'Bab ini memusatkan perhatian pada pentingnya mengikuti tuntunan agama yang benar.',
				moduleSpan: 'Modul 5',
				subtopics: [
					'Perkara baru yang tidak berasal dari agama',
					'Amal yang tertolak walau niatnya terlihat baik',
					'Kehati-hatian mengikuti sunnah'
				]
			},
			{
				id: 'hadits-bab-6',
				title: 'Bab 6: Hadits 6 dan 11 tentang Halal, Haram, dan Syubhat',
				summary:
					'Bagian ini menggabungkan dua hadits yang sama-sama melatih kepekaan hati terhadap perkara meragukan.',
				moduleSpan: 'Modul 6',
				subtopics: [
					'Innal halal bayyin wa innal haram bayyin',
					'Da\' ma yaribuka ila ma la yaribuk',
					'Wara\' dan penjagaan kehormatan diri'
				]
			},
			{
				id: 'hadits-bab-7',
				title: 'Bab 7: Hadits 7, 8, dan 9 tentang Nasihat dan Kehormatan Muslim',
				summary:
					'PDF menampilkan rangkaian hadits sosial yang menata hubungan antar-muslim dan kadar kemampuan dalam syariat.',
				moduleSpan: 'Modul 7',
				subtopics: [
					'Ad-dinun nashihah',
					'Kehormatan darah, harta, dan jiwa muslim',
					'Menjalankan perintah sesuai kemampuan'
				]
			},
			{
				id: 'hadits-bab-8',
				title: 'Bab 8: Hadits 10 dan 13 tentang Rezeki Baik dan Cinta Sesama',
				summary:
					'Bab penutup dipecah dari hadits tentang Allah yang Mahabaik dan hadits cinta kepada sesama muslim.',
				moduleSpan: 'Modul 8',
				subtopics: [
					'Allah tidak menerima kecuali yang baik',
					'Rezeki halal dan pengaruhnya pada doa',
					'Cinta kepada saudara muslim sebagai buah iman'
				]
			}
		],
		objectives: [
			'Mengubah pembacaan Arba\'in dari sekadar hafalan menjadi jalur belajar adab dan amal.',
			'Mengambil inti setiap hadits lalu menghubungkannya dengan perilaku sehari-hari santri.',
			'Mengenalkan cara membaca hadits bersama syarah singkat tanpa membuat anak tenggelam dalam pembahasan teknis.',
			'Membangun kebiasaan murajaah hadits dengan makna, contoh, dan latihan kecil.'
		],
		modules: [
			{
				id: 'hadits-1',
				title: 'Modul 1: Hadits Niat dan Ikhlas',
				focus: 'Hadits pertama tentang niat sebagai pondasi amal dan belajar.',
				overview:
					'PDF sumber membuka syarah dengan hadits yang paling sering dipakai untuk meluruskan niat. Modul ini menempatkan niat sebagai fondasi sebelum santri membaca hadits lain, shalat, atau belajar kitab.',
				points: [
					'Niat menentukan arah nilai sebuah amal.',
					'Ikhlas membedakan ibadah dari kebiasaan biasa atau pencarian pujian.',
					'Belajar agama yang benar harus dimulai dengan membersihkan motif hati.'
				],
				examples: [
					{ arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', translit: "innamal a'malu binniyyat", meaning: 'amal itu tergantung pada niatnya' },
					{ arabic: 'وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', translit: "wa innama likullimriin ma nawa", meaning: 'setiap orang mendapat sesuai yang ia niatkan' }
				],
				practice: [
					'Sebutkan niat yang benar sebelum belajar Al-Qur\'an dan hadits.',
					'Bandingkan amal yang ikhlas dengan amal yang ingin dipuji.',
					'Tulis satu kalimat pendek tentang niat yang ingin kamu jaga pekan ini.'
				]
			},
			{
				id: 'hadits-2',
				title: 'Modul 2: Hadits Jibril tentang Islam, Iman, dan Ihsan',
				focus: 'Hadits kedua sebagai peta besar agama.',
				overview:
					'Di PDF terlihat jelas bahwa hadits Jibril diperlakukan sebagai induk banyak ilmu. Modul ini penting karena menghubungkan syariat lahir, keyakinan batin, dan kualitas ibadah dalam satu kerangka besar.',
				points: [
					'Islam mengatur amal lahir seperti syahadat, shalat, zakat, puasa, dan haji.',
					'Iman merangkum keyakinan kepada Allah, malaikat, kitab, rasul, hari akhir, dan takdir.',
					'Ihsan mengajarkan kualitas hati ketika beribadah seolah-olah melihat Allah.'
				],
				examples: [
					{ arabic: 'أَنْ تَشْهَدَ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ', translit: "an tasyhada an la ilaha illallah", meaning: 'engkau bersaksi bahwa tiada ilah selain Allah' },
					{ arabic: 'أَنْ تَعْبُدَ اللّٰهَ كَأَنَّكَ تَرَاهُ', translit: "an ta'budallaha kaannaka tarahu", meaning: 'engkau beribadah kepada Allah seakan-akan melihat-Nya' }
				],
				practice: [
					'Buat tabel: Islam, Iman, dan Ihsan lalu isi contohnya.',
					'Jelaskan mengapa hadits Jibril disebut mengajarkan agama secara utuh.',
					'Pilih satu ibadah harian lalu kaitkan dengan sikap ihsan.'
				]
			},
			{
				id: 'hadits-3',
				title: 'Modul 3: Rukun Islam sebagai Tiang Amal',
				focus: 'Hadits tentang Islam dibangun di atas lima perkara.',
				overview:
					'Setelah peta besar agama dipahami, hadits tentang lima rukun Islam dipakai untuk memperkuat kerangka amal. Ini cocok untuk anak karena sangat dekat dengan ibadah yang mereka lihat sehari-hari.',
				points: [
					'Rukun Islam adalah tiang amal yang paling nyata dalam kehidupan muslim.',
					'Setiap rukun punya tempat dan prioritas yang tidak boleh ditukar-tukar.',
					'Memahami struktur rukun Islam membantu santri melihat hubungan antara satu ibadah dengan ibadah lain.'
				],
				examples: [
					{ arabic: 'بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ', translit: 'buniyal islamu ala khamsin', meaning: 'Islam dibangun di atas lima perkara' },
					{ arabic: 'وَإِقَامِ الصَّلَاةِ', translit: 'wa iqamish shalah', meaning: 'dan mendirikan shalat' }
				],
				practice: [
					'Urutkan lima rukun Islam dengan benar.',
					'Jelaskan kenapa shalat menjadi rukun yang sangat ditekankan.',
					'Pilih satu rukun Islam yang paling sering kamu lihat praktiknya di rumah.'
				]
			},
			{
				id: 'hadits-4',
				title: 'Modul 4: Penciptaan Manusia, Takdir, dan Husnul Khatimah',
				focus: 'Hadits tentang proses penciptaan, ketetapan amal, dan penutup hidup.',
				overview:
					'Modul ini mempertemukan dimensi tubuh dan ruh. Santri dikenalkan bahwa hidup manusia berada dalam ilmu Allah, tetapi itu tidak boleh membuat orang pasif; justru harus mendorongnya memperbaiki akhir amal.',
				points: [
					'Manusia diciptakan melalui tahapan yang menunjukkan kuasa Allah.',
					'Pembahasan takdir harus melahirkan tawakal dan kesungguhan, bukan kemalasan.',
					'Baik buruk penutup amal menjadi peringatan agar istiqamah sampai akhir.'
				],
				examples: [
					{ arabic: 'إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ', translit: "inna ahadakum yujma'u khalquhu", meaning: 'sesungguhnya salah seorang dari kalian dikumpulkan penciptaannya' },
					{ arabic: 'فَإِنَّمَا الأَعْمَالُ بِالْخَوَاتِيمِ', translit: "fa innamal a'malu bil-khawatim", meaning: 'sesungguhnya amal itu dinilai pada penutupnya' }
				],
				practice: [
					'Jelaskan dengan lembut mengapa manusia harus menjaga akhir amalnya.',
					'Sebutkan satu kebiasaan kecil yang membantu istiqamah.',
					'Diskusikan perbedaan antara tawakal dan menyerah pada kemalasan.'
				]
			},
			{
				id: 'hadits-5',
				title: 'Modul 5: Menolak Bid\'ah dan Amal yang Menyimpang',
				focus: 'Hadits tentang tertolaknya perkara baru yang tidak berasal dari agama.',
				overview:
					'Pembahasan bid\'ah dalam PDF menegaskan pentingnya mengikuti tuntunan, bukan membuat ibadah sendiri tanpa landasan. Untuk anak, inti pelajarannya diarahkan ke sikap hati-hati dan cinta terhadap sunnah.',
				points: [
					'Agama punya aturan dan tidak dibentuk oleh selera manusia.',
					'Semangat beribadah harus disertai ilmu agar tidak jatuh pada penyimpangan.',
					'Mengikuti sunnah berarti memilih jalan yang aman dan dicintai Allah.'
				],
				examples: [
					{ arabic: 'مَنْ أَحْدَثَ فِي أَمْرِنَا هٰذَا مَا لَيْسَ مِنْهُ', translit: 'man ahdatsa fi amrina hadza ma laysa minhu', meaning: 'barangsiapa mengadakan perkara baru dalam urusan kami ini yang bukan darinya' },
					{ arabic: 'فَهُوَ رَدٌّ', translit: 'fahuwa raddun', meaning: 'maka ia tertolak' }
				],
				practice: [
					'Jelaskan mengapa niat baik saja belum cukup tanpa tuntunan yang benar.',
					'Latih sikap bertanya kepada guru sebelum menambah amalan yang belum dipahami.',
					'Cari satu contoh mengikuti sunnah dalam ibadah harian.'
				]
			},
			{
				id: 'hadits-6',
				title: 'Modul 6: Halal, Haram, dan Syubhat',
				focus: 'Hadits tentang kejelasan halal dan haram serta pentingnya wara\'.',
				overview:
					'Modul ini menata kepekaan hati. Santri dibawa mengenal bahwa tidak semua perkara abu-abu harus didekati; justru latihan wara\' dimulai dari menjauhi yang meragukan sebelum jatuh ke yang haram.',
				points: [
					'Halal dan haram pada dasarnya jelas, sedangkan syubhat adalah wilayah yang perlu kehati-hatian.',
					'Menjaga diri dari syubhat membantu menjaga agama dan kehormatan.',
					'Wara\' melatih santri untuk tidak selalu mencari celah paling longgar.'
				],
				examples: [
					{ arabic: 'إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ', translit: 'innal halala bayyinun wa innal harama bayyinun', meaning: 'yang halal itu jelas dan yang haram itu jelas' },
					{ arabic: 'دَعْ مَا يَرِيبُكَ', translit: "da' ma yaribuka", meaning: 'tinggalkan apa yang meragukanmu' }
				],
				practice: [
					'Buat tiga contoh sikap hati-hati dalam makanan, ucapan, atau pergaulan.',
					'Jelaskan makna syubhat dengan bahasa anak TPQ.',
					'Latih memilih yang lebih aman ketika menghadapi perkara yang meragukan.'
				]
			},
			{
				id: 'hadits-7',
				title: 'Modul 7: Nasihat, Kehormatan Muslim, dan Kemampuan Menjalankan Syariat',
				focus: 'Hadits tentang agama adalah nasihat, kehormatan seorang muslim, dan tugas agama sesuai kemampuan.',
				overview:
					'Modul ini mempertemukan tiga sisi penting kehidupan sosial muslim: saling menasihati, menjaga kehormatan sesama, dan memahami bahwa syariat diperintahkan sesuai kemampuan. Ini sangat dekat dengan kehidupan kelas dan masjid.',
				points: [
					'Nasihat dalam agama harus jujur, lembut, dan mengarah pada perbaikan.',
					'Seorang muslim punya kehormatan yang tidak boleh diremehkan.',
					'Perintah agama dijalankan semampunya, tetapi larangan harus dijauhi sejauh mungkin.'
				],
				examples: [
					{ arabic: 'الدِّينُ النَّصِيحَةُ', translit: 'ad-dinun nashihah', meaning: 'agama itu adalah nasihat' },
					{ arabic: 'إِذَا أَمَرْتُكُمْ بِأَمْرٍ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ', translit: "idza amartukum bi amrin fa'tu minhu mastatha'tum", meaning: 'jika aku memerintahkan kalian sesuatu, kerjakan sesuai kemampuan kalian' }
				],
				practice: [
					'Latih memberi nasihat kepada teman dengan bahasa yang sopan.',
					'Sebutkan satu bentuk menjaga kehormatan muslim di sekolah atau TPQ.',
					'Diskusikan perbedaan antara uzur yang benar dan alasan yang dibuat-buat.'
				]
			},
			{
				id: 'hadits-8',
				title: 'Modul 8: Rezeki yang Baik dan Cinta Sesama Muslim',
				focus: 'Hadits tentang Allah yang Mahabaik, rezeki halal, dan iman yang mendorong cinta kepada sesama.',
				overview:
					'Penutup jalur hadits ini diarahkan ke dua buah besar ilmu: membersihkan asupan lahir dan membaguskan hubungan dengan orang lain. Dengan itu, hadits tidak berhenti di kepala, tetapi bergerak ke perut, hati, dan perilaku.',
				points: [
					'Allah menerima yang baik, sehingga muslim diajak menjaga makanan, harta, dan cara mencari rezeki.',
					'Iman yang sehat membuat seseorang mencintai kebaikan bagi saudaranya.',
					'Akhlak sosial lahir dari hati yang dibimbing wahyu, bukan hanya dari kebiasaan sopan.'
				],
				examples: [
					{ arabic: 'إِنَّ اللّٰهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا', translit: 'inna allaha thayyibun la yaqbalu illa thayyiba', meaning: 'Allah Mahabaik dan tidak menerima kecuali yang baik' },
					{ arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ', translit: "la yu'minu ahadukum hatta yuhibba li akhihi", meaning: 'tidak sempurna iman seseorang sampai ia mencintai untuk saudaranya' }
				],
				practice: [
					'Buat contoh makanan atau harta yang baik untuk dijaga.',
					'Sebutkan satu kebiasaan yang menunjukkan cinta kepada sesama muslim.',
					'Latih berbagi giliran, alat tulis, atau makanan sebagai bentuk akhlak hadits.'
				]
			}
		],
		glossary: [
			{ term: 'syarah', meaning: 'penjelasan atas matan hadits' },
			{ term: 'ikhlas', meaning: 'memurnikan amal hanya karena Allah' },
			{ term: 'ihsan', meaning: 'beribadah dengan kualitas hati yang tinggi' },
			{ term: 'bid\'ah', meaning: 'perkara baru dalam urusan agama yang tidak punya landasan syar\'i' },
			{ term: 'syubhat', meaning: 'perkara yang meragukan dan perlu kehati-hatian' },
			{ term: 'wara\'', meaning: 'menjaga diri dari perkara yang bisa menyeret ke haram' },
			{ term: 'nashihah', meaning: 'ketulusan yang mendorong perbaikan' },
			{ term: 'thayyib', meaning: 'baik, bersih, dan layak diterima' }
		]
	},
	{
		slug: 'terjemah-bidayatul-hidayah',
		title: 'Terjemah Bidayatul Hidayah',
		category: 'adab-tasawuf',
		seriesKey: SERIES_KEY,
		seriesTitle: SERIES_TITLE,
		seriesOrder: 5,
		summary:
			'Jalur adab dan tazkiyah yang diperluas dari daftar isi PDF: niat mencari ilmu, adab pagi hingga malam, wudhu dan shalat, penjagaan anggota badan, penyakit hati, dan adab pergaulan.',
		description:
			'PDF "Terjemah Bidayatul Hidayah" dapat dipetakan cukup jelas dari daftar isi dan bab-bab awal. Modul di bawah merangkum pembukaan tentang niat mencari ilmu, bab mematuhi perintah Allah pada rutinitas harian, bab menjauhi larangan lahir dan batin, serta bab pergaulan dengan Allah dan sesama makhluk. Hasilnya dibuat lebih bertahap agar cocok menjadi halaman edukasi pendamping TPQ.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/terjemah-bidayatul-hidayah.pdf',
		featured: true,
		updatedAt: UPDATED_AT,
		level: 'Dasar Menengah',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Adab', 'Tasawuf', 'Tazkiyah', 'Dzikir', 'Bidayatul Hidayah'],
		sourceNote:
			'Modul dipetakan dari daftar isi dan pembahasan awal PDF: niat mencari ilmu, adab bangun tidur, kamar kecil, wudhu, masjid, shalat, amalan siang-malam, penjagaan anggota badan, penyakit hati, dan adab pergaulan.',
		chapterMap: [
			{
				id: 'adab-bab-1',
				title: 'Bab 1: Muqaddimah Niat Mencari Ilmu',
				summary:
					'Pembukaan PDF menekankan bahwa hidayah dimulai dari niat yang lurus dalam mencari ilmu.',
				moduleSpan: 'Modul 1',
				subtopics: [
					'Bahaya mencari ilmu untuk pujian',
					'Ilmu yang membuahkan amal',
					'Peta hidayah lahir dan batin'
				]
			},
			{
				id: 'adab-bab-2',
				title: 'Bab 2: Bangun Tidur dan Adab Awal Hari',
				summary:
					'Bab awal rutinitas harian di PDF dimulai dari bangun tidur, kamar kecil, dan kebiasaan bersih.',
				moduleSpan: 'Modul 2',
				subtopics: [
					'Doa bangun tidur dan pembukaan hari',
					'Adab masuk-keluar kamar kecil',
					'Istinja, siwak, dan kebersihan awal hari'
				]
			},
			{
				id: 'adab-bab-3',
				title: 'Bab 3: Wudhu, Mandi, dan Tayammum',
				summary:
					'Bagian ini memperlihatkan bagaimana kitab mengaitkan fiqih bersuci dengan rasa adab dan kehadiran hati.',
				moduleSpan: 'Modul 3',
				subtopics: [
					'Persiapan wudhu dan doa-doanya',
					'Mandi dan kebersihan lahir',
					'Tayammum sebagai rukhsah yang tetap beradab'
				]
			},
			{
				id: 'adab-bab-4',
				title: 'Bab 4: Masjid dan Adab Shalat',
				summary:
					'Daftar isi PDF menunjukkan bab yang cukup rinci tentang perjalanan ke masjid dan keadaan hati dalam shalat.',
				moduleSpan: 'Modul 4',
				subtopics: [
					'Pergi ke masjid dan masuk masjid',
					'Persiapan shalat dan khusyuk',
					'Adab imam, makmum, dan suasana jamaah'
				]
			},
			{
				id: 'adab-bab-5',
				title: 'Bab 5: Amalan Siang-Malam, Jumat, Puasa, dan Tidur',
				summary:
					'Bab ibadah harian di PDF merapikan seluruh waktu manusia agar tidak kosong dari dzikir dan muhasabah.',
				moduleSpan: 'Modul 5',
				subtopics: [
					'Dzikir pagi dan petang',
					'Adab hari Jumat dan puasa',
					'Adab menjelang tidur dan evaluasi diri'
				]
			},
			{
				id: 'adab-bab-6',
				title: 'Bab 6: Menjaga Mata, Telinga, dan Lisan',
				summary:
					'Bagian larangan lahir di PDF dimulai dari anggota badan yang paling cepat membawa dosa ke hati.',
				moduleSpan: 'Modul 6',
				subtopics: [
					'Menundukkan pandangan',
					'Menjaga telinga dari hal sia-sia dan haram',
					'Menjaga lisan dari dusta, ghibah, dan debat'
				]
			},
			{
				id: 'adab-bab-7',
				title: 'Bab 7: Menjaga Perut, Farj, Tangan, Kaki, dan Hati',
				summary:
					'Bab ini menyambungkan disiplin anggota badan dengan tazkiyah dari ujub dan takabur.',
				moduleSpan: 'Modul 7',
				subtopics: [
					'Menjaga makan, langkah, dan syahwat',
					'Bahaya ujub dan takabur',
					'Latihan menundukkan nafsu secara bertahap'
				]
			},
			{
				id: 'adab-bab-8',
				title: 'Bab 8: Adab dengan Allah dan Sesama',
				summary:
					'Penutup PDF mengarahkan seluruh tazkiyah ke hubungan yang tertata dengan Allah, guru, orang tua, dan masyarakat.',
				moduleSpan: 'Modul 8',
				subtopics: [
					'Adab dengan Allah dalam doa dan taat',
					'Adab murid kepada guru dan orang tua',
					'Adab pergaulan dengan teman dan masyarakat'
				]
			}
		],
		objectives: [
			'Menghubungkan ilmu dengan adab sehingga santri tidak hanya pandai berbicara, tetapi juga membenahi kebiasaan.',
			'Membimbing santri dari adab lahir seperti bangun tidur, bersuci, dan shalat menuju adab batin seperti muhasabah dan menjaga hati.',
			'Membuat Bidayatul Hidayah lebih mudah diajarkan di kelas melalui unit belajar yang singkat dan praktis.',
			'Mendorong lahirnya rutinitas dzikir, kontrol lisan, dan rasa hormat kepada guru, orang tua, dan teman.'
		],
		modules: [
			{
				id: 'adab-1',
				title: 'Modul 1: Niat Mencari Ilmu dan Peta Hidayah',
				focus: 'Pengantar penyusun tentang niat, tujuan ilmu, dan bahaya mencari ilmu untuk popularitas.',
				overview:
					'PDF sumber membuka kitab dengan nasihat yang sangat kuat: ilmu tidak boleh dicari untuk pujian dan kebanggaan. Modul ini sengaja dijadikan pintu masuk agar seluruh pelajaran sesudahnya berdiri di atas niat yang lurus.',
				points: [
					'Ilmu bisa menjadi jalan hidayah, tetapi juga bisa menjadi sebab celaka jika niatnya rusak.',
					'Bidayatul Hidayah menekankan bahwa buah ilmu adalah perubahan hidup, bukan banyaknya ucapan.',
					'Permulaan hidayah ada pada taqwa lahir, sedangkan puncaknya ada pada penjagaan batin.'
				],
				examples: [
					{ arabic: 'طَلَبُ الْعِلْمِ', translit: 'thalabul ilm', meaning: 'mencari ilmu' },
					{ arabic: 'الْهِدَايَةُ', translit: 'al-hidayah', meaning: 'petunjuk yang menuntun hati dan amal' }
				],
				practice: [
					'Tulis niatmu belajar agama dalam satu atau dua kalimat.',
					'Diskusikan perbedaan antara mencari ilmu untuk ridha Allah dan untuk pamer.',
					'Pilih satu adab belajar yang ingin kamu jaga selama seminggu.'
				]
			},
			{
				id: 'adab-2',
				title: 'Modul 2: Bangun Tidur, Kamar Kecil, dan Adab Awal Hari',
				focus: 'Rutinitas pagi: doa bangun tidur, adab masuk kamar kecil, istinja, dan siwak.',
				overview:
					'Bab perintah Allah dalam kitab ini dimulai dari hal yang sangat kecil tetapi sering diabaikan. Justru di situlah letak kekuatan kitab: hidayah dibangun dari kebiasaan harian yang disiplin sejak membuka mata.',
				points: [
					'Pagi hari menentukan arah batin dan kebiasaan sepanjang hari.',
					'Adab kamar kecil dan istinja melatih rasa malu, kebersihan, dan kesadaran syariat.',
					'Siwak dan kebersihan mulut dihubungkan dengan kesiapan berdzikir dan shalat.'
				],
				examples: [
					{ arabic: 'الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا', translit: 'alhamdulillahil ladzi ahyana', meaning: 'segala puji bagi Allah yang menghidupkan kami' },
					{ arabic: 'غُفْرَانَكَ', translit: 'ghufranaka', meaning: 'aku memohon ampunan-Mu' }
				],
				practice: [
					'Hafalkan doa bangun tidur dan doa keluar dari kamar kecil.',
					'Buat urutan adab pagi dari bangun tidur sampai selesai bersuci.',
					'Latih menjaga kebersihan diri sebelum berangkat mengaji.'
				]
			},
			{
				id: 'adab-3',
				title: 'Modul 3: Wudhu, Mandi, Tayammum, dan Kebersihan Lahir',
				focus: 'Adab bersuci yang detail sebagai pintu semua ibadah.',
				overview:
					'Pada bagian ini, kitab mengajarkan bahwa ibadah lahir menuntut kesiapan lahir juga. Wudhu, mandi, dan tayammum tidak hanya dibahas secara hukum, tetapi juga dengan rasa adab dan kehadiran hati.',
				points: [
					'Bersuci adalah bentuk ketaatan, bukan rutinitas mekanis belaka.',
					'Doa-doa saat wudhu membantu hati tetap sadar ketika anggota badan dibasuh.',
					'Tayammum mengajarkan bahwa syariat punya kemudahan tanpa kehilangan kehormatan.'
				],
				examples: [
					{ arabic: 'بِسْمِ اللّٰهِ', translit: 'bismillah', meaning: 'dengan nama Allah' },
					{ arabic: 'اللّٰهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ', translit: 'allahummaj alni minat tawwabin', meaning: 'ya Allah jadikan aku termasuk orang yang bertobat' }
				],
				practice: [
					'Praktikkan wudhu sambil menjaga tertib dan ketenangan.',
					'Jelaskan kapan mandi wajib dan tayammum dibutuhkan.',
					'Biasakan membaca basmalah dan doa singkat sebelum memulai bersuci.'
				]
			},
			{
				id: 'adab-4',
				title: 'Modul 4: Pergi ke Masjid dan Adab Melaksanakan Shalat',
				focus: 'Adab menuju masjid, masuk masjid, persiapan shalat, imam-makmum, dan suasana ibadah.',
				overview:
					'Bidayatul Hidayah menuntun santri sampai ke detil-detail suasana ibadah. Masjid, saf, shalat, dan cara berdiri di hadapan Allah dijelaskan sebagai latihan merendahkan hati, bukan sekadar bergerak secara fisik.',
				points: [
					'Perjalanan ke masjid adalah bagian dari ibadah, bukan jeda sebelum ibadah.',
					'Persiapan shalat meliputi pakaian, kebersihan, niat, kekhusyukan, dan adab jamaah.',
					'Imam dan makmum sama-sama memikul tanggung jawab menjaga tertib ibadah.'
				],
				examples: [
					{ arabic: 'إِلَى الْمَسْجِدِ', translit: 'ilal masjid', meaning: 'menuju masjid untuk ibadah' },
					{ arabic: 'اللّٰهُ أَكْبَرُ', translit: 'allahu akbar', meaning: 'Allah Mahabesar sebagai pintu masuk shalat' }
				],
				practice: [
					'Buat daftar adab sebelum masuk masjid.',
					'Jelaskan satu kesalahan yang sering terjadi ketika saf sudah dibentuk.',
					'Latih berdiri shalat dengan tenang dan tidak terburu-buru.'
				]
			},
			{
				id: 'adab-5',
				title: 'Modul 5: Amalan Siang-Malam, Jumat, Puasa, dan Menjelang Tidur',
				focus: 'Wirid harian dan pembiasaan ibadah yang menyelimuti seluruh waktu.',
				overview:
					'Kitab ini tidak membatasi adab pada momen belajar. Siang, malam, Jumat, puasa, dan waktu tidur semuanya dijahit menjadi satu ritme ibadah yang membentuk kedisiplinan ruhani.',
				points: [
					'Dzikir pagi dan petang menjaga hati dari kelalaian.',
					'Hari Jumat dan puasa memiliki adab khusus yang memperkaya kehidupan ibadah seorang muslim.',
					'Menjelang tidur adalah waktu muhasabah, bukan sekadar menutup hari.'
				],
				examples: [
					{ arabic: 'أَذْكَارُ الصَّبَاحِ', translit: 'adzkarus shabah', meaning: 'dzikir-dzikir pagi' },
					{ arabic: 'أَذْكَارُ النَّوْمِ', translit: 'adzkarun nawm', meaning: 'dzikir-dzikir sebelum tidur' }
				],
				practice: [
					'Pilih tiga dzikir harian yang realistis untuk dijaga setiap hari.',
					'Buat jadwal singkat: pagi, siang, sore, malam.',
					'Tulis satu kebiasaan buruk sebelum tidur yang ingin kamu ganti.'
				]
			},
			{
				id: 'adab-6',
				title: 'Modul 6: Menjaga Mata, Telinga, dan Lisan',
				focus: 'Larangan lahiriyah yang paling sering merusak hati.',
				overview:
					'Di bab menjauhi larangan, kitab menaruh perhatian besar pada pintu-pintu dosa yang paling dekat: mata, telinga, dan lisan. Ini sangat relevan untuk pendidikan anak karena ketiganya aktif setiap hari dan mudah sekali lepas dari kontrol.',
				points: [
					'Mata dan telinga adalah pintu masuk banyak kesan yang mempengaruhi hati.',
					'Lisan bisa menghancurkan pahala melalui dusta, ghibah, debat, dan celaan.',
					'Menjaga anggota badan berarti memberi ruang bagi hati untuk tetap bersih.'
				],
				examples: [
					{ arabic: 'غَضُّ الْبَصَرِ', translit: 'ghaddul bashar', meaning: 'menundukkan pandangan' },
					{ arabic: 'الصَّمْتُ', translit: 'ash-shamtu', meaning: 'diam yang terjaga dari keburukan' }
				],
				practice: [
					'Catat satu kebiasaan lisan yang paling sulit kamu jaga.',
					'Latih aturan kelas: bicara seperlunya, tidak memotong, tidak mengejek.',
					'Jelaskan kenapa menjaga mata dan telinga ikut membantu menjaga hati.'
				]
			},
			{
				id: 'adab-7',
				title: 'Modul 7: Menjaga Perut, Farj, Tangan, Kaki, dan Penyakit Hati',
				focus: 'Pengendalian nafsu lahir serta larangan ujub, takabur, dan merasa lebih baik dari orang lain.',
				overview:
					'Bagian ini menghubungkan anggota badan dengan penyakit batin. Kitab menunjukkan bahwa kerakusan perut, langkah ke tempat dosa, dan kesombongan hati sering berjalan beriringan; karena itu keduanya harus dirawat sekaligus.',
				points: [
					'Perut yang tidak dijaga bisa menyeret hati ke syahwat dan kelalaian.',
					'Ujub dan takabur merusak amal walaupun tampak rajin beribadah.',
					'Tazkiyah bukan teori, tetapi latihan menolak dorongan nafsu dari hari ke hari.'
				],
				examples: [
					{ arabic: 'الْعُجْبُ', translit: 'al-ujbu', meaning: 'bangga diri terhadap amal' },
					{ arabic: 'التَّكَبُّرُ', translit: 'at-takabbur', meaning: 'merasa lebih tinggi dari orang lain' }
				],
				practice: [
					'Sebutkan satu bentuk kesombongan yang bisa muncul pada anak yang rajin belajar.',
					'Latih makan secukupnya dan tidak berebut.',
					'Tulis satu hal yang membuatmu sadar bahwa semua kebaikan adalah karunia Allah.'
				]
			},
			{
				id: 'adab-8',
				title: 'Modul 8: Adab dengan Allah, Guru, Murid, Orang Tua, dan Sesama',
				focus: 'Bab penutup tentang sopan santun pergaulan dan penataan hubungan.',
				overview:
					'Kitab ditutup dengan adab pergaulan karena ilmu yang benar harus tampak dalam cara berinteraksi. Di sini santri belajar bahwa hormat kepada Allah harus memancar menjadi hormat kepada guru, orang tua, teman, dan masyarakat.',
				points: [
					'Adab dengan Allah tampak dalam doa, rasa malu, dan kesungguhan taat.',
					'Adab murid kepada guru menjaga keberkahan ilmu.',
					'Adab kepada orang tua dan sesama makhluk adalah buah langsung dari tazkiyah yang berhasil.'
				],
				examples: [
					{ arabic: 'الأَدَبُ مَعَ اللّٰهِ', translit: 'al-adabu ma allah', meaning: 'sopan santun di hadapan Allah' },
					{ arabic: 'بِرُّ الْوَالِدَيْنِ', translit: 'birrul walidain', meaning: 'berbakti kepada kedua orang tua' }
				],
				practice: [
					'Buat daftar adab murid kepada guru yang paling penting di kelasmu.',
					'Latih satu bentuk penghormatan kepada orang tua setiap hari selama sepekan.',
					'Jelaskan bagaimana adab kepada Allah bisa tampak dalam sikap kepada teman.'
				]
			}
		],
		glossary: [
			{ term: 'hidayah', meaning: 'petunjuk Allah yang mengarahkan hati dan amal' },
			{ term: 'muhasabah', meaning: 'mengevaluasi diri dan amal secara jujur' },
			{ term: 'tazkiyah', meaning: 'penyucian jiwa dari sifat buruk' },
			{ term: 'ujub', meaning: 'bangga diri terhadap amal dan merasa cukup dengan diri sendiri' },
			{ term: 'takabur', meaning: 'menolak kebenaran dan meremehkan orang lain' },
			{ term: 'adab', meaning: 'perilaku yang tepat, sopan, dan sesuai tuntunan' },
			{ term: 'wara\'', meaning: 'hati-hati meninggalkan yang meragukan agar tidak jatuh pada yang haram' },
			{ term: 'dzikir', meaning: 'mengingat Allah dengan lisan dan hati' }
		]
	}
];
