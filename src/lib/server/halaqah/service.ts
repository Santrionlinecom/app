// src/lib/server/halaqah/service.ts
// Halaqah kecil + setoran yang dibalas manusia (Tahap B).
//
// Keputusan yang ditegakkan di sini:
// 1. Santri hanya boleh melihat/menyetor ke halaqah yang dia ANGGOTAnya.
//    Setiap pembacaan lewat assertAnggotaHalaqah().
// 2. Halaqah punya kapasitas. Kelompok yang membesar tanpa batas berhenti
//    terasa sebagai halaqah, dan musyrif tak sanggup membalas satu per satu.
// 3. Setoran santri SELALU berstatus 'submitted' — santri tidak bisa
//    meluluskan dirinya sendiri. Hanya musyrif yang mengubah status.
// 4. Balasan musyrif wajib berupa teks manusia, bukan sekadar tombol.

import type { D1Database } from '@cloudflare/workers-types';

export type SetoranJenis = 'hafalan' | 'murojaah';
export type SetoranMutu = 'lancar' | 'cukup' | 'belum';

export type HalaqahRingkas = {
	id: string;
	nama: string;
	ustadzNama: string | null;
	jumlahAnggota: number;
	kapasitas: number;
};

export type SetoranSaya = {
	id: string;
	tanggal: string;
	jenis: SetoranJenis;
	surah: string;
	ayatDari: number;
	ayatSampai: number;
	status: 'submitted' | 'approved' | 'rejected';
	mutu: SetoranMutu | null;
	balasan: string | null;
	dibalasAt: number | null;
};

export const SETORAN_JENIS: SetoranJenis[] = ['hafalan', 'murojaah'];

/** Batas panjang catatan, disamakan dengan domain TPQ yang sudah ada. */
export const MAKS_CATATAN = 1000;

export function bersihkanTeks(nilai: unknown, maks: number): string {
	return String(nilai ?? '')
		.replace(/[\u0000-\u001f\u007f]/g, ' ')
		.trim()
		.slice(0, maks);
}

/**
 * Gerbang: santri harus anggota aktif halaqah ini.
 * WAJIB dipanggil sebelum membaca atau menulis apa pun milik halaqah.
 */
export async function assertAnggotaHalaqah(
	db: D1Database,
	halaqohId: string,
	santriUserId: string
): Promise<void> {
	const row = await db
		.prepare(
			`SELECT id FROM halaqah_anggota
			  WHERE halaqoh_id = ? AND santri_user_id = ? AND status = 'aktif' LIMIT 1`
		)
		.bind(halaqohId, santriUserId)
		.first<{ id: string }>();

	if (!row) throw new Error('BUKAN_ANGGOTA_HALAQAH');
}

/** Halaqah yang diikuti seorang santri. */
export async function halaqahSaya(
	db: D1Database,
	santriUserId: string
): Promise<HalaqahRingkas[]> {
	const { results } = await db
		.prepare(
			`SELECT h.id, h.name AS nama, h.kapasitas,
			        COALESCE(u.username, u.email) AS ustadz_nama,
			        (SELECT COUNT(*) FROM halaqah_anggota ha2
			          WHERE ha2.halaqoh_id = h.id AND ha2.status = 'aktif') AS jumlah_anggota
			   FROM halaqah_anggota ha
			   JOIN tpq_halaqoh h ON h.id = ha.halaqoh_id
			   LEFT JOIN users u ON u.id = h.ustadz_user_id
			  WHERE ha.santri_user_id = ? AND ha.status = 'aktif'
			  ORDER BY h.name`
		)
		.bind(santriUserId)
		.all<{
			id: string;
			nama: string;
			kapasitas: number;
			ustadz_nama: string | null;
			jumlah_anggota: number;
		}>();

	return (results ?? []).map((r) => ({
		id: r.id,
		nama: r.nama,
		ustadzNama: r.ustadz_nama,
		jumlahAnggota: r.jumlah_anggota,
		kapasitas: r.kapasitas
	}));
}

export type HasilGabung =
	| { ok: true }
	| { ok: false; alasan: 'penuh' | 'sudah_anggota' | 'halaqah_tidak_ada' };

/**
 * Menambahkan santri ke halaqah. Dipanggil oleh pengurus lembaga.
 * Kapasitas diperiksa di sini, bukan di UI.
 */
export async function tambahAnggota(
	db: D1Database,
	halaqohId: string,
	santriUserId: string
): Promise<HasilGabung> {
	const halaqah = await db
		.prepare(`SELECT id, kapasitas FROM tpq_halaqoh WHERE id = ? LIMIT 1`)
		.bind(halaqohId)
		.first<{ id: string; kapasitas: number }>();

	if (!halaqah) return { ok: false, alasan: 'halaqah_tidak_ada' };

	const sudah = await db
		.prepare(
			`SELECT id FROM halaqah_anggota
			  WHERE halaqoh_id = ? AND santri_user_id = ? AND status = 'aktif' LIMIT 1`
		)
		.bind(halaqohId, santriUserId)
		.first<{ id: string }>();

	if (sudah) return { ok: false, alasan: 'sudah_anggota' };

	const hitung = await db
		.prepare(
			`SELECT COUNT(*) AS n FROM halaqah_anggota
			  WHERE halaqoh_id = ? AND status = 'aktif'`
		)
		.bind(halaqohId)
		.first<{ n: number }>();

	if ((hitung?.n ?? 0) >= halaqah.kapasitas) return { ok: false, alasan: 'penuh' };

	await db
		.prepare(
			`INSERT INTO halaqah_anggota (id, halaqoh_id, santri_user_id, status, joined_at)
			 VALUES (?, ?, ?, 'aktif', unixepoch())
			 ON CONFLICT(halaqoh_id, santri_user_id) DO UPDATE SET
			   status = 'aktif', left_at = NULL`
		)
		.bind(crypto.randomUUID(), halaqohId, santriUserId)
		.run();

	return { ok: true };
}

/**
 * Santri mengirim setoran. SELALU berstatus 'submitted' —
 * santri tidak pernah bisa meluluskan dirinya sendiri.
 */
export async function kirimSetoran(
	db: D1Database,
	input: {
		halaqohId: string;
		santriUserId: string;
		jenis: SetoranJenis;
		surah: string;
		ayatDari: number;
		ayatSampai: number;
		catatan?: string;
	}
): Promise<{ id: string }> {
	await assertAnggotaHalaqah(db, input.halaqohId, input.santriUserId);

	if (!SETORAN_JENIS.includes(input.jenis)) throw new Error('JENIS_TIDAK_SAH');
	if (!Number.isInteger(input.ayatDari) || input.ayatDari < 1) throw new Error('AYAT_TIDAK_SAH');
	if (!Number.isInteger(input.ayatSampai) || input.ayatSampai < input.ayatDari) {
		throw new Error('AYAT_TIDAK_SAH');
	}

	const halaqah = await db
		.prepare(`SELECT institution_id, ustadz_user_id FROM tpq_halaqoh WHERE id = ? LIMIT 1`)
		.bind(input.halaqohId)
		.first<{ institution_id: string; ustadz_user_id: string }>();

	if (!halaqah) throw new Error('HALAQAH_TIDAK_ADA');

	const id = crypto.randomUUID();
	const tanggal = new Date().toISOString().slice(0, 10);

	await db
		.prepare(
			`INSERT INTO tpq_setoran
			   (id, institution_id, santri_user_id, ustadz_user_id, halaqoh_id, date,
			    type, surah, ayat_from, ayat_to, quality, notes, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'belum', ?, 'submitted')`
		)
		.bind(
			id,
			halaqah.institution_id,
			input.santriUserId,
			halaqah.ustadz_user_id,
			input.halaqohId,
			tanggal,
			input.jenis,
			bersihkanTeks(input.surah, 80),
			input.ayatDari,
			input.ayatSampai,
			bersihkanTeks(input.catatan ?? '', MAKS_CATATAN) || null
		)
		.run();

	return { id };
}

/** Riwayat setoran seorang santri, termasuk balasan musyrifnya. */
export async function setoranSaya(
	db: D1Database,
	santriUserId: string,
	batas = 30
): Promise<SetoranSaya[]> {
	const { results } = await db
		.prepare(
			`SELECT id, date, type, surah, ayat_from, ayat_to, status, quality,
			        notes, reviewed_at
			   FROM tpq_setoran
			  WHERE santri_user_id = ?
			  ORDER BY date DESC, created_at DESC
			  LIMIT ?`
		)
		.bind(santriUserId, batas)
		.all<{
			id: string;
			date: string;
			type: SetoranJenis;
			surah: string;
			ayat_from: number;
			ayat_to: number;
			status: 'submitted' | 'approved' | 'rejected';
			quality: SetoranMutu | null;
			notes: string | null;
			reviewed_at: number | null;
		}>();

	return (results ?? []).map((r) => ({
		id: r.id,
		tanggal: r.date,
		jenis: r.type,
		surah: r.surah,
		ayatDari: r.ayat_from,
		ayatSampai: r.ayat_to,
		status: r.status,
		mutu: r.quality,
		balasan: r.notes,
		dibalasAt: r.reviewed_at
	}));
}

/**
 * Musyrif membalas setoran. Balasan teks WAJIB — inilah yang membuat
 * seorang santri merasa disimak manusia, bukan dinilai mesin.
 */
export async function balasSetoran(
	db: D1Database,
	input: {
		setoranId: string;
		ustadzUserId: string;
		mutu: SetoranMutu;
		balasan: string;
		disetujui: boolean;
	}
): Promise<void> {
	const balasan = bersihkanTeks(input.balasan, MAKS_CATATAN);
	if (balasan.length < 3) throw new Error('BALASAN_KOSONG');

	// Gerbang: hanya musyrif halaqah terkait yang boleh membalas.
	const setoran = await db
		.prepare(
			`SELECT s.id FROM tpq_setoran s
			   JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			  WHERE s.id = ? AND h.ustadz_user_id = ? LIMIT 1`
		)
		.bind(input.setoranId, input.ustadzUserId)
		.first<{ id: string }>();

	if (!setoran) throw new Error('BUKAN_MUSYRIF_SETORAN_INI');

	await db
		.prepare(
			`UPDATE tpq_setoran
			    SET status = ?, quality = ?, notes = ?,
			        reviewed_by = ?, reviewed_at = unixepoch()
			  WHERE id = ?`
		)
		.bind(
			input.disetujui ? 'approved' : 'rejected',
			input.mutu,
			balasan,
			input.ustadzUserId,
			input.setoranId
		)
		.run();
}

/** Setoran yang menunggu dibalas musyrif. */
export async function setoranMenunggu(
	db: D1Database,
	ustadzUserId: string
): Promise<
	{ id: string; santriNama: string; halaqahNama: string; tanggal: string; surah: string; ayatDari: number; ayatSampai: number; jenis: SetoranJenis }[]
> {
	const { results } = await db
		.prepare(
			`SELECT s.id, s.date, s.surah, s.ayat_from, s.ayat_to, s.type,
			        COALESCE(u.username, u.email) AS santri_nama,
			        h.name AS halaqah_nama
			   FROM tpq_setoran s
			   JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			   LEFT JOIN users u ON u.id = s.santri_user_id
			  WHERE h.ustadz_user_id = ? AND s.status = 'submitted'
			  ORDER BY s.date ASC, s.created_at ASC
			  LIMIT 100`
		)
		.bind(ustadzUserId)
		.all<{
			id: string;
			date: string;
			surah: string;
			ayat_from: number;
			ayat_to: number;
			type: SetoranJenis;
			santri_nama: string;
			halaqah_nama: string;
		}>();

	return (results ?? []).map((r) => ({
		id: r.id,
		santriNama: r.santri_nama,
		halaqahNama: r.halaqah_nama,
		tanggal: r.date,
		surah: r.surah,
		ayatDari: r.ayat_from,
		ayatSampai: r.ayat_to,
		jenis: r.type
	}));
}
