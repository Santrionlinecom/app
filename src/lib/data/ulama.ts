export type Scholar = {
	slug: string;
	nama: string;
	era: string;
	region: string;
	legacy: string;
	story: string;
	quote?: string;
};

export const ulama: Scholar[] = [
	{
		slug: 'imam-abu-hanifah',
		nama: 'Imam Abu Hanifah',
		era: '80-150 H / Kufah',
		region: 'Ulama ahli ra’yi, pendiri Mazhab Hanafi',
		legacy:
			'Guru besar fiqih di Kufah, murid Hammad bin Abi Sulaiman, sanad ilmunya bersambung ke Sayyidina Ali.',
		story:
			'Dikenal sebagai An-Nu’man bin Tsabit, beliau teladan dalam kedermawanan dan keteguhan kepada kebenaran. Fakir miskin kerap disokong dagangannya, dan ia menolak jabatan qadhi demi menghindari tekanan politik. Mazhab Hanafi menyebar ke Irak, Turki, Asia Tengah, India, dan diasuh banyak Wali di Nusantara.',
		quote: '“Al-fiqhu ma’rifatul nafs ma laha wa ma ‘alaiha.” – Fiqih mengenalkan hak dan kewajiban jiwa.'
	},
	{
		slug: 'imam-malik',
		nama: 'Imam Malik',
		era: '93-179 H / Madinah',
		region: 'Imam Dar al-Hijrah, pendiri Mazhab Maliki',
		legacy:
			'Pengarang Al-Muwaththa’, merumuskan amal ahl al-Madinah sebagai hujjah, sanad haditsnya dikenal “silsilah dzahabiyah”.',
		story:
			'Beliau tumbuh di Madinah, belajar dari tabi’in besar seperti Nafi’ maula Ibn Umar. Keteguhan menjaga adab terhadap Rasulullah ﷺ membuatnya tidak menunggangi tunggangan di kota Madinah. Mazhab Maliki kuat di Hijaz, Afrika Utara, Andalusia, dan pernah menjadi rujukan mufti di Kesultanan Utsmani.',
		quote: '“Ilmu itu cahaya, dan Allah tidak memberikannya kepada ahli maksiat.”'
	},
	{
		slug: 'imam-syafii',
		nama: 'Imam Syafi’i',
		era: '150-204 H / Gaza, Makkah, Baghdad, Mesir',
		region: 'Pendiri Mazhab Syafi’i',
		legacy:
			'Perumus ushul fiqih modern melalui Ar-Risalah, menggabungkan kekuatan hadits Madinah dan metode istinbath Kufah.',
		story:
			'Sejak kecil hafal Qur’an, belajar kepada Imam Malik, kemudian mengembangkan qoul qadim di Irak dan qoul jadid di Mesir. Di Nusantara, mazhab Syafi’i menjadi arus besar fiqih pesantren dan diamalkan luas oleh ulama Aswaja.',
		quote: '“Pendapatku benar tapi mungkin salah; pendapat orang lain salah tapi mungkin benar.”'
	},
	{
		slug: 'imam-ahmad',
		nama: 'Imam Ahmad bin Hanbal',
		era: '164-241 H / Baghdad',
		region: 'Muhaddits besar, pendiri Mazhab Hanbali',
		legacy:
			'Pengarang Musnad Ahmad, simbol keteguhan aqidah Ahlussunnah saat fitnah khalq al-Qur’an, guru para imam hadits.',
		story:
			'Menghafal sejuta hadits menurut riwayat murid-muridnya. Ujian cambuk tidak menggoyahkan komitmen beliau sampai wafat. Mazhab Hanbali dipraktikkan di Syam, Irak, kemudian menjadi salah satu mazhab resmi di Jazirah Arab.',
		quote: '“Ash-shabru ‘ala ats-tsabat khairun min al-qahr.” – Bersabar dalam keteguhan lebih utama daripada paksaan.'
	},
	{
		slug: 'imam-ghazali',
		nama: 'Imam al-Ghazali',
		era: '450-505 H / Thus, Baghdad',
		region: 'Hujjatul Islam, pembaru abad ke-5 H',
		legacy:
			'Menyintesakan fiqih, kalam, dan tasawuf dalam Ihya’ Ulumuddin; menguatkan jalan Imam Asy’ari dan Imam Syafi’i.',
		story:
			'Setelah karier akademik di Nizamiyyah Baghdad, beliau beruzlah mencari ketenangan batin, lalu kembali dengan karya-karya monumental. Ihya’ menjadi kitab pokok pesantren dan madrasah Aswaja seluruh dunia.',
		quote: '“Bukan ilmu yang dicela, tapi orang yang salah memakainya.”'
	},
	{
		slug: 'imam-nawawi',
		nama: 'Imam an-Nawawi',
		era: '631-676 H / Nawa, Damaskus',
		region: 'Pakar hadits dan fiqih Syafi’i',
		legacy:
			'Penulis Riyadhus Shalihin, Arba’in Nawawi, dan Syarah Shahih Muslim; menjadi rujukan adab dan fiqih pesantren.',
		story:
			'Hidup zuhud, menolak fasilitas kerajaan, dan fokus mengajar-mengarang. Karya pendeknya seperti Arbain merangkum pokok ajaran Islam dan menjadi hafalan dasar santri di Nusantara.',
		quote: '“Barang siapa yang bersungguh-sungguh, ia akan mendapat petunjuk.”'
	}
];
