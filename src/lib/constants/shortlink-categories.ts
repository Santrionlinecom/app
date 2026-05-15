export const SHORTLINK_CATEGORIES = [
	{
		key: 'affiliate_marketplace',
		label: 'Afiliasi Marketplace',
		description: 'GoTrade, TradingView, Tokopedia, Shopee, dll',
		color: 'blue'
	},
	{
		key: 'affiliate_app',
		label: 'Afiliasi Pendaftaran Aplikasi',
		description: 'Referral sign-up SantriOnline, app lain',
		color: 'green'
	},
	{
		key: 'affiliate_course',
		label: 'Afiliasi Kursus/Pelatihan',
		description: 'Udemy, Coursera, platform belajar',
		color: 'teal'
	},
	{
		key: 'campaign_dakwah',
		label: 'Kampanye Dakwah',
		description: 'Link konten dakwah, TikTok, IG',
		color: 'amber'
	},
	{
		key: 'campaign_jasa',
		label: 'Kampanye Jasa Web',
		description: 'Promosi jasa web dev',
		color: 'purple'
	},
	{
		key: 'internal_app',
		label: 'Link Internal Aplikasi',
		description: 'Deep link ke fitur dalam app',
		color: 'gray'
	},
	{
		key: 'internal_docs',
		label: 'Dokumentasi Internal',
		description: 'Link docs, panduan pengguna',
		color: 'gray'
	},
	{
		key: 'other',
		label: 'Lainnya',
		description: 'Default fallback',
		color: 'gray'
	}
] as const;

export type ShortlinkCategoryKey = (typeof SHORTLINK_CATEGORIES)[number]['key'];

export const SHORTLINK_CATEGORY_KEYS = SHORTLINK_CATEGORIES.map((category) => category.key) as ShortlinkCategoryKey[];

export const SHORTLINK_CATEGORY_MAP = new Map(SHORTLINK_CATEGORIES.map((category) => [category.key, category]));

export const isShortlinkCategoryKey = (value: string): value is ShortlinkCategoryKey =>
	SHORTLINK_CATEGORY_KEYS.includes(value as ShortlinkCategoryKey);

export const DEFAULT_SHORTLINK_CATEGORY: ShortlinkCategoryKey = 'other';
