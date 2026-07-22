<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Post } from '$lib/types/sosmed';
	import PostCard from '$lib/components/sosmed/PostCard.svelte';
	import PostComposer from '$lib/components/sosmed/PostComposer.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import DailyStreakWidget from '$lib/components/Dashboard/DailyStreakWidget.svelte';

	export let data;

	let posts: Post[] = data.posts ?? [];
	let cursor: string | null = data.next_cursor ?? null;
	let isLoadingMore = false;
	let loadError = '';
	let eventSource: EventSource | null = null;
	let isInitialLoad = false;

	const leftNav = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			desc: 'Ringkasan lembaga',
			icon: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z'
		},
		{
			label: 'Misi Habit',
			href: '/habit',
			desc: '3 misi harian',
			icon: 'M5 12l5 5L20 7'
		},
		{
			label: 'Belajar',
			href: '/belajar',
			desc: 'Ilmu & materi',
			icon: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M8 15h6'
		},
		{
			label: 'Akun',
			href: '/akun',
			desc: 'Profil & keamanan',
			icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z'
		}
	];

	const adabTips = [
		'Bagikan manfaat, bukan aib orang lain.',
		'Apresiasi teman tanpa merendahkan.',
		'Uzur dan kekurangan ibadah bersifat privat.',
		'Tulis seolah dibaca ustadz dan orang tua.'
	];

	const contentPillars = [
		{ label: 'Amal', note: 'habit & kebaikan (opt-in)' },
		{ label: 'Ilmu', note: 'hafalan, sirah, fiqih praktis' },
		{ label: 'Adab', note: 'ukhuwah & adab digital' },
		{ label: 'Skill', note: 'karya & kompetensi halal' }
	];

	const upsertPost = (post: Post) => {
		if (posts.some((item) => item.id === post.id)) return;
		posts = [post, ...posts];
	};

	const updatePost = (post: Post) => {
		posts = posts.map((item) => (item.id === post.id ? post : item));
	};

	const hidePost = (id: string) => {
		posts = posts.filter((post) => post.id !== id);
	};

	const loadMore = async () => {
		if (!cursor || isLoadingMore) return;
		isLoadingMore = true;
		loadError = '';
		try {
			const response = await fetch(`/api/sosmed/posts?cursor=${encodeURIComponent(cursor)}`);
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Feed gagal dimuat.');
			const incoming = (payload.posts ?? []) as Post[];
			const existingIds = new Set(posts.map((post) => post.id));
			posts = [...posts, ...incoming.filter((post) => !existingIds.has(post.id))];
			cursor = payload.next_cursor ?? null;
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Feed gagal dimuat.';
		} finally {
			isLoadingMore = false;
		}
	};

	onMount(() => {
		const latest = posts.reduce((max, post) => Math.max(max, post.created_at), 0);
		eventSource = new EventSource(`/api/sosmed/stream?after=${latest}`);
		eventSource.addEventListener('new_post', (event) => {
			const payload = JSON.parse((event as MessageEvent).data);
			if (payload?.post) upsertPost(payload.post);
		});
		eventSource.addEventListener('new_reaction', (event) => {
			const payload = JSON.parse((event as MessageEvent).data);
			posts = posts.map((post) =>
				post.id === payload.post_id ? { ...post, reaction_count: payload.reaction_count } : post
			);
		});
		eventSource.addEventListener('new_comment', (event) => {
			const payload = JSON.parse((event as MessageEvent).data);
			posts = posts.map((post) =>
				post.id === payload.post_id ? { ...post, comment_count: post.comment_count + 1 } : post
			);
		});
		eventSource.addEventListener('post_hidden', (event) => {
			const payload = JSON.parse((event as MessageEvent).data);
			if (payload?.post_id) hidePost(payload.post_id);
		});
	});

	onDestroy(() => {
		eventSource?.close();
	});
</script>

<svelte:head>
	<title>Sosial · {data.org?.name ?? 'SantriOnline'}</title>
</svelte:head>

<div class="mx-auto w-full max-w-[1400px] min-w-0">
	<!-- Hero -->
	<header
		class="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-700 via-teal-700 to-so-green p-5 text-white shadow-sm sm:p-6"
	>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="min-w-0">
				<p class="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100/90">
					Komunitas · Sosial Ala Santri
				</p>
				<h1 class="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
					Ummah {data.org?.name ?? 'Lembaga'}
				</h1>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/95">
					Ruang ukhuwah internal lembaga: berbagi amal, ilmu, adab, dan skill — dengan adab digital.
					Bukan media sosial bebas; postingan hanya terlihat anggota lembaga yang sama.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each contentPillars as pillar}
					<span
						class="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
						title={pillar.note}
					>
						{pillar.label}
					</span>
				{/each}
			</div>
		</div>
	</header>

	<!-- 3-col desktop / 1-col mobile -->
	<div class="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
		<!-- Left rail -->
		<aside class="hidden space-y-4 xl:block">
			<section class="rounded-2xl border border-so-border/80 bg-white p-4 shadow-sm">
				<p class="text-[11px] font-bold uppercase tracking-[0.16em] text-so-muted">Pintasan</p>
				<nav class="mt-3 grid gap-1.5">
					{#each leftNav as item}
						<a
							href={item.href}
							class="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
						>
							<span
								class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm"
							>
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.9"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d={item.icon} />
								</svg>
							</span>
							<span class="min-w-0">
								<span class="block truncate">{item.label}</span>
								<span class="mt-0.5 block text-xs font-medium text-slate-500">{item.desc}</span>
							</span>
						</a>
					{/each}
				</nav>
			</section>

			<section class="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
				<p class="text-sm font-bold text-emerald-900">Kenapa beda dari FB?</p>
				<ul class="mt-2 space-y-2 text-xs leading-5 text-emerald-900/85">
					<li>· Feed tertutup lembaga</li>
					<li>· Tanpa ranking ketakwaan</li>
					<li>· Fokus manfaat, bukan viral</li>
					<li>· Moderasi ustadz/admin</li>
				</ul>
			</section>
		</aside>

		<!-- Center feed -->
		<section class="min-w-0 space-y-4">
			<!-- Mobile-only quick links -->
			<div class="flex gap-2 overflow-x-auto pb-1 xl:hidden">
				{#each leftNav as item}
					<a
						href={item.href}
						class="shrink-0 rounded-full border border-so-border bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
					>
						{item.label}
					</a>
				{/each}
			</div>

			<PostComposer
				currentUser={data.currentUser}
				on:created={(event) => upsertPost(event.detail.post)}
			/>

			{#if isInitialLoad}
				<div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
					<LoadingState message="Memuat feed sosial..." />
				</div>
			{:else if posts.length === 0}
				<section class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
					<EmptyState
						icon="🤝"
						title="Belum ada jejak ukhuwah"
						description="Jadilah yang pertama berbagi manfaat: ilmu, adab, habit (opsional), atau karya skill — dengan adab."
					/>
				</section>
			{:else}
				<div class="space-y-4">
					{#each posts as post (post.id)}
						<PostCard
							{post}
							currentUserId={data.currentUser.id}
							on:hidden={(event) => hidePost(event.detail.id)}
							on:changed={(event) => updatePost(event.detail.post)}
						/>
					{/each}
				</div>
			{/if}

			{#if loadError}
				<div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
					<ErrorState
						title="Gagal memuat feed"
						message={loadError}
						onRetry={loadMore}
						compact={true}
					/>
				</div>
			{/if}

			{#if cursor}
				{#if isLoadingMore}
					<div class="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
						<LoadingState message="Memuat postingan..." compact={true} />
					</div>
				{:else}
					<div class="flex justify-center">
						<button
							type="button"
							class="min-h-[44px] rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-95"
							on:click={loadMore}
						>
							Muat lebih banyak
						</button>
					</div>
				{/if}
			{/if}
		</section>

		<!-- Right rail -->
		<aside class="space-y-4">
			<section class="rounded-2xl border border-so-border/80 bg-white p-4 shadow-sm">
				<p class="text-[11px] font-bold uppercase tracking-[0.16em] text-so-muted">Lembaga</p>
				<p class="mt-2 text-base font-bold text-so-ink">{data.org?.name ?? 'Lembaga Anda'}</p>
				<p class="mt-1 text-sm capitalize text-so-muted">
					{(data.org?.type ?? 'lembaga').replace('-', ' ')} · feed internal
				</p>
				<div class="mt-4 grid gap-2">
					<a
						href="/dashboard"
						class="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
					>
						Buka dashboard
					</a>
					<a
						href="/habit"
						class="rounded-xl border border-so-border bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
					>
						Isi misi habit
					</a>
				</div>
			</section>

			<section class="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
				<p class="text-sm font-bold text-amber-950">Adab digital</p>
				<ul class="mt-2 space-y-2 text-xs leading-5 text-amber-950/85">
					{#each adabTips as tip}
						<li class="flex gap-2">
							<span class="mt-0.5 text-amber-700">•</span>
							<span>{tip}</span>
						</li>
					{/each}
				</ul>
			</section>

			<div class="rounded-2xl border border-so-border/80 bg-white p-1 shadow-sm">
				<DailyStreakWidget {data} />
			</div>

			<!-- Mobile: compact “why different” -->
			<section class="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm xl:hidden">
				<p class="text-sm font-bold text-emerald-900">Sosial Ala Santri</p>
				<p class="mt-1 text-xs leading-5 text-emerald-900/85">
					Hangat seperti komunitas, profesional seperti jejak karya — tanpa viral kosong dan tanpa
					pamer aib.
				</p>
			</section>
		</aside>
	</div>
</div>
