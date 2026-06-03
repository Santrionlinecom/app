<script lang="ts">
	import type { PageData } from './$types';
	import {
		KITAB_CATEGORY_OPTIONS,
		KITAB_CATEGORY_ORDER,
		getKitabCategoryDescription,
		getKitabCategoryLabel,
		getKitabCategoryToneClass
	} from '$lib/data/kitab-categories';
	import { toKitabDownloadUrl } from '$lib/kitab';

	export let data: PageData;

	type KitabItem = PageData['items'][number];
	type CuratedItem = PageData['curatedItems'][number];
	type CuratedSection = {
		key: string;
		label: string;
		description: string;
		toneClass: string;
		items: CuratedItem[];
	};
	type CategoryFilter = 'all' | (typeof KITAB_CATEGORY_OPTIONS)[number]['value'];

	const formatDate = (value: number | null | undefined) =>
		value
			? new Date(value).toLocaleDateString('id-ID', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				})
			: '-';

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const shortText = (value: string | null | undefined, length = 170) => {
		const source = plainText(value);
		if (!source) return 'Deskripsi kitab akan tampil di sini setelah dilengkapi dari pusat konten.';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const sourceLabel: Record<KitabItem['sourceType'], string> = {
		pdf: 'PDF',
		drive: 'Google Drive'
	};
	const kitabCategoryLabel = (value?: string | null) => getKitabCategoryLabel(value);
	const kitabCategoryDescription = (value?: string | null) => getKitabCategoryDescription(value);
	const kitabCategoryTone = (value?: string | null) => getKitabCategoryToneClass(value);
	const sourceHref = (item: { sourceType: KitabItem['sourceType']; sourceUrl: string | null | undefined }) =>
		toKitabDownloadUrl(item.sourceType, item.sourceUrl) ?? item.sourceUrl ?? '';
	const categoryFilterLabel = (value: string) =>
		value === 'quran-tahsin' ? "Qur'an/Tajwid" : kitabCategoryLabel(value);
	const textValue = (value: unknown) => {
		if (Array.isArray(value)) return value.join(' ');
		if (typeof value === 'string' || typeof value === 'number') return String(value);
		return '';
	};
	const normalizeSearchText = (value: string | null | undefined) =>
		plainText(value)
			.toLowerCase()
			.replace(/['’`]/g, '')
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();
	const kitabSearchText = (item: KitabItem | CuratedItem) => {
		const record = item as Record<string, unknown>;
		return normalizeSearchText(
			[
				record.title,
				record.author,
				record.penulis,
				record.writer,
				record.category,
				kitabCategoryLabel(textValue(record.category)),
				record.madzhab,
				record.madhhab,
				record.level,
				record.tags,
				record.summary,
				record.description,
				record.seriesTitle,
				record.duration,
				record.sourceNote
			]
				.map(textValue)
				.filter(Boolean)
				.join(' ')
		);
	};
	const matchesKitab = (
		item: KitabItem | CuratedItem,
		queryTokens: string[],
		category: CategoryFilter
	) => {
		if (category !== 'all' && item.category !== category) return false;
		if (queryTokens.length === 0) return true;
		const searchable = kitabSearchText(item);
		return queryTokens.every((token) => searchable.includes(token));
	};
	const sortCuratedItems = (left: CuratedItem, right: CuratedItem) => left.seriesOrder - right.seriesOrder;

	let searchQuery = '';
	let selectedCategory: CategoryFilter = 'all';
	let allItems: KitabItem[] = [];
	let items: KitabItem[] = [];
	let featuredItems: KitabItem[] = [];
	let allCuratedItems: CuratedItem[] = [];
	let curatedItems: CuratedItem[] = [];
	let curatedSections: CuratedSection[] = [];
	let normalizedQuery = '';
	let queryTokens: string[] = [];
	let hasActiveFilters = false;
	let hasMatchingKitabs = false;

	$: allItems = Array.isArray(data.items) ? data.items : [];
	$: allCuratedItems = Array.isArray(data.curatedItems) ? data.curatedItems : [];
	$: normalizedQuery = normalizeSearchText(searchQuery);
	$: queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
	$: hasActiveFilters = queryTokens.length > 0 || selectedCategory !== 'all';
	$: items = allItems.filter((item) => matchesKitab(item, queryTokens, selectedCategory));
	$: featuredItems = items.filter((item) => item.featured);
	$: curatedItems = allCuratedItems.filter((item) => matchesKitab(item, queryTokens, selectedCategory));
	$: curatedSections = KITAB_CATEGORY_ORDER.map((category) => {
		const sectionItems = curatedItems
			.filter((item) => item.category === category)
			.sort(sortCuratedItems);

		return {
			key: category,
			label: kitabCategoryLabel(category),
			description: kitabCategoryDescription(category),
			toneClass: kitabCategoryTone(category),
			items: sectionItems
		};
	}).filter((section) => section.items.length > 0);
	$: hasMatchingKitabs = curatedItems.length + items.length > 0;

	const resetFilters = () => {
		searchQuery = '';
		selectedCategory = 'all';
	};
</script>

<svelte:head>
	<title>Perpustakaan Kitab - Santri Online</title>
	<meta
		name="description"
		content="Katalog kitab digital Santri Online yang dikelola dinamis."
	/>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a_0%,_#111827_42%,_#022c22_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="absolute -right-12 top-8 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-200/10 blur-3xl"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
			<div class="max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Perpustakaan Kitab</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">
					Halaman kitab sekarang tampil dinamis
				</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Halaman ini menampung dua jalur konten: kitab yang diterbitkan admin dan materi pilihan
					SantriOnline yang ditulis khusus agar lebih enak dipelajari langsung dari web.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="#koleksi-kitab" class="btn border-none bg-white text-slate-900 hover:bg-emerald-50">
						Lihat Koleksi
					</a>
					<a href="/kitab/quran" class="btn btn-outline border-white/20 text-white hover:border-white hover:bg-white/10">
						Buka Mushaf
					</a>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Kitab Live</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.totalItems}</p>
					<p class="mt-1 text-xs text-white/65">Semua kitab yang sudah dipublish.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Unggulan</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.featuredItems}</p>
					<p class="mt-1 text-xs text-white/65">Diprioritaskan dari pengaturan pilihan.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Sumber PDF</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.pdfItems}</p>
					<p class="mt-1 text-xs text-white/65">Diunggah ke penyimpanan Santri Online.</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Google Drive</p>
					<p class="mt-3 text-3xl font-semibold">{data.stats.driveItems}</p>
					<p class="mt-1 text-xs text-white/65">Terhubung langsung dari link Drive.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
		<article class="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
			<div class="grid h-full gap-0 md:grid-cols-[0.5fr_0.5fr]">
				<div class="bg-[linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_55%,_#ccfbf1_100%)] p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Koleksi Dinamis</p>
					<h2 class="mt-3 text-2xl font-semibold text-slate-900">Tambah kitab sekali, tampil otomatis di publik</h2>
					<p class="mt-3 text-sm leading-7 text-slate-600">
						Alur baru memudahkan pengelolaan kitab. Tim admin cukup upload PDF atau isi
						link Google Drive, lalu ubah status ke <strong>published</strong>.
					</p>
				</div>
				<div class="flex flex-col justify-between bg-slate-950 p-6 text-white">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-white/55">Yang Tampil di Halaman Ini</p>
						<p class="mt-3 text-sm leading-7 text-white/70">
							Cover kitab, ringkasan, sumber file, halaman detail, dan akses baca langsung.
						</p>
					</div>
					<div class="mt-6 flex flex-wrap gap-2">
						<a href="#koleksi-kitab" class="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
							Jelajahi Kitab
						</a>
						<a href="/kitab/quran" class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20">
							Mushaf Al-Qur'an
						</a>
					</div>
				</div>
			</div>
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Arah Baru</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Bukan halaman statis lagi</h2>
			<p class="mt-3 text-sm leading-7 text-slate-600">
				Koleksi kitab publik tetap mengikuti pengaturan konten, tetapi kami juga bisa menambahkan materi pilihan
				khusus untuk pembelajaran yang lebih terstruktur, seperti modul bahasa Arab pemula.
			</p>
			<div class="mt-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Sumber</p>
					<p class="mt-2 text-lg font-semibold text-slate-900">PDF atau Drive</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Status</p>
					<p class="mt-2 text-lg font-semibold text-slate-900">Draft dan Published</p>
				</div>
			</div>
		</article>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
		<div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
			<div>
				<label for="kitab-search" class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
					Cari Kitab
				</label>
				<input
					id="kitab-search"
					type="search"
					bind:value={searchQuery}
					placeholder="tajwid, aqidah, safinatun, bidayatul, bahasa arab, hadits"
					class="input input-bordered mt-2 w-full bg-slate-50"
				/>
			</div>

			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Filter Kategori</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<button
						type="button"
						class={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
							selectedCategory === 'all'
								? 'border-slate-900 bg-slate-900 text-white'
								: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
						}`}
						on:click={() => (selectedCategory = 'all')}
					>
						Semua
					</button>
					{#each KITAB_CATEGORY_OPTIONS as category}
						<button
							type="button"
							class={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
								selectedCategory === category.value
									? 'border-emerald-600 bg-emerald-600 text-white'
									: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
							}`}
							on:click={() => (selectedCategory = category.value)}
						>
							{categoryFilterLabel(category.value)}
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if hasActiveFilters}
			<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
				<p class="text-sm font-semibold text-slate-700">
					{hasMatchingKitabs ? 'Hasil pencarian ditampilkan di bawah.' : 'Belum ada kitab yang sesuai pencarian.'}
				</p>
				<button type="button" class="btn btn-outline btn-sm" on:click={resetFilters}>
					Reset
				</button>
			</div>
		{/if}
	</section>

	{#if hasActiveFilters && !hasMatchingKitabs}
		<section class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
			<p class="text-base font-semibold text-slate-900">Belum ada kitab yang sesuai pencarian.</p>
		</section>
	{:else}
	{#if curatedSections.length > 0}
		<section class="space-y-4">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">Kurikulum Fondasi</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Disusun per kategori pembelajaran</h2>
				</div>
				<p class="text-sm text-slate-500">
					Qur'an/Tahsin, Aqidah, Fiqih, Hadits, Adab/Tasawuf, dan Bahasa Arab tampil dalam urutan yang rapi.
				</p>
			</div>

			<div class="space-y-6">
				{#each curatedSections as section (section.key)}
					<section class="space-y-4">
						<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
							<div>
								<div class="flex flex-wrap items-center gap-2">
									<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${section.toneClass}`}>
										{section.label}
									</span>
									<span class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
										{section.items.length} kitab
									</span>
								</div>
								<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
									{section.description}
								</p>
							</div>
						</div>

						<div class="grid gap-5 xl:grid-cols-2">
							{#each section.items as item (item.slug)}
								<article class="overflow-hidden rounded-[1.75rem] border border-amber-100 bg-white shadow-sm">
									<div class="grid h-full gap-0 md:grid-cols-[0.44fr_0.56fr]">
										<div class="bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_34%),linear-gradient(145deg,_#111827_0%,_#1f2937_52%,_#14532d_100%)] p-6 text-white">
											<div class="flex flex-wrap items-center gap-2">
												<p class="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Jilid {item.seriesOrder}</p>
												<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${kitabCategoryTone(item.category)}`}>
													{kitabCategoryLabel(item.category)}
												</span>
											</div>
											<h3 class="mt-4 text-3xl font-semibold">{item.title}</h3>
											<p class="mt-3 text-sm leading-7 text-white/75">{item.summary}</p>
											<div class="mt-5 flex flex-wrap gap-2">
												{#each item.tags.slice(0, 3) as tag}
													<span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
														{tag}
													</span>
												{/each}
											</div>
										</div>

										<div class="p-6">
											<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Update {formatDate(item.updatedAt)}</p>
											<p class="mt-3 text-sm leading-7 text-slate-600">
												{shortText(item.description, 230)}
											</p>

											<div class="mt-5 grid gap-3 sm:grid-cols-3">
												<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
													<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Level</p>
													<p class="mt-2 text-base font-semibold text-slate-900">{item.level}</p>
												</div>
												<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
													<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Jalur</p>
													<p class="mt-2 text-base font-semibold text-slate-900">{item.duration}</p>
												</div>
												<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
													<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Posisi</p>
													<p class="mt-2 text-base font-semibold text-slate-900">Jilid {item.seriesOrder}</p>
												</div>
											</div>

											<div class="mt-5 flex flex-wrap gap-2">
												<a href={`/kitab/${item.slug}`} class="btn btn-primary">Buka Materi</a>
												<a href={sourceHref(item)} target="_blank" rel="noreferrer" class="btn btn-outline">
													PDF Asli
												</a>
											</div>
										</div>
									</div>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</section>
	{/if}

	{#if featuredItems.length > 0}
		<section class="space-y-4">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Pilihan Utama</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Kitab unggulan</h2>
				</div>
				<p class="text-sm text-slate-500">Dipilih langsung dari pengaturan kitab pilihan.</p>
			</div>

			<div class="grid gap-5 lg:grid-cols-2">
				{#each featuredItems as item (item.slug)}
					<article class="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
						<div class="grid h-full gap-0 md:grid-cols-[0.46fr_0.54fr]">
							<div class="bg-gradient-to-br from-emerald-50 via-white to-slate-100">
								{#if item.coverUrl}
									<img
										src={item.coverUrl}
										alt={`Cover ${item.title}`}
										class="h-full min-h-[240px] w-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div class="flex h-full min-h-[240px] items-center justify-center px-6 text-center text-sm text-slate-500">
										Cover kitab akan tampil di sini.
									</div>
								{/if}
							</div>
							<div class="p-6">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
										Unggulan
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
										{sourceLabel[item.sourceType]}
									</span>
									{#if item.category}
										<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${kitabCategoryTone(item.category)}`}>
											{kitabCategoryLabel(item.category)}
										</span>
									{/if}
								</div>
								<h3 class="mt-4 break-words text-2xl font-semibold leading-tight text-slate-900">{item.title}</h3>

								<p class="mt-2 break-words text-base leading-relaxed text-slate-600">
									{shortText(item.summary || item.description, 220)}
								</p>
								<p class="mt-5 text-xs uppercase tracking-[0.24em] text-slate-400">
									Diperbarui {formatDate(item.updatedAt)}
								</p>
								<div class="mt-5 flex flex-wrap gap-2">
									<a href={`/kitab/${item.slug}`} class="btn btn-primary">Buka Materi</a>
									<a href={sourceHref(item)} target="_blank" rel="noreferrer" class="btn btn-outline">
										PDF Asli
									</a>
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	{#if !hasActiveFilters || items.length > 0}
		<section id="koleksi-kitab" class="space-y-4">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Katalog Publik</p>
				<h2 class="mt-2 text-2xl font-semibold text-slate-900">Semua kitab yang sudah dipublish</h2>
			</div>
			<p class="text-sm text-slate-500">Daftar ini disusun otomatis dari data konten.</p>
		</div>

		{#if items.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
				<p class="text-base font-semibold text-slate-900">Belum ada kitab yang dipublikasikan.</p>
				<p class="mt-2 text-sm text-slate-500">
					Tambahkan kitab dari halaman pengelolaan konten, lalu ubah statusnya menjadi terbit.
				</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each items as item (item.slug)}
					<article class="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
						<div class="relative">
							{#if item.coverUrl}
								<img
									src={item.coverUrl}
									alt={`Cover ${item.title}`}
									class="h-60 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-60 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 px-6 text-center text-sm text-slate-500">
									Cover belum diunggah.
								</div>
							{/if}

							<div class="absolute left-4 top-4 flex flex-wrap gap-2">
								<span class="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
									{sourceLabel[item.sourceType]}
								</span>
								{#if item.category}
									<span class={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-sm ${kitabCategoryTone(item.category)}`}>
										{kitabCategoryLabel(item.category)}
									</span>
								{/if}
								{#if item.featured}
									<span class="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm">
										Unggulan
									</span>
								{/if}
							</div>
						</div>

						<div class="space-y-4 p-5">
							<div>
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Terakhir update {formatDate(item.updatedAt)}</p>
								<h3 class="mt-2 break-words text-xl font-semibold leading-tight text-slate-900">{item.title}</h3>

								<p class="mt-3 break-words text-base leading-relaxed text-slate-600">
									{shortText(item.summary || item.description)}
								</p>
							</div>

							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Akses</p>
								<p class="mt-2 text-base font-semibold text-slate-900">Baca detail kitab dan buka viewer langsung.</p>
							</div>

							<div class="flex gap-2">
								<a href={`/kitab/${item.slug}`} class="btn btn-primary flex-1">Buka Materi</a>
								<a href={sourceHref(item)} target="_blank" rel="noreferrer" class="btn btn-outline flex-1">
									PDF Asli
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
		</section>
	{/if}
	{/if}
</div>
