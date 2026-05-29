<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Post } from '$lib/types/sosmed';
	import PostCard from '$lib/components/sosmed/PostCard.svelte';
	import PostComposer from '$lib/components/sosmed/PostComposer.svelte';

	export let data;

	let posts: Post[] = data.posts ?? [];
	let cursor: string | null = data.next_cursor ?? null;
	let isLoadingMore = false;
	let loadError = '';
	let eventSource: EventSource | null = null;

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

<div class="mx-auto max-w-3xl space-y-5">
	<header class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-700 to-teal-700 p-5 text-white shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Beranda</p>
		<h1 class="mt-2 text-2xl font-bold sm:text-3xl">Sosial {data.org?.name ?? 'Lembaga'}</h1>
		<p class="mt-2 text-sm leading-6 text-emerald-50">
			Feed internal tertutup untuk anggota lembaga. Postingan hanya terlihat oleh anggota lembaga yang sama.
		</p>
	</header>

	<PostComposer currentUser={data.currentUser} on:created={(event) => upsertPost(event.detail.post)} />

	{#if posts.length === 0}
		<section class="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center shadow-sm">
			<p class="text-lg font-bold text-slate-900">Belum ada postingan.</p>
			<p class="mt-2 text-sm leading-6 text-slate-500">Jadilah yang pertama berbagi manfaat hari ini.</p>
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
		<p class="text-center text-sm font-semibold text-rose-600">{loadError}</p>
	{/if}

	{#if cursor}
		<div class="flex justify-center">
			<button
				type="button"
				class="rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
				disabled={isLoadingMore}
				on:click={loadMore}
			>
				{isLoadingMore ? 'Memuat...' : 'Muat lebih banyak'}
			</button>
		</div>
	{/if}
</div>
