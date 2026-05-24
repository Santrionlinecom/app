<script lang="ts">
	type ButtonSize = 'sm' | 'md' | 'lg';
	type ButtonVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger';
	type ButtonType = 'button' | 'submit' | 'reset';

	export let variant: ButtonVariant = 'primary';
	export let size: ButtonSize = 'md';
	export let full = false;
	export let type: ButtonType = 'button';
	export let href: string | null = null;
	export let disabled = false;

	const base =
		'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition focus-visible:outline-none';
	const sizes: Record<ButtonSize, string> = {
		sm: 'h-9 px-4 text-xs',
		md: 'h-11 px-5 text-sm',
		lg: 'h-13 px-7 text-base'
	};
	const variants: Record<ButtonVariant, string> = {
		primary: 'bg-so-green text-white hover:bg-so-green-2 active:scale-[.98]',
		soft: 'bg-so-green/8 text-so-green border border-so-green/15 hover:bg-so-green/14',
		outline:
			'border border-so-border text-so-ink hover:border-so-green hover:text-so-green bg-white',
		ghost: 'text-so-muted hover:text-so-green hover:bg-so-green/6',
		danger: 'bg-red-600 text-white hover:bg-red-700'
	};
	$: cls = [
		base,
		sizes[size] ?? sizes.md,
		variants[variant] ?? variants.primary,
		full ? 'w-full' : ''
	].join(' ');
</script>

{#if href}
	<a {href} class={cls}><slot /></a>
{:else}
	<button {type} {disabled} class={cls} on:click><slot /></button>
{/if}
