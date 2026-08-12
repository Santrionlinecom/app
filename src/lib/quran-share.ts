export type QuranVerseShareInput = {
	surahName: string;
	ayahNumber: number;
	arabic: string;
	translation?: string | null;
	url: string;
};

export const buildQuranVerseShareText = ({
	surahName,
	ayahNumber,
	arabic,
	translation,
	url
}: QuranVerseShareInput) => {
	const sections = [`Al-Qur’an — Surah ${surahName} ayat ${ayahNumber}`, arabic.trim()];
	const cleanTranslation = translation?.trim();
	if (cleanTranslation) sections.push(`Artinya: “${cleanTranslation}”`);
	sections.push(`Baca dan bagikan melalui SantriOnline:\n${url}`);
	return sections.join('\n\n');
};
