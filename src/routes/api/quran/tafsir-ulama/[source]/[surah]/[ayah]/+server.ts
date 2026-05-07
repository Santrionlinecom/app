import { error, json } from '@sveltejs/kit';

const TAFSIR_SOURCES = {
	muyassar: {
		id: 1,
		label: 'Tafsir Al-Muyassar',
		author: 'Nukhbah min al-Ulama',
		bookName: 'At-Tafsir Al-Muyassar'
	},
	jalalain: {
		id: 2,
		label: 'Tafsir Jalalain',
		author: 'Jalaluddin Al-Mahalli dan Jalaluddin As-Suyuthi',
		bookName: 'Tafsir Al-Jalalain'
	},
	sadi: {
		id: 3,
		label: 'Tafsir As-Saadi',
		author: 'Abdurrahman bin Nashir As-Saadi',
		bookName: 'Taysir Al-Karim Ar-Rahman'
	},
	'ibn-kathir': {
		id: 4,
		label: 'Tafsir Ibnu Katsir',
		author: 'Ismail bin Umar bin Katsir',
		bookName: 'Tafsir Al-Quran Al-Azhim'
	},
	qurtubi: {
		id: 7,
		label: 'Tafsir Al-Qurthubi',
		author: 'Abu Abdillah Muhammad Al-Qurthubi',
		bookName: 'Al-Jami li Ahkam Al-Quran'
	}
} as const;

type TafsirSource = keyof typeof TAFSIR_SOURCES;

const isTafsirSource = (value: string): value is TafsirSource => value in TAFSIR_SOURCES;

export const GET = async ({ params, fetch, setHeaders }) => {
	const source = params.source ?? '';
	const surah = Number(params.surah);
	const ayah = Number(params.ayah);

	if (!isTafsirSource(source)) {
		throw error(400, 'Sumber tafsir tidak valid');
	}

	if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
		throw error(400, 'Nomor surat tidak valid');
	}

	if (!Number.isInteger(ayah) || ayah < 1) {
		throw error(400, 'Nomor ayat tidak valid');
	}

	const tafsirSource = TAFSIR_SOURCES[source];
	const response = await fetch(
		`http://api.quran-tafseer.com/tafseer/${tafsirSource.id}/${surah}/${ayah}`,
		{
			headers: {
				accept: 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw error(502, 'Gagal memuat tafsir ulama');
	}

	const payload = (await response.json()) as {
		tafseer_name?: string;
		text?: string;
	};

	setHeaders({
		'cache-control': 'public, max-age=604800, s-maxage=604800'
	});

	return json({
		source,
		label: tafsirSource.label,
		author: tafsirSource.author,
		bookName: tafsirSource.bookName,
		tafsirName: payload.tafseer_name ?? tafsirSource.label,
		text: payload.text ?? ''
	});
};
