import assert from 'node:assert/strict';
import test from 'node:test';

import { getAppNavigation } from '$lib/config/app-navigation';

/**
 * Salinan logika skoring CommandPalette.svelte.
 * Tujuan tes: memastikan pengurus lembaga yang lupa nama fitur tetap ketemu
 * lewat kata sehari-hari (mis. "uang masuk" → Kas Masjid).
 */
const SYNONYMS: Record<string, string[]> = {
	keuangan: ['uang', 'kas', 'duit', 'infaq', 'sedekah', 'donasi', 'saldo', 'kwitansi', 'iuran', 'spp', 'masuk', 'keluar', 'pemasukan', 'pengeluaran', 'laporan'],
	kas: ['uang', 'keuangan', 'duit', 'infaq', 'sedekah', 'masuk', 'keluar', 'pemasukan', 'pengeluaran', 'saldo', 'donasi', 'iuran'],
	santri: ['murid', 'siswa', 'anak', 'peserta', 'didik'],
	jamaah: ['warga', 'anggota', 'umat'],
	setoran: ['hafalan', 'ngaji', 'tahfidz', 'muroja', 'sorogan', 'hafal'],
	hafalan: ['tahfidz', 'setoran', 'quran', 'juz', 'muroja', 'hafal'],
	rapor: ['nilai', 'raport', 'hasil', 'evaluasi', 'lapor'],
	sertifikat: ['piagam', 'ijazah', 'penghargaan'],
	jadwal: ['kalender', 'agenda', 'imam', 'khotib', 'piket', 'shift'],
	kalender: ['jadwal', 'agenda', 'tanggal'],
	role: ['hak', 'akses', 'izin', 'jabatan', 'pengurus', 'admin', 'permission'],
	lembaga: ['instansi', 'organisasi', 'yayasan', 'sekolah', 'profil'],
	aset: ['barang', 'inventaris', 'harta', 'properti'],
	sosial: ['posting', 'feed', 'timeline', 'status', 'sosmed'],
	pengumuman: ['info', 'broadcast', 'woro', 'kabar'],
	kitab: ['buku', 'pustaka', 'baca', 'quran', 'alquran', 'referensi'],
	buku: ['kitab', 'baca', 'novel', 'ebook', 'bacaan'],
	kursus: ['kelas', 'belajar', 'training', 'pelatihan', 'materi'],
	belajar: ['kursus', 'materi', 'modul', 'pelajaran'],
	habit: ['misi', 'kebiasaan', 'target', 'challenge', 'tantangan'],
	coin: ['koin', 'saldo', 'topup', 'isi', 'poin'],
	desain: ['template', 'cetak', 'banner', 'spanduk', 'poster'],
	akun: ['profil', 'setting', 'setelan', 'password', 'sandi', 'keamanan'],
	addon: ['fitur', 'tambahan', 'aktivasi', 'upgrade'],
	license: ['lisensi', 'aktivasi', 'produk', 'key'],
	qurban: ['kurban', 'hewan', 'sapi', 'kambing', 'idul'],
	ujian: ['tes', 'test', 'evaluasi', 'imtihan'],
	asrama: ['kamar', 'kobong', 'pondokan'],
	diniyah: ['madin', 'madrasah', 'kelas'],
	dashboard: ['beranda', 'home', 'utama', 'ringkasan'],
	store: ['toko', 'belanja', 'produk', 'jual'],
	studio: ['tulis', 'nulis', 'karya', 'penulis']
};

type Item = { label: string; href: string; description?: string };

const normalize = (value: string) =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const keywordsFor = (item: Item): Set<string> => {
	const base = normalize(
		[item.label, item.description ?? '', item.href.replace(/[/-]/g, ' ')].join(' ')
	);
	const tokens = new Set(base.split(' ').filter(Boolean));
	for (const [key, list] of Object.entries(SYNONYMS)) {
		if (tokens.has(key)) {
			for (const word of list) tokens.add(word);
		}
	}
	return tokens;
};

const tokensMatch = (tokens: Set<string>, word: string) => {
	if (tokens.has(word)) return true;
	if (word.length < 3) return false;
	for (const token of tokens) {
		if (token.startsWith(word)) return true;
	}
	return false;
};

const subsequenceScore = (haystack: string, needle: string) => {
	let hi = 0;
	for (const char of needle) {
		const found = haystack.indexOf(char, hi);
		if (found === -1) return 0;
		hi = found + 1;
	}
	return 1;
};

const scoreItem = (item: Item, rawQuery: string): number => {
	const q = normalize(rawQuery);
	if (!q) return 1;

	const label = normalize(item.label);
	const tokens = keywordsFor(item);

	if (label === q) return 1000;
	if (label.startsWith(q)) return 900;
	if (label.includes(q)) return 800;

	const words = q.split(' ').filter(Boolean);
	const matched = words.filter((word) => tokensMatch(tokens, word)).length;
	if (words.length && matched === words.length) return 600 + words.length * 10;
	if (matched > 0) return 300 + matched * 10;

	if (q.length >= 2 && subsequenceScore(label.replace(/\s/g, ''), q.replace(/\s/g, ''))) {
		return 200;
	}
	return 0;
};

const search = (items: Item[], query: string) =>
	items
		.map((item) => ({ item, score: scoreItem(item, query) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
		.map((entry) => entry.item.label);

const masjidNav = getAppNavigation('masjid', 'admin', () => true);
const tpqNav = getAppNavigation('tpq', 'admin', () => true);

test('menemukan Kas Masjid dari kata sehari-hari "uang masuk"', () => {
	assert.equal(search(masjidNav, 'uang masuk')[0], 'Kas Masjid');
});

test('menemukan Kas Masjid dari kata "infaq"', () => {
	assert.ok(search(masjidNav, 'infaq').includes('Kas Masjid'));
});

test('menemukan Setoran Hafalan dari kata "ngaji"', () => {
	assert.ok(search(tpqNav, 'ngaji').includes('Setoran Hafalan'));
});

test('menemukan Data Santri dari kata "murid"', () => {
	assert.ok(search(tpqNav, 'murid').includes('Data Santri'));
});

test('menemukan Jadwal Imam/Khotib dari kata "khotib"', () => {
	assert.ok(search(masjidNav, 'khotib').includes('Jadwal Imam/Khotib'));
});

test('menemukan Kelola Role dari kata "hak akses"', () => {
	assert.ok(search(masjidNav, 'hak akses').includes('Kelola Role'));
});

test('cocok persis mengalahkan cocok sinonim', () => {
	assert.equal(search(masjidNav, 'aset')[0], 'Aset');
});

test('query kosong mengembalikan semua menu', () => {
	assert.equal(search(masjidNav, '').length, masjidNav.length);
});

test('query tanpa hasil mengembalikan array kosong', () => {
	assert.deepEqual(search(masjidNav, 'zzzqqq'), []);
});

test('hanya menampilkan menu yang boleh diakses role tersebut', () => {
	const jamaahNav = getAppNavigation('masjid', 'jamaah', () => false);
	assert.ok(!search(jamaahNav, 'kas').includes('Kas Masjid'));
});
