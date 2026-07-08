<script lang="ts">
	import { enhance } from '$app/forms';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Edit3 from '@lucide/svelte/icons/edit-3';
	import Eye from '@lucide/svelte/icons/eye';
	import FilePenLine from '@lucide/svelte/icons/file-pen-line';
	import FileText from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Send from '@lucide/svelte/icons/send';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type CmsPost = {
		id: string;
		title: string;
		slug: string;
		content?: string;
		excerpt?: string | null;
		status: 'draft' | 'published';
		thumbnail_url?: string | null;
		seo_keyword?: string | null;
		meta_description?: string | null;
		source_name?: string | null;
		source_url?: string | null;
		is_auto_generated?: number | boolean | null;
		kategori?: string | null;
		tags?: string | null;
		scheduled_at?: number | null;
		created_at: number;
		updated_at: number;
	};

	type Pagination = {
		page: number;
		limit: number;
		totalCount: number;
	};

	let { data } = $props<{
		data: {
			posts?: CmsPost[];
			pagination?: Pagination;
			error?: string;
		};
	}>();

	let query = $state('');
	let statusFilter = $state<'all' | 'draft' | 'published'>('all');
	let sortMode = $state<'newest' | 'updated' | 'title'>('newest');

	const posts: CmsPost[] = $derived(data.posts || []);
	const pagination: Pagination = $derived(data.pagination || { page: 1, limit: posts.length || 10, totalCount: posts.length });
	const totalPages = $derived(Math.max(1, Math.ceil((pagination.totalCount || posts.length || 0) / (pagination.limit || 10))));
	const startItem = $derived((pagination.page - 1) * pagination.limit + (posts.length ? 1 : 0));
	const endItem = $derived((pagination.page - 1) * pagination.limit + posts.length);

	const publishedCount = $derived(posts.filter((post: CmsPost) => post.status === 'published').length);
	const draftCount = $derived(posts.filter((post: CmsPost) => post.status === 'draft').length);
	const aiCount = $derived(posts.filter((post: CmsPost) => Boolean(post.is_auto_generated)).length);
	const scheduledCount = $derived(
		posts.filter((post: CmsPost) => post.status === 'published' && post.scheduled_at && post.scheduled_at > Date.now()).length
	);

	const filtered = $derived(() => {
		const q = query.trim().toLowerCase();
		return posts
			.filter((post: CmsPost) => (statusFilter === 'all' ? true : post.status === statusFilter))
			.filter((post: CmsPost) => {
				if (!q) return true;
				return [post.title, post.slug, post.excerpt, post.kategori, post.seo_keyword, post.source_name]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(q));
			})
			.sort((a: CmsPost, b: CmsPost) => {
				if (sortMode === 'title') return a.title.localeCompare(b.title, 'id');
				if (sortMode === 'updated') return (b.updated_at || 0) - (a.updated_at || 0);
				return (b.created_at || 0) - (a.created_at || 0);
			});
	});

	const pageHref = (page: number) => {
		const params = new URLSearchParams();
		params.set('page', String(page));
		params.set('limit', String(pagination.limit || 10));
		return `/admin/posts?${params.toString()}`;
	};

	const formatDate = (timestamp?: number | null) => {
		if (!timestamp) return 'Belum ada tanggal';
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Jakarta'
		}).format(timestamp);
	};

	const formatShortDate = (timestamp?: number | null) => {
		if (!timestamp) return '-';
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			timeZone: 'Asia/Jakarta'
		}).format(timestamp);
	};

	const readingTime = (post: CmsPost) => {
		const source = `${post.content || ''} ${post.excerpt || ''}`.replace(/<[^>]*>/g, ' ');
		const words = source.trim().split(/\s+/).filter(Boolean).length;
		if (!words) return '0 menit';
		return `${Math.max(1, Math.ceil(words / 180))} menit`;
	};

	const safeTags = (value?: string | null) => {
		if (!value) return [] as string[];
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 3).map(String) : [];
		} catch (_) {
			return value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean)
				.slice(0, 3);
		}
	};

	const statusLabel = (post: CmsPost) => {
		if (post.status === 'published' && post.scheduled_at && post.scheduled_at > Date.now()) return 'Terjadwal';
		return post.status === 'published' ? 'Published' : 'Draft';
	};

	const statusClass = (post: CmsPost) => {
		if (post.status === 'published' && post.scheduled_at && post.scheduled_at > Date.now()) {
			return 'border-amber-200 bg-amber-50 text-amber-700';
		}
		return post.status === 'published'
			? 'border-emerald-200 bg-emerald-50 text-emerald-700'
			: 'border-slate-200 bg-slate-100 text-slate-600';
	};
</script>

<svelte:head>
	<title>Kelola Artikel CMS - SantriOnline</title>
</svelte:head>

<div class="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_32%),linear-gradient(180deg,#f8fafc,#eef7f1_45%,#f8fafc)] px-4 py-6 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-7xl space-y-6">
		<section class="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-emerald-950/15 sm:px-7 lg:px-8">
			<div class="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"></div>
			<div class="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl"></div>
			<div class="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
				<div>
					<div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">
						<Sparkles class="h-3.5 w-3.5" /> CMS Dakwah
					</div>
					<h1 class="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Kelola artikel SantriOnline dengan lebih cepat dan rapi</h1>
					<p class="mt-3 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
						Dashboard admin yang dirapikan untuk memantau draft, artikel publish, konten AI/news fetcher, SEO, dan jadwal publikasi dalam satu layar.
					</p>
				</div>
				<div class="flex flex-wrap gap-2 lg:justify-end">
					<a href="/blog" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/90 transition hover:border-white/40 hover:bg-white/20">
						<Eye class="h-4 w-4" /> Lihat Blog
					</a>
					<a href="/admin/posts/new" class="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300">
						<Plus class="h-4 w-4" /> Buat Artikel
					</a>
				</div>
			</div>
		</section>

		{#if data.error}
			<div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
				{data.error}
			</div>
		{/if}

		<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Total Halaman Ini</p>
					<FileText class="h-5 w-5 text-slate-400" />
				</div>
				<strong class="mt-3 block text-3xl font-black text-slate-950">{posts.length}</strong>
				<p class="mt-1 text-xs leading-5 text-slate-500">Menampilkan {startItem}-{endItem} dari {pagination.totalCount} artikel.</p>
			</div>
			<div class="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Published</p>
					<Send class="h-5 w-5 text-emerald-500" />
				</div>
				<strong class="mt-3 block text-3xl font-black text-emerald-700">{publishedCount}</strong>
				<p class="mt-1 text-xs leading-5 text-slate-500">Artikel aktif pada halaman data saat ini.</p>
			</div>
			<div class="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-black uppercase tracking-[0.22em] text-amber-600">Draft</p>
					<FilePenLine class="h-5 w-5 text-amber-500" />
				</div>
				<strong class="mt-3 block text-3xl font-black text-amber-700">{draftCount}</strong>
				<p class="mt-1 text-xs leading-5 text-slate-500">Butuh review judul, isi, SEO, atau gambar.</p>
			</div>
			<div class="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-black uppercase tracking-[0.22em] text-sky-600">AI / Terjadwal</p>
					<Sparkles class="h-5 w-5 text-sky-500" />
				</div>
				<strong class="mt-3 block text-3xl font-black text-sky-700">{aiCount}<span class="text-slate-300">/</span>{scheduledCount}</strong>
				<p class="mt-1 text-xs leading-5 text-slate-500">Pantau output news fetcher dan publikasi terjadwal.</p>
			</div>
		</section>

		<section class="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-5">
			<div class="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
				<label class="relative block">
					<span class="sr-only">Cari artikel</span>
					<Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						class="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
						placeholder="Cari judul, slug, kategori, sumber, atau keyword SEO..."
						bind:value={query}
					/>
				</label>
				<select class="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" bind:value={statusFilter} aria-label="Filter status">
					<option value="all">Semua status</option>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
				</select>
				<select class="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" bind:value={sortMode} aria-label="Urutkan artikel">
					<option value="newest">Terbaru dibuat</option>
					<option value="updated">Terbaru diubah</option>
					<option value="title">Judul A-Z</option>
				</select>
			</div>
			<div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
				<p>{filtered().length} artikel cocok di halaman ini.</p>
				<p>Tip: gunakan halaman edit untuk AI assist, thumbnail, audio, dan SEO detail.</p>
			</div>
		</section>

		{#if filtered().length === 0}
			<section class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
				<div class="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700">
					<Search class="h-7 w-7" />
				</div>
				<h2 class="mt-4 text-xl font-black text-slate-900">Belum ada artikel yang cocok</h2>
				<p class="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">Coba ubah kata kunci/filter, atau buat artikel baru untuk konten dakwah SantriOnline.</p>
				<a href="/admin/posts/new" class="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">
					<Plus class="h-4 w-4" /> Buat Artikel Baru
				</a>
			</section>
		{:else}
			<section class="grid gap-4 xl:grid-cols-[1fr_24rem]">
				<div class="space-y-3">
					{#each filtered() as post}
						<article class="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5">
							<div class="grid gap-0 md:grid-cols-[13rem_1fr]">
								<a href={`/admin/posts/${post.id}/edit`} class="relative block min-h-44 overflow-hidden bg-slate-100 md:min-h-full" aria-label={`Edit ${post.title}`}>
									{#if post.thumbnail_url}
										<img src={post.thumbnail_url} alt={post.title} class="h-full min-h-44 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
									{:else}
										<div class="grid h-full min-h-44 place-items-center bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 text-emerald-700">
											<ImageIcon class="h-9 w-9" />
										</div>
									{/if}
									<div class="absolute left-3 top-3 flex flex-wrap gap-2">
										<span class={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] backdrop-blur ${statusClass(post)}`}>{statusLabel(post)}</span>
										{#if post.is_auto_generated}
											<span class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">AI</span>
										{/if}
									</div>
								</a>

								<div class="flex min-w-0 flex-col p-4 sm:p-5">
									<div class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
										<span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{post.kategori || 'umum'}</span>
										<span>•</span>
										<span>{readingTime(post)}</span>
										<span>•</span>
										<span>{formatShortDate(post.created_at)}</span>
									</div>

									<a href={`/admin/posts/${post.id}/edit`} class="mt-3 line-clamp-2 text-xl font-black leading-tight text-slate-950 transition hover:text-emerald-700">
										{post.title}
									</a>
									<p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{post.excerpt || post.meta_description || 'Belum ada ringkasan. Tambahkan excerpt agar admin dan pembaca mudah memahami isi artikel.'}</p>

									<div class="mt-3 flex flex-wrap gap-2">
										{#each safeTags(post.tags) as tag}
											<span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">#{tag}</span>
										{/each}
										{#if post.seo_keyword}
											<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">SEO: {post.seo_keyword}</span>
										{/if}
									</div>

									<div class="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
										<p class="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
											<CalendarClock class="h-4 w-4 text-slate-400" /> Update: {formatDate(post.updated_at)}
										</p>
										{#if post.source_name || post.source_url}
											<a href={post.source_url || undefined} target="_blank" rel="noreferrer" class="truncate rounded-2xl bg-slate-50 px-3 py-2 font-semibold text-slate-600 hover:text-emerald-700">
												Sumber: {post.source_name || post.source_url}
											</a>
										{:else}
											<p class="rounded-2xl bg-slate-50 px-3 py-2">Manual / internal SantriOnline</p>
										{/if}
									</div>

									<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
										<a href={`/admin/posts/${post.id}/edit`} class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
											<Edit3 class="h-4 w-4" /> Edit
										</a>
										<a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
											<Eye class="h-4 w-4" /> Preview
										</a>
										<form method="POST" action="?/toggle" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<input type="hidden" name="next" value={post.status === 'published' ? 'draft' : 'published'} />
											<button type="submit" class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 ${post.status === 'published' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}>
												{post.status === 'published' ? 'Jadikan Draft' : 'Publish'}
											</button>
										</form>
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<button
												type="submit"
												class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
												onclick={(event) => {
													if (!confirm(`Hapus artikel: ${post.title}?`)) event.preventDefault();
												}}
											>
												<Trash2 class="h-4 w-4" /> Hapus
											</button>
										</form>
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>

				<aside class="space-y-4">
					<div class="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
						<p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Checklist Admin</p>
						<h2 class="mt-2 text-lg font-black text-slate-950">Sebelum Publish</h2>
						<div class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
							<p class="rounded-2xl bg-emerald-50 p-3">Pastikan judul jelas, tidak clickbait, dan menjaga adab dakwah.</p>
							<p class="rounded-2xl bg-slate-50 p-3">Isi ringkasan, meta description, focus keyword, thumbnail, dan kategori.</p>
							<p class="rounded-2xl bg-amber-50 p-3">Untuk artikel news fetcher, cek ulang sumber dan hindari klaim faktual yang tidak ada di sumber.</p>
						</div>
					</div>

					<div class="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
						<p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Aksi Cepat</p>
						<div class="mt-4 grid gap-2">
							<a href="/admin/posts/new" class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100">+ Artikel manual / AI assist</a>
							<a href="/admin/super/cms-hub" class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/15">CMS Hub</a>
							<a href="/admin/tools/scraper" class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/15">Tools Scraper</a>
						</div>
					</div>
				</aside>
			</section>
		{/if}

		{#if totalPages > 1}
			<nav class="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm shadow-sm" aria-label="Navigasi halaman artikel">
				<p class="font-semibold text-slate-500">Halaman {pagination.page} dari {totalPages}</p>
				<div class="flex flex-wrap gap-2">
					<a class={`rounded-full px-4 py-2 font-black transition ${pagination.page <= 1 ? 'pointer-events-none bg-slate-100 text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'}`} href={pageHref(Math.max(1, pagination.page - 1))}>Sebelumnya</a>
					<a class={`rounded-full px-4 py-2 font-black transition ${pagination.page >= totalPages ? 'pointer-events-none bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-emerald-700'}`} href={pageHref(Math.min(totalPages, pagination.page + 1))}>Berikutnya</a>
				</div>
			</nav>
		{/if}
	</div>
</div>
