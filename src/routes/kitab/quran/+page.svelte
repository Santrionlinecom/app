<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SURAH_DATA } from '$lib/surah-data';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Search from '@lucide/svelte/icons/search';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import X from '@lucide/svelte/icons/x';

	type Verse = {
		verse_key: string;
		text: string;
		page_number: number;
		surahNumber: number;
		ayahNumber: number;
	};

	type PageGroup = {
		pageNumber: number;
		surahNumber: number;
		hasSurahStart: boolean;
		verses: Verse[];
	};

	type VerseInsight = {
		verseKey: string;
		surahNumber: number;
		ayahNumber: number;
		globalId: number | null;
		latin: string;
		translation: string;
		notes: string;
		asbabId: string | null;
		asbab: string;
		tafsir: string;
	};

	type TafsirSourceKey = 'muyassar' | 'jalalain' | 'sadi' | 'ibn-kathir' | 'qurtubi';

	type ClassicalTafsir = {
		source: TafsirSourceKey;
		label: string;
		author: string;
		bookName: string;
		tafsirName: string;
		text: string;
	};

	type AsbabItem = {
		id: number;
		source_key: string;
		source_title: string;
		source_author: string | null;
		source_publisher: string | null;
		surah_number: number;
		ayah_start: number;
		ayah_end: number;
		title: string | null;
		content: string;
		riwayat: string | null;
		takhrij: string | null;
		grade: string | null;
		page_ref: string | null;
	};

	type AsbabResponse = {
		ok: boolean;
		surah: number;
		ayah: number;
		items: AsbabItem[];
		message?: string;
		error?: string;
	};

	type AsbabIndexItem = Pick<
		AsbabItem,
		| 'id'
		| 'source_key'
		| 'source_title'
		| 'source_author'
		| 'source_publisher'
		| 'surah_number'
		| 'ayah_start'
		| 'ayah_end'
		| 'title'
		| 'grade'
		| 'page_ref'
	>;

	type AsbabIndexResponse = {
		ok: boolean;
		count: number;
		items: AsbabIndexItem[];
		error?: string;
	};

	type TafsirIndonesiaItem = {
		id: number;
		source_key: string;
		source_title: string;
		source_author: string | null;
		source_publisher: string | null;
		surah_number: number;
		ayah_number: number;
		title: string | null;
		content: string;
		summary: string | null;
		page_ref: string | null;
	};

	type TafsirIndonesiaResponse = {
		ok: boolean;
		source_origin: 'd1';
		surah: number;
		ayah: number;
		items: TafsirIndonesiaItem[];
		message?: string;
		error?: string;
	};

	type SearchScope = 'semua' | 'arab' | 'terjemah' | 'tafsir' | 'asbab';

	type VerseRef = {
		surahNumber: number;
		ayahNumber: number;
	};

	type JuzRange = {
		juz: number;
		start: VerseRef;
		end: VerseRef;
	};

	type SmartSearchTarget =
		| {
				kind: 'ayah';
				surahNumber: number;
				ayahNumber: number;
				juz: number;
				label: string;
				verseKey: string;
		  }
		| {
				kind: 'juz';
				juz: number;
				label: string;
		  };

	const JUZ_RANGES: JuzRange[] = [
		{ juz: 1, start: { surahNumber: 1, ayahNumber: 1 }, end: { surahNumber: 2, ayahNumber: 141 } },
		{ juz: 2, start: { surahNumber: 2, ayahNumber: 142 }, end: { surahNumber: 2, ayahNumber: 252 } },
		{ juz: 3, start: { surahNumber: 2, ayahNumber: 253 }, end: { surahNumber: 3, ayahNumber: 92 } },
		{ juz: 4, start: { surahNumber: 3, ayahNumber: 93 }, end: { surahNumber: 4, ayahNumber: 23 } },
		{ juz: 5, start: { surahNumber: 4, ayahNumber: 24 }, end: { surahNumber: 4, ayahNumber: 147 } },
		{ juz: 6, start: { surahNumber: 4, ayahNumber: 148 }, end: { surahNumber: 5, ayahNumber: 81 } },
		{ juz: 7, start: { surahNumber: 5, ayahNumber: 82 }, end: { surahNumber: 6, ayahNumber: 110 } },
		{ juz: 8, start: { surahNumber: 6, ayahNumber: 111 }, end: { surahNumber: 7, ayahNumber: 87 } },
		{ juz: 9, start: { surahNumber: 7, ayahNumber: 88 }, end: { surahNumber: 8, ayahNumber: 40 } },
		{ juz: 10, start: { surahNumber: 8, ayahNumber: 41 }, end: { surahNumber: 9, ayahNumber: 92 } },
		{ juz: 11, start: { surahNumber: 9, ayahNumber: 93 }, end: { surahNumber: 11, ayahNumber: 5 } },
		{ juz: 12, start: { surahNumber: 11, ayahNumber: 6 }, end: { surahNumber: 12, ayahNumber: 52 } },
		{ juz: 13, start: { surahNumber: 12, ayahNumber: 53 }, end: { surahNumber: 14, ayahNumber: 52 } },
		{ juz: 14, start: { surahNumber: 15, ayahNumber: 1 }, end: { surahNumber: 16, ayahNumber: 128 } },
		{ juz: 15, start: { surahNumber: 17, ayahNumber: 1 }, end: { surahNumber: 18, ayahNumber: 74 } },
		{ juz: 16, start: { surahNumber: 18, ayahNumber: 75 }, end: { surahNumber: 20, ayahNumber: 135 } },
		{ juz: 17, start: { surahNumber: 21, ayahNumber: 1 }, end: { surahNumber: 22, ayahNumber: 78 } },
		{ juz: 18, start: { surahNumber: 23, ayahNumber: 1 }, end: { surahNumber: 25, ayahNumber: 20 } },
		{ juz: 19, start: { surahNumber: 25, ayahNumber: 21 }, end: { surahNumber: 27, ayahNumber: 55 } },
		{ juz: 20, start: { surahNumber: 27, ayahNumber: 56 }, end: { surahNumber: 29, ayahNumber: 45 } },
		{ juz: 21, start: { surahNumber: 29, ayahNumber: 46 }, end: { surahNumber: 33, ayahNumber: 30 } },
		{ juz: 22, start: { surahNumber: 33, ayahNumber: 31 }, end: { surahNumber: 36, ayahNumber: 27 } },
		{ juz: 23, start: { surahNumber: 36, ayahNumber: 28 }, end: { surahNumber: 39, ayahNumber: 31 } },
		{ juz: 24, start: { surahNumber: 39, ayahNumber: 32 }, end: { surahNumber: 41, ayahNumber: 46 } },
		{ juz: 25, start: { surahNumber: 41, ayahNumber: 47 }, end: { surahNumber: 45, ayahNumber: 37 } },
		{ juz: 26, start: { surahNumber: 46, ayahNumber: 1 }, end: { surahNumber: 51, ayahNumber: 30 } },
		{ juz: 27, start: { surahNumber: 51, ayahNumber: 31 }, end: { surahNumber: 57, ayahNumber: 29 } },
		{ juz: 28, start: { surahNumber: 58, ayahNumber: 1 }, end: { surahNumber: 66, ayahNumber: 12 } },
		{ juz: 29, start: { surahNumber: 67, ayahNumber: 1 }, end: { surahNumber: 77, ayahNumber: 50 } },
		{ juz: 30, start: { surahNumber: 78, ayahNumber: 1 }, end: { surahNumber: 114, ayahNumber: 6 } }
	];
	const DATA_VERSION = '2';
	const STORAGE_KEY = 'quran.juz.selected';
	const CACHE_KEY = `quran.juz.cached.v${DATA_VERSION}`;
	const VIEW_KEY = 'quran.view.mode';
	const SEARCH_SCOPES: Array<{ value: SearchScope; label: string }> = [
		{ value: 'semua', label: 'Semua' },
		{ value: 'arab', label: 'Arab' },
		{ value: 'terjemah', label: 'Terjemah' },
		{ value: 'tafsir', label: 'Tafsir' },
		{ value: 'asbab', label: 'Asbab' }
	];
	const TAFSIR_SOURCES: Array<{ value: TafsirSourceKey; label: string }> = [
		{ value: 'jalalain', label: 'Jalalain' },
		{ value: 'ibn-kathir', label: 'Ibnu Katsir' },
		{ value: 'qurtubi', label: 'Al-Qurthubi' },
		{ value: 'sadi', label: 'As-Saadi' },
		{ value: 'muyassar', label: 'Al-Muyassar' }
	];
	const EMPTY_ASBAB_MESSAGE =
		'Belum ditemukan riwayat asbabun nuzul khusus untuk ayat ini. Namun ayat ini dapat berkaitan dengan konteks ayat sebelum/sesudahnya.';
	const EMPTY_TAFSIR_INDONESIA_MESSAGE =
		'Tafsir Indonesia belum tersedia untuk ayat ini. SantriOnline sedang menyiapkan data tafsir dari sumber tervalidasi.';

	let activeTab: 'mushaf' | 'sejarah' = 'mushaf';
	let viewMode: 'lembaran' | 'teks' = 'lembaran';
	let selectedJuz = '1';
	let selectedJuzNumber = 1;
	let verses: Verse[] = [];
	let pages: PageGroup[] = [];
	let loading = false;
	let error = '';
	let pageWarning = '';
	let navigationMessage = '';
	let query = '';
	let searchScope: SearchScope = 'semua';
	let selectedSurah = '1';
	let selectedAyah = '1';
	let smartSearchTarget: SmartSearchTarget | null = null;
	let cachedJuz: number[] = [];
	let offline = false;
	let flipContainer: HTMLDivElement | null = null;
	let flipInstance: any = null;
	let currentPageIndex = 0;
	let flipKey = '';
	let insightMap = new Map<string, VerseInsight>();
	let insightsLoading = false;
	let insightsError = '';
	let selectedVerseKey = '';
	let selectedTafsirSource: TafsirSourceKey = 'jalalain';
	let tafsirIndonesiaCache: Record<string, TafsirIndonesiaResponse> = {};
	let tafsirIndonesiaLoadingKey = '';
	let tafsirIndonesiaErrorKey = '';
	let tafsirIndonesiaError = '';
	let classicalTafsirCache: Record<string, ClassicalTafsir> = {};
	let classicalTafsirLoadingKey = '';
	let classicalTafsirError = '';
	let asbabCache: Record<string, AsbabResponse> = {};
	let asbabLoadingKey = '';
	let asbabErrorKey = '';
	let asbabError = '';
	let asbabIndexItems: AsbabIndexItem[] = [];
	let asbabIndexLoading = false;
	let asbabIndexError = '';

	const surahLookup = new Map(SURAH_DATA.map((surah) => [surah.number, surah.name]));
	const surahMetaLookup = new Map(SURAH_DATA.map((surah) => [surah.number, surah]));
	const padJuz = (value: number) => String(value).padStart(2, '0');
	const surahName = (surahNumber: number) => surahLookup.get(surahNumber) ?? `Surah ${surahNumber}`;
	const verseKeyFor = (surahNumber: number, ayahNumber: number) => `${surahNumber}:${ayahNumber}`;
	const tafsirIndonesiaCacheKey = (verse: Verse) => `${verse.surahNumber}:${verse.ayahNumber}`;
	const verseRefLabel = (surahNumber: number, ayahNumber: number) =>
		`${surahName(surahNumber)} ${ayahNumber} (${verseKeyFor(surahNumber, ayahNumber)})`;
	const compareVerseRef = (a: VerseRef, b: VerseRef) =>
		a.surahNumber === b.surahNumber ? a.ayahNumber - b.ayahNumber : a.surahNumber - b.surahNumber;
	const isVerseInRange = (verse: VerseRef, range: JuzRange) =>
		compareVerseRef(verse, range.start) >= 0 && compareVerseRef(verse, range.end) <= 0;
	const findJuzForVerse = (surahNumber: number, ayahNumber: number) =>
		JUZ_RANGES.find((range) => isVerseInRange({ surahNumber, ayahNumber }, range))?.juz ?? null;
	const formatJuzRange = (range: JuzRange) =>
		`${surahName(range.start.surahNumber)} ${range.start.ayahNumber} - ${surahName(range.end.surahNumber)} ${range.end.ayahNumber}`;

	const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
	const toArabicNumber = (value: number) =>
		String(value)
			.split('')
			.map((digit) => arabicDigits[Number(digit)] ?? digit)
			.join('');

	const stripArabicMarks = (value: string) =>
		value
			.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
			.replace(/\u0640/g, '')
			.replace(/\s+/g, ' ')
			.trim();

	const normalizeSearchText = (value: string) =>
		stripArabicMarks(value)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim();

	const normalizeReferenceText = (value: string) =>
		normalizeSearchText(value)
			.replace(/[^a-z0-9 ]+/g, ' ')
			.replace(/\b(qs|quran|surah|surat|sura|ayat|ayah|no|nomor|ke)\b/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const surahSearchIndex = SURAH_DATA.map((surah) => {
		const normalized = normalizeReferenceText(surah.name);
		const withoutArticle = normalized.replace(/^(al|an|ar|as|ash|at|az|ad|adh|aul)\s+/, '');
		const compact = normalized.replace(/\s+/g, '');
		const compactWithoutArticle = withoutArticle.replace(/\s+/g, '');
		return {
			...surah,
			aliases: Array.from(new Set([normalized, withoutArticle, compact, compactWithoutArticle, String(surah.number)]))
		};
	});

	const insightFor = (verse: Verse | null | undefined) =>
		verse ? insightMap.get(verse.verse_key) : undefined;

	const asbabCacheKey = (verse: Verse) => `${verse.surahNumber}:${verse.ayahNumber}`;

	const verseDomId = (verse: Verse) => `quran-verse-${verse.verse_key.replace(':', '-')}`;

	const verseReference = (verse: Verse) =>
		`${surahName(verse.surahNumber)} ${verse.ayahNumber} ${verse.verse_key}`;

	const searchCorpusFor = (verse: Verse, scope: SearchScope) => {
		const insight = insightFor(verse);
		const refs = `${verseReference(verse)} surah ${surahName(verse.surahNumber)} ayat ${verse.ayahNumber} qs ${verse.surahNumber} ayat ${verse.ayahNumber}`;
		const buckets: Record<SearchScope, string> = {
			semua: [
				refs,
				verse.text,
				insight?.latin,
				insight?.translation,
				insight?.notes,
				insight?.tafsir,
				insight?.asbab
			].join(' '),
			arab: verse.text,
			terjemah: [refs, insight?.latin, insight?.translation, insight?.notes].join(' '),
			tafsir: [refs, insight?.tafsir].join(' '),
			asbab: [refs, insight?.asbab].join(' ')
		};

		return normalizeSearchText(buckets[scope] ?? buckets.semua);
	};

	const matchesSearch = (verse: Verse) => {
		if (!normalizedQuery) return true;
		const target = smartSearchTarget;
		if (target?.kind === 'ayah') {
			return verse.surahNumber === target.surahNumber && verse.ayahNumber === target.ayahNumber;
		}
		return searchCorpusFor(verse, searchScope).includes(normalizedQuery);
	};

	const searchSnippet = (verse: Verse) => {
		const insight = insightFor(verse);
		if (searchScope === 'arab') return verse.text;
		if (searchScope === 'tafsir') return insight?.tafsir || 'Tafsir ayat ini sedang dimuat.';
		if (searchScope === 'asbab') return insight?.asbab || 'Belum ada catatan asbabun nuzul untuk ayat ini.';
		return insight?.translation || insight?.tafsir || verse.text;
	};

	const findSurahByQueryName = (value: string) => {
		const normalized = normalizeReferenceText(value);
		if (!normalized) return null;
		const compact = normalized.replace(/\s+/g, '');

		return (
			surahSearchIndex.find((surah) => surah.aliases.some((alias) => alias === normalized || alias === compact)) ??
			surahSearchIndex.find((surah) => surah.aliases.some((alias) => normalized.endsWith(` ${alias}`))) ??
			null
		);
	};

	const parseSmartSearchTarget = (value: string): SmartSearchTarget | null => {
		const raw = value.trim();
		if (!raw) return null;

		const juzMatch = raw.match(/^\s*juz\s+(\d{1,2})\s*$/i);
		if (juzMatch) {
			const juz = Number(juzMatch[1]);
			if (Number.isInteger(juz) && juz >= 1 && juz <= 30) {
				return { kind: 'juz', juz, label: `Juz ${juz}` };
			}
		}

		const numericRefMatch = raw.match(/^\s*(?:qs\.?\s*)?(\d{1,3})\s*[:.]\s*(\d{1,3})\s*$/i);
		const numericWordsMatch = raw.match(/^\s*(?:qs\.?\s*)?(\d{1,3})\s+(?:ayat\s+)?(\d{1,3})\s*$/i);
		const numericMatch = numericRefMatch ?? numericWordsMatch;
		if (numericMatch) {
			const surahNumber = Number(numericMatch[1]);
			const ayahNumber = Number(numericMatch[2]);
			return buildSmartAyahTarget(surahNumber, ayahNumber);
		}

		const normalized = normalizeReferenceText(raw);
		const ayahMatch = normalized.match(/(.+?)\s+(\d{1,3})$/);
		if (!ayahMatch) return null;

		const surah = findSurahByQueryName(ayahMatch[1]);
		if (!surah) return null;

		return buildSmartAyahTarget(surah.number, Number(ayahMatch[2]));
	};

	const buildSmartAyahTarget = (surahNumber: number, ayahNumber: number): SmartSearchTarget | null => {
		const surah = surahMetaLookup.get(surahNumber);
		if (!surah || !Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > surah.totalAyah) {
			return null;
		}

		const juz = findJuzForVerse(surahNumber, ayahNumber);
		if (!juz) return null;

		return {
			kind: 'ayah',
			surahNumber,
			ayahNumber,
			juz,
			label: verseRefLabel(surahNumber, ayahNumber),
			verseKey: verseKeyFor(surahNumber, ayahNumber)
		};
	};

	const syncNavigationFromVerse = (verse: Verse | null | undefined) => {
		if (!verse) return;
		selectedSurah = String(verse.surahNumber);
		selectedAyah = String(verse.ayahNumber);
	};

	const buildPages = (list: Verse[]) => {
		const pageMap = new Map<number, Verse[]>();
		for (const verse of list) {
			if (!verse.page_number) continue;
			if (!pageMap.has(verse.page_number)) pageMap.set(verse.page_number, []);
			pageMap.get(verse.page_number)?.push(verse);
		}

		return Array.from(pageMap.entries())
			.sort(([a], [b]) => a - b)
			.map(([pageNumber, pageVerses]) => {
				const sorted = pageVerses.sort((a, b) => {
					if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
					return a.ayahNumber - b.ayahNumber;
				});
				const firstVerse = sorted[0];
				return {
					pageNumber,
					surahNumber: firstVerse?.surahNumber ?? 0,
					hasSurahStart: firstVerse?.ayahNumber === 1,
					verses: sorted
				} as PageGroup;
			});
	};

	const markCached = (juz: number) => {
		if (!cachedJuz.includes(juz)) {
			cachedJuz = [...cachedJuz, juz].sort((a, b) => a - b);
			localStorage.setItem(CACHE_KEY, JSON.stringify(cachedJuz));
		}
	};

	const destroyFlipbook = () => {
		if (flipInstance?.destroy) {
			flipInstance.destroy();
		}
		flipInstance = null;
	};

	const initFlipbook = async () => {
		if (viewMode !== 'lembaran' || !flipContainer || pages.length === 0) return;

		const nextKey = `${selectedJuzNumber}-${pages.length}`;
		if (flipKey === nextKey && flipInstance) return;
		flipKey = nextKey;

		destroyFlipbook();
		await tick();

		const module = await import('page-flip');
		const PageFlip = (module as any).PageFlip ?? (module as any).default ?? module;

		const settings = {
			width: 420,
			height: 620,
			size: 'stretch',
			minWidth: 280,
			maxWidth: 520,
			minHeight: 400,
			maxHeight: 780,
			usePortrait: true,
			autoSize: true,
			maxShadowOpacity: 0.25,
			showCover: false,
			mobileScrollSupport: true,
			flippingTime: 700,
			swipeDistance: 30
		};

		flipInstance = new PageFlip(flipContainer, settings);
		const pageElements = flipContainer.querySelectorAll('.mushaf-page');
		flipInstance.loadFromHTML(pageElements);
		flipInstance.on('flip', (event: { data: number }) => {
			currentPageIndex = event.data;
		});
		currentPageIndex = 0;
	};

	const loadJuz = async (value: number) => {
		const juz = Math.min(Math.max(value, 1), 30);
		selectedJuz = String(juz);
		selectedJuzNumber = juz;
		localStorage.setItem(STORAGE_KEY, String(juz));

		loading = true;
		error = '';
		pageWarning = '';
		selectedVerseKey = '';
		try {
			const res = await fetch(`/quran/juz-${padJuz(juz)}.json?v=${DATA_VERSION}`, {
				cache: 'no-store'
			});
			if (!res.ok) {
				throw new Error('Data juz tidak ditemukan');
			}
			const data = await res.json();
			verses = (data.verses ?? []).map((verse: { verse_key: string; text: string; page_number: number }) => {
				const [surahNumber, ayahNumber] = verse.verse_key.split(':').map(Number);
				return {
					...verse,
					surahNumber,
					ayahNumber
				};
			});
			pages = buildPages(verses);
			selectedVerseKey = verses[0]?.verse_key ?? '';
			syncNavigationFromVerse(verses[0]);
			if (!pages.length && verses.length) {
				pageWarning = 'Data lembaran belum terunduh. Coba muat ulang saat online agar halaman muncul.';
				if (viewMode === 'lembaran') {
					viewMode = 'teks';
					localStorage.setItem(VIEW_KEY, 'teks');
				}
				destroyFlipbook();
			} else {
				markCached(juz);
				if (viewMode === 'lembaran') {
					await initFlipbook();
				}
			}
			void loadInsights(juz);
		} catch (err: any) {
			error = err?.message || 'Gagal memuat juz.';
		} finally {
			loading = false;
		}
	};

	const loadInsights = async (juz: number) => {
		insightsLoading = true;
		insightsError = '';
		insightMap = new Map();

		try {
			const res = await fetch(`/api/quran/juz-insights/${juz}`, {
				headers: {
					accept: 'application/json'
				}
			});

			if (!res.ok) {
				throw new Error('Data tafsir dan asbab belum bisa dimuat.');
			}

			const data = (await res.json()) as { verses?: VerseInsight[] };
			insightMap = new Map((data.verses ?? []).map((item) => [item.verseKey, item]));
		} catch (err: any) {
			insightsError = err?.message || 'Gagal memuat tafsir dan asbabun nuzul.';
		} finally {
			insightsLoading = false;
		}
	};

	const selectVerse = (verse: Verse) => {
		selectedVerseKey = verse.verse_key;
		syncNavigationFromVerse(verse);
	};

	const openVerseFromSearch = async (verse: Verse) => {
		selectVerse(verse);
		if (viewMode !== 'teks') {
			viewMode = 'teks';
			localStorage.setItem(VIEW_KEY, 'teks');
			destroyFlipbook();
		}

		await tick();
		document.getElementById(verseDomId(verse))?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	};

	const loadTafsirIndonesiaForVerse = async (verse: Verse | null | undefined) => {
		if (!verse) return;

		const cacheKey = tafsirIndonesiaCacheKey(verse);
		if (tafsirIndonesiaCache[cacheKey] || tafsirIndonesiaLoadingKey === cacheKey) return;

		tafsirIndonesiaLoadingKey = cacheKey;
		tafsirIndonesiaErrorKey = '';
		tafsirIndonesiaError = '';

		try {
			const res = await fetch(
				`/api/quran/tafsir-indonesia/${verse.surahNumber}/${verse.ayahNumber}`,
				{
					headers: {
						accept: 'application/json'
					}
				}
			);
			const data = (await res.json()) as TafsirIndonesiaResponse;

			if (!res.ok || !data.ok) {
				throw new Error(data.error || 'Tafsir Indonesia belum bisa dimuat.');
			}

			tafsirIndonesiaCache = {
				...tafsirIndonesiaCache,
				[cacheKey]: {
					...data,
					items: data.items ?? [],
					message: data.message ?? EMPTY_TAFSIR_INDONESIA_MESSAGE
				}
			};
		} catch (err: any) {
			tafsirIndonesiaErrorKey = cacheKey;
			tafsirIndonesiaError = err?.message || 'Gagal memuat tafsir Indonesia.';
		} finally {
			if (tafsirIndonesiaLoadingKey === cacheKey) {
				tafsirIndonesiaLoadingKey = '';
			}
		}
	};

	const loadClassicalTafsir = async (verse: Verse | null | undefined, source: TafsirSourceKey) => {
		if (!verse) return;
		const cacheKey = `${source}:${verse.verse_key}`;
		if (classicalTafsirCache[cacheKey] || classicalTafsirLoadingKey === cacheKey) return;

		classicalTafsirLoadingKey = cacheKey;
		classicalTafsirError = '';

		try {
			const res = await fetch(
				`/api/quran/tafsir-ulama/${source}/${verse.surahNumber}/${verse.ayahNumber}`,
				{
					headers: {
						accept: 'application/json'
					}
				}
			);

			if (!res.ok) {
				throw new Error('Tafsir ulama belum bisa dimuat.');
			}

			const data = (await res.json()) as ClassicalTafsir;
			classicalTafsirCache = {
				...classicalTafsirCache,
				[cacheKey]: {
					...data,
					source
				}
			};
		} catch (err: any) {
			classicalTafsirError = err?.message || 'Gagal memuat tafsir ulama.';
		} finally {
			if (classicalTafsirLoadingKey === cacheKey) {
				classicalTafsirLoadingKey = '';
			}
		}
	};

	const asbabRangeLabel = (item: { surah_number: number; ayah_start: number; ayah_end: number }) => {
		const range =
			item.ayah_start === item.ayah_end ? `${item.ayah_start}` : `${item.ayah_start}-${item.ayah_end}`;
		return `QS. ${surahName(item.surah_number)} ${range}`;
	};

	const handleJuzChange = (event: Event) => {
		const value = Number((event.target as HTMLSelectElement).value);
		navigationMessage = '';
		void loadJuz(value);
	};

	const handleSurahChange = () => {
		const surahNumber = Number(selectedSurah);
		const surah = surahMetaLookup.get(surahNumber);
		if (!surah) return;

		const ayahNumber = Number(selectedAyah) || 1;
		selectedAyah = String(Math.min(Math.max(ayahNumber, 1), surah.totalAyah));
		const juz = findJuzForVerse(surahNumber, Number(selectedAyah));
		navigationMessage = juz ? `${surah.name} ayat ${selectedAyah} berada di Juz ${juz}.` : '';
	};

	const handleViewChange = (mode: 'lembaran' | 'teks') => {
		viewMode = mode;
		localStorage.setItem(VIEW_KEY, mode);
		if (mode === 'lembaran') {
			void initFlipbook();
		} else {
			destroyFlipbook();
		}
	};

	const loadAsbabForVerse = async (verse: Verse | null | undefined) => {
		if (!verse) return;
		const cacheKey = asbabCacheKey(verse);
		if (asbabCache[cacheKey] || asbabLoadingKey === cacheKey) return;

		asbabLoadingKey = cacheKey;
		asbabErrorKey = '';
		asbabError = '';

		try {
			const params = new URLSearchParams({
				surah: String(verse.surahNumber),
				ayah: String(verse.ayahNumber)
			});
			const res = await fetch(`/api/quran/asbab?${params.toString()}`, {
				headers: {
					accept: 'application/json'
				}
			});

			const data = (await res.json()) as AsbabResponse;
			if (!res.ok || !data.ok) {
				throw new Error(data.error || 'Asbabun nuzul belum bisa dimuat.');
			}

			asbabCache = {
				...asbabCache,
				[cacheKey]: {
					...data,
					items: data.items ?? [],
					message: data.message ?? EMPTY_ASBAB_MESSAGE
				}
			};
		} catch (err: any) {
			asbabErrorKey = cacheKey;
			asbabError = err?.message || 'Gagal memuat asbabun nuzul.';
		} finally {
			if (asbabLoadingKey === cacheKey) {
				asbabLoadingKey = '';
			}
		}
	};

	const loadAsbabIndex = async (force = false) => {
		if (asbabIndexLoading || (!force && asbabIndexItems.length > 0)) return;

		asbabIndexLoading = true;
		asbabIndexError = '';

		try {
			const res = await fetch('/api/quran/asbab/index', {
				headers: {
					accept: 'application/json'
				}
			});
			const data = (await res.json()) as AsbabIndexResponse;
			if (!res.ok || !data.ok) {
				throw new Error(data.error || 'Daftar asbabun nuzul belum bisa dimuat.');
			}
			asbabIndexItems = data.items ?? [];
		} catch (err: any) {
			asbabIndexError = err?.message || 'Gagal memuat daftar asbabun nuzul.';
		} finally {
			asbabIndexLoading = false;
		}
	};

	const openVerseReference = async (surahNumber: number, ayahNumber: number) => {
		const surah = surahMetaLookup.get(surahNumber);
		if (!surah) {
			navigationMessage = 'Surah tidak valid.';
			return;
		}

		const safeAyah = Math.min(Math.max(ayahNumber, 1), surah.totalAyah);
		const targetJuz = findJuzForVerse(surahNumber, safeAyah);
		if (!targetJuz) {
			navigationMessage = 'Ayat tidak ditemukan dalam data juz.';
			return;
		}

		if (targetJuz !== selectedJuzNumber || verses.length === 0) {
			await loadJuz(targetJuz);
		}

		const verse = verses.find((item) => item.surahNumber === surahNumber && item.ayahNumber === safeAyah);
		if (!verse) {
			navigationMessage = `QS. ${surah.name} ${safeAyah} berada di Juz ${targetJuz}, tetapi belum termuat.`;
			return;
		}

		if (viewMode !== 'teks') {
			viewMode = 'teks';
			localStorage.setItem(VIEW_KEY, 'teks');
			destroyFlipbook();
		}

		selectVerse(verse);
		navigationMessage = `Dibuka: ${verseRefLabel(surahNumber, safeAyah)} • Juz ${targetJuz}.`;

		await tick();
		document.getElementById(verseDomId(verse))?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	};

	const openSelectedAyah = () => {
		const surahNumber = Number(selectedSurah);
		const ayahNumber = Number(selectedAyah);
		void openVerseReference(surahNumber, ayahNumber);
	};

	const openSmartSearchTarget = () => {
		const target = smartSearchTarget;
		if (!target) return;
		query = '';

		if (target.kind === 'juz') {
			navigationMessage = '';
			void loadJuz(target.juz);
			return;
		}

		void openVerseReference(target.surahNumber, target.ayahNumber);
	};

	const navigateRelativeVerse = (step: -1 | 1) => {
		const currentSurah = Number(selectedSurah);
		const currentAyah = Number(selectedAyah);
		const currentMeta = surahMetaLookup.get(currentSurah);
		if (!currentMeta) return;

		let nextSurah = currentSurah;
		let nextAyah = currentAyah + step;

		if (nextAyah < 1) {
			const previousSurah = surahMetaLookup.get(currentSurah - 1);
			if (!previousSurah) return;
			nextSurah = previousSurah.number;
			nextAyah = previousSurah.totalAyah;
		} else if (nextAyah > currentMeta.totalAyah) {
			const nextSurahMeta = surahMetaLookup.get(currentSurah + 1);
			if (!nextSurahMeta) return;
			nextSurah = nextSurahMeta.number;
			nextAyah = 1;
		}

		void openVerseReference(nextSurah, nextAyah);
	};

	const flipPrev = () => {
		flipInstance?.flipPrev();
	};

	const flipNext = () => {
		flipInstance?.flipNext();
	};

	onMount(() => {
		offline = typeof navigator !== 'undefined' && !navigator.onLine;
		const handleOnline = () => (offline = false);
		const handleOffline = () => (offline = true);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved && !Number.isNaN(Number(saved))) {
			selectedJuz = saved;
			selectedJuzNumber = Number(saved);
		}
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			try {
				const parsed = JSON.parse(cached);
				if (Array.isArray(parsed)) {
					cachedJuz = parsed.filter((item) => typeof item === 'number');
				}
			} catch {
				cachedJuz = [];
			}
		}
		const savedView = localStorage.getItem(VIEW_KEY);
		if (savedView === 'lembaran' || savedView === 'teks') {
			viewMode = savedView;
		}

		void loadJuz(selectedJuzNumber);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			destroyFlipbook();
		};
	});

	$: selectedJuzNumber = Number(selectedJuz) || 1;
	$: normalizedQuery = normalizeSearchText(query);
	$: smartSearchTarget = parseSmartSearchTarget(query);
	$: filteredVerses = normalizedQuery ? verses.filter(matchesSearch) : verses;
	$: selectedSurahMeta = surahMetaLookup.get(Number(selectedSurah)) ?? SURAH_DATA[0];
	$: selectedJuzRange = JUZ_RANGES.find((range) => range.juz === selectedJuzNumber);
	$: totalPages = pages.length;
	$: currentPageNumber = pages[currentPageIndex]?.pageNumber;
	$: currentSpread = Math.floor(currentPageIndex / 2) + 1;
	$: totalSpreads = Math.ceil(totalPages / 2);
	$: selectedVerse = verses.find((verse) => verse.verse_key === selectedVerseKey) ?? verses[0] ?? null;
	$: selectedVerseJuz = selectedVerse
		? findJuzForVerse(selectedVerse.surahNumber, selectedVerse.ayahNumber)
		: selectedJuzNumber;
	$: selectedInsight = insightFor(selectedVerse);
	$: selectedTafsirIndonesiaKey = selectedVerse ? tafsirIndonesiaCacheKey(selectedVerse) : '';
	$: selectedTafsirIndonesiaResponse = selectedTafsirIndonesiaKey
		? tafsirIndonesiaCache[selectedTafsirIndonesiaKey]
		: null;
	$: selectedTafsirIndonesiaItems = selectedTafsirIndonesiaResponse?.items ?? [];
	$: selectedTafsirIndonesia = selectedTafsirIndonesiaItems[0]?.content || selectedInsight?.tafsir || '';
	$: selectedTafsirIndonesiaMessage =
		selectedTafsirIndonesiaResponse?.message ?? EMPTY_TAFSIR_INDONESIA_MESSAGE;
	$: selectedTafsirIndonesiaLoading = Boolean(
		selectedTafsirIndonesiaKey && tafsirIndonesiaLoadingKey === selectedTafsirIndonesiaKey
	);
	$: selectedTafsirIndonesiaError =
		selectedTafsirIndonesiaKey && tafsirIndonesiaErrorKey === selectedTafsirIndonesiaKey
			? tafsirIndonesiaError
			: '';
	$: selectedAsbabKey = selectedVerse ? asbabCacheKey(selectedVerse) : '';
	$: selectedAsbab = selectedAsbabKey ? asbabCache[selectedAsbabKey] : null;
	$: selectedAsbabItems = selectedAsbab?.items ?? [];
	$: selectedAsbabLoading = Boolean(selectedAsbabKey && asbabLoadingKey === selectedAsbabKey);
	$: selectedAsbabError = selectedAsbabKey && asbabErrorKey === selectedAsbabKey ? asbabError : '';
	$: selectedClassicalCacheKey = selectedVerse ? `${selectedTafsirSource}:${selectedVerse.verse_key}` : '';
	$: selectedClassicalTafsir = selectedClassicalCacheKey
		? classicalTafsirCache[selectedClassicalCacheKey]
		: null;
	$: classicalTafsirLoading = Boolean(
		selectedClassicalCacheKey && classicalTafsirLoadingKey === selectedClassicalCacheKey
	);
	$: searchResults = normalizedQuery ? filteredVerses.slice(0, 8) : [];
	$: insightReadyCount = Array.from(insightMap.values()).filter(
		(item) => item.translation || item.tafsir || item.asbab
	).length;
	$: if (selectedVerse && activeTab === 'mushaf') {
		void loadTafsirIndonesiaForVerse(selectedVerse);
		void loadClassicalTafsir(selectedVerse, selectedTafsirSource);
		void loadAsbabForVerse(selectedVerse);
	}
</script>

<svelte:head>
	<title>Mushaf Utsmani - Santri Online</title>
</svelte:head>

<section class="max-w-7xl mx-auto py-10 space-y-6">
	<header class="space-y-3 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Mushaf Utsmani</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">Baca Al-Qur'an 30 Juz</h1>
		<p class="text-slate-600">
			Tampilan lembaran mushaf yang mirip kitab asli, dengan opsi teks untuk pencarian cepat.
		</p>
	</header>

	<div class="tabs tabs-boxed justify-center">
		<button class={`tab ${activeTab === 'mushaf' ? 'tab-active' : ''}`} on:click={() => (activeTab = 'mushaf')}>
			Mushaf Utsmani
		</button>
		<button class={`tab ${activeTab === 'sejarah' ? 'tab-active' : ''}`} on:click={() => (activeTab = 'sejarah')}>
			Sejarah Qur'an
		</button>
	</div>

	{#if activeTab === 'mushaf'}
		<div class="rounded-2xl border bg-base-100 p-4 md:p-6 shadow-sm space-y-4">
			<div class="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
				<div class="grid gap-3 md:grid-cols-[160px_minmax(220px,1fr)_140px_auto] md:items-end">
					<label class="form-control w-full">
						<div class="label">
							<span class="label-text">Pilih Juz</span>
						</div>
						<select class="select select-bordered w-full" bind:value={selectedJuz} on:change={handleJuzChange}>
							{#each JUZ_RANGES as range}
								<option value={String(range.juz)}>Juz {range.juz}</option>
							{/each}
						</select>
					</label>
					<label class="form-control w-full">
						<div class="label">
							<span class="label-text">Surah</span>
						</div>
						<select class="select select-bordered w-full" bind:value={selectedSurah} on:change={handleSurahChange}>
							{#each SURAH_DATA as surah}
								<option value={String(surah.number)}>{surah.number}. {surah.name}</option>
							{/each}
						</select>
					</label>
					<label class="form-control w-full">
						<div class="label">
							<span class="label-text">Ayat</span>
						</div>
						<input
							class="input input-bordered w-full"
							type="number"
							min="1"
							max={selectedSurahMeta.totalAyah}
							bind:value={selectedAyah}
							on:change={handleSurahChange}
						/>
					</label>
					<div class="flex flex-wrap gap-2">
						<button class="btn btn-primary" on:click={openSelectedAyah} disabled={loading}>
							Buka Ayat
						</button>
						<div class="join">
							<button class="btn join-item btn-outline" on:click={() => navigateRelativeVerse(-1)} disabled={loading}>
								Sebelum
							</button>
							<button class="btn join-item btn-outline" on:click={() => navigateRelativeVerse(1)} disabled={loading}>
								Sesudah
							</button>
						</div>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<div class="join">
						<button
							class={`btn join-item ${viewMode === 'lembaran' ? 'btn-primary' : 'btn-ghost'}`}
							on:click={() => handleViewChange('lembaran')}
						>
							Lembaran
						</button>
						<button
							class={`btn join-item ${viewMode === 'teks' ? 'btn-primary' : 'btn-ghost'}`}
							on:click={() => handleViewChange('teks')}
						>
							Teks
						</button>
					</div>
					<button class="btn btn-primary" on:click={() => loadJuz(selectedJuzNumber)} disabled={loading}>
						{loading ? 'Memuat...' : 'Muat Juz'}
					</button>
					<button class="btn btn-ghost" on:click={() => (query = '')} disabled={!query}>
						Reset
					</button>
				</div>
			</div>
			<div class="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 md:grid-cols-2">
				<p>
					Juz {selectedJuzNumber}: {selectedJuzRange ? formatJuzRange(selectedJuzRange) : 'rentang belum tersedia'}.
				</p>
				<p class="md:text-right">
					Surah {selectedSurahMeta.name} memiliki {selectedSurahMeta.totalAyah} ayat.
					{#if selectedVerse}
						Ayat aktif: {verseRefLabel(selectedVerse.surahNumber, selectedVerse.ayahNumber)} • Juz {selectedVerseJuz}.
					{/if}
				</p>
				{#if navigationMessage}
					<p class="font-medium text-emerald-700 md:col-span-2">{navigationMessage}</p>
				{/if}
			</div>

			<div class="quran-reader-grid">
				<aside class="quran-search-panel">
					<label class="form-control">
						<div class="label">
							<span class="label-text">Pencarian Terintegrasi</span>
						</div>
						<div class="relative">
							<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input
								class="input input-bordered w-full pl-10 pr-10"
								placeholder="Cari 2:255, Al-Baqarah 142, Juz 30, arti, tafsir, atau Arab"
								bind:value={query}
							/>
							{#if query}
								<button
									type="button"
									class="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
									aria-label="Bersihkan pencarian"
									on:click={() => (query = '')}
								>
									<X class="h-4 w-4" />
								</button>
							{/if}
						</div>
					</label>

					<div class="search-scope-grid">
						{#each SEARCH_SCOPES as scope}
							<button
								type="button"
								class={`btn btn-xs ${searchScope === scope.value ? 'btn-primary' : 'btn-outline'}`}
								on:click={() => (searchScope = scope.value)}
							>
								{scope.label}
							</button>
						{/each}
					</div>

					<div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
						{#if insightsLoading}
							<span class="inline-flex items-center gap-2">
								<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
								Memuat tafsir dan asbab juz {selectedJuzNumber}...
							</span>
						{:else if insightsError}
							<span class="text-amber-700">{insightsError}</span>
						{:else}
							<span>{insightReadyCount} ayat terhubung dengan terjemah, tafsir, atau asbab.</span>
						{/if}
					</div>

					<div class="rounded-lg border border-amber-100 bg-amber-50 p-3">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-amber-950">Indeks Asbabun Nuzul</p>
								<p class="text-xs leading-5 text-amber-900/80">
									Daftar ayat yang punya data asbab published di database.
								</p>
							</div>
							<button class="btn btn-xs btn-outline" on:click={() => loadAsbabIndex(true)} disabled={asbabIndexLoading}>
								{asbabIndexLoading ? 'Memuat' : asbabIndexItems.length ? 'Refresh' : 'Muat'}
							</button>
						</div>
						{#if asbabIndexError}
							<p class="mt-2 text-xs leading-5 text-amber-700">{asbabIndexError}</p>
						{:else if asbabIndexItems.length}
							<div class="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
								{#each asbabIndexItems as item}
									<button
										type="button"
										class="w-full rounded-lg border border-amber-200 bg-white/80 px-3 py-2 text-left text-xs transition hover:border-amber-300 hover:bg-white"
										on:click={() => openVerseReference(item.surah_number, item.ayah_start)}
									>
										<span class="block font-semibold text-amber-950">{asbabRangeLabel(item)}</span>
										<span class="mt-1 block leading-5 text-slate-700">{item.title || 'Asbabun Nuzul'}</span>
										<span class="mt-1 block leading-5 text-slate-500">{item.source_title}</span>
										{#if item.page_ref || item.grade}
											<span class="mt-1 block leading-5 text-slate-500">
												{#if item.grade}{item.grade}{/if}
												{#if item.grade && item.page_ref} • {/if}
												{#if item.page_ref}{item.page_ref}{/if}
											</span>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="mt-2 text-xs leading-5 text-amber-900/80">
								Belum ada daftar termuat. Klik Muat untuk melihat data published yang tersedia.
							</p>
						{/if}
					</div>

					{#if normalizedQuery}
						<div class="space-y-2">
							{#if smartSearchTarget}
								<button
									type="button"
									class="search-result is-active border-emerald-200 bg-emerald-50"
									on:click={openSmartSearchTarget}
								>
									<span class="font-semibold text-emerald-900">
										{smartSearchTarget.kind === 'ayah' ? 'Buka ayat tepat' : 'Buka juz'}
									</span>
									<span class="line-clamp-2 text-xs leading-5 text-emerald-900/80">
										{smartSearchTarget.label}
										{#if smartSearchTarget.kind === 'ayah'}
											• Juz {smartSearchTarget.juz}
										{/if}
									</span>
								</button>
							{/if}
							<div class="flex items-center justify-between text-xs text-slate-500">
								<span>{filteredVerses.length} hasil</span>
								<span>Juz {selectedJuzNumber}</span>
							</div>
							{#if searchResults.length}
								{#each searchResults as verse}
									<button
										type="button"
										class={`search-result ${selectedVerseKey === verse.verse_key ? 'is-active' : ''}`}
										on:click={() => openVerseFromSearch(verse)}
									>
										<span class="font-semibold text-slate-900">
											{surahName(verse.surahNumber)} {verse.ayahNumber}
										</span>
										<span class="line-clamp-2 text-xs leading-5 text-slate-600">
											{searchSnippet(verse)}
										</span>
									</button>
								{/each}
							{:else}
								<p class="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
									Tidak ada ayat yang cocok di juz ini.
								</p>
							{/if}
						</div>
					{:else if selectedVerse}
						<div class="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-slate-700">
							<p class="font-semibold text-emerald-900">
								{surahName(selectedVerse.surahNumber)} {selectedVerse.ayahNumber}
							</p>
							<p class="mt-1 text-xs leading-5 text-emerald-900/80">
								{selectedInsight?.translation || 'Pilih ayat pada mode teks untuk membuka tafsir dan asbabun nuzul.'}
							</p>
						</div>
					{/if}
				</aside>

				<div class="quran-reader-main">
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<span class="badge badge-outline">Total ayat: {verses.length}</span>
						<span class="badge badge-outline">Halaman: {totalPages || '-'}</span>
						<span class="badge badge-outline">Terfilter: {filteredVerses.length}</span>
						{#if cachedJuz.includes(selectedJuzNumber)}
							<span class="badge badge-success">Tersimpan offline</span>
						{/if}
						{#if offline}
							<span class="badge badge-warning">Mode offline</span>
						{/if}
					</div>

					{#if error}
						<div class="alert alert-error">
							<span>{error}</span>
						</div>
					{:else if loading}
						<div class="flex items-center gap-2 text-sm text-slate-600">
							<span class="loading loading-spinner loading-sm"></span>
							Memuat juz {selectedJuzNumber}...
						</div>
					{:else if !verses.length}
						<div class="alert">
							<span>Data juz belum tersedia.</span>
						</div>
					{:else}
						{#if pageWarning}
							<div class="alert alert-warning">
								<span>{pageWarning}</span>
							</div>
						{/if}
						{#if viewMode === 'lembaran'}
							<div class="mushaf-toolbar">
								<div class="text-xs text-base-content/70">
									Lembar {currentSpread} dari {totalSpreads} • Halaman {currentPageNumber || '-'}
								</div>
								<div class="flex items-center gap-2">
									<button class="btn btn-sm" on:click={flipPrev}>◀</button>
									<button class="btn btn-sm" on:click={flipNext}>▶</button>
								</div>
							</div>
							<div class="mushaf-shell">
								<div class="mushaf-book" bind:this={flipContainer}>
									{#each pages as page}
										<div class="mushaf-page">
											<div class="mushaf-frame">
												<div class="mushaf-header">
													<span>Juz {selectedJuzNumber}</span>
													<span>Hal {page.pageNumber}</span>
												</div>
												{#if page.hasSurahStart}
													<div class="surah-banner">{surahName(page.surahNumber)}</div>
												{/if}
												<div class="mushaf-text quran-text" dir="rtl">
													{#each page.verses as verse}
														<span class="verse">
															{verse.text}
															<span class="ayah-number">{toArabicNumber(verse.ayahNumber)}</span>
														</span>
													{/each}
												</div>
												<div class="mushaf-footer">{page.pageNumber}</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="space-y-4">
								{#each filteredVerses as verse, i}
									{@const insight = insightFor(verse)}
									{#if i === 0 || filteredVerses[i - 1].surahNumber !== verse.surahNumber}
										<div class="divider text-sm text-slate-500">{surahName(verse.surahNumber)}</div>
									{/if}
									<article
										id={verseDomId(verse)}
										class={`rounded-xl border bg-base-100 p-3 shadow-sm transition md:p-4 ${selectedVerseKey === verse.verse_key ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}`}
									>
										<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60 mb-2">
											<span>Surah {surahName(verse.surahNumber)} • Ayat {verse.ayahNumber}</span>
											<span class="badge badge-outline">Hal {verse.page_number}</span>
										</div>
										<p class="quran-text text-right" dir="rtl">{verse.text}</p>
										{#if insight?.translation}
											<p class="mt-3 text-sm leading-7 text-slate-700">{insight.translation}</p>
										{/if}
										<div class="mt-3 flex flex-wrap items-center gap-2">
											<button
												type="button"
												class="btn btn-sm btn-outline"
												on:click={() => selectVerse(verse)}
											>
												<BookOpenText class="h-4 w-4" />
												Tafsir & Asbab
											</button>
											{#if selectedVerseKey === verse.verse_key && selectedAsbabItems.length}
												<span class="badge badge-warning badge-outline">Asbab tersedia</span>
											{/if}
											{#if insight?.tafsir || (selectedVerseKey === verse.verse_key && selectedTafsirIndonesiaItems.length)}
												<span class="badge badge-success badge-outline">Tafsir tersedia</span>
											{/if}
										</div>

										{#if selectedVerseKey === verse.verse_key}
											<div class="mt-4 grid gap-3 lg:grid-cols-2">
												<section class="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
													<h3 class="flex items-center gap-2 text-sm font-semibold text-emerald-950">
														<BookOpenText class="h-4 w-4" />
														Tafsir Indonesia
													</h3>
													{#if selectedTafsirIndonesiaItems.length}
														<div class="mt-3 space-y-4">
															{#each selectedTafsirIndonesiaItems as item}
																<article class="rounded-lg border border-emerald-200 bg-white/70 p-3">
																	{#if item.title}
																		<h4 class="text-sm font-semibold text-emerald-950">{item.title}</h4>
																	{/if}
																	<div class="mt-2 space-y-1 text-xs leading-5 text-emerald-950/80">
																		<p>Sumber: {item.source_title}</p>
																		{#if item.source_author}
																			<p>Penulis: {item.source_author}</p>
																		{/if}
																		{#if item.source_publisher}
																			<p>Penerbit: {item.source_publisher}</p>
																		{/if}
																		<p>Ayat: QS. {surahName(item.surah_number)} {item.ayah_number}</p>
																		{#if item.page_ref}
																			<p>Rujukan halaman: {item.page_ref}</p>
																		{/if}
																	</div>
																	{#if item.summary}
																		<p class="mt-3 text-sm leading-7 text-slate-700">{item.summary}</p>
																	{/if}
																	<p class="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{item.content}</p>
																</article>
															{/each}
														</div>
													{:else if selectedTafsirIndonesia}
														<div class="mt-3 rounded-lg border border-emerald-200 bg-white/70 p-3">
															<p class="text-xs leading-5 text-emerald-950/80">Sumber: Database Tafsir Indonesia</p>
															<p class="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
																{selectedTafsirIndonesia}
															</p>
														</div>
													{:else if selectedTafsirIndonesiaLoading}
														<p class="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
															<LoaderCircle class="h-4 w-4 animate-spin" />
															Memuat tafsir Indonesia...
														</p>
													{:else if selectedTafsirIndonesiaError}
														<p class="mt-2 text-sm leading-7 text-amber-700">{selectedTafsirIndonesiaError}</p>
													{:else}
														<p class="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
															{selectedTafsirIndonesiaMessage}
														</p>
													{/if}
												</section>
												<section class="rounded-lg border border-amber-100 bg-amber-50 p-4">
													<h3 class="flex items-center gap-2 text-sm font-semibold text-amber-950">
														<ScrollText class="h-4 w-4" />
														Asbabun Nuzul
													</h3>
													{#if selectedAsbabLoading}
														<p class="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
															<LoaderCircle class="h-4 w-4 animate-spin" />
															Memuat asbabun nuzul...
														</p>
													{:else if selectedAsbabError}
														<p class="mt-2 text-sm leading-7 text-amber-700">{selectedAsbabError}</p>
													{:else if selectedAsbabItems.length}
														<div class="mt-3 space-y-4">
															{#each selectedAsbabItems as item}
																<article class="rounded-lg border border-amber-200 bg-white/70 p-3">
																	{#if item.title}
																		<h4 class="text-sm font-semibold text-amber-950">{item.title}</h4>
																	{/if}
																	<div class="mt-2 space-y-1 text-xs leading-5 text-amber-950/80">
																		<p>Sumber: {item.source_title}</p>
																		{#if item.source_author}
																			<p>Penulis: {item.source_author}</p>
																		{/if}
																		{#if item.source_publisher}
																			<p>Penerbit: {item.source_publisher}</p>
																		{/if}
																		<p>Range: {asbabRangeLabel(item)}</p>
																	</div>
																	<p class="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{item.content}</p>
																	{#if item.riwayat}
																		<div class="mt-3">
																			<p class="text-xs font-semibold uppercase tracking-wide text-amber-900">Riwayat</p>
																			<p class="mt-1 whitespace-pre-line text-sm leading-7 text-slate-700">{item.riwayat}</p>
																		</div>
																	{/if}
																	{#if item.takhrij}
																		<div class="mt-3">
																			<p class="text-xs font-semibold uppercase tracking-wide text-amber-900">Takhrij</p>
																			<p class="mt-1 whitespace-pre-line text-sm leading-7 text-slate-700">{item.takhrij}</p>
																		</div>
																	{/if}
																	{#if item.grade}
																		<p class="mt-3 text-sm leading-7 text-slate-700">
																			<span class="font-semibold text-amber-950">Grade/status hadis:</span>
																			{item.grade}
																		</p>
																	{/if}
																	{#if item.page_ref}
																		<p class="mt-2 text-sm leading-7 text-slate-700">
																			<span class="font-semibold text-amber-950">Rujukan halaman:</span>
																			{item.page_ref}
																		</p>
																	{/if}
																</article>
															{/each}
														</div>
													{:else}
														<p class="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
															{selectedAsbab?.message ?? EMPTY_ASBAB_MESSAGE}
														</p>
													{/if}
												</section>
												<section class="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
													<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
														<div>
															<h3 class="text-sm font-semibold text-slate-950">Tafsir Ulama Klasik</h3>
															<p class="text-xs text-slate-500">Teks Arab dari kitab tafsir pilihan.</p>
														</div>
														<select
															class="select select-bordered select-sm w-full sm:w-52"
															bind:value={selectedTafsirSource}
														>
															{#each TAFSIR_SOURCES as source}
																<option value={source.value}>{source.label}</option>
															{/each}
														</select>
													</div>

													{#if classicalTafsirLoading}
														<p class="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
															<LoaderCircle class="h-4 w-4 animate-spin" />
															Memuat tafsir ulama...
														</p>
													{:else if selectedClassicalTafsir}
														<div class="mt-3 space-y-2">
															<p class="text-xs font-semibold text-slate-500">
																{selectedClassicalTafsir.label} • {selectedClassicalTafsir.author}
															</p>
															<p class="quran-commentary-arabic" dir="rtl">{selectedClassicalTafsir.text}</p>
														</div>
													{:else if classicalTafsirError}
														<p class="mt-3 text-sm text-amber-700">{classicalTafsirError}</p>
													{/if}
												</section>
											</div>
										{/if}
									</article>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
		<p class="text-xs text-slate-500 text-center">
			Setelah juz dibuka sekali, data akan tersimpan otomatis dan bisa diakses tanpa internet.
		</p>
	{:else}
		<section class="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
			<section class="space-y-3">
				<h2 class="text-2xl font-semibold text-slate-800">Garis Besar Wahyu</h2>
				<ul class="list-disc pl-5 space-y-2 text-slate-700">
					<li>Dimulai dengan wahyu pertama di Gua Hira, Surah al-Alaq ayat 1-5, ketika Malaikat Jibril menyampaikan perintah "Iqra".</li>
					<li>Wahyu berlanjut selama 23 tahun: 13 tahun di Makkah (ayat Makkiyah) dan 10 tahun di Madinah (ayat Madaniyah).</li>
					<li>Rasulullah ﷺ menerima, menghafal, menjelaskan makna, dan memerintahkan penulisan wahyu kepada para katib (penulis) seperti Zaid bin Tsabit.</li>
					<li>Para sahabat utama seperti Abu Bakar, Umar, Utsman, Ali, Ibn Mas'ud, dan Ubay bin Ka'ab menjadi mata rantai sanad bacaan dan hafalan.</li>
				</ul>
			</section>

			<section class="space-y-3">
				<h2 class="text-2xl font-semibold text-slate-800">Kodifikasi Mushaf</h2>
				<ul class="list-disc pl-5 space-y-2 text-slate-700">
					<li>Masa Abu Bakar ash-Shiddiq: pengumpulan lembaran wahyu setelah Perang Yamamah dipimpin Zaid bin Tsabit.</li>
					<li>Masa Utsman bin Affan: penyeragaman rasm (penulisan) dan pengiriman mushaf resmi ke berbagai wilayah untuk menjaga kesatuan qira'ah.</li>
					<li>Tradisi talaqqi (belajar langsung) diteruskan hingga para imam qira'ah dan para ulama di Nusantara yang mengajarkannya di pesantren.</li>
				</ul>
			</section>

			<section class="space-y-3">
				<h2 class="text-2xl font-semibold text-slate-800">Jejak di Nusantara</h2>
				<ul class="list-disc pl-5 space-y-2 text-slate-700">
					<li>Datang bersama para wali dan ulama yang membawa sanad bacaan dan tafsir, mengajarkannya di surau, langgar, dan pesantren.</li>
					<li>Hafidz dan qori lokal meneruskan tradisi tahfidz, qira'ah, dan tafsir, menjadi bekal dakwah dan pendidikan generasi berikutnya.</li>
					<li>Pesantren modern menjaga metode talaqqi, muraja'ah, dan khataman agar sanad bacaan Al-Qur'an tetap bersambung hingga Rasulullah ﷺ.</li>
				</ul>
			</section>
		</section>

		<p class="text-center text-sm text-slate-500">
			Al-Qur'an adalah pusat ilmu kami; semua kajian kitab turats di pesantren bersandar pada cahaya wahyu ini.
		</p>
	{/if}
</section>

<style>
	.quran-reader-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
	}

	.quran-search-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-self: start;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: #ffffff;
		padding: 1rem;
	}

	.quran-reader-main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-scope-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.4rem;
	}

	.search-result {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 0.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.65rem;
		background: #ffffff;
		padding: 0.75rem;
		text-align: left;
		transition:
			border-color 160ms ease,
			background-color 160ms ease;
	}

	.search-result:hover,
	.search-result.is-active {
		border-color: #10b981;
		background: #ecfdf5;
	}

	.quran-text {
		font-family: "Amiri Quran", "Noto Naskh Arabic", serif;
		font-size: 1.3rem;
		line-height: 2.2;
	}

	.quran-commentary-arabic {
		font-family: "Amiri Quran", "Noto Naskh Arabic", serif;
		font-size: 1.2rem;
		line-height: 2.1;
		color: #0f172a;
	}

	.mushaf-shell {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0 1.5rem;
	}

	.mushaf-book {
		width: min(100%, 940px);
		margin: 0 auto;
	}

	.mushaf-page {
		background: linear-gradient(180deg, #fffdf6 0%, #fbf2e2 100%);
		border-radius: 18px;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
		padding: 14px;
	}

	.mushaf-frame {
		height: 100%;
		display: flex;
		flex-direction: column;
		border: 2px solid #0f766e;
		border-radius: 14px;
		padding: 12px 14px;
		background: rgba(255, 255, 255, 0.6);
	}

	.mushaf-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #0f766e;
		margin-bottom: 8px;
	}

	.surah-banner {
		text-align: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 8px;
		padding: 6px 10px;
		border: 1px solid rgba(15, 118, 110, 0.35);
		border-radius: 999px;
		background: rgba(15, 118, 110, 0.08);
	}

	.mushaf-text {
		flex: 1;
		text-align: right;
		line-height: 2.15;
		color: #0f172a;
	}

	.verse {
		display: inline;
	}

	.ayah-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.35rem;
		height: 1.35rem;
		margin: 0 0.3rem 0 0.4rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 118, 110, 0.6);
		font-size: 0.75rem;
		color: #0f766e;
		background: #fff;
	}

	.mushaf-footer {
		margin-top: 8px;
		text-align: center;
		font-size: 0.75rem;
		color: #64748b;
	}

	.mushaf-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding: 0.25rem 0;
	}

	@media (min-width: 768px) {
		.quran-text {
			font-size: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.quran-reader-grid {
			grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
			align-items: start;
		}

		.quran-search-panel {
			position: sticky;
			top: 5.5rem;
		}
	}
</style>
