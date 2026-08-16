/**
 * Pendataan santri TPQ.
 *
 * Santri usia 5-12 tahun umumnya tidak punya HP dan tidak perlu akun login.
 * Memaksa setiap anak memiliki baris `users` berarti pengurus harus mengarang
 * email dan password palsu, sekaligus membuang data yang justru mereka
 * butuhkan: NIS, kelas, nama wali, dan nomor HP wali — kolom yang tidak ada
 * di tabel `users`.
 *
 * Karena itu sumber kebenaran pendataan adalah tabel `santri`, dengan
 * `user_id` NULL. Santri yang kelak perlu login ditautkan lewat kolom itu.
 */

export type SantriInput = {
	nama?: unknown;
	nis?: unknown;
	kelas?: unknown;
	waliNama?: unknown;
	waliHp?: unknown;
};

export type SantriValue = {
	nama: string;
	nis: string | null;
	kelas: string | null;
	waliNama: string | null;
	waliHp: string | null;
	isAktif: 1;
};

export type SantriResult =
	| { ok: true; value: SantriValue }
	| { ok: false; error: string };

const NAMA_MAKS = 120;

const teks = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Kolom opsional yang dikosongkan disimpan sebagai NULL, bukan string kosong. */
const opsional = (value: unknown, maks = 60): string | null => {
	const v = teks(value).slice(0, maks);
	return v || null;
};

/** Nomor HP dirapikan agar '0812-3456 7890' dan '081234567890' tidak jadi dua data berbeda. */
const nomorHp = (value: unknown): string | null => {
	const v = teks(value).replace(/[\s\-().]/g, '');
	return v ? v.slice(0, 20) : null;
};

export const normalizeSantriInput = (input: SantriInput): SantriResult => {
	// Rapikan spasi ganda agar "Siti   Aminah" tersimpan sebagai "Siti Aminah".
	const nama = teks(input.nama).replace(/\s+/g, ' ');

	if (!nama) {
		return { ok: false, error: 'Nama santri wajib diisi.' };
	}
	if (nama.length > NAMA_MAKS) {
		return { ok: false, error: `Nama santri maksimal ${NAMA_MAKS} karakter.` };
	}

	return {
		ok: true,
		value: {
			nama,
			nis: opsional(input.nis, 40),
			kelas: opsional(input.kelas, 40),
			waliNama: opsional(input.waliNama, 120),
			waliHp: nomorHp(input.waliHp),
			isAktif: 1
		}
	};
};
