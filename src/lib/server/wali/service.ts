// src/lib/server/wali/service.ts
// Lapisan data relasi wali↔santri, kode undangan, dan ringkasan perkembangan.
//
// Prinsip keamanan yang ditegakkan di sini (bukan di UI):
// 1. Wali HANYA boleh membaca data anak yang relasinya tercatat & berstatus
//    'aktif'. Setiap pembacaan wajib lewat assertWaliBerhak().
// 2. Wali tidak pernah menulis data amal anak. Satu-satunya tulisan yang
//    diizinkan adalah konfirmasi mingguan (habit_guardian_weekly).
// 3. Kode undangan sekali pakai, kedaluwarsa, dan tercatat penerbitnya.

import type { D1Database } from '@cloudflare/workers-types';

export type Hubungan = 'ayah' | 'ibu' | 'wali';

export type AnakRingkas = {
	santriUserId: string;
	nama: string;
	hubungan: Hubungan;
	lembagaNama: string | null;
};

export type RingkasanAnak = {
	santriUserId: string;
	nama: string;
	lembagaNama: string | null;
	habit: {
		misi: string;
		judul: string;
		streakSekarang: number;
		streakTerbaik: number;
		checkinPekanIni: number;
	}[];
	hafalanPekanIni: number;
	/** Satu kalimat ajakan bicara untuk orang tua — bukan penilaian. */
	saranPercakapan: string;
};

const MS_HARI = 86_400;

/** Kode ramah-baca: tanpa huruf/angka yang mudah tertukar (0/O, 1/I). */
const ALFABET_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function buatKodeUndangan(panjang = 6): string {
	const bytes = crypto.getRandomValues(new Uint8Array(panjang));
	let kode = '';
	for (const b of bytes) kode += ALFABET_KODE[b % ALFABET_KODE.length];
	return `WALI-${kode}`;
}

/**
 * Menerbitkan kode undangan untuk seorang santri.
 * Pemanggil WAJIB sudah memastikan penerbit berhak (admin/ustadz lembaga
 * tempat santri terdaftar, atau santri dewasa untuk dirinya sendiri).
 */
export async function terbitkanUndangan(
	db: D1Database,
	input: {
		santriUserId: string;
		diterbitkanOleh: string;
		hubungan: Hubungan;
		lembagaId?: string | null;
		berlakuHari?: number;
	}
): Promise<{ kode: string; expiresAt: number }> {
	const berlakuHari = input.berlakuHari ?? 7;
	const expiresAt = Math.floor(Date.now() / 1000) + berlakuHari * MS_HARI;

	// Tabrakan kode praktis mustahil, tapi tetap dicoba ulang agar tidak
	// pernah menimpa undangan orang lain.
	for (let percobaan = 0; percobaan < 5; percobaan += 1) {
		const kode = buatKodeUndangan();
		const adaKode = await db
			.prepare('SELECT kode FROM wali_undangan WHERE kode = ? LIMIT 1')
			.bind(kode)
			.first<{ kode: string }>();
		if (adaKode) continue;

		await db
			.prepare(
				`INSERT INTO wali_undangan
				   (kode, santri_user_id, lembaga_id, hubungan, diterbitkan_oleh, expires_at, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
			)
			.bind(
				kode,
				input.santriUserId,
				input.lembagaId ?? null,
				input.hubungan,
				input.diterbitkanOleh,
				expiresAt
			)
			.run();

		return { kode, expiresAt };
	}

	throw new Error('Gagal membuat kode undangan. Coba lagi.');
}

export type HasilTukar =
	| { ok: true; santriUserId: string }
	| { ok: false; alasan: 'tidak_ditemukan' | 'kedaluwarsa' | 'sudah_dipakai' | 'diri_sendiri' | 'sudah_terhubung' };

/**
 * Menukar kode undangan menjadi relasi wali↔santri.
 * Semua kegagalan dikembalikan sebagai nilai, bukan exception, supaya
 * pemanggil bisa memberi pesan yang ramah tanpa membocorkan detail.
 */
export async function tukarUndangan(
	db: D1Database,
	kodeMasukan: string,
	waliUserId: string
): Promise<HasilTukar> {
	const kode = kodeMasukan.trim().toUpperCase();

	const undangan = await db
		.prepare(
			`SELECT kode, santri_user_id, lembaga_id, hubungan, expires_at, dipakai_oleh
			   FROM wali_undangan WHERE kode = ? LIMIT 1`
		)
		.bind(kode)
		.first<{
			kode: string;
			santri_user_id: string;
			lembaga_id: string | null;
			hubungan: Hubungan;
			expires_at: number;
			dipakai_oleh: string | null;
		}>();

	if (!undangan) return { ok: false, alasan: 'tidak_ditemukan' };
	if (undangan.dipakai_oleh) return { ok: false, alasan: 'sudah_dipakai' };
	if (undangan.expires_at < Math.floor(Date.now() / 1000)) {
		return { ok: false, alasan: 'kedaluwarsa' };
	}
	if (undangan.santri_user_id === waliUserId) return { ok: false, alasan: 'diri_sendiri' };

	const sudahAda = await db
		.prepare(
			`SELECT id FROM wali_santri
			  WHERE wali_user_id = ? AND santri_user_id = ? AND status = 'aktif' LIMIT 1`
		)
		.bind(waliUserId, undangan.santri_user_id)
		.first<{ id: string }>();

	if (sudahAda) return { ok: false, alasan: 'sudah_terhubung' };

	const id = crypto.randomUUID();

	await db.batch([
		db
			.prepare(
				`INSERT INTO wali_santri
				   (id, wali_user_id, santri_user_id, hubungan, lembaga_id, status, dibuat_oleh, created_at)
				 VALUES (?, ?, ?, ?, ?, 'aktif', ?, unixepoch())
				 ON CONFLICT(wali_user_id, santri_user_id) DO UPDATE SET
				   status = 'aktif', revoked_at = NULL, hubungan = excluded.hubungan`
			)
			.bind(
				id,
				waliUserId,
				undangan.santri_user_id,
				undangan.hubungan,
				undangan.lembaga_id,
				waliUserId
			),
		db
			.prepare(
				`UPDATE wali_undangan SET dipakai_oleh = ?, dipakai_at = unixepoch()
				  WHERE kode = ? AND dipakai_oleh IS NULL`
			)
			.bind(waliUserId, kode)
	]);

	return { ok: true, santriUserId: undangan.santri_user_id };
}

/** Daftar anak yang berhak dipantau seorang wali. */
export async function daftarAnak(db: D1Database, waliUserId: string): Promise<AnakRingkas[]> {
	const { results } = await db
		.prepare(
			`SELECT ws.santri_user_id, ws.hubungan,
			        COALESCE(u.username, u.email) AS nama,
			        o.name AS lembaga_nama
			   FROM wali_santri ws
			   JOIN users u ON u.id = ws.santri_user_id
			   LEFT JOIN organizations o ON o.id = ws.lembaga_id
			  WHERE ws.wali_user_id = ? AND ws.status = 'aktif'
			  ORDER BY nama`
		)
		.bind(waliUserId)
		.all<{ santri_user_id: string; hubungan: Hubungan; nama: string; lembaga_nama: string | null }>();

	return (results ?? []).map((row) => ({
		santriUserId: row.santri_user_id,
		nama: row.nama,
		hubungan: row.hubungan,
		lembagaNama: row.lembaga_nama
	}));
}

/**
 * Gerbang otorisasi. Melempar bila wali tidak berhak atas santri ini.
 * WAJIB dipanggil sebelum membaca data anak mana pun.
 */
export async function assertWaliBerhak(
	db: D1Database,
	waliUserId: string,
	santriUserId: string
): Promise<void> {
	const row = await db
		.prepare(
			`SELECT id FROM wali_santri
			  WHERE wali_user_id = ? AND santri_user_id = ? AND status = 'aktif' LIMIT 1`
		)
		.bind(waliUserId, santriUserId)
		.first<{ id: string }>();

	if (!row) throw new Error('WALI_TIDAK_BERHAK');
}

/** Cabut relasi (oleh wali sendiri atau lembaga). */
export async function cabutRelasi(
	db: D1Database,
	waliUserId: string,
	santriUserId: string
): Promise<void> {
	await db
		.prepare(
			`UPDATE wali_santri SET status = 'dicabut', revoked_at = unixepoch()
			  WHERE wali_user_id = ? AND santri_user_id = ?`
		)
		.bind(waliUserId, santriUserId)
		.run();
}

/**
 * Ringkasan perkembangan seorang anak.
 * Nada sengaja menumbuhkan: tidak ada peringkat antaranak, tidak ada
 * penanda merah. Yang ditonjolkan streak dan satu ajakan bicara.
 */
export async function ringkasanAnak(
	db: D1Database,
	waliUserId: string,
	santriUserId: string
): Promise<RingkasanAnak> {
	await assertWaliBerhak(db, waliUserId, santriUserId);

	const profil = await db
		.prepare(
			`SELECT COALESCE(u.username, u.email) AS nama, o.name AS lembaga_nama
			   FROM users u
			   LEFT JOIN wali_santri ws
			     ON ws.santri_user_id = u.id AND ws.wali_user_id = ?
			   LEFT JOIN organizations o ON o.id = ws.lembaga_id
			  WHERE u.id = ? LIMIT 1`
		)
		.bind(waliUserId, santriUserId)
		.first<{ nama: string; lembaga_nama: string | null }>();

	// habit_checkins memakai local_date (YYYY-MM-DD) + is_day_met, bukan
	// stempel waktu — verifikasi skema produksi 2026-08-21.
	const batasPekan = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

	const { results: habitRows } = await db
		.prepare(
			`SELECT hs.mission_key, hm.title, hs.current_streak, hs.best_streak,
			        (SELECT COUNT(*) FROM habit_checkins hc
			          WHERE hc.user_id = hs.user_id
			            AND hc.mission_key = hs.mission_key
			            AND hc.is_day_met = 1
			            AND hc.local_date >= ?) AS checkin_pekan
			   FROM habit_streaks hs
			   LEFT JOIN habit_missions hm ON hm.key = hs.mission_key
			  WHERE hs.user_id = ?
			  ORDER BY hs.current_streak DESC`
		)
		.bind(batasPekan, santriUserId)
		.all<{
			mission_key: string;
			title: string | null;
			current_streak: number;
			best_streak: number;
			checkin_pekan: number;
		}>();

	const habit = (habitRows ?? []).map((row) => ({
		misi: row.mission_key,
		judul: row.title ?? row.mission_key,
		streakSekarang: row.current_streak,
		streakTerbaik: row.best_streak,
		checkinPekanIni: row.checkin_pekan
	}));

	const terbaik = habit[0];
	const saranPercakapan = terbaik
		? terbaik.streakSekarang >= 3
			? `Tanyakan bagaimana rasanya menjaga "${terbaik.judul}" ${terbaik.streakSekarang} hari berturut-turut. Beri apresiasi, bukan target baru.`
			: `Ajak bicara ringan soal "${terbaik.judul}" — tanyakan apa yang membuatnya berat pekan ini, tanpa menuntut.`
		: 'Belum ada catatan pekan ini. Tanyakan kabar belajarnya lebih dulu, bukan angkanya.';

	return {
		santriUserId,
		nama: profil?.nama ?? 'Santri',
		lembagaNama: profil?.lembaga_nama ?? null,
		habit,
		hafalanPekanIni: 0,
		saranPercakapan
	};
}
