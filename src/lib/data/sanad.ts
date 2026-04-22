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

const generationLabelMap: Record<SanadGeneration, string> = {
	rasul: 'Rasulullah',
	sahabat: 'Sahabat',
	tabiin: "Tabi'in",
	'tabiut-tabiin': "Tabi'ut Tabi'in",
	ulama: 'Ulama dan Imam Mazhab'
};

type SupplementalFigureDefinition = Omit<SanadFigure, 'generationLabel' | 'aliases' | 'dynastySlugs'> & {
	aliases?: string[];
	dynastySlugs?: string[];
};

function createSupplementalFigure(definition: SupplementalFigureDefinition): SanadFigure {
	return {
		...definition,
		generationLabel: generationLabelMap[definition.generation],
		aliases: [definition.name, definition.slug, ...(definition.aliases ?? [])],
		dynastySlugs: definition.dynastySlugs ?? []
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
		aliases: ['Hasan al-Basri'],
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
		aliases: ['Abu Hanifah', 'Imam Abu Hanifah al-Numan'],
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
		aliases: ['al-Shafii', "al-Shafi'i", 'Imam al-Shafii', 'Muhammad ibn Idris al-Shafii'],
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
		aliases: ['Ahmad ibn Hanbal', 'Imam Ahmad ibn Hanbal'],
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

const supplementalTabiinNetwork: SanadFigure[] = [
	createSupplementalFigure({
		slug: 'ibn-shihab-al-zuhri',
		order: 39.01,
		name: 'Ibn Shihab al-Zuhri',
		title: 'Muhaddith, faqih, dan perintis tadwin awal',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 124 H / 741-742 M',
		region: 'Madinah dan Syam',
		focus: 'Hadis, sirah, maghazi, fiqih',
		summary:
			'Al-Zuhri adalah tabiin besar yang menjembatani tradisi Madinah dengan penulisan hadis dan sirah pada era Umayyah.',
		detail:
			'Nama Ibn Shihab al-Zuhri sangat penting dalam sejarah ilmu Islam awal. Ia belajar dari para faqih Madinah seperti Sa`id ibn al-Musayyib dan Urwah ibn al-Zubayr, lalu mengajarkan riwayatnya kepada Malik, Ibn Jurayj, dan banyak murid lintas wilayah.',
		aliases: ['al-Zuhri', 'Ibn Shihab al-Zuhri', 'Muhammad ibn Shihab al-Zuhri', 'Ibn Shihab az-Zuhri'],
		ancestors: [
			{ slug: 'said-ibn-al-musayyib', relation: 'mengambil fiqih dan atsar Madinah dari Sa`id ibn al-Musayyib' },
			{ slug: 'urwah-ibn-al-zubayr', relation: 'mengambil hadis keluarga Nabi dan sirah dari Urwah ibn al-Zubayr' },
			{ slug: 'salim-ibn-abdullah', relation: 'mewarisi jalur ibadah dan atsar rumah Ibn Umar melalui Salim' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Al-Zuhri hidup di masa Umayyah dan sering dikaitkan dengan fase awal pengumpulan hadis serta maghazi di lingkungan resmi maupun halaqah ilmu.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'qatadah-ibn-diamah',
		order: 39.02,
		name: "Qatadah ibn Di'amah al-Sadusi",
		title: 'Hafizh Basrah dan mufassir tabiin',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 117 H / 735 M',
		region: 'Basrah',
		focus: 'Tafsir, hadis, fiqih',
		summary:
			'Qatadah adalah tokoh besar Basrah dalam tafsir dan hadis yang menjadi penghubung penting antara generasi tabiin senior dan fase kodifikasi setelahnya.',
		detail:
			'Riwayat Qatadah tersebar luas dalam tafsir dan hadis. Posisi beliau penting karena menghimpun pengaruh al-Hasan al-Basri, Sa`id ibn al-Musayyib, dan Ata` ibn Abi Rabah lalu mewariskannya ke generasi setelahnya.',
		aliases: ['Qatadah', "Qatadah ibn Di'amah", 'Qatada ibn Diama'],
		ancestors: [
			{ slug: 'al-hasan-al-basri', relation: 'meneruskan tradisi nasihat, tafsir, dan muhasabah Basrah dari al-Hasan al-Basri' },
			{ slug: 'said-ibn-al-musayyib', relation: 'mengambil riwayat dan fatwa dari Sa`id ibn al-Musayyib' },
			{ slug: 'ata-ibn-abi-rabah', relation: 'mewarisi jalur Makkah melalui Ata` ibn Abi Rabah' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Basrah menjadi pusat ilmu dan debat intelektual yang sangat aktif pada masa Qatadah.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'yahya-ibn-said-al-ansari',
		order: 39.03,
		name: "Yahya ibn Sa'id al-Ansari",
		title: 'Faqih Madinah dan penghubung ke Imam Malik',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 143 H / 760 M',
		region: 'Madinah',
		focus: 'Fiqih, hadis, qadha',
		summary:
			'Yahya ibn Sa`id al-Ansari adalah salah satu penghubung terpenting dari fuqaha Madinah menuju Imam Malik dan generasi kodifikasi.',
		detail:
			'Melalui Yahya ibn Sa`id, banyak warisan fiqih Madinah dari Sa`id ibn al-Musayyib dan para fuqaha lain masuk ke fase yang lebih sistematis. Karena itu, namanya sering muncul dalam jalur sanad Maliki dan hadis.',
		aliases: ["Yahya ibn Sa'id al-Ansari", 'Yahya ibn Said al-Ansari'],
		ancestors: [
			{ slug: 'said-ibn-al-musayyib', relation: 'mengambil fiqih dan fatwa Madinah dari Sa`id ibn al-Musayyib' },
			{ slug: 'al-qasim-ibn-muhammad', relation: 'mewarisi ketenangan fatwa dan jalur keluarga Abu Bakr melalui al-Qasim' }
		],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Ia hidup pada masa transisi ketika Madinah tetap menjadi pusat ilmu walau pusat politik bergeser.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'hisham-ibn-urwah',
		order: 39.04,
		name: 'Hisham ibn Urwah',
		title: 'Perawi hadis keluarga Nabi dari Madinah',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: '61-146 H / 680-763 M',
		region: 'Madinah lalu Baghdad',
		focus: 'Hadis, fiqih, riwayat keluarga Nabi',
		summary:
			'Hisham ibn Urwah meneruskan jalur hadis rumah tangga Nabi dari ayahnya, Urwah ibn al-Zubayr, dan sangat berpengaruh pada transmisi riwayat ke generasi Malik.',
		detail:
			'Ia dikenal sebagai murid utama Urwah dan salah satu perawi penting untuk riwayat-riwayat Aisyah. Melalui dirinya, jalur keluarga Abu Bakr, Asma, dan Urwah terus hidup dalam hadis dan fiqih.',
		aliases: ['Hisham ibn Urwah'],
		ancestors: [
			{ slug: 'urwah-ibn-al-zubayr', relation: 'meneruskan jalur hadis dan sirah keluarga Nabi dari ayahnya, Urwah' },
			{ slug: 'asma-bint-abi-bakr', relation: 'mewarisi riwayat keluarga Abu Bakr melalui rumah Asma bint Abi Bakr' }
		],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Perjalanan hidupnya menjangkau Madinah dan Irak pada masa transisi politik besar.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'ayyub-al-sakhtiyani',
		order: 39.05,
		name: 'Ayyub al-Sakhtiyani',
		title: 'Muhaddith Basrah yang kuat dalam wara',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 131 H / 749 M',
		region: 'Basrah',
		focus: 'Hadis, fiqih, wara',
		summary:
			'Ayyub al-Sakhtiyani adalah penghubung penting tradisi Basrah dan Madinah, terkenal dengan ketelitian sanad dan sikap wara.',
		detail:
			'Namanya sering muncul sebagai murid Ibn Sirin, Nafi`, dan al-Qasim ibn Muhammad. Di tangannya, jalur hadis dan fiqih yang kuat berpindah ke generasi Hammad ibn Zayd dan tokoh sesudahnya.',
		aliases: ['Ayyub al-Sakhtiyani', 'Ayyub as-Sakhtiyani'],
		ancestors: [
			{ slug: 'muhammad-ibn-sirin', relation: 'meneruskan ketelitian sanad dan wara dari Muhammad ibn Sirin' },
			{ slug: 'nafi-mawla-ibn-umar', relation: 'mengambil jalur amal dan hadis Ibn Umar melalui Nafi`' },
			{ slug: 'al-qasim-ibn-muhammad', relation: 'mengambil fiqih Madinah melalui al-Qasim ibn Muhammad' }
		],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Basrah pada zamannya menjadi simpul pertemuan hadis, zuhud, dan fiqih.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'amr-ibn-dinar',
		order: 39.06,
		name: 'Amr ibn Dinar',
		title: 'Mufti Makkah sesudah Ata`',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'c. 46-126 H / c. 666-744 M',
		region: 'Makkah',
		focus: 'Fiqih Haramayn, hadis, manasik',
		summary:
			'Amr ibn Dinar menguatkan tradisi ilmu Makkah sesudah Ata` ibn Abi Rabah dan menjadi guru penting bagi Ibn Jurayj dan Sufyan ibn Uyaynah.',
		detail:
			'Perannya menandai kesinambungan pusat fatwa Makkah. Banyak jalur fiqih dan manasik sesudah Ata` tersambung melalui dirinya.',
		aliases: ['Amr ibn Dinar'],
		ancestors: [
			{ slug: 'ata-ibn-abi-rabah', relation: 'meneruskan tradisi fiqih dan manasik Makkah dari Ata` ibn Abi Rabah' },
			{ slug: 'tawus-ibn-kaysan', relation: 'mengambil pengaruh jalur Yaman-Makkah dari Tawus ibn Kaysan' }
		],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Makkah tetap menjadi pusat fatwa dan manasik pada masa hidupnya.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'abdullah-ibn-tawus',
		order: 39.07,
		name: 'Abdullah ibn Tawus',
		title: 'Penerus jalur ilmu Tawus di Yaman',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 132 H / 749-750 M',
		region: 'Yaman dan Makkah',
		focus: 'Hadis, fiqih, adab',
		summary:
			'Abdullah ibn Tawus meneruskan jalur ilmu ayahnya, Tawus ibn Kaysan, dan menghubungkan warisan Yaman-Makkah ke generasi berikutnya.',
		detail:
			'Dalam sanad hadis dan fiqih, ia menjadi penghubung penting bagi jalur Tawus. Posisi ini membuat namanya muncul dalam mata rantai yang bersambung ke ulama Hijaz dan Yaman.',
		aliases: ['Abdullah ibn Tawus'],
		ancestors: [{ slug: 'tawus-ibn-kaysan', relation: 'meneruskan langsung jalur ilmu ayahnya, Tawus ibn Kaysan' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Yaman dan Makkah tetap tersambung kuat dalam sirkulasi ilmu pada fase ini.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'yunus-ibn-ubayd',
		order: 39.08,
		name: 'Yunus ibn Ubayd',
		title: 'Tokoh zuhud dan hadis Basrah',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 139 H / 756-757 M',
		region: 'Basrah',
		focus: 'Hadis, zuhud, muhasabah',
		summary:
			'Yunus ibn Ubayd dikenal sebagai tokoh Basrah yang kuat dalam zuhud dan wara, sekaligus bagian dari kesinambungan ilmu al-Hasan al-Basri.',
		detail:
			'Namanya sering muncul dalam literatur adab dan nasihat. Ia menjaga warisan tazkiyah Basrah sambil tetap berakar dalam riwayat dan disiplin ilmu.',
		aliases: ['Yunus ibn Ubayd'],
		ancestors: [{ slug: 'al-hasan-al-basri', relation: 'meneruskan corak tazkiyah dan nasihat Basrah dari al-Hasan al-Basri' }],
		politicalContexts: [
			{
				label: 'Awal Abbasiyah',
				note: 'Pada masanya, tradisi tazkiyah Basrah tetap hidup kuat di tengah perubahan politik.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'malik-ibn-dinar',
		order: 39.09,
		name: 'Malik ibn Dinar',
		title: 'Tokoh zuhud Basrah yang masyhur',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. c. 130 H / 748 M',
		region: 'Basrah',
		focus: 'Zuhud, nasihat, ibadah',
		summary:
			'Malik ibn Dinar adalah salah satu simbol kezuhudan Basrah yang sangat memengaruhi tradisi nasihat dan penyucian jiwa dalam Islam Sunni awal.',
		detail:
			'Walau terkenal sebagai zahid, Malik ibn Dinar tetap berada dalam ruang sanad yang nyata. Ia mewarisi pengaruh al-Hasan al-Basri dan memberi warna kuat pada tradisi muhasabah serta kesederhanaan hidup.',
		aliases: ['Malik ibn Dinar'],
		ancestors: [{ slug: 'al-hasan-al-basri', relation: 'meneruskan tradisi zuhud dan nasihat dari al-Hasan al-Basri' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah',
				note: 'Basrah menjadi lahan subur bagi gerakan tazkiyah dan kritik moral terhadap kemewahan politik.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'khalid-al-hadhdha',
		order: 39.1,
		name: 'Khalid al-Hadhdha',
		title: 'Perawi Basrah dalam jalur Ibn Sirin',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 141 H / 758 M',
		region: 'Basrah',
		focus: 'Hadis, fiqih, riwayat Basrah',
		summary:
			'Khalid al-Hadhdha adalah salah satu perawi utama jalur Basrah yang banyak mengambil dari Ibn Sirin dan menguatkan transmisi hadis setempat.',
		detail:
			'Posisinya penting dalam memperpanjang jalur riwayat Basrah ke generasi kritik sanad dan penghimpunan hadis yang lebih matang.',
		aliases: ['Khalid al-Hadhdha', 'Khalid al-Hazza'],
		ancestors: [
			{ slug: 'muhammad-ibn-sirin', relation: 'meneruskan jalur wara dan hadis Basrah dari Muhammad ibn Sirin' },
			{ slug: 'al-hasan-al-basri', relation: 'mewarisi pengaruh lingkungan ilmu Basrah yang kuat dalam nasihat dan hadis' }
		],
		politicalContexts: [
			{
				label: 'Awal Abbasiyah',
				note: 'Basrah tetap menjadi salah satu simpul utama hadis pada awal Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'ubayd-allah-ibn-umar-al-umari',
		order: 39.11,
		name: 'Ubayd Allah ibn Umar al-Umari',
		title: 'Perawi Madinah dalam jalur Nafi` dan Salim',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 147 H / 764 M',
		region: 'Madinah',
		focus: 'Hadis, fiqih, amal ahli Madinah',
		summary:
			'Ubayd Allah ibn Umar al-Umari adalah perawi Madinah yang penting dalam jalur Nafi` dan keluarga Ibn Umar.',
		detail:
			'Nama ini bukan putra Umar sahabat, tetapi ulama Madinah generasi tabiin yang menguatkan transmisi hadis dan fiqih dari Nafi` serta Salim menuju generasi sesudahnya.',
		aliases: ['Ubayd Allah ibn Umar', 'Ubaydullah ibn Umar', 'Ubayd Allah ibn Umar al-Umari'],
		ancestors: [
			{ slug: 'nafi-mawla-ibn-umar', relation: 'meneruskan jalur amal dan hadis Ibn Umar melalui Nafi`' },
			{ slug: 'salim-ibn-abdullah', relation: 'mengambil pengaruh rumah Ibn Umar melalui Salim' }
		],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Madinah tetap menjadi simpul utama hadis dan fiqih walau kekuasaan berubah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'ismail-ibn-abi-khalid',
		order: 39.12,
		name: 'Ismail ibn Abi Khalid',
		title: 'Perawi Kufah dan murid al-Sha`bi',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 146 H / 763 M',
		region: 'Kufah',
		focus: 'Hadis, fiqih, riwayat Irak',
		summary:
			'Ismail ibn Abi Khalid adalah salah satu penghubung jalur Kufah yang mengambil dari al-Sha`bi dan meneruskan tradisi riwayat Irak.',
		detail:
			'Keberadaannya memperlihatkan bagaimana madrasah Kufah tidak berhenti pada satu tokoh, tetapi terus bergerak melalui para perawi yang menjaga atsar dan hukum masyarakat.',
		aliases: ['Ismail ibn Abi Khalid'],
		ancestors: [{ slug: 'al-shabi', relation: 'meneruskan tradisi riwayat Kufah dari al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Kufah terus menjadi pusat ijtihad dan riwayat masyarakat Irak.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'mughirah-ibn-miqsam',
		order: 39.13,
		name: 'Mughirah ibn Miqsam',
		title: 'Perawi Kufah dalam jalur al-Sha`bi',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 136 H / 753-754 M',
		region: 'Kufah',
		focus: 'Hadis, fiqih Irak',
		summary:
			'Mughirah ibn Miqsam termasuk perawi penting Kufah yang menjaga kesinambungan jalur al-Sha`bi dan tradisi ilmu Irak awal.',
		detail:
			'Tokoh-tokoh seperti dirinya menunjukkan bahwa warisan sahabat dan tabiin Kufah bergerak lewat banyak perawi, bukan hanya imam besar yang paling terkenal.',
		aliases: ['Mughirah ibn Miqsam', 'Mughira ibn Miqsam'],
		ancestors: [{ slug: 'al-shabi', relation: 'meneruskan jalur riwayat dan fiqih masyarakat dari al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Kufah menjadi ruang penting bagi transmisi fiqih dan atsar pada masa peralihan dinasti.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'mansur-ibn-al-mutamir',
		order: 39.14,
		name: 'Mansur ibn al-Mutamir',
		title: 'Tokoh wara Kufah dan guru Sufyan al-Thawri',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 132 H / 749-750 M',
		region: 'Kufah',
		focus: 'Hadis, fiqih, ibadah',
		summary:
			'Mansur ibn al-Mutamir dikenal dalam tradisi Kufah sebagai ulama yang kuat dalam ibadah, wara, dan riwayat.',
		detail:
			'Namanya penting karena menjadi salah satu jalur ilmu yang diterima Sufyan al-Thawri. Pada dirinya, ketelitian sanad berpadu dengan corak ibadah yang mendalam.',
		aliases: ['Mansur ibn al-Mutamir'],
		ancestors: [{ slug: 'al-shabi', relation: 'meneruskan arus riwayat Kufah yang juga dikuatkan al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah',
				note: 'Lingkungan Kufah pada zamannya melahirkan banyak tokoh wara dan fiqih masyarakat.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'jafar-al-sadiq',
		order: 39.15,
		name: "Ja'far al-Sadiq",
		title: 'Imam Ahlul Bait dan ulama Madinah',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: '80-148 H / 702-765 M',
		region: 'Madinah',
		focus: 'Hadis, fiqih, hikmah, jalur Ahlul Bait',
		summary:
			'Ja`far al-Sadiq menempati posisi penting dalam jalur Ahlul Bait sekaligus dunia ilmu Madinah, dan namanya muncul dalam mata rantai banyak ulama sesudahnya.',
		detail:
			'Figur ini penting karena menghubungkan jalur keluarga Ali dengan percakapan keilmuan Madinah yang lebih luas. Dalam graph ini, ia ditempatkan sebagai simpul Ahlul Bait yang turut memengaruhi tokoh-tokoh Irak dan Hijaz.',
		aliases: ["Ja'far al-Sadiq", 'Jafar al-Sadiq', 'Imam Jafar al-Sadiq'],
		ancestors: [
			{ slug: 'ali', relation: 'mewarisi jalur Ahlul Bait yang kembali kepada Ali ibn Abi Talib' },
			{ slug: 'al-qasim-ibn-muhammad', relation: 'berada dalam lingkungan ilmu Madinah yang juga diperkaya fuqaha seperti al-Qasim ibn Muhammad' }
		],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Madinah dan Irak pada zamannya sama-sama menjadi ruang perjumpaan ilmu, politik, dan penghormatan pada Ahlul Bait.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'al-hakam-ibn-utaybah',
		order: 39.16,
		name: 'al-Hakam ibn Utaybah',
		title: 'Faqih Kufah dan guru kritik sanad awal',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 115 H / 733-734 M',
		region: 'Kufah',
		focus: 'Fiqih, hadis, qadha',
		summary:
			'Al-Hakam ibn Utaybah adalah salah satu faqih Kufah yang berpengaruh pada tradisi riwayat dan fiqih Irak awal.',
		detail:
			'Meski tidak selalu disebut dalam daftar imam mazhab, tokoh seperti al-Hakam sangat menentukan kesinambungan sanad ilmu di Kufah dan menjadi guru bagi generasi kritikus sanad berikutnya.',
		aliases: ['al-Hakam ibn Utaybah', 'Al-Hakam ibn Utaybah'],
		ancestors: [{ slug: 'al-shabi', relation: 'meneruskan lingkungan fiqih dan riwayat Kufah yang juga hidup pada al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Kufah menjadi salah satu laboratorium fiqih masyarakat paling hidup pada masa ini.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'amr-ibn-murrah',
		order: 39.17,
		name: 'Amr ibn Murrah',
		title: 'Perawi Kufah dalam jalur riwayat Irak',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 116 H / 734 M',
		region: 'Kufah',
		focus: 'Hadis, riwayat Kufah',
		summary:
			'Amr ibn Murrah termasuk perawi Kufah yang penting dalam kesinambungan hadis dan atsar menuju generasi Shu`bah dan sesudahnya.',
		detail:
			'Keberadaan tokoh seperti Amr ibn Murrah menunjukkan bahwa madrasah Kufah berdiri di atas jejaring luas para perawi yang tekun menjaga transmisi sanad.',
		aliases: ['Amr ibn Murrah'],
		ancestors: [{ slug: 'al-shabi', relation: 'meneruskan jalur riwayat Irak yang kuat di sekitar al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Bani Umayyah (Damaskus)',
				note: 'Kufah tetap menjadi pusat riwayat dan diskusi hukum pada masa hidupnya.',
				href: '/dinasti#umayyah-damaskus'
			}
		],
		dynastySlugs: ['umayyah-damaskus']
	}),
	createSupplementalFigure({
		slug: 'al-amash',
		order: 39.18,
		name: "al-A'mash",
		title: 'Muhaddith Kufah yang sangat masyhur',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: '61-148 H / 680-765 M',
		region: 'Kufah',
		focus: 'Hadis, qira`at, riwayat Irak',
		summary:
			'Al-A`mash adalah perawi besar Kufah yang sangat berpengaruh dalam transmisi hadis dan qira`at ke generasi sesudahnya.',
		detail:
			'Namanya sering muncul dalam sanad kitab-kitab hadis. Ia menjadi salah satu jalur penting yang menunjukkan keluasan tradisi riwayat Irak di luar nama-nama imam mazhab yang lebih populer.',
		aliases: ["al-A'mash", 'Al-Amash', "Sulayman al-A'mash"],
		ancestors: [{ slug: 'al-shabi', relation: 'bergerak dalam lingkungan riwayat Kufah yang kuat sejak masa al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Akhir Umayyah dan awal Abbasiyah',
				note: 'Riwayat Kufah tetap tumbuh subur di tengah perubahan kekuasaan politik.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['umayyah-damaskus', 'abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'misar-ibn-kidam',
		order: 39.19,
		name: 'Misar ibn Kidam',
		title: 'Perawi Kufah dan salah satu guru Waki`',
		cluster: "Tokoh Penghubung Tabi'in",
		generation: 'tabiin',
		periodLabel: 'w. 153 H / 770 M',
		region: 'Kufah',
		focus: 'Hadis, atsar, riwayat Kufah',
		summary:
			'Misar ibn Kidam adalah salah satu perawi Kufah yang ikut menjaga kesinambungan hadis dan atsar menuju generasi Waki` dan ulama abad ketiga.',
		detail:
			'Walau tidak sepopuler Sufyan atau Shu`bah, tokoh seperti Misar penting untuk melihat bagaimana jaringan perawi Kufah membentuk jalur keilmuan yang panjang.',
		aliases: ['Misar ibn Kidam', 'Misar bin Kidam'],
		ancestors: [{ slug: 'al-shabi', relation: 'bergerak dalam ruang riwayat Kufah yang telah lebih dulu dikuatkan al-Sha`bi' }],
		politicalContexts: [
			{
				label: 'Awal Abbasiyah',
				note: 'Pada masa ini, pusat-pusat hadis Irak makin hidup dan melahirkan banyak guru bagi generasi musnid berikutnya.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	})
];

const supplementalUlamaBridgeNetwork: SanadFigure[] = [
	createSupplementalFigure({
		slug: 'abd-al-rahman-ibn-al-qasim',
		order: 58.01,
		name: 'Abd al-Rahman ibn al-Qasim',
		title: 'Murid utama Imam Malik dan perawi Muwatta',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '132-191 H / 750-806 M',
		region: 'Madinah dan Mesir',
		focus: 'Fiqih Maliki, riwayat Muwatta',
		summary:
			'Abd al-Rahman ibn al-Qasim adalah murid utama Imam Malik yang berperan besar dalam transmisi dan pematangan mazhab Maliki.',
		detail:
			'Melalui Ibn al-Qasim, banyak warisan Imam Malik masuk ke bentuk fiqih yang lebih matang dan tersebar luas, terutama melalui Mesir dan tradisi Maliki sesudahnya.',
		aliases: ['Abd al-Rahman ibn al-Qasim', 'Ibn al-Qasim'],
		ancestors: [{ slug: 'imam-malik', relation: 'belajar langsung kepada Imam Malik dan menjadi salah satu murid utamanya' }],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Mesir dan Madinah sama-sama aktif dalam penyebaran mazhab dan kitab pada masa Abbasiyah awal.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'abdullah-ibn-wahb',
		order: 58.02,
		name: 'Abdullah ibn Wahb',
		title: 'Murid Malik dan Layth, penghubung Mesir',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '125-197 H / 743-813 M',
		region: 'Mesir',
		focus: 'Fiqih, hadis, riwayat Mesir',
		summary:
			'Abdullah ibn Wahb adalah ulama Mesir yang belajar kepada Imam Malik dan Layth ibn Sa`d, lalu menjadi penghubung penting tradisi Hijaz-Mesir.',
		detail:
			'Posisinya penting untuk membaca bagaimana fiqih dan hadis dari Madinah dan Mesir saling bertemu. Karena itu, namanya muncul dalam banyak jalur keilmuan klasik.',
		aliases: ['Abdullah ibn Wahb', 'Ibn Wahb', 'Abd Allah ibn Wahb'],
		ancestors: [
			{ slug: 'imam-malik', relation: 'mengambil langsung fiqih dan hadis dari Imam Malik' },
			{ slug: 'layth-ibn-sad', relation: 'meneruskan juga pengaruh ilmiah Mesir dari Layth ibn Sa`d' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Mesir menjadi jalur penting penyebaran turats fiqih dan hadis pada era Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'al-walid-ibn-muslim',
		order: 58.03,
		name: 'al-Walid ibn Muslim',
		title: 'Perawi Syam dan murid al-Awza`i',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: 'w. 195 H / 810 M',
		region: 'Syam',
		focus: 'Hadis, fiqih Syam',
		summary:
			'Al-Walid ibn Muslim berperan penting dalam meneruskan jalur ilmu Syam, khususnya warisan al-Awza`i, ke generasi berikutnya.',
		detail:
			'Meski dikenal terutama sebagai perawi, fungsinya dalam menjaga kesinambungan madrasah Syam sangat penting bagi peta sanad klasik.',
		aliases: ['al-Walid ibn Muslim', 'Al-Walid ibn Muslim'],
		ancestors: [{ slug: 'al-awzai', relation: 'meneruskan jalur fiqih dan hadis Syam dari al-Awza`i' }],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Syam tetap mempertahankan identitas keilmuan khasnya di bawah orbit Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'abu-ishaq-al-fazari',
		order: 58.04,
		name: 'Abu Ishaq al-Fazari',
		title: 'Ulama Syam dan murid al-Awza`i',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: 'w. 186 H / 802 M',
		region: 'Syam dan al-Jazirah',
		focus: 'Fiqih, hadis, jihad, siyasah syar`iyyah',
		summary:
			'Abu Ishaq al-Fazari termasuk penerus penting mazhab dan tradisi ilmiah Syam dari jalur al-Awza`i.',
		detail:
			'Namanya sering disebut dalam peta awal fiqih Syam dan perbincangan tentang siyasah serta ribath. Ia membantu memperpanjang usia pengaruh al-Awza`i sesudah generasi tabii`ut tabi`in.',
		aliases: ['Abu Ishaq al-Fazari'],
		ancestors: [{ slug: 'al-awzai', relation: 'meneruskan langsung jalur ilmiah al-Awza`i di Syam' }],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Syam dan perbatasan utara tetap menjadi medan penting fiqih dan hadis pada masa ini.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'abd-al-rahman-ibn-mahdi',
		order: 58.05,
		name: 'Abd al-Rahman ibn Mahdi',
		title: 'Naqid hadis dan guru para imam besar',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '135-198 H / 752-814 M',
		region: 'Basrah',
		focus: 'Hadis, naqd al-rijal, fiqih',
		summary:
			'Abd al-Rahman ibn Mahdi adalah salah satu figur sentral kritik sanad dan hadis pada abad kedua hijriyah akhir.',
		detail:
			'Posisinya penting karena menerima warisan Shu`bah dan Sufyan al-Thawri, lalu meneruskannya ke generasi ulama hadis abad ketiga. Ia termasuk simpul besar dalam sejarah jarh wa ta`dil.',
		aliases: ['Abd al-Rahman ibn Mahdi'],
		ancestors: [
			{ slug: 'sufyan-al-thawri', relation: 'meneruskan jalur hadis dan fiqih Irak dari Sufyan al-Thawri' },
			{ slug: 'shubah-ibn-al-hajjaj', relation: 'mengambil ketelitian sanad dari Shu`bah ibn al-Hajjaj' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Basrah dan Baghdad menjadi ruang pematangan ilmu hadis dan kritik perawi pada zamannya.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'hammad-ibn-zayd',
		order: 58.06,
		name: 'Hammad ibn Zayd',
		title: 'Muhaddith Basrah dan murid Ayyub',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '98-179 H / 717-795 M',
		region: 'Basrah',
		focus: 'Hadis, fiqih, riwayat Basrah',
		summary:
			'Hammad ibn Zayd menjadi penghubung penting tradisi Basrah dari Ayyub al-Sakhtiyani ke Ibn al-Mubarak dan generasi hadis sesudahnya.',
		detail:
			'Namanya menunjukkan bahwa sanad Basrah tidak berhenti pada Hasan atau Ibn Sirin, tetapi terus hidup kuat hingga fase musnid dan penulis kitab hadis.',
		aliases: ['Hammad ibn Zayd'],
		ancestors: [
			{ slug: 'ayyub-al-sakhtiyani', relation: 'meneruskan jalur Basrah dari Ayyub al-Sakhtiyani' },
			{ slug: 'yunus-ibn-ubayd', relation: 'mengambil pengaruh wara dan hadis dari lingkungan Yunus ibn Ubayd' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Basrah tetap menjadi pusat riwayat utama pada masa Abbasiyah awal.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'yahya-al-qattan',
		order: 58.07,
		name: 'Yahya al-Qattan',
		title: 'Imam naqd al-hadith Basrah',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '120-198 H / 738-813 M',
		region: 'Basrah',
		focus: 'Hadis, jarh wa ta`dil, kritik sanad',
		summary:
			'Yahya al-Qattan adalah salah satu figur paling penting dalam pematangan kritik sanad dan penilaian perawi pada masa klasik awal.',
		detail:
			'Melalui jalur Shu`bah dan Hammad, ia mengangkat disiplin hadis ke tahap yang jauh lebih kritis. Karena itu, namanya sangat sentral dalam sejarah jarh wa ta`dil.',
		aliases: ['Yahya al-Qattan'],
		ancestors: [
			{ slug: 'shubah-ibn-al-hajjaj', relation: 'meneruskan metode ketelitian sanad dari Shu`bah ibn al-Hajjaj' },
			{ slug: 'hammad-ibn-zayd', relation: 'mengambil kekuatan riwayat Basrah dari Hammad ibn Zayd' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Fase hidupnya bertepatan dengan pematangan besar disiplin hadis di Irak.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'abd-al-razzaq-al-sanani',
		order: 58.08,
		name: "Abd al-Razzaq al-San'ani",
		title: 'Musnid Yaman dan penyusun Musannaf',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '126-211 H / 744-827 M',
		region: 'San`a, Yaman',
		focus: 'Hadis, musannaf, fiqih',
		summary:
			'Abd al-Razzaq al-San`ani adalah penyusun Musannaf yang sangat penting untuk melihat bentuk awal penghimpunan hadis dan atsar.',
		detail:
			'Melalui dirinya, banyak riwayat Makkah, Yaman, dan Syam terlestarikan dalam bentuk yang lebih sistematis. Karena itu, ia menjadi simpul penting antara guru-guru Hijaz dan ulama hadis abad ketiga.',
		aliases: ["Abd al-Razzaq al-Sanani", "Abd al-Razzaq al-San'ani", 'Abd al-Razzaq as-Sanani'],
		ancestors: [{ slug: 'ibn-jurayj', relation: 'meneruskan jalur fiqih dan riwayat Makkah dari Ibn Jurayj' }],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Yaman dan Hijaz ikut terhubung dalam arus besar penghimpunan hadis pada masa Abbasiyah.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'ali-ibn-al-madini',
		order: 58.09,
		name: 'Ali ibn al-Madini',
		title: 'Imam `ilal al-hadith dan guru al-Bukhari',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '161-234 H / 778-849 M',
		region: 'Basrah dan Baghdad',
		focus: 'Hadis, `ilal, naqd al-rijal',
		summary:
			'Ali ibn al-Madini adalah salah satu otoritas terbesar dalam `ilal al-hadith dan menjadi guru penting bagi al-Bukhari.',
		detail:
			'Keahliannya dalam membedah cacat-cacat halus sanad menjadikannya titik puncak dari jalur kritik sanad yang dibangun generasi sebelumnya seperti Shu`bah dan Yahya al-Qattan.',
		aliases: ['Ali ibn al-Madini'],
		ancestors: [
			{ slug: 'shubah-ibn-al-hajjaj', relation: 'meneruskan warisan ketelitian sanad yang dibangun Shu`bah' },
			{ slug: 'yahya-al-qattan', relation: 'mengambil metodologi naqd al-hadith dari Yahya al-Qattan' },
			{ slug: 'sufyan-ibn-uyaynah', relation: 'mengambil riwayat dan pengaruh ilmu Makkah dari Sufyan ibn Uyaynah' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Irak menjadi jantung pematangan ilmu hadis dan kritik sanad pada abad ketiga awal.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'nuaym-ibn-hammad',
		order: 58.1,
		name: 'Nuaym ibn Hammad',
		title: 'Perawi hadis dan murid Ibn al-Mubarak',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: 'w. 228 H / 843 M',
		region: 'Khurasan dan Mesir',
		focus: 'Hadis, atsar, riwayat Khurasan',
		summary:
			'Nuaym ibn Hammad termasuk tokoh perawi yang menghubungkan tradisi rihlah hadis Ibn al-Mubarak ke generasi sesudahnya.',
		detail:
			'Walau namanya tidak selalu ditempatkan di puncak daftar ulama besar, ia penting sebagai bagian dari mata rantai periwayatan yang menyebarkan warisan Khurasan dan Irak.',
		aliases: ['Nuaym ibn Hammad', 'Nuaym bin Hammad'],
		ancestors: [{ slug: 'abdullah-ibn-al-mubarak', relation: 'meneruskan jalur rihlah ilmu, adab, dan hadis dari Ibn al-Mubarak' }],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Rihlah hadis lintas wilayah menjadi sangat kuat pada fase ini.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
	}),
	createSupplementalFigure({
		slug: 'ishaq-ibn-rahawayh',
		order: 58.11,
		name: 'Ishaq ibn Rahawayh',
		title: 'Imam hadis Khurasan dan guru para musnid',
		cluster: 'Perawi dan Musnid Penghubung',
		generation: 'ulama',
		periodLabel: '161-238 H / 778-853 M',
		region: 'Khurasan, Nishapur, Makkah',
		focus: 'Hadis, fiqih, musnad',
		summary:
			'Ishaq ibn Rahawayh adalah ulama besar Khurasan yang menempati posisi penting dalam jalur hadis menuju al-Bukhari, Muslim, dan generasi musnid besar.',
		detail:
			'Ia menerima ilmu dari Waki` dan Sufyan ibn Uyaynah, lalu menjadi salah satu pilar utama jaringan hadis timur Islam. Namanya penting untuk melihat kesinambungan sanad dari Irak dan Hijaz ke Khurasan.',
		aliases: ['Ishaq ibn Rahawayh', 'Ishaq bin Rahawayh'],
		ancestors: [
			{ slug: 'waki-ibn-al-jarrah', relation: 'meneruskan riwayat Kufah dari Waki` ibn al-Jarrah' },
			{ slug: 'sufyan-ibn-uyaynah', relation: 'mengambil pengaruh riwayat dan tafsir Makkah dari Sufyan ibn Uyaynah' }
		],
		politicalContexts: [
			{
				label: 'Bani Abbasiyah',
				note: 'Khurasan menjadi salah satu pusat besar rihlah hadis dan pembentukan jaringan musnid pada abad ketiga.',
				href: '/dinasti#abbasiyah'
			}
		],
		dynastySlugs: ['abbasiyah']
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
	...supplementalTabiinNetwork,
	...tabiutNetwork,
	...ulamaNetwork,
	...supplementalUlamaBridgeNetwork,
	...walisongoNetwork,
	...hadramautAndNusantaraBridgeNetwork
].sort((a, b) => a.order - b.order);

function normalizeLookupKey(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '')
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
