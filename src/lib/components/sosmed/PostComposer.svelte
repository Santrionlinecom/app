<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Post } from '$lib/types/sosmed';
	import MediaUpload from './MediaUpload.svelte';
	import { avatarColor, initials } from './utils';

	export let currentUser: { id: string; name: string; avatarUrl: string | null };

	const dispatch = createEventDispatcher<{ created: { post: Post } }>();
	let content = '';
	let mediaUrl: string | null = null;
	let isPosting = false;
	let isUploadingMedia = false;
	let errorMessage = '';

	$: charCount = content.length;
	$: canPost = content.trim().length > 0 && charCount <= 500 && !isPosting && !isUploadingMedia;

	const submitPost = async () => {
		if (isUploadingMedia) {
			errorMessage = 'Tunggu upload foto selesai sebelum memposting.';
			return;
		}
		if (!canPost) return;
		isPosting = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/sosmed/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: content.trim(), media_url: mediaUrl })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Posting gagal.');
			content = '';
			mediaUrl = null;
			dispatch('created', { post: payload.post });
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Posting gagal.';
		} finally {
			isPosting = false;
		}
	};
</script>

<section class="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
	<div class="flex items-start gap-3">
		{#if currentUser.avatarUrl}
			<img src={currentUser.avatarUrl} alt="" class="h-11 w-11 rounded-full object-cover" />
		{:else}
			<div class={`grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white ${avatarColor(currentUser.id)}`}>
				{initials(currentUser.name)}
			</div>
		{/if}
		<div class="min-w-0 flex-1">
			<textarea
				bind:value={content}
				maxlength="500"
				rows="3"
				class="textarea textarea-bordered min-h-28 w-full resize-y rounded-2xl border-slate-200 bg-slate-50 text-base leading-7 focus:border-emerald-400 focus:bg-white"
				placeholder="Apa yang ingin Anda bagikan?"
			></textarea>
			<div class="mt-3">
				<MediaUpload
					{mediaUrl}
					on:uploaded={(event) => (mediaUrl = event.detail.url)}
					on:uploading={(event) => (isUploadingMedia = event.detail.isUploading)}
					on:clear={() => (mediaUrl = null)}
				/>
			</div>
			<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
				<p class:text-rose-600={charCount > 500} class="text-sm font-medium text-slate-500">
					sisa: {Math.max(0, 500 - charCount)} karakter
				</p>
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={!canPost}
					on:click={submitPost}
				>
					{isPosting ? 'Memposting...' : isUploadingMedia ? 'Mengupload foto...' : 'Posting'}
				</button>
			</div>
			{#if errorMessage}
				<p class="mt-3 text-sm font-semibold text-rose-600">{errorMessage}</p>
			{/if}
		</div>
	</div>
</section>
