export type CuratedKitabExample = {
	arabic: string;
	translit: string;
	meaning: string;
};

export type CuratedKitabModule = {
	id: string;
	title: string;
	focus: string;
	overview: string;
	points: string[];
	examples: CuratedKitabExample[];
	practice: string[];
};

export type CuratedKitabMaterial = {
	slug: string;
	title: string;
	summary: string;
	description: string;
	sourceType: 'pdf';
	sourceUrl: string;
	featured: boolean;
	updatedAt: number;
	level: string;
	duration: string;
	totalModules: number;
	tags: string[];
	sourceNote: string;
	objectives: string[];
	modules: CuratedKitabModule[];
	glossary: Array<{
		term: string;
		meaning: string;
	}>;
};

export const curatedKitabMaterials: CuratedKitabMaterial[] = [
	{
		slug: 'bahasa-arab-dasar-1',
		title: 'Bahasa Arab Dasar 1',
		summary:
			'Modul bahasa Arab pemula ala SantriOnline yang merapikan pokok-pokok Durusul Lughah jilid 1 menjadi jalur belajar web-native yang lebih bertahap.',
		description:
			"Materi ini diadaptasi secara orisinal dari tema-tema awal Panduan Durusul Lughah al-Arabiyah 1: isim isyarah, ma'rifah-nakirah, huruf jar, dhamir, mudhaf-mudhaf ilaih, mudzakkar-muannats, na'at-man'ut, dhamir milik, dan bentuk jamak dasar. Fokusnya bukan sekadar membaca contoh, tetapi membangun kebiasaan memahami pola kalimat Arab sederhana yang sering muncul dalam lingkungan santri dan kitab dasar.",
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/panduan-durusul-lughah-al-arabiyah-1.pdf',
		featured: true,
		updatedAt: Date.UTC(2026, 3, 20),
		level: 'Pemula',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Bahasa Arab', 'Pemula', 'Nahwu Dasar', 'Durusul Lughah'],
		sourceNote:
			'Diadaptasi dari PDF "Panduan Durusul Lughah al-Arabiyah 1" karya Dr. V. Abdur Rahim dan disusun ulang dengan gaya belajar SantriOnline.',
		objectives: [
			'Membaca dan memahami pola kalimat Arab sangat dasar yang sering muncul pada pelajaran awal.',
			'Membedakan kata tunjuk, kata benda tertentu dan tak tertentu, serta posisi kata setelah huruf jar.',
			'Memahami konstruksi kepemilikan, sifat, kata ganti, dan jamak dasar tanpa harus masuk terlalu cepat ke istilah berat.',
			'Membiasakan murajaah melalui contoh singkat, latihan kecil, dan kosakata yang dekat dengan dunia santri.'
		],
		modules: [
			{
				id: 'modul-1',
				title: 'Modul 1: Fondasi Bunyi dan Tanda Baca',
				focus: "Harakat, tanwin, ma'rifah, nakirah, dan cara membaca kata dasar.",
				overview:
					'Bagian awal ini menguatkan pondasi sebelum santri masuk ke kalimat. Fokusnya pada fathah, kasrah, dhammah, tanwin, serta perbedaan isim yang masih umum dan isim yang sudah tertentu.',
				points: [
					'Fathah, kasrah, dan dhammah adalah kunci bunyi pendek yang menghidupkan huruf Arab.',
					'Tanwin biasanya menjadi penanda isim nakirah atau kata benda yang belum spesifik.',
					'Masuknya al- menjadikan banyak isim berpindah dari makna umum ke makna tertentu.',
					'Santri perlu membiasakan telinga mendengar beda kecil antara bunyi pendek dan panjang.'
				],
				examples: [
					{
						arabic: 'كِتَابٌ',
						translit: 'kitabun',
						meaning: 'sebuah buku'
					},
					{
						arabic: 'الْكِتَابُ',
						translit: 'al-kitabu',
						meaning: 'buku itu / buku yang dikenal'
					},
					{
						arabic: 'مَسْجِدٌ',
						translit: 'masjidun',
						meaning: 'sebuah masjid'
					}
				],
				practice: [
					'Sebutkan tiga contoh isim nakirah di sekitar kelas.',
					"Ubah satu contoh menjadi bentuk ma'rifah dengan al-.",
					'Baca keras-keras pasangan: كتابٌ lalu الكتابُ.'
				]
			},
			{
				id: 'modul-2',
				title: 'Modul 2: Menunjuk Benda dan Orang',
				focus: 'Isim isyarah dasar untuk benda dekat dan jauh.',
				overview:
					'Santri mulai belajar membuat kalimat sangat pendek dengan kata tunjuk. Ini penting karena banyak percakapan kelas dibangun dari pola "apa ini?", "siapa itu?", dan "ini rumah".',
				points: [
					'Gunakan هذا untuk benda atau orang maskulin yang dekat.',
					'Gunakan هذه untuk bentuk feminin yang dekat.',
					'Gunakan ذلك dan تلك untuk sesuatu yang lebih jauh dari pembicara.',
					'Latihan awal tidak perlu panjang; cukup satu subjek dan satu keterangan.'
				],
				examples: [
					{
						arabic: 'هٰذَا كِتَابٌ',
						translit: 'hadza kitabun',
						meaning: 'ini sebuah buku'
					},
					{
						arabic: 'هٰذِهِ سَاعَةٌ',
						translit: "hadzihi sa'atun",
						meaning: 'ini sebuah jam'
					},
					{
						arabic: 'ذٰلِكَ بَيْتٌ',
						translit: 'dzalika baitun',
						meaning: 'itu sebuah rumah'
					}
				],
				practice: [
					'Buat 3 kalimat dengan هذا untuk benda maskulin di ruang belajar.',
					'Buat 2 kalimat dengan هذه untuk benda feminin.',
					'Tanya temanmu dengan pola: ما هذا؟ lalu jawab singkat.'
				]
			},
			{
				id: 'modul-3',
				title: 'Modul 3: Huruf Jar dan Keterangan Tempat',
				focus: 'في، على، من، إلى، أين dan perubahan akhir kata setelah huruf jar.',
				overview:
					'Setelah bisa menunjuk benda, santri diajak menjelaskan posisi dan arah. Di tahap ini mereka mulai mengenal bahwa kata benda setelah huruf jar masuk ke posisi majrur.',
				points: [
					'في dipakai untuk makna di dalam.',
					'على dipakai untuk makna di atas.',
					'من menunjukkan asal atau dari mana.',
					'إلى menunjukkan arah tujuan atau menuju ke mana.'
				],
				examples: [
					{
						arabic: 'الْكِتَابُ عَلَى الْمَكْتَبِ',
						translit: "al-kitabu 'ala al-maktabi",
						meaning: 'buku itu berada di atas meja'
					},
					{
						arabic: 'بِلَالٌ فِي الْفَصْلِ',
						translit: 'bilalun fi al-fashli',
						meaning: 'Bilal berada di kelas'
					},
					{
						arabic: 'ذَهَبَتْ إِلَى الْمَدْرَسَةِ',
						translit: 'dzahabat ila al-madrasati',
						meaning: 'dia perempuan pergi ke sekolah'
					}
				],
				practice: [
					'Jawab pertanyaan أين الكتاب؟ dengan dua lokasi berbeda.',
					'Buat satu kalimat memakai من dan satu kalimat memakai إلى.',
					'Tandai kata yang berubah menjadi majrur setelah huruf jar.'
				]
			},
			{
				id: 'modul-4',
				title: "Modul 4: Dhamir dan Fi'il Madhi Sangat Dasar",
				focus: 'أنا، أنتَ، أنتِ، هو، هي dan kata kerja lampau sederhana.',
				overview:
					'Bagian ini memperkenalkan subjek dan aksi paling dasar. Santri tidak langsung dibebani tabel tasrif panjang, tetapi diajak mengenali perubahan sederhana yang sering dipakai di awal belajar.',
				points: [
					'أنا dipakai untuk "saya".',
					'أنتَ untuk lawan bicara laki-laki, dan أنتِ untuk lawan bicara perempuan.',
					'هو dan هي dipakai untuk orang ketiga maskulin dan feminin.',
					"Contoh fi'il madhi awal yang mudah dipakai: ذهب، خرج، جلس."
				],
				examples: [
					{
						arabic: 'أَنَا مُحَمَّدٌ',
						translit: 'ana muhammadun',
						meaning: 'saya Muhammad'
					},
					{
						arabic: 'هِيَ ذَهَبَتْ إِلَى الْجَامِعَةِ',
						translit: "hiya dzahabat ila al-jami'ati",
						meaning: 'dia perempuan telah pergi ke universitas'
					},
					{
						arabic: 'جَلَسَ أَمَامَ الْمُدَرِّسِ',
						translit: 'jalasa amama al-mudarrisi',
						meaning: 'dia laki-laki duduk di depan guru'
					}
				],
				practice: [
					'Ganti subjek pada kalimat sederhana dari هو menjadi هي.',
					'Buat dua kalimat dengan أنا dan أنتَ.',
					'Susun dialog pendek: siapa, pergi ke mana, dan duduk di mana.'
				]
			},
			{
				id: 'modul-5',
				title: 'Modul 5: Idhafah dan Kepemilikan',
				focus: 'Mudhaf-mudhaf ilaih, لي, عندي, هل عندك؟',
				overview:
					'Pelajaran ini sangat penting karena dunia kitab dan percakapan santri penuh dengan struktur kepemilikan: buku ustadz, rumah imam, pena saya, dan sebagainya.',
				points: [
					'Struktur seperti كتابُ بلالٍ terdiri dari benda yang dimiliki dan pemiliknya.',
					'Mudhaf tidak memakai tanwin.',
					'Mudhaf ilaih biasanya majrur.',
					'Untuk kepemilikan praktis sehari-hari, santri juga perlu terbiasa dengan لي dan عندي.'
				],
				examples: [
					{
						arabic: 'كِتَابُ بِلَالٍ',
						translit: 'kitabu bilalin',
						meaning: 'buku milik Bilal'
					},
					{
						arabic: 'بَيْتُ الْإِمَامِ',
						translit: 'baitu al-imami',
						meaning: 'rumah milik imam'
					},
					{
						arabic: 'هَلْ عِنْدَكَ قَلَمٌ؟',
						translit: "hal 'indaka qalamun",
						meaning: 'apakah kamu punya pena?'
					}
				],
				practice: [
					'Gabungkan dua kata menjadi struktur idhafah: كتاب + مدرس.',
					'Buat tiga kalimat kepemilikan dengan عندي atau لي.',
					'Bedakan makna "bukuku" dan "buku milik guru".'
				]
			},
			{
				id: 'modul-6',
				title: 'Modul 6: Mudzakkar, Muannats, dan Sifat',
				focus: 'Keserasian gender dan sifat dalam kalimat nominal.',
				overview:
					'Di tahap ini santri belajar bahwa sifat harus mengikuti kata benda dalam jenis, ketentuan, dan kedudukan. Ini pintu masuk penting menuju bacaan Arab yang lebih tertib.',
				points: [
					'Banyak kata feminin memakai ta marbuthah, tetapi tidak semuanya.',
					"Kata sifat harus mengikuti man'ut dalam maskulin atau feminin.",
					"Jika kata bendanya ma'rifah, sifatnya juga ma'rifah.",
					'Jika kata bendanya nakirah, sifatnya juga nakirah.'
				],
				examples: [
					{
						arabic: 'مُدَرِّسَةٌ جَدِيدَةٌ',
						translit: 'mudarrisatun jadidatun',
						meaning: 'seorang guru perempuan yang baru'
					},
					{
						arabic: 'الْمُدَرِّسُ الْجَدِيدُ',
						translit: 'al-mudarrisu al-jadidu',
						meaning: 'guru yang baru itu'
					},
					{
						arabic: 'سَاعَةٌ جَمِيلَةٌ',
						translit: "sa'atun jamilatun",
						meaning: 'sebuah jam yang indah'
					}
				],
				practice: [
					'Ubah satu sifat maskulin menjadi feminin.',
					'Pasangkan 5 kata benda dengan sifat yang sesuai.',
					"Buat dua kalimat ma'rifah dan dua kalimat nakirah."
				]
			},
			{
				id: 'modul-7',
				title: 'Modul 7: Dhamir Milik yang Menempel',
				focus: 'كتابك، كتابه، كتابها، كتابي dan penekanan sederhana.',
				overview:
					'Santri mulai belajar bentuk kepunyaan yang melekat pada kata benda. Ini memudahkan membaca teks sangat pendek dan percakapan sehari-hari tanpa harus selalu memakai struktur panjang.',
				points: [
					'Akhiran -ك bisa menunjuk milikmu, dengan penyesuaian lawan bicara.',
					'Akhiran -ه dan -ها menunjuk miliknya laki-laki dan perempuannya.',
					'Akhiran -ي menunjukkan milikku.',
					'Beberapa kata seperti أب dan أخ memiliki bentuk sambung yang perlu dibiasakan secara khusus.'
				],
				examples: [
					{
						arabic: 'كِتَابُكَ',
						translit: 'kitabuka',
						meaning: 'bukumu'
					},
					{
						arabic: 'بَيْتُهَا',
						translit: 'baituha',
						meaning: 'rumahnya perempuan'
					},
					{
						arabic: 'أُحِبُّ لُغَتِي',
						translit: 'uhibbu lughati',
						meaning: 'saya mencintai bahasa saya'
					}
				],
				practice: [
					'Tambah dhamir milik pada kata: قلم، كتاب، مدرسة.',
					'Buat kalimat dengan pola: هذا كتابي.',
					'Bandingkan makna بين عندي كتابٌ dan كتابي.'
				]
			},
			{
				id: 'modul-8',
				title: 'Modul 8: Jamak dan Murajaah Pola Dasar',
				focus: 'Jamak salim, jamak taksir, هؤلاء, هم, dan rangkuman tematik.',
				overview:
					'Modul penutup mengikat pelajaran sebelumnya. Santri dikenalkan pada bentuk jamak dasar agar lebih siap masuk ke teks yang menyebut banyak orang, benda, atau kelompok.',
				points: [
					'Jamak mudzakkar salim umumnya berakhir dengan -ون atau -ين sesuai konteks.',
					'Jamak muannats salim lazim berakhir dengan -ات.',
					'Beberapa kata memakai jamak taksir yang perlu dihafal per kata.',
					'هذا berubah menjadi هؤلاء untuk menunjuk banyak orang dekat.'
				],
				examples: [
					{
						arabic: 'هٰؤُلَاءِ مُدَرِّسُونَ',
						translit: "haula'i mudarrisuna",
						meaning: 'ini adalah para guru'
					},
					{
						arabic: 'مُسْلِمٌ -> مُسْلِمُونَ',
						translit: 'muslimun -> muslimuna',
						meaning: 'seorang muslim -> para muslim'
					},
					{
						arabic: 'كِتَابٌ -> كُتُبٌ',
						translit: 'kitabun -> kutubun',
						meaning: 'sebuah buku -> buku-buku'
					}
				],
				practice: [
					'Kelompokkan kata mana yang jamaknya salim dan mana yang taksir.',
					'Buat tiga kalimat dengan هؤلاء.',
					'Ulang seluruh modul lalu tulis 10 kosakata yang paling sering ingin kamu pakai.'
				]
			}
		],
		glossary: [
			{ term: 'isim isyarah', meaning: 'kata tunjuk seperti هذا, هذه, ذلك, تلك' },
			{ term: "ma'rifah", meaning: 'kata benda tertentu atau sudah jelas acuannya' },
			{ term: 'nakirah', meaning: 'kata benda umum atau belum tertentu' },
			{ term: 'huruf jar', meaning: 'kata depan yang menjadikan isim sesudahnya majrur' },
			{ term: 'mudhaf', meaning: 'kata pertama dalam susunan kepemilikan' },
			{ term: 'mudhaf ilaih', meaning: 'kata kedua yang menjadi pemilik dalam susunan idhafah' },
			{ term: "na'at", meaning: 'kata sifat' },
			{ term: "man'ut", meaning: 'kata benda yang disifati' },
			{ term: "fi'il madhi", meaning: 'kata kerja bentuk lampau' },
			{ term: 'jamak salim', meaning: 'bentuk jamak beraturan' }
		]
	}
];

export const featuredCuratedKitab = curatedKitabMaterials.filter((item) => item.featured);

export const getCuratedKitabBySlug = (slug: string) =>
	curatedKitabMaterials.find((item) => item.slug === slug) ?? null;
