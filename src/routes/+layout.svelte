<script lang="ts">
import '../app.css';
import { page } from '$app/stores';
import { onMount } from 'svelte';
import SearchableSelect from '$lib/components/SearchableSelect.svelte';
import { LANGUAGE_OPTIONS } from '$lib/data/languages';
import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
import { islamicDynasties } from '$lib/data/dinasti';

export let data;

let pathname = '/';
$: pathname = $page.url.pathname as string;
let isSuperAdmin = false;
let isImpersonating = false;
$: isSuperAdmin = isSuperAdminUser(data?.user);
$: isImpersonating = isImpersonatingUser(data?.user);
const appRoutePrefixes = ['/dashboard', '/keuangan', '/akademik', '/tpq/akademik', '/org'];
const isAppRoute = (path: string) =>
	appRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
const isAdminRoute = (path: string) => path === '/admin' || path.startsWith('/admin/');
let isAppRouteActive = false;
let isAdminRouteActive = false;
const isBlogMenuActive = (path: string) => path.startsWith('/blog') || path.startsWith('/digital-store');
const isTokohMenuActive = (path: string) =>
	['/tokoh', '/nabi', '/sahabat', '/tabiin', '/tabiut-tabiin', '/ulama'].some(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`)
	);
const isDynastyMenuActive = (path: string) => path === '/dinasti' || path.startsWith('/dinasti/');

const tokohMenuItems = [
	{
		label: 'Nabi',
		href: '/nabi',
		note: '25 rasul yang wajib diimani'
	},
	{
		label: 'Sahabat',
		href: '/sahabat',
		note: 'Khulafaur Rasyidin dan Ahlul Badr'
	},
	{
		label: "Tabi'in",
		href: '/tabiin',
		note: 'Murid para sahabat'
	},
	{
		label: "Tabi'ut Tabi'in",
		href: '/tabiut-tabiin',
		note: 'Generasi kodifikasi awal'
	},
	{
		label: 'Ulama',
		href: '/ulama',
		note: 'Jaringan sanad Aswaja'
	}
];

const dynastyMenuItems = islamicDynasties.map((dynasty) => ({
	label: dynasty.name,
	href: `/dinasti#${dynasty.slug}`,
	note: dynasty.periodCE,
	order: dynasty.order
}));

const kitabMenuItems = [
	{
		label: 'Aqidah',
		href: '/kitab/terjemah-aqidatul-awam',
		note: 'Akidatul Awam'
	},
	{
		label: 'Lughoh',
		href: '/kitab/bahasa-arab-dasar-1',
		note: 'Durusul Lughah Dasar'
	},
	{
		label: 'Tajwid',
		href: '/kitab/ilmu-tajwid-lengkap',
		note: 'Ilmu Tajwid Lengkap'
	},
	{
		label: 'Hadits',
		href: '/kitab/terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied',
		note: "Syarah Arba'in Nawawiyah"
	},
	{
		label: 'Fiqih',
		href: '/kitab/safinatun-najah-makna-perkata',
		note: 'Safinatun Najah'
	},
	{
		label: 'Tasawuf',
		href: '/kitab/terjemah-bidayatul-hidayah',
		note: 'Bidayatul Hidayah'
	}
];

const apkUrl = 'https://files.santrionline.com/Santrionline.apk';
const installPromptKey = 'so_install_prompt_v1';
let showInstallPopup = false;
const translateScriptId = 'google-translate-script';
const languageStorageKey = 'so_selected_language';
const defaultFaviconPath = '/favicon.ico';
let selectedLanguage = '';
let pendingLanguage = '';

const REGIONAL_INDICATOR_A = 0x1f1e6;
const REGIONAL_INDICATOR_Z = 0x1f1ff;

type LanguageHeaderOption = (typeof LANGUAGE_OPTIONS)[number] & {
	flagCode?: string;
	flagIcon?: string;
};

const toCountryCodeFromEmoji = (emoji: string) => {
	const points = Array.from(emoji ?? '').map((char) => char.codePointAt(0) ?? 0);
	if (points.length !== 2) return null;
	if (
		points[0] < REGIONAL_INDICATOR_A ||
		points[0] > REGIONAL_INDICATOR_Z ||
		points[1] < REGIONAL_INDICATOR_A ||
		points[1] > REGIONAL_INDICATOR_Z
	) {
		return null;
	}
	const first = String.fromCharCode(points[0] - REGIONAL_INDICATOR_A + 65);
	const second = String.fromCharCode(points[1] - REGIONAL_INDICATOR_A + 65);
	return `${first}${second}`;
};

const languageOptionsWithFlags: LanguageHeaderOption[] = LANGUAGE_OPTIONS.map((option) => {
	const flagCode = toCountryCodeFromEmoji(option.emoji ?? '');
	return {
		...option,
		flagCode: flagCode ?? undefined,
		flagIcon: flagCode ? `/flags/${flagCode.toLowerCase()}.svg` : undefined
	};
});

const languageOptionMap = new Map(languageOptionsWithFlags.map((option) => [option.value, option]));
let selectedLanguageOption: LanguageHeaderOption | null = null;
$: selectedLanguageOption = languageOptionMap.get(selectedLanguage) ?? null;

const setHtmlLanguage = (lang: string) => {
	if (typeof document === 'undefined') return;
	document.documentElement.lang = (lang || 'id').split('-')[0].toLowerCase();
};

const setFavicon = (href: string) => {
	if (typeof document === 'undefined') return;
	const normalizedHref = href || defaultFaviconPath;
	let icon = document.querySelector('link#site-favicon-dynamic') as HTMLLinkElement | null;
	if (!icon) {
		icon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
		if (!icon) {
			icon = document.createElement('link');
			document.head.appendChild(icon);
		}
		icon.id = 'site-favicon-dynamic';
		icon.rel = 'icon';
	}
	icon.href = normalizedHref;
	icon.type = normalizedHref.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';

	const shortcut = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null;
	if (shortcut) {
		shortcut.href = normalizedHref;
		shortcut.type = icon.type;
	}
};

const syncLanguageAppearance = (lang: string) => {
	const option = languageOptionMap.get(lang);
	setFavicon(option?.flagIcon ?? defaultFaviconPath);
	setHtmlLanguage(lang);
};

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

	try {
		const savedLanguage = localStorage.getItem(languageStorageKey) ?? '';
		if (savedLanguage && languageOptionMap.has(savedLanguage)) {
			selectedLanguage = savedLanguage;
			pendingLanguage = savedLanguage;
		}
	} catch {
		// ignore storage issue
	}

	syncLanguageAppearance(selectedLanguage);
	loadTranslateWidget();
});

const loadTranslateWidget = () => {
	if (typeof window === 'undefined') return;
	const w = window as unknown as {
		googleTranslateElementInit?: () => void;
		google?: { translate?: { TranslateElement: new (opts: any, id: string) => void } };
		__soTranslateLoaded?: boolean;
	};
	if (w.__soTranslateLoaded) return;
	w.__soTranslateLoaded = true;
	w.googleTranslateElementInit = () => {
		if (!document.getElementById('google_translate_element')) return;
		if (!w.google?.translate?.TranslateElement) return;
		new w.google.translate.TranslateElement(
			{
				pageLanguage: 'id'
			},
			'google_translate_element'
		);
		if (pendingLanguage) {
			setTranslateLanguage(pendingLanguage);
			pendingLanguage = '';
		}
	};
	const script = document.createElement('script');
	script.id = translateScriptId;
	script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
	script.async = true;
	document.head.appendChild(script);
};

const setTranslateLanguage = (lang: string) => {
	if (!lang) return;
	const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
	if (!combo) {
		pendingLanguage = lang;
		return;
	}
	combo.value = lang;
	combo.dispatchEvent(new Event('change'));
};

const handleLanguageChange = (event: CustomEvent<{ value: string }>) => {
	selectedLanguage = event.detail.value;
	try {
		if (selectedLanguage) {
			localStorage.setItem(languageStorageKey, selectedLanguage);
		} else {
			localStorage.removeItem(languageStorageKey);
		}
	} catch {
		// Ignore storage failures.
	}
	syncLanguageAppearance(selectedLanguage);
	if (selectedLanguage) {
		setTranslateLanguage(selectedLanguage);
	}
};

const baseNav = [
	{
		label: 'Beranda',
		href: '/',
		icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		isActive: (path: string) => path === '/'
	},
	{
		label: 'TPQ',
		href: '/tpq',
		icon: 'M4 6a2 2 0 012-2h9l5 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm9-2v4h4',
		isActive: (path: string) => path === '/tpq' || path.startsWith('/tpq/')
	},
	{
		label: 'Blog',
		href: '/blog',
		icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
		isActive: (path: string) => isBlogMenuActive(path)
	},
	{
		label: 'Tokoh',
		href: '/tokoh',
		icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2m5-2a3 3 0 100-6 3 3 0 000 6z',
		isActive: (path: string) => isTokohMenuActive(path)
	},
	{
		label: 'Dinasti',
		href: '/dinasti',
		icon: 'M3 21h18M5 21V7l7-4 7 4v14M10 9h.01M14 9h.01M10 13h.01M14 13h.01M9 21v-4h6v4',
		isActive: (path: string) => isDynastyMenuActive(path)
	},
	{
		label: 'Kitab',
		href: '/kitab',
		icon: 'M4 6a2 2 0 012-2h9l5 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
		isActive: (path: string) => path.startsWith('/kitab')
	}
];

const adminNav = [
	{
		label: 'Dashboard',
		href: '/admin/super/overview',
		icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z',
		isActive: (path: string) => path === '/admin/super/overview' || path.startsWith('/admin/super/overview/')
	},
	{
		label: 'CMS',
		href: '/admin/posts',
		icon: 'M5 4.5h11a2 2 0 012 2V19a1 1 0 01-1.6.8L12 16.5l-4.4 3.3A1 1 0 016 19V6.5a2 2 0 012-2z',
		isActive: (path: string) => path === '/admin/posts' || path.startsWith('/admin/posts/')
	},
	{
		label: 'Licenses',
		href: '/admin/licenses',
		icon: 'M4 7.5V6a2 2 0 012-2h12a2 2 0 012 2v1.5M3 9.5h18v8.5a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5zm6 4.5h6',
		isActive: (path: string) => path === '/admin/licenses' || path.startsWith('/admin/licenses/')
	},
	{
		label: 'Settings',
		href: '/akun',
		icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7.5 7.5 0 01-.2 1.8l2 1.5-2 3.4-2.3-.7a7.4 7.4 0 01-1.6.9l-.3 2.4H9l-.3-2.4a7.4 7.4 0 01-1.6-.9l-2.3.7-2-3.4 2-1.5A7.5 7.5 0 015 12c0-.6.1-1.2.2-1.8L3.2 8.7l2-3.4 2.3.7c.5-.4 1-.7 1.6-.9L9 2.7h4l.3 2.4c.6.2 1.1.5 1.6.9l2.3-.7 2 3.4-2 1.5c.1.6.2 1.2.2 1.8z',
		isActive: (path: string) => path.startsWith('/akun')
	}
];

$: isAppRouteActive = isAppRoute(pathname);
$: isAdminRouteActive = isAdminRoute(pathname);
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
				<a href="/tpq" class:active={pathname.startsWith('/tpq')} class="text-base-content/60 hover:text-primary">TPQ</a>
				<div class="group relative">
					<a
						href="/blog"
						class:active={isBlogMenuActive(pathname)}
						class="inline-flex items-center gap-1 text-base-content/60 hover:text-primary"
					>
						<span>Blog</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="h-4 w-4 transition group-hover:translate-y-px"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<div class="pointer-events-none invisible absolute left-1/2 top-full z-30 w-56 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
						<div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
							<a
								href="/blog"
								class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
							>
								<span>Semua Artikel</span>
								<span class="text-xs text-slate-400">/blog</span>
							</a>
							<a
								href="/digital-store"
								class="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
							>
								<span>Digital Store</span>
								<span class="text-xs text-slate-400">produk</span>
							</a>
						</div>
					</div>
				</div>
				<div class="group relative">
					<a
						href="/tokoh"
						class:active={isTokohMenuActive(pathname)}
						class="inline-flex items-center gap-1 text-base-content/60 hover:text-primary"
					>
						<span>Tokoh</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="h-4 w-4 transition group-hover:translate-y-px"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<div class="pointer-events-none invisible absolute left-1/2 top-full z-30 w-72 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
						<div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
							<a
								href="/tokoh"
								class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
							>
								<div>
									<p class="font-semibold text-slate-900">Overview Tokoh</p>
									<p class="text-xs text-slate-500">Rantai generasi dari nabi sampai ulama</p>
								</div>
								<span class="text-xs text-slate-400">/tokoh</span>
							</a>
							<div class="mt-2 space-y-1">
								{#each tokohMenuItems as item}
									<a
										href={item.href}
										class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
									>
										<div>
											<p class="font-medium text-slate-900">{item.label}</p>
											<p class="text-xs text-slate-400">{item.note}</p>
										</div>
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="group relative">
					<a
						href="/dinasti"
						class:active={isDynastyMenuActive(pathname)}
						class="inline-flex items-center gap-1 text-base-content/60 hover:text-primary"
					>
						<span>Dinasti</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="h-4 w-4 transition group-hover:translate-y-px"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<div class="pointer-events-none invisible absolute left-1/2 top-full z-30 w-[34rem] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
						<div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
							<a
								href="/dinasti"
								class="block rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
							>
								<p class="text-sm font-semibold text-slate-900">Overview Dinasti Islam</p>
								<p class="mt-1 text-xs text-slate-500">Urutan pasca-Khulafaur Rasyidin dan peta dinasti yang saling overlap</p>
							</a>
							<div class="mt-2 grid max-h-[24rem] grid-cols-2 gap-1 overflow-y-auto pr-1">
								{#each dynastyMenuItems as item}
									<a
										href={item.href}
										class="rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
									>
										<p class="font-medium text-slate-900">{item.order}. {item.label}</p>
										<p class="text-xs text-slate-400">{item.note}</p>
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="group relative">
					<a
						href="/kitab"
						class:active={pathname.startsWith('/kitab')}
						class="inline-flex items-center gap-1 text-base-content/60 hover:text-primary"
					>
						<span>Kitab</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="h-4 w-4 transition group-hover:translate-y-px"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<div class="pointer-events-none invisible absolute left-1/2 top-full z-30 w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
						<div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
							<a
								href="/kitab"
								class="block rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
							>
								<p class="text-sm font-semibold text-slate-900">Overview Kitab</p>
								<p class="mt-1 text-xs text-slate-500">Perpustakaan kitab, seri bahasa Arab, dan kitab fondasi Santri Online</p>
							</a>
							<div class="mt-2 grid grid-cols-2 gap-1">
								{#each kitabMenuItems as item}
									<a
										href={item.href}
										class="rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
									>
										<p class="font-medium text-slate-900">{item.label}</p>
										<p class="text-xs text-slate-400">{item.note}</p>
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</nav>
			<div class="flex items-center gap-2">
				<div class="hidden md:flex items-center gap-2">
					{#if selectedLanguageOption?.flagIcon}
						<img
							src={selectedLanguageOption.flagIcon}
							alt={`Bendera ${selectedLanguageOption.label}`}
							class="h-4 w-6 rounded-[2px] border border-slate-200 object-cover shadow-sm"
							loading="lazy"
							decoding="async"
						/>
					{:else if selectedLanguageOption?.emoji}
						<span class="text-base leading-none">{selectedLanguageOption.emoji}</span>
					{/if}
					<SearchableSelect
						options={languageOptionsWithFlags}
						bind:value={selectedLanguage}
						placeholder="Pilih Bahasa"
						searchPlaceholder="Cari bahasa..."
						emptyText="Bahasa tidak ditemukan"
						wrapperClass="w-52"
						inputClass="text-xs h-9"
						on:change={handleLanguageChange}
					/>
				</div>
				<div id="google_translate_element" class="translate-slot hidden"></div>
				{#if data.user}
					<a href={isSuperAdmin ? '/admin/super/overview' : '/dashboard'} class="btn btn-sm btn-ghost">
						{isSuperAdmin ? 'Super Admin' : 'Dashboard'}
					</a>
					{#if isImpersonating}
						<a href="/admin/super/impersonate/stop" class="btn btn-sm btn-outline">Keluar Mode Admin</a>
					{/if}
					<a href="/kalender" class="btn btn-sm btn-ghost">Kalender</a>
					<a href="/akun" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Profil</a>
					<form method="POST" action="/logout">
						<button type="submit" class="btn btn-sm btn-error">Logout</button>
					</form>
				{:else}
					<a href="/kalender" class="btn btn-sm btn-ghost">Kalender</a>
					<a href="/auth" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Login</a>
					<a href="/register" class="btn btn-sm btn-primary">Daftar TPQ</a>
				{/if}
			</div>
		</div>
	</header>

	<main class="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-10">
		<slot />
	</main>

	<!-- Bottom nav (mobile) -->
	{#if !isAppRouteActive && !isAdminRouteActive}
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
						<span class="text-[10px]">Daftar TPQ</span>
					</a>
				{/if}
			</div>
		</nav>
	{:else if isAdminRouteActive && isSuperAdmin}
		<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-base-200 bg-base-100 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] md:hidden safe-area-bottom">
			<div class="mx-auto flex max-w-2xl items-center justify-between px-2 py-3 pb-safe">
				{#each adminNav as item}
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
			</div>
		</nav>
	{/if}

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

	:global(.translate-slot .goog-te-gadget) {
		font-size: 0;
	}

	:global(.translate-slot .goog-te-gadget span) {
		display: none;
	}

	:global(.translate-slot .goog-te-combo) {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.35rem 0.5rem;
		font-size: 0.75rem;
		background: #fff;
		color: #0f172a;
	}
</style>
