<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import type { AppNavigationItem } from '$lib/config/app-navigation';

	/** Menu yang sudah difilter server sesuai role & lembaga user. */
	export let items: AppNavigationItem[] = [];
	export let open = false;

	type Scored = { item: AppNavigationItem; score: number };

	let query = '';
	let activeIndex = 0;
	let inputEl: HTMLInputElement | null = null;
	let listEl: HTMLDivElement | null = null;

	/**
	 * Sinonim bahasa sehari-hari → istilah menu.
	 * Tujuannya: pengurus lembaga yang lupa nama fitur tetap ketemu,
	 * misal ketik "uang masuk" harus mengarah ke Kas/Keuangan.
	 */
	const SYNONYMS: Record<string, string[]> = {
		keuangan: ['uang', 'kas', 'duit', 'infaq', 'sedekah', 'donasi', 'saldo', 'kwitansi', 'iuran', 'spp', 'masuk', 'keluar', 'pemasukan', 'pengeluaran', 'laporan'],
		kas: ['uang', 'keuangan', 'duit', 'infaq', 'sedekah', 'masuk', 'keluar', 'pemasukan', 'pengeluaran', 'saldo', 'donasi', 'iuran'],
		santri: ['murid', 'siswa', 'anak', 'peserta', 'didik'],
		jamaah: ['warga', 'anggota', 'umat'],
		setoran: ['hafalan', 'ngaji', 'tahfidz', 'muroja', 'sorogan', 'hafal'],
		hafalan: ['tahfidz', 'setoran', 'quran', 'juz', 'muroja', 'hafal'],
		rapor: ['nilai', 'raport', 'hasil', 'evaluasi', 'lapor'],
		sertifikat: ['piagam', 'ijazah', 'penghargaan'],
		jadwal: ['kalender', 'agenda', 'imam', 'khotib', 'piket', 'shift'],
		kalender: ['jadwal', 'agenda', 'tanggal'],
		role: ['hak', 'akses', 'izin', 'jabatan', 'pengurus', 'admin', 'permission'],
		lembaga: ['instansi', 'organisasi', 'yayasan', 'sekolah', 'profil'],
		aset: ['barang', 'inventaris', 'harta', 'properti'],
		sosial: ['posting', 'feed', 'timeline', 'status', 'sosmed'],
		pengumuman: ['info', 'broadcast', 'woro', 'kabar'],
		kitab: ['buku', 'pustaka', 'baca', 'quran', 'alquran', 'referensi'],
		buku: ['kitab', 'baca', 'novel', 'ebook', 'bacaan'],
		kursus: ['kelas', 'belajar', 'training', 'pelatihan', 'materi'],
		belajar: ['kursus', 'materi', 'modul', 'pelajaran'],
		habit: ['misi', 'kebiasaan', 'target', 'challenge', 'tantangan'],
		coin: ['koin', 'saldo', 'topup', 'isi', 'poin'],
		desain: ['template', 'cetak', 'banner', 'spanduk', 'poster'],
		akun: ['profil', 'setting', 'setelan', 'password', 'sandi', 'keamanan'],
		addon: ['fitur', 'tambahan', 'aktivasi', 'upgrade'],
		license: ['lisensi', 'lisensi', 'aktivasi', 'produk', 'key'],
		qurban: ['kurban', 'hewan', 'sapi', 'kambing', 'idul'],
		ujian: ['tes', 'test', 'evaluasi', 'imtihan'],
		asrama: ['kamar', 'kobong', 'pondokan'],
		diniyah: ['madin', 'madrasah', 'kelas'],
		dashboard: ['beranda', 'home', 'utama', 'ringkasan'],
		store: ['toko', 'belanja', 'produk', 'jual'],
		studio: ['tulis', 'nulis', 'karya', 'penulis']
	};

	const normalize = (value: string) =>
		value
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	/**
	 * Kata kunci per item: label + deskripsi + href + sinonim.
	 * Pencocokan WAJIB per kata utuh — kalau pakai substring, "aplikasi"
	 * ikut cocok dengan kunci "kas" sehingga Digital Store muncul saat
	 * user mencari "uang masuk".
	 */
	const keywordsFor = (item: AppNavigationItem): Set<string> => {
		const base = normalize(
			[item.label, item.description ?? '', item.href.replace(/[/-]/g, ' ')].join(' ')
		);
		const tokens = new Set(base.split(' ').filter(Boolean));
		for (const [key, list] of Object.entries(SYNONYMS)) {
			if (tokens.has(key)) {
				for (const word of list) tokens.add(word);
			}
		}
		return tokens;
	};

	/** Cocok bila sama persis, atau token diawali kata yang diketik (min. 3 huruf). */
	const tokensMatch = (tokens: Set<string>, word: string) => {
		if (tokens.has(word)) return true;
		if (word.length < 3) return false;
		for (const token of tokens) {
			if (token.startsWith(word)) return true;
		}
		return false;
	};

	/** Subsequence match — "ksm" tetap ketemu "Kas Masjid". */
	const subsequenceScore = (haystack: string, needle: string) => {
		let hi = 0;
		for (const char of needle) {
			const found = haystack.indexOf(char, hi);
			if (found === -1) return 0;
			hi = found + 1;
		}
		return 1;
	};

	const scoreItem = (item: AppNavigationItem, rawQuery: string): number => {
		const q = normalize(rawQuery);
		if (!q) return 1;

		const label = normalize(item.label);
		const tokens = keywordsFor(item);

		if (label === q) return 1000;
		if (label.startsWith(q)) return 900;
		if (label.includes(q)) return 800;

		// Semua kata harus ada (mis. "uang masuk" → Kas Masjid)
		const words = q.split(' ').filter(Boolean);
		const matched = words.filter((word) => tokensMatch(tokens, word)).length;
		if (words.length && matched === words.length) return 600 + words.length * 10;
		if (matched > 0) return 300 + matched * 10;

		// Terakhir: singkatan / typo ringan
		if (q.length >= 2 && subsequenceScore(label.replace(/\s/g, ''), q.replace(/\s/g, ''))) {
			return 200;
		}
		return 0;
	};

	$: results = (() => {
		const scored: Scored[] = [];
		const seen = new Set<string>();
		for (const item of items) {
			const key = `${item.href}::${item.label}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const score = scoreItem(item, query);
			if (score > 0) scored.push({ item, score });
		}
		return scored
			.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
			.slice(0, 12)
			.map((entry) => entry.item);
	})();

	$: if (query || open) activeIndex = 0;

	const close = () => {
		open = false;
		query = '';
		activeIndex = 0;
	};

	const select = async (item: AppNavigationItem | undefined) => {
		if (!item) return;
		close();
		await goto(item.href);
	};

	const onKeydown = (event: KeyboardEvent) => {
		const isPaletteKey = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
		if (isPaletteKey) {
			event.preventDefault();
			open = !open;
			return;
		}
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = results.length ? (activeIndex + 1) % results.length : 0;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = results.length ? (activeIndex - 1 + results.length) % results.length : 0;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			void select(results[activeIndex]);
		}
	};

	// Fokus otomatis saat dibuka, dan kunci scroll latar.
	$: if (open && inputEl) {
		queueMicrotask(() => inputEl?.focus());
	}

	onMount(() => {
		const handler = (event: KeyboardEvent) => onKeydown(event);
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});

	$: if (typeof document !== 'undefined') {
		document.body.style.overflow = open ? 'hidden' : '';
	}

	$: if (listEl && open) {
		const active = listEl.querySelector<HTMLElement>('[data-active="true"]');
		active?.scrollIntoView({ block: 'nearest' });
	}
</script>

{#if open}
	<!-- Lapisan gelap: klik di luar panel menutup palette -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/45 px-4 pt-[12vh] backdrop-blur-sm"
		role="presentation"
		on:click={close}
		on:keydown={(event) => {
			if (event.key === 'Escape') close();
		}}
	>
		<div
			class="w-full max-w-xl overflow-hidden rounded-2xl border border-so-border bg-white shadow-2xl"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-label="Cari fitur"
			on:click|stopPropagation
			on:keydown|stopPropagation={(event) => {
				if (event.key === 'Escape') close();
			}}
		>
			<div class="flex items-center gap-3 border-b border-so-border px-4 py-3">
				<svg
					class="h-5 w-5 shrink-0 text-slate-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					class="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
					placeholder="Cari fitur... (misal: uang masuk, hafalan, jadwal imam)"
					aria-label="Cari fitur"
					autocomplete="off"
					spellcheck="false"
				/>
				<kbd class="hidden shrink-0 rounded border border-so-border px-1.5 py-0.5 text-[11px] text-slate-500 sm:block">
					Esc
				</kbd>
			</div>

			<div bind:this={listEl} class="max-h-[52vh] overflow-y-auto p-2">
				{#if results.length === 0}
					<p class="px-3 py-8 text-center text-sm text-slate-500">
						Tidak ada fitur cocok dengan “{query}”.
					</p>
				{:else}
					{#each results as item, index (item.href + item.label)}
						<button
							type="button"
							data-active={index === activeIndex}
							class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition
								{index === activeIndex ? 'bg-so-primary/10' : 'hover:bg-slate-50'}"
							on:mouseenter={() => (activeIndex = index)}
							on:click={() => select(item)}
						>
							<span
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-so-primary/10 text-so-primary"
							>
								<svg
									class="h-4.5 w-4.5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d={item.icon} />
								</svg>
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium text-slate-900">{item.label}</span>
								{#if item.description}
									<span class="block truncate text-xs text-slate-500">{item.description}</span>
								{:else}
									<span class="block truncate text-xs text-slate-400">{item.href}</span>
								{/if}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			<div
				class="flex items-center justify-between border-t border-so-border bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500"
			>
				<span>↑↓ pilih · Enter buka</span>
				<span>{results.length} fitur</span>
			</div>
		</div>
	</div>
{/if}
