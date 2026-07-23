<script lang="ts">
import '../app.css';
import { page } from '$app/stores';
import { onDestroy, onMount } from 'svelte';
import BadgeCheck from '@lucide/svelte/icons/badge-check';
import Download from '@lucide/svelte/icons/download';
import RefreshCw from '@lucide/svelte/icons/refresh-cw';
import Share2 from '@lucide/svelte/icons/share-2';
import Smartphone from '@lucide/svelte/icons/smartphone';
import Wifi from '@lucide/svelte/icons/wifi';
import X from '@lucide/svelte/icons/x';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import ClarityAnalytics from '$lib/components/ClarityAnalytics.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import SchemaOrg from '$lib/components/seo/SchemaOrg.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import UmamiAnalytics from '$lib/components/UmamiAnalytics.svelte';
	import { LANGUAGE_OPTIONS } from '$lib/data/languages';
	import languageFlagOverrides from '$lib/data/language-flag-overrides.json';
	import { scrollDirection } from '$lib/stores/scrollDirection';
import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
import { islamicDynasties } from '$lib/data/dinasti';
import { FEATURES } from '$lib/features';
import { INSTITUTIONS, type InstitutionKey } from '$lib/config/institutions';

export let data;
export let hideChrome = false;

type PageDataWithChrome = {
	hideChrome?: boolean;
};

let pathname = '/';
$: pathname = $page.url.pathname as string;
let isSuperAdmin = false;
let isImpersonating = false;
const mobileChromeScrollThreshold = 10;
let isMobileViewport = false;
let scrollY = 0;
let scrollingDown = false;
let hideChromeFromRoute = false;
let hidePageChrome = false;
let shouldHideMobileChrome = false;
let hideMobileBottomNavigation = false;
let stopChromeScrollTracking: (() => void) | null = null;
$: isSuperAdmin = isSuperAdminUser(data?.user);
$: isImpersonating = isImpersonatingUser(data?.user);
$: scrollY = $scrollDirection.scrollY;
$: scrollingDown = $scrollDirection.scrollingDown;
$: hideChromeFromRoute = Boolean(($page.data as PageDataWithChrome | undefined)?.hideChrome);
// Auto-hide header/footer when user is logged in
$: hidePageChrome = hideChrome || hideChromeFromRoute || Boolean(data?.user);
$: hideMobileBottomNavigation = pathname === '/register' || pathname.startsWith('/register/');
$: shouldHideMobileChrome =
	!hidePageChrome &&
	isMobileViewport &&
	scrollingDown &&
	scrollY > mobileChromeScrollThreshold &&
	!mobileMenuOpen &&
	mobileTopMenuOpen === null &&
	!showInstallPopup;
const appRoutePrefixes = [
	'/dashboard',
	'/keuangan',
	'/akademik',
	'/tpq/akademik',
	'/tpq/hafalan-rapor',
	'/tpq/rapor-rekap',
	'/belajar',
	'/habit',
	'/beranda',
	'/akun',
	'/admin/posts',
	'/admin/licenses',
	'/admin/peta',
	'/org'
];
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
const isOrmasMenuActive = (path: string) => path === '/ormas' || path.startsWith('/ormas/');
const isBookMenuActive = (path: string) =>
	path === '/buku' ||
	path.startsWith('/buku/') ||
	path === '/coins' ||
	path.startsWith('/coins/');
let usesStandalonePageContainer = false;
$: usesStandalonePageContainer = isBookMenuActive(pathname);
const isRegisterMenuActive = (path: string) =>
	path === '/register' ||
	path.startsWith('/register/') ||
	INSTITUTIONS.some(
		(institution) =>
			path === institution.registerRoute ||
			path.startsWith(`${institution.registerRoute}/`) ||
			path === institution.route ||
			path.startsWith(`${institution.route}/`)
	);
const isLearningMenuActive = (path: string) =>
	path === '/tpq' ||
	path.startsWith('/tpq/') ||
	path.startsWith('/kitab') ||
	path.startsWith('/fitur') ||
	isTokohMenuActive(path) ||
	isDynastyMenuActive(path) ||
	isOrmasMenuActive(path) ||
	isBlogMenuActive(path) ||
	path === '/kalender' ||
	path.startsWith('/kalender/');

type HeaderMenuItem = {
	label: string;
	href: string;
	note: string;
};

type MobileTopMenu = {
	id: string;
	label: string;
	compact: boolean;
	isActive: (path: string) => boolean;
	items: HeaderMenuItem[];
	footerHref: string;
	footerLabel: string;
};

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
		label: 'Ahlul Bait',
		href: '/tokoh#ahlul-bait',
		note: 'Keluarga Nabi, Sunni dan Syiah'
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
const primaryDynastyMenuItems = dynastyMenuItems.filter((item) => item.order <= 10);

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

const learningMenuItems: HeaderMenuItem[] = [
	{
		label: 'TPQ',
		href: '/tpq',
		note: 'Pendaftaran dan profil lembaga'
	},
	{
		label: 'Kitab',
		href: '/kitab',
		note: 'Perpustakaan kitab dan belajar per bab'
	},
	{
		label: 'Mushaf',
		href: '/kitab/quran',
		note: 'Al-Qur’an 30 juz'
	},
	{
		label: 'Blog/Konten',
		href: '/blog',
		note: 'Artikel dan konten pembinaan'
	},
	{
		label: 'Tokoh',
		href: '/tokoh',
		note: 'Nabi, sahabat, tabiin, dan ulama'
	},
	{
		label: 'Dinasti',
		href: '/dinasti',
		note: 'Peta sejarah peradaban Islam'
	},
	{
		label: 'Ormas',
		href: '/ormas',
		note: 'NU, Muhammadiyah, dan ormas dunia'
	}
];

const bookPublicMenuItems: HeaderMenuItem[] = [
	{
		label: 'Kitab Turats',
		href: '/kitab',
		note: 'Kitab pilihan dan belajar per bab'
	},
	{
		label: 'Al-Quran',
		href: '/kitab/quran',
		note: 'Mushaf 30 juz dan materi tadabbur'
	},
	{
		label: 'Buku Digital',
		href: '/buku',
		note: 'Katalog karya santri dan penulis muslim'
	}
];

const bookUserMenuItems: HeaderMenuItem[] = [
	{
		label: 'Rak Buku Saya',
		href: '/buku/saya',
		note: 'Progress, bookmark, dan bab terbuka'
	},
	{
		label: 'Studio Penulis',
		href: '/buku/studio',
		note: 'Tulis dan kelola buku'
	},
	{
		label: 'Saldo Coin',
		href: '/coins',
		note: 'Cek saldo dan transaksi'
	},
	{
		label: 'Topup Coin',
		href: '/coins/topup',
		note: 'Tambah coin untuk unlock bab'
	},
	{
		label: 'Royalti Saya',
		href: '/buku/studio/earnings',
		note: 'Pantau pendapatan penulis'
	}
];

const adminBookMenuItems: HeaderMenuItem[] = [
	{
		label: 'Moderasi Buku',
		href: '/admin/super/buku',
		note: 'Review buku dan bab penulis'
	},
	{
		label: 'Laporan Royalti',
		href: '/admin/super/buku/royalties',
		note: 'Pantau ledger royalti penulis'
	},
	{
		label: 'Kelola Topup',
		href: '/admin/super/coin-topups',
		note: 'Verifikasi topup coin manual'
	},
	{
		label: 'CMS/Admin',
		href: '/admin/posts',
		note: 'Menu admin yang sudah ada'
	},
	{
		label: 'Licenses',
		href: '/admin/licenses',
		note: 'Akses license tetap tersedia'
	}
];

const memberRoleByInstitution: Record<InstitutionKey, string> = {
	tpq: 'Santri TPQ',
	pondok: 'Santri Pondok',
	masjid: 'Jamaah Masjid',
	musholla: 'Anggota Musholla',
	'rumah-tahfidz': 'Santri Tahfidz'
};

const institutionRegisterMenuItems: HeaderMenuItem[] = INSTITUTIONS.map((institution) => ({
	label: `Daftarkan ${institution.label}`,
	href: institution.registerRoute,
	note: institution.registerDescription
}));

const memberRegisterMenuItems: HeaderMenuItem[] = INSTITUTIONS.map((institution) => ({
	label: `Daftar sebagai ${memberRoleByInstitution[institution.key]}`,
	href: institution.route,
	note: `Pilih ${institution.label} terdaftar, lalu gunakan tautan pendaftaran anggotanya.`
}));

const apkUrl = 'https://files.santrionline.com/Santrionline.apk';
const installPromptDismissedKey = 'so_install_prompt_v2_dismissed';
const installPromptSnoozeKey = 'so_install_prompt_v2_snooze_until';
const installSnoozeDurationMs = 7 * 24 * 60 * 60 * 1000;
type InstallMode = 'native' | 'android' | 'ios';
type InstallDismissReason = 'dismiss' | 'installed' | 'snooze' | 'transient';
type BeforeInstallPromptChoice = {
	outcome?: 'accepted' | 'dismissed';
	platform?: string;
};
type BeforeInstallPromptEvent = Event & {
	platforms?: string[];
	prompt: () => Promise<BeforeInstallPromptChoice | void>;
	userChoice?: Promise<BeforeInstallPromptChoice>;
};

let showInstallPopup = false;
let installMode: InstallMode = 'android';
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installActionBusy = false;
let installPopupTimer: ReturnType<typeof setTimeout> | null = null;
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
	const flagCode =
		toCountryCodeFromEmoji(option.emoji ?? '') ??
		languageFlagOverrides[option.value as keyof typeof languageFlagOverrides] ??
		null;
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

const isInstalledAppView = () => {
	if (typeof window === 'undefined') return false;
	const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
	return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
};

const detectInstallMode = (): InstallMode | null => {
	if (typeof window === 'undefined' || isInstalledAppView()) return null;
	const userAgent = window.navigator.userAgent;
	const isIos =
		/iPad|iPhone|iPod/.test(userAgent) ||
		(window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
	if (isIos) return 'ios';
	if (/Android/i.test(userAgent)) return 'android';
	return null;
};

const isInstallPromptSuppressed = () => {
	try {
		if (localStorage.getItem(installPromptDismissedKey)) return true;
		const snoozedUntil = Number(localStorage.getItem(installPromptSnoozeKey) ?? '0');
		return Number.isFinite(snoozedUntil) && Date.now() < snoozedUntil;
	} catch {
		return false;
	}
};

const rememberInstallPopupDecision = (reason: InstallDismissReason) => {
	if (reason === 'transient') return;
	try {
		if (reason === 'snooze') {
			localStorage.setItem(installPromptSnoozeKey, String(Date.now() + installSnoozeDurationMs));
			return;
		}
		localStorage.setItem(installPromptDismissedKey, reason);
		localStorage.removeItem(installPromptSnoozeKey);
	} catch {
		// Ignore storage failures (private mode, etc).
	}
};

const openInstallPopup = (mode: InstallMode, delayMs = 0) => {
	if (isInstalledAppView() || isInstallPromptSuppressed()) return;
	installMode = mode;
	if (installPopupTimer) {
		clearTimeout(installPopupTimer);
		installPopupTimer = null;
	}
	installPopupTimer = setTimeout(() => {
		if (!isInstalledAppView() && !isInstallPromptSuppressed()) {
			showInstallPopup = true;
		}
		installPopupTimer = null;
	}, delayMs);
};

const dismissInstallPopup = (reason: InstallDismissReason = 'snooze') => {
	showInstallPopup = false;
	rememberInstallPopupDecision(reason);
};

const handleNativeInstall = async () => {
	if (!deferredInstallPrompt || installActionBusy) return;
	installActionBusy = true;
	const promptEvent = deferredInstallPrompt;
	deferredInstallPrompt = null;
	try {
		const promptResult = await promptEvent.prompt();
		const choice = promptEvent.userChoice ? await promptEvent.userChoice : promptResult;
		dismissInstallPopup(choice?.outcome === 'accepted' ? 'installed' : 'snooze');
	} catch {
		deferredInstallPrompt = null;
		installMode = detectInstallMode() ?? 'android';
	} finally {
		installActionBusy = false;
	}
};

const handleInstallDialogKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		dismissInstallPopup();
	}
};

onMount(() => {
	const stopScrollDirection = scrollDirection.start();
	const updateMobileViewport = () => {
		isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
	};

	updateMobileViewport();
	window.addEventListener('resize', updateMobileViewport, { passive: true });

	stopChromeScrollTracking = () => {
		stopScrollDirection();
		window.removeEventListener('resize', updateMobileViewport);
		stopChromeScrollTracking = null;
	};
});

onDestroy(() => {
	stopChromeScrollTracking?.();
});

onMount(() => {
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

	const handleBeforeInstallPrompt = (event: Event) => {
		event.preventDefault();
		deferredInstallPrompt = event as BeforeInstallPromptEvent;
		openInstallPopup('native', 3000);
	};
	const handleAppInstalled = () => {
		deferredInstallPrompt = null;
		dismissInstallPopup('installed');
	};

	window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
	window.addEventListener('appinstalled', handleAppInstalled);

	const fallbackMode = detectInstallMode() ?? 'android';
	openInstallPopup(fallbackMode, 5000);

	return () => {
		window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.removeEventListener('appinstalled', handleAppInstalled);
		if (installPopupTimer) {
			clearTimeout(installPopupTimer);
			installPopupTimer = null;
		}
	};
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
		icon: 'M3.5 11.5L12 4l8.5 7.5M5.5 10.25V20h5v-5.5h3V20h5v-9.75M9 20h6',
		description: 'Halaman utama',
		tone: 'from-emerald-500 to-teal-500',
		isActive: (path: string) => path === '/'
	},
	{
		label: 'TPQ',
		href: '/tpq',
		icon: 'M4.5 6.5A2.5 2.5 0 017 4h8l4.5 4.5V19A2.5 2.5 0 0117 21H7a2.5 2.5 0 01-2.5-2.5v-12zM14.5 4v5h5M8 13h8M8 16.5h6',
		description: 'Kelola lembaga',
		tone: 'from-lime-500 to-emerald-500',
		isActive: (path: string) => path === '/tpq' || path.startsWith('/tpq/')
	},
	{
		label: 'Blog',
		href: '/blog',
		icon: 'M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8 7h8M8 10.5h7M8 14h4',
		description: 'Artikel terbaru',
		tone: 'from-cyan-500 to-blue-500',
		isActive: (path: string) => isBlogMenuActive(path)
	},
	{
		label: 'Tokoh',
		href: '/tokoh',
		icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0M17.5 7.5h3M19 6v3M3.5 8.5h3',
		description: 'Nabi & ulama',
		tone: 'from-violet-500 to-indigo-500',
		isActive: (path: string) => isTokohMenuActive(path)
	},
	{
		label: 'Dinasti',
		href: '/dinasti',
		icon: 'M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M8.5 10h.01M12 10h.01M15.5 10h.01M8.5 13.5h.01M15.5 13.5h.01',
		description: 'Sejarah Islam',
		tone: 'from-amber-500 to-orange-500',
		isActive: (path: string) => isDynastyMenuActive(path)
	},
	{
		label: 'Kitab',
		href: '/kitab',
		icon: 'M4.5 5.5A2.5 2.5 0 017 3h13v15H7a2.5 2.5 0 000 5h13M8 7h8M8 10.5h7M6.5 18H20',
		description: 'Kitab turats',
		tone: 'from-rose-500 to-pink-500',
		isActive: (path: string) => path.startsWith('/kitab')
	}
];

const adminNav = [
	{
		label: 'Dashboard',
		href: '/admin/super/overview',
		icon: 'M4 13h7V4H4v9zM13 20h7V4h-7v16zM4 20h7v-5H4v5z',
		description: 'Ringkasan',
		tone: 'from-slate-700 to-emerald-600',
		isActive: (path: string) => path === '/admin/super/overview' || path.startsWith('/admin/super/overview/')
	},
	{
		label: 'CMS',
		href: '/admin/posts',
		icon: 'M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8 7h8M8 10.5h7M8 14h4',
		description: 'Konten',
		tone: 'from-cyan-500 to-blue-500',
		isActive: (path: string) => path === '/admin/posts' || path.startsWith('/admin/posts/')
	},
	{
		label: 'Lisensi',
		href: '/admin/licenses',
		icon: 'M4.5 8V6.5A2.5 2.5 0 017 4h10a2.5 2.5 0 012.5 2.5V8M3.5 9.5h17v8A2.5 2.5 0 0118 20H6a2.5 2.5 0 01-2.5-2.5v-8zM9 14h6M12 11.5v5',
		description: 'Akses',
		tone: 'from-violet-500 to-fuchsia-500',
		isActive: (path: string) => path === '/admin/licenses' || path.startsWith('/admin/licenses/')
	},
	{
		label: 'Akun',
		href: '/akun',
		icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0M18.5 5.5l1.5 1.5M20 5.5L18.5 7',
		description: 'Setting',
		tone: 'from-amber-500 to-orange-500',
		isActive: (path: string) => path.startsWith('/akun')
	}
];

let mobileMenuOpen = false;
let mobileTopMenuOpen: string | null = null;
let previousPathname = '';

const kalenderNavItem = {
	label: 'Kalender',
	href: '/kalender',
	icon: 'M7 3v4M17 3v4M4.5 9.5h15M6 5h12a2.5 2.5 0 012.5 2.5v11A2.5 2.5 0 0118 21H6a2.5 2.5 0 01-2.5-2.5v-11A2.5 2.5 0 016 5zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01',
	description: 'Hijriyah',
	tone: 'from-indigo-500 to-violet-500',
	isActive: (path: string) => path === '/kalender' || path.startsWith('/kalender/')
};

const featureNavItem = {
	label: 'Fitur',
	href: '/fitur',
	icon: 'M12 3l2.1 5.1 5.4.45-4.1 3.55 1.25 5.25L12 14.55 7.35 17.35 8.6 12.1 4.5 8.55l5.4-.45L12 3zM19 15l1 2.2 2.2.3-1.7 1.5.5 2.2-2-1.15-2 1.15.5-2.2-1.7-1.5 2.2-.3L19 15z',
	description: 'Program aktif',
	tone: 'from-fuchsia-500 to-rose-500',
	isActive: (path: string) => path === '/fitur' || path.startsWith('/fitur/')
};

const quranNavItem = {
	label: 'Mushaf',
	href: '/kitab/quran',
	icon: 'M12 6.25v13M12 6.25C10.7 5.45 9.15 5 7.5 5 5.2 5 3.1 5.82 1.5 7.16v11.1c1.6-1.35 3.7-2.16 6-2.16 1.65 0 3.2.45 4.5 1.15M12 6.25C13.3 5.45 14.85 5 16.5 5c2.3 0 4.4.82 6 2.16v11.1c-1.6-1.35-3.7-2.16-6-2.16-1.65 0-3.2.45-4.5 1.15',
	description: 'Al-Qur’an',
	tone: 'from-emerald-600 to-green-500',
	isActive: (path: string) => path === '/kitab/quran' || path.startsWith('/kitab/quran/')
};

const bookNavItem = {
	label: 'Buku',
	href: '/buku',
	icon: 'M4.5 5.25A2.25 2.25 0 016.75 3H20v15.75H7A2.5 2.5 0 004.5 21V5.25zM7 6.75h9.5M7 10.25h8M7 13.75h5.5M4.5 18.75A2.25 2.25 0 016.75 16.5H20',
	description: 'Baca buku digital',
	tone: 'from-emerald-500 to-teal-500',
	isActive: (path: string) => path === '/buku' || (path.startsWith('/buku/') && !path.startsWith('/buku/studio'))
};

const studioNavItem = {
	label: 'Studio',
	href: '/buku/studio',
	icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5zM14 6l4 4M4 7h6M4 11h4',
	description: 'Tulis karya',
	tone: 'from-sky-500 to-cyan-500',
	isActive: (path: string) => path === '/buku/studio' || path.startsWith('/buku/studio/')
};

const coinNavItem = {
	label: 'Coin',
	href: '/coins',
	icon: 'M12 3c4.97 0 9 2.24 9 5s-4.03 5-9 5-9-2.24-9-5 4.03-5 9-5zM3 8v4c0 2.76 4.03 5 9 5s9-2.24 9-5V8M3 12v4c0 2.76 4.03 5 9 5s9-2.24 9-5v-4M12 6.5v3M10.5 8h3',
	description: 'Saldo & top up',
	tone: 'from-amber-400 to-orange-500',
	isActive: (path: string) => path === '/coins' || path.startsWith('/coins/')
};

let mobileTopMenus: MobileTopMenu[] = [];

const mobileExploreLinks = [
	{
		label: 'Semua Fitur',
		href: '/fitur',
		note: 'Program pembinaan aktif',
		tone: 'border-emerald-200 bg-emerald-50 text-so-green'
	},
	{
		label: 'Buku',
		href: '/buku',
		note: 'Buku digital dan bab premium',
		tone: 'border-emerald-200 bg-white text-so-green'
	},
	{
		label: 'Blog',
		href: '/blog',
		note: 'Artikel dan digital store',
		tone: 'border-slate-200 bg-slate-50 text-so-muted'
	},
	{
		label: 'Tokoh',
		href: '/tokoh',
		note: 'Nabi sampai ulama',
		tone: 'border-amber-200 bg-amber-50 text-so-green'
	},
	{
		label: 'Dinasti',
		href: '/dinasti',
		note: 'Peta peradaban Islam',
		tone: 'border-sky-200 bg-sky-50 text-so-green-2'
	},
	{
		label: 'Ormas',
		href: '/ormas',
		note: 'Afiliasi dan asal-usul',
		tone: 'border-emerald-200 bg-emerald-50 text-so-green'
	},
	{
		label: 'Mushaf',
		href: '/kitab/quran',
		note: 'Baca Al-Qur\'an 30 juz',
		tone: 'border-cyan-200 bg-cyan-50 text-cyan-700'
	},
	{
		label: 'Kalender',
		href: '/kalender',
		note: 'Hijriyah dan pasaran',
		tone: 'border-violet-200 bg-violet-50 text-violet-700'
	}
];

const getMobileContextMeta = (path: string) => {
	if (isAdminRoute(path)) {
		return {
			label: 'Super Admin',
			note: 'Panel produk dan operasional'
		};
	}

	if (isAppRoute(path)) {
		return {
			label: 'Dashboard Lembaga',
			note: 'Aktivitas santri, kelas, dan laporan'
		};
	}

	if (path.startsWith('/kitab')) {
		return {
			label: 'Perpustakaan Kitab',
			note: 'Kategori kitab dan belajar per bab'
		};
	}

	if (path === '/tpq' || path.startsWith('/tpq/')) {
		return {
			label: 'Operasional TPQ',
			note: 'Pendaftaran dan profil lembaga'
		};
	}

	if (isTokohMenuActive(path)) {
		return {
			label: 'Tokoh dan Sanad',
			note: 'Nabi, sahabat, tabiin, ulama'
		};
	}

	if (isDynastyMenuActive(path)) {
		return {
			label: 'Dinasti Islam',
			note: 'Peta sejarah dan peradaban'
		};
	}

	if (isOrmasMenuActive(path)) {
		return {
			label: 'Ormas Islam',
			note: 'Afiliasi, asal-usul, dan jaringan dunia'
		};
	}

	if (isBlogMenuActive(path)) {
		return {
			label: 'Blog dan Konten',
			note: 'Artikel, penguatan, dan store'
		};
	}

	if (kalenderNavItem.isActive(path)) {
		return {
			label: 'Kalender Hijriyah',
			note: 'Agenda harian dan pasaran'
		};
	}

	return {
		label: 'Beranda Santri',
		note: 'Ringkasan platform dan fitur aktif'
	};
};

let bookMenuItems: HeaderMenuItem[] = [];
let accountMenuItems: HeaderMenuItem[] = [];

$: bookMenuItems = data?.user ? [...bookPublicMenuItems, ...bookUserMenuItems] : bookPublicMenuItems;
$: accountMenuItems = data?.user
	? [
			{
				label: isSuperAdmin ? 'Admin' : 'Dashboard',
				href: isSuperAdmin ? '/admin/super/overview' : '/dashboard',
				note: isSuperAdmin ? 'Panel super admin' : 'Aktivitas lembaga'
			},
			{
				label: 'Profil',
				href: '/akun',
				note: 'Kelola akun dan preferensi'
			},
			{
				label: 'Saldo Coin',
				href: '/coins',
				note: 'Cek saldo untuk unlock bab'
			},
			{
				label: 'Rak Buku Saya',
				href: '/buku/saya',
				note: 'Bacaan dan bookmark buku'
			},
			{
				label: 'Topup Coin',
				href: '/coins/topup',
				note: 'Tambah coin secara manual'
			}
		]
	: [
			{
				label: 'Login',
				href: '/auth',
				note: 'Masuk ke akun SantriOnline'
			},
			{
				label: 'Daftar',
				href: '/register',
				note: 'Daftarkan lembaga atau gabung sebagai anggota'
			}
		];

$: mobileTopMenus = [
	{
		id: 'daftar',
		label: 'Daftar',
		compact: false,
		isActive: (path: string) => isRegisterMenuActive(path),
		items: [
			{
				label: 'Daftarkan Lembaga',
				href: '/register',
				note: 'Pilih jenis lembaga dan buat ruang kerja pengelola.'
			},
			...institutionRegisterMenuItems,
			{
				label: 'Daftar sebagai Santri/Jamaah',
				href: '/register',
				note: 'Cari lembaga aktif, lalu daftar lewat halaman lembaga.'
			},
			...memberRegisterMenuItems
		],
		footerHref: '/register',
		footerLabel: 'Buka halaman daftar'
	},
	{
		id: 'buku',
		label: 'Buku',
		compact: Boolean(data?.user),
		isActive: (path: string) => isBookMenuActive(path),
		items: bookMenuItems,
		footerHref: '/buku',
		footerLabel: 'Buka Buku Digital'
	},
	{
		id: 'belajar',
		label: 'Belajar',
		compact: false,
		isActive: (path: string) => isLearningMenuActive(path),
		items: learningMenuItems,
		footerHref: '/kitab',
		footerLabel: 'Buka perpustakaan'
	},
	{
		id: 'fitur',
		label: 'Fitur',
		compact: false,
		isActive: (path: string) => featureNavItem.isActive(path),
		items: FEATURES.map((feature) => ({
			label: feature.title,
			href: `/fitur/${feature.slug}`,
			note: feature.desc
		})),
		footerHref: '/fitur',
		footerLabel: 'Lihat semua fitur'
	},
	{
		id: 'tokoh',
		label: 'Tokoh',
		compact: false,
		isActive: (path: string) => isTokohMenuActive(path),
		items: [
			{
				label: 'Overview Tokoh',
				href: '/tokoh',
				note: 'Nabi, sahabat, tabiin, ulama'
			},
			...tokohMenuItems.map((item) => ({
				label: item.label,
				href: item.href,
				note: item.note
			}))
		],
		footerHref: '/tokoh',
		footerLabel: 'Jelajahi tokoh'
	},
	{
		id: 'dinasti',
		label: 'Dinasti',
		compact: true,
		isActive: (path: string) => isDynastyMenuActive(path),
		items: primaryDynastyMenuItems.map((item) => ({
			label: item.label,
			href: item.href,
			note: item.note
		})),
		footerHref: '/dinasti',
		footerLabel: 'Lihat semua dinasti'
	},
	...(isSuperAdmin
		? [
				{
					id: 'admin',
					label: 'Admin',
					compact: false,
					isActive: (path: string) => isAdminRoute(path),
					items: adminBookMenuItems,
					footerHref: '/admin/super/overview',
					footerLabel: 'Buka panel admin'
				}
			]
		: [])
];

$: isAppRouteActive = isAppRoute(pathname);
$: isAdminRouteActive = isAdminRoute(pathname);
$: mobileContext = getMobileContextMeta(pathname);
$: mobilePrimaryAction = data?.user
	? {
			href: isSuperAdmin ? '/admin/super/overview' : '/dashboard',
			label: isSuperAdmin ? 'Admin' : 'Dashboard',
			note: isSuperAdmin ? 'Buka panel super admin' : 'Lanjutkan aktivitas'
		}
	: {
			href: '/auth',
			label: 'Masuk',
			note: 'Login ke akun'
		};
$: mobileSecondaryAction = data?.user
	? {
			href: '/akun',
			label: 'Profil',
			note: 'Kelola akun dan preferensi'
		}
	: {
			href: '/register',
			label: 'Daftar',
			note: 'Lembaga atau santri'
		};
$: mobileHeroActions = [
	{
		...mobilePrimaryAction,
		tone: 'from-slate-950 via-slate-900 to-emerald-950 text-white'
	},
	{
		...mobileSecondaryAction,
		tone: 'from-emerald-500 via-teal-500 to-cyan-500 text-white'
	}
];
type MobileTabItem = {
	label: string;
	href: string;
	icon: string;
	description?: string;
	tone?: string;
	isActive: (path: string) => boolean;
};

let mobilePublicTabs: MobileTabItem[] = [];
$: activeMobileTopMenu = mobileTopMenus.find((menu) => menu.id === mobileTopMenuOpen) ?? null;
$: mobilePublicTabs = data?.user
	? [
			bookNavItem,
			studioNavItem,
			coinNavItem,
			{
				label: isSuperAdmin ? 'Admin' : 'Dashboard',
				href: isSuperAdmin ? '/admin/super/overview' : '/dashboard',
				icon: isSuperAdmin
					? 'M12 3l7 3v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6l7-3zM9 12l2 2 4-4M8 7.5h8'
					: 'M4 13h7V4H4v9zM13 20h7V4h-7v16zM4 20h7v-5H4v5z',
				description: isSuperAdmin ? 'Panel kontrol' : 'Aktivitas belajar',
				tone: isSuperAdmin ? 'from-violet-500 to-fuchsia-500' : 'from-slate-700 to-emerald-600',
				isActive: (path: string) =>
					isSuperAdmin ? isAdminRoute(path) : path === '/dashboard' || path.startsWith('/dashboard/')
			}
		]
	: [
			baseNav[0],
			bookNavItem,
			{ ...quranNavItem, label: 'Belajar' },
			baseNav[2],
			{
				label: 'Daftar',
				href: '/register',
				icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0M16 8h4m-2-2v4',
				isActive: (path: string) => isRegisterMenuActive(path)
			}
		];
$: if (pathname !== previousPathname) {
	previousPathname = pathname;
	mobileMenuOpen = false;
	mobileTopMenuOpen = null;
}
</script>

<svelte:head>
	<meta name="google-site-verification" content="vyZh4AQIE37XnqZCsPo_qfSKT7F1NRQdPYh8sPIDRFw" />
</svelte:head>

<UmamiAnalytics />
<ClarityAnalytics />
<CookieConsent />
<SeoHead canonical={pathname} noindex={isAdminRouteActive || isAppRouteActive || pathname.startsWith('/auth') || pathname.startsWith('/akun')} />
<SchemaOrg type="website" />
<SchemaOrg type="organization" />

<div class="min-h-screen bg-base-100">
	{#if !hidePageChrome}
	<header
		class={`sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl transition-transform duration-300 ease-in-out will-change-transform ${
			shouldHideMobileChrome ? '-translate-y-full' : 'translate-y-0'
		}`}
	>
		<div class="md:hidden border-b border-white/60 bg-gradient-to-br from-emerald-50/90 via-white to-cyan-50/80">
			<div class="container mx-auto max-w-6xl px-4 py-3">
				<div class="rounded-[1.8rem] border border-white/70 bg-white/90 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
					<div class="flex items-start justify-between gap-3">
						<a href="/" class="flex min-w-0 items-center gap-3">
							<img
								src="https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png"
								alt="Logo SantriOnline - Platform Manajemen Lembaga Islam"
								class="h-12 w-12 shrink-0 object-contain"
								loading="lazy"
							/>
							<div class="min-w-0">
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Santri Online</p>
								<p class="truncate text-sm font-semibold text-so-ink">{mobileContext.label}</p>
								<p class="truncate text-xs text-slate-500">{mobileContext.note}</p>
							</div>
						</a>

						<div class="flex items-center gap-2">
							<a
								href={mobilePrimaryAction.href}
								class="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-so-green shadow-sm"
							>
								{mobilePrimaryAction.label}
							</a>
							<button
								type="button"
								class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-so-muted shadow-sm transition hover:border-emerald-200 hover:text-so-green"
								aria-label="Buka menu mobile"
								on:click={() => (mobileMenuOpen = true)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
								</svg>
							</button>
						</div>
					</div>

					<div class="mobile-scroll-row mt-3 flex gap-2 overflow-x-auto pb-1">
						{#each mobileTopMenus as menu}
							<button
								type="button"
								class="mobile-top-trigger shrink-0"
								class:mobile-top-trigger-active={menu.isActive(pathname) || mobileTopMenuOpen === menu.id}
								aria-expanded={mobileTopMenuOpen === menu.id}
								on:click={() => (mobileTopMenuOpen = mobileTopMenuOpen === menu.id ? null : menu.id)}
							>
								<span>{menu.label}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									class="h-4 w-4 transition"
									class:rotate-180={mobileTopMenuOpen === menu.id}
								>
									<path
										fill-rule="evenodd"
										d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/each}
					</div>

					{#if activeMobileTopMenu}
						<div class="mt-3 overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
							<div class="mobile-top-dropdown-scroll">
								<div class="mobile-top-dropdown-grid" class:mobile-top-dropdown-grid-compact={activeMobileTopMenu.compact}>
									{#each activeMobileTopMenu.items as item}
										<a
											href={item.href}
											class="mobile-top-dropdown-link"
											class:mobile-top-dropdown-link-compact={activeMobileTopMenu.compact}
											on:click={() => (mobileTopMenuOpen = null)}
										>
											<p class="text-sm font-semibold text-slate-900">{item.label}</p>
											<p class="mt-1 text-xs leading-5 text-slate-500" class:mobile-top-dropdown-note-compact={activeMobileTopMenu.compact}>{item.note}</p>
										</a>
									{/each}
								</div>
							</div>
							<div class="mt-2 border-t border-slate-200/80 pt-2">
								<a
									href={activeMobileTopMenu.footerHref}
									class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-so-green"
									on:click={() => (mobileTopMenuOpen = null)}
								>
									{activeMobileTopMenu.footerLabel}
									<span>→</span>
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

			<div class="hidden md:block">
				<div class="container mx-auto max-w-6xl px-4 py-2">
					<div class="flex flex-wrap items-center gap-3">
						<a href="/" class="flex shrink-0 items-center gap-2">
							<img src="/logo-santri.png" alt="Santri Online" class="h-8 w-auto" loading="lazy" />
						</a>
						<nav class="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
							<a href="/" class="desktop-nav-link" class:desktop-nav-link-active={pathname === '/'}>Beranda</a>

							<div class="group relative">
								<a href="/kitab" class="desktop-nav-link" class:desktop-nav-link-active={isLearningMenuActive(pathname)}>
									Belajar
								</a>
								<div class="desktop-dropdown w-80">
									<div class="desktop-dropdown-panel">
										{#each learningMenuItems as item}
										<a href={item.href} class="desktop-dropdown-item">
											<span class="font-semibold text-slate-900">{item.label}</span>
											<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
										</a>
									{/each}
								</div>
							</div>
						</div>

							<div class="group relative">
								<a href="/buku" class="desktop-nav-link" class:desktop-nav-link-active={isBookMenuActive(pathname)}>
									Buku
								</a>
								<div class="desktop-dropdown w-80">
									<div class="desktop-dropdown-panel">
									<a href="/buku" class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm transition hover:bg-emerald-100">
										<p class="font-semibold text-emerald-900">Baca Buku</p>
										<p class="mt-1 text-xs leading-5 text-so-green">Bab gratis dan premium pakai coin.</p>
									</a>
									<div class="mt-2 grid gap-1">
										{#each bookMenuItems as item}
											<a href={item.href} class="desktop-dropdown-item">
												<span class="font-semibold text-slate-900">{item.label}</span>
												<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
											</a>
										{/each}
									</div>
								</div>
							</div>
						</div>

							<a href="/blog" class="desktop-nav-link" class:desktop-nav-link-active={isBlogMenuActive(pathname)}>Blog</a>

							{#if isSuperAdmin}
								<div class="group relative">
									<a href="/admin/super/overview" class="desktop-nav-link" class:desktop-nav-link-active={isAdminRoute(pathname)}>
										Admin
									</a>
									<div class="desktop-dropdown right-0 w-80">
									<div class="desktop-dropdown-panel">
										<a href="/admin/super/overview" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:bg-slate-100">
											<p class="font-semibold text-slate-900">Panel Super Admin</p>
											<p class="mt-1 text-xs leading-5 text-slate-500">Overview operasional platform.</p>
										</a>
										<div class="mt-2 grid gap-1">
											{#each adminBookMenuItems as item}
												<a href={item.href} class="desktop-dropdown-item">
													<span class="font-semibold text-slate-900">{item.label}</span>
													<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
												</a>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</nav>
						<div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
							<a href="/coins/topup" class="btn btn-sm btn-primary">Topup Coin</a>
							<div class="group relative">
								<a href="/akun" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Akun</a>
								<div class="desktop-dropdown right-0 w-72">
									<div class="desktop-dropdown-panel">
										{#each accountMenuItems as item}
											<a href={item.href} class="desktop-dropdown-item">
												<span class="font-semibold text-slate-900">{item.label}</span>
												<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
											</a>
										{/each}
										{#if isImpersonating}
											<a href="/admin/super/impersonate/stop" class="desktop-dropdown-item border-amber-100 bg-amber-50 text-amber-800">
												<span class="font-semibold">Keluar Mode Admin</span>
												<span class="mt-1 text-xs leading-5">Kembali ke konteks super admin.</span>
											</a>
										{/if}
										<form method="POST" action="/logout" class="mt-2 border-t border-slate-100 pt-2">
											<button type="submit" class="w-full rounded-xl bg-rose-50 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
												Logout
											</button>
										</form>
									</div>
								</div>
							</div>
						{:else}
							<a href="/auth" class="btn btn-sm btn-ghost text-primary hover:bg-primary/10">Login</a>
							<div class="group relative">
								<a
									href="/register"
									class="btn btn-sm btn-primary"
									class:desktop-nav-link-active={isRegisterMenuActive(pathname)}
								>
									Daftar
								</a>
								<div class="desktop-dropdown right-0 w-[28rem]">
									<div class="desktop-dropdown-panel">
										<div class="grid gap-3 md:grid-cols-2">
											<div class="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
												<p class="text-sm font-semibold text-emerald-950">Daftarkan Lembaga</p>
												<p class="mt-1 text-xs leading-5 text-so-green">
													Untuk admin TPQ, pondok, masjid, musholla, atau rumah tahfidz.
												</p>
												<div class="mt-2 grid gap-1">
													{#each institutionRegisterMenuItems as item}
														<a href={item.href} class="desktop-dropdown-item bg-white/90">
															<span class="font-semibold text-slate-900">{item.label}</span>
															<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
														</a>
													{/each}
												</div>
											</div>

											<div class="rounded-2xl border border-slate-200 bg-white p-3">
												<p class="text-sm font-semibold text-so-ink">Daftar sebagai Santri/Jamaah</p>
												<p class="mt-1 text-xs leading-5 text-slate-500">
													Pilih lembaga aktif, lalu gunakan halaman pendaftaran anggotanya.
												</p>
												<div class="mt-2 grid gap-1">
													{#each memberRegisterMenuItems as item}
														<a href={item.href} class="desktop-dropdown-item">
															<span class="font-semibold text-slate-900">{item.label}</span>
															<span class="mt-1 text-xs leading-5 text-slate-500">{item.note}</span>
														</a>
													{/each}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</header>
	{/if}

	{#if mobileMenuOpen}
		<div class="fixed inset-0 z-[55] md:hidden">
			<button
				type="button"
				class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
				aria-label="Tutup menu mobile"
				on:click={() => (mobileMenuOpen = false)}
			></button>

			<div class="absolute inset-x-0 top-0 max-h-[calc(100vh-0.5rem)] overflow-y-auto rounded-b-[2rem] border-b border-slate-200/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
				<div class="bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 px-4 pb-5 pt-4 text-white">
					<div class="flex items-start justify-between gap-3">
						<div class="max-w-[15rem]">
							<p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Navigasi Mobile</p>
							<h2 class="mt-2 text-2xl font-semibold">Menu cepat ala app</h2>
							<p class="mt-2 text-sm leading-6 text-white/80">
								Akses modul utama, fitur pembinaan, dan kategori kitab tanpa keluar dari pola mobile.
							</p>
						</div>
						<button
							type="button"
							class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
							aria-label="Tutup menu mobile"
							on:click={() => (mobileMenuOpen = false)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
							</svg>
						</button>
					</div>

					<div class="mt-5 grid grid-cols-2 gap-3">
						{#each mobileHeroActions as action}
							<a
								href={action.href}
								class={`rounded-[1.5rem] bg-gradient-to-br px-4 py-4 shadow-lg ${action.tone}`}
							>
								<p class="text-sm font-semibold">{action.label}</p>
								<p class="mt-2 text-xs leading-5 text-white/80">{action.note}</p>
							</a>
						{/each}
					</div>
				</div>

				<div class="space-y-6 px-4 py-5">
					{#if !data.user}
						<section>
							<div class="mb-3">
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Daftar</p>
								<h3 class="mt-1 text-lg font-semibold text-so-ink">Pilih jalur pendaftaran</h3>
							</div>

							<div class="grid gap-3">
								<div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4">
									<p class="text-sm font-semibold text-emerald-950">Daftarkan Lembaga</p>
									<p class="mt-1 text-xs leading-5 text-so-green">
										Untuk admin TPQ, pondok, masjid, musholla, dan rumah tahfidz.
									</p>
									<div class="mt-3 grid gap-2">
										{#each institutionRegisterMenuItems as item}
											<a href={item.href} class="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
												{item.label}
											</a>
										{/each}
									</div>
								</div>

								<div class="rounded-[1.5rem] border border-slate-200/80 bg-white p-4">
									<p class="text-sm font-semibold text-so-ink">Daftar sebagai Santri/Jamaah</p>
									<p class="mt-1 text-xs leading-5 text-slate-500">
										Pilih direktori lembaga dulu, lalu gunakan tautan pendaftaran anggota.
									</p>
									<div class="mt-3 grid gap-2">
										{#each memberRegisterMenuItems as item}
											<a href={item.href} class="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm font-semibold text-so-muted shadow-sm">
												{item.label}
											</a>
										{/each}
									</div>
								</div>
							</div>
						</section>
					{/if}

					<section>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div>
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Jalur cepat</p>
								<h3 class="mt-1 text-lg font-semibold text-so-ink">Area utama produk</h3>
							</div>
							<a href="/fitur" class="text-xs font-semibold uppercase tracking-[0.18em] text-so-green">Semua fitur</a>
						</div>

						<div class="grid grid-cols-2 gap-3">
							{#each mobileExploreLinks as item}
								<a href={item.href} class="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
									<span class={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${item.tone}`}>
										{item.label}
									</span>
									<p class="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
								</a>
							{/each}
						</div>
					</section>

					<section>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div>
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Buku dan coin</p>
								<h3 class="mt-1 text-lg font-semibold text-so-ink">Buku Digital SantriOnline</h3>
							</div>
							<a href="/buku" class="text-xs font-semibold uppercase tracking-[0.18em] text-so-green">Buka buku</a>
						</div>

						<div class="grid grid-cols-2 gap-3">
							{#each bookMenuItems as item}
								<a href={item.href} class="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-sm font-semibold text-emerald-950">{item.label}</p>
									<p class="mt-2 text-xs leading-5 text-so-green">{item.note}</p>
								</a>
							{/each}
						</div>
					</section>

					{#if isSuperAdmin}
						<section>
							<div class="mb-3">
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Admin</p>
								<h3 class="mt-1 text-lg font-semibold text-so-ink">Buku, royalti, dan topup</h3>
							</div>

							<div class="space-y-2">
								{#each adminBookMenuItems.slice(0, 3) as item}
									<a href={item.href} class="flex items-start gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
										<span class="mt-0.5 text-xl">▣</span>
										<div class="min-w-0">
											<p class="text-sm font-semibold text-slate-900">{item.label}</p>
											<p class="mt-1 text-sm leading-6 text-slate-500">{item.note}</p>
										</div>
									</a>
								{/each}
							</div>
						</section>
					{/if}

					<section>
						<div class="mb-3">
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Program pembinaan</p>
							<h3 class="mt-1 text-lg font-semibold text-so-ink">Fitur aktif</h3>
						</div>

						<div class="space-y-2">
							{#each FEATURES as feature}
								<a
									href={`/fitur/${feature.slug}`}
									class="flex items-start gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
								>
									<span class="mt-0.5 text-2xl">{feature.icon}</span>
									<div class="min-w-0">
										<p class="text-sm font-semibold text-slate-900">{feature.title}</p>
										<p class="mt-1 text-sm leading-6 text-slate-500">{feature.desc}</p>
									</div>
								</a>
							{/each}
						</div>
					</section>

					<section>
						<div class="mb-3">
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Kategori kitab</p>
							<h3 class="mt-1 text-lg font-semibold text-so-ink">Masuk langsung ke kitab</h3>
						</div>

						<div class="grid grid-cols-2 gap-3">
							{#each kitabMenuItems as item}
								<a href={item.href} class="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-sm font-semibold text-slate-900">{item.label}</p>
									<p class="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
								</a>
							{/each}
						</div>
					</section>

					<section class="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4">
						<div class="mb-3 flex items-center gap-2">
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
							<div>
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Bahasa tampilan</p>
								<p class="text-sm font-semibold text-slate-900">Terjemahkan halaman bila perlu</p>
							</div>
						</div>

						<SearchableSelect
							options={languageOptionsWithFlags}
							bind:value={selectedLanguage}
							placeholder="Pilih Bahasa"
							searchPlaceholder="Cari bahasa..."
							emptyText="Bahasa tidak ditemukan"
							wrapperClass="w-full"
							inputClass="h-11 text-sm"
							on:change={handleLanguageChange}
						/>
					</section>

					<section class="space-y-3">
						<div>
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-so-green">Akun dan akses</p>
							<h3 class="mt-1 text-lg font-semibold text-so-ink">Langkah berikutnya</h3>
						</div>

						<div class="grid gap-3">
							<a href="/kalender" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-so-muted shadow-sm">
								Buka Kalender
							</a>

							{#if data.user}
								<a href="/akun" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-so-muted shadow-sm">
									Kelola Profil
								</a>
								{#if isImpersonating}
									<a href="/admin/super/impersonate/stop" class="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-so-green shadow-sm">
										Keluar Mode Admin
									</a>
								{/if}
								<form method="POST" action="/logout">
									<button type="submit" class="w-full rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
										Logout
									</button>
								</form>
							{:else}
								<a href="/auth" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-so-muted shadow-sm">
									Login
								</a>
								<a href="/register" class="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-so-green shadow-sm">
									Daftarkan Lembaga
								</a>
								<a href="/tpq" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-so-muted shadow-sm">
									Daftar sebagai Santri/Jamaah
								</a>
							{/if}
						</div>
					</section>
				</div>
			</div>
		</div>
	{/if}

	<main
		class={hidePageChrome || usesStandalonePageContainer
			? 'min-h-screen'
			: 'container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-10'}
	>
		<slot />
	</main>

	{#if !hidePageChrome}
	<footer class="border-t border-slate-200 bg-white pb-safe">
			<div class="container mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
				<div>
					<a href="/" class="inline-flex items-center gap-2">
						<img src="/logo-santri.png" alt="SantriOnline" class="h-8 w-auto" loading="lazy" />
						<span class="text-sm font-semibold text-so-ink">SantriOnline</span>
					</a>
					<p class="mt-3 max-w-xl text-sm leading-6 text-slate-500">
						Platform ekosistem pesantren digital untuk belajar Islam, kitab, buku, hafalan, dan manajemen lembaga.
					</p>
				</div>
				<nav aria-label="Footer" class="grid gap-2 text-sm font-semibold text-so-muted sm:grid-cols-2 md:min-w-[22rem]">
					<a href="/tentang" class="hover:text-so-green">Tentang SantriOnline</a>
					<a href="/kontak" class="hover:text-so-green">Kontak</a>
					<a href="/privacy" class="hover:text-so-green">Kebijakan Privasi</a>
					<a href="/syarat" class="hover:text-so-green">Syarat dan Ketentuan</a>
					<a href="/buku" class="hover:text-so-green">Buku Digital</a>
					<a href="/blog" class="hover:text-so-green">Blog SantriOnline</a>
				</nav>
			</div>
		</footer>
	{/if}

	<!-- Bottom nav (mobile) - Always show for logged-in users -->
	{#if data?.user && !hideMobileBottomNavigation}
		<nav
			class={`pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden safe-area-bottom transition-transform duration-300 ease-in-out will-change-transform ${
				shouldHideMobileChrome ? 'translate-y-full' : 'translate-y-0'
			}`}
		>
			<div class="mx-auto max-w-xl px-3 py-3 pb-safe">
				<div class="pointer-events-auto mobile-bottom-shell rounded-[1.7rem] border border-white/80 bg-white/95 p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
					{#if isAdminRouteActive && isSuperAdmin}
						<div class="grid grid-cols-4 gap-1">
							{#each adminNav as item}
								<a
									href={item.href}
									class="mobile-tab-link"
									class:mobile-tab-link-active={item.isActive(pathname)}
									aria-current={item.isActive(pathname) ? 'page' : undefined}
									aria-label={`${item.label}: ${item.description ?? 'Buka halaman'}`}
								>
									<span class={`mobile-tab-icon bg-gradient-to-br ${item.tone ?? 'from-emerald-500 to-cyan-500'}`}>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.85">
											<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</span>
									<span class="leading-none text-[10.5px] font-extrabold tracking-[-0.01em]">{item.label}</span>
									<span class="mobile-tab-hint">{item.description ?? 'Buka'}</span>
								</a>
							{/each}
						</div>
					{:else}
						<!-- Presisi: exactly four priority actions for logged-in users -->
						<div class="grid grid-cols-4 items-stretch gap-1">
							{#each mobilePublicTabs as item}
								<a
									href={item.href}
									class="mobile-tab-link"
									class:mobile-tab-link-active={item.isActive(pathname)}
									aria-current={item.isActive(pathname) ? 'page' : undefined}
									aria-label={`${item.label}: ${item.description ?? 'Buka halaman'}`}
								>
									<span class={`mobile-tab-icon bg-gradient-to-br ${item.tone ?? 'from-emerald-500 to-cyan-500'}`}>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.85">
											<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</span>
									<span class="leading-none text-[10.5px] font-extrabold tracking-[-0.01em]">{item.label}</span>
									<span class="mobile-tab-hint">{item.description ?? 'Buka'}</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</nav>
	{:else if !data?.user && !hideMobileBottomNavigation && !hidePageChrome && !isAppRouteActive && !isAdminRouteActive}
		<!-- Bottom nav for non-logged-in users -->
		<nav
			class={`pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden safe-area-bottom transition-transform duration-300 ease-in-out will-change-transform ${
				shouldHideMobileChrome ? 'translate-y-full' : 'translate-y-0'
			}`}
		>
			<div class="mx-auto max-w-xl px-3 py-3 pb-safe">
				<div class="pointer-events-auto mobile-bottom-shell rounded-[1.7rem] border border-white/80 bg-white/95 p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
					<div class={`grid gap-1 ${mobilePublicTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
						{#each mobilePublicTabs as item}
							<a
								href={item.href}
								class="mobile-tab-link"
								class:mobile-tab-link-active={item.isActive(pathname)}
								aria-current={item.isActive(pathname) ? 'page' : undefined}
								aria-label={`${item.label}: ${item.description ?? 'Buka halaman'}`}
							>
								<span class={`mobile-tab-icon bg-gradient-to-br ${item.tone ?? 'from-emerald-500 to-cyan-500'}`}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.85">
										<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span class="leading-none text-[10.5px] font-extrabold tracking-[-0.01em]">{item.label}</span>
								<span class="mobile-tab-hint">{item.description ?? 'Buka'}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		</nav>
	{/if}

	{#if showInstallPopup}
		<div
			class="fixed inset-0 z-[60] flex items-end justify-center px-2 py-2 sm:items-center sm:px-4"
		>
			<button
				type="button"
				class="absolute inset-0 bg-so-green-3/55 backdrop-blur-sm"
				aria-label="Tutup popup instalasi"
				on:click={() => dismissInstallPopup()}
			></button>
			<div
				class="relative w-full max-w-[18.5rem] overflow-hidden rounded-2xl border border-so-border bg-so-surface shadow-soft sm:max-w-sm"
				role="dialog"
				aria-modal="true"
				aria-labelledby="install-dialog-title"
				tabindex="0"
				on:keydown={handleInstallDialogKey}
			>
				<button
					type="button"
					class="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-so-border bg-so-surface/95 text-so-muted shadow-sm transition hover:bg-so-cream"
					on:click={() => dismissInstallPopup()}
					aria-label="Tutup"
				>
					<X class="h-3 w-3" />
				</button>
				<div class="bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.28),transparent_38%),linear-gradient(135deg,#0f2f24,#1b4332_48%,#2d6a4f)] px-3 pb-3 pt-3 text-white sm:px-4">
					<div class="flex items-start gap-2.5 pr-8">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/12 p-1.5 shadow-md shadow-so-green-3/20">
							<img src="/icons/icon-192.png" alt="" class="h-6 w-6 rounded-md" loading="lazy" />
						</div>
						<div class="min-w-0">
							<p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-so-gold-2">
								{deferredInstallPrompt ? 'Siap diinstall' : installMode === 'ios' ? 'iOS dan iPadOS' : 'Android resmi'}
							</p>
							<h2 id="install-dialog-title" class="mt-1 text-base font-semibold leading-tight sm:text-lg">
								Pasang Santri Online di layar utama
							</h2>
							<p class="mt-1.5 text-[11px] leading-4 text-white/85 sm:text-xs">
								Akses hafalan, kitab, buku digital, kalender, dan dashboard lembaga dengan pengalaman yang terasa seperti aplikasi.
							</p>
						</div>
					</div>

					<div class="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold text-so-green-3">
						<span class="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5">
							<BadgeCheck class="h-2.5 w-2.5" />
							Resmi
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5">
							<RefreshCw class="h-2.5 w-2.5" />
							Auto update
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5">
							<Wifi class="h-2.5 w-2.5" />
							Cache ringan
						</span>
					</div>
				</div>

				<div class="max-h-[calc(100vh-10rem)] min-h-0 overflow-y-auto px-3 py-3 sm:max-h-[calc(100vh-7rem)] sm:px-4">
					<div class="grid gap-2 sm:grid-cols-3">
						<div class="rounded-lg border border-so-border bg-so-cream p-2">
							<Smartphone class="h-3.5 w-3.5 text-so-green" />
							<p class="mt-1.5 text-[11px] font-semibold text-so-ink">Shortcut app</p>
							<p class="mt-0.5 text-[10px] leading-3.5 text-so-muted">Buka dari home screen.</p>
						</div>
						<div class="rounded-lg border border-so-border bg-so-surface p-2">
							<RefreshCw class="h-3.5 w-3.5 text-so-green-2" />
							<p class="mt-1.5 text-[11px] font-semibold text-so-ink">Versi terbaru</p>
							<p class="mt-0.5 text-[10px] leading-3.5 text-so-muted">Update otomatis.</p>
						</div>
						<div class="rounded-lg border border-so-gold/30 bg-so-gold-2/25 p-2">
							<BadgeCheck class="h-3.5 w-3.5 text-so-green" />
							<p class="mt-1.5 text-[11px] font-semibold text-so-ink">Akses aman</p>
							<p class="mt-0.5 text-[10px] leading-3.5 text-so-muted">Install resmi.</p>
						</div>
					</div>

					<div class="mt-2.5 rounded-lg border border-so-border bg-so-cream p-2.5">
						{#if deferredInstallPrompt}
							<p class="text-xs font-semibold text-so-ink">Install langsung dari browser</p>
							<p class="mt-1 text-[11px] leading-4 text-so-muted">
								Klik tombol install, lalu konfirmasi pada prompt bawaan Chrome, Edge, atau browser Chromium lain.
							</p>
						{:else if installMode === 'ios'}
							<div class="flex items-start gap-2.5">
								<Share2 class="mt-0.5 h-4 w-4 shrink-0 text-so-muted" />
								<div>
									<p class="text-xs font-semibold text-so-ink">Untuk Safari iPhone atau iPad</p>
									<p class="mt-1 text-[11px] leading-4 text-so-muted">
										Buka menu Bagikan, pilih “Add to Home Screen”, lalu simpan Santri Online.
									</p>
								</div>
							</div>
						{:else}
							<p class="text-xs font-semibold text-so-ink">Fallback Android tersedia</p>
							<p class="mt-1 text-[11px] leading-4 text-so-muted">
								Jika tombol install bawaan browser belum muncul, gunakan APK resmi Santri Online khusus Android.
							</p>
						{/if}
					</div>

					<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
						{#if deferredInstallPrompt}
							<button
								type="button"
								class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-so-green px-4 text-sm font-bold text-white shadow-lg shadow-so-green/20 transition hover:bg-so-green-3 disabled:cursor-wait disabled:bg-so-green/70 sm:h-11"
								on:click={handleNativeInstall}
								disabled={installActionBusy}
							>
								<Download class="h-4 w-4" />
								{installActionBusy ? 'Membuka prompt...' : 'Install dari Browser'}
							</button>
						{:else if installMode === 'android'}
							<a
								href={apkUrl}
								class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-so-green px-4 text-sm font-bold text-white shadow-lg shadow-so-green/20 transition hover:bg-so-green-3 sm:h-11"
								target="_blank"
								rel="noopener"
								on:click={() => dismissInstallPopup('dismiss')}
							>
								<Download class="h-4 w-4" />
								Unduh APK Android
							</a>
						{:else}
							<button
								type="button"
								class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-so-green px-4 text-sm font-bold text-white shadow-lg shadow-so-green/20 transition hover:bg-so-green-3 sm:h-11"
								on:click={() => dismissInstallPopup('dismiss')}
							>
								<Smartphone class="h-4 w-4" />
								Saya mengerti
							</button>
						{/if}

						<button
							type="button"
							class="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-so-muted transition hover:border-emerald-200 hover:text-so-green"
							on:click={() => dismissInstallPopup('snooze')}
						>
							Nanti saja
						</button>
					</div>

					<p class="mt-2.5 text-[10px] leading-4 text-slate-500">
						Popup ini akan disembunyikan sementara setelah dipilih “Nanti saja”, dan tidak muncul lagi setelah aplikasi terpasang.
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

	.desktop-nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		white-space: nowrap;
		border-radius: 999px;
		border: 1px solid transparent;
		padding: 0.62rem 0.95rem;
		font-size: 0.88rem;
		font-weight: 700;
		color: #475569;
		transition:
			background-color 0.18s ease,
			color 0.18s ease,
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			transform 0.18s ease;
	}

	.desktop-nav-link:hover,
	.desktop-nav-link-active {
		border-color: rgba(16, 185, 129, 0.16);
		background: linear-gradient(135deg, rgba(236, 253, 245, 0.96), rgba(240, 253, 250, 0.96));
		color: #047857;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
	}

	.desktop-nav-link:not(.desktop-nav-link-active):hover {
		transform: translateY(-1px);
	}

	.desktop-dropdown {
		pointer-events: none;
		visibility: hidden;
		position: absolute;
		top: 100%;
		z-index: 30;
		min-width: 18rem;
		padding-top: 0.7rem;
		opacity: 0;
		transition: opacity 0.15s ease, visibility 0.15s ease;
	}

	.group:hover .desktop-dropdown,
	.group:focus-within .desktop-dropdown {
		pointer-events: auto;
		visibility: visible;
		opacity: 1;
	}

	.desktop-dropdown:not(.right-0) {
		left: 50%;
		transform: translateX(-50%);
	}

	.desktop-dropdown-panel {
		max-height: min(72vh, 34rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		border-radius: 1.35rem;
		border: 1px solid rgba(226, 232, 240, 0.9);
		background: rgba(255, 255, 255, 0.98);
		padding: 0.65rem;
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
		backdrop-filter: blur(18px);
		scrollbar-gutter: stable;
	}

	.desktop-dropdown-panel::-webkit-scrollbar {
		width: 0.45rem;
	}

	.desktop-dropdown-panel::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.65);
	}

	.desktop-dropdown-item {
		display: flex;
		flex-direction: column;
		border-radius: 0.9rem;
		padding: 0.78rem 0.9rem;
		font-size: 0.875rem;
		color: #475569;
		transition: background-color 0.18s ease, color 0.18s ease;
	}

	.desktop-dropdown-item:hover {
		background: rgba(236, 253, 245, 0.88);
		color: #047857;
	}

	.mobile-scroll-row {
		scroll-snap-type: x proximity;
		scroll-padding-inline: 0.15rem;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.mobile-scroll-row::-webkit-scrollbar {
		display: none;
	}

	.mobile-top-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		flex: 0 0 auto;
		scroll-snap-align: start;
		white-space: nowrap;
		border-radius: 999px;
		border: 1px solid rgba(226, 232, 240, 1);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
		padding: 0.64rem 0.92rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #475569;
		box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
		transition:
			background-color 0.18s ease,
			color 0.18s ease,
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			transform 0.18s ease;
	}

	.mobile-top-trigger-active {
		border-color: rgba(16, 185, 129, 0.24);
		background: linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(240, 253, 250, 0.98));
		color: #047857;
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
	}

	.mobile-top-dropdown-scroll {
		max-height: min(55svh, 26rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 0.2rem;
		scrollbar-gutter: stable;
	}

	.mobile-top-dropdown-scroll::-webkit-scrollbar {
		width: 0.35rem;
	}

	.mobile-top-dropdown-scroll::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.7);
	}

	.mobile-top-dropdown-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.mobile-top-dropdown-grid {
		display: grid;
		align-items: stretch;
		gap: 0.5rem;
	}

	.mobile-top-dropdown-grid-compact {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: 1fr;
		gap: 0.45rem;
	}

	.mobile-top-dropdown-link {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 6.2rem;
		border-radius: 1.1rem;
		border: 1px solid rgba(226, 232, 240, 0.72);
		background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.98));
		padding: 0.8rem;
		transition:
			background-color 0.18s ease,
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			transform 0.18s ease;
	}

	.mobile-top-dropdown-link:hover {
		border-color: rgba(16, 185, 129, 0.24);
		background: linear-gradient(180deg, rgba(236, 253, 245, 0.82), rgba(255, 255, 255, 0.98));
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
		transform: translateY(-1px);
	}

	.mobile-top-dropdown-link-compact {
		min-height: 4.3rem;
		border-radius: 0.95rem;
		padding: 0.68rem 0.7rem;
	}

	.mobile-top-dropdown-note-compact {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		line-height: 1.05rem;
	}

	@media (min-width: 640px) {
		.mobile-top-dropdown-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.mobile-bottom-shell {
		position: relative;
		overflow: hidden;
	}

	.mobile-bottom-shell::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(circle at 18% 0%, rgba(16, 185, 129, 0.12), transparent 34%),
			radial-gradient(circle at 84% 18%, rgba(14, 165, 233, 0.1), transparent 30%);
	}

	.mobile-tab-link {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 4.35rem;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.28rem;
		border-radius: 1.15rem;
		padding: 0.45rem 0.2rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #64748b;
		text-align: center;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease,
			color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.mobile-tab-icon {
		display: inline-flex;
		height: 2rem;
		width: 2rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.95rem;
		color: #fff;
		box-shadow: 0 9px 20px rgba(15, 23, 42, 0.12);
		transition: transform 0.18s ease, box-shadow 0.18s ease;
	}

	.mobile-tab-hint {
		display: block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.56rem;
		font-weight: 700;
		line-height: 1;
		color: #94a3b8;
	}

	.mobile-tab-link-active {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.13), rgba(6, 182, 212, 0.11));
		color: #047857;
		box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.12), 0 10px 24px rgba(15, 23, 42, 0.05);
	}

	.mobile-tab-link-active .mobile-tab-icon {
		transform: translateY(-1px) scale(1.03);
		box-shadow: 0 12px 24px rgba(15, 118, 110, 0.2);
	}

	.mobile-tab-link-active .mobile-tab-hint {
		color: #059669;
	}

	.mobile-tab-link:not(.mobile-tab-link-active):hover {
		transform: translateY(-1px);
		background: rgba(248, 250, 252, 0.95);
		color: #0f172a;
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
