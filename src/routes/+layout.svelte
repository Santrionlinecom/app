<script lang="ts">
import '../app.css';
import { page } from '$app/stores';

export let data;

let pathname = '/';
$: pathname = $page.url.pathname as string;

const baseNav = [
	{
		label: 'Beranda',
		href: '/',
		icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		isActive: (path: string) => path === '/'
	},
	{
		label: 'Blog',
		href: '/blog',
		icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
		isActive: (path: string) => path.startsWith('/blog')
	},
	{
		label: 'Nabi',
		href: '/nabi',
		icon: 'M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z',
		isActive: (path: string) => path.startsWith('/nabi')
	},
	{
		label: 'Sahabat',
		href: '/sahabat',
		icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2m5-2a3 3 0 100-6 3 3 0 000 6z',
		isActive: (path: string) => path.startsWith('/sahabat')
	},
	{
		label: 'Kitab',
		href: '/kitab',
		icon: 'M4 6a2 2 0 012-2h9l5 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
		isActive: (path: string) => path.startsWith('/kitab')
	},
	{
		label: 'Ulama',
		href: '/ulama',
		icon: 'M5.121 17.804A9 9 0 1119 10.5v1.25a5.25 5.25 0 01-5.25 5.25H9a4 4 0 00-3.879 2.804z',
		isActive: (path: string) => path.startsWith('/ulama')
	}
];
</script>

<div class="min-h-screen bg-base-100">
	<header class="sticky top-0 z-50 w-full border-b bg-base-100 py-2">
		<div class="container mx-auto max-w-6xl px-4 flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between">
			<a href="/" class="flex items-center gap-2">
				<img src="/logo-santri.png" alt="Santri Online" class="h-8 w-auto" loading="lazy" />
			</a>
			<nav class="hidden md:flex items-center gap-5">
				<a href="/" class:active={pathname === '/'} class="text-base-content/60 hover:text-primary">Beranda</a>
				<a href="/blog" class:active={pathname.startsWith('/blog')} class="text-base-content/60 hover:text-primary">Blog</a>
				<a href="/nabi" class:active={pathname.startsWith('/nabi')} class="text-base-content/60 hover:text-primary">Nabi</a>
				<a href="/sahabat" class:active={pathname.startsWith('/sahabat')} class="text-base-content/60 hover:text-primary">Sahabat</a>
				<a href="/kitab" class:active={pathname === '/kitab'} class="text-base-content/60 hover:text-primary">Kitab</a>
				<a href="/ulama" class:active={pathname === '/ulama'} class="text-base-content/60 hover:text-primary">Ulama</a>
			</nav>
			<div class="flex items-center gap-2">
				{#if data.user}
					<a href="/dashboard" class="btn btn-sm btn-ghost">Dashboard</a>
					<a href="/kalender" class="btn btn-sm btn-ghost">Kalender</a>
					<a href="/akun" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Profil</a>
					<form method="POST" action="/logout">
						<button type="submit" class="btn btn-sm btn-error">Logout</button>
					</form>
				{:else}
					<a href="/auth" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Login</a>
					<a href="/register" class="btn btn-sm btn-primary">Register</a>
				{/if}
			</div>
		</div>
	</header>

	<main class="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-10">
		<slot />
	</main>

	<!-- Bottom nav (mobile) -->
	<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] md:hidden safe-area-bottom">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-2 py-3 pb-safe">
			{#each baseNav as item}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-500 transition-colors"
					class:text-emerald-600={item.isActive(pathname)}
					class:font-semibold={item.isActive(pathname)}
					class:bg-emerald-50={item.isActive(pathname)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
						<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span class="text-[10px]">{item.label}</span>
				</a>
			{/each}

			{#if data.user}
				<a
					href="/akun"
					class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors"
					class:text-emerald-600={pathname.startsWith('/akun')}
					class:font-semibold={pathname.startsWith('/akun')}
					class:bg-emerald-50={pathname.startsWith('/akun')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0" />
					</svg>
					<span class="text-[10px]">Profil</span>
				</a>
			{:else}
				<a
					href="/register"
					class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-emerald-600 font-semibold bg-emerald-50 transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0M15 12h4m0 0l-2-2m2 2l-2 2" />
					</svg>
					<span class="text-[10px]">Daftar</span>
				</a>
			{/if}
		</div>
	</nav>
</div>

<style>
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
	.pb-safe {
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
	}
</style>
