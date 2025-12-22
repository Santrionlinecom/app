<script lang="ts">
	import { onMount } from 'svelte';
	import { SURAH_DATA } from '$lib/surah-data';

	type Verse = {
		verse_key: string;
		text: string;
		surahNumber: number;
		ayahNumber: number;
	};

	const JUZ_LIST = Array.from({ length: 30 }, (_v, idx) => idx + 1);
	const STORAGE_KEY = 'quran.juz.selected';
	const CACHE_KEY = 'quran.juz.cached';

	let activeTab: 'mushaf' | 'sejarah' = 'mushaf';
	let selectedJuz = '1';
	let selectedJuzNumber = 1;
	let verses: Verse[] = [];
	let loading = false;
	let error = '';
	let query = '';
	let cachedJuz: number[] = [];
	let offline = false;

	const surahLookup = new Map(SURAH_DATA.map((surah) => [surah.number, surah.name]));
	const padJuz = (value: number) => String(value).padStart(2, '0');
	const surahName = (surahNumber: number) => surahLookup.get(surahNumber) ?? `Surah ${surahNumber}`;

	const stripArabicMarks = (value: string) =>
		value
			.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
			.replace(/\u0640/g, '')
			.replace(/\s+/g, ' ')
			.trim();

	const markCached = (juz: number) => {
		if (!cachedJuz.includes(juz)) {
			cachedJuz = [...cachedJuz, juz].sort((a, b) => a - b);
			localStorage.setItem(CACHE_KEY, JSON.stringify(cachedJuz));
		}
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
			verses = (data.verses ?? []).map((verse: { verse_key: string; text: string }) => {
				const [surahNumber, ayahNumber] = verse.verse_key.split(':').map(Number);
				return {
					...verse,
					surahNumber,
					ayahNumber
				};
			});
			markCached(juz);
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

		void loadJuz(selectedJuzNumber);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	$: selectedJuzNumber = Number(selectedJuz) || 1;
	$: normalizedQuery = stripArabicMarks(query);
	$: filteredVerses = normalizedQuery
		? verses.filter((verse) => stripArabicMarks(verse.text).includes(normalizedQuery))
		: verses;
</script>

<svelte:head>
	<title>Mushaf Utsmani - Santri Online</title>
</svelte:head>

<section class="max-w-5xl mx-auto py-10 space-y-6">
	<header class="space-y-3 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Mushaf Utsmani</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">Baca Al-Qur'an 30 Juz</h1>
		<p class="text-slate-600">
			Pilih juz yang ingin dibaca. Data akan tersimpan otomatis untuk akses offline setelah pernah dibuka.
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
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end">
				<label class="form-control w-full lg:w-48">
					<div class="label">
						<span class="label-text">Pilih Juz</span>
					</div>
					<select class="select select-bordered w-full" bind:value={selectedJuz} on:change={handleJuzChange}>
						{#each JUZ_LIST as juz}
							<option value={juz}>Juz {juz}</option>
						{/each}
					</select>
				</label>
				<label class="form-control flex-1">
					<div class="label">
						<span class="label-text">Cari ayat (Arab)</span>
					</div>
					<input
						class="input input-bordered w-full"
						placeholder="Contoh: الرَّحْمَٰن"
						bind:value={query}
					/>
				</label>
				<div class="flex items-center gap-2">
					<button class="btn btn-primary" on:click={() => loadJuz(selectedJuzNumber)} disabled={loading}>
						{loading ? 'Memuat...' : 'Muat Juz'}
					</button>
					<button class="btn btn-ghost" on:click={() => (query = '')} disabled={!query}>
						Reset
					</button>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class="badge badge-outline">Total ayat: {verses.length}</span>
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
				<div class="space-y-4">
					{#each filteredVerses as verse, i}
						{#if i === 0 || filteredVerses[i - 1].surahNumber !== verse.surahNumber}
							<div class="divider text-sm text-slate-500">{surahName(verse.surahNumber)}</div>
						{/if}
						<div class="rounded-xl border bg-base-100 p-3 md:p-4 shadow-sm">
							<div class="flex items-center justify-between text-xs text-base-content/60 mb-2">
								<span>Surah {surahName(verse.surahNumber)} • Ayat {verse.ayahNumber}</span>
								<span class="badge badge-outline">{verse.verse_key}</span>
							</div>
							<p class="quran-text text-right" dir="rtl">{verse.text}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		<p class="text-xs text-slate-500 text-center">
			Catatan: Setelah juz dibuka sekali, data akan tersimpan otomatis dan bisa diakses tanpa internet.
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
		font-size: 1.4rem;
		line-height: 2.4;
	}

	@media (min-width: 768px) {
		.quran-text {
			font-size: 1.6rem;
		}
	}
</style>
