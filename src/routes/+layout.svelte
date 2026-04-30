<script lang="ts">
import '../app.css';
import { page } from '$app/stores';
import { onMount } from 'svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import ClarityAnalytics from '$lib/components/ClarityAnalytics.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import UmamiAnalytics from '$lib/components/UmamiAnalytics.svelte';
	import { LANGUAGE_OPTIONS } from '$lib/data/languages';
	import languageFlagOverrides from '$lib/data/language-flag-overrides.json';
import { isImpersonatingUser, isSuperAdminUser } from '$lib/auth/session-user';
import { islamicDynasties } from '$lib/data/dinasti';
import { FEATURES } from '$lib/features';

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
const isBookMenuActive = (path: string) =>
	path === '/buku' ||
	path.startsWith('/buku/') ||
	path === '/coins' ||
	path.startsWith('/coins/');
const isLearningMenuActive = (path: string) =>
	path === '/tpq' ||
	path.startsWith('/tpq/') ||
	path.startsWith('/kitab') ||
	path.startsWith('/fitur') ||
	isTokohMenuActive(path) ||
	isDynastyMenuActive(path) ||
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
	}
];

const bookPublicMenuItems: HeaderMenuItem[] = [
	{
		label: 'Buku Digital',
		href: '/buku',
		note: 'Katalog karya santri dan penulis muslim'
	}
];

const bookUserMenuItems: HeaderMenuItem[] = [
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

let mobileMenuOpen = false;
let mobileTopMenuOpen: string | null = null;
let previousPathname = '';

const kalenderNavItem = {
	label: 'Kalender',
	href: '/kalender',
	icon: 'M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
	isActive: (path: string) => path === '/kalender' || path.startsWith('/kalender/')
};

const featureNavItem = {
	label: 'Fitur',
	href: '/fitur',
	icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.11 3.418a1 1 0 00.95.69h3.595c.969 0 1.371 1.24.588 1.81l-2.91 2.114a1 1 0 00-.364 1.118l1.11 3.418c.3.921-.755 1.688-1.538 1.118l-2.91-2.114a1 1 0 00-1.176 0l-2.91 2.114c-.783.57-1.838-.197-1.539-1.118l1.11-3.418a1 1 0 00-.363-1.118L2.805 8.845c-.783-.57-.38-1.81.588-1.81h3.595a1 1 0 00.95-.69l1.11-3.418z',
	isActive: (path: string) => path === '/fitur' || path.startsWith('/fitur/')
};

const quranNavItem = {
	label: 'Mushaf',
	href: '/kitab/quran',
	icon: 'M12 6.253v13m0-13C10.832 5.477 9.247 5 7.5 5 5.205 5 3.126 5.82 1.5 7.165v11.089C3.126 16.91 5.205 16.09 7.5 16.09c1.747 0 3.332.477 4.5 1.253m0-11.09C13.168 5.477 14.753 5 16.5 5c2.295 0 4.374.82 6 2.165v11.089c-1.626-1.345-3.705-2.165-6-2.165-1.747 0-3.332.477-4.5 1.253',
	isActive: (path: string) => path === '/kitab/quran' || path.startsWith('/kitab/quran/')
};

const bookNavItem = {
	label: 'Buku',
	href: '/buku',
	icon: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM8 7h8M8 11h7M6.5 19A2.5 2.5 0 014 16.5',
	isActive: (path: string) => path === '/buku' || (path.startsWith('/buku/') && !path.startsWith('/buku/studio'))
};

const studioNavItem = {
	label: 'Studio',
	href: '/buku/studio',
	icon: 'M4 19.5V5a2 2 0 012-2h9l5 5v11.5M14 3v6h6M8 13h8M8 17h5',
	isActive: (path: string) => path === '/buku/studio' || path.startsWith('/buku/studio/')
};

const coinNavItem = {
	label: 'Coin',
	href: '/coins',
	icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 5v8m-3-4h6',
	isActive: (path: string) => path === '/coins' || path.startsWith('/coins/')
};

let mobileTopMenus: MobileTopMenu[] = [];

const mobileExploreLinks = [
	{
		label: 'Semua Fitur',
		href: '/fitur',
		note: 'Program pembinaan aktif',
		tone: 'border-emerald-200 bg-emerald-50 text-emerald-700'
	},
	{
		label: 'Buku',
		href: '/buku',
		note: 'Buku digital dan bab premium',
		tone: 'border-emerald-200 bg-white text-emerald-700'
	},
	{
		label: 'Blog',
		href: '/blog',
		note: 'Artikel dan digital store',
		tone: 'border-slate-200 bg-slate-50 text-slate-700'
	},
	{
		label: 'Tokoh',
		href: '/tokoh',
		note: 'Nabi sampai ulama',
		tone: 'border-amber-200 bg-amber-50 text-amber-700'
	},
	{
		label: 'Dinasti',
		href: '/dinasti',
		note: 'Peta peradaban Islam',
		tone: 'border-sky-200 bg-sky-50 text-sky-700'
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
				label: 'Daftar TPQ',
				href: '/register',
				note: 'Mulai onboarding lembaga'
			}
		];

$: mobileTopMenus = [
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
			label: `Tahap ${item.order}`,
			href: item.href,
			note: item.label
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
			label: 'Daftar TPQ',
			note: 'Mulai onboarding lembaga'
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
$: activeMobileTopMenu = mobileTopMenus.find((menu) => menu.id === mobileTopMenuOpen) ?? null;
$: mobilePublicTabs = data?.user
	? [
			bookNavItem,
			studioNavItem,
			coinNavItem,
			{
				label: isSuperAdmin ? 'Admin' : 'Dashboard',
				href: isSuperAdmin ? '/admin/super/overview' : '/dashboard',
				icon: 'M4 10.5a1 1 0 011-1h5.5V4.5a1 1 0 011-1h7a1 1 0 011 1v5h5.5a1 1 0 011 1v9a1 1 0 01-1 1h-7.5v-6h-4v6H5a1 1 0 01-1-1v-9z',
				isActive: (path: string) =>
					isSuperAdmin ? isAdminRoute(path) : path === '/dashboard' || path.startsWith('/dashboard/')
			}
		]
	: [
			baseNav[0],
			baseNav[1],
			bookNavItem,
			baseNav[5],
			{
				label: 'Daftar',
				href: '/register',
				icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0M16 8h4m-2-2v4',
				isActive: (path: string) => path === '/register'
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

<div class="min-h-screen bg-base-100">
	<header class="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
		<div class="md:hidden border-b border-white/60 bg-gradient-to-br from-emerald-50/90 via-white to-cyan-50/80">
			<div class="container mx-auto max-w-6xl px-4 py-3">
				<div class="rounded-[1.8rem] border border-white/70 bg-white/90 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
					<div class="flex items-start justify-between gap-3">
						<a href="/" class="flex min-w-0 items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-2 shadow-lg shadow-emerald-500/20">
									<img
										src="https://files.santrionline.com/ICON%20SANTRI%20ONLINE%20COM%20kecil%20(1).png"
										alt="Santri Online"
										class="h-8 w-auto"
										loading="lazy"
									/>
								</div>
							<div class="min-w-0">
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Santri Online</p>
								<p class="truncate text-sm font-semibold text-slate-950">{mobileContext.label}</p>
								<p class="truncate text-xs text-slate-500">{mobileContext.note}</p>
							</div>
						</a>

						<div class="flex items-center gap-2">
							<a
								href={mobilePrimaryAction.href}
								class="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 shadow-sm"
							>
								{mobilePrimaryAction.label}
							</a>
							<button
								type="button"
								class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
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
									class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
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
				<div class="flex items-center justify-between gap-3">
					<a href="/" class="flex items-center gap-2">
						<img src="/logo-santri.png" alt="Santri Online" class="h-8 w-auto" loading="lazy" />
					</a>
					<nav class="flex items-center gap-2">
						<a href="/" class="desktop-nav-link" class:desktop-nav-link-active={pathname === '/'}>Beranda</a>

						<div class="group relative">
							<a href="/kitab" class="desktop-nav-link" class:desktop-nav-link-active={isLearningMenuActive(pathname)}>
								<span>Belajar</span>
								<span class="desktop-nav-caret">⌄</span>
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
								<span>Buku</span>
								<span class="desktop-nav-caret">⌄</span>
							</a>
							<div class="desktop-dropdown w-80">
								<div class="desktop-dropdown-panel">
									<a href="/buku" class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm transition hover:bg-emerald-100">
										<p class="font-semibold text-emerald-900">Baca Buku</p>
										<p class="mt-1 text-xs leading-5 text-emerald-700">Bab gratis dan premium pakai coin.</p>
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

						{#if isSuperAdmin}
							<div class="group relative">
								<a href="/admin/super/overview" class="desktop-nav-link" class:desktop-nav-link-active={isAdminRoute(pathname)}>
									<span>Admin</span>
									<span class="desktop-nav-caret">⌄</span>
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
							<a href="/register" class="btn btn-sm btn-primary">Daftar TPQ</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</header>

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
					<section>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div>
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Jalur cepat</p>
								<h3 class="mt-1 text-lg font-semibold text-slate-950">Area utama produk</h3>
							</div>
							<a href="/fitur" class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Semua fitur</a>
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
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Buku dan coin</p>
								<h3 class="mt-1 text-lg font-semibold text-slate-950">Buku Digital SantriOnline</h3>
							</div>
							<a href="/buku" class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Buka buku</a>
						</div>

						<div class="grid grid-cols-2 gap-3">
							{#each bookMenuItems as item}
								<a href={item.href} class="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-sm font-semibold text-emerald-950">{item.label}</p>
									<p class="mt-2 text-xs leading-5 text-emerald-700">{item.note}</p>
								</a>
							{/each}
						</div>
					</section>

					{#if isSuperAdmin}
						<section>
							<div class="mb-3">
								<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Admin</p>
								<h3 class="mt-1 text-lg font-semibold text-slate-950">Buku, royalti, dan topup</h3>
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
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Program pembinaan</p>
							<h3 class="mt-1 text-lg font-semibold text-slate-950">Fitur aktif</h3>
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
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Kategori kitab</p>
							<h3 class="mt-1 text-lg font-semibold text-slate-950">Masuk langsung ke kitab</h3>
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
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">Akun dan akses</p>
							<h3 class="mt-1 text-lg font-semibold text-slate-950">Langkah berikutnya</h3>
						</div>

						<div class="grid gap-3">
							<a href="/kalender" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
								Buka Kalender
							</a>

							{#if data.user}
								<a href="/akun" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
									Kelola Profil
								</a>
								{#if isImpersonating}
									<a href="/admin/super/impersonate/stop" class="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm">
										Keluar Mode Admin
									</a>
								{/if}
								<form method="POST" action="/logout">
									<button type="submit" class="w-full rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
										Logout
									</button>
								</form>
							{:else}
								<a href="/auth" class="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
									Login
								</a>
								<a href="/register" class="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
									Daftarkan TPQ
								</a>
							{/if}
						</div>
					</section>
				</div>
			</div>
		</div>
	{/if}

	<main class="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-10">
		<slot />
	</main>

	<!-- Bottom nav (mobile) -->
	{#if !isAppRouteActive && !isAdminRouteActive}
		<nav class="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden safe-area-bottom">
			<div class="mx-auto max-w-xl px-3 py-3 pb-safe">
				<div class="pointer-events-auto rounded-[1.7rem] border border-white/70 bg-white/92 p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
					<div class={`grid gap-1 ${mobilePublicTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
						{#each mobilePublicTabs as item}
							<a
								href={item.href}
								class="mobile-tab-link"
								class:mobile-tab-link-active={item.isActive(pathname)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
									<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span class="text-[10px]">{item.label}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		</nav>
	{:else if isAdminRouteActive && isSuperAdmin}
		<nav class="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden safe-area-bottom">
			<div class="mx-auto max-w-xl px-3 py-3 pb-safe">
				<div class="pointer-events-auto rounded-[1.7rem] border border-white/70 bg-white/92 p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
					<div class="grid grid-cols-4 gap-1">
					{#each adminNav as item}
						<a
							href={item.href}
							class="mobile-tab-link"
							class:mobile-tab-link-active={item.isActive(pathname)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d={item.icon} stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<span class="text-[10px]">{item.label}</span>
						</a>
					{/each}
					</div>
				</div>
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

	.desktop-nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 999px;
		padding: 0.55rem 0.85rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: #475569;
		transition: background-color 0.18s ease, color 0.18s ease;
	}

	.desktop-nav-link:hover,
	.desktop-nav-link-active {
		background: rgba(236, 253, 245, 0.95);
		color: #047857;
	}

	.desktop-nav-caret {
		font-size: 0.82rem;
		line-height: 1;
		color: currentColor;
	}

	.desktop-dropdown {
		pointer-events: none;
		visibility: hidden;
		position: absolute;
		top: 100%;
		z-index: 30;
		padding-top: 0.75rem;
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
		border-radius: 1.25rem;
		border: 1px solid #e2e8f0;
		background: #ffffff;
		padding: 0.5rem;
		box-shadow: 0 22px 50px rgba(15, 23, 42, 0.14);
	}

	.desktop-dropdown-item {
		display: flex;
		flex-direction: column;
		border-radius: 0.9rem;
		padding: 0.7rem 0.85rem;
		font-size: 0.875rem;
		color: #475569;
		transition: background-color 0.18s ease, color 0.18s ease;
	}

	.desktop-dropdown-item:hover {
		background: rgba(236, 253, 245, 0.88);
		color: #047857;
	}

	.mobile-scroll-row {
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
		border-radius: 999px;
		border: 1px solid rgba(226, 232, 240, 0.95);
		background: rgba(255, 255, 255, 0.96);
		padding: 0.6rem 0.9rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #475569;
		transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
	}

		.mobile-top-trigger-active {
			border-color: rgba(16, 185, 129, 0.24);
			background: rgba(236, 253, 245, 0.96);
			color: #047857;
		}

		.mobile-top-dropdown-scroll {
			max-height: min(55svh, 26rem);
			overflow-y: auto;
			overscroll-behavior: contain;
			padding-right: 0.15rem;
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
			gap: 0.5rem;
		}

		.mobile-top-dropdown-grid-compact {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.4rem;
		}

		.mobile-top-dropdown-link {
			display: block;
			border-radius: 1.1rem;
			border: 1px solid rgba(226, 232, 240, 0.7);
			background: rgba(248, 250, 252, 0.8);
			padding: 0.75rem;
			transition: background-color 0.18s ease, border-color 0.18s ease;
		}

		.mobile-top-dropdown-link:hover {
			border-color: rgba(16, 185, 129, 0.24);
			background: rgba(236, 253, 245, 0.7);
		}

		.mobile-top-dropdown-link-compact {
			min-height: 3.7rem;
			border-radius: 0.95rem;
			padding: 0.6rem 0.65rem;
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

		.mobile-tab-link {
			display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		border-radius: 1rem;
		padding: 0.65rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		transition: transform 0.18s ease, background-color 0.18s ease, color 0.18s ease;
	}

	.mobile-tab-link-active {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.12));
		color: #047857;
		box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.12);
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
