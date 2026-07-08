<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Post } from '$lib/types/sosmed';
	import PostCard from '$lib/components/sosmed/PostCard.svelte';
	import PostComposer from '$lib/components/sosmed/PostComposer.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';

	export let data;

	let posts: Post[] = data.posts ?? [];
	let cursor: string | null = data.next_cursor ?? null;
	let isLoadingMore = false;
	let loadError = '';
	let eventSource: EventSource | null = null;
	let isInitialLoad = false;

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
	<title>Beranda Sosial SantriOnline</title>
</svelte:head>

<div class="mx-auto w-full max-w-full min-w-0 px-4 sm:max-w-3xl sm:px-6 lg:px-8">
<div class="space-y-5">
	<header class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Beranda</p>
		<h1 class="mt-2 text-2xl font-bold sm:text-3xl">Sosial {data.org?.name ?? 'Lembaga'}</h1>
		<p class="mt-2 text-sm leading-6 text-emerald-50">
			Feed internal tertutup untuk anggota lembaga. Postingan hanya terlihat oleh anggota lembaga yang sama.
		</p>
	</header>

	<PostComposer currentUser={data.currentUser} on:created={(event) => upsertPost(event.detail.post)} />

	{#if isInitialLoad}
		<div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<LoadingState message="Memuat feed sosial..." />
		</div>
	{:else if posts.length === 0}
		<section class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<EmptyState
				icon="✨"
				title="Belum ada postingan"
				description="Jadilah yang pertama berbagi manfaat, inspirasi, atau kabar baik hari ini untuk anggota lembaga."
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
					class="min-h-[44px] rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-50 active:scale-95"
					on:click={loadMore}
				>
					Muat lebih banyak
				</button>
			</div>
		{/if}
	{/if}
</div>
</div>
