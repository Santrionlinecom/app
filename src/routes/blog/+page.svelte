<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type BlogPost = PageData['items'][number];

	let sliderEl: HTMLDivElement | null = null;
	let isDragging = false;
	let dragStartX = 0;
	let dragStartScrollLeft = 0;
	let scrollFrame = 0;

	$: items = Array.isArray(data.items) ? data.items : [];
	$: page = Number(data.page ?? 1);
	$: limit = Number(data.limit ?? 10);
	$: totalCount = Number(data.totalCount ?? items.length);
	$: totalPages = Math.max(1, Math.ceil(totalCount / (limit || 1)));
	$: prevPage = Math.max(1, page - 1);
	$: nextPage = Math.min(totalPages, page + 1);
	$: featured = items[0] ?? null;
	$: topStories = items.slice(0, Math.min(items.length, 8));
	$: sliderItems = topStories.length ? [...topStories, ...topStories, ...topStories] : [];

	onMount(() => {
		const timer = window.setTimeout(centerSlider, 0);
		return () => {
			window.clearTimeout(timer);
			if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
		};
	});

	const formatDateTime = (ts: number | null | undefined) => {
		if (!ts) return '';
		return new Date(ts).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const stripHtml = (value: string | null | undefined) =>
		(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

	const shortText = (value: string | null | undefined, length = 150) => {
		const source = stripHtml(value);
		if (!source) return '';
		return source.length > length ? `${source.slice(0, length).trim()}...` : source;
	};

	const postDate = (post: BlogPost) => formatDateTime(post.scheduled_at ?? post.created_at);

	const postSummary = (post: BlogPost, length = 150) =>
		shortText(post.excerpt || post.meta_description || post.content, length);

	const postCategory = (post: BlogPost) => {
		const raw = (post.kategori || post.seo_keyword || 'Berita').toString().trim();
		if (!raw) return 'Berita';
		return raw
			.split(/[-_\s]+/)
			.filter(Boolean)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};

	const categoryClass = (post: BlogPost) => {
		const category = (post.kategori || '').toString().toLowerCase();
		if (category.includes('palestina')) return 'border-rose-200 bg-rose-50 text-rose-700';
		if (category.includes('nasional')) return 'border-sky-200 bg-sky-50 text-sky-700';
		if (category.includes('dakwah')) return 'border-emerald-200 bg-emerald-50 text-emerald-600';
		if (category.includes('teknologi')) return 'border-violet-200 bg-violet-50 text-violet-700';
		return 'border-slate-200 bg-slate-50 text-slate-700';
	};

	const centerSlider = () => {
		if (!sliderEl || !topStories.length) return;
		sliderEl.scrollLeft = sliderEl.scrollWidth / 3;
	};

	const keepSliderLooped = () => {
		if (!sliderEl || !topStories.length) return;
		if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
		scrollFrame = window.requestAnimationFrame(() => {
			if (!sliderEl) return;
			const laneWidth = sliderEl.scrollWidth / 3;
			if (laneWidth <= 0) return;

			if (sliderEl.scrollLeft < laneWidth * 0.35) {
				sliderEl.scrollLeft += laneWidth;
			} else if (sliderEl.scrollLeft > laneWidth * 1.65) {
				sliderEl.scrollLeft -= laneWidth;
			}
			scrollFrame = 0;
		});
	};

	const startDrag = (event: PointerEvent) => {
		if (!sliderEl) return;
		isDragging = true;
		dragStartX = event.clientX;
		dragStartScrollLeft = sliderEl.scrollLeft;
		sliderEl.setPointerCapture(event.pointerId);
	};

	const moveDrag = (event: PointerEvent) => {
		if (!isDragging || !sliderEl) return;
		event.preventDefault();
		sliderEl.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
	};

	const endDrag = (event: PointerEvent) => {
		if (!sliderEl) return;
		isDragging = false;
		if (sliderEl.hasPointerCapture(event.pointerId)) {
			sliderEl.releasePointerCapture(event.pointerId);
		}
		keepSliderLooped();
	};
</script>

<svelte:head>
	<title>Berita Islam dan Artikel Santri - Santri Online</title>
	<meta
		name="description"
		content="Berita Islam, artikel dakwah, dan kabar pesantren terbaru dari Santri Online."
	/>
</svelte:head>

<div class="bg-slate-50">
	<div class="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-8">
		<section class="border-b border-slate-200 pb-4">
			<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm font-semibold text-emerald-600">Santri Online News</p>
					<h1 class="mt-1 text-2xl font-bold text-slate-950 md:text-4xl">Berita Islam Terkini</h1>
				</div>
				<div class="flex items-center gap-3 text-sm text-slate-500">
					<span>{formatDateTime(Date.now())}</span>
					<span class="hidden h-1.5 w-1.5 rounded-full bg-emerald-500 sm:inline-block"></span>
					<span class="hidden sm:inline">Indonesia</span>
				</div>
			</div>
		</section>

		{#if items.length === 0}
			<section class="py-10">
				<div class="border border-slate-200 bg-white p-6 text-sm text-slate-500">
					Belum ada artikel yang dipublikasikan.
				</div>
			</section>
		{:else}
			{#if sliderItems.length}
				<section class="pt-4">
					<div
						bind:this={sliderEl}
						class="news-slider flex touch-pan-x snap-x gap-3 overflow-x-auto scroll-smooth pb-2"
						class:is-dragging={isDragging}
						role="list"
						aria-label="Berita pilihan"
						onscroll={keepSliderLooped}
						onpointerdown={startDrag}
						onpointermove={moveDrag}
						onpointerup={endDrag}
						onpointercancel={endDrag}
						onpointerleave={endDrag}
					>
						{#each sliderItems as post, index (`${post.id}-${index}`)}
							<a
								href={`/blog/${post.slug}`}
								class="group relative h-48 w-[78vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-lg bg-slate-900 shadow-sm sm:h-56 sm:w-[360px]"
								draggable="false"
							>
								{#if post.thumbnail_url}
									<img
										src={post.thumbnail_url}
										alt={`Thumbnail ${post.title}`}
										class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
										loading={index < topStories.length ? 'eager' : 'lazy'}
										draggable="false"
									/>
								{:else}
									<div class="h-full w-full bg-gradient-to-br from-slate-800 via-emerald-900 to-slate-950"></div>
								{/if}
								<div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent"></div>
								<div class="absolute inset-x-0 bottom-0 p-4 text-white">
									<span class={`inline-flex border px-2 py-1 text-[11px] font-semibold ${categoryClass(post)}`}>
										{postCategory(post)}
									</span>
									<h2 class="clamp-2 mt-2 text-base font-bold leading-tight sm:text-lg">{post.title}</h2>
									<p class="mt-2 text-xs text-white/75">{postDate(post)}</p>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<section class="py-5">
				<div class="grid grid-cols-2 gap-3 lg:hidden">
					{#each items.slice(0, 4) as post}
						<article class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
							<a href={`/blog/${post.slug}`} class="block">
								<div class="aspect-[4/3] overflow-hidden bg-slate-200">
									{#if post.thumbnail_url}
										<img
											src={post.thumbnail_url}
											alt={`Thumbnail ${post.title}`}
											class="h-full w-full object-cover transition duration-300 hover:scale-105"
											loading="lazy"
										/>
									{:else}
										<div class="h-full w-full bg-gradient-to-br from-slate-100 via-sky-50 to-emerald-50"></div>
									{/if}
								</div>
							</a>
							<div class="p-3">
								<span class={`inline-flex border px-2 py-0.5 text-[10px] font-semibold ${categoryClass(post)}`}>
									{postCategory(post)}
								</span>
								<h3 class="clamp-3 mt-2 text-sm font-bold leading-snug text-slate-950">
									<a href={`/blog/${post.slug}`} class="hover:text-emerald-600">{post.title}</a>
								</h3>
								<p class="mt-2 text-[11px] text-slate-500">{postDate(post)}</p>
							</div>
						</article>
					{/each}
				</div>

				<div class="hidden gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
					{#if featured}
						<article class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
							<a href={`/blog/${featured.slug}`} class="block">
								<div class="aspect-[16/9] overflow-hidden bg-slate-200">
									{#if featured.thumbnail_url}
										<img
											src={featured.thumbnail_url}
											alt={`Thumbnail ${featured.title}`}
											class="h-full w-full object-cover transition duration-300 hover:scale-105"
											loading="eager"
										/>
									{:else}
										<div class="h-full w-full bg-gradient-to-br from-slate-100 via-emerald-50 to-sky-100"></div>
									{/if}
								</div>
							</a>
							<div class="p-5">
								<span class={`inline-flex border px-2 py-1 text-[11px] font-semibold ${categoryClass(featured)}`}>
									{postCategory(featured)}
								</span>
								<h2 class="mt-3 break-words text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
									<a href={`/blog/${featured.slug}`} class="hover:text-emerald-600">{featured.title}</a>
								</h2>
								<p class="mt-3 text-sm leading-6 text-slate-600">{postSummary(featured, 220)}</p>
								<div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
									<span>{featured.source_name || 'Redaksi Santri Online'}</span>
									<span>{postDate(featured)}</span>
								</div>
							</div>
						</article>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						{#each items.slice(1, 5) as post}
							<article class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
								<a href={`/blog/${post.slug}`} class="block">
									<div class="aspect-[4/3] overflow-hidden bg-slate-200">
										{#if post.thumbnail_url}
											<img
												src={post.thumbnail_url}
												alt={`Thumbnail ${post.title}`}
												class="h-full w-full object-cover transition duration-300 hover:scale-105"
												loading="lazy"
											/>
										{:else}
											<div class="h-full w-full bg-gradient-to-br from-slate-100 via-sky-50 to-emerald-50"></div>
										{/if}
									</div>
								</a>
								<div class="p-3">
									<span class={`inline-flex border px-2 py-0.5 text-[10px] font-semibold ${categoryClass(post)}`}>
										{postCategory(post)}
									</span>
									<h3 class="clamp-3 mt-2 text-base font-bold leading-snug text-slate-950">
										<a href={`/blog/${post.slug}`} class="hover:text-emerald-600">{post.title}</a>
									</h3>
									<p class="mt-2 text-[11px] text-slate-500">{postDate(post)}</p>
								</div>
							</article>
						{/each}
					</div>
				</div>
			</section>

			<section class="border-t border-slate-200 py-5">
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-lg font-bold text-slate-950">Berita Terbaru</h2>
					<p class="text-xs text-slate-500">{totalCount} artikel</p>
				</div>

				<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
					{#each items as post}
						<article class="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
							<a href={`/blog/${post.slug}`} class="block">
								<div class="aspect-[4/3] overflow-hidden bg-slate-200">
									{#if post.thumbnail_url}
										<img
											src={post.thumbnail_url}
											alt={`Thumbnail ${post.title}`}
											class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
											loading="lazy"
										/>
									{:else}
										<div class="h-full w-full bg-gradient-to-br from-slate-100 via-emerald-50 to-sky-100"></div>
									{/if}
								</div>
							</a>
							<div class="p-3 sm:p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span class={`inline-flex border px-2 py-0.5 text-[10px] font-semibold ${categoryClass(post)}`}>
										{postCategory(post)}
									</span>
									<span class="text-[11px] text-slate-400">{postDate(post)}</span>
								</div>
								<h3 class="clamp-3 mt-2 break-words text-base font-bold leading-snug text-slate-950 sm:text-lg">
									<a href={`/blog/${post.slug}`} class="hover:text-emerald-600">{post.title}</a>
								</h3>
								<p class="clamp-2 mt-2 hidden text-sm leading-6 text-slate-600 sm:block">
									{postSummary(post, 120)}
								</p>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}

		{#if totalPages > 1}
			<nav class="flex flex-col items-center gap-3 border-t border-slate-200 py-6" aria-label="Navigasi halaman blog">
				<div class="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
					<a
						class="px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:text-slate-300"
						href={`?page=${prevPage}`}
						aria-disabled={page <= 1}
						tabindex={page <= 1 ? -1 : 0}
					>
						Sebelumnya
					</a>
					<div class="border-l border-r border-slate-200 px-4 py-2 text-sm text-slate-500">
						{page} / {totalPages}
					</div>
					<a
						class="px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:text-slate-300"
						href={`?page=${nextPage}`}
						aria-disabled={page >= totalPages}
						tabindex={page >= totalPages ? -1 : 0}
					>
						Berikutnya
					</a>
				</div>
			</nav>
		{/if}
	</div>
</div>

<style>
	.news-slider {
		scrollbar-width: none;
		cursor: grab;
		-webkit-overflow-scrolling: touch;
	}

	.news-slider::-webkit-scrollbar {
		display: none;
	}

	.news-slider.is-dragging {
		cursor: grabbing;
		scroll-behavior: auto;
	}

	.clamp-2,
	.clamp-3 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.clamp-2 {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.clamp-3 {
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
</style>
