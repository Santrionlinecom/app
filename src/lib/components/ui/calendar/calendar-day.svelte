<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { Calendar as CalendarPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.DayProps = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		buttonVariants({ variant: "ghost", size: "icon" }),
		"size-9 p-0 font-normal",
		"[&[data-today]:not([data-selected])]:bg-primary/10 [&[data-today]:not([data-selected])]:text-primary",
		// Selected
		"data-[selected]:bg-primary data-[selected]:text-primary-content data-[selected]:hover:bg-primary data-[selected]:focus:bg-primary data-[selected]:opacity-100",
		// Disabled
		"data-[disabled]:text-base-content/40 data-[disabled]:opacity-50",
		// Unavailable
		"data-[unavailable]:text-error data-[unavailable]:line-through",
		// Outside months
		"data-[outside-month]:text-base-content/40 data-[outside-month]:pointer-events-none data-[outside-month]:opacity-40 [&[data-outside-month][data-selected]]:bg-primary/10 [&[data-outside-month][data-selected]]:text-base-content/50 [&[data-outside-month][data-selected]]:opacity-60",
		className
	)}
	{...restProps}
/>
