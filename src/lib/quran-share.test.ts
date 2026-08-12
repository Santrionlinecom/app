import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuranVerseShareText } from './quran-share';

test('formats an ayat, translation, and canonical SantriOnline link for WhatsApp', () => {
	assert.equal(
		buildQuranVerseShareText({
			surahName: 'Al-Fatihah',
			ayahNumber: 1,
			arabic: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
			translation: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
			url: 'https://app.santrionline.com/kitab/quran/1/1'
		}),
		'Al-Qur’an — Surah Al-Fatihah ayat 1\n\nبِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ\n\nArtinya: “Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.”\n\nBaca dan bagikan melalui SantriOnline:\nhttps://app.santrionline.com/kitab/quran/1/1'
	);
});

test('omits an empty translation without leaving excessive blank lines', () => {
	assert.equal(
		buildQuranVerseShareText({
			surahName: 'Al-Ikhlas',
			ayahNumber: 1,
			arabic: 'قُلْ هُوَ اللّٰهُ اَحَدٌ',
			translation: '  ',
			url: 'https://app.santrionline.com/kitab/quran/112/1'
		}),
		'Al-Qur’an — Surah Al-Ikhlas ayat 1\n\nقُلْ هُوَ اللّٰهُ اَحَدٌ\n\nBaca dan bagikan melalui SantriOnline:\nhttps://app.santrionline.com/kitab/quran/112/1'
	);
});
