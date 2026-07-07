<script lang="ts">
	type AffiliationSegment = {
		label: string;
		range: string;
		estimate: string;
		desc: string;
		bar: number;
		tone: string;
	};

	type OrganizationCard = {
		name: string;
		country: string;
		founded: string;
		founder: string;
		scale: string;
		type: string;
		origin: string;
		legacy: string;
		tone: string;
	};

	type TimelineItem = {
		year: string;
		title: string;
		desc: string;
	};

	type SourceLink = {
		label: string;
		href: string;
		note: string;
	};

	const rankingNotes = [
		'Angka ormas tidak bisa disamakan begitu saja: ada anggota formal, simpatisan, afiliasi budaya, jaringan dakwah longgar, dan lembaga internasional.',
		'Untuk Indonesia, ukuran paling berguna adalah afiliasi publik dalam survei, bukan hanya kartu anggota formal.',
		'Untuk dunia, beberapa gerakan seperti Tablighi Jamaat tidak memakai sistem keanggotaan rapi, sehingga skalanya hanya bisa dibaca sebagai perkiraan.'
	];

	const indonesiaAffiliations: AffiliationSegment[] = [
		{
			label: 'Nahdlatul Ulama (NU)',
			range: '49,5% - 56,9%',
			estimate: 'Sekitar 120 - 150 juta warga/simpatisan bila dihitung dari populasi Muslim Indonesia.',
			desc: 'Menjadi afiliasi publik paling besar di Indonesia. Basisnya kuat di pesantren, kampung, jaringan kiai, majelis taklim, dan amaliyah Aswaja tradisional.',
			bar: 56.9,
			tone: 'from-emerald-500 to-teal-500'
		},
		{
			label: 'Muhammadiyah',
			range: '4,3% - 5,8%',
			estimate: 'Survei afiliasi publik lebih kecil, tetapi klaim simpatisan dan jangkauan amal usaha bisa mencapai puluhan juta.',
			desc: 'Kuat dalam pendidikan modern, rumah sakit, kampus, panti sosial, tajdid, dakwah perkotaan, dan jaringan Aisyiyah.',
			bar: 5.8,
			tone: 'from-sky-500 to-cyan-500'
		},
		{
			label: 'Ormas lain gabungan',
			range: '1% - 3%',
			estimate: 'Mencakup Persis, Al-Washliyah, Nahdlatul Wathan, LDII, Hidayatullah, PUI, Al-Irsyad, dan ormas regional lain.',
			desc: 'Masing-masing tidak selalu besar secara nasional, tetapi banyak yang sangat kuat di wilayah tertentu seperti Sumut, NTB, Banten, Jawa Barat, atau kota-kota dakwah.',
			bar: 3,
			tone: 'from-amber-500 to-orange-500'
		},
		{
			label: 'Tidak berafiliasi / lain-lain',
			range: 'sekitar 34% - 41%',
			estimate: 'Kelompok besar Muslim yang tidak menyebut ormas tertentu saat survei.',
			desc: 'Dalam praktik ibadah, sebagian tetap condong pada corak NU, Muhammadiyah, Salafi, jamaah lokal, tarekat, majelis taklim, atau praktik keluarga tanpa label ormas.',
			bar: 41,
			tone: 'from-slate-500 to-slate-700'
		}
	];

	const indonesiaOrganizations: OrganizationCard[] = [
		{
			name: 'Nahdlatul Ulama',
			country: 'Indonesia',
			founded: '31 Januari 1926 M / 16 Rajab 1344 H, Surabaya',
			founder: "KH Hasyim Asy'ari bersama ulama pesantren seperti KH Abdul Wahab Chasbullah dan KH Bisri Syansuri",
			scale: 'Afiliasi publik terbesar di Indonesia',
			type: 'Aswaja pesantren, Syafiiyah, sosial-keagamaan',
			origin: 'Lahir dari jaringan kiai pesantren, Komite Hijaz, dan kebutuhan menjaga tradisi Ahlussunnah wal Jamaah di tengah arus modernisme, kolonialisme, dan perubahan politik Hijaz.',
			legacy: 'Pesantren, bahtsul masail, tahlil, maulid, tradisi kitab kuning, gerakan sosial, kaderisasi ulama, serta model Islam Nusantara.',
			tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
		},
		{
			name: 'Muhammadiyah',
			country: 'Indonesia',
			founded: '18 November 1912 M / 8 Dzulhijjah 1330 H, Kauman Yogyakarta',
			founder: 'KH Ahmad Dahlan, kemudian diperkuat Nyai Ahmad Dahlan dan Aisyiyah',
			scale: 'Ormas Islam modernis terbesar kedua di Indonesia',
			type: 'Tajdid, pendidikan, kesehatan, amal usaha',
			origin: 'Berangkat dari pembaruan pendidikan, pemurnian tauhid, penguatan Al-Quran dan sunnah, serta kebutuhan membangun umat yang maju melalui sekolah, rumah sakit, dan pelayanan sosial.',
			legacy: 'Sekolah, universitas, rumah sakit, panti asuhan, Lazismu, Aisyiyah, tarjih, gerakan literasi, dan dakwah modern berbasis organisasi yang rapi.',
			tone: 'border-sky-200 bg-sky-50 text-sky-700'
		},
		{
			name: 'Persatuan Islam (Persis)',
			country: 'Indonesia',
			founded: '12 September 1923 M / ±1342 H, Bandung',
			founder: 'Haji Zamzam dan Haji Muhammad Yunus; kemudian kuat melalui Ahmad Hassan dan Mohammad Natsir',
			scale: 'Kuat di Jawa Barat dan jejaring pendidikan pembaru',
			type: 'Tajdid, kajian dalil, pendidikan',
			origin: 'Bermula dari kelompok studi dan pengajian yang mendorong kembali kepada Al-Quran dan sunnah, kritik takhayul-khurafat-bidah, serta tradisi debat ilmiah.',
			legacy: 'Pesantren Persis, tradisi tarjih dalil, penerbitan keagamaan, kader dakwah, dan pengaruh pemikiran pembaruan Islam Indonesia.',
			tone: 'border-indigo-200 bg-indigo-50 text-indigo-700'
		},
		{
			name: "Al-Jam'iyatul Washliyah",
			country: 'Indonesia',
			founded: '30 November 1930 M / ±1349 H, Medan',
			founder: 'Pelajar Maktab Islamiyah Tapanuli, dengan tokoh seperti Ismail Banda, Abdurrahman Sjihab, M. Arsjad Th. Lubis, dan Syekh Muhammad Yunus',
			scale: 'Basis kuat Sumatera Utara dan jaringan madrasah',
			type: 'Pendidikan, dakwah, sosial, Aswaja',
			origin: 'Lahir dari kebutuhan menyambungkan umat yang terpecah dan memperkuat pendidikan Islam pada masa Hindia Belanda.',
			legacy: 'Madrasah, sekolah, dakwah, amal sosial, jaringan ulama Sumatera Timur, dan kontribusi perjuangan kemerdekaan.',
			tone: 'border-orange-200 bg-orange-50 text-orange-700'
		},
		{
			name: 'Nahdlatul Wathan',
			country: 'Indonesia',
			founded: '1 Maret 1953 M / ±1372 H, Pancor Lombok',
			founder: 'TGKH Muhammad Zainuddin Abdul Madjid',
			scale: 'Basis sangat kuat di NTB dan diaspora Lombok',
			type: 'Pesantren, pendidikan, dakwah regional',
			origin: 'Bertumbuh dari Madrasah NWDI dan NBDI yang membangun pendidikan Islam di Lombok sebelum dan sesudah kemerdekaan.',
			legacy: 'Ribuan madrasah, pesantren, majelis, kader guru, dan dakwah Islam di Nusa Tenggara Barat.',
			tone: 'border-lime-200 bg-lime-50 text-lime-700'
		},
		{
			name: 'Lembaga Dakwah Islam Indonesia (LDII)',
			country: 'Indonesia',
			founded: '1972 M / ±1392 H sebagai YAKARI; 1990 M / ±1411 H menjadi LDII',
			founder: 'Berawal dari Yayasan Lembaga Karyawan Islam; nama LDII ditetapkan setelah perubahan organisasi',
			scale: 'Jaringan nasional dengan pembinaan warga dan masjid',
			type: 'Dakwah, pendidikan warga, pengajian terstruktur',
			origin: 'Mengalami beberapa fase nama organisasi sebelum memakai nama Lembaga Dakwah Islam Indonesia pada 1990 M / ±1411 H.',
			legacy: 'Pengajian rutin, pembinaan keluarga, masjid, pesantren, kader dakwah, dan program kebangsaan.',
			tone: 'border-teal-200 bg-teal-50 text-teal-700'
		},
		{
			name: 'Hidayatullah',
			country: 'Indonesia',
			founded: '5 Februari 1973 M / ±1393 H, Balikpapan',
			founder: 'Ustadz Abdullah Said',
			scale: 'Jaringan pesantren dan dai nasional',
			type: 'Pesantren, dakwah, kaderisasi dai',
			origin: 'Bermula dari pesantren di Karang Bugis, lalu berkembang ke Gunung Tembak sebagai pusat kultur Hidayatullah.',
			legacy: 'Pengiriman dai, pesantren, sekolah, BMH, kampus, kaderisasi, dan dakwah ke wilayah pedalaman.',
			tone: 'border-rose-200 bg-rose-50 text-rose-700'
		},
		{
			name: 'Persatuan Ummat Islam (PUI)',
			country: 'Indonesia',
			founded: 'Akar 1917 M / ±1335 H; fusi nasional 5 April 1952 M / ±1371 H, Bogor',
			founder: 'KH Abdul Halim dan KH Ahmad Sanusi melalui penggabungan dua arus organisasi Islam Jawa Barat',
			scale: 'Basis kuat Jawa Barat, terutama Majalengka dan Sukabumi',
			type: 'Pendidikan, dakwah, persatuan umat',
			origin: 'Lahir dari gagasan menyatukan gerakan pendidikan dan dakwah Islam yang sebelumnya berjalan melalui organisasi berbeda.',
			legacy: 'Madrasah, pesantren, gerakan sosial, kader ulama Jawa Barat, dan kontribusi tokoh pejuang kemerdekaan.',
			tone: 'border-yellow-200 bg-yellow-50 text-yellow-700'
		},
		{
			name: 'Al-Irsyad Al-Islamiyyah',
			country: 'Indonesia',
			founded: '6 September 1914 M / ±1332 H, Batavia',
			founder: 'Syekh Ahmad Surkati dan tokoh komunitas Arab-Hadrami di Hindia Belanda',
			scale: 'Jaringan pendidikan dan pembaruan Islam perkotaan',
			type: 'Tajdid, pendidikan, dakwah tauhid',
			origin: 'Berawal dari madrasah Al-Irsyad dan pembaruan pendidikan bagi komunitas Muslim urban, terutama keturunan Arab dan masyarakat luas.',
			legacy: 'Sekolah, dakwah tauhid, reformasi sosial komunitas Hadrami, dan pengaruh pada pemikiran pembaru Islam Indonesia.',
			tone: 'border-cyan-200 bg-cyan-50 text-cyan-700'
		},
		{
			name: "Mathla'ul Anwar",
			country: 'Indonesia',
			founded: '10 Juli 1916 M / ±1334 H, Menes Banten',
			founder: 'KH Mas Abdurrahman, KH Tb. Mohammad Sholeh, KH E. Mohammad Yasin, dan ulama Menes',
			scale: 'Basis kuat Banten dan jaringan pendidikan',
			type: 'Pendidikan, dakwah, sosial',
			origin: 'Lahir sebagai gerakan pendidikan Islam di Menes untuk mencetak ulama, guru, dan masyarakat berakhlak.',
			legacy: 'Madrasah, pesantren, dakwah Banten, kaderisasi guru, dan penguatan tradisi keilmuan lokal.',
			tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'
		}
	];

	const globalOrganizations: OrganizationCard[] = [
		{
			name: "Tablighi Jamaat",
			country: 'India, Pakistan, Bangladesh, dan diaspora global',
			founded: '1926 M / ±1344–1345 H, Mewat India',
			founder: 'Maulana Muhammad Ilyas Kandhlawi',
			scale: 'Salah satu gerakan dakwah Islam terbesar di dunia; estimasi pengikut sangat beragam karena tidak memakai keanggotaan formal rapi.',
			type: 'Gerakan dakwah transnasional non-partai',
			origin: 'Muncul di Mewat untuk menghidupkan kembali praktik dasar Islam di tengah masyarakat Muslim pedesaan India Utara.',
			legacy: 'Khuruj, halaqah masjid, dakwah dari rumah ke rumah, ijtima besar, dan jaringan lintas negara.',
			tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
		},
		{
			name: 'Nahdlatul Ulama',
			country: 'Indonesia',
			founded: '1926 M / 1344 H, Surabaya',
			founder: "KH Hasyim Asy'ari dan ulama pesantren",
			scale: 'Sering disebut ormas Islam formal terbesar berdasarkan afiliasi publik Indonesia.',
			type: 'Ormas sosial-keagamaan tradisionalis',
			origin: 'Berangkat dari jaringan pesantren dan kebutuhan menjaga tradisi mazhab serta otoritas ulama.',
			legacy: 'Model organisasi massa berbasis ulama, pesantren, amaliyah Aswaja, pendidikan, dan gerakan sosial.',
			tone: 'border-teal-200 bg-teal-50 text-teal-700'
		},
		{
			name: 'Muhammadiyah',
			country: 'Indonesia',
			founded: '1912 M / ±1330 H, Yogyakarta',
			founder: 'KH Ahmad Dahlan',
			scale: 'Salah satu ormas Islam modernis terbesar dengan jaringan sekolah, kampus, rumah sakit, dan layanan sosial sangat luas.',
			type: 'Ormas pembaruan sosial-keagamaan',
			origin: 'Lahir dari pembaruan pendidikan dan dakwah amal saleh di kota Yogyakarta.',
			legacy: 'Amal usaha pendidikan-kesehatan, tarjih, Aisyiyah, dan gerakan Islam berkemajuan.',
			tone: 'border-sky-200 bg-sky-50 text-sky-700'
		},
		{
			name: 'Ikhwanul Muslimin / Muslim Brotherhood',
			country: 'Mesir dan cabang transnasional',
			founded: '1928 M / ±1346–1347 H, Ismailia Mesir',
			founder: 'Hasan al-Banna',
			scale: 'Gerakan sosial-politik Islam paling berpengaruh di Timur Tengah modern; status hukumnya berbeda-beda antar negara.',
			type: 'Gerakan dakwah, sosial, dan politik',
			origin: 'Muncul sebagai respons terhadap kolonialisme, modernitas, krisis sosial, dan perdebatan peran Islam dalam negara.',
			legacy: 'Jaringan pendidikan, amal sosial, partai/gerakan politik, dan pengaruh pada banyak gerakan Islam abad ke-20 M / ±abad 14 H.',
			tone: 'border-rose-200 bg-rose-50 text-rose-700'
		},
		{
			name: "Jamaat-e-Islami",
			country: 'Pakistan, India, Bangladesh, dan diaspora Asia Selatan',
			founded: '1941 M / ±1359–1360 H, Lahore India Britania',
			founder: "Abul A'la Maududi",
			scale: 'Gerakan ideologis-politik besar di Asia Selatan dengan cabang berbeda setelah pemisahan India-Pakistan.',
			type: 'Gerakan dakwah, pemikiran, dan politik',
			origin: 'Dibangun untuk menjadikan Islam sebagai sistem sosial-politik dan merespons nasionalisme sekuler serta kolonialisme.',
			legacy: 'Literatur Maududi, kaderisasi, partai politik, dakwah kampus, dan perdebatan Islamisme modern.',
			tone: 'border-amber-200 bg-amber-50 text-amber-700'
		},
		{
			name: "Jamiat Ulama-i-Hind",
			country: 'India',
			founded: '1919 M / ±1337–1338 H, India',
			founder: 'Ulama Deobandi dan tokoh gerakan Khilafat/anti-kolonial',
			scale: 'Salah satu organisasi Muslim India paling tua dan berpengaruh.',
			type: 'Organisasi ulama, pendidikan, advokasi umat',
			origin: 'Lahir dari ulama India yang ingin memiliki wadah permanen untuk membimbing umat dan melawan kolonialisme.',
			legacy: 'Pendidikan Deobandi, advokasi Muslim India, nasionalisme bersama, dan jaringan ulama.',
			tone: 'border-lime-200 bg-lime-50 text-lime-700'
		},
		{
			name: "Dawat-e-Islami",
			country: 'Pakistan dan jaringan global',
			founded: '1981 M / ±1401 H, Karachi Pakistan',
			founder: 'Muhammad Ilyas Attar Qadri',
			scale: 'Gerakan dakwah Sunni Barelvi/Qadiri yang menyebar melalui madrasah, majelis, media, dan diaspora.',
			type: 'Dakwah, pendidikan, media Islam',
			origin: 'Dibentuk untuk memperkuat dakwah Sunni Barelvi dan pembinaan amaliyah keagamaan masyarakat.',
			legacy: 'Madani Channel, majelis, kursus keislaman, jaringan masjid, publikasi, dan dakwah urban.',
			tone: 'border-green-200 bg-green-50 text-green-700'
		},
		{
			name: 'Muslim World League',
			country: 'Arab Saudi dan kantor global',
			founded: '1962 M / ±1381–1382 H, Makkah',
			founder: 'Konferensi Islam di Makkah dengan dukungan Arab Saudi',
			scale: 'Lembaga Islam internasional besar, tetapi bukan ormas massa berbasis anggota seperti NU atau Muhammadiyah.',
			type: 'NGO internasional dan diplomasi keagamaan',
			origin: 'Dibentuk untuk dakwah global, hubungan antar Muslim, dan representasi Islam internasional.',
			legacy: 'Konferensi, dakwah internasional, dialog antaragama, bantuan, dan jejaring lembaga Islam dunia.',
			tone: 'border-stone-200 bg-stone-50 text-stone-700'
		},
		{
			name: 'Hizmet / Gulen Movement',
			country: 'Turki dan diaspora',
			founded: 'Akhir 1960-an M / ±1380-an H, Izmir Turki',
			founder: 'Fethullah Gulen',
			scale: 'Jaringan pendidikan dan masyarakat sipil transnasional; sangat kontroversial dan dibatasi keras oleh pemerintah Turki setelah 2016 M / ±1437–1438 H.',
			type: 'Pendidikan, filantropi, dialog, jejaring sosial',
			origin: 'Bermula dari kelompok baca dan pembinaan pelajar yang dipengaruhi gagasan Said Nursi dan dakwah pendidikan.',
			legacy: 'Sekolah, asrama, media, dialog antaragama, jaringan diaspora, sekaligus kontroversi politik besar di Turki.',
			tone: 'border-violet-200 bg-violet-50 text-violet-700'
		},
		{
			name: "Jama'atu Nasril Islam",
			country: 'Nigeria',
			founded: '1962 M / ±1381–1382 H, Nigeria Utara',
			founder: 'Ahmadu Bello, Sardauna of Sokoto',
			scale: 'Payung penting organisasi Islam di Nigeria, terutama kawasan utara.',
			type: 'Organisasi payung, dakwah, advokasi umat',
			origin: 'Dibentuk untuk menyatukan kepentingan Islam dan menjadi kanal komunikasi umat Muslim Nigeria.',
			legacy: 'Koordinasi ormas, hubungan dengan pemerintah, dakwah, pendidikan, dan penguatan identitas Muslim Nigeria.',
			tone: 'border-cyan-200 bg-cyan-50 text-cyan-700'
		}
	];

	const indonesiaTimeline: TimelineItem[] = [
		{
			year: '1912 M / ±1330 H',
			title: 'Muhammadiyah dan pembaruan amal usaha',
			desc: 'Gerakan sekolah, kesehatan, dan dakwah modern menjadi model baru organisasi Islam di Hindia Belanda.'
		},
		{
			year: '1914–1923 M / ±1332–1342 H',
			title: 'Al-Irsyad, Mathlaul Anwar, dan Persis',
			desc: 'Muncul jaringan pendidikan, tajdid, dan kajian dalil di Batavia, Banten, dan Bandung.'
		},
		{
			year: '1926 M / ±1344–1345 H',
			title: 'NU dan konsolidasi pesantren',
			desc: 'Ulama pesantren membangun wadah nasional untuk menjaga mazhab, tradisi kitab, dan kepentingan umat.'
		},
		{
			year: '1930–1953 M / ±1349–1372 H',
			title: 'Ormas regional tumbuh kuat',
			desc: 'Al-Washliyah di Sumatera Utara, PUI di Jawa Barat, dan Nahdlatul Wathan di Lombok menguatkan pendidikan daerah.'
		},
		{
			year: '1970-an M / ±1390-an H',
			title: 'Dakwah kader dan pembinaan warga',
			desc: 'LDII dan Hidayatullah menunjukkan bentuk baru pembinaan jamaah, pesantren, dai, dan organisasi nasional.'
		}
	];

	const sourceLinks: SourceLink[] = [
		{
			label: 'LSI 2019 M / ±1440–1441 H dikutip Suara Muhammadiyah',
			href: 'https://web.suaramuhammadiyah.id/2022/05/26/memperbarui-pola-gerakan-muhammadiyah/',
			note: 'Rujukan angka 49,5% NU dan 4,3% Muhammadiyah dalam afiliasi publik.'
		},
		{
			label: 'LSI Denny JA 2023 M / ±1444–1445 H via Kompas',
			href: 'https://nasional.kompas.com/read/2023/09/21/06150011/survei-lsi-denny-ja-popularitas-prabowo-di-warga-nu-muhammadiyah-mendominasi',
			note: 'Rujukan afiliasi 56,9% NU, 5,7% Muhammadiyah, dan 3% ormas lain.'
		},
		{
			label: 'Indikator Politik 2024 M / ±1445–1446 H',
			href: 'https://indikator.co.id/wp-content/uploads/2024/05/RILIS-INDIKATOR-14-MEI-2024-1.pdf',
			note: 'Pembanding survei terbaru yang menunjukkan distribusi afiliasi berbeda.'
		},
		{
			label: 'Sejarah Muhammadiyah resmi',
			href: 'https://muhammadiyah.or.id/',
			note: 'Tanggal berdiri dan latar awal Muhammadiyah.'
		},
		{
			label: 'Sejarah NU - NU Jabar',
			href: 'https://jabar.nu.or.id/sejarah/nu-berdiri-pada-tanggal-31-januari-1926-m-bertepatan-dengan-16-rajab-1344-h-GocuL',
			note: 'Tanggal berdiri NU: 31 Januari 1926 M / 16 Rajab 1344 H, Komite Hijaz, dan daftar ulama pendiri.'
		},
		{
			label: 'Pew Research - Tablighi Jamaat',
			href: 'https://www.pewresearch.org/religion/2010/09/15/muslim-networks-and-movements-in-western-europe-tablighi-jamaat/',
			note: 'Asal-usul Tablighi Jamaat di Mewat dan karakter gerakannya.'
		},
		{
			label: 'Britannica - Muslim Brotherhood',
			href: 'https://www.britannica.com/topic/Muslim-Brotherhood',
			note: 'Asal-usul Ikhwanul Muslimin di Mesir dan konteks politik modern.'
		},
		{
			label: 'Jamiat Ulama-i-Hind',
			href: 'https://www.jamiat.org.in/masters/jamiat_history/',
			note: 'Sejarah Jamiat Ulama-i-Hind sebagai organisasi Muslim India.'
		}
	];

	const intermazhabStats = [
		{
			label: 'Sunni / Ahlussunnah wal Jama’ah',
			value: '±85–90% Muslim dunia',
			desc: 'Mayoritas umat Islam global; basis kuat di Indonesia, Asia Tenggara, Afrika Utara, Timur Tengah, Turki, Asia Selatan, dan banyak komunitas diaspora.'
		},
		{
			label: 'Syiah secara global',
			value: '±10–15% Muslim dunia',
			desc: 'Populasi besar terdapat di Iran, Irak, Azerbaijan, Bahrain, Lebanon, sebagian Yaman, Pakistan, India, dan diaspora dunia.'
		},
		{
			label: 'NU di Indonesia',
			value: '±90–150 juta warga/kultural',
			desc: 'Perkiraan luas karena NU berbasis kultural, jamaah, pesantren, dan jaringan sosial-keagamaan, bukan hanya kartu anggota formal.'
		},
		{
			label: 'Syiah lokal Indonesia',
			value: '±200 ribu–2,5 juta',
			desc: 'Kisaran estimasi bervariasi karena sebagian komunitas tidak tercatat formal dan kondisi sosial-politik lokal berbeda-beda.'
		}
	];

	const intermazhabTimeline: TimelineItem[] = [
		{
			year: 'Abad ke-7 M / abad 1 H',
			title: 'Awal perbedaan politik pasca-wafat Rasulullah ﷺ',
			desc: 'Perbedaan mula-mula terkait kepemimpinan umat setelah Rasulullah ﷺ wafat. Seiring waktu, perbedaan politik itu berkembang menjadi tradisi teologis, fikih, dan identitas mazhab yang berbeda.'
		},
		{
			year: '1947 M / ±1366 H',
			title: 'Dar at-Taqrib bayna al-Madzahib al-Islamiyyah di Kairo',
			desc: 'Forum pendekatan antarmadzhab mempertemukan ulama Al-Azhar dan ulama Syiah untuk meredakan ketegangan, memperkuat literasi ilmiah, dan mencari titik temu fikih-keumatan.'
		},
		{
			year: '1959 M / ±1378–1379 H',
			title: 'Fatwa Grand Syekh Al-Azhar Mahmud Syaltut',
			desc: 'Fatwa yang masyhur dikaitkan dengan 17 Rabiul Awal 1378 H / 1959 M ini mengakui Mazhab Ja’fari Imamiyah Itsna ‘Asyariyah dalam ranah fikih dan ibadah sebagai mazhab yang boleh diikuti sebagaimana mazhab-mazhab fikih lain.'
		},
		{
			year: '2004–2005 M / ±1424–1426 H',
			title: 'Risalah Amman / Amman Message',
			desc: 'Inisiatif Raja Abdullah II dari Yordania mengundang otoritas ulama dunia untuk menegaskan pengakuan delapan mazhab besar Islam dan larangan takfir sembarangan terhadap sesama Muslim.'
		}
	];

	const eightIntermazhabSchools = ['Hanafi', 'Maliki', 'Syafi’i', 'Hanbali', 'Ja’fari', 'Zaydi', 'Ibadi', 'Zahiri'];


	const pageQuickLinks = [
		{ href: '#afiliasi-indonesia', label: 'Afiliasi Indonesia' },
		{ href: '#ormas-indonesia', label: 'Ormas Indonesia' },
		{ href: '#ormas-dunia', label: 'Gerakan Dunia' },
		{ href: '#dialog-intermazhab', label: 'Dialog Intermazhab' },
		{ href: '#sumber-rujukan', label: 'Sumber' }
	];

	const intermazhabQuickLinks = [
		{ href: '#sejarah-awal', label: 'Sejarah Awal' },
		{ href: '#linimasa-intermazhab', label: 'Linimasa' },
		{ href: '#fatwa-syaltut', label: 'Fatwa Syaltut' },
		{ href: '#amman-message', label: 'Risalah Amman' },
		{ href: '#nusantara', label: 'Nusantara' },
		{ href: '#adab-membaca', label: 'Adab Membaca' }
	];

	const expandedIntermazhabMilestones: TimelineItem[] = [
		{
			year: '632 M / 11 H',
			title: 'Wafat Rasulullah ﷺ dan musyawarah kepemimpinan',
			desc: 'Perbedaan awal berkaitan dengan imamah/kepemimpinan umat. Pada fase ini, istilah Sunni-Syiah belum menjadi sistem mazhab seperti yang dikenal kemudian.'
		},
		{
			year: '656–661 M / ±35–41 H',
			title: 'Masa Sayyidina Ali dan fitnah politik awal',
			desc: 'Perang Jamal, Shiffin, dan Tahkim meninggalkan luka politik yang kelak dibaca ulang oleh berbagai tradisi teologi dan sejarah.'
		},
		{
			year: '680 M / ±60–61 H',
			title: 'Tragedi Karbala',
			desc: 'Wafatnya Sayyidina Husain bin Ali radhiyallahu ‘anhuma menjadi peristiwa besar dalam memori umat Islam, terutama dalam pembentukan identitas Syiah.'
		},
		{
			year: 'Abad 8–10 M / ±abad 2–4 H',
			title: 'Kodifikasi fikih dan teologi',
			desc: 'Mazhab fikih Sunni menguat melalui jaringan ulama, sementara tradisi Ja’fari berkembang dalam komunitas Imamiyah. Pada masa ini perbedaan makin memiliki struktur keilmuan.'
		},
		{
			year: '1947 M / ±1366 H',
			title: 'Dar at-Taqrib di Kairo',
			desc: 'Forum pendekatan antarmadzhab mempertemukan ulama Al-Azhar dan ulama Syiah. Majalah Risalat al-Islam menjadi salah satu kanal gagasan taqrib.'
		},
		{
			year: '1959 M / ±1378–1379 H',
			title: 'Fatwa Mahmud Syaltut',
			desc: 'Mazhab Ja’fari diakui dalam ranah fikih sebagai mazhab yang dapat diamalkan, tanpa menghapus perbedaan teologis Sunni-Syiah.'
		},
		{
			year: '1980-an M / ±1400-an H',
			title: 'Ketegangan politik pasca-Revolusi Iran',
			desc: 'Revolusi Iran 1979 M / ±1399 H dan perang Iran-Irak membuat isu Sunni-Syiah sering bercampur dengan geopolitik, bukan semata kajian keilmuan.'
		},
		{
			year: '2004–2005 M / ±1424–1426 H',
			title: 'Risalah Amman',
			desc: 'Ulama dunia menegaskan pengakuan delapan mazhab besar dan larangan takfir sembarangan untuk menjaga darah, kehormatan, dan persatuan umat.'
		},
		{
			year: '2016 M / ±1437–1438 H',
			title: 'Deklarasi Marrakesh',
			desc: 'Deklarasi ini tidak khusus Sunni-Syiah, tetapi penting dalam wacana toleransi, perlindungan minoritas, dan hidup berdampingan dalam negara modern.'
		}
	];

	const readingPrinciples = [
		'Teguh dalam aqidah Ahlussunnah wal Jama’ah tanpa mencaci dan merendahkan manusia.',
		'Bedakan kajian ilmiah, kritik aqidah, konflik politik, dan provokasi media sosial.',
		'Jangan melakukan takfir tanpa ilmu, otoritas, dan kaidah ulama.',
		'Dahulukan maslahat bangsa, keselamatan masyarakat, dan adab ukhuwah Islamiyah.'
	];

</script>

<svelte:head>
	<title>Ormas Islam Dunia dan Indonesia - Santri Online</title>
	<meta
		name="description"
		content="Peta ormas Islam, afiliasi Indonesia, gerakan Islam dunia, serta edukasi sejarah dialog intermazhab Sunni-Syiah yang wasathiyah."
	/>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_32%),linear-gradient(135deg,#052e16,#164e63_55%,#0f172a)] px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -right-24 top-10 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-amber-200/10 blur-3xl"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/75">Ormas Islam</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Peta ormas Islam terbesar, asal-usul, dan basis massanya</h1>
				<p class="mt-4 max-w-3xl text-sm leading-7 text-white/78 md:text-base">
					Halaman ini merangkum organisasi dan gerakan Islam besar di Indonesia serta dunia. Fokusnya bukan
					hanya jumlah, tetapi juga asal-usul, pendiri, corak dakwah, dan cara membaca angka afiliasi publik.
				</p>
				<div class="mt-6 flex flex-wrap gap-2">
					{#each pageQuickLinks as link}
						<a class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 transition hover:border-amber-200 hover:bg-amber-200 hover:text-slate-950" href={link.href}>{link.label}</a>
					{/each}
				</div>
			</div>
			<div class="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
				<p class="text-sm font-semibold text-emerald-50">Cara membaca ranking</p>
				<div class="mt-3 space-y-3 text-sm leading-6 text-white/78">
					{#each rankingNotes as note}
						<p>{note}</p>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section id="ringkasan-cepat" class="grid scroll-mt-24 gap-4 md:grid-cols-4">
		<div class="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Indonesia</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">NU</p>
			<p class="mt-2 text-sm leading-6 text-slate-600">Afiliasi publik Muslim terbesar dalam survei nasional.</p>
		</div>
		<div class="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Amal Usaha</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">Muhammadiyah</p>
			<p class="mt-2 text-sm leading-6 text-slate-600">Jaringan pendidikan, kesehatan, dan sosial yang sangat luas.</p>
		</div>
		<div class="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Global</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">Tablighi</p>
			<p class="mt-2 text-sm leading-6 text-slate-600">Gerakan dakwah transnasional dengan struktur longgar.</p>
		</div>
		<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Catatan</p>
			<p class="mt-3 text-3xl font-bold text-slate-900">Tidak identik</p>
			<p class="mt-2 text-sm leading-6 text-slate-600">Anggota formal, simpatisan, dan kedekatan budaya adalah ukuran berbeda.</p>
		</div>
	</section>

	<section id="afiliasi-indonesia" class="rounded-[1.75rem] scroll-mt-24 border border-emerald-200 bg-white p-6 shadow-sm">
		<div class="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Klasifikasi Populasi Indonesia</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Afiliasi publik Muslim Indonesia</h2>
				<p class="mt-4 text-sm leading-7 text-slate-600">
					Survei yang menanyakan kedekatan responden dengan ormas Islam menunjukkan distribusi yang timpang.
					NU berada jauh di depan, Muhammadiyah lebih kecil dalam afiliasi survei tetapi sangat besar dalam
					jangkauan amal usaha, sedangkan banyak Muslim tidak menyebut ormas tertentu.
				</p>
			</div>
			<div class="space-y-4">
				{#each indonesiaAffiliations as segment}
					<article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 class="text-lg font-semibold text-slate-900">{segment.label}</h3>
								<p class="mt-1 text-sm font-semibold text-emerald-700">{segment.range}</p>
							</div>
							<p class="max-w-sm text-xs leading-5 text-slate-500">{segment.estimate}</p>
						</div>
						<div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
							<div class={`h-full rounded-full bg-gradient-to-r ${segment.tone}`} style={`width: ${segment.bar}%`}></div>
						</div>
						<p class="mt-3 text-sm leading-6 text-slate-600">{segment.desc}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section id="ormas-indonesia" class="rounded-[1.75rem] scroll-mt-24 border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Indonesia</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Ormas Islam utama dan asal-usulnya</h2>
			</div>
			<p class="max-w-2xl text-sm leading-7 text-slate-600">
				Urutan berikut bukan ranking mutlak anggota formal. Fokusnya adalah ormas yang punya pengaruh sosial,
				pendidikan, dakwah, atau basis massa penting di Indonesia.
			</p>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2">
			{#each indonesiaOrganizations as org}
				<article class={`rounded-[1.5rem] border p-5 ${org.tone}`}>
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
							{org.country}
						</span>
						<span class="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
							{org.scale}
						</span>
					</div>
					<h3 class="mt-4 text-2xl font-semibold text-slate-950">{org.name}</h3>
					<div class="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
						<p><span class="font-semibold text-slate-900">Berdiri:</span> {org.founded}</p>
						<p><span class="font-semibold text-slate-900">Tokoh awal:</span> {org.founder}</p>
						<p><span class="font-semibold text-slate-900">Corak:</span> {org.type}</p>
						<p>{org.origin}</p>
						<p class="rounded-2xl bg-white/75 p-4">{org.legacy}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section id="timeline-indonesia" class="rounded-[1.75rem] scroll-mt-24 border border-amber-200 bg-amber-50 p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Garis Waktu Indonesia</p>
		<h2 class="mt-3 text-2xl font-semibold text-slate-900">Dari tajdid, pesantren, sampai dakwah kader</h2>
		<div class="mt-5 grid gap-4">
			{#each indonesiaTimeline as item}
				<article class="grid gap-3 rounded-2xl border border-amber-100 bg-white p-5 md:grid-cols-[7rem_1fr]">
					<p class="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">{item.year}</p>
					<div>
						<h3 class="text-lg font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-7 text-slate-600">{item.desc}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section id="ormas-dunia" class="rounded-[1.75rem] scroll-mt-24 border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dunia</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Gerakan dan organisasi Islam besar lintas negara</h2>
			</div>
			<p class="max-w-2xl text-sm leading-7 text-slate-600">
				Daftar dunia ini menggabungkan ormas formal, gerakan dakwah longgar, NGO internasional, dan organisasi
				payung. Karena bentuknya berbeda, bagian ini memakai istilah pengaruh dan jaringan, bukan ranking angka tunggal.
			</p>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2">
			{#each globalOrganizations as org}
				<article class={`rounded-[1.5rem] border p-5 ${org.tone}`}>
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
							{org.country}
						</span>
						<span class="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
							{org.type}
						</span>
					</div>
					<h3 class="mt-4 text-2xl font-semibold text-slate-950">{org.name}</h3>
					<div class="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
						<p><span class="font-semibold text-slate-900">Berdiri:</span> {org.founded}</p>
						<p><span class="font-semibold text-slate-900">Tokoh awal:</span> {org.founder}</p>
						<p><span class="font-semibold text-slate-900">Skala:</span> {org.scale}</p>
						<p>{org.origin}</p>
						<p class="rounded-2xl bg-white/75 p-4">{org.legacy}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>


	<section id="dialog-intermazhab" class="rounded-[1.75rem] scroll-mt-24 border border-emerald-200 bg-white p-6 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Edukasi Intermazhab</p>
				<h2 class="mt-3 max-w-3xl text-2xl font-semibold text-slate-900 md:text-3xl">
					Sejarah dialog Sunni-Syiah: dari Dar at-Taqrib, Fatwa Syaltut, sampai Risalah Amman
				</h2>
			</div>
			<p class="max-w-2xl text-sm leading-7 text-slate-600">
				Bagian ini disusun dengan bahasa ilmiah, objektif, santun, dan wasathiyah. Tujuannya membantu santri memahami sejarah mazhab secara jernih: teguh menjaga aqidah Ahlussunnah wal Jama’ah, tetapi tidak mudah terseret kebencian dan takfir.
			</p>
		</div>

		<nav class="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4" aria-label="Navigasi internal dialog intermazhab">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Peta baca cepat</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each intermazhabQuickLinks as link}
					<a class="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-600 hover:text-white" href={link.href}>{link.label}</a>
				{/each}
			</div>
		</nav>

		<div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each intermazhabStats as stat}
				<article class="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{stat.label}</p>
					<strong class="mt-3 block text-xl font-bold text-slate-950">{stat.value}</strong>
					<p class="mt-2 text-sm leading-6 text-slate-600">{stat.desc}</p>
				</article>
			{/each}
		</div>


		<div class="mt-6 grid gap-4 lg:grid-cols-3">
			<a href="#fatwa-syaltut" class="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Monumen 1959 M / ±1378–1379 H</p>
				<h3 class="mt-2 text-lg font-semibold text-slate-900">Fatwa Syaltut</h3>
				<p class="mt-2 text-sm leading-6 text-slate-600">Jembatan fikih antara Al-Azhar dan Mazhab Ja’fari.</p>
			</a>
			<a href="#amman-message" class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Monumen 2004–2005 M / ±1424–1426 H</p>
				<h3 class="mt-2 text-lg font-semibold text-slate-900">Risalah Amman</h3>
				<p class="mt-2 text-sm leading-6 text-slate-600">Delapan mazhab besar dan larangan takfir sembarangan.</p>
			</a>
			<a href="#nusantara" class="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Konteks Indonesia</p>
				<h3 class="mt-2 text-lg font-semibold text-slate-900">Aswaja & Ukhuwah</h3>
				<p class="mt-2 text-sm leading-6 text-slate-600">Menjaga aqidah tanpa kehilangan adab sosial-keumatan.</p>
			</a>
		</div>

		<div class="mt-8 space-y-8">
			<div id="sejarah-awal" class="rounded-[1.5rem] scroll-mt-24 bg-slate-50 p-5">
				<h3 class="text-xl font-semibold text-slate-900">1. Pendahuluan dan sejarah awal</h3>
				<div class="mt-4 space-y-4 text-sm leading-7 text-slate-700">
					<p>Dalam sejarah Islam, Sunni atau Ahlussunnah wal Jama’ah menjadi arus mayoritas umat. Sunni bertumpu pada kesinambungan ajaran Al-Qur’an, Sunnah, ijma’ ulama, dan tradisi empat mazhab fikih besar: Hanafi, Maliki, Syafi’i, dan Hanbali. Di Nusantara, tradisi Sunni tumbuh melalui pesantren, tarekat mu’tabarah, kajian kitab, dan adab bermasyarakat.</p>
					<p>Syiah muncul sebagai komunitas yang sejak awal memberi perhatian khusus pada kepemimpinan Ahlul Bait, terutama Sayyidina Ali bin Abi Thalib karramallahu wajhah dan keturunannya. Perbedaan ini mula-mula berakar pada persoalan politik pasca-wafat Rasulullah ﷺ pada abad ke-7 Masehi / abad 1 Hijriah. Dalam perjalanan sejarah, ia berkembang menjadi perbedaan teologis, fikih, spiritualitas, dan struktur otoritas keagamaan.</p>
					<ul class="space-y-2">
						<li><strong>Sunni global:</strong> sekitar 85–90% populasi Muslim dunia.</li>
						<li><strong>Syiah global:</strong> sekitar 10–15% populasi Muslim dunia.</li>
						<li><strong>Basis Sunni:</strong> tersebar luas di Asia Tenggara, Afrika, Timur Tengah, Turki, Asia Selatan, dan diaspora.</li>
						<li><strong>Basis Syiah:</strong> kuat di Iran, Irak, Azerbaijan, Bahrain, Lebanon, sebagian Yaman, serta komunitas Asia Selatan dan diaspora.</li>
					</ul>
					<p>Bagi santri, memahami sejarah ini bukan untuk menyalakan permusuhan, melainkan agar tidak membaca konflik mazhab secara dangkal. Aqidah Ahlussunnah wal Jama’ah tetap perlu dijaga, dan adab ilmiah menuntut kita membedakan antara kajian kritis, perbedaan fikih, perbedaan teologi, konflik politik, serta perilaku takfir yang berbahaya.</p>
				</div>
			</div>

			<div id="linimasa-intermazhab" class="grid scroll-mt-24 gap-4">
				{#each expandedIntermazhabMilestones as item}
					<article class="grid gap-3 rounded-2xl border border-emerald-100 bg-white p-5 md:grid-cols-[8rem_1fr]">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">{item.year}</p>
						<div>
							<h3 class="text-lg font-semibold text-slate-900">{item.title}</h3>
							<p class="mt-2 text-sm leading-7 text-slate-600">{item.desc}</p>
						</div>
					</article>
				{/each}
			</div>

			<div id="fatwa-syaltut" class="rounded-[1.5rem] scroll-mt-24 bg-amber-50 p-5">
				<h3 class="text-xl font-semibold text-slate-900">2. Monumen sejarah 1 — Fatwa Mahmud Syaltut (1959 M / ±1378–1379 H)</h3>
				<div class="mt-4 space-y-4 text-sm leading-7 text-slate-700">
					<p>Salah satu monumen penting dialog intermazhab abad modern adalah gerakan <em>Dar at-Taqrib bayna al-Madzahib al-Islamiyyah</em> di Kairo. Lembaga ini berdiri pada tahun 1947 M / ±1366 H sebagai ruang temu antara sebagian ulama Al-Azhar dan ulama Syiah. Tujuannya bukan menyamakan seluruh aqidah dan identitas, melainkan mengurangi prasangka, membuka dialog ilmiah, dan mencari titik temu dalam maslahat umat.</p>
					<p>Di antara nama yang sering dikaitkan dengan gerakan ini adalah Grand Syekh Al-Azhar, Syekh Mahmud Syaltut. Fatwa beliau yang masyhur, tertanggal 17 Rabiul Awal 1378 H dan banyak dirujuk dalam literatur tahun 1959 M / ±1378–1379 H, menyatakan bahwa Mazhab Ja’fari atau Syiah Dua Belas Imam memiliki kedudukan sebagai mazhab fikih yang boleh diikuti dalam ibadah dan muamalah, sebagaimana mazhab fikih lain dalam Islam.</p>
					<p class="rounded-2xl border-l-4 border-amber-400 bg-white p-4"><strong>Pokok makna fatwa:</strong> pengakuan ini berada pada wilayah fikih dan keabsahan beramal menurut mazhab Ja’fari, bukan berarti menghapus seluruh perbedaan teologis antara Sunni dan Syiah.</p>
					<p>Bagi pembaca Ahlussunnah wal Jama’ah, posisi yang adil adalah memahami fatwa ini sebagai ikhtiar meredakan pertikaian dan menata dialog ilmiah. Fatwa tersebut tidak mengharuskan seorang Sunni berpindah mazhab, tidak membatalkan kewajiban menjaga aqidah Aswaja, dan tidak menutup ruang kritik terhadap pandangan yang menyelisihi prinsip Ahlussunnah.</p>
				</div>
			</div>

			<div id="amman-message" class="rounded-[1.5rem] scroll-mt-24 bg-slate-900 p-5 text-white">
				<h3 class="text-xl font-semibold text-amber-200">3. Monumen sejarah 2 — Risalah Amman / Amman Message (2004–2005 M / ±1424–1426 H)</h3>
				<div class="mt-4 space-y-4 text-sm leading-7 text-white/78">
					<p>Risalah Amman berawal dari inisiatif Raja Abdullah II dari Yordania pada tahun 2004 M / ±1424–1425 H. Konteksnya adalah meningkatnya kekerasan sektarian, ekstremisme, dan penyalahgunaan takfir di berbagai tempat. Inisiatif ini berkembang menjadi deklarasi ulama dunia pada 2005 M / ±1425–1426 H yang menegaskan batas perbedaan mazhab dan bahaya mengkafirkan sesama Muslim tanpa otoritas ilmu.</p>
					<p>Tokoh-tokoh besar dari berbagai negeri, lembaga fatwa, dan tradisi keilmuan terlibat. Dalam konteks Syiah, Ayatollah Sayyid Ali Khamenei dari Iran dan Ayatollah Sayyid Ali Al-Sistani dari Irak tidak hadir secara fisik karena pertimbangan protokol keamanan dan situasi politik, tetapi mengirimkan fatwa resmi tertulis. Fatwa tertulis tersebut menjadi salah satu pilar hukum penting dalam legitimasi deklarasi lintas mazhab ini.</p>
				</div>
				<div class="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
					{#each eightIntermazhabSchools as school}
						<span class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-bold">{school}</span>
					{/each}
				</div>
				<p class="mt-4 text-sm leading-7 text-white/78">Isi penting Risalah Amman adalah pengakuan terhadap delapan mazhab besar Islam, meliputi mazhab-mazhab Sunni, Syiah, Ibadi, dan Zahiri. Deklarasi ini juga menegaskan larangan mengkafirkan pengikut mazhab-mazhab yang diakui selama mereka berada dalam pokok-pokok Islam.</p>
			</div>

			<div id="nusantara" class="rounded-[1.5rem] scroll-mt-24 bg-emerald-50 p-5">
				<h3 class="text-xl font-semibold text-slate-900">4. Perspektif ulama Nusantara dan konteks Indonesia</h3>
				<div class="mt-4 space-y-4 text-sm leading-7 text-slate-700">
					<p>Di Indonesia, lanskap keagamaan sangat dipengaruhi oleh tradisi Sunni Ahlussunnah wal Jama’ah. Nahdlatul Ulama, pesantren, jaringan kiai, majelis taklim, dan tradisi kitab kuning menjadi penjaga penting aqidah Aswaja. NU sering dipahami memiliki basis kultural sangat besar, dengan estimasi sekitar 90–150 juta warga atau simpatisan kultural.</p>
					<ul class="space-y-2">
						<li><strong>NU Indonesia:</strong> sekitar 90–150 juta warga/simpatisan kultural, tergantung metode penghitungan.</li>
						<li><strong>Syiah Indonesia:</strong> sekitar 200 ribu–2,5 juta, tergantung sumber estimasi dan definisi komunitas.</li>
						<li><strong>Kesimpulan demografis:</strong> Syiah adalah minoritas sangat kecil dibanding arus besar Sunni-Aswaja di Indonesia.</li>
					</ul>
					<p>Sikap moderat ulama Nusantara, termasuk tradisi para pendiri NU, dapat diringkas dalam dua amanah: membentengi aqidah Ahlussunnah wal Jama’ah melalui ilmu, sanad, kitab, pesantren, dan adab; serta menjaga persaudaraan sesama Muslim dan kedamaian bangsa. Umat tidak diarahkan menjadi longgar tanpa prinsip, tetapi juga tidak diarahkan menjadi keras tanpa ilmu.</p>
					<p>Ukhuwah Islamiyah bukan berarti semua perbedaan dianggap sama. Ukhuwah berarti perbedaan dikelola dengan akhlak, hukum, dan kemaslahatan. Santri perlu mengenal batas aqidah, memahami sejarah, mampu membaca sumber, dan tidak mudah terseret provokasi. Dalam masyarakat majemuk seperti Indonesia, kedewasaan bermazhab adalah bagian dari adab kebangsaan dan adab keilmuan.</p>
				</div>
			</div>

			<div id="adab-membaca" class="rounded-[1.5rem] scroll-mt-24 border border-sky-100 bg-sky-50 p-5">
				<h3 class="text-xl font-semibold text-slate-900">5. Adab membaca perbedaan mazhab</h3>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					{#each readingPrinciples as principle}
						<p class="rounded-2xl bg-white p-4 text-sm font-semibold leading-7 text-slate-700">{principle}</p>
					{/each}
				</div>
				<div class="mt-5 flex flex-wrap gap-2">
					<a href="#ormas-indonesia" class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-700 hover:text-white">Lihat ormas Indonesia</a>
					<a href="#sumber-rujukan" class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-700 hover:text-white">Lihat sumber rujukan</a>
				</div>
			</div>

			<div class="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
				<h3 class="text-xl font-semibold text-slate-900">Penutup: teguh Aswaja, lapang dalam ukhuwah</h3>
				<p class="mt-4 text-sm leading-7 text-slate-700">SantriOnline memandang materi ini sebagai pendidikan literasi mazhab. Seorang santri harus kokoh dalam aqidah Ahlussunnah wal Jama’ah, mencintai para sahabat dan Ahlul Bait, menghormati ulama, serta berhati-hati dalam perkara takfir. Dialog intermazhab yang benar bukan berarti menghapus perbedaan, tetapi mengelolanya dengan ilmu, adab, dan maslahat umat.</p>
			</div>
		</div>
	</section>

	<section id="sumber-rujukan" class="grid scroll-mt-24 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
		<div class="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-rose-700">Kesimpulan</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">NU paling besar secara afiliasi publik Indonesia</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700">
				Secara survei Indonesia, NU menempati posisi dominan. Muhammadiyah lebih kecil dalam afiliasi responden,
				tetapi sangat besar dalam kualitas organisasi, amal usaha, pendidikan, kesehatan, dan pengaruh pemikiran.
				Ormas lain sering tidak besar secara nasional, namun kuat secara regional dan membentuk keragaman umat.
			</p>
			<div class="mt-5 flex flex-wrap gap-2">
				<a href="#afiliasi-indonesia" class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-700 hover:text-white">Bandingkan afiliasi</a>
				<a href="#dialog-intermazhab" class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-700 hover:text-white">Baca dialog mazhab</a>
			</div>
		</div>

		<div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sumber Rujukan</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Rujukan angka dan sejarah</h2>
			<div class="mt-5 grid gap-3 md:grid-cols-2">
				{#each sourceLinks as source}
					<a
						href={source.href}
						target="_blank"
						rel="noreferrer"
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
					>
						<p class="text-sm font-semibold text-slate-900">{source.label}</p>
						<p class="mt-2 text-xs leading-5 text-slate-600">{source.note}</p>
					</a>
				{/each}
			</div>
		</div>
	</section>
</div>