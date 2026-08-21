// src/lib/server/legal/consent.ts
// Persetujuan Kebijakan Privasi & Syarat Ketentuan.
//
// Ada 13 jalur pendaftaran di aplikasi ini (TPQ, masjid, musholla, pondok,
// rumah tahfidz — masing-masing punya versi umum & per-slug — plus ustadz,
// Google OAuth, dan API santri). Menempelkan pemeriksaan checkbox satu per
// satu di 13 tempat hampir pasti menyisakan lubang: satu jalur terlewat,
// dan ada akun yang lahir tanpa jejak persetujuan.
//
// Karena itu logikanya dikumpulkan di sini, dan setiap jalur cukup memanggil
// dua fungsi: bacaConsent() untuk memvalidasi, kolomConsent() untuk menyimpan.

/**
 * Versi dokumen legal yang berlaku. NAIKKAN saat Kebijakan Privasi atau
 * Syarat & Ketentuan berubah secara material — supaya bisa dibedakan siapa
 * yang menyetujui versi lama dan siapa yang sudah versi baru.
 */
export const VERSI_LEGAL = '2026-08-21';

/** Nama field checkbox di form. Dipakai seragam di semua halaman daftar. */
export const FIELD_CONSENT = 'setuju_kebijakan';

export const PESAN_CONSENT_WAJIB =
	'Anda perlu menyetujui Kebijakan Privasi dan Syarat & Ketentuan untuk melanjutkan.';

/** Nilai yang dianggap "dicentang" oleh browser maupun klien lain. */
const NILAI_SETUJU = new Set(['on', 'true', '1', 'ya', 'yes']);

/**
 * Membaca checkbox persetujuan dari FormData.
 *
 * Sengaja TIDAK memakai nilai bawaan "dianggap setuju". Persetujuan yang
 * diam-diam bukan persetujuan — kalau kolomnya tidak ada, jawabannya tidak.
 */
export function bacaConsent(formData: FormData): { ok: boolean } {
	const nilai = formData.get(FIELD_CONSENT);
	if (typeof nilai !== 'string') return { ok: false };
	return { ok: NILAI_SETUJU.has(nilai.trim().toLowerCase()) };
}

/**
 * Nilai kolom consent untuk disisipkan ke INSERT users.
 *
 * Dipakai berpasangan: `..., consent_at, consent_versi)` pada daftar kolom
 * dan `...kolomConsent()` pada bind.
 */
export function kolomConsent(): [number, string] {
	return [Date.now(), VERSI_LEGAL];
}

/**
 * Untuk pendaftaran lewat Google OAuth. Di sana tidak ada form dengan
 * checkbox — persetujuan dinyatakan di halaman sebelum tombol Google ditekan,
 * jadi yang dicatat adalah waktu dan versinya saja.
 */
export function consentOauth(): [number, string] {
	return kolomConsent();
}
