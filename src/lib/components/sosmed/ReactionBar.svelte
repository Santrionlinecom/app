<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ReactionEmoji } from '$lib/types/sosmed';

	export let postId: string;
	export let reactionCount = 0;
	export let userReaction: ReactionEmoji | null = null;

	const dispatch = createEventDispatcher<{ changed: { reaction_count: number; emoji: ReactionEmoji | null } }>();
	let busy = false;
	let errorMessage = '';

	const options: Array<{ emoji: ReactionEmoji; icon: string; label: string }> = [
		{ emoji: 'like', icon: '👍', label: 'Suka' },
		{ emoji: 'love', icon: '❤️', label: 'Sayang' },
		{ emoji: 'mashallah', icon: '🤲', label: 'MasyaAllah' }
	];

	const toggle = async (emoji: ReactionEmoji) => {
		if (busy) return;
		const previousReaction = userReaction;
		const previousCount = reactionCount;
		const nextReaction = previousReaction === emoji ? null : emoji;
		userReaction = nextReaction;
		reactionCount = previousReaction ? (nextReaction ? reactionCount : reactionCount - 1) : reactionCount + 1;
		busy = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/sosmed/posts/${postId}/react`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emoji })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Reaksi gagal.');
			reactionCount = payload.reaction_count;
			userReaction = payload.emoji;
			dispatch('changed', { reaction_count: reactionCount, emoji: userReaction });
		} catch (err) {
			userReaction = previousReaction;
			reactionCount = previousCount;
			errorMessage = err instanceof Error ? err.message : 'Reaksi gagal.';
		} finally {
			busy = false;
		}
	};
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-2">
		{#each options as option}
			<button
				type="button"
				class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-110 disabled:opacity-60"
				class:border-emerald-300={userReaction === option.emoji}
				class:bg-emerald-50={userReaction === option.emoji}
				class:text-emerald-800={userReaction === option.emoji}
				class:border-slate-200={userReaction !== option.emoji}
				class:bg-white={userReaction !== option.emoji}
				class:text-slate-600={userReaction !== option.emoji}
				disabled={busy}
				on:click={() => toggle(option.emoji)}
			>
				<span>{option.icon}</span>
				<span>{option.label}</span>
			</button>
		{/each}
		<span class="text-sm font-semibold text-slate-500">{reactionCount} reaksi</span>
	</div>
	{#if errorMessage}
		<p class="text-xs font-semibold text-rose-600">{errorMessage}</p>
	{/if}
</div>
