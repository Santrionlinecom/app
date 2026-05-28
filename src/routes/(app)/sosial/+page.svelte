<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Heart, MessageCircle, RefreshCw, Send, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type SocialPost = {
		id: string;
		user_id: string;
		author_name: string;
		author_avatar: string | null;
		lembaga_id: string | null;
		content: string;
		image_url: string | null;
		visibility: 'public' | 'lembaga';
		created_at: string;
		like_count: number;
		comment_count: number;
		liked_by_me: boolean;
	};

	type SocialComment = {
		id: string;
		post_id: string;
		user_id: string;
		author_name: string;
		author_avatar: string | null;
		content: string;
		created_at: string;
	};

	let posts: SocialPost[] = [];
	let content = '';
	let visibility: 'public' | 'lembaga' = 'lembaga';
	let isLoading = true;
	let isPosting = false;
	let feedError = '';
	let composerError = '';
	let eventSource: EventSource | null = null;
	let openComments: Record<string, boolean> = {};
	let commentsByPost: Record<string, SocialComment[]> = {};
	let commentInputs: Record<string, string> = {};
	let loadingComments: Record<string, boolean> = {};
	let submittingComments: Record<string, boolean> = {};
	let deletingPosts: Record<string, boolean> = {};

	$: currentUser = data.user;
	$: displayName = currentUser?.username || currentUser?.email || 'Mas Yogik';
	$: composerPlaceholder = `Apa yang ingin ${displayName} bagikan hari ini?`;
	$: remainingCharacters = 1000 - content.length;
	$: latestCreatedAt = posts[0]?.created_at ?? '';

	const formatTime = (value: string) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString('id-ID', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || 'SO';

	const mergePosts = (incoming: SocialPost[]) => {
		const map = new Map(posts.map((post) => [post.id, post]));
		for (const post of incoming) {
			map.set(post.id, post);
		}
		posts = [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
	};

	const loadPosts = async () => {
		isLoading = true;
		feedError = '';
		try {
			const response = await fetch('/api/social/posts');
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal memuat feed sosial');
			posts = payload.posts ?? [];
		} catch (err) {
			feedError = err instanceof Error ? err.message : 'Gagal memuat feed sosial';
		} finally {
			isLoading = false;
		}
	};

	const openStream = () => {
		if (eventSource) eventSource.close();
		const query = latestCreatedAt ? `?after=${encodeURIComponent(latestCreatedAt)}` : '';
		eventSource = new EventSource(`/api/social/stream${query}`);
		eventSource.onmessage = (event) => {
			try {
				const payload = JSON.parse(event.data);
				if (payload.type === 'new_posts' && Array.isArray(payload.posts)) {
					mergePosts(payload.posts);
				}
			} catch {
				// Ignore malformed SSE payloads.
			}
		};
		eventSource.onerror = () => {
			eventSource?.close();
			eventSource = null;
			setTimeout(openStream, 5000);
		};
	};

	const submitPost = async () => {
		const trimmed = content.trim();
		composerError = '';
		if (!trimmed) {
			composerError = 'Tuliskan isi postingan terlebih dahulu.';
			return;
		}
		if (trimmed.length > 1000) {
			composerError = 'Postingan maksimal 1000 karakter.';
			return;
		}

		isPosting = true;
		try {
			const response = await fetch('/api/social/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: trimmed, visibility })
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal membuat postingan');
			if (payload.post) mergePosts([payload.post]);
			content = '';
			visibility = 'lembaga';
		} catch (err) {
			composerError = err instanceof Error ? err.message : 'Gagal membuat postingan';
		} finally {
			isPosting = false;
		}
	};

	const toggleLike = async (post: SocialPost) => {
		const previous = { liked: post.liked_by_me, count: post.like_count };
		post.liked_by_me = !post.liked_by_me;
		post.like_count += post.liked_by_me ? 1 : -1;
		posts = posts;

		try {
			const response = await fetch(`/api/social/posts/${post.id}/like`, { method: 'POST' });
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal memperbarui like');
			post.liked_by_me = Boolean(payload.liked);
			post.like_count = Number(payload.like_count ?? post.like_count);
			posts = posts;
		} catch {
			post.liked_by_me = previous.liked;
			post.like_count = previous.count;
			posts = posts;
		}
	};

	const toggleComments = async (post: SocialPost) => {
		openComments[post.id] = !openComments[post.id];
		openComments = openComments;
		if (openComments[post.id] && !commentsByPost[post.id]) {
			await loadComments(post.id);
		}
	};

	const loadComments = async (postId: string) => {
		loadingComments[postId] = true;
		loadingComments = loadingComments;
		try {
			const response = await fetch(`/api/social/posts/${postId}/comments`);
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal memuat komentar');
			commentsByPost[postId] = payload.comments ?? [];
			commentsByPost = commentsByPost;
		} finally {
			loadingComments[postId] = false;
			loadingComments = loadingComments;
		}
	};

	const submitComment = async (post: SocialPost) => {
		const trimmed = (commentInputs[post.id] ?? '').trim();
		if (!trimmed || trimmed.length > 500) return;

		submittingComments[post.id] = true;
		submittingComments = submittingComments;
		try {
			const response = await fetch(`/api/social/posts/${post.id}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: trimmed })
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal mengirim komentar');
			commentsByPost[post.id] = [...(commentsByPost[post.id] ?? []), payload.comment];
			commentsByPost = commentsByPost;
			commentInputs[post.id] = '';
			commentInputs = commentInputs;
			post.comment_count += 1;
			posts = posts;
		} finally {
			submittingComments[post.id] = false;
			submittingComments = submittingComments;
		}
	};

	const deletePost = async (post: SocialPost) => {
		if (!confirm('Hapus postingan ini?')) return;
		deletingPosts[post.id] = true;
		deletingPosts = deletingPosts;
		try {
			const response = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Gagal menghapus postingan');
			posts = posts.filter((item) => item.id !== post.id);
		} finally {
			deletingPosts[post.id] = false;
			deletingPosts = deletingPosts;
		}
	};

	onMount(async () => {
		await loadPosts();
		openStream();
	});

	onDestroy(() => {
		eventSource?.close();
	});
</script>

<svelte:head>
	<title>Sosial - SantriOnline</title>
	<meta
		name="description"
		content="Feed sosial internal SantriOnline untuk berbagi status dan manfaat antar pengguna."
	/>
</svelte:head>

<section class="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white px-4 py-5 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-3xl space-y-4 pb-16">
		<header class="flex items-center justify-between gap-4">
			<div>
				<p class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">SantriOnline</p>
				<h1 class="mt-1 text-2xl font-extrabold text-[#1B4332] sm:text-3xl">Sosial</h1>
			</div>
			<button
				type="button"
				class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-300"
				aria-label="Muat ulang feed"
				on:click={loadPosts}
			>
				<RefreshCw class="h-4 w-4" />
			</button>
		</header>

		<form
			class="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5"
			on:submit|preventDefault={submitPost}
		>
			<label for="social-content" class="sr-only">Buat postingan</label>
			<textarea
				id="social-content"
				bind:value={content}
				maxlength="1000"
				rows="4"
				class="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
				placeholder={composerPlaceholder}
			></textarea>

			<div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-2">
					<button
						type="button"
						class={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
							visibility === 'lembaga'
								? 'bg-emerald-100 text-emerald-800'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
						on:click={() => (visibility = 'lembaga')}
					>
						Lembaga
					</button>
					<button
						type="button"
						class={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
							visibility === 'public'
								? 'bg-emerald-100 text-emerald-800'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
						on:click={() => (visibility = 'public')}
					>
						Public
					</button>
				</div>

				<div class="flex items-center justify-between gap-3 sm:justify-end">
					<span class={`text-xs font-semibold ${remainingCharacters < 50 ? 'text-amber-600' : 'text-slate-500'}`}>
						{content.length}/1000
					</span>
					<button
						type="submit"
						disabled={isPosting || !content.trim() || content.length > 1000}
						class="inline-flex items-center justify-center gap-2 rounded-full bg-[#1B7F4C] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#146B3F] disabled:cursor-not-allowed disabled:bg-slate-300"
					>
						<Send class="h-4 w-4" />
						{isPosting ? 'Memposting...' : 'Posting'}
					</button>
				</div>
			</div>

			{#if composerError}
				<p class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
					{composerError}
				</p>
			{/if}
		</form>

		{#if feedError}
			<p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
				{feedError}
			</p>
		{/if}

		{#if isLoading}
			<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-sm">
				Memuat feed sosial...
			</div>
		{:else if posts.length === 0}
			<div class="rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
				<p class="text-sm font-bold text-[#1B4332]">
					Tidak ada postingan dulu. Jadilah yang pertama berbagi manfaat hari ini.
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each posts as post (post.id)}
					<article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
						<div class="flex items-start gap-3">
							<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">
								{initials(post.author_name)}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-extrabold text-slate-900">{post.author_name}</p>
										<p class="mt-0.5 text-xs font-medium text-slate-500">
											{formatTime(post.created_at)} · {post.visibility === 'public' ? 'Public' : 'Lembaga'}
										</p>
									</div>
									{#if post.user_id === currentUser?.id}
										<button
											type="button"
											class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
											aria-label="Hapus postingan"
											disabled={deletingPosts[post.id]}
											on:click={() => deletePost(post)}
										>
											<Trash2 class="h-4 w-4" />
										</button>
									{/if}
								</div>
								<p class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">
									{post.content}
								</p>
							</div>
						</div>

						<div class="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
							<button
								type="button"
								class={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition ${
									post.liked_by_me
										? 'bg-emerald-100 text-emerald-800'
										: 'text-slate-600 hover:bg-slate-100'
								}`}
								on:click={() => toggleLike(post)}
							>
								<Heart class={`h-4 w-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
								{post.like_count}
							</button>
							<button
								type="button"
								class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
								on:click={() => toggleComments(post)}
							>
								<MessageCircle class="h-4 w-4" />
								{post.comment_count}
							</button>
						</div>

						{#if openComments[post.id]}
							<div class="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
								{#if loadingComments[post.id]}
									<p class="text-sm font-semibold text-slate-500">Memuat komentar...</p>
								{:else if (commentsByPost[post.id] ?? []).length === 0}
									<p class="text-sm font-semibold text-slate-500">Belum ada komentar.</p>
								{:else}
									{#each commentsByPost[post.id] ?? [] as comment (comment.id)}
										<div class="flex gap-2">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-emerald-800">
												{initials(comment.author_name)}
											</div>
											<div class="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2">
												<p class="text-xs font-extrabold text-slate-800">{comment.author_name}</p>
												<p class="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
													{comment.content}
												</p>
											</div>
										</div>
									{/each}
								{/if}

								<form class="flex items-end gap-2" on:submit|preventDefault={() => submitComment(post)}>
									<label for={`comment-${post.id}`} class="sr-only">Komentar</label>
									<textarea
										id={`comment-${post.id}`}
										bind:value={commentInputs[post.id]}
										maxlength="500"
										rows="1"
										class="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
										placeholder="Tulis komentar..."
									></textarea>
									<button
										type="submit"
										disabled={submittingComments[post.id] || !(commentInputs[post.id] ?? '').trim()}
										class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1B7F4C] text-white transition hover:bg-[#146B3F] disabled:bg-slate-300"
										aria-label="Kirim komentar"
									>
										<Send class="h-4 w-4" />
									</button>
								</form>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>
