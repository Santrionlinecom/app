import { islamicDynasties, type IslamicDynasty } from './dinasti';
import { nabiList } from './nabi';
import { tabiinFigures } from './tabiin';
import { tabiutTabiinFigures } from './tabiut-tabiin';
import { ulama } from './ulama';

export type SanadGeneration = 'rasul' | 'sahabat' | 'tabiin' | 'tabiut-tabiin' | 'ulama';

export type SanadConnection = {
	slug: string;
	relation: string;
};

export type PoliticalContext = {
	label: string;
	note: string;
	href?: string;
};

export type SanadFigure = {
	slug: string;
	order: number;
	name: string;
	title: string;
	cluster?: string;
	generation: SanadGeneration;
	generationLabel: string;
	periodLabel: string;
	region: string;
	focus: string;
	summary: string;
	detail: string;
	aliases: string[];
	ancestors: SanadConnection[];
	politicalContexts: PoliticalContext[];
	dynastySlugs: string[];
	legacyPath?: string;
};

type FigureOverride = {
	slug?: string;
	order: number;
	title: string;
	cluster?: string;
	periodLabel?: string;
	aliases?: string[];
	detail?: string;
	ancestors: SanadConnection[];
	politicalContexts: PoliticalContext[];
	dynastySlugs?: string[];
	legacyPath?: string;
};

export const sanadGenerations: Array<{ key: SanadGeneration; label: string }> = [
	{ key: 'rasul', label: 'Rasulullah' },
	{ key: 'sahabat', label: 'Sahabat' },
	{ key: 'tabiin', label: "Tabi'in" },
	{ key: 'tabiut-tabiin', label: "Tabi'ut Tabi'in" },
	{ key: 'ulama', label: 'Ulama dan Imam Mazhab' }
];

export const wahyuPrelude = {
	title: 'Pembuka sanad: dari Allah, melalui Jibril, kepada Rasulullah',
	summary:
		'Rantai sanad Islam dimulai dari wahyu. Allah menurunkan Al-Qur`an, Jibril AS menyampaikannya kepada Nabi Muhammad SAW, lalu Rasulullah membina para sahabat. Dari generasi sahabat, ilmu bergerak ke tabi`in, tabi`ut tabi`in, lalu ke imam mazhab dan ulama sesudahnya.',
	references: ['QS Al-Baqarah 2:97', "QS Asy-Syu'ara 26:192-195", 'QS Al-Qadr 97:1'],
	stages: [
		{
			label: 'Allah Ta`ala',
			desc: 'Sumber wahyu, syariat, dan petunjuk bagi seluruh manusia.'
		},
		{
			label: 'Malaikat Jibril AS',
			desc: 'Ruh al-Amin yang membawa wahyu kepada para nabi dengan izin Allah.'
		},
		{
			label: 'Rasulullah Muhammad SAW',
			href: '/tokoh/muhammad',
			desc: 'Penerima Al-Qur`an terakhir dan pembina generasi sahabat.'
		},
		{
			label: 'Sahabat',
			href: '/sahabat',
			desc: 'Saksi wahyu yang belajar langsung dari Rasulullah dan menyebarkan Islam.'
		},
		{
			label: "Tabi'in",
			href: '/tabiin',
			desc: 'Murid para sahabat yang menguatkan fiqih, hadis, dan adab.'
		},
		{
			label: "Tabi'ut Tabi'in",
			href: '/tabiut-tabiin',
			desc: 'Fase kodifikasi awal, kritik sanad, dan pematangan disiplin ilmu.'
		},
		{
			label: 'Ulama dan Imam Mazhab',
			href: '/ulama',
			desc: 'Jalur ilmu berlanjut ke mazhab, kitab, madrasah, dan pesantren.'
		}
	]
};

export const sanadMilestones = [
	{
		year: '610 M',
		title: 'Wahyu pertama di Gua Hira',
		desc: 'Turunnya wahyu menandai awal risalah Islam dan menjadi titik awal seluruh rantai sanad.'
	},
	{
		year: '622 M',
		title: 'Hijrah dan lahirnya masyarakat Madinah',
		desc: 'Ajaran Islam tidak lagi hanya dibacakan, tetapi dibentuk menjadi masyarakat, hukum, dan adab hidup.'
	},
	{
		year: '632-661 M',
		title: 'Sahabat menyebarkan Islam',
		desc: 'Khulafaur Rasyidin dan para sahabat membawa ilmu ke Madinah, Makkah, Kufah, Basrah, Syam, dan Mesir.'
	},
	{
		year: 'abad 1-2 H',
		title: "Tabi'in merapikan jalur ilmu",
		desc: 'Pusat-pusat fatwa dan periwayatan lahir; guru-murid mulai terbaca jelas per kota.'
	},
	{
		year: 'abad 2 H',
		title: "Tabi'ut tabi'in mematangkan metodologi",
		desc: 'Muwatta, kritik perawi, rihlah hadis, dan fondasi mazhab Sunni mulai tampak kuat.'
	},
	{
		year: 'abad 2-7 H',
		title: 'Imam mazhab dan ulama menguatkan turats',
		desc: 'Mazhab fiqih, kitab-kitab pokok, dan jaringan madrasah memastikan sanad tetap hidup lintas wilayah.'
	},
	{
		year: 'abad 9-15 H / 15-20 M',
		title: 'Sanad masuk ke Nusantara dan tetap hidup',
		desc: 'Jalur Syafi`i-Sunni, Walisongo, habaib Hadramaut, dan pesantren Nusantara menjadikan sanad terus hidup sampai Indonesia modern.'
	}
];

const muhammadRecord = nabiList.find((item) => item.slug === 'muhammad');

if (!muhammadRecord) {
	throw new Error('Nabi Muhammad record is required for sanad data');
}

const tabiinBySlug = new Map(tabiinFigures.map((figure) => [figure.slug, figure]));
const tabiutBySlug = new Map(tabiutTabiinFigures.map((figure) => [figure.slug, figure]));
const ulamaBySlug = new Map(ulama.map((figure) => [figure.slug, figure]));
const dynastiesBySlug = new Map(islamicDynasties.map((dynasty) => [dynasty.slug, dynasty]));

function requiredTabiin(slug: string) {
	const record = tabiinBySlug.get(slug);
	if (!record) {
		throw new Error(`Missing tabiin record for ${slug}`);
	}
	return record;
}

function requiredTabiut(slug: string) {
	const record = tabiutBySlug.get(slug);
	if (!record) {
		throw new Error(`Missing tabiut-tabiin record for ${slug}`);
	}
	return record;
}

function requiredUlama(slug: string) {
	const record = ulamaBySlug.get(slug);
	if (!record) {
		throw new Error(`Missing ulama record for ${slug}`);
	}
	return record;
}

function buildTabiinFigure(slug: string, override: FigureOverride): SanadFigure {
	const record = requiredTabiin(slug);

	return {
		slug: override.slug ?? slug,
		order: override.order,
		name: record.name,
		title: override.title,
		cluster: override.cluster,
		generation: 'tabiin',
		generationLabel: "Tabi'in",
		periodLabel: override.periodLabel ?? record.era,
		region: record.center,
		focus: record.focus,
		summary: record.summary,
		detail:
			override.detail ??
			`${record.role}. Fokus utamanya ${record.focus.toLowerCase()} dengan pusat ilmu di ${record.center}.`,
		aliases: [record.name, record.slug, ...(override.aliases ?? [])],
		ancestors: override.ancestors,
		politicalContexts: override.politicalContexts,
		dynastySlugs: override.dynastySlugs ?? [],
		legacyPath: override.legacyPath
	};
}

function buildTabiutFigure(slug: string, override: FigureOverride): SanadFigure {
	const record = requiredTabiut(slug);

	return {
		slug: override.slug ?? slug,
		order: override.order,
		name: record.name,
		title: override.title,
		cluster: override.cluster,
		generation: 'tabiut-tabiin',
		generationLabel: "Tabi'ut Tabi'in",
		periodLabel: override.periodLabel ?? record.era,
		region: record.center,
		focus: record.focus,
		summary: record.summary,
		detail:
			override.detail ??
			`${record.role}. Fokus utamanya ${record.focus.toLowerCase()} dan menjadi jembatan ke fase kodifikasi yang lebih matang.`,
		aliases: [record.name, record.slug, ...(override.aliases ?? [])],
		ancestors: override.ancestors,
		politicalContexts: override.politicalContexts,
		dynastySlugs: override.dynastySlugs ?? [],
		legacyPath: override.legacyPath
	};
}

function buildUlamaFigure(slug: string, override: FigureOverride): SanadFigure {
	const record = requiredUlama(slug);

	return {
		slug: override.slug ?? slug,
		order: override.order,
		name: record.nama,
		title: override.title,
		cluster: override.cluster,
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: override.periodLabel ?? record.era,
		region: record.region,
		focus: record.region,
		summary: record.legacy,
		detail: override.detail ?? record.story,
		aliases: [record.nama, record.slug, ...(override.aliases ?? [])],
		ancestors: override.ancestors,
		politicalContexts: override.politicalContexts,
		dynastySlugs: override.dynastySlugs ?? [],
		legacyPath: override.legacyPath
	};
}

const rasulFigure: SanadFigure = {
	slug: 'muhammad',
	order: 1,
	name: muhammadRecord.name,
	title: 'Rasul penutup dan penerima wahyu terakhir',
	generation: 'rasul',
	generationLabel: 'Rasulullah',
	periodLabel: '570-632 M / 53 SH-11 H',
	region: 'Makkah dan Madinah',
	focus: 'Wahyu, sunnah, tarbiyah sahabat, dan risalah untuk seluruh alam',
	summary: muhammadRecord.summary,
	detail:
		'Rasulullah SAW menerima wahyu melalui Malaikat Jibril AS, membina sahabat di fase Makkah dan Madinah, lalu mewariskan Al-Qur`an, sunnah, adab, serta manhaj belajar yang menjadi fondasi seluruh sanad Islam.',
	aliases: ['Nabi Muhammad', 'Nabi Muhammad SAW', 'Rasulullah', 'Muhammad', 'muhammad'],
	ancestors: [],
	politicalContexts: [
		{
			label: 'Turunnya wahyu di Makkah',
			note: '610 M menjadi awal risalah; dakwah dimulai dari tauhid, tazkiyah, dan pembinaan iman.'
		},
		{
			label: 'Negara Madinah',
			note: '622-632 M; Islam hidup sebagai ibadah, hukum, adab, dan masyarakat yang nyata.'
		}
	],
	dynastySlugs: [],
	legacyPath: '/nabi/muhammad'
};

const sahabatFigures: SanadFigure[] = [
	{
		slug: 'abu-bakar',
		order: 10,
		name: 'Abu Bakar ash-Shiddiq',
		title: 'Sahabat utama dan khalifah pertama',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '573-634 M / 50 SH-13 H',
		region: 'Makkah, Madinah, dan ekspansi awal ke Syam-Irak',
		focus: 'Shuhbah, keteguhan iman, dan stabilitas umat pasca wafat Rasulullah',
		summary:
			'Sahabat terdekat Rasulullah SAW, khalifah pertama, dan penjaga stabilitas umat pada fase paling kritis setelah wafat Nabi.',
		detail:
			'Abu Bakar menjaga zakat, memadamkan riddah, dan membuka fase penyebaran Islam yang lebih luas. Jalur keluarganya juga menjadi simpul ilmu penting melalui Aisyah dan al-Qasim ibn Muhammad.',
		aliases: ['Abu Bakar', 'Abu Bakar Ash-Shiddiq', 'abu-bakar'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'sahabat paling dekat yang menerima tarbiyah, iman, dan amanah dakwah langsung dari Rasulullah'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan Khulafaur Rasyidin',
				note: 'Hidup bersama Rasulullah lalu memimpin umat pada 632-634 M sebelum fase dinasti.'
			}
		],
		dynastySlugs: [],
		legacyPath: '/sahabat/abu-bakar'
	},
	{
		slug: 'umar',
		order: 11,
		name: 'Umar ibn al-Khattab',
		title: 'Sahabat utama dan khalifah kedua',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '584-644 M / 40 SH-23 H',
		region: 'Makkah, Madinah, Syam, Irak, dan Mesir',
		focus: 'Keadilan, administrasi negara, dan penyebaran ilmu sahabat',
		summary:
			'Umar memperluas pemerintahan Islam, merapikan administrasi, dan menjadi guru penting bagi jalur fiqih Madinah.',
		detail:
			'Pada masanya Islam masuk lebih dalam ke Syam, Irak, dan Mesir. Dalam sanad ilmu, Umar menjadi jalur penting bagi Said ibn al-Musayyib dan tradisi Ibn Umar yang kemudian memengaruhi Salim dan Nafi`.',
		aliases: ['Umar', 'Umar bin Khattab', 'Umar ibn al-Khattab', 'umar'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menerima pendidikan iman, syariat, dan kepemimpinan langsung dari Rasulullah'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin',
				note: 'Memimpin pada 634-644 M; sebelum masuk fase dinasti formal.'
			}
		],
		dynastySlugs: [],
		legacyPath: '/sahabat/umar'
	},
	{
		slug: 'utsman',
		order: 12,
		name: 'Utsman ibn Affan',
		title: 'Sahabat utama dan khalifah ketiga',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '576-656 M / 47 SH-35 H',
		region: 'Makkah, Madinah, Afrika Utara, dan wilayah maritim awal',
		focus: 'Standarisasi mushaf, perluasan dakwah, dan kedermawanan',
		summary:
			'Utsman terkenal dengan kodifikasi Mushaf Utsmani yang menjaga kesatuan bacaan Al-Qur`an bagi seluruh umat.',
		detail:
			'Perannya sangat sentral dalam menjaga mushaf dan memperkuat ekspansi ke wilayah baru. Dalam rantai ilmu, ia menjadi salah satu sumber riwayat bagi Said ibn al-Musayyib.',
		aliases: ['Utsman', 'Utsman bin Affan', 'Uthman ibn Affan', 'utsman'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'belajar langsung dari Rasulullah dan menjadi penjaga amanah umat setelah beliau'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin',
				note: 'Memimpin pada 644-656 M; masa transisi terakhir sebelum fitnah besar.'
			}
		],
		dynastySlugs: [],
		legacyPath: '/sahabat/utsman'
	},
	{
		slug: 'ali',
		order: 13,
		name: 'Ali ibn Abi Talib',
		title: 'Sahabat utama, Ahlul Bait, dan khalifah keempat',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '600-661 M / 23 SH-40 H',
		region: 'Makkah, Madinah, Kufah',
		focus: 'Ilmu, hikmah, qadha, dan jalur keilmuan Kufah',
		summary:
			'Ali dikenal sebagai pintu ilmu, rujukan hikmah, dan simpul utama sanad fiqih Irak yang kelak berpengaruh pada Abu Hanifah.',
		detail:
			'Madrasah Kufah banyak menyimpan jejak ijtihad dan atsar dari Ali. Melalui jalur Kufah inilah sanad ilmu bergerak ke al-Sha`bi lalu ke Abu Hanifah.',
		aliases: ['Ali', 'Ali bin Abi Thalib', 'Ali ibn Abi Talib', 'ali'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'tumbuh bersama Rasulullah dan menerima ilmu, adab, serta keberanian langsung dari beliau'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin',
				note: 'Memimpin pada 656-661 M; batas akhir fase Khulafaur Rasyidin sebelum Bani Umayyah.'
			}
		],
		dynastySlugs: [],
		legacyPath: '/sahabat/ali'
	},
	{
		slug: 'aisyah',
		order: 14,
		name: 'Aisyah binti Abi Bakr',
		title: 'Ummul Mukminin dan guru besar hadis-fiqih',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '613-678 M / 9 SH-58 H',
		region: 'Makkah dan Madinah',
		focus: 'Hadis rumah tangga Nabi, fiqih, dan adab keluarga Rasulullah',
		summary:
			'Aisyah menjadi salah satu guru terbesar generasi tabi`in, terutama dalam hadis keluarga Nabi, fiqih, dan adab.',
		detail:
			'Banyak detail kehidupan Rasulullah SAW tersambung melalui Aisyah. Dari rumah beliau lahir jalur ilmu penting menuju Urwah, al-Qasim, dan Said ibn al-Musayyib.',
		aliases: ['Aisyah', 'Aisyah binti Abi Bakr', 'aisyah'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'belajar langsung dari Rasulullah dalam ruang rumah tangga, ibadah, dan penjelasan syariat'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan Khulafaur Rasyidin',
				note: 'Menjadi rujukan ilmu pada fase paling awal Islam sebelum lahirnya dinasti.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'ibn-abbas',
		order: 15,
		name: 'Abdullah ibn Abbas',
		title: 'Sahabat muda, ahli tafsir, dan lautan ilmu',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '619-687 M / 3 SH-68 H',
		region: 'Makkah, Madinah, Basrah, dan Thaif',
		focus: 'Tafsir, hadis, fiqih, dan pembinaan murid Makkah-Yaman',
		summary:
			'Ibn Abbas menjadi poros besar tafsir dan fiqih yang sangat memengaruhi Ata`, Tawus, Said ibn al-Musayyib, dan generasi sesudahnya.',
		detail:
			'Karena kedekatan dan doa Rasulullah, Ibn Abbas menjadi jalur utama penafsiran Al-Qur`an. Banyak pusat ilmu Makkah dan Yaman berdiri di atas riwayat dan fatwanya.',
		aliases: ["Ibn 'Abbas", 'Ibn Abbas', 'Abdullah ibn Abbas', 'ibn-abbas'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menerima doa, bimbingan, dan ilmu langsung dari Rasulullah sejak masa muda'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin hingga awal Umayyah',
				note: 'Menjadi jembatan ilmu dari masa sahabat ke pusat-pusat ilmu Makkah dan Thaif.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'abdullah-ibn-umar',
		order: 16,
		name: 'Abdullah ibn Umar',
		title: 'Sahabat ahli ittiba` dan teladan ibadah',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '610-693 M / 3 BH-73 H',
		region: 'Makkah dan Madinah',
		focus: 'Ibadah, atsar, ittiba` sunnah, dan fiqih amaliyah',
		summary:
			'Ibnu Umar adalah jalur penting dalam periwayatan praktik ibadah Rasulullah dan menjadi titik sentral tradisi Madinah.',
		detail:
			'Dari Abdullah ibn Umar lahir jalur emas Malik -> Nafi` -> Ibn Umar. Jalur ini sangat kuat dalam hadis dan fiqih amaliah.',
		aliases: ["Ibn 'Umar", 'Ibn Umar', 'Abdullah ibn Umar', 'abdullah-ibn-umar'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menyaksikan dan meniru praktik Rasulullah secara sangat teliti'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin hingga awal Umayyah',
				note: 'Menjadi guru penting bagi generasi Madinah setelah fase sahabat senior.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'abu-hurairah',
		order: 17,
		name: 'Abu Hurairah',
		title: 'Sahabat penjaga hadis',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '603-681 M / 19 BH-59 H',
		region: 'Madinah dan Bahrain',
		focus: 'Hadis, hafalan, dan pengajaran riwayat',
		summary:
			'Abu Hurairah menjadi salah satu jalur terbesar periwayatan hadis dan guru penting bagi sejumlah tabi`in utama.',
		detail:
			'Kekuatan hafalan dan banyaknya riwayat dari Abu Hurairah menjadikannya salah satu simpul paling hidup dalam sanad hadis Islam.',
		aliases: ['Abu Hurairah', 'abu-hurairah'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menghafal dan meriwayatkan sunnah Rasulullah secara intensif'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan Khulafaur Rasyidin',
				note: 'Aktif mengajar pada fase sahabat hingga awal perpindahan ilmu ke tabi`in.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'anas-ibn-malik',
		order: 18,
		name: 'Anas ibn Malik',
		title: 'Pelayan Rasulullah dan perawi besar',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '612-712 M / 10 SH-93 H',
		region: 'Madinah dan Basrah',
		focus: 'Hadis, adab, dan transfer ilmu ke Basrah',
		summary:
			'Anas menjadi penghubung penting sunnah Rasulullah ke ulama Basrah seperti al-Hasan al-Basri dan Ibn Sirin.',
		detail:
			'Kedekatannya dengan Rasulullah membuat riwayat Anas sangat kaya dalam adab dan keseharian Nabi. Jalurnya hidup kuat di Basrah.',
		aliases: ['Anas ibn Malik', 'Anas bin Malik', 'anas-ibn-malik'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'melayani Rasulullah dan menyerap banyak adab serta sunnah beliau'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah hingga awal Umayyah',
				note: 'Menjadi simpul ilmu antara Madinah dan Basrah pada masa transisi ke tabi`in.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'jabir-ibn-abd-allah',
		order: 19,
		name: 'Jabir ibn Abd Allah',
		title: 'Sahabat perawi hadis dan fiqih manasik',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '600-697 M / 16 SH-78 H',
		region: 'Madinah',
		focus: 'Hadis, manasik haji, dan fiqih ibadah',
		summary:
			'Jabir dikenal dalam riwayat manasik dan sejumlah hadis panjang yang banyak dipakai ulama fiqih.',
		detail:
			'Riwayat Jabir sangat penting bagi pembahasan haji dan detail ibadah. Jalurnya masuk ke tradisi Makkah melalui Ata` ibn Abi Rabah.',
		aliases: ['Jabir ibn Abd Allah', 'Jabir ibn Abdullah', 'jabir-ibn-abd-allah'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menerima hadis dan bimbingan ibadah langsung dari Rasulullah'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan generasi sahabat',
				note: 'Riwayatnya menjadi bahan penting bagi fiqih ibadah pada generasi setelah sahabat.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'zayd-ibn-thabit',
		order: 20,
		name: 'Zayd ibn Thabit',
		title: 'Penulis wahyu dan ahli faraidh',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '611-665 M / 11 SH-45 H',
		region: 'Madinah',
		focus: 'Penulisan wahyu, faraidh, dan qira`at',
		summary:
			'Zayd berperan dalam penulisan wahyu dan penghimpunan mushaf serta menjadi rujukan ilmu waris.',
		detail:
			'Keahlian Zayd dalam mushaf dan faraidh menjadikan jalurnya penting untuk disiplin hukum dan bacaan Al-Qur`an.',
		aliases: ['Zayd ibn Thabit', 'Zaid ibn Tsabit', 'zayd-ibn-thabit'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menulis wahyu dan belajar langsung dari Rasulullah dalam urusan Al-Qur`an'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan Khulafaur Rasyidin',
				note: 'Berperan penting dalam penghimpunan mushaf dan pendidikan hukum di Madinah.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'asma-bint-abi-bakr',
		order: 21,
		name: 'Asma bint Abi Bakr',
		title: 'Sahabiyah utama dan penghubung sanad keluarga Abu Bakr',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: '595-692 M / 27 BH-73 H',
		region: 'Makkah dan Madinah',
		focus: 'Adab, kekuatan iman, dan jalur keluarga Nabi-Abu Bakr',
		summary:
			'Asma menjadi penghubung penting antara generasi sahabat dengan Urwah ibn al-Zubayr dan tradisi keluarga Abu Bakr.',
		detail:
			'Lewat Asma, banyak adab, keberanian, dan riwayat keluarga awal Islam diteruskan ke generasi setelah sahabat.',
		aliases: ['Asma bint Abi Bakr', 'Asma binti Abi Bakr', 'asma-bint-abi-bakr'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'hidup dalam orbit Rasulullah dan keluarga Abu Bakr sejak fase Makkah hingga hijrah'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah hingga awal Umayyah',
				note: 'Riwayat keluarga Abu Bakr dan al-Zubayr banyak bergerak melalui dirinya.'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	},
	{
		slug: 'abu-musa-al-ashari',
		order: 22,
		name: 'Abu Musa al-Ashari',
		title: 'Sahabat ahli qira`at dan hukum',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: 'c. 603-662 M / wafat 42 H',
		region: 'Yaman, Madinah, Kufah, Basrah',
		focus: 'Qira`at, fiqih, qadha, dan penyebaran ilmu Irak',
		summary:
			'Abu Musa menjadi guru penting dalam lingkungan Irak dan berpengaruh pada jalur al-Sha`bi.',
		detail:
			'Jejak ilmunya tampak pada generasi Kufah yang menggabungkan qira`at, hukum, dan pembacaan sosial umat.',
		aliases: ['Abu Musa al-Ashari', 'abu-musa-al-ashari'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menerima pendidikan langsung dari Rasulullah dan ikut menyebarkannya ke Irak'
			}
		],
		politicalContexts: [
			{
				label: 'Khulafaur Rasyidin',
				note: 'Menjadi bagian dari penguatan ilmu dan pemerintahan di wilayah Irak.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'imran-ibn-husayn',
		order: 23,
		name: 'Imran ibn Husayn',
		title: 'Sahabat ahli ibadah dan perawi Basrah',
		generation: 'sahabat',
		generationLabel: 'Sahabat',
		periodLabel: 'c. 603-672 M / wafat 52 H',
		region: 'Madinah dan Basrah',
		focus: 'Hadis, ibadah, dan adab zuhud',
		summary:
			'Imran ibn Husayn memberi pengaruh pada jalur Basrah, terutama bagi al-Hasan al-Basri.',
		detail:
			'Riwayat dan adabnya diteruskan ke tradisi Basrah yang kelak terkenal kuat dalam nasihat, muhasabah, dan zuhud.',
		aliases: ['Imran ibn Husayn', 'Imran bin Husain', 'imran-ibn-husayn'],
		ancestors: [
			{
				slug: 'muhammad',
				relation: 'menimba sunnah dan keteladanan ibadah langsung dari Rasulullah'
			}
		],
		politicalContexts: [
			{
				label: 'Rasulullah dan awal Basrah',
				note: 'Riwayatnya menguatkan corak ilmu dan tazkiyah di Basrah.'
			}
		],
		dynastySlugs: []
	}
];

const tabiinNetwork: SanadFigure[] = [
	buildTabiinFigure('said-ibn-al-musayyib', {
		order: 30,
		title: "Faqih Madinah dan bagian dari al-Fuqaha' al-Sab'ah",
		aliases: ["Sa'id ibn al-Musayyib"],
		ancestors: [
			{ slug: 'umar', relation: 'mengambil fiqih dan kebijakan umat dari Umar' },
			{ slug: 'utsman', relation: 'meriwayatkan ilmu dan pengalaman generasi khalifah ketiga' },
			{ slug: 'aisyah', relation: 'belajar hadis dan fiqih rumah tangga Nabi dari Aisyah' },
			{ slug: 'abu-hurairah', relation: 'mengambil riwayat hadis dari Abu Hurairah' },
			{ slug: 'ibn-abbas', relation: 'mengambil fatwa dan tafsir dari Ibn Abbas' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Fase fiqih Madinah tumbuh pada masa Umayyah, tetapi pusat ilmunya tetap dijaga para tabiin.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('urwah-ibn-al-zubayr', {
		order: 31,
		title: 'Ahli hadis dan sirah keluarga Nabi',
		ancestors: [
			{ slug: 'aisyah', relation: 'mengambil jalur hadis keluarga Nabi dari Aisyah' },
			{ slug: 'asma-bint-abi-bakr', relation: 'menerima riwayat keluarga Abu Bakr dan al-Zubayr dari Asma' },
			{ slug: 'abu-hurairah', relation: 'meriwayatkan hadis dari Abu Hurairah' },
			{ slug: 'ibn-abbas', relation: 'mengambil ilmu dari Ibn Abbas' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Riwayat keluarga Nabi tetap hidup di Madinah walau pusat politik bergeser ke Damaskus.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('al-qasim-ibn-muhammad', {
		order: 32,
		title: 'Faqih Madinah dan cucu Abu Bakr',
		ancestors: [
			{ slug: 'aisyah', relation: 'mengambil ilmu langsung dari Aisyah di rumah Abu Bakr' },
			{ slug: 'ibn-abbas', relation: 'mengambil tafsir dan fatwa dari Ibn Abbas' },
			{ slug: 'abdullah-ibn-umar', relation: 'mengambil atsar dan praktik ibadah dari Ibn Umar' },
			{ slug: 'abu-bakar', relation: 'mewarisi jalur keluarga Abu Bakr melalui Aisyah dan tradisi rumah beliau' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Madrasah Madinah tetap menjadi pusat ilmu walau politik berada di tangan Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('salim-ibn-abdullah', {
		order: 33,
		title: 'Faqih Madinah dari rumah Ibn Umar',
		ancestors: [
			{ slug: 'abdullah-ibn-umar', relation: 'menerima jalur utama praktik ibadah dari ayahnya, Ibn Umar' },
			{ slug: 'aisyah', relation: 'mengambil riwayat dari Aisyah' },
			{ slug: 'abu-hurairah', relation: 'mengambil hadis dari Abu Hurairah' },
			{ slug: 'umar', relation: 'mewarisi jalur rumah Umar melalui Ibn Umar' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Salim adalah salah satu simpul utama jalur ibadah Madinah pada masa Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('nafi-mawla-ibn-umar', {
		order: 34,
		title: 'Murid utama Abdullah ibn Umar',
		ancestors: [
			{
				slug: 'abdullah-ibn-umar',
				relation: 'mengambil praktik ibadah dan riwayat langsung dari Ibn Umar'
			},
			{ slug: 'umar', relation: 'membawa warisan keluarga Umar melalui jalur Ibn Umar' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Jalur Nafi` di Madinah menjadi salah satu jalur hadis paling kuat pada masa Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('ata-ibn-abi-rabah', {
		order: 35,
		title: 'Mufti Makkah dan rujukan manasik',
		aliases: ["Ata' ibn Abi Rabah"],
		ancestors: [
			{ slug: 'ibn-abbas', relation: 'mewarisi pusat tafsir dan fiqih Makkah dari Ibn Abbas' },
			{ slug: 'abu-hurairah', relation: 'mengambil riwayat hadis dari Abu Hurairah' },
			{ slug: 'aisyah', relation: 'mengambil fiqih dan riwayat dari Aisyah' },
			{ slug: 'jabir-ibn-abd-allah', relation: 'mengambil fiqih manasik dan hadis dari Jabir' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Makkah tetap menjadi pusat fatwa dan manasik di bawah orbit Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('tawus-ibn-kaysan', {
		order: 36,
		title: 'Ulama Yaman-Makkah dalam jalur Ibn Abbas',
		ancestors: [
			{ slug: 'ibn-abbas', relation: 'mewarisi tafsir dan fiqih Makkah dari Ibn Abbas' },
			{ slug: 'aisyah', relation: 'mengambil riwayat dari Aisyah' },
			{ slug: 'zayd-ibn-thabit', relation: 'mengambil ilmu dari Zayd ibn Thabit' },
			{ slug: 'abu-hurairah', relation: 'meriwayatkan hadis dari Abu Hurairah' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Menghubungkan Yaman dengan Makkah pada masa perluasan administrasi Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('al-hasan-al-basri', {
		order: 37,
		title: 'Tokoh nasihat, tazkiyah, dan hikmah Basrah',
		ancestors: [
			{ slug: 'anas-ibn-malik', relation: 'mengambil riwayat dan adab dari Anas ibn Malik' },
			{ slug: 'ibn-abbas', relation: 'mengambil ilmu dari Ibn Abbas' },
			{ slug: 'imran-ibn-husayn', relation: 'mengambil adab dan hikmah dari Imran ibn Husayn' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Basrah tumbuh sebagai pusat nasihat, fikih, dan muhasabah pada masa Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('muhammad-ibn-sirin', {
		order: 38,
		title: 'Muhaddith dan faqih Basrah',
		ancestors: [
			{ slug: 'anas-ibn-malik', relation: 'mengambil riwayat dan adab dari Anas ibn Malik' },
			{ slug: 'abu-hurairah', relation: 'meriwayatkan hadis dari Abu Hurairah' },
			{ slug: 'ibn-abbas', relation: 'mengambil ilmu dari Ibn Abbas' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Basrah menjadi simpul ilmu hadis dan wara pada masa Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	buildTabiinFigure('al-shabi', {
		order: 39,
		title: 'Ahli riwayat Kufah dan penghubung ilmu Irak',
		aliases: ["al-Sha'bi"],
		ancestors: [
			{ slug: 'ali', relation: 'membawa jejak fiqih dan qadha Kufah dari Ali ibn Abi Talib' },
			{ slug: 'abdullah-ibn-umar', relation: 'mengambil riwayat dari Ibn Umar' },
			{ slug: 'ibn-abbas', relation: 'mengambil ilmu dari Ibn Abbas' },
			{ slug: 'abu-musa-al-ashari', relation: 'mewarisi pengaruh ilmu Irak dari Abu Musa al-Ashari' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Kufah menjadi salah satu pusat ijtihad masyarakat pada masa Umayyah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	})
];

const tabiutNetwork: SanadFigure[] = [
	buildTabiutFigure('malik-ibn-anas', {
		slug: 'imam-malik',
		order: 50,
		title: "Tabi'ut tabi'in dan imam Mazhab Maliki",
		periodLabel: '93-179 H / 711-795 M',
		aliases: ['Imam Malik', 'Malik ibn Anas', 'malik-ibn-anas'],
		detail:
			'Imam Malik hidup di Madinah dan merangkum warisan hadis, fatwa sahabat, dan praktik ahli Madinah ke dalam Al-Muwatta. Pada dirinya, jalur tabi`in bertemu dengan fase mazhab yang lebih sistematis.',
		ancestors: [
			{ slug: 'nafi-mawla-ibn-umar', relation: 'mengambil jalur emas amal ahli Madinah dari Nafi`' },
			{ slug: 'salim-ibn-abdullah', relation: 'mewarisi tradisi ibadah rumah Ibn Umar melalui lingkungan Madinah' },
			{ slug: 'al-qasim-ibn-muhammad', relation: 'mewarisi ketenangan fatwa dan jalur keluarga Abu Bakr-Aisyah' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (akhir fase hidup awal)',
				note: 'Imam Malik lahir di akhir masa kuat Umayyah ketika Madinah tetap menjadi pusat ilmu.',
				href: '/dinasti#umayyah-damaskus'
			},
			{
				label: 'Bani Abbasiyah',
				note: 'Kematangan karya dan pengaruh beliau tampak kuat pada awal Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah'],
		legacyPath: '/ulama/imam-malik'
	}),
	buildTabiutFigure('al-awzai', {
		order: 51,
		title: "Imam fiqih Syam pada fase awal",
		aliases: ["al-Awza'i"],
		ancestors: [
			{ slug: 'al-hasan-al-basri', relation: 'meneruskan corak nasihat dan kezuhudan Basrah' },
			{ slug: 'ata-ibn-abi-rabah', relation: 'mengambil jalur fiqih dan manasik Haramayn' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Syam adalah jantung politik Umayyah dan juga tempat berkembangnya fiqih al-Awza`i.',
				href: '/dinasti#umayyah-damaskus'
			},
			{
				label: 'Bani Abbasiyah',
				note: 'Pengaruh mazhabnya masih terasa pada awal Abbasiyah di Syam.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('sufyan-al-thawri', {
		order: 52,
		title: 'Imam hadis dan fiqih Irak',
		ancestors: [
			{ slug: 'al-shabi', relation: 'membawa warisan ilmu Kufah dari al-Sha`bi' },
			{ slug: 'ali', relation: 'jalur fiqih Iraknya bersambung ke madrasah Ali di Kufah' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (akhir) dan Bani Abbasiyah (awal)',
				note: 'Sufyan hidup di masa transisi politik tetapi tetap menjaga independensi ilmiah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('shubah-ibn-al-hajjaj', {
		order: 53,
		title: 'Pemuka kritik sanad generasi awal',
		aliases: ["Shu'bah ibn al-Hajjaj"],
		ancestors: [
			{ slug: 'muhammad-ibn-sirin', relation: 'meneruskan ketelitian sanad dan wara dari tradisi Basrah' },
			{ slug: 'al-hasan-al-basri', relation: 'mewarisi pengaruh tradisi ilmu Basrah' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah dan awal Bani Abbasiyah',
				note: 'Disiplin kritik perawi menguat pada masa transisi dari Umayyah ke Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('ibn-jurayj', {
		order: 54,
		title: 'Penghimpun ilmu Makkah generasi awal',
		ancestors: [
			{ slug: 'ata-ibn-abi-rabah', relation: 'menerima tradisi fiqih dan riwayat Makkah dari Ata`' },
			{ slug: 'ibn-abbas', relation: 'jalur Makkahnya tersambung ke warisan Ibn Abbas' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah dan awal Bani Abbasiyah',
				note: 'Ibn Jurayj hidup ketika tradisi Makkah mulai dikumpulkan lebih sistematis.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('layth-ibn-sad', {
		order: 55,
		title: 'Imam Mesir dan mujtahid besar',
		aliases: ["Layth ibn Sa'd"],
		ancestors: [
			{ slug: 'nafi-mawla-ibn-umar', relation: 'membawa jalur hadis Ibn Umar melalui Nafi`' },
			{ slug: 'ata-ibn-abi-rabah', relation: 'mengambil jalur Makkah dan manasik dari Ata`' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (akhir) dan Bani Abbasiyah',
				note: 'Mesir menjadi simpul ilmu yang semakin kuat pada awal Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('abdullah-ibn-al-mubarak', {
		order: 56,
		title: 'Ulama hadis, adab, dan rihlah ilmu',
		ancestors: [
			{ slug: 'sufyan-al-thawri', relation: 'mengambil wara dan fiqih Irak dari Sufyan al-Thawri' },
			{ slug: 'al-awzai', relation: 'mengambil keluasan fiqih Syam dari al-Awza`i' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Rihlah ilmu lintas Khurasan, Irak, dan Syam tumbuh kuat di bawah orbit Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	buildTabiutFigure('sufyan-ibn-uyaynah', {
		order: 57,
		title: 'Muhaddith besar Makkah',
		ancestors: [
			{ slug: 'ibn-jurayj', relation: 'mengambil jalur Makkah yang telah dirapikan Ibn Jurayj' },
			{ slug: 'ata-ibn-abi-rabah', relation: 'mewarisi tradisi ilmu Haramayn lewat jalur Ata`' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Makkah tetap menjadi simpul rihlah ilmu besar pada awal Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	buildTabiutFigure('waki-ibn-al-jarrah', {
		order: 58,
		title: 'Guru hadis dan fiqih Kufah',
		ancestors: [
			{ slug: 'sufyan-al-thawri', relation: 'mengambil warisan fiqih dan hadis Kufah dari Sufyan al-Thawri' },
			{ slug: 'ali', relation: 'jalur Kufahnya tetap bersambung ke madrasah Ali' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Kufah dan Baghdad terhubung kuat sebagai pusat ilmu pada fase ini.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	})
];

const ulamaNetwork: SanadFigure[] = [
	buildUlamaFigure('imam-abu-hanifah', {
		order: 70,
		title: 'Pendiri Mazhab Hanafi',
		cluster: 'Imam Mazhab dan Turats Klasik',
		periodLabel: '80-150 H / 699-767 M',
		detail:
			'Abu Hanifah menguatkan metode fiqih Irak, qiyas, dan pembacaan masalah masyarakat. Jalur ilmunya terhubung ke tradisi Kufah yang membawa warisan Ali melalui al-Sha`bi dan madrasah Irak.',
		ancestors: [
			{ slug: 'al-shabi', relation: 'mengambil dasar tradisi riwayat Kufah dari al-Sha`bi' },
			{ slug: 'ali', relation: 'jalur ijtihad Kufahnya bersambung ke warisan ilmu Ali' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (akhir)',
				note: 'Abu Hanifah hidup di akhir Umayyah ketika Irak menjadi pusat masalah hukum masyarakat.',
				href: '/dinasti#umayyah-damaskus'
			},
			{
				label: 'Bani Abbasiyah (awal)',
				note: 'Beliau wafat pada awal Abbasiyah dan menolak tunduk pada tekanan politik kekuasaan.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah'],
		legacyPath: '/ulama/imam-abu-hanifah'
	}),
	buildUlamaFigure('imam-syafii', {
		order: 71,
		title: "Pendiri Mazhab Syafi'i",
		cluster: 'Imam Mazhab dan Turats Klasik',
		periodLabel: '150-204 H / 767-820 M',
		detail:
			'Imam Syafi`i menyatukan kekuatan tradisi Madinah, Makkah, Irak, dan Mesir. Melalui dirinya, jalur hadis dan fiqih generasi tabi`ut tabi`in masuk ke bentuk ushul fiqih yang lebih matang.',
		ancestors: [
			{ slug: 'imam-malik', relation: 'belajar langsung kepada Imam Malik di Madinah' },
			{ slug: 'sufyan-ibn-uyaynah', relation: 'mengambil hadis dan tafsir dari Sufyan ibn Uyaynah' },
			{ slug: 'layth-ibn-sad', relation: 'mengambil pengaruh dan surat-menyurat ilmiah dari Layth ibn Sa`d' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Baghdad dan Mesir pada masa Abbasiyah memberi ruang bagi pertemuan berbagai madrasah fiqih.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah'],
		legacyPath: '/ulama/imam-syafii'
	}),
	buildUlamaFigure('imam-ahmad', {
		order: 72,
		title: 'Pendiri Mazhab Hanbali dan imam hadis',
		cluster: 'Imam Mazhab dan Turats Klasik',
		periodLabel: '164-241 H / 780-855 M',
		detail:
			'Imam Ahmad menggabungkan penghimpunan hadis dengan keteguhan akidah. Ia adalah simpul besar bagi turats Sunni Baghdad dan salah satu puncak rihlah ilmu abad ketiga hijriyah.',
		ancestors: [
			{ slug: 'abdullah-ibn-al-mubarak', relation: 'meneruskan jalur adab, wara, dan rihlah ilmu dari Ibn al-Mubarak' },
			{ slug: 'sufyan-ibn-uyaynah', relation: 'mengambil hadis dan tafsir dari Sufyan ibn Uyaynah' },
			{ slug: 'waki-ibn-al-jarrah', relation: 'mengambil tradisi hadis Kufah dari Waki`' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Baghdad adalah jantung politik dan intelektual Abbasiyah ketika Imam Ahmad hidup.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah'],
		legacyPath: '/ulama/imam-ahmad'
	}),
	buildUlamaFigure('imam-ghazali', {
		order: 73,
		title: 'Hujjatul Islam dan pembaru abad ke-5 H',
		cluster: 'Imam Mazhab dan Turats Klasik',
		periodLabel: '450-505 H / 1058-1111 M',
		detail:
			'Imam al-Ghazali menguatkan mazhab Syafi`i, akidah Asy`ariyah, dan tazkiyah Sunni dalam satu bangunan ilmu. Ia bukan guru langsung imam mazhab awal, tetapi kesinambungan intelektualnya jelas berada dalam jalur Syafi`i dan dunia madrasah Sunni.',
		ancestors: [
			{ slug: 'imam-syafii', relation: 'melanjutkan dan menguatkan jalur mazhab Syafi`i' },
			{ slug: 'imam-malik', relation: 'menghidupkan penghormatan tinggi pada hadis dan adab ahli ilmu' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Secara simbolik beliau hidup di bawah kekhalifahan Abbasiyah di Baghdad.',
				href: '/dinasti#abbasiyah'
			},
			{
				label: 'Dinasti Seljuk Agung',
				note: 'Jaringan madrasah Nizamiyah dan pengaruh Seljuk sangat menentukan konteks hidup beliau.',
				href: '/dinasti#seljuk-agung'
			}
		],
		dynastySlugs: ['abbasiyah', 'seljuk-agung'],
		legacyPath: '/ulama/imam-ghazali'
	}),
	buildUlamaFigure('imam-nawawi', {
		order: 74,
		title: "Pakar hadis dan fiqih Syafi'i",
		cluster: 'Imam Mazhab dan Turats Klasik',
		periodLabel: '631-676 H / 1233-1277 M',
		detail:
			'Imam an-Nawawi menyusun karya-karya ringkas tetapi sangat hidup di pesantren dan madrasah: Riyadhus Shalihin, Arba`in, al-Majmu`, dan syarah Shahih Muslim. Posisi beliau adalah penyambung kuat turats Syafi`i dan hadis Sunni.',
		ancestors: [
			{ slug: 'imam-syafii', relation: 'menguatkan dan mensyarah jalur mazhab Syafi`i' },
			{ slug: 'imam-ghazali', relation: 'melanjutkan turats tazkiyah dan adab Sunni yang mengakar di pesantren' }
		],
		politicalContexts: [
			{
				label: 'Dinasti Ayyubiyah',
				note: 'Masa awal hidup beliau berada pada ujung fase Ayyubiyah di Syam.',
				href: '/dinasti#ayyubiyah'
			},
			{
				label: 'Kesultanan Mamluk',
				note: 'Masa pengajaran dan karya besar beliau berlangsung di orbit Damaskus era Mamluk.',
				href: '/dinasti#mamluk'
			}
		],
		dynastySlugs: ['ayyubiyah', 'mamluk'],
		legacyPath: '/ulama/imam-nawawi'
	})
];

const walisongoNetwork: SanadFigure[] = [
	{
		slug: 'sunan-gresik',
		order: 75,
		name: 'Sunan Gresik',
		title: 'Pembuka dakwah Walisongo di Jawa Timur',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'w. 1419 M',
		region: 'Gresik, pesisir utara Jawa',
		focus: 'Dakwah sosial, perdagangan, dan fondasi komunitas Muslim awal',
		summary:
			'Maulana Malik Ibrahim dikenal sebagai pembuka jalur dakwah Walisongo di Jawa Timur melalui pendekatan sosial, perdagangan, dan pelayanan masyarakat.',
		detail:
			'Riwayat populer menempatkan Sunan Gresik sebagai perintis medan dakwah yang kemudian dilanjutkan para wali sesudahnya. Jalurnya lebih berupa pembukaan ruang dakwah, penguatan akhlak, dan pembentukan komunitas Muslim awal di pesisir Jawa.',
		aliases: ['Maulana Malik Ibrahim', 'Sunan Gresik', 'maulana malik ibrahim'],
		ancestors: [
			{ slug: 'imam-syafii', relation: 'meneruskan arus fiqih Syafi`i yang menjadi corak utama Islam pesisir Jawa' },
			{ slug: 'imam-ghazali', relation: 'membawa corak tasawuf dan adab Sunni yang dekat dengan pendekatan dakwah damai' },
			{ slug: 'imam-nawawi', relation: 'jalur kitab dan tradisi Syafi`i-Sunni sesudah beliau menjadi fondasi pesantren di Nusantara' }
		],
		politicalContexts: [
			{
				label: 'Majapahit akhir',
				note: 'Dakwah Sunan Gresik berlangsung ketika pengaruh Majapahit mulai melemah dan kota-kota pesisir makin terbuka pada jaringan dagang Muslim.'
			},
			{
				label: 'Pesisir utara Jawa',
				note: 'Pelabuhan-pelabuhan seperti Gresik menjadi simpul pertemuan saudagar, ulama, dan komunitas lokal.'
			}
		],
		dynastySlugs: [],
		legacyPath: '/walisongo/sunan-gresik'
	},
	{
		slug: 'sunan-ampel',
		order: 76,
		name: 'Sunan Ampel',
		title: 'Perintis pesantren Ampel Denta dan poros kaderisasi wali',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1401-1481 M',
		region: 'Ampel Denta, Surabaya',
		focus: 'Pendidikan pesantren, kaderisasi ulama, dan dakwah damai',
		summary:
			'Raden Rahmat menjadikan Ampel Denta sebagai pusat pendidikan Islam yang menyiapkan kader dakwah ke berbagai daerah Jawa dan Nusantara.',
		detail:
			'Dalam tradisi dakwah Jawa, Sunan Ampel adalah pengokoh sistem pesantren dan pengaderan. Banyak wali generasi sesudahnya terhubung melalui lingkungan Ampel, baik secara keluarga, murid, maupun jaringan dakwah.',
		aliases: ['Raden Rahmat', 'Raden Ali Rahmatullah', 'Sunan Ampel'],
		ancestors: [
			{ slug: 'sunan-gresik', relation: 'melanjutkan jalur pembuka dakwah Jawa Timur yang telah lebih dulu dirintis Sunan Gresik' },
			{ slug: 'imam-nawawi', relation: 'meneruskan arus fiqih-hadis Syafi`i yang telah matang sebelum fase Walisongo' }
		],
		politicalContexts: [
			{
				label: 'Majapahit akhir',
				note: 'Sunan Ampel hidup pada fase akhir Majapahit dan mendapat ruang berdakwah melalui jaringan kekerabatan serta pendekatan damai.'
			},
			{
				label: 'Kesultanan Demak',
				note: 'Kaderisasi beliau berkontribusi langsung pada lahirnya poros Demak sebagai kekuatan Islam Jawa awal.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-ampel'
	},
	{
		slug: 'sunan-bonang',
		order: 77,
		name: 'Sunan Bonang',
		title: 'Wali dakwah seni dan suluk Jawa',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'c. 1465-1525 M',
		region: 'Tuban dan pesisir utara Jawa',
		focus: 'Seni, tembang, suluk, dan dakwah budaya',
		summary:
			'Makhdum Ibrahim dikenal mengislamkan medium gamelan, tembang, dan suluk agar ajaran tauhid mudah masuk ke hati masyarakat Jawa.',
		detail:
			'Sunan Bonang memperluas dakwah dari ruang pesantren ke bahasa budaya. Tradisi populer juga menempatkannya sebagai guru Sunan Kalijaga dan salah satu poros spiritual Demak.',
		aliases: ['Makhdum Ibrahim', 'Sunan Bonang'],
		ancestors: [
			{ slug: 'sunan-ampel', relation: 'meneruskan pendidikan, adab, dan kaderisasi yang dibangun Sunan Ampel' }
		],
		politicalContexts: [
			{
				label: 'Transisi Majapahit ke Demak',
				note: 'Dakwahnya hidup pada masa peralihan budaya dan politik dari Majapahit ke poros kesultanan Islam Jawa.'
			},
			{
				label: 'Kesultanan Demak',
				note: 'Lingkungan Demak menjadi salah satu tempat pengaruh dakwahnya terasa paling kuat.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-bonang'
	},
	{
		slug: 'sunan-drajat',
		order: 78,
		name: 'Sunan Drajat',
		title: 'Wali dakwah sosial dan pemberdayaan umat',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'c. 1470-1522 M',
		region: 'Drajat, Lamongan',
		focus: 'Santunan sosial, ekonomi umat, dan pendidikan',
		summary:
			'Raden Qasim menonjol dalam dakwah sosial: membantu fakir, membina ekonomi rakyat, dan menunjukkan wajah Islam yang nyata dalam pelayanan.',
		detail:
			'Sunan Drajat melanjutkan jalur pesantren keluarga Ampel sambil memberi penekanan kuat pada fungsi sosial agama. Pada dirinya, dakwah bukan hanya ceramah tetapi juga keberpihakan pada masyarakat lemah.',
		aliases: ['Raden Qasim', 'Sunan Drajat'],
		ancestors: [
			{ slug: 'sunan-ampel', relation: 'meneruskan jalur pendidikan dan dakwah keluarga Ampel' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Demak',
				note: 'Lingkungan politik Islam Jawa awal memberi ruang pada dakwah sosial dan lembaga pendidikan berbasis masyarakat.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-drajat'
	},
	{
		slug: 'sunan-giri',
		order: 79,
		name: 'Sunan Giri',
		title: 'Mufti Giri dan pengirim kader ke Nusantara',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'w. 1506 M',
		region: 'Giri, Gresik',
		focus: 'Fatwa, pendidikan, dan ekspansi dakwah antarpulau',
		summary:
			'Raden Paku membangun Giri sebagai pusat fatwa dan pendidikan yang memengaruhi Jawa, Madura, hingga Nusantara timur.',
		detail:
			'Sunan Giri adalah simpul penting sanad kelembagaan pesantren di Nusantara. Dari Giri, dakwah bergerak bukan hanya melalui pengajaran lokal tetapi juga pengiriman murid ke berbagai wilayah.',
		aliases: ['Raden Paku', 'Ainul Yaqin', 'Sunan Giri'],
		ancestors: [
			{ slug: 'sunan-ampel', relation: 'dalam tradisi populer belajar dan tumbuh dalam jaringan kaderisasi Ampel' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Demak',
				note: 'Giri sering menjadi rujukan keagamaan bagi kekuasaan Islam Jawa awal, termasuk lingkungan Demak.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-giri'
	},
	{
		slug: 'sunan-kalijaga',
		order: 80,
		name: 'Sunan Kalijaga',
		title: 'Wali dakwah budaya dan simbol-simbol Jawa',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'aktif abad ke-15-16 M',
		region: 'Demak, Kadilangu, dan Jawa tengah',
		focus: 'Wayang, gamelan, simbol budaya, dan dakwah akhlak',
		summary:
			'Raden Said adalah wajah paling terkenal dari dakwah kebudayaan Walisongo; ia memadukan simbol-simbol Jawa dengan penguatan tauhid dan akhlak.',
		detail:
			'Banyak riwayat populer menempatkan Sunan Kalijaga sebagai murid Sunan Bonang. Dari dirinya, jalur dakwah budaya Jawa bergerak ke generasi berikutnya seperti Sunan Muria dan memengaruhi pesantren-pesantren Jawa.',
		aliases: ['Raden Said', 'Lokajaya', 'Sunan Kalijaga'],
		ancestors: [
			{ slug: 'sunan-bonang', relation: 'dalam tradisi populer disebut belajar dakwah dan suluk kepada Sunan Bonang' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Demak',
				note: 'Sunan Kalijaga berkaitan erat dengan lingkungan Masjid Agung Demak dan dakwah simbolik di Jawa tengah.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-kalijaga'
	},
	{
		slug: 'sunan-kudus',
		order: 81,
		name: 'Sunan Kudus',
		title: 'Wali toleransi dan penguat pusat ilmu Kudus',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'w. 1550 M',
		region: 'Kudus',
		focus: 'Toleransi, arsitektur dakwah, dan pendidikan masyarakat kota',
		summary:
			'Ja`far Shadiq menguatkan Islam di Kudus dengan pendekatan toleransi, simbol arsitektur, dan pendidikan keagamaan yang membumi.',
		detail:
			'Riwayat pesantren Kudus dan tradisi dakwah Jawa sering menghubungkannya dengan jaringan Sunan Ampel, Syekh Kahfi, dan Sunan Kalijaga. Di graph ini, ia ditempatkan sebagai simpul dakwah urban yang ramah budaya.',
		aliases: ["Ja'far Shadiq", 'Sunan Kudus', 'Jafar Shadiq'],
		ancestors: [
			{ slug: 'sunan-ampel', relation: 'dalam riwayat dakwah Jawa, jalurnya masuk melalui jaringan pendidikan dan kaderisasi yang berporos pada Sunan Ampel' },
			{ slug: 'sunan-kalijaga', relation: 'dalam tradisi populer sering disebut belajar kebijaksanaan dakwah budaya dari Sunan Kalijaga' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Demak',
				note: 'Kudus berkembang sebagai kota ilmu dan perdagangan dalam orbit Demak.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-kudus'
	},
	{
		slug: 'sunan-muria',
		order: 82,
		name: 'Sunan Muria',
		title: 'Wali pedalaman dan masyarakat kecil',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'aktif awal abad ke-16 M',
		region: 'Muria, Kudus-Jepara',
		focus: 'Dakwah rakyat, pertanian, nelayan, dan kesederhanaan',
		summary:
			'Raden Umar Said membawa Islam lebih dalam ke pedalaman, lereng gunung, dan masyarakat yang jauh dari pusat kekuasaan.',
		detail:
			'Sunan Muria meneruskan pendekatan ayahnya, Sunan Kalijaga, tetapi menekankan kedekatan dengan petani, nelayan, dan masyarakat kecil. Jalur ini sangat memengaruhi watak dakwah rakyat di Jawa.',
		aliases: ['Raden Umar Said', 'Sunan Muria'],
		ancestors: [
			{ slug: 'sunan-kalijaga', relation: 'meneruskan jalur dakwah budaya dan kerakyatan dari Sunan Kalijaga' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Demak',
				note: 'Pada fase ini, Demak menjadi latar politik regional, sementara Sunan Muria bergerak lebih banyak di desa dan lereng gunung.',
				href: '/dinasti#kesultanan-demak'
			}
		],
		dynastySlugs: ['kesultanan-demak'],
		legacyPath: '/walisongo/sunan-muria'
	},
	{
		slug: 'sunan-gunung-jati',
		order: 83,
		name: 'Sunan Gunung Jati',
		title: 'Wali maritim Cirebon-Banten dan penguat jalur barat Jawa',
		cluster: 'Walisongo dan Dakwah Jawa',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'c. 1448-1568 M',
		region: 'Cirebon dan Banten',
		focus: 'Dakwah politik, jalur laut, diplomasi, dan pembentukan kesultanan',
		summary:
			'Syarif Hidayatullah memperkuat Islam di Jawa barat melalui jalur maritim, diplomasi, dan pembentukan pusat kekuasaan Cirebon-Banten.',
		detail:
			'Sunan Gunung Jati menonjol karena mengikat dakwah, perdagangan laut, dan struktur politik sekaligus. Ia tidak sekadar mengajar secara lokal, tetapi membentuk koridor Islam Jawa barat yang terhubung ke pesisir utara dan dunia maritim Nusantara.',
		aliases: ['Syarif Hidayatullah', 'Sunan Gunung Jati', 'Sharif Hidayatullah'],
		ancestors: [
			{ slug: 'sunan-ampel', relation: 'bergabung dalam jaringan Walisongo yang telah lebih dahulu dikonsolidasikan oleh generasi Sunan Ampel' },
			{ slug: 'imam-nawawi', relation: 'meneruskan arus Syafi`i-Sunni yang hidup di jalur laut dan pusat-pusat ilmu dunia Islam' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Cirebon',
				note: 'Sunan Gunung Jati adalah tokoh kunci dalam pembentukan dan penguatan koridor politik-keagamaan Cirebon.',
				href: '/dinasti#kesultanan-cirebon'
			},
			{
				label: 'Kesultanan Banten',
				note: 'Peran dakwah dan maritimnya juga sangat terkait dengan lahirnya poros Banten.',
				href: '/dinasti#kesultanan-banten'
			}
		],
		dynastySlugs: ['kesultanan-cirebon', 'kesultanan-banten'],
		legacyPath: '/walisongo/sunan-gunung-jati'
	}
];

const hadramautAndNusantaraBridgeNetwork: SanadFigure[] = [
	{
		slug: 'imam-abdullah-al-haddad',
		order: 84,
		name: 'Imam Abdullah bin Alawi al-Haddad',
		title: 'Quthb Hadramaut dan rujukan ratib-tasawuf Sunni',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1044-1132 H / 1634-1720 M',
		region: 'Tarim, Hadramaut',
		focus: 'Tasawuf, adab, ratib, dan penguatan jalan Ba`Alawi',
		summary:
			'Imam al-Haddad adalah simpul besar Hadramaut yang karyanya hidup luas di pesantren dan majelis-majelis Nusantara melalui Ratib al-Haddad, an-Nashaih, dan risalah-risalah adab.',
		detail:
			'Peran Imam al-Haddad penting untuk memahami bagaimana jalur Hadramaut mengalir ke Nusantara. Karyanya menyalurkan corak Syafi`i, tasawuf, dan cinta Nabi ke majelis, zikir, dan kurikulum pesantren.',
		aliases: ['Abdullah bin Alawi al-Haddad', 'Imam al-Haddad', 'Habib Abdullah al-Haddad'],
		ancestors: [
			{ slug: 'imam-syafii', relation: 'menguatkan fiqih Syafi`i sebagai dasar ibadah dan muamalah' },
			{ slug: 'imam-ghazali', relation: 'melanjutkan tradisi tazkiyah dan suluk Sunni yang menyeimbangkan fiqih dan hati' },
			{ slug: 'imam-nawawi', relation: 'meneruskan arus hadis, adab, dan fiqih Syafi`i yang juga hidup di pesantren Nusantara' }
		],
		politicalContexts: [
			{
				label: 'Hadramaut dan Hijaz era Utsmaniyah',
				note: 'Hadramaut tumbuh sebagai jaringan ulama dan suluk; Hijaz pada masa itu berada dalam payung Utsmaniyah yang memayungi lalu lintas haji dan ilmu.',
				href: '/dinasti#utsmaniyah'
			}
		],
		dynastySlugs: ['utsmaniyah']
	},
	{
		slug: 'habib-husein-luar-batang',
		order: 85,
		name: 'Habib Husein bin Abu Bakar Alaydrus',
		title: 'Pembuka majelis Alawiyyin besar di Batavia',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'w. 1756 M',
		region: 'Luar Batang, Batavia',
		focus: 'Dakwah pesisir, tasawuf, dan pembinaan masyarakat pelabuhan',
		summary:
			'Habib Husein Alaydrus adalah tokoh awal yang sangat berpengaruh di Batavia, terutama dalam jalur zikir, pelayanan masyarakat, dan dakwah di wilayah pelabuhan.',
		detail:
			'Dari Luar Batang, jalur habaib Hadramaut makin terasa di Betawi. Riwayat lokal dan tulisan Jakarta Islamic Centre menempatkannya sebagai salah satu figur terawal yang mengakar kuat di masyarakat pesisir Jakarta.',
		aliases: ['Habib Husein Alaydrus', 'Habib Husein Keramat Luar Batang', 'Habib Husein bin Abubakar Alaydrus'],
		ancestors: [
			{ slug: 'imam-abdullah-al-haddad', relation: 'menimba ilmu tasawuf dan suluk pada jalur yang juga bersambung ke Imam al-Haddad' }
		],
		politicalContexts: [
			{
				label: 'Batavia VOC',
				note: 'Dakwah beliau berlangsung di tengah masyarakat pelabuhan Batavia pada masa VOC, ketika komunitas Muslim kota tumbuh di bawah pengawasan kolonial.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'syekh-nawawi-al-bantani',
		order: 86,
		name: 'Syekh Nawawi al-Bantani',
		title: 'Sayyid Ulama al-Hijaz dari Banten',
		cluster: 'Ulama Nusantara dan Pesantren',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1230-1314 H / 1813-1897 M',
		region: 'Tanara, Banten - Makkah',
		focus: 'Fiqih Syafi`i, tafsir, tasawuf, dan kitab turats pesantren',
		summary:
			'Syekh Nawawi al-Bantani adalah salah satu ulama Nusantara paling berpengaruh di Makkah; karya-karyanya menjadi tulang punggung kurikulum pesantren sampai hari ini.',
		detail:
			'Syekh Nawawi menyalurkan turats Syafi`i dan tasawuf Sunni ke Nusantara lewat karya-karya Arab yang padat dan mudah diajarkan. Ia menjadi titik temu antara Haramayn dan pesantren Nusantara.',
		aliases: ['Syekh Nawawi Banten', 'Syekh Nawawi al-Bantani', 'Nawawi al-Bantani'],
		ancestors: [
			{ slug: 'imam-syafii', relation: 'menguatkan fiqih Syafi`i sebagai kerangka hukum utama' },
			{ slug: 'imam-ghazali', relation: 'melanjutkan corak tazkiyah dan adab yang hidup di kitab-kitab pesantren' },
			{ slug: 'imam-nawawi', relation: 'meneruskan jalur syarah, fiqih, dan hadis Syafi`i ke dunia pesantren Nusantara' }
		],
		politicalContexts: [
			{
				label: 'Kesultanan Banten',
				note: 'Syekh Nawawi lahir dari lingkungan Banten yang sudah lama menjadi pusat Islam Jawa barat.',
				href: '/dinasti#kesultanan-banten'
			},
			{
				label: 'Haramayn dan Hindia Belanda',
				note: 'Kiprahnya tumbuh dalam sirkulasi ilmu antara Makkah dan Nusantara pada masa kolonial Hindia Belanda.'
			}
		],
		dynastySlugs: ['kesultanan-banten']
	},
	{
		slug: 'syaikhona-kholil-bangkalan',
		order: 87,
		name: 'Syaikhona Kholil Bangkalan',
		title: 'Guru para kiai Nusantara dari Bangkalan',
		cluster: 'Ulama Nusantara dan Pesantren',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1820-1925 M',
		region: 'Bangkalan, Madura',
		focus: 'Fiqih, alat, tasawuf, dan penggemblengan kader ulama',
		summary:
			'Syaikhona Kholil adalah simpul raksasa pesantren Nusantara; pengaruhnya terasa kuat pada KH Hasyim Asy`ari, KH Wahab Chasbullah, dan generasi kiai sesudahnya.',
		detail:
			'Nama Syaikhona Kholil identik dengan sanad pesantren Jawa-Madura. Kealimannya di bidang fiqih, alat, dan adab membuatnya dikenang sebagai guru segala guru dalam tradisi pesantren.',
		aliases: ['Muhammad Kholil Bangkalan', 'Kiai Kholil Bangkalan', 'Syaikhona Kholil'],
		ancestors: [
			{ slug: 'syekh-nawawi-al-bantani', relation: 'dalam riwayat pesantren disebut sebagai salah satu murid Syekh Nawawi al-Bantani' },
			{ slug: 'sunan-bonang', relation: 'dalam ingatan pesantren Jawa, jalur dakwah dan tawadhu` sering dilacak ke corak Bonang dan Walisongo' }
		],
		politicalContexts: [
			{
				label: 'Hindia Belanda dan pesantren Madura',
				note: 'Beliau hidup di bawah kolonialisme, tetapi pesantrennya menjadi pusat pembentukan ulama dan kesadaran kebangsaan.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-utsman-bin-yahya',
		order: 88,
		name: 'Habib Utsman bin Yahya',
		title: 'Mufti Betawi dan poros literasi ulama kota',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1822-1914 M',
		region: 'Pekojan, Batavia',
		focus: 'Fatwa, penulisan kitab, jaringan ulama Betawi, dan otoritas keagamaan kota',
		summary:
			'Habib Utsman bin Yahya adalah Mufti Betawi yang sangat produktif dan menjadi poros rujukan agama di Jakarta serta Asia Tenggara.',
		detail:
			'Perannya penting untuk menghubungkan jaringan Hadramaut, Makkah, dan Betawi. Dari dirinya lahir salah satu jalur kuat yang kemudian diteruskan Habib Ali Kwitang dan banyak ulama Betawi.',
		aliases: ['Habib Utsman Yahya', 'Mufti Betawi', 'Habib Utsman bin Yahya'],
		ancestors: [
			{ slug: 'imam-nawawi', relation: 'meneruskan fiqih Syafi`i dan tradisi syarah yang kuat di pusat-pusat ilmu Hijaz' },
			{ slug: 'imam-abdullah-al-haddad', relation: 'tetap berada dalam arus tasawuf dan adab Alawiyyin-Hadramaut' }
		],
		politicalContexts: [
			{
				label: 'Batavia kolonial',
				note: 'Habib Utsman menjadi otoritas agama yang menonjol di Batavia pada masa kolonial dan jejak pengaruhnya melampaui Jakarta.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'syekh-mahfudz-at-tarmasi',
		order: 89,
		name: 'Syekh Mahfudz at-Tarmasi',
		title: 'Musnid hadis Nusantara dari Tremas',
		cluster: 'Ulama Nusantara dan Pesantren',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1868-1920 M',
		region: 'Tremas, Pacitan - Makkah',
		focus: 'Hadis, qira`at, fiqih, dan sanad kitab-kitab besar',
		summary:
			'Syekh Mahfudz at-Tarmasi adalah ulama internasional asal Tremas yang menjadi guru hadis besar bagi ulama Nusantara di Makkah, termasuk KH Hasyim Asy`ari.',
		detail:
			'Kalau Syekh Nawawi menonjol dalam syarah kitab-kitab fiqih dan tasawuf, Syekh Mahfudz menonjol dalam sanad hadis, qira`at, dan ketelitian ilmiah. Kombinasi keduanya sangat membentuk pesantren Nusantara abad modern.',
		aliases: ['Syekh Mahfudz Tremas', 'Mahfudz at-Tarmasi', 'Mahfudz Tremas'],
		ancestors: [
			{ slug: 'syekh-nawawi-al-bantani', relation: 'hidup dalam poros keilmuan Makkah yang juga dipimpin ulama Nusantara seperti Syekh Nawawi' },
			{ slug: 'imam-nawawi', relation: 'meneruskan arus hadis, fiqih, dan adab Syafi`i dari turats klasik' },
			{ slug: 'imam-ahmad', relation: 'menguatkan perhatian besar pada hadis dan sanad periwayatan' }
		],
		politicalContexts: [
			{
				label: 'Haramayn dan Hindia Belanda',
				note: 'Jalur sanad hadis pesantren Nusantara pada akhir abad ke-19 banyak bertemu di Makkah lewat beliau.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-abdullah-bin-muhsin-al-attas',
		order: 90,
		name: 'Habib Abdullah bin Muhsin al-Attas',
		title: 'Habib Empang Bogor dan penguat majelis Alawiyyin Jawa Barat',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'aktif 1895-1933 M',
		region: 'Empang, Bogor',
		focus: 'Tasawuf, pengajian, dan pembinaan masyarakat kota-ziarah',
		summary:
			'Habib Abdullah bin Muhsin al-Attas memperkuat Islam kota Bogor melalui pengajian, zikir, dan pembinaan masyarakat di kawasan Empang.',
		detail:
			'Jejaknya penting dalam memahamkan bagaimana jalur habaib Hadramaut tidak hanya kuat di Batavia, tetapi juga membentuk simpul Bogor yang sampai kini hidup sebagai kawasan ziarah dan majelis.',
		aliases: ['Habib Empang', 'Habib Abdullah al-Attas Empang', 'Habib Abdullah bin Muhsin Al-Attas'],
		ancestors: [
			{ slug: 'habib-husein-luar-batang', relation: 'dalam jalur cerita dan ziarah lokal, kedatangannya ke Jawa barat terhubung dengan simpul Luar Batang' },
			{ slug: 'imam-abdullah-al-haddad', relation: 'meneruskan arus ratib, tasawuf, dan adab Hadramaut yang hidup di Nusantara' }
		],
		politicalContexts: [
			{
				label: 'Bogor pada masa Hindia Belanda',
				note: 'Empang menjadi ruang pertemuan etnis Arab, pribumi, dan jaringan ulama dalam konteks kota kolonial.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-ali-kwitang',
		order: 91,
		name: 'Habib Ali bin Abdurrahman al-Habsyi',
		title: 'Habib Ali Kwitang dan penguat majelis ilmu Betawi',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1870-1968 M',
		region: 'Kwitang, Jakarta',
		focus: 'Majelis taklim, maulid, pengajaran massal, dan pembinaan ulama kota',
		summary:
			'Habib Ali Kwitang memperluas dakwah majelis taklim di Jakarta dan menjadi rujukan penting masyarakat Betawi serta banyak ulama Jawa.',
		detail:
			'Figurnya menandai bagaimana majelis umum, maulid, dan pendidikan nonformal bisa menjadi simpul hidup ilmu. Pengaruhnya merambat ke guru-guru Betawi, pesantren, dan jaringan habaib di berbagai kota.',
		aliases: ['Habib Ali Kwitang', 'Ali bin Abdurrahman al-Habsyi', 'Habib Ali al-Habsyi'],
		ancestors: [
			{ slug: 'habib-utsman-bin-yahya', relation: 'secara jelas dikenal sebagai murid Mufti Betawi, Habib Utsman bin Yahya' },
			{ slug: 'habib-abdullah-bin-muhsin-al-attas', relation: 'berada dalam arus besar majelis Alawiyyin Jawa yang juga hidup di Bogor dan Batavia' }
		],
		politicalContexts: [
			{
				label: 'Batavia-Jakarta kolonial hingga awal kemerdekaan',
				note: 'Majelis Kwitang menjadi ruang ilmu yang menghubungkan pejabat, rakyat, habaib, dan kiai pada masa perubahan politik besar.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'kh-hasyim-asyari',
		order: 92,
		name: 'KH Hasyim Asy`ari',
		title: 'Pendiri Tebuireng dan Hadratussyaikh NU',
		cluster: 'Ulama Nusantara dan Pesantren',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1871-1947 M',
		region: 'Jombang, Jawa Timur',
		focus: 'Hadis, fiqih, pendidikan pesantren, dan kebangsaan',
		summary:
			'KH Hasyim Asy`ari adalah simpul besar pesantren modern Nusantara: ahli hadis, pendiri Tebuireng, dan pendiri Nahdlatul Ulama.',
		detail:
			'Pada diri Hadratussyaikh, jalur hadis Syekh Mahfudz, turats Syekh Nawawi, dan barakah pendidikan Syaikhona Kholil bertemu lalu mewujud menjadi pesantren, kitab, dan kepemimpinan kebangsaan.',
		aliases: ['Hadratussyaikh KH Hasyim Asyari', 'Mbah Hasyim', 'KH Hasyim Asyari'],
		ancestors: [
			{ slug: 'syekh-mahfudz-at-tarmasi', relation: 'menerima sanad hadis secara kuat dari Syekh Mahfudz at-Tarmasi' },
			{ slug: 'syekh-nawawi-al-bantani', relation: 'secara intelektual berada dalam orbit Syekh Nawawi al-Bantani di Makkah' },
			{ slug: 'syaikhona-kholil-bangkalan', relation: 'menerima dorongan ruhani, adab, dan restu besar dari Syaikhona Kholil Bangkalan' }
		],
		politicalContexts: [
			{
				label: 'Hindia Belanda hingga kemerdekaan Indonesia',
				note: 'Beliau hidup di masa kolonial, kebangkitan organisasi Islam, sampai perjuangan mempertahankan kemerdekaan.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'kh-abdul-wahab-chasbullah',
		order: 93,
		name: 'KH Abdul Wahab Chasbullah',
		title: 'Motor organisasi NU dan pembaru gerak santri',
		cluster: 'Ulama Nusantara dan Pesantren',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1888-1971 M',
		region: 'Tambakberas, Jombang',
		focus: 'Organisasi, pendidikan, nasionalisme, dan jaringan santri',
		summary:
			'KH Wahab Chasbullah adalah tokoh penggerak yang mengubah energi pesantren menjadi gerakan sosial, pendidikan, dan kebangsaan.',
		detail:
			'Kalau KH Hasyim Asy`ari adalah mahaguru dan simbol otoritas, KH Wahab adalah motor pengorganisasian. Dari jalur keduanya lahir gerak pesantren yang lebih luas dalam tubuh NU dan masyarakat Indonesia.',
		aliases: ['Mbah Wahab', 'KH Wahab Hasbullah', 'Abdul Wahab Chasbullah'],
		ancestors: [
			{ slug: 'kh-hasyim-asyari', relation: 'meneruskan arah kepemimpinan pesantren dan kebangsaan dari KH Hasyim Asy`ari' },
			{ slug: 'syaikhona-kholil-bangkalan', relation: 'berada dalam lingkar besar murid dan restu Syaikhona Kholil Bangkalan' }
		],
		politicalContexts: [
			{
				label: 'Hindia Belanda hingga Republik Indonesia',
				note: 'Kiprahnya menonjol dalam fase kebangkitan nasional, pendirian NU, dan konsolidasi umat di masa republik.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-umar-bin-hud-al-attas',
		order: 94,
		name: 'Habib Umar bin Muhammad bin Hud al-Attas',
		title: 'Penguat majelis dan jalur Al-Attas di Jawa',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: 'aktif abad ke-20 M',
		region: 'Bogor - Somalangu - Jawa',
		focus: 'Majelis zikir, pengajaran habaib, dan penguatan jaringan pesantren',
		summary:
			'Habib Umar bin Hud al-Attas dikenal dalam jejaring habaib Jawa sebagai penguat majelis, zikir, dan hubungan habaib dengan pesantren-pesantren setempat.',
		detail:
			'Data popular tentang beliau beredar terutama lewat manaqib dan jejaring majelis. Di graph ini, beliau ditempatkan sebagai penghubung jalur Al-Attas dengan ruang pesantren dan majelis Jawa pada abad ke-20.',
		aliases: ['Habib Umar bin Hud Al-Attas', 'Habib Umar Al-Attas', 'Umar bin Hud al-Attas'],
		ancestors: [
			{ slug: 'habib-abdullah-bin-muhsin-al-attas', relation: 'berada dalam arus besar jalur Al-Attas yang kuat di Bogor dan Jawa barat' },
			{ slug: 'habib-ali-kwitang', relation: 'bergerak dalam jejaring majelis habaib Jawa yang juga dikuatkan Kwitang' }
		],
		politicalContexts: [
			{
				label: 'Jawa abad ke-20',
				note: 'Majelis-majelis habaib dan pesantren bertumbuh berdampingan sebagai ruang penguatan zikir, maulid, dan ilmu.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-luthfi-bin-yahya',
		order: 95,
		name: 'Habib Luthfi bin Yahya',
		title: 'Rujukan dzikir, mahabbah Nabi, dan kebangsaan',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1947 M - sekarang',
		region: 'Pekalongan, Jawa Tengah',
		focus: 'Majelis zikir, sanad thariqah, mahabbah Rasul, dan kebangsaan',
		summary:
			'Habib Luthfi adalah salah satu rujukan hidup majelis dzikir dan tradisi cinta Rasul di Indonesia, sekaligus figur penting dalam jaringan thariqah dan ukhuwah kebangsaan.',
		detail:
			'Pada dirinya, arus habaib Ba`Alawi, thariqah, dan kultur pesantren Jawa bertemu dalam bentuk majelis yang sangat terbuka. Posisi beliau penting untuk menunjukkan bahwa sanad tidak berhenti di abad klasik, tetapi terus hidup di Indonesia hari ini.',
		aliases: ['Habib Luthfi', 'Habib Luthfi Pekalongan', 'Muhammad Luthfi bin Ali bin Yahya'],
		ancestors: [
			{ slug: 'habib-ali-kwitang', relation: 'meneruskan arus besar majelis dzikir dan mahabbah Rasul yang telah kuat dalam tradisi habaib Nusantara' },
			{ slug: 'kh-hasyim-asyari', relation: 'berada dalam lanskap Ahlussunnah dan pesantren Nusantara yang sangat menghormati jalur KH Hasyim Asy`ari' }
		],
		politicalContexts: [
			{
				label: 'Republik Indonesia',
				note: 'Kiprah beliau menonjol dalam konteks Indonesia modern sebagai ruang dakwah, zikir, dan penguatan cinta tanah air.'
			}
		],
		dynastySlugs: []
	},
	{
		slug: 'habib-umar-bin-hafidz',
		order: 96,
		name: 'Habib Umar bin Hafidz',
		title: 'Penguat manhaj Hadramaut kontemporer',
		cluster: 'Hadramaut dan Jejaring Alawiyyin',
		generation: 'ulama',
		generationLabel: 'Ulama dan Imam Mazhab',
		periodLabel: '1963 M - sekarang',
		region: 'Tarim, Hadramaut',
		focus: 'Pendidikan tradisional, dakwah global, dan penguatan jaringan ulama',
		summary:
			'Habib Umar bin Hafidz menghidupkan kembali pendidikan tradisional Hadramaut melalui Dar al-Mustafa dan membangun hubungan intens dengan pesantren-pesantren Nusantara.',
		detail:
			'Jalur Habib Umar penting untuk membaca koneksi kontemporer antara Tarim dan Indonesia. Ia tidak sekadar tokoh lokal Yaman, tetapi penghubung aktif antara tradisi Hadramaut dan kebangkitan minat santri Indonesia pada sanad dan adab.',
		aliases: ['Habib Umar Hafidz', 'Habib Umar bin Hafidz', 'Habib Umar bin Hafiz', 'Habib Omar'],
		ancestors: [
			{ slug: 'imam-abdullah-al-haddad', relation: 'meneruskan corak pendidikan, suluk, dan adab Hadramaut yang sangat dipengaruhi turats Imam al-Haddad' },
			{ slug: 'kh-hasyim-asyari', relation: 'secara khusus menunjukkan penghormatan pada ulama Indonesia dengan mengkaji karya KH Hasyim Asy`ari' }
		],
		politicalContexts: [
			{
				label: 'Hadramaut dan dakwah global kontemporer',
				note: 'Perannya tumbuh di era modern ketika Tarim kembali menjadi pusat tarbiyah internasional dan terhubung intens dengan Indonesia.'
			}
		],
		dynastySlugs: []
	}
];

export const sanadFigures: SanadFigure[] = [
	rasulFigure,
	...sahabatFigures,
	...tabiinNetwork,
	...tabiutNetwork,
	...ulamaNetwork,
	...walisongoNetwork,
	...hadramautAndNusantaraBridgeNetwork
].sort((a, b) => a.order - b.order);

function normalizeLookupKey(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

const sanadFigureLookup = new Map<string, SanadFigure>();

for (const figure of sanadFigures) {
	for (const key of [figure.slug, figure.name, ...figure.aliases]) {
		sanadFigureLookup.set(normalizeLookupKey(key), figure);
	}
}

export function getSanadFigure(slugOrAlias: string) {
	return sanadFigureLookup.get(normalizeLookupKey(slugOrAlias)) ?? null;
}

export function getSanadFigureHref(slugOrAlias: string) {
	const figure = getSanadFigure(slugOrAlias);
	return figure ? `/tokoh/${figure.slug}` : null;
}

export function getSanadFiguresByGeneration(generation: SanadGeneration) {
	return sanadFigures.filter((figure) => figure.generation === generation);
}

export function getSanadFiguresByCluster(cluster: string) {
	return sanadFigures.filter((figure) => figure.cluster === cluster);
}

export function getSanadAncestors(figure: SanadFigure) {
	return figure.ancestors
		.map((connection) => {
			const target = getSanadFigure(connection.slug);
			if (!target) {
				return null;
			}

			return { figure: target, relation: connection.relation };
		})
		.filter((item): item is { figure: SanadFigure; relation: string } => Boolean(item));
}

export function getSanadDescendants(figure: SanadFigure) {
	return sanadFigures
		.map((candidate) => {
			const match = candidate.ancestors.find((ancestor) => ancestor.slug === figure.slug);
			if (!match) {
				return null;
			}

			return { figure: candidate, relation: match.relation };
		})
		.filter((item): item is { figure: SanadFigure; relation: string } => Boolean(item))
		.sort((a, b) => a.figure.order - b.figure.order);
}

export function getSanadDynasties(figure: SanadFigure) {
	return figure.dynastySlugs
		.map((slug) => dynastiesBySlug.get(slug))
		.filter((item): item is IslamicDynasty => Boolean(item));
}

export function getLinkedSanadNames(names: string[]) {
	return names.map((name) => ({
		name,
		href: getSanadFigureHref(name)
	}));
}
