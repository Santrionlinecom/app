import type { KitabSourceType } from '$lib/kitab';
import { fondasiKitabMaterials } from './kitab-fondasi';
import type { KitabCategoryKey } from './kitab-categories';

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

export type CuratedKitabChapter = {
	id: string;
	title: string;
	summary: string;
	moduleSpan: string;
	subtopics: string[];
};

export type CuratedKitabMaterial = {
	slug: string;
	title: string;
	category: KitabCategoryKey;
	seriesKey: string;
	seriesTitle: string;
	seriesOrder: number;
	summary: string;
	description: string;
	sourceType: KitabSourceType;
	sourceUrl: string;
	featured: boolean;
	updatedAt: number;
	level: string;
	duration: string;
	totalModules: number;
	tags: string[];
	sourceNote: string;
	chapterMap?: CuratedKitabChapter[];
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
		seriesKey: 'seri-bahasa-arab-santrionline',
		seriesTitle: 'Seri Bahasa Arab SantriOnline',
		seriesOrder: 1,
		summary:
			'Modul bahasa Arab pemula ala SantriOnline yang merapikan pokok-pokok Durusul Lughah jilid 1 menjadi jalur belajar web-native yang lebih bertahap.',
		category: 'bahasa-arab',
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
	},
	{
		slug: 'bahasa-arab-dasar-2',
		title: 'Bahasa Arab Dasar 2',
		seriesKey: 'seri-bahasa-arab-santrionline',
		seriesTitle: 'Seri Bahasa Arab SantriOnline',
		seriesOrder: 2,
		summary:
			'Kelanjutan jilid 1 yang mulai membawa santri dari kalimat sangat sederhana ke pola fi\'il, negasi, perbandingan, angka, dan mudhari ala pembelajaran web SantriOnline.',
		category: 'bahasa-arab',
		description:
			'Materi ini diadaptasi secara orisinal dari tema-tema utama Panduan Durusul Lughah al-Arabiyah 2: jenis kalimat, negasi jumlah ismiyyah, isim tafdhil, bilangan 11-20, fi\'il madhi, fa\'il dan maf\'ul bih, fi\'il mudhari, amr, nahi, nasb-jazm dasar, bentuk mutsanna, hingga pengantar fi\'il shahih dan mu\'tall. Jalurnya disusun ulang agar santri tidak tenggelam dalam detail sekaligus, tetapi tetap menangkap pola besar bahasa Arab dasar-menengah.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/panduan-durusul-lughah-al-arabiyah-2.pdf',
		featured: true,
		updatedAt: Date.UTC(2026, 3, 20),
		level: 'Dasar Lanjutan',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Bahasa Arab', 'Fi\'il', 'Mudhari', 'Durusul Lughah'],
		sourceNote:
			'Diadaptasi dari PDF "Panduan Durusul Lughah al-Arabiyah 2" dan disusun agar siap dilanjutkan ke pola seri dinamis SantriOnline. Sumber PDF masih bisa dipindah ke R2/CMS Hub tanpa mengubah struktur materi.',
		objectives: [
			'Mengenali peralihan dari kalimat nominal sederhana ke kalimat verbal yang lebih hidup.',
			'Memahami negasi, perbandingan, angka dasar, serta perubahan bentuk kata kerja lampau dan sedang-akan.',
			'Membiasakan diri membaca subjek, objek, dan tanda i\'rab praktis tanpa harus takut pada istilah yang terasa berat.',
			'Menyiapkan fondasi sebelum masuk ke bahasan i\'rab yang lebih sistematis pada jilid berikutnya.'
		],
		modules: [
			{
				id: 'modul-1',
				title: 'Modul 1: Peta Kalimat dan Partikel Awal',
				focus: 'Jumlah ismiyyah, jumlah fi\'liyyah, dan partikel pembuka makna.',
				overview:
					'Jilid kedua dimulai dengan peta besar. Santri perlu tahu sejak awal bahwa bahasa Arab tidak hanya berisi kalimat nominal, tetapi juga kalimat verbal yang punya ritme berbeda. Pada tahap ini juga mulai dikenalkan partikel yang memberi rasa penegasan, harapan, atau pilihan.',
				points: [
					'Jumlah ismiyyah dibuka dengan isim, sedangkan jumlah fi\'liyyah dibuka dengan fi\'il.',
					'Perubahan jenis kalimat akan mengubah cara kita membaca subjek dan keterangan sesudahnya.',
					'Partikel tertentu dapat mengubah nuansa makna tanpa mengubah semua susunan kalimat.',
					'Fokus awal bukan hafalan istilah, tetapi membaca pola dengan tenang.'
				],
				examples: [
					{
						arabic: 'الْبَيْتُ جَمِيلٌ',
						translit: 'al-baitu jamilun',
						meaning: 'rumah itu indah'
					},
					{
						arabic: 'خَرَجَ بِلالٌ',
						translit: 'kharaja bilalun',
						meaning: 'Bilal telah keluar'
					},
					{
						arabic: 'لَعَلَّ الْجَوَّ جَمِيلٌ',
						translit: "la'alla al-jawwa jamilun",
						meaning: 'semoga/cuaca kiranya baik'
					}
				],
				practice: [
					'Kelompokkan 5 contoh menjadi jumlah ismiyyah atau jumlah fi\'liyyah.',
					'Buat satu kalimat nominal dan satu kalimat verbal tentang aktivitas kelas.',
					'Cari partikel yang memberi rasa penegasan, harapan, atau pilihan pada contoh yang kamu baca.'
				]
			},
			{
				id: 'modul-2',
				title: 'Modul 2: Negasi dan Perbandingan',
				focus: 'لَيْسَ, kalimat negatif nominal, dan isim tafdhil.',
				overview:
					'Setelah mengenal struktur kalimat, santri belajar menolakkan makna dan membandingkan sifat. Ini membuat bahasa Arab yang dibaca mulai terasa natural: tidak baru, lebih baik, paling besar, dan seterusnya.',
				points: [
					'لَيْسَ lazim dipakai untuk menegasikan jumlah ismiyyah.',
					'Khabar setelah لَيْسَ perlu diperhatikan kedudukannya dalam kalimat.',
					'Isim tafdhil dipakai untuk makna lebih atau paling.',
					'Perbandingan menuntut santri peka pada konteks: membandingkan dua hal atau memilih yang paling menonjol.'
				],
				examples: [
					{
						arabic: 'الْبَيْتُ لَيْسَ جَدِيدًا',
						translit: 'al-baitu laisa jadidan',
						meaning: 'rumah itu tidak baru'
					},
					{
						arabic: 'هٰذَا الْكِتَابُ أَسْهَلُ',
						translit: 'hadza al-kitabu ashalu',
						meaning: 'buku ini lebih mudah'
					},
					{
						arabic: 'إِبْرَاهِيمُ أَفْضَلُ طَالِبٍ',
						translit: 'ibrahimu afdhalu talibin',
						meaning: 'Ibrahim adalah murid terbaik'
					}
				],
				practice: [
					'Ubah 3 kalimat positif menjadi bentuk negatif dengan لَيْسَ.',
					'Bandingkan dua benda di kelas dengan pola lebih besar, lebih kecil, atau lebih mudah.',
					'Buat satu kalimat superlatif dengan konteks sekolah atau masjid.'
				]
			},
			{
				id: 'modul-3',
				title: 'Modul 3: Bilangan 11-20 dan Kesesuaian Jenis',
				focus: 'Bilangan belasan, ma\'dud, dan gender maskulin-feminin.',
				overview:
					'Bagian angka sering membuat santri bingung karena ada hubungan antara angka, jenis kata yang dihitung, dan posisi kata dalam kalimat. Modul ini merapikan pola 11-20 agar lebih mudah diingat.',
				points: [
					'Bilangan 11 dan 12 memiliki pola yang lebih dekat dengan jenis kata yang dihitung.',
					'Bilangan 13 sampai 19 menuntut perhatian pada bagian pertama dan bagian kedua angka.',
					'Kata yang dihitung atau ma\'dud harus dibaca bersama angka, bukan dipisah seperti dua ilmu yang terputus.',
					'Latihan angka akan terasa jauh lebih mudah jika selalu dikaitkan dengan benda nyata.'
				],
				examples: [
					{
						arabic: 'أَحَدَ عَشَرَ طَالِبًا',
						translit: "ahada 'ashara taliban",
						meaning: 'sebelas murid laki-laki'
					},
					{
						arabic: 'ثَلَاثَ عَشْرَةَ طَالِبَةً',
						translit: "thalatha 'ashrata talibatan",
						meaning: 'tiga belas murid perempuan'
					},
					{
						arabic: 'عِشْرُونَ كِتَابًا',
						translit: "'isyruna kitaban",
						meaning: 'dua puluh buku'
					}
				],
				practice: [
					'Sebutkan angka 11-20 dengan contoh kata mudzakkar dan muannats.',
					'Buat 4 kombinasi angka dan benda yang berbeda.',
					'Perhatikan kapan ma\'dud dibaca tunggal dan bagaimana harakatnya berubah.'
				]
			},
			{
				id: 'modul-4',
				title: 'Modul 4: Fi\'il Madhi dan Perubahan Subjek',
				focus: 'Fi\'il madhi, dhamir pelaku, dan bentuk negatif lampau.',
				overview:
					'Di modul ini santri benar-benar masuk ke dunia kata kerja. Mereka tidak lagi membaca fi\'il sebagai bentuk beku, tetapi sebagai pola yang berubah mengikuti pelakunya.',
				points: [
					'Fi\'il madhi menjadi pintu masuk utama untuk membaca aksi yang sudah selesai.',
					'Perubahan akhir fi\'il banyak ditentukan oleh pelakunya: saya, kamu, dia, mereka.',
					'Bentuk feminin perlu dibiasakan sejak awal agar tidak semua kalimat dibaca sebagai maskulin.',
					'Negasi lampau membantu santri membuat kontras yang lebih hidup dalam dialog dan latihan.'
				],
				examples: [
					{
						arabic: 'ذَهَبَ',
						translit: 'dzahaba',
						meaning: 'dia laki-laki telah pergi'
					},
					{
						arabic: 'ذَهَبْتُ',
						translit: 'dzahabtu',
						meaning: 'saya telah pergi'
					},
					{
						arabic: 'مَا ذَهَبْنَا',
						translit: 'ma dzahabna',
						meaning: 'kami tidak pergi'
					}
				],
				practice: [
					'Tasrifkan satu fi\'il madhi untuk saya, kamu, dia laki-laki, dan dia perempuan.',
					'Buat dua kalimat lampau positif dan dua kalimat lampau negatif.',
					'Coba ganti pelaku pada satu kalimat yang sama lalu amati perubahan akhirnya.'
				]
			},
			{
				id: 'modul-5',
				title: 'Modul 5: Fa\'il dan Maf\'ul Bih',
				focus: 'Subjek kalimat verbal, objek langsung, dan arah makna tindakan.',
				overview:
					'Setelah fi\'il dipahami, santri perlu tahu siapa pelakunya dan apa yang dikenai tindakan. Di sinilah konsep fa\'il dan maf\'ul bih mulai terasa sangat praktis.',
				points: [
					'Fa\'il adalah pelaku dalam jumlah fi\'liyyah.',
					'Maf\'ul bih adalah objek yang dikenai tindakan langsung.',
					'Membedakan fa\'il dan maf\'ul bih membantu membaca teks dengan tepat, terutama saat harakat akhir berubah.',
					'Kalimat verbal yang rapi biasanya mudah diurai menjadi fi\'il, fa\'il, dan maf\'ul bih.'
				],
				examples: [
					{
						arabic: 'فَتَحَ الْوَلَدُ الْبَابَ',
						translit: 'fataha al-waladu al-baba',
						meaning: 'anak laki-laki itu membuka pintu'
					},
					{
						arabic: 'رَأَيْتُ حَامِدًا',
						translit: "ra'aitu hamidan",
						meaning: 'saya melihat Hamid'
					},
					{
						arabic: 'سَأَلَتِ الْمُدِيرَةُ زَيْنَبَ',
						translit: "sa'alati al-mudiratu zainaba",
						meaning: 'kepala sekolah perempuan bertanya kepada Zainab'
					}
				],
				practice: [
					'Tandai mana fi\'il, mana fa\'il, dan mana maf\'ul bih pada 5 kalimat.',
					'Buat satu kalimat verbal tanpa objek dan satu kalimat dengan objek.',
					'Ubah satu objek menjadi kata lain lalu lihat apakah makna tindakan masih cocok.'
				]
			},
			{
				id: 'modul-6',
				title: 'Modul 6: Fi\'il Mudhari dan Konjugasi Dasar',
				focus: 'Makna sedang-akan, tasrif mudhari, dan pengenalan perubahan i\'rab.',
				overview:
					'Fi\'il mudhari membawa santri ke makna yang sedang berlangsung atau akan datang. Di sini mereka mulai melihat bahwa kata kerja Arab tidak hanya berubah karena pelaku, tetapi juga karena partikel yang mendahuluinya.',
				points: [
					'Fi\'il mudhari biasa dipakai untuk makna sedang atau akan.',
					'Awalan seperti ي، ت، أ، ن menjadi penanda penting saat membaca tasrif.',
					'Perubahan akhir mudhari memberi petunjuk apakah bentuknya masih rafa\', menjadi nashab, atau masuk jazm.',
					'Santri tidak perlu menghafal semua sekaligus; mulailah dari bentuk yang paling sering dipakai.'
				],
				examples: [
					{
						arabic: 'يَذْهَبُ',
						translit: 'yadzhabu',
						meaning: 'dia laki-laki sedang/akan pergi'
					},
					{
						arabic: 'تَذْهَبِينَ',
						translit: 'tadzhabina',
						meaning: 'engkau perempuan sedang/akan pergi'
					},
					{
						arabic: 'نَكْتُبُ',
						translit: 'naktubu',
						meaning: 'kami sedang/akan menulis'
					}
				],
				practice: [
					'Tasrifkan satu fi\'il mudhari untuk saya, kami, dia laki-laki, dan kamu perempuan.',
					'Bandingkan satu fi\'il madhi dan satu fi\'il mudhari dengan akar yang sama.',
					'Buat dialog pendek yang memakai makna sedang atau akan.'
				]
			},
			{
				id: 'modul-7',
				title: 'Modul 7: Amr, Nahi, dan Ungkapan Keinginan',
				focus: 'Perintah, larangan, dan pola ingin/berharap dengan fi\'il sesudahnya.',
				overview:
					'Bagian ini membuat bahasa Arab terasa lebih hidup karena santri belajar menyuruh, melarang, dan menyatakan keinginan. Ini juga menjadi gerbang untuk memahami perubahan fi\'il setelah partikel tertentu.',
				points: [
					'Amr adalah bentuk perintah yang biasanya ditujukan kepada lawan bicara.',
					'Nahi adalah larangan, lazim memakai لا الناهية.',
					'Ungkapan seperti ingin atau berharap sering diikuti fi\'il yang mengalami perubahan.',
					'Fokus utamanya adalah kepekaan terhadap pola, bukan memburu seluruh istilah sekaligus.'
				],
				examples: [
					{
						arabic: 'اِجْلِسْ',
						translit: 'ijlis',
						meaning: 'duduklah'
					},
					{
						arabic: 'لَا تَذْهَبْ',
						translit: 'la tadzhab',
						meaning: 'jangan pergi'
					},
					{
						arabic: 'أُرِيدُ أَنْ أَذْهَبَ',
						translit: "uridu an adzhaba",
						meaning: 'saya ingin pergi'
					}
				],
				practice: [
					'Buat 3 contoh perintah sederhana untuk suasana kelas.',
					'Buat 3 contoh larangan yang sopan dan jelas.',
					'Lengkapi kalimat "saya ingin..." dengan tiga fi\'il yang berbeda.'
				]
			},
			{
				id: 'modul-8',
				title: 'Modul 8: Dual, Jamak, dan Tanda I\'rab Lanjutan',
				focus: 'Mutsanna, jamak, pengantar kana, dan jalan masuk ke fi\'il lemah.',
				overview:
					'Modul penutup jilid 2 merangkum area yang mulai membuat pembelajar merasa bahasa Arab menjadi lebih serius: bentuk dual, jamak, beberapa perubahan i\'rab, dan pintu awal menuju fi\'il shahih-mu\'tall.',
				points: [
					'Mutsanna punya tanda khusus yang perlu dibiasakan dalam rafa\', nashab, dan jarr.',
					'Jamak mudzakkar salim dan bentuk-bentuk serumpunnya mulai terasa penting di tahap ini.',
					'Kana dan saudara-saudaranya membuka perubahan peran isim dan khabar.',
					'Fi\'il shahih dan mu\'tall menjadi jembatan ke kajian pola yang lebih teknis pada jilid berikutnya.'
				],
				examples: [
					{
						arabic: 'مُدَرِّسَانِ',
						translit: 'mudarrisani',
						meaning: 'dua guru'
					},
					{
						arabic: 'كَانَ الْجَوُّ بَارِدًا',
						translit: 'kana al-jawwu baridan',
						meaning: 'cuacanya dahulu dingin'
					},
					{
						arabic: 'الْمُسْلِمُونَ حَاضِرُونَ',
						translit: 'al-muslimuna hadhiruna',
						meaning: 'para muslim hadir'
					}
				],
				practice: [
					'Ubah kata tunggal menjadi dual dan jamak bila memungkinkan.',
					'Buat dua kalimat dengan kana dan perhatikan perubahan khabarnya.',
					'Siapkan daftar fi\'il yang menurutmu mudah dan yang terasa masih membingungkan untuk murajaah jilid 3.'
				]
			}
		],
		glossary: [
			{ term: 'jumlah fi\'liyyah', meaning: 'kalimat yang dimulai dengan fi\'il atau kata kerja' },
			{ term: 'laysa', meaning: 'partikel untuk menegasikan jumlah ismiyyah' },
			{ term: 'isim tafdhil', meaning: 'bentuk perbandingan seperti lebih atau paling' },
			{ term: 'ma\'dud', meaning: 'kata yang dihitung oleh bilangan' },
			{ term: 'fa\'il', meaning: 'pelaku dalam kalimat verbal' },
			{ term: 'maf\'ul bih', meaning: 'objek langsung yang dikenai pekerjaan' },
			{ term: 'fi\'il mudhari', meaning: 'kata kerja sedang atau akan' },
			{ term: 'amr', meaning: 'bentuk perintah' },
			{ term: 'nahi', meaning: 'bentuk larangan' },
			{ term: 'mutsanna', meaning: 'bentuk dual atau dua' }
		]
	},
	{
		slug: 'bahasa-arab-dasar-3',
		title: 'Bahasa Arab Dasar 3',
		seriesKey: 'seri-bahasa-arab-santrionline',
		seriesTitle: 'Seri Bahasa Arab SantriOnline',
		seriesOrder: 3,
		summary:
			'Jilid yang mengubah pembacaan santri dari sekadar mengenali fi\'il menjadi memahami i\'rab isim, fi\'il, bentuk pasif, isim turunan, zharf, dan struktur kalimat yang lebih matang.',
		category: 'bahasa-arab',
		description:
			'Materi ini diadaptasi secara orisinal dari jalur utama Panduan Durusul Lughah al-Arabiyah 3: i\'rab isim dan fi\'il, mu\'rab dan mabni, fungsi waw, kalimat pasif, ism fa\'il, ism maf\'ul, ism zaman, ism makan, ism alat, ma\'rifah-nakirah yang lebih dalam, zharf, amar untuk pihak ketiga, syarth, istifham, tashghir, enam bab fi\'il tsulatsi mujarrad, masdar, dan pengantar bab af\'ala. Semua dibingkai ulang agar cocok dipelajari bertahap oleh santri online.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/panduan-durusul-lughah-al-arabiyah-3.pdf',
		featured: true,
		updatedAt: Date.UTC(2026, 3, 20),
		level: 'Menengah Awal',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Bahasa Arab', 'I\'rab', 'Ism Fa\'il', 'Pasif'],
		sourceNote:
			'Diadaptasi dari PDF "Panduan Durusul Lughah al-Arabiyah 3". Susunan modul ini sengaja dirapikan untuk menyiapkan migrasi seri ke model dinamis penuh, termasuk saat sumber PDF dipindah ke R2.',
		objectives: [
			'Menguatkan pemahaman i\'rab isim dan fi\'il sebagai dasar membaca teks yang lebih serius.',
			'Membedakan aktif-pasif dan mengenali turunan kata benda dari akar fi\'il.',
			'Membaca zharf, syarth, istifham, dan pola-pola turunan tanpa panik ketika istilah bertambah banyak.',
			'Menyiapkan santri untuk jilid 4 yang berisi pembahasan bentuk turunan fi\'il yang lebih padat.'
		],
		modules: [
			{
				id: 'modul-1',
				title: 'Modul 1: I\'rab Isim dan Fi\'il',
				focus: 'Mu\'rab, mabni, rafa\', nashab, jarr, dan jazm.',
				overview:
					'Jilid ketiga membuka pintu i\'rab dengan lebih sistematis. Santri mulai melihat bahwa perubahan akhir kata bukan hiasan, tetapi penanda fungsi yang sangat menentukan makna.',
				points: [
					'Mayoritas isim adalah mu\'rab dan menunjukkan fungsi melalui akhirannya.',
					'Beberapa bentuk bersifat mabni, yakni tidak banyak berubah meski fungsi kalimatnya berganti.',
					'Fi\'il mudhari memiliki ruang perubahan yang lebih luas dibanding madhi dan amr.',
					'Membaca i\'rab secara perlahan jauh lebih penting daripada tergesa-gesa menghafal semua istilah.'
				],
				examples: [
					{
						arabic: 'جَاءَ الْمُدَرِّسُ',
						translit: "ja'a al-mudarrisu",
						meaning: 'guru itu datang'
					},
					{
						arabic: 'رَأَيْتُ الْمُدَرِّسَ',
						translit: "ra'aitu al-mudarrisa",
						meaning: 'saya melihat guru itu'
					},
					{
						arabic: 'مَرَرْتُ بِالْمُدَرِّسِ',
						translit: 'marartu bil-mudarrisi',
						meaning: 'saya melewati guru itu'
					}
				],
				practice: [
					'Baca satu kata yang sama dalam posisi rafa\', nashab, dan jarr.',
					'Kelompokkan contoh mana yang mu\'rab dan mana yang terasa mabni.',
					'Catat perubahan akhir fi\'il mudhari ketika didahului partikel berbeda.'
				]
			},
			{
				id: 'modul-2',
				title: 'Modul 2: Waw, Penghubung, dan Arah Makna',
				focus: 'Fungsi waw dan partikel penghubung dalam kalimat.',
				overview:
					'Bahasa Arab sering tampak sederhana di permukaan, tetapi satu huruf bisa membawa makna yang berbeda. Modul ini melatih ketelitian santri membaca waw dan partikel lain dalam konteks kalimat.',
				points: [
					'Waw bisa berfungsi sebagai penghubung, penyerta, atau penanda hubungan makna lain sesuai konteks.',
					'Partikel tidak boleh dibaca lepas dari kalimat yang mengitarinya.',
					'Makna kalimat sering bergeser bukan karena isim atau fi\'ilnya, tetapi karena huruf yang tampak kecil.',
					'Pembiasaan membaca konteks lebih penting daripada sekadar menghafal daftar arti.'
				],
				examples: [
					{
						arabic: 'جَاءَ بِلالٌ وَحَامِدٌ',
						translit: 'ja\'a bilalun wa hamidun',
						meaning: 'Bilal dan Hamid datang'
					},
					{
						arabic: 'سِرْ وَالطَّرِيقَ',
						translit: 'sir wa al-thariqa',
						meaning: 'berjalanlah bersama jalan yang jelas arahnya'
					},
					{
						arabic: 'وَاللّٰهِ لَأَكْتُبَنَّ',
						translit: 'wallahi laaktubanna',
						meaning: 'demi Allah, sungguh saya akan menulis'
					}
				],
				practice: [
					'Cari tiga kalimat yang memakai waw dengan fungsi berbeda.',
					'Jelaskan mengapa satu partikel bisa mengubah nuansa seluruh kalimat.',
					'Latih membaca kalimat sambil menjelaskan hubungan antarunsurnya.'
				]
			},
			{
				id: 'modul-3',
				title: 'Modul 3: Kalimat Aktif dan Pasif',
				focus: 'Fi\'il mabni lil ma\'lum dan mabni lil majhul.',
				overview:
					'Bagian pasif membuat pembaca mulai sadar bahwa sebuah tindakan bisa ditampilkan tanpa menyebut pelakunya. Ini penting karena teks Arab klasik dan modern sama-sama sering memakainya.',
				points: [
					'Kalimat aktif menampakkan pelaku, sedangkan pasif menyorot objek yang dikenai tindakan.',
					'Objek pada kalimat aktif dapat naik posisi ketika kalimat berubah menjadi pasif.',
					'Perubahan bentuk fi\'il pasif perlu dibaca dengan teliti agar tidak tertukar dengan bentuk aktif.',
					'Bahasa Arab pasif tidak sekadar menerjemahkan "di-", tetapi juga menggeser pusat perhatian kalimat.'
				],
				examples: [
					{
						arabic: 'كَتَبَ الطَّالِبُ الرِّسَالَةَ',
						translit: 'kataba al-thalibu al-risalata',
						meaning: 'murid itu menulis surat'
					},
					{
						arabic: 'كُتِبَتِ الرِّسَالَةُ',
						translit: 'kutibati al-risalatu',
						meaning: 'surat itu telah ditulis'
					},
					{
						arabic: 'خُلِقَ الْإِنْسَانُ مِنْ تُرَابٍ',
						translit: 'khuliqa al-insanu min turabin',
						meaning: 'manusia diciptakan dari tanah'
					}
				],
				practice: [
					'Ubah tiga kalimat aktif sederhana menjadi bentuk pasif.',
					'Temukan objek yang berubah posisi setelah kalimat dipasifkan.',
					'Bandingkan fokus makna aktif dan pasif pada contoh yang sama.'
				]
			},
			{
				id: 'modul-4',
				title: 'Modul 4: Ism Fa\'il dan Ism Maf\'ul',
				focus: 'Pelaku, yang dikenai pekerjaan, dan pola turunan dari fi\'il.',
				overview:
					'Santri mulai melihat bahwa dari satu fi\'il bisa lahir kata benda yang sangat berguna untuk membaca kitab: penulis, yang ditulis, pengawas, yang diawasi, dan seterusnya.',
				points: [
					'Ism fa\'il menunjuk pelaku atau pihak yang melakukan pekerjaan.',
					'Ism maf\'ul menunjuk pihak atau benda yang dikenai pekerjaan.',
					'Banyak kata yang sering muncul di teks sebenarnya lebih mudah dipahami jika ditelusuri ke akar fi\'ilnya.',
					'Turunan kata membuat santri lebih cepat memperkaya kosakata.'
				],
				examples: [
					{
						arabic: 'كَاتِبٌ',
						translit: 'katibun',
						meaning: 'penulis'
					},
					{
						arabic: 'مَكْتُوبٌ',
						translit: 'maktubun',
						meaning: 'yang tertulis'
					},
					{
						arabic: 'مُرَاقِبٌ وَمُرَاقَبٌ',
						translit: 'muraqibun wa muraqabun',
						meaning: 'pengawas dan yang diawasi'
					}
				],
				practice: [
					'Turunkan satu fi\'il menjadi ism fa\'il dan ism maf\'ul.',
					'Buat pasangan kata seperti penulis-yang ditulis atau pembaca-yang dibaca.',
					'Cari kosakata sehari-hari yang sebenarnya termasuk ism fa\'il atau ism maf\'ul.'
				]
			},
			{
				id: 'modul-5',
				title: 'Modul 5: Ism Zaman, Ism Makan, dan Ism Alat',
				focus: 'Kata benda waktu, tempat, dan alat yang lahir dari fi\'il.',
				overview:
					'Modul ini membuat santri semakin akrab dengan cara bahasa Arab membentuk kata. Dari fi\'il bermain, menulis, atau membuka, lahir kata tempat, waktu, dan alat yang sangat fungsional.',
				points: [
					'Ism zaman menunjukkan waktu berlangsungnya pekerjaan.',
					'Ism makan menunjukkan tempat berlangsungnya pekerjaan.',
					'Ism alat menunjukkan sarana yang dipakai untuk melakukan pekerjaan.',
					'Memahami kelompok ini membantu membaca kosakata baru tanpa harus selalu membuka kamus.'
				],
				examples: [
					{
						arabic: 'مَكْتَبٌ',
						translit: 'maktabun',
						meaning: 'tempat menulis / kantor'
					},
					{
						arabic: 'مَوْعِدٌ',
						translit: "maw'idun",
						meaning: 'waktu janji'
					},
					{
						arabic: 'مِفْتَاحٌ',
						translit: 'miftahun',
						meaning: 'alat membuka / kunci'
					}
				],
				practice: [
					'Cari tiga kata yang termasuk tempat, waktu, atau alat.',
					'Hubungkan tiap kata dengan fi\'il asalnya.',
					'Buat kalimat yang memakai satu ism zaman, satu ism makan, dan satu ism alat.'
				]
			},
			{
				id: 'modul-6',
				title: 'Modul 6: Ma\'rifah, Nakirah, dan Susunan Nominal Lanjutan',
				focus: 'Ketentuan kata, idhafah, penghilangan nun, dan bentuk penunjuk.',
				overview:
					'Di jilid ini, ma\'rifah dan nakirah tidak lagi dibahas sebagai hal sangat dasar. Santri diajak melihat bagaimana status ketentuan kata mempengaruhi sifat, idhafah, mutsanna, dan jamak.',
				points: [
					'Idhafah dapat menghapus tanwin dan memengaruhi bentuk akhir kata.',
					'Pada beberapa bentuk dual dan jamak, nun bisa hilang ketika susunannya berubah.',
					'Status ma\'rifah-nakirah menjadi kunci saat membaca na\'at-man\'ut.',
					'Ketelitian pada detail kecil inilah yang membuat pembacaan kitab lebih aman.'
				],
				examples: [
					{
						arabic: 'كِتَابَا الطَّالِبِ',
						translit: 'kitaba al-thalibi',
						meaning: 'dua buku milik murid'
					},
					{
						arabic: 'هٰؤُلَاءِ الطُّلَّابُ',
						translit: "haula'i al-thullabu",
						meaning: 'mereka ini para murid'
					},
					{
						arabic: 'رَجُلٌ غَرِيبٌ',
						translit: 'rajulun gharibun',
						meaning: 'seorang laki-laki asing'
					}
				],
				practice: [
					'Bandingkan bentuk nakirah dan ma\'rifah pada kata yang sama.',
					'Cari contoh idhafah yang menyebabkan hilangnya tanwin atau nun.',
					'Buat tiga pasangan kata benda dan sifat dengan status ma\'rifah-nakirah yang tepat.'
				]
			},
			{
				id: 'modul-7',
				title: 'Modul 7: Zharf, Syarth, dan Istifham',
				focus: 'Keterangan waktu-tempat, kalimat syarat, dan kata tanya.',
				overview:
					'Setelah struktur kata dan kalimat cukup kuat, santri mulai merasakan alur berpikir Arab dalam bentuk pertanyaan, syarat, dan keterangan yang lebih rinci. Ini membuat bacaan terasa jauh lebih hidup.',
				points: [
					'Zharf membantu menjelaskan kapan dan di mana suatu pekerjaan terjadi.',
					'Kalimat syarth memperkenalkan hubungan sebab-akibat yang bersifat bersyarat.',
					'Istifham atau kata tanya memberi pintu pada dialog dan analisis teks.',
					'Ketiganya sangat sering muncul di teks pendidikan, hadis, dan bacaan adab.'
				],
				examples: [
					{
						arabic: 'خَرَجْتُ لَيْلًا',
						translit: 'kharajtu lailan',
						meaning: 'saya keluar pada malam hari'
					},
					{
						arabic: 'إِنْ تَدْرُسْ تَنْجَحْ',
						translit: 'in tadrus tanjah',
						meaning: 'jika kamu belajar, kamu akan berhasil'
					},
					{
						arabic: 'أَيْنَ كِتَابُكَ؟',
						translit: 'aina kitabuka',
						meaning: 'di mana bukumu?'
					}
				],
				practice: [
					'Buat dua kalimat dengan zharf waktu dan dua kalimat dengan zharf tempat.',
					'Susun tiga kalimat syarth sederhana dengan aktivitas belajar.',
					'Latih dialog tanya-jawab memakai أين، متى، ولماذا.'
				]
			},
			{
				id: 'modul-8',
				title: 'Modul 8: Enam Bab Tsulatsi dan Pintu ke Bab Af\'ala',
				focus: 'Kelompok fi\'il tsulatsi mujarrad, masdar, dan pengantar fi\'il mazid.',
				overview:
					'Penutup jilid 3 memperlihatkan bahwa fi\'il tiga huruf tidak berjalan semaunya. Ia punya kelompok, pola mudhari, dan masdar yang perlu dibiasakan. Dari sini santri siap masuk ke fi\'il mazid pada jilid berikutnya.',
				points: [
					'Fi\'il tsulatsi mujarrad terbagi ke beberapa kelompok pola mudhari.',
					'Masdar tidak selalu memiliki satu bentuk yang seragam; sebagian harus dikenali melalui pemakaian.',
					'Bab af\'ala menjadi pintu pertama menuju fi\'il mazid yang lebih kaya makna.',
					'Di tahap ini santri mulai belajar memetakan akar, pola, dan turunan sekaligus.'
				],
				examples: [
					{
						arabic: 'نَزَلَ - يَنْزِلُ',
						translit: 'nazala - yanzilu',
						meaning: 'turun - sedang/akan turun'
					},
					{
						arabic: 'كَتَبَ - كِتَابَةً',
						translit: 'kataba - kitabatan',
						meaning: 'menulis - penulisan'
					},
					{
						arabic: 'أَنْزَلَ',
						translit: 'anzala',
						meaning: 'menurunkan'
					}
				],
				practice: [
					'Pilih lima fi\'il tsulatsi lalu tulis mudhari dan masdarnya semampumu.',
					'Bedakan mana fi\'il mujarrad dan mana fi\'il mazid pada daftar kata yang kamu temui.',
					'Siapkan daftar akar kata yang ingin kamu telusuri lebih dalam pada jilid 4.'
				]
			}
		],
		glossary: [
			{ term: 'mu\'rab', meaning: 'kata yang akhirnya bisa berubah sesuai fungsi dalam kalimat' },
			{ term: 'mabni', meaning: 'kata yang bentuk akhirnya tetap' },
			{ term: 'mabni lil majhul', meaning: 'bentuk pasif pada fi\'il' },
			{ term: 'ism fa\'il', meaning: 'kata benda yang menunjukkan pelaku' },
			{ term: 'ism maf\'ul', meaning: 'kata benda yang menunjukkan yang dikenai pekerjaan' },
			{ term: 'ism zaman', meaning: 'kata benda yang menunjukkan waktu' },
			{ term: 'ism makan', meaning: 'kata benda yang menunjukkan tempat' },
			{ term: 'ism alat', meaning: 'kata benda yang menunjukkan alat' },
			{ term: 'zharf', meaning: 'keterangan waktu atau tempat' },
			{ term: 'syarth', meaning: 'struktur syarat seperti jika-maka' }
		]
	},
	{
		slug: 'bahasa-arab-dasar-4',
		title: 'Bahasa Arab Dasar 4',
		seriesKey: 'seri-bahasa-arab-santrionline',
		seriesTitle: 'Seri Bahasa Arab SantriOnline',
		seriesOrder: 4,
		summary:
			'Jilid penutup seri inti yang membawa santri ke bentuk fi\'il turunan, fungsi objek lanjut, jenis dhamir, dan struktur yang lebih dekat dengan bacaan kitab menengah.',
		category: 'bahasa-arab',
		description:
			'Materi ini diadaptasi secara orisinal dari jalur utama Panduan Durusul Lughah al-Arabiyah 4: fi\'il transitif dan intransitif, cara menjadikan fi\'il lazim menjadi muta\'addi, berbagai bab fi\'il mazid seperti af\'ala, faa\'ala, tafa\'ala, tafa\'\'ala, infa\'ala, ifta\'ala, jenis-jenis dhamir, maf\'ul mutlaq, maf\'ul lahu, maf\'ul ma\'ahu, taukid, la nafiyah lil jins, pola warna dan cacat, badal, serta beberapa pola jamak dan ungkapan lanjutan. Semuanya diolah ke model web-native agar tetap bisa diikuti santri secara bertahap.',
		sourceType: 'pdf',
		sourceUrl: '/kitab-assets/panduan-durusul-lughah-al-arabiyah-4.pdf',
		featured: true,
		updatedAt: Date.UTC(2026, 3, 20),
		level: 'Menengah',
		duration: '8 modul',
		totalModules: 8,
		tags: ['Bahasa Arab', 'Bab Fi\'il', 'Dhamir', 'Maf\'ul'],
		sourceNote:
			'Diadaptasi dari PDF "Panduan Durusul Lughah al-Arabiyah 4". Materi ini disusun sebagai seri dinamis terakhir dari fase inti dan siap diarahkan ke R2/CMS Hub tanpa mengubah slug maupun modul.',
		objectives: [
			'Membaca dan membedakan sejumlah bab fi\'il turunan yang sering muncul pada kitab dasar-menengah.',
			'Memahami fungsi objek lanjutan, penekanan, dan hubungan antarklausa yang lebih kompleks.',
			'Menguatkan jenis dhamir dan rujukan kata agar pembacaan paragraf Arab tidak mudah tersesat.',
			'Menyelesaikan fondasi seri inti sehingga santri siap masuk ke kajian nahwu-sharaf yang lebih detail.'
		],
		modules: [
			{
				id: 'modul-1',
				title: 'Modul 1: Fi\'il Transitif dan Intransitif',
				focus: 'Muta\'addi, lazim, objek langsung, dan objek tak langsung.',
				overview:
					'Jilid keempat langsung mengangkat tema penting: tidak semua fi\'il membutuhkan objek. Dari sini santri belajar membaca arah kerja fi\'il secara lebih matang.',
				points: [
					'Fi\'il muta\'addi membutuhkan objek yang dikenai pekerjaan.',
					'Fi\'il lazim cukup dengan pelaku dan tidak selalu meminta objek.',
					'Beberapa fi\'il berhubungan dengan objek tak langsung melalui huruf jar.',
					'Membedakan jenis fi\'il ini sangat menolong saat membaca teks panjang.'
				],
				examples: [
					{
						arabic: 'قَتَلَ الْجُنْدِيُّ الْجَاسُوسَ',
						translit: 'qatala al-jundiyyu al-jasusa',
						meaning: 'tentara itu membunuh mata-mata'
					},
					{
						arabic: 'جَلَسَ الطَّالِبُ',
						translit: 'jalasa al-thalibu',
						meaning: 'murid itu duduk'
					},
					{
						arabic: 'سَمِعْتُ بِالْخَبَرِ',
						translit: "sami'tu bil-khabari",
						meaning: 'saya mendengar tentang kabar itu'
					}
				],
				practice: [
					'Pisahkan daftar fi\'il menjadi muta\'addi dan lazim.',
					'Buat satu kalimat dengan objek langsung dan satu dengan huruf jar.',
					'Jelaskan mengapa suatu fi\'il terasa belum lengkap atau sudah lengkap tanpa objek.'
				]
			},
			{
				id: 'modul-2',
				title: 'Modul 2: Membuat Fi\'il Lazim Menjadi Aktif-Causative',
				focus: 'Af\'ala, tasydid, intensitas, dan pemindahan aksi.',
				overview:
					'Banyak fi\'il yang awalnya hanya menunjuk keadaan atau gerak diri dapat diubah menjadi fi\'il yang memindahkan aksi pada objek. Di sinilah sharaf mulai terasa sangat hidup.',
				points: [
					'Sebagian fi\'il lazim dapat dibuat menjadi muta\'addi melalui bab tertentu.',
					'Terkadang perubahan satu huruf saja sudah membuat makna menjadi causative atau intensif.',
					'Santri perlu membaca perubahan ini sebagai perubahan makna, bukan sekadar bentuk.',
					'Latihan terbaik adalah membandingkan akar yang sama sebelum dan sesudah berubah bab.'
				],
				examples: [
					{
						arabic: 'نَزَلَ - أَنْزَلَ',
						translit: 'nazala - anzala',
						meaning: 'turun - menurunkan'
					},
					{
						arabic: 'سَمِعَ - أَسْمَعَ',
						translit: "sami'a - asma'a",
						meaning: 'mendengar - memperdengarkan'
					},
					{
						arabic: 'كَسَرَ - كَسَّرَ',
						translit: 'kasara - kassara',
						meaning: 'memecah - menghancurkan berkali-kali / sangat'
					}
				],
				practice: [
					'Bandingkan lima pasangan fi\'il dasar dan fi\'il causative.',
					'Buat kalimat yang menunjukkan perbedaan antara turun dan menurunkan.',
					'Tuliskan apa yang berubah pada makna ketika hurufnya bertambah atau digandakan.'
				]
			},
			{
				id: 'modul-3',
				title: 'Modul 3: Bab Faa\'ala dan Jaringan Makna Turunan',
				focus: 'Makna saling, proses, dan pola turunan dari fi\'il mazid.',
				overview:
					'Pada tahap ini santri diajak melihat bahwa bab fi\'il bukan sekadar daftar rumus. Setiap bab biasanya membawa rasa makna tertentu, seperti saling, berproses, atau tindakan yang melibatkan dua pihak.',
				points: [
					'Bab faa\'ala sering membawa nuansa interaksi atau hubungan dua pihak.',
					'Dari satu bab dapat lahir mudhari, amr, ism fa\'il, dan ism maf\'ul dengan pola khas.',
					'Memahami keluarga kata membuat hafalan menjadi lebih masuk akal.',
					'Bab fi\'il harus dibaca bersama makna praktisnya, bukan hanya susunan hurufnya.'
				],
				examples: [
					{
						arabic: 'قَابَلَ',
						translit: 'qabala',
						meaning: 'bertemu / menghadapi'
					},
					{
						arabic: 'يُقَابِلُ',
						translit: 'yuqabilu',
						meaning: 'sedang/akan menemui'
					},
					{
						arabic: 'مُقَابَلَةٌ',
						translit: 'muqabalatun',
						meaning: 'pertemuan / wawancara'
					}
				],
				practice: [
					'Turunkan satu kata bab faa\'ala ke bentuk mudhari dan masdar.',
					'Temukan kata sehari-hari yang sebenarnya berasal dari bab ini.',
					'Buat tiga kalimat yang menunjukkan interaksi dua pihak.'
				]
			},
			{
				id: 'modul-4',
				title: 'Modul 4: Bab Tafa\'ala dan Tafa\'\'ala',
				focus: 'Makna bertahap, refleksif, dibuat-buat, atau proses internal.',
				overview:
					'Dua bab ini sering muncul dalam bacaan karena dapat membawa nuansa belajar, berbicara, menerima, pura-pura, dan berbagai proses yang kembali ke pelaku sendiri.',
				points: [
					'Bab tafa\'\'ala sering memberi nuansa proses bertahap atau usaha internal.',
					'Bab tafa\'ala dapat menunjukkan interaksi, saling melakukan, atau proses yang kembali ke pelaku.',
					'Makna bab tidak selalu satu warna, tetapi biasanya punya arah semantik tertentu.',
					'Santri perlu membiasakan membaca contoh riil agar nuansa tiap bab terasa.'
				],
				examples: [
					{
						arabic: 'تَعَلَّمَ',
						translit: "ta'allama",
						meaning: 'belajar'
					},
					{
						arabic: 'تَكَلَّمَ',
						translit: 'takallama',
						meaning: 'berbicara'
					},
					{
						arabic: 'تَبَاكَى',
						translit: 'tabaka',
						meaning: 'berpura-pura menangis'
					}
				],
				practice: [
					'Kelompokkan contoh yang menunjukkan proses sungguhan dan yang bernuansa pura-pura.',
					'Buat tiga kata turunan dari bab tafa\'\'ala yang akrab di telingamu.',
					'Jelaskan perbedaan rasa makna antara fi\'il dasar dan bentuk turunan ini.'
				]
			},
			{
				id: 'modul-5',
				title: 'Modul 5: Bab Infa\'ala dan Ifta\'ala',
				focus: 'Makna menerima pengaruh, berubah, atau masuk ke suatu keadaan.',
				overview:
					'Bab-bab ini membantu santri membaca banyak kata yang menunjukkan proses pasif-semakna, perubahan diri, atau keterlibatan pelaku di dalam aksi yang menimpanya.',
				points: [
					'Infa\'ala sering terasa dekat dengan makna terpengaruh atau berubah karena aksi.',
					'Ifta\'ala muncul dalam banyak kata yang menunjukkan usaha, pencarian, atau proses masuk ke suatu keadaan.',
					'Bab turunan ini sangat sering melahirkan kosakata yang familiar di bahasa Indonesia.',
					'Pemetaan akar dan bab akan mempercepat pengenalan kata baru.'
				],
				examples: [
					{
						arabic: 'اِنْكَسَرَ',
						translit: 'inkasara',
						meaning: 'menjadi pecah / pecah sendiri'
					},
					{
						arabic: 'اِنْتَظَرَ',
						translit: 'intazhara',
						meaning: 'menunggu'
					},
					{
						arabic: 'اِجْتَمَعَ',
						translit: "ijtama'a",
						meaning: 'berkumpul'
					}
				],
				practice: [
					'Cari pasangan fi\'il dasar dan bentuk infa\'ala atau ifta\'ala.',
					'Buat dua kalimat yang menunjukkan perubahan keadaan pelaku.',
					'Tuliskan kata-kata yang terasa akrab karena serapan atau sering didengar.'
				]
			},
			{
				id: 'modul-6',
				title: 'Modul 6: Jenis-Jenis Dhamir',
				focus: 'Dhamir bariz, mustatir, muttashil, dan rujukan kata dalam paragraf.',
				overview:
					'Semakin panjang sebuah teks, semakin penting memahami dhamir. Santri bukan hanya perlu tahu artinya, tetapi juga harus cepat menangkap dhamir itu kembali kepada siapa atau kepada apa.',
				points: [
					'Dhamir ada yang tampak jelas dan ada yang tersembunyi dalam fi\'il.',
					'Dhamir muttashil yang menempel pada isim, fi\'il, atau huruf perlu dibaca hati-hati.',
					'Rujukan dhamir sering menjadi kunci memahami paragraf Arab.',
					'Kesalahan membaca dhamir dapat membuat satu kalimat berbelok makna total.'
				],
				examples: [
					{
						arabic: 'هُوَ كَتَبَ دَرْسَهُ',
						translit: 'huwa kataba darsahu',
						meaning: 'dia menulis pelajarannya'
					},
					{
						arabic: 'كَتَبْتُهُ',
						translit: 'katabtuhu',
						meaning: 'aku menuliskannya'
					},
					{
						arabic: 'نَحْنُ نَفْهَمُهَا',
						translit: 'nahnu nafhamuha',
						meaning: 'kami memahaminya'
					}
				],
				practice: [
					'Tandai dhamir yang berdiri sendiri dan yang menempel.',
					'Baca satu paragraf pendek lalu sebutkan rujukan tiap dhamirnya.',
					'Buat tiga kalimat dengan dhamir objek yang berbeda.'
				]
			},
			{
				id: 'modul-7',
				title: 'Modul 7: Maf\'ul Lanjutan dan Penekanan',
				focus: 'Maf\'ul mutlaq, maf\'ul lahu, maf\'ul ma\'ahu, taukid, dan badal.',
				overview:
					'Di tahap ini santri melihat bahwa objek dalam bahasa Arab tidak hanya satu jenis. Ada objek untuk penegasan, untuk alasan, untuk kebersamaan, dan ada pula unsur pengganti yang disebut badal.',
				points: [
					'Maf\'ul mutlaq menguatkan atau menjelaskan jenis suatu pekerjaan.',
					'Maf\'ul lahu menjelaskan alasan atau tujuan pekerjaan.',
					'Maf\'ul ma\'ahu menunjukkan kebersamaan dalam tindakan.',
					'Taukid dan badal membantu menegaskan atau mengganti penyebutan unsur kalimat secara lebih rinci.'
				],
				examples: [
					{
						arabic: 'شَكَرْتُهُ شُكْرًا',
						translit: 'syakartuhu syukran',
						meaning: 'aku benar-benar berterima kasih kepadanya'
					},
					{
						arabic: 'قُمْتُ اِحْتِرَامًا لِلْمُعَلِّمِ',
						translit: "qumtu ihtiraman lil-mu'allimi",
						meaning: 'aku berdiri karena menghormati guru'
					},
					{
						arabic: 'سِرْتُ وَالنِّيلَ',
						translit: 'sirtu wa al-nila',
						meaning: 'aku berjalan bersama aliran Nil'
					}
				],
				practice: [
					'Cari satu contoh untuk masing-masing jenis maf\'ul yang baru kamu pelajari.',
					'Ubah kalimat biasa menjadi lebih kuat dengan maf\'ul mutlaq.',
					'Latih membaca badal dalam nama orang, tempat, atau jabatan.'
				]
			},
			{
				id: 'modul-8',
				title: 'Modul 8: Struktur Lanjutan dan Murajaah Penutup',
				focus: 'La nafiyah lil jins, syarth, warna-cacat, pola jamak, dan bacaan lanjutan.',
				overview:
					'Modul terakhir merapikan beberapa tema penting yang sering mengejutkan pembelajar: penafian total, syarat yang lebih halus, pola warna-cacat, dan bentuk jamak yang tidak selalu lurus. Ini menjadi jembatan sebelum santri benar-benar masuk ke kajian nahwu-sharaf yang lebih berat.',
				points: [
					'La nafiyah lil jins menolak seluruh jenis, bukan hanya satu contoh.',
					'Kalimat syarth di tingkat ini menuntut pembacaan hubungan klausa yang lebih rapi.',
					'Pola warna dan cacat memiliki bentuk khusus yang sering muncul dalam kitab dan kamus.',
					'Jamak dalam bahasa Arab tidak selalu satu pola; justru di sinilah kepekaan sharaf dilatih.'
				],
				examples: [
					{
						arabic: 'لَا كِتَابَ عِنْدِي',
						translit: 'la kitaba \'indi',
						meaning: 'tidak ada satu pun buku padaku'
					},
					{
						arabic: 'إِنْ تَجْتَهِدْ تَفُزْ',
						translit: 'in tajtahid tafuz',
						meaning: 'jika kamu bersungguh-sungguh, kamu akan menang'
					},
					{
						arabic: 'أَحْمَرُ - حَمْرَاءُ',
						translit: 'ahmaru - hamra\'u',
						meaning: 'merah laki-laki - merah perempuan'
					}
				],
				practice: [
					'Buat tiga kalimat dengan la nafiyah lil jins.',
					'Rangkai dua contoh syarth yang sesuai dengan suasana belajar.',
					'Pilih lima kata dari seluruh seri 1-4 lalu jelaskan akar, pola, dan fungsi singkatnya.'
				]
			}
		],
		glossary: [
			{ term: 'fi\'il muta\'addi', meaning: 'kata kerja yang membutuhkan objek langsung' },
			{ term: 'fi\'il lazim', meaning: 'kata kerja yang tidak menuntut objek langsung' },
			{ term: 'bab fi\'il', meaning: 'pola perubahan fi\'il yang membawa arah makna tertentu' },
			{ term: 'dhamir muttashil', meaning: 'kata ganti yang menempel pada kata lain' },
			{ term: 'dhamir mustatir', meaning: 'kata ganti tersembunyi dalam fi\'il' },
			{ term: 'maf\'ul mutlaq', meaning: 'objek yang menguatkan atau menjelaskan suatu pekerjaan' },
			{ term: 'maf\'ul lahu', meaning: 'objek yang menjelaskan alasan atau tujuan' },
			{ term: 'maf\'ul ma\'ahu', meaning: 'objek kebersamaan setelah waw tertentu' },
			{ term: 'badal', meaning: 'kata pengganti atau penjelas yang mengikuti unsur sebelumnya' },
			{ term: 'la nafiyah lil jins', meaning: 'penafian total terhadap seluruh jenis sesuatu' }
		]
	},
	...fondasiKitabMaterials
];

const sortCuratedKitab = (items: CuratedKitabMaterial[]) =>
	[...items].sort((left, right) => {
		if (left.seriesKey === right.seriesKey) {
			return left.seriesOrder - right.seriesOrder;
		}
		return right.updatedAt - left.updatedAt;
	});

export const featuredCuratedKitab = sortCuratedKitab(
	curatedKitabMaterials.filter((item) => item.featured)
);

export const getCuratedKitabBySlug = (slug: string) =>
	curatedKitabMaterials.find((item) => item.slug === slug) ?? null;

export const getCuratedKitabSeries = (seriesKey: string) =>
	sortCuratedKitab(curatedKitabMaterials.filter((item) => item.seriesKey === seriesKey));

export const getCuratedKitabModuleHref = (slug: string, moduleId: string) =>
	`/kitab/${slug}/bab/${moduleId}`;

export const getCuratedKitabModuleIndex = (
	item: CuratedKitabMaterial,
	moduleId: string
) => item.modules.findIndex((module) => module.id === moduleId);

export const getCuratedKitabModuleById = (
	item: CuratedKitabMaterial,
	moduleId: string
) => {
	const moduleIndex = getCuratedKitabModuleIndex(item, moduleId);
	return moduleIndex >= 0 ? item.modules[moduleIndex] : null;
};

export const getCuratedKitabChaptersForModule = (
	item: CuratedKitabMaterial,
	moduleIndex: number
) => {
	const moduleLabel = `Modul ${moduleIndex + 1}`;
	return (item.chapterMap ?? []).filter((chapter) =>
		chapter.moduleSpan.toLowerCase().includes(moduleLabel.toLowerCase())
	);
};
