// src/lib/server/rapor/service.ts
// Rapor digital yang layak dibagikan (Tahap C).
//
// Keputusan inti: rapor adalah DOKUMEN, bukan kueri hidup.
// Saat diterbitkan, angka dihitung sekali lalu DIBEKUKAN sebagai JSON di
// certificates.payload. Alasannya:
// 1. Rapor tidak boleh berubah setelah dibagikan hanya karena data terus
//    bergerak — orang tua yang membagikan rapor anaknya ke grup WA tidak
//    ingin angkanya berbeda saat dibuka besok.
// 2. Halaman publik tidak boleh menjalankan kueri berat ke tabel hidup.
//
// Bawaan PRIVAT. Publik hanya bila santri/wali memilihnya.

import type { D1Database } from '@cloudflare/workers-types';

export type RaporPayload = {
	periode: { mulai: string; selesai: string };
	hafalan: { ayatDisetujui: number; setoranDisetujui: number; setoranTotal: number };
	habit: { misi: string; judul: string; streakTerbaik: number; hariTerpenuhi: number }[];
	catatanLembaga: string | null;
};

export type RaporPublik = {
	slug: string;
	judul: string;
	santriNama: string;
	lembagaNama: string | null;
	diterbitkanPada: string;
	payload: RaporPayload;
};

/** Karakter aman untuk slug — tanpa yang mudah tertukar saat dibacakan. */
const ACAK = 'abcdefghjkmnpqrstuvwxyz23456789';

export function potonganAcak(panjang = 4): string {
	const bytes = crypto.getRandomValues(new Uint8Array(panjang));
	let hasil = '';
	for (const b of bytes) hasil += ACAK[b % ACAK.length];
	return hasil;
}

export function bentukSlug(lembagaSlug: string | null, nama: string): string {
	const bersih = (nilai: string) =>
		nilai
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 24);

	const bagian = [bersih(lembagaSlug ?? ''), bersih(nama), potonganAcak()].filter(Boolean);
	return bagian.join('-');
}

/**
 * Menghitung isi rapor dari data hidup. Dipanggil SEKALI saat penerbitan,
 * hasilnya dibekukan. Tidak pernah dipanggil oleh halaman publik.
 */
export async function hitungIsiRapor(
	db: D1Database,
	input: { santriUserId: string; mulai: string; selesai: string; catatan?: string | null }
): Promise<RaporPayload> {
	const setoran = await db
		.prepare(
			`SELECT
			   COUNT(*) AS total,
			   SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS disetujui,
			   SUM(CASE WHEN status = 'approved' THEN (ayat_to - ayat_from + 1) ELSE 0 END) AS ayat
			 FROM tpq_setoran
			 WHERE santri_user_id = ? AND date >= ? AND date <= ?`
		)
		.bind(input.santriUserId, input.mulai, input.selesai)
		.first<{ total: number | null; disetujui: number | null; ayat: number | null }>();

	const { results: habitRows } = await db
		.prepare(
			`SELECT hs.mission_key, hm.title, hs.best_streak,
			        (SELECT COUNT(*) FROM habit_checkins hc
			          WHERE hc.user_id = hs.user_id
			            AND hc.mission_key = hs.mission_key
			            AND hc.is_day_met = 1
			            AND hc.local_date >= ? AND hc.local_date <= ?) AS hari_terpenuhi
			   FROM habit_streaks hs
			   LEFT JOIN habit_missions hm ON hm.key = hs.mission_key
			  WHERE hs.user_id = ?
			  ORDER BY hs.best_streak DESC`
		)
		.bind(input.mulai, input.selesai, input.santriUserId)
		.all<{ mission_key: string; title: string | null; best_streak: number; hari_terpenuhi: number }>();

	return {
		periode: { mulai: input.mulai, selesai: input.selesai },
		hafalan: {
			ayatDisetujui: setoran?.ayat ?? 0,
			setoranDisetujui: setoran?.disetujui ?? 0,
			setoranTotal: setoran?.total ?? 0
		},
		habit: (habitRows ?? []).map((r) => ({
			misi: r.mission_key,
			judul: r.title ?? r.mission_key,
			streakTerbaik: r.best_streak,
			hariTerpenuhi: r.hari_terpenuhi
		})),
		catatanLembaga: input.catatan?.trim() || null
	};
}

/**
 * Menerbitkan rapor. Pemanggil WAJIB sudah memastikan penerbit berhak
 * atas lembaga dan santri tersebut.
 */
export async function terbitkanRapor(
	db: D1Database,
	input: {
		santriUserId: string;
		orgId: string;
		orgSlug: string | null;
		santriNama: string;
		judul: string;
		mulai: string;
		selesai: string;
		catatan?: string | null;
		diterbitkanOleh: string;
	}
): Promise<{ id: string; slug: string }> {
	const payload = await hitungIsiRapor(db, {
		santriUserId: input.santriUserId,
		mulai: input.mulai,
		selesai: input.selesai,
		catatan: input.catatan
	});

	const id = crypto.randomUUID();

	// Coba beberapa kali kalau slug acaknya kebetulan bentrok.
	for (let percobaan = 0; percobaan < 5; percobaan += 1) {
		const slug = bentukSlug(input.orgSlug, input.santriNama);
		const bentrok = await db
			.prepare(`SELECT id FROM certificates WHERE slug = ? LIMIT 1`)
			.bind(slug)
			.first<{ id: string }>();
		if (bentrok) continue;

		await db
			.prepare(
				`INSERT INTO certificates
				   (id, santri_id, title, issued_at, org_id, jenis,
				    periode_mulai, periode_selesai, slug, is_public, payload,
				    diterbitkan_oleh)
				 VALUES (?, ?, ?, ?, ?, 'rapor', ?, ?, ?, 0, ?, ?)`
			)
			.bind(
				id,
				input.santriUserId,
				input.judul,
				new Date().toISOString().slice(0, 10),
				input.orgId,
				input.mulai,
				input.selesai,
				slug,
				JSON.stringify(payload),
				input.diterbitkanOleh
			)
			.run();

		return { id, slug };
	}

	throw new Error('GAGAL_MEMBUAT_SLUG');
}

/**
 * Membaca rapor publik. Mengembalikan null bila privat, dicabut, atau
 * tidak ada — pemanggil membalas 404 untuk ketiganya, supaya keberadaan
 * rapor privat tidak bisa diendus dari beda kode status.
 */
export async function raporPublik(db: D1Database, slug: string): Promise<RaporPublik | null> {
	const row = await db
		.prepare(
			`SELECT c.slug, c.title, c.issued_at, c.payload, c.is_public, c.dicabut_at,
			        COALESCE(u.username, u.email) AS santri_nama,
			        o.name AS lembaga_nama
			   FROM certificates c
			   LEFT JOIN users u ON u.id = c.santri_id
			   LEFT JOIN organizations o ON o.id = c.org_id
			  WHERE c.slug = ? LIMIT 1`
		)
		.bind(slug)
		.first<{
			slug: string;
			title: string;
			issued_at: string;
			payload: string | null;
			is_public: number;
			dicabut_at: number | null;
			santri_nama: string | null;
			lembaga_nama: string | null;
		}>();

	if (!row) return null;
	if (row.is_public !== 1) return null;
	if (row.dicabut_at) return null;
	if (!row.payload) return null;

	let payload: RaporPayload;
	try {
		payload = JSON.parse(row.payload) as RaporPayload;
	} catch {
		return null;
	}

	return {
		slug: row.slug,
		judul: row.title,
		santriNama: row.santri_nama ?? 'Santri',
		lembagaNama: row.lembaga_nama,
		diterbitkanPada: row.issued_at,
		payload
	};
}

/**
 * Mengubah rapor menjadi publik atau privat.
 * Hak ini milik SANTRI (pemilik rapor), bukan lembaga — merekalah yang
 * menanggung akibat kalau capaiannya tersebar.
 */
export async function ubahPublikasi(
	db: D1Database,
	input: { raporId: string; pemilikUserId: string; publik: boolean }
): Promise<boolean> {
	const hasil = await db
		.prepare(
			`UPDATE certificates
			    SET is_public = ?, dicabut_at = CASE WHEN ? = 0 THEN unixepoch() ELSE NULL END
			  WHERE id = ? AND santri_id = ?`
		)
		.bind(input.publik ? 1 : 0, input.publik ? 1 : 0, input.raporId, input.pemilikUserId)
		.run();

	return (hasil.meta?.changes ?? 0) > 0;
}
