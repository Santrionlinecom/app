<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: user = data.user;

	const navItems = [
		{
			label: 'Home',
			href: '/dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
			isActive: (url: URL) => url.pathname === '/dashboard' && !url.searchParams.has('tab')
		},
		{
			label: 'Progress Hafalan',
			href: '/dashboard?tab=hafalan',
			icon: 'M12 6v6l4 2M12 22c5.523 0 10-3.582 10-8s-4.477-8-10-8-10 3.582-10 8 4.477 8 10 8z',
			isActive: (url: URL) => url.searchParams.get('tab') === 'hafalan'
		},
		{
			label: 'Progress Kitab',
			href: '/dashboard?tab=kitab',
			icon: 'M4 6a2 2 0 012-2h9l5 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
			isActive: (url: URL) => url.searchParams.get('tab') === 'kitab'
		},
		{
			label: 'Produk',
			href: '/dashboard?tab=produk',
			icon: 'M3 7l9-4 9 4-9 4-9-4zm2 4l7 3 7-3m-14 4l7 3 7-3',
			isActive: (url: URL) => url.searchParams.get('tab') === 'produk'
		}
	];
</script>

<div class="min-h-screen bg-white pb-24 md:pb-10">
	<main class="max-w-5xl mx-auto px-4 py-6">
		<slot />
	</main>

	<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-2 py-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500"
					class:text-blue-600={item.isActive($page.url)}
					class:font-semibold={item.isActive($page.url)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
						<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span class="text-center leading-tight">{item.label}</span>
				</a>
			{/each}

			{#if user}
				<form method="POST" action="/logout" class="flex flex-1 flex-col items-center">
					<button type="submit" class="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-blue-600">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
						</svg>
						<span class="text-center leading-tight">Logout</span>
					</button>
				</form>
			{:else}
				<a
					href="/register"
					class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs text-blue-600 font-semibold"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0M15 12h4m0 0l-2-2m2 2l-2 2" />
					</svg>
					<span class="text-center leading-tight">Daftar</span>
				</a>
			{/if}
		</div>
	</nav>
</div>
