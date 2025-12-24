<script lang="ts">
import '../app.css';
import { page } from '$app/stores';
import { onMount } from 'svelte';

export let data;

let pathname = '/';
$: pathname = $page.url.pathname as string;

const apkUrl = 'https://files.santrionline.com/Santrionline.apk';
const installPromptKey = 'so_install_prompt_v1';
let showInstallPopup = false;

const dismissInstallPopup = (persist = true) => {
	showInstallPopup = false;
	if (!persist) return;
	try {
		localStorage.setItem(installPromptKey, '1');
	} catch {
		// Ignore storage failures (private mode, etc).
	}
};

const handleInstallOverlayKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		dismissInstallPopup();
	}
};

const handleInstallDialogKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		dismissInstallPopup();
	}
};

onMount(() => {
	try {
		showInstallPopup = !localStorage.getItem(installPromptKey);
	} catch {
		showInstallPopup = true;
	}
});

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

<svelte:head>
	<meta name="google-site-verification" content="vyZh4AQIE37XnqZCsPo_qfSKT7F1NRQdPYh8sPIDRFw" />
</svelte:head>

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
					<a href="/register" class="btn btn-sm btn-primary">Daftar Lembaga</a>
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
					<span class="text-[10px]">Daftar Lembaga</span>
				</a>
			{/if}
		</div>
	</nav>

	{#if showInstallPopup}
		<div
			class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
			role="button"
			tabindex="0"
			aria-label="Tutup popup instalasi"
			on:click|self={() => dismissInstallPopup()}
			on:keydown={handleInstallOverlayKey}
		>
			<div
				class="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-label="Install aplikasi Santri Online"
				tabindex="0"
				on:keydown={handleInstallDialogKey}
			>
				<button
					class="btn btn-sm btn-circle absolute right-4 top-4 bg-white/80 text-slate-700 hover:bg-white"
					on:click={() => dismissInstallPopup()}
					aria-label="Tutup"
				>
					✕
				</button>
				<div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
					<p class="text-xs uppercase tracking-[0.35em] text-white/80">Santri Online App</p>
					<h2 class="text-2xl md:text-3xl font-bold mt-2">Install Aplikasi Resmi</h2>
					<p class="text-sm text-white/90 mt-2">
						Nikmati akses cepat, notifikasi, dan pengalaman yang lebih ringan di perangkat Android Anda.
					</p>
				</div>
				<div class="p-6">
					<div class="grid gap-3 md:grid-cols-3 text-sm text-slate-700">
						<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
							<span class="font-semibold">⚡ Akses Cepat</span>
							<p class="mt-1 text-xs text-slate-600">Buka lebih cepat tanpa browser.</p>
						</div>
						<div class="rounded-2xl border border-teal-100 bg-teal-50 p-3">
							<span class="font-semibold">🔔 Notifikasi</span>
							<p class="mt-1 text-xs text-slate-600">Update kajian dan fitur terbaru.</p>
						</div>
						<div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
							<span class="font-semibold">🛡️ Resmi</span>
							<p class="mt-1 text-xs text-slate-600">APK aman dari Santri Online.</p>
						</div>
					</div>

					<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<a
							href={apkUrl}
							class="btn btn-primary"
							target="_blank"
							rel="noopener"
							on:click={() => dismissInstallPopup()}
						>
							Unduh APK
						</a>
						<button class="btn btn-ghost" on:click={() => dismissInstallPopup()}>
							Nanti saja
						</button>
					</div>

					<p class="mt-4 text-xs text-slate-500">
						*Jika diminta izin, aktifkan “Install unknown apps” untuk melanjutkan instalasi.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
	.pb-safe {
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
	}
</style>
