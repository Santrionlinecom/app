<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: items = Array.isArray(data.items) ? data.items : [];
	$: page = Number(data.page ?? 1);
	$: limit = Number(data.limit ?? 10);
	$: totalCount = Number(data.totalCount ?? items.length);
	$: totalPages = Math.max(1, Math.ceil(totalCount / (limit || 1)));
	$: prevPage = Math.max(1, page - 1);
	$: nextPage = Math.min(totalPages, page + 1);

	const formatDateTime = (ts: number | null | undefined) => {
		if (!ts) return '';
		return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
	};
</script>

<div class="space-y-8">
	<section class="rounded-3xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
		<p class="text-xs uppercase tracking-[0.35em] text-white/60">Santri Online</p>
		<h1 class="mt-2 text-3xl font-bold md:text-4xl">Blog &amp; Inspirasi</h1>
		<p class="mt-2 text-sm text-white/80 max-w-2xl">
			Kumpulan artikel, kisah, dan pembahasan seputar pesantren, masjid, dan kehidupan santri.
		</p>
	</section>

	<section>
		{#if items.length === 0}
			<div class="rounded-2xl border bg-white p-6 text-sm text-slate-500">
				Belum ada artikel yang dipublikasikan.
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2">
				{#each items as post}
					<article class="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
						<a href={`/blog/${post.slug}`} class="block">
							{#if post.thumbnail_url}
								<img
									src={post.thumbnail_url}
									alt={`Thumbnail ${post.title}`}
									class="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
									loading="lazy"
								/>
							{:else}
								<div class="h-48 w-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200"></div>
							{/if}
						</a>
						<div class="p-5">
							<p class="text-xs uppercase tracking-[0.25em] text-slate-400">Artikel</p>
							<h2 class="mt-2 text-lg font-semibold text-slate-900">
								<a href={`/blog/${post.slug}`} class="transition hover:text-emerald-600">
									{post.title}
								</a>
							</h2>
							<p class="mt-1 text-xs text-slate-500">
								{formatDateTime(post.scheduled_at ?? post.created_at)}
							</p>
							{#if post.excerpt}
								<p class="mt-3 text-sm text-slate-600">{post.excerpt}</p>
							{/if}
							<div class="mt-4 flex items-center justify-end">
								<a href={`/blog/${post.slug}`} class="btn btn-sm btn-ghost">Baca selengkapnya</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<div class="flex flex-col items-center gap-2">
		<div class="join">
			<a
				class="btn btn-sm join-item"
				class:btn-disabled={page <= 1}
				href={`?page=${prevPage}`}
				aria-disabled={page <= 1}
				tabindex={page <= 1 ? -1 : 0}
			>
				Prev
			</a>
			<a
				class="btn btn-sm join-item"
				class:btn-disabled={page >= totalPages}
				href={`?page=${nextPage}`}
				aria-disabled={page >= totalPages}
				tabindex={page >= totalPages ? -1 : 0}
			>
				Next
			</a>
		</div>
		<p class="text-sm text-base-content/70">Halaman {page} dari {totalPages}</p>
	</div>
</div>
