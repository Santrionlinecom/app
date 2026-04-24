<script lang="ts">
	import BookOpen from '@lucide/svelte/icons/book-open';
	import HandHeart from '@lucide/svelte/icons/hand-heart';
	import Library from '@lucide/svelte/icons/library';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Target from '@lucide/svelte/icons/target';

	export let slug = '';
	export let className = 'h-6 w-6';
	export let strokeWidth = 1.8;
</script>

{#if slug === 'belajar-alquran'}
	<BookOpen class={className} {strokeWidth} aria-hidden="true" />
{:else if slug === 'dzikir-doa'}
	<HandHeart class={className} {strokeWidth} aria-hidden="true" />
{:else if slug === 'kitab-turats'}
	<Library class={className} {strokeWidth} aria-hidden="true" />
{:else if slug === 'khataman-rutin'}
	<Target class={className} {strokeWidth} aria-hidden="true" />
{:else}
	<Sparkles class={className} {strokeWidth} aria-hidden="true" />
{/if}
