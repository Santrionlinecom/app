<script lang="ts">
	export let currentSlug = '';
	export let category = '';
	export let relatedPosts: Array<{ title: string; slug: string; thumbnail?: string | null }> = [];

	const popularPages = [
		{ title: 'Buku dan Kitab Digital', url: '/buku', icon: 'BK' },
		{ title: 'Belajar Al-Quran', url: '/kitab/quran', icon: 'AQ' },
		{ title: 'Perpustakaan Kitab', url: '/kitab', icon: 'KT' },
		{ title: 'Tokoh Islam', url: '/tokoh', icon: 'TK' },
		{ title: 'Dinasti Islam', url: '/dinasti', icon: 'DN' },
		{ title: 'Ormas Islam', url: '/ormas', icon: 'OR' },
		{ title: 'Fitur SantriOnline', url: '/fitur', icon: 'FT' }
	];

	$: visibleRelatedPosts = relatedPosts.filter((post) => post.slug !== currentSlug).slice(0, 5);
</script>

<aside class="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-label="Internal link">
	{#if visibleRelatedPosts.length > 0}
		<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
				{category || 'Artikel Terkait'}
			</p>
			<h2 class="mt-2 text-lg font-semibold text-slate-950">Bacaan lanjutan</h2>
			<ul class="mt-4 space-y-3">
				{#each visibleRelatedPosts as post}
					<li>
						<a href={`/blog/${post.slug}`} rel="related" class="block font-semibold leading-6 text-slate-700 hover:text-emerald-600">
							{post.title}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="rounded-lg border border-slate-200 bg-slate-50 p-5">
		<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Jelajahi SantriOnline</p>
		<div class="mt-4 grid gap-2">
			{#each popularPages as page}
				<a href={page.url} class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600">
					<span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[11px] font-bold text-emerald-600">
						{page.icon}
					</span>
					<span>{page.title}</span>
				</a>
			{/each}
		</div>
	</section>
</aside>
