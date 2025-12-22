<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SURAH_DATA } from '$lib/surah-data';

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

	const JUZ_LIST = Array.from({ length: 30 }, (_v, idx) => idx + 1);
	const STORAGE_KEY = 'quran.juz.selected';
	const CACHE_KEY = 'quran.juz.cached';
	const VIEW_KEY = 'quran.view.mode';

	let activeTab: 'mushaf' | 'sejarah' = 'mushaf';
	let viewMode: 'lembaran' | 'teks' = 'lembaran';
	let selectedJuz = '1';
	let selectedJuzNumber = 1;
	let verses: Verse[] = [];
	let pages: PageGroup[] = [];
	let loading = false;
	let error = '';
	let query = '';
	let cachedJuz: number[] = [];
	let offline = false;
	let flipContainer: HTMLDivElement | null = null;
	let flipInstance: any = null;
	let currentPageIndex = 0;
	let flipKey = '';

	const surahLookup = new Map(SURAH_DATA.map((surah) => [surah.number, surah.name]));
	const padJuz = (value: number) => String(value).padStart(2, '0');
	const surahName = (surahNumber: number) => surahLookup.get(surahNumber) ?? `Surah ${surahNumber}`;

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
		try {
			const res = await fetch(`/quran/juz-${padJuz(juz)}.json`, { cache: 'force-cache' });
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
			markCached(juz);
			if (viewMode === 'lembaran') {
				await initFlipbook();
			}
		} catch (err: any) {
			error = err?.message || 'Gagal memuat juz.';
		} finally {
			loading = false;
		}
	};

	const handleJuzChange = (event: Event) => {
		const value = Number((event.target as HTMLSelectElement).value);
		void loadJuz(value);
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
	$: normalizedQuery = stripArabicMarks(query);
	$: filteredVerses = normalizedQuery
		? verses.filter((verse) => stripArabicMarks(verse.text).includes(normalizedQuery))
		: verses;
	$: totalPages = pages.length;
	$: currentPageNumber = pages[currentPageIndex]?.pageNumber;
	$: currentSpread = Math.floor(currentPageIndex / 2) + 1;
	$: totalSpreads = Math.ceil(totalPages / 2);
</script>

<svelte:head>
	<title>Mushaf Utsmani - Santri Online</title>
</svelte:head>

<section class="max-w-6xl mx-auto py-10 space-y-6">
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
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
					<label class="form-control w-full sm:w-48">
						<div class="label">
							<span class="label-text">Pilih Juz</span>
						</div>
						<select class="select select-bordered w-full" bind:value={selectedJuz} on:change={handleJuzChange}>
							{#each JUZ_LIST as juz}
								<option value={juz}>Juz {juz}</option>
							{/each}
						</select>
					</label>
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
				</div>
				<div class="flex items-center gap-2">
					<button class="btn btn-primary" on:click={() => loadJuz(selectedJuzNumber)} disabled={loading}>
						{loading ? 'Memuat...' : 'Muat Juz'}
					</button>
					<button class="btn btn-ghost" on:click={() => (query = '')} disabled={!query}>
						Reset
					</button>
				</div>
			</div>

			{#if viewMode === 'teks'}
				<label class="form-control">
					<div class="label">
						<span class="label-text">Cari ayat (Arab)</span>
					</div>
					<input
						class="input input-bordered w-full"
						placeholder="Contoh: الرَّحْمَٰن"
						bind:value={query}
					/>
				</label>
			{/if}

			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class="badge badge-outline">Total ayat: {verses.length}</span>
				<span class="badge badge-outline">Halaman: {totalPages || '-'}</span>
				{#if viewMode === 'teks'}
					<span class="badge badge-outline">Terfilter: {filteredVerses.length}</span>
				{/if}
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
							{#if i === 0 || filteredVerses[i - 1].surahNumber !== verse.surahNumber}
								<div class="divider text-sm text-slate-500">{surahName(verse.surahNumber)}</div>
							{/if}
							<div class="rounded-xl border bg-base-100 p-3 md:p-4 shadow-sm">
								<div class="flex items-center justify-between text-xs text-base-content/60 mb-2">
									<span>Surah {surahName(verse.surahNumber)} • Ayat {verse.ayahNumber}</span>
									<span class="badge badge-outline">Hal {verse.page_number}</span>
								</div>
								<p class="quran-text text-right" dir="rtl">{verse.text}</p>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
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
	.quran-text {
		font-family: "Amiri Quran", "Noto Naskh Arabic", serif;
		font-size: 1.3rem;
		line-height: 2.2;
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
</style>
