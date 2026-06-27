export type DesignCategory = 'islam' | 'sekolah' | 'tpq' | 'pesantren' | 'global' | 'cetak';

export type DesignFormat = 'Banner' | 'Poster' | 'Twibbon' | 'Sertifikat' | 'Kartu' | 'Undangan' | 'Kupon' | 'Name Tag' | 'Landing Page' | 'Formulir';

export type DesignTemplate = {
	slug: string;
	title: string;
	shortTitle: string;
	description: string;
	category: DesignCategory;
	formats: DesignFormat[];
	eventMonth: string;
	eventDate?: string;
	keywords: string[];
	audience: string[];
	printSizes: string[];
	palette: string;
	accent: string;
	cta: string;
	previewLines: string[];
	editableFields: string[];
};

export type GlobalNeed = {
	title: string;
	segment: string;
	evidence: string;
	solutions: string[];
	monetization: string;
};

export const designCategories: Record<DesignCategory, { label: string; description: string }> = {
	islam: {
		label: 'Event Islam',
		description: 'Banner, poster, twibbon, undangan, dan kebutuhan PHBI untuk masjid, TPQ, madrasah, pondok, dan remaja masjid.'
	},
	sekolah: {
		label: 'Event Sekolah',
		description: 'Template PPDB, MPLS, perpisahan, wisuda, Hari Guru, HUT RI, dan agenda sekolah yang rutin butuh cetak.'
	},
	tpq: {
		label: 'TPQ & Anak Ngaji',
		description: 'Piagam lomba, kartu hafalan, poster adab, sertifikat tahfidz, dan desain untuk guru TPQ.'
	},
	pesantren: {
		label: 'Pesantren',
		description: 'Haflah akhirussanah, khotmil Quran, wisuda tahfidz, Hari Santri, haul, dan acara pondok.'
	},
	global: {
		label: 'Kebutuhan Global',
		description: 'Arah produk untuk masjid, madrasah, lembaga zakat, komunitas Muslim diaspora, dan kelas Quran online di seluruh dunia.'
	},
	cetak: {
		label: 'Siap Cetak',
		description: 'Desain yang diarahkan ke layanan cetak banner, poster, sertifikat, stiker, kartu, dan undangan.'
	}
};

export const annualDesignMoments = [
	{ month: 'Januari', items: ['Isra Miraj', 'Semester baru', 'Try out sekolah', 'Poster motivasi belajar'] },
	{ month: 'Februari-Maret', items: ['Ramadhan', 'Jadwal imsakiyah', 'Pesantren kilat', 'Nuzulul Quran', 'Idul Fitri'] },
	{ month: 'April-Mei', items: ['Hari Kartini', 'Hardiknas', 'Wisuda TK/RA', 'Perpisahan sekolah', 'Idul Adha/Qurban'] },
	{ month: 'Juni-Juli', items: ['Tahun Baru Islam', 'PPDB/SPMB', 'MPLS', 'Tahun ajaran baru', 'Name tag siswa'] },
	{ month: 'Agustus', items: ['HUT RI sekolah', 'Hari Pramuka', 'Maulid Nabi', 'Lomba anak Islami'] },
	{ month: 'September-Oktober', items: ['Gelar karya sekolah', 'Hari Batik', 'Hari Santri', 'Sumpah Pemuda'] },
	{ month: 'November-Desember', items: ['Hari Pahlawan', 'Hari Guru', 'Class meeting', 'Raport semester', 'Kalender tahun baru'] }
];

export const globalInstitutionNeeds: GlobalNeed[] = [
	{
		title: 'Website dan profil publik lembaga',
		segment: 'Masjid, Islamic center, TPQ, madrasah, pondok, komunitas diaspora',
		evidence: 'Banyak software masjid global menonjolkan prayer times, events, donation, membership, dan announcement sebagai fitur inti.',
		solutions: ['Template landing page lembaga', 'Halaman jadwal shalat dan event', 'Profil imam/guru', 'CTA donasi/daftar/WhatsApp'],
		monetization: 'Setup sekali, langganan hosting/fitur, dan layanan desain konten bulanan.'
	},
	{
		title: 'Donasi, zakat, infaq, wakaf, dan transparansi laporan',
		segment: 'Masjid, yayasan, lembaga zakat, pondok, panitia sosial',
		evidence: 'Riset transformasi digital zakat/wakaf menekankan collection, distribution, monitoring, dan trust/transparansi.',
		solutions: ['Campaign donasi', 'Poster dan QRIS donasi', 'Laporan penyaluran siap cetak', 'Dashboard progres campaign'],
		monetization: 'Biaya setup campaign, template laporan premium, dan add-on payment/order tracking.'
	},
	{
		title: 'Manajemen madrasah dan Quran progress',
		segment: 'Islamic school, madrasa weekend, TPQ, tahfidz, kelas Quran online',
		evidence: 'Penyedia global Islamic school software menekankan attendance, Quran progress, fees, parent communication, dan teacher management.',
		solutions: ['Rapor hafalan', 'Absensi santri', 'Sertifikat tahfidz', 'Laporan untuk wali santri', 'Template jadwal kelas'],
		monetization: 'Langganan lembaga, paket cetak sertifikat/rapor, dan template akademik premium.'
	},
	{
		title: 'Komunikasi orang tua dan komunitas',
		segment: 'Sekolah Islam, TPQ, pondok, masjid komunitas diaspora',
		evidence: 'Produk masjid dan madrasah global sama-sama menjual community feed, event ticketing, member directory, dan parent communication.',
		solutions: ['Pengumuman siap share', 'Poster event', 'Form pendaftaran event', 'Newsletter dan WA copywriting'],
		monetization: 'Paket konten bulanan, layanan desain-event, dan add-on broadcast/CRM ringan.'
	},
	{
		title: 'Event Islam dan pendidikan yang berulang',
		segment: 'Panitia PHBI, sekolah, pesantren, masjid, komunitas Muslim',
		evidence: 'Canva memiliki ribuan template wisuda; marketplace dan social search menunjukkan permintaan spanduk, poster, sertifikat, PPDB, dan event Islam.',
		solutions: ['Perpustakaan template event', 'Editor teks sederhana', 'Cetak banner/sertifikat/stiker', 'SEO Google Images'],
		monetization: 'Gratis untuk traffic, bayar edit file, bayar file HD, dan cetak fisik.'
	},
	{
		title: 'Kelas, kajian, dan dakwah digital lintas bahasa',
		segment: 'Ustadz, dai, Islamic center, komunitas mualaf, Muslim diaspora',
		evidence: 'Kebutuhan global Muslim tidak hanya administratif; mereka perlu materi edukasi aman, multi-bahasa, jadwal kelas, rekaman, dan sertifikat.',
		solutions: ['Template poster kajian multilingual', 'Halaman kelas/kajian', 'Sertifikat peserta', 'Materi PDF ringkas'],
		monetization: 'Paket desain kajian, landing page kelas, dan sertifikat digital/cetak.'
	}
];

export const designTemplates: DesignTemplate[] = [
	{
		slug: 'banner-isra-miraj-masjid-tpq',
		title: 'Banner Isra Miraj untuk Masjid, TPQ, dan Madrasah',
		shortTitle: 'Banner Isra Miraj',
		description: 'Referensi banner Isra Miraj dengan nuansa masjid malam, cocok untuk pengajian umum, lomba anak, dan acara PHBI lembaga Islam.',
		category: 'islam',
		formats: ['Banner', 'Poster', 'Undangan'],
		eventMonth: 'Januari / Rajab',
		eventDate: '27 Rajab / libur nasional menyesuaikan SKB',
		keywords: ['contoh banner isra miraj', 'desain isra miraj', 'spanduk isra miraj masjid', 'poster isra miraj tpq'],
		audience: ['Masjid', 'TPQ', 'Madrasah', 'Remaja Masjid'],
		printSizes: ['3 x 1 m', '4 x 1 m', 'A3', 'Feed Instagram'],
		palette: 'from-indigo-900 via-sky-800 to-emerald-700',
		accent: 'Bulan sabit, kubah, langit malam',
		cta: 'Cetak banner Isra Miraj',
		previewLines: ['Peringatan Isra Miraj Nabi Muhammad', 'Meraih hikmah shalat dan perjalanan agung Rasulullah', 'Masjid / TPQ / Madrasah'],
		editableFields: ['Nama lembaga', 'Tema acara', 'Tanggal', 'Tempat', 'Nama penceramah', 'Logo panitia']
	},
	{
		slug: 'jadwal-imsakiyah-ramadhan-tpq-masjid',
		title: 'Jadwal Imsakiyah Ramadhan untuk Masjid dan TPQ',
		shortTitle: 'Jadwal Imsakiyah',
		description: 'Template jadwal imsakiyah Ramadhan yang bisa dipakai masjid, musholla, sekolah Islam, dan TPQ sebagai poster, selebaran, atau file cetak.',
		category: 'islam',
		formats: ['Poster', 'Banner'],
		eventMonth: 'Februari-Maret / Ramadhan',
		keywords: ['jadwal imsakiyah ramadhan', 'template imsakiyah masjid', 'desain jadwal ramadhan', 'poster ramadhan tpq'],
		audience: ['Masjid', 'Musholla', 'TPQ', 'Wali Santri'],
		printSizes: ['A4', 'A3', '60 x 90 cm', 'Feed Instagram'],
		palette: 'from-emerald-900 via-teal-700 to-lime-600',
		accent: 'Lentera, ornamen geometri, meja kajian',
		cta: 'Cetak jadwal imsakiyah',
		previewLines: ['Jadwal Imsakiyah Ramadhan 1447 H', 'Untuk jamaah dan wali santri', 'Siap edit wilayah dan logo lembaga'],
		editableFields: ['Wilayah', 'Nama masjid/TPQ', 'Logo', 'Kontak panitia', 'Catatan zakat', 'Daftar waktu imsak']
	},
	{
		slug: 'banner-idul-adha-qurban-panitia',
		title: 'Banner Idul Adha dan Panitia Qurban',
		shortTitle: 'Banner Qurban',
		description: 'Template promosi qurban, pengumuman penerimaan hewan qurban, kupon panitia, dan laporan singkat untuk masjid atau lembaga.',
		category: 'islam',
		formats: ['Banner', 'Poster', 'Kupon'],
		eventMonth: 'Mei-Juni / Dzulhijjah',
		keywords: ['banner qurban', 'desain idul adha', 'kupon qurban', 'spanduk panitia qurban'],
		audience: ['Masjid', 'Panitia Qurban', 'Musholla', 'Sekolah Islam'],
		printSizes: ['3 x 1 m', '4 x 1 m', 'Kupon A6', 'A3'],
		palette: 'from-amber-800 via-orange-700 to-red-700',
		accent: 'Siluet hewan qurban, pola gurun, ornamen Islami',
		cta: 'Cetak banner dan kupon qurban',
		previewLines: ['Panitia Qurban Idul Adha 1447 H', 'Amanah, tertib, dan transparan untuk jamaah', 'Masjid / Musholla / Sekolah'],
		editableFields: ['Nama panitia', 'Harga patungan', 'Tanggal penyembelihan', 'Kontak', 'Rekening/QRIS', 'Alamat']
	},
	{
		slug: 'banner-maulid-nabi-pengajian-umum',
		title: 'Banner Maulid Nabi untuk Pengajian Umum',
		shortTitle: 'Banner Maulid Nabi',
		description: 'Referensi banner Maulid Nabi bernuansa hijau-emas untuk acara shalawat, pengajian umum, lomba anak, dan peringatan PHBI.',
		category: 'islam',
		formats: ['Banner', 'Poster', 'Twibbon', 'Undangan'],
		eventMonth: 'Agustus-September / Rabiul Awal',
		keywords: ['banner maulid nabi', 'contoh spanduk maulid', 'poster maulid nabi', 'desain pengajian maulid'],
		audience: ['Masjid', 'TPQ', 'Majelis Taklim', 'Pondok Pesantren'],
		printSizes: ['3 x 1 m', '4 x 1 m', 'A3', 'Story Instagram'],
		palette: 'from-emerald-950 via-green-800 to-yellow-600',
		accent: 'Ornamen maulid, kubah, kaligrafi shalawat',
		cta: 'Cetak banner Maulid',
		previewLines: ['Peringatan Maulid Nabi Muhammad', 'Meneladani akhlak Rasulullah dalam kehidupan', 'Pengajian umum dan shalawat bersama'],
		editableFields: ['Tema acara', 'Nama penceramah', 'Tanggal', 'Tempat', 'Susunan acara', 'Logo sponsor']
	},
	{
		slug: 'twibbon-hari-santri-nasional',
		title: 'Twibbon dan Poster Hari Santri Nasional',
		shortTitle: 'Hari Santri',
		description: 'Paket template Hari Santri untuk pondok, madrasah, TPQ, dan komunitas santri: twibbon, poster lomba, banner apel, dan sertifikat.',
		category: 'pesantren',
		formats: ['Twibbon', 'Poster', 'Banner', 'Sertifikat'],
		eventMonth: 'Oktober',
		eventDate: '22 Oktober',
		keywords: ['twibbon hari santri', 'poster hari santri', 'banner hari santri nasional', 'desain lomba hari santri'],
		audience: ['Pondok Pesantren', 'Madrasah', 'TPQ', 'Alumni Santri'],
		printSizes: ['Feed Instagram', 'Story Instagram', '3 x 1 m', 'A4 Sertifikat'],
		palette: 'from-lime-900 via-emerald-700 to-yellow-500',
		accent: 'Sarung, peci, bendera merah putih, kitab',
		cta: 'Cetak banner Hari Santri',
		previewLines: ['Selamat Hari Santri Nasional', 'Jihad santri, ilmu, adab, dan khidmah negeri', '22 Oktober'],
		editableFields: ['Nama pondok/lembaga', 'Tema tahunan', 'Foto peserta', 'Logo', 'Hashtag', 'Nama lomba']
	},
	{
		slug: 'banner-wisuda-tahfidz-tpq',
		title: 'Banner Wisuda Tahfidz dan Khotmil Quran TPQ',
		shortTitle: 'Wisuda Tahfidz',
		description: 'Template banner dan backdrop wisuda tahfidz, khotmil Quran, imtihan, dan haflah akhirussanah untuk TPQ, rumah tahfidz, dan pondok.',
		category: 'tpq',
		formats: ['Banner', 'Sertifikat', 'Undangan'],
		eventMonth: 'Mei-Juni / Akhir tahun ajaran',
		keywords: ['banner wisuda tahfidz', 'spanduk khotmil quran', 'desain haflah akhirussanah', 'sertifikat tahfidz'],
		audience: ['TPQ', 'Rumah Tahfidz', 'Pondok', 'Wali Santri'],
		printSizes: ['4 x 2 m', '3 x 1 m', 'A4 Sertifikat', 'Undangan A5'],
		palette: 'from-blue-950 via-indigo-800 to-cyan-600',
		accent: 'Mushaf, podium, bintang prestasi, ornamen elegan',
		cta: 'Cetak backdrop wisuda tahfidz',
		previewLines: ['Wisuda Tahfidz & Khotmil Quran', 'Menguatkan generasi cinta Al-Quran', 'TPQ / Rumah Tahfidz / Pondok'],
		editableFields: ['Nama acara', 'Angkatan', 'Nama lembaga', 'Tanggal', 'Tempat', 'Daftar wisudawan']
	},
	{
		slug: 'banner-perpisahan-sekolah-ra-mi',
		title: 'Banner Perpisahan Sekolah RA, MI, SD, SMP',
		shortTitle: 'Perpisahan Sekolah',
		description: 'Referensi desain banner perpisahan dan pelepasan siswa yang cocok untuk RA/TK, MI/SD, MTs/SMP, dan sekolah Islam.',
		category: 'sekolah',
		formats: ['Banner', 'Undangan', 'Sertifikat'],
		eventMonth: 'Mei-Juni',
		keywords: ['banner perpisahan sekolah', 'spanduk pelepasan siswa', 'desain wisuda tk', 'backdrop perpisahan sekolah'],
		audience: ['RA/TK', 'MI/SD', 'MTs/SMP', 'Komite Sekolah'],
		printSizes: ['4 x 2 m', '3 x 1 m', 'A5 Undangan', 'A4 Sertifikat'],
		palette: 'from-purple-900 via-fuchsia-700 to-pink-500',
		accent: 'Balon, topi wisuda, panggung, foto kelas',
		cta: 'Cetak banner perpisahan',
		previewLines: ['Pelepasan dan Perpisahan Peserta Didik', 'Teruslah belajar, beradab, dan berprestasi', 'Tahun Pelajaran 2025/2026'],
		editableFields: ['Nama sekolah', 'Tema acara', 'Tahun pelajaran', 'Foto siswa', 'Nama kepala sekolah', 'Tanggal']
	},
	{
		slug: 'poster-ppdb-sekolah-islam-tpq',
		title: 'Poster PPDB Sekolah Islam, Madrasah, dan TPQ',
		shortTitle: 'Poster PPDB',
		description: 'Template PPDB/SPMB untuk sekolah Islam, madrasah, pondok, TPQ, dan rumah tahfidz dengan CTA WhatsApp dan QR pendaftaran.',
		category: 'sekolah',
		formats: ['Poster', 'Banner', 'Formulir'],
		eventMonth: 'Juni-Juli / Awal tahun ajaran',
		keywords: ['poster ppdb sekolah islam', 'banner ppdb madrasah', 'desain penerimaan santri baru', 'spanduk spmb tpq'],
		audience: ['Sekolah Islam', 'Madrasah', 'TPQ', 'Pondok Pesantren'],
		printSizes: ['A4', 'A3', '60 x 90 cm', '3 x 1 m'],
		palette: 'from-sky-900 via-blue-700 to-emerald-600',
		accent: 'Anak belajar, gedung sekolah, QR, badge program',
		cta: 'Cetak poster PPDB',
		previewLines: ['Penerimaan Peserta Didik Baru', 'Daftar sekarang, kuota terbatas', 'Program Quran, adab, dan akademik'],
		editableFields: ['Nama sekolah', 'Gelombang pendaftaran', 'Biaya', 'Program unggulan', 'Nomor WhatsApp', 'QR pendaftaran']
	},
	{
		slug: 'name-tag-mpls-anak-sekolah-islam',
		title: 'Name Tag MPLS Anak Sekolah Islam',
		shortTitle: 'Name Tag MPLS',
		description: 'Template name tag MPLS dan masa taaruf siswa baru yang bisa dicetak massal untuk RA, MI, MTs, sekolah Islam, dan pondok.',
		category: 'sekolah',
		formats: ['Name Tag', 'Kartu'],
		eventMonth: 'Juli',
		keywords: ['name tag mpls', 'template kartu mpls', 'desain masa taaruf siswa', 'name tag siswa baru'],
		audience: ['Sekolah', 'Madrasah', 'Pondok', 'Panitia MPLS'],
		printSizes: ['A6', 'ID Card 9 x 5.5 cm', 'A4 isi banyak'],
		palette: 'from-orange-800 via-amber-600 to-lime-500',
		accent: 'Badge nama, ikon sekolah, warna kelas',
		cta: 'Cetak name tag MPLS',
		previewLines: ['Masa Pengenalan Lingkungan Sekolah', 'Nama: ____________', 'Kelas / Kelompok'],
		editableFields: ['Nama sekolah', 'Logo', 'Nama siswa', 'Kelompok', 'Warna kelas', 'Kontak panitia']
	},
	{
		slug: 'sertifikat-lomba-anak-tpq',
		title: 'Sertifikat Lomba Anak TPQ dan Sekolah Islam',
		shortTitle: 'Sertifikat Lomba',
		description: 'Template sertifikat lomba adzan, tartil, tahfidz, pidato dai cilik, mewarnai Islami, dan lomba Ramadhan untuk anak.',
		category: 'tpq',
		formats: ['Sertifikat'],
		eventMonth: 'Sepanjang tahun',
		keywords: ['sertifikat lomba tpq', 'piagam lomba adzan', 'sertifikat tahfidz anak', 'piagam lomba islami'],
		audience: ['TPQ', 'Sekolah Islam', 'Panitia Lomba', 'Guru Ngaji'],
		printSizes: ['A4 Landscape', 'A4 Portrait', 'F4'],
		palette: 'from-yellow-800 via-amber-500 to-orange-400',
		accent: 'Medali, laurel, mushaf, bingkai elegan',
		cta: 'Cetak sertifikat lomba',
		previewLines: ['Sertifikat Penghargaan', 'Diberikan kepada peserta terbaik', 'Lomba Anak Shalih'],
		editableFields: ['Nama peserta', 'Jenis lomba', 'Peringkat', 'Tanggal', 'Tanda tangan', 'Stempel/logo']
	},
	{
		slug: 'landing-page-donasi-masjid-zakat-wakaf',
		title: 'Landing Page Donasi Masjid, Zakat, Infaq, dan Wakaf',
		shortTitle: 'Donasi Masjid',
		description: 'Template kampanye donasi untuk masjid, yayasan, pondok, dan lembaga sosial Islam: cerita program, target dana, QRIS, laporan, dan CTA share.',
		category: 'global',
		formats: ['Landing Page', 'Poster'],
		eventMonth: 'Sepanjang tahun / Ramadhan / Qurban',
		keywords: ['website donasi masjid', 'template zakat infaq wakaf', 'poster qris donasi masjid', 'campaign wakaf digital'],
		audience: ['Masjid', 'Yayasan', 'Lembaga Zakat', 'Pondok'],
		printSizes: ['Landing Page', 'A4 Laporan', 'Poster A3', 'Story WhatsApp'],
		palette: 'from-teal-950 via-emerald-800 to-green-500',
		accent: 'QRIS, kotak amal, progres campaign, laporan amanah',
		cta: 'Buat halaman dan materi donasi',
		previewLines: ['Gerakan Wakaf dan Infaq Masjid', 'Transparan, amanah, mudah dibagikan', 'Scan QRIS atau hubungi panitia'],
		editableFields: ['Nama campaign', 'Target donasi', 'QRIS/rekening', 'Program', 'Laporan penyaluran', 'Kontak panitia']
	},
	{
		slug: 'poster-kajian-multibahasa-islamic-center',
		title: 'Poster Kajian Multibahasa untuk Islamic Center',
		shortTitle: 'Kajian Multibahasa',
		description: 'Template poster kajian untuk komunitas Muslim global dan diaspora dengan field bahasa, lokasi, pembicara, registrasi, dan mode online/offline.',
		category: 'global',
		formats: ['Poster', 'Landing Page', 'Sertifikat'],
		eventMonth: 'Sepanjang tahun',
		keywords: ['islamic center event poster', 'muslim community class poster', 'poster kajian online', 'sertifikat kelas islam'],
		audience: ['Islamic Center', 'Komunitas Muslim Diaspora', 'Kelas Online', 'Dai/Ustadz'],
		printSizes: ['Feed Instagram', 'Story', 'A3', 'Landing Page'],
		palette: 'from-slate-950 via-indigo-800 to-cyan-600',
		accent: 'Globe, masjid modern, laptop kelas online, QR registrasi',
		cta: 'Buat poster kajian dan registrasi',
		previewLines: ['Weekly Islamic Class', 'Quran, Adab, Family, and Community', 'Online + Onsite Registration'],
		editableFields: ['Bahasa kajian', 'Nama pembicara', 'Zona waktu', 'Link Zoom', 'Alamat', 'QR registrasi']
	}
];

export const featuredDesignTemplates = designTemplates.slice(0, 6);
export const getDesignTemplate = (slug: string) => designTemplates.find((template) => template.slug === slug);
export const getDesignTemplatesByCategory = (category: DesignCategory) => designTemplates.filter((template) => template.category === category);

export const printProducts = [
	{ name: 'Banner / Spanduk', price: 'Mulai Rp18.000/m2', note: 'Untuk PHBI, PPDB, perpisahan, wisuda, dan qurban.' },
	{ name: 'Poster A3/A4', price: 'Mulai Rp3.000/lembar', note: 'Untuk pengumuman sekolah, kajian, lomba, dan promosi.' },
	{ name: 'Sertifikat / Piagam', price: 'Mulai Rp2.500/lembar', note: 'Cocok untuk lomba TPQ, tahfidz, class meeting, dan penghargaan.' },
	{ name: 'Stiker / Label', price: 'Mulai Rp10.000/paket', note: 'Stiker santri, label nama, QR, dan souvenir kecil.' },
	{ name: 'Undangan / Kartu', price: 'Mulai Rp1.500/lembar', note: 'Undangan pengajian, haflah, wisuda, dan acara lembaga.' }
];
