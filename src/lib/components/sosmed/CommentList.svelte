<script lang="ts">
	import type { Comment } from '$lib/types/sosmed';
	import { avatarColor, formatRelativeTime, initials } from './utils';

	export let postId: string;
	export let comments: Comment[] = [];

	let content = '';
	let isLoading = false;
	let isSubmitting = false;
	let loaded = false;
	let errorMessage = '';

	export const loadComments = async () => {
		if (loaded || isLoading) return;
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/sosmed/posts/${postId}/comment`);
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Komentar gagal dimuat.');
			comments = payload.comments ?? [];
			loaded = true;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Komentar gagal dimuat.';
		} finally {
			isLoading = false;
		}
	};

	const submit = async () => {
		if (!content.trim() || content.length > 200 || isSubmitting) return;
		isSubmitting = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/sosmed/posts/${postId}/comment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: content.trim() })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Komentar gagal dikirim.');
			comments = [...comments, payload.comment];
			loaded = true;
			content = '';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Komentar gagal dikirim.';
		} finally {
			isSubmitting = false;
		}
	};
</script>

<div class="space-y-4">
	{#if isLoading}
		<p class="text-sm text-slate-500">Memuat komentar...</p>
	{/if}

	<div class="space-y-3">
		{#each comments as comment}
			<div class="flex gap-3">
				{#if comment.user_avatar_url}
					<img src={comment.user_avatar_url} alt="" class="h-8 w-8 rounded-full object-cover" loading="lazy" />
				{:else}
					<div class={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${avatarColor(comment.user_id)}`}>
						{initials(comment.user_name)}
					</div>
				{/if}
				<div class="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-semibold text-slate-900">{comment.user_name}</p>
						<p class="text-xs text-slate-400">{formatRelativeTime(comment.created_at)}</p>
					</div>
					<p class="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.content}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="space-y-2">
		<textarea
			bind:value={content}
			maxlength="200"
			rows="2"
			class="textarea textarea-bordered w-full resize-y rounded-2xl border-slate-200 bg-white text-sm"
			placeholder="Tulis komentar..."
		></textarea>
		<div class="flex items-center justify-between gap-3">
			<span class="text-xs text-slate-500">sisa {Math.max(0, 200 - content.length)} karakter</span>
			<button
				type="button"
				class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
				disabled={!content.trim() || content.length > 200 || isSubmitting}
				on:click={submit}
			>
				{isSubmitting ? 'Mengirim...' : 'Komentar'}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<p class="text-sm font-semibold text-rose-600">{errorMessage}</p>
	{/if}
</div>
