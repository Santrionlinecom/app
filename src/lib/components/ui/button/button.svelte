<script lang="ts" module>
	import type { WithElementRef } from "bits-ui";
	import type { ClassValue, HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	const VARIANT_CLASSES = {
		default: "btn-primary",
		destructive: "btn-error",
		outline: "btn-outline",
		secondary: "btn-secondary",
		ghost: "btn-ghost",
		link: "btn-link",
	} as const;

	const SIZE_CLASSES = {
		default: "",
		sm: "btn-sm",
		lg: "btn-lg",
		icon: "btn-square btn-sm",
	} as const;

	export type ButtonVariant = keyof typeof VARIANT_CLASSES;
	export type ButtonSize = keyof typeof SIZE_CLASSES;

	export const buttonVariants = (
		options: {
			variant?: ButtonVariant;
			size?: ButtonSize;
			className?: ClassValue | null;
		} = {}
	): string =>
		cn(
			"btn normal-case gap-2",
			VARIANT_CLASSES[options.variant ?? "default"],
			SIZE_CLASSES[options.size ?? "default"],
			options.className
		);

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		class={buttonVariants({ variant, size, className })}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class={buttonVariants({ variant, size, className })}
		{type}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
