<script lang="ts">
	import { page } from '$app/stores';

	export let items: { label: string; href: string; icon: string }[] = [];

	const isActive = (href: string) => {
		const path = $page.url.pathname;
		return path === href || path.startsWith(`${href}/`);
	};
</script>

<nav class="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-full bg-white/90 px-6 py-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] backdrop-blur-md md:hidden">
	{#each items as item}
		<a
			href={item.href}
			class="group flex flex-col items-center gap-1 transition-all"
			class:text-emerald-600={isActive(item.href)}
			class:text-slate-400={!isActive(item.href)}
		>
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<span class="text-[10px] font-medium">{item.label}</span>
		</a>
	{/each}
</nav>
