export const KITAB_CATEGORY_OPTIONS = [
	{
		value: 'quran-tahsin',
		label: "Qur'an/Tahsin",
		description: 'Tajwid, makhraj, dan kualitas bacaan Al-Qur\'an.'
	},
	{
		value: 'aqidah',
		label: 'Aqidah',
		description: 'Dasar tauhid, iman, dan keyakinan yang lurus.'
	},
	{
		value: 'fiqih',
		label: 'Fiqih',
		description: 'Praktik ibadah harian dan hukum dasar yang perlu dipahami santri.'
	},
	{
		value: 'hadits',
		label: 'Hadits',
		description: 'Akhlak, adab, dan tuntunan amal dari hadits Nabi.'
	},
	{
		value: 'adab-tasawuf',
		label: 'Adab/Tasawuf',
		description: 'Pembinaan hati, muhasabah, dan adab lahir-batin.'
	},
	{
		value: 'bahasa-arab',
		label: 'Bahasa Arab',
		description: 'Bahasa pengantar kitab dan pintu masuk membaca teks Arab.'
	}
] as const;

export type KitabCategoryKey = (typeof KITAB_CATEGORY_OPTIONS)[number]['value'];

export type KitabCategoryMeta = (typeof KITAB_CATEGORY_OPTIONS)[number];

const categoryMap = new Map<KitabCategoryKey, KitabCategoryMeta>(
	KITAB_CATEGORY_OPTIONS.map((option) => [option.value, option])
);

export const KITAB_CATEGORY_ORDER: KitabCategoryKey[] = KITAB_CATEGORY_OPTIONS.map(
	(option) => option.value
);

export const KITAB_CATEGORY_TONE_CLASS: Record<KitabCategoryKey, string> = {
	'quran-tahsin': 'border-emerald-200 bg-emerald-50 text-emerald-700',
	aqidah: 'border-sky-200 bg-sky-50 text-sky-700',
	fiqih: 'border-amber-200 bg-amber-50 text-amber-700',
	hadits: 'border-teal-200 bg-teal-50 text-teal-700',
	'adab-tasawuf': 'border-lime-200 bg-lime-50 text-lime-700',
	'bahasa-arab': 'border-slate-200 bg-slate-50 text-slate-700'
};

export const getKitabCategoryMeta = (value?: string | null) => {
	if (!value) return null;
	return categoryMap.get(value as KitabCategoryKey) ?? null;
};

export const getKitabCategoryLabel = (value?: string | null) =>
	getKitabCategoryMeta(value)?.label ?? value ?? '';

export const getKitabCategoryDescription = (value?: string | null) =>
	getKitabCategoryMeta(value)?.description ?? '';

export const getKitabCategoryToneClass = (value?: string | null) => {
	if (!value) return 'border-slate-200 bg-slate-100 text-slate-600';
	return KITAB_CATEGORY_TONE_CLASS[value as KitabCategoryKey] ?? 'border-slate-200 bg-slate-100 text-slate-600';
};
