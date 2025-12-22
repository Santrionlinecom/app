<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CalendarPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
	<ChevronRight class="size-4" />
{/snippet}

<CalendarPrimitive.NextButton
	bind:ref
	class={cn(
		buttonVariants({ variant: "outline", size: "icon" }),
		"opacity-60 hover:opacity-100",
		className
	)}
	children={children || Fallback}
	{...restProps}
/>
