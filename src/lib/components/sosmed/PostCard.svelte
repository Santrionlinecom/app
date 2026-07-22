<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import type { Post } from '$lib/types/sosmed';
	import CommentList from './CommentList.svelte';
	import ReactionBar from './ReactionBar.svelte';
	import ReportModal from './ReportModal.svelte';
	import { avatarColor, formatRelativeTime, initials } from './utils';

	export let post: Post;
	export let currentUserId: string;

	const dispatch = createEventDispatcher<{ hidden: { id: string }; changed: { post: Post } }>();
	let menuOpen = false;
	let commentsOpen = false;
	let reportOpen = false;
	let commentList: { loadComments: () => Promise<void> } | null = null;
	let actionError = '';

	$: canDelete = post.user_id === currentUserId;

	const openComments = async () => {
		commentsOpen = !commentsOpen;
		if (commentsOpen) {
			await tick();
			await commentList?.loadComments();
		}
	};

	const deletePost = async () => {
		actionError = '';
		const response = await fetch(`/api/sosmed/posts/${post.id}`, { method: 'DELETE' });
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) {
			actionError = payload.error || 'Post gagal dihapus.';
			return;
		}
		dispatch('hidden', { id: post.id });
	};
</script>

<article class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] sm:p-5">
	<header class="flex items-start justify-between gap-3">
		<div class="flex min-w-0 items-start gap-3">
			{#if post.user_avatar_url}
				<img src={post.user_avatar_url} alt="" class="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-50" loading="lazy" />
			{:else}
				<div class={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white ring-2 ring-emerald-50 ${avatarColor(post.user_id)}`}>
					{initials(post.user_name)}
				</div>
			{/if}
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<p class="break-words font-bold text-slate-950">{post.user_name}</p>
					<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">{post.user_role}</span>
					<span class="text-sm text-slate-400">{formatRelativeTime(post.created_at)}</span>
				</div>
				<p class="mt-0.5 text-xs text-slate-500">Anggota ummah lembaga</p>
			</div>
		</div>

		<div class="relative">
			<button
				type="button"
				class="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
				aria-label="Menu post"
				on:click={() => (menuOpen = !menuOpen)}
			>
				...
			</button>
			{#if menuOpen}
				<div class="absolute right-0 top-10 z-10 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
					<button type="button" class="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" on:click={() => { reportOpen = true; menuOpen = false; }}>
						Laporkan
					</button>
					{#if canDelete}
						<button type="button" class="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50" on:click={deletePost}>
							Hapus
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</header>

	<p class="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-slate-800">{post.content}</p>

	{#if post.media_url}
		<img src={post.media_url} alt="Foto postingan" loading="lazy" class="mt-4 aspect-[4/3] w-full rounded-2xl object-cover" />
	{/if}

	<div class="mt-4 border-t border-slate-100 pt-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<ReactionBar
				postId={post.id}
				reactionCount={post.reaction_count}
				userReaction={post.user_reaction}
				on:changed={(event) => {
					post = { ...post, reaction_count: event.detail.reaction_count, user_reaction: event.detail.emoji };
					dispatch('changed', { post });
				}}
			/>
			<button type="button" class="text-sm font-semibold text-emerald-600" on:click={openComments}>
				{commentsOpen ? 'Tutup komentar' : `Lihat ${post.comment_count} komentar`}
			</button>
		</div>
	</div>

	{#if commentsOpen}
		<div class="mt-4 border-t border-slate-100 pt-4">
			<CommentList bind:this={commentList} postId={post.id} />
		</div>
	{/if}

	{#if actionError}
		<p class="mt-3 text-sm font-semibold text-rose-600">{actionError}</p>
	{/if}

	<ReportModal postId={post.id} bind:open={reportOpen} on:close={() => (reportOpen = false)} />
</article>
