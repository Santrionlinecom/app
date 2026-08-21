// src/lib/server/coins/topup-manual.ts
// Top up coin lewat transfer manual (BCA/QRIS), pendamping Midtrans.
//
// Aturan yang ditegakkan di sini, bukan di UI:
// 1. NOMINAL SELALU DARI PAKET DI SERVER. Klien hanya mengirim id paket;
//    angka rupiah tidak pernah dipercaya dari form. Kalau nominal boleh
//    datang dari klien, siapa pun bisa membeli 10.000 coin seharga Rp1.
// 2. COIN TIDAK BERTAMBAH DI SINI. Permintaan hanya dicatat 'pending';
//    saldo baru bergerak setelah admin menyetujui lewat jalur yang sudah
//    ada (approveManualCoinTopup).
// 3. BUKTI TRANSFER WAJIB. Tanpa bukti, admin tidak punya dasar memverifikasi.
// 4. Metode pembayaran dibaca dari database (digital_payment_methods),
//    supaya rekening bisa diubah lewat CMS tanpa menyentuh kode.

import type { D1Database } from '@cloudflare/workers-types';
import { listDigitalPaymentMethods } from '$lib/server/domains/digital-store/commerce';

export type MetodeManual = {
	id: string;
	nama: string;
	tipe: string;
	atasNama: string | null;
	nomorRekening: string | null;
	gambarUrl: string | null;
	instruksi: string | null;
};

/** Janji waktu verifikasi yang ditampilkan ke santri. Ditulis apa adanya. */
export const JANJI_VERIFIKASI = 'Dicek maksimal 1x24 jam';

export const MAKS_CATATAN = 500;

/** Metode manual yang AKTIF saja — yang nonaktif tidak boleh bocor ke UI. */
export async function metodeManualAktif(db: D1Database): Promise<MetodeManual[]> {
	const semua = await listDigitalPaymentMethods(db);

	return semua
		.filter((m) => m.isActive)
		.map((m) => ({
			id: m.id,
			nama: m.name,
			tipe: m.type,
			atasNama: m.accountName ?? null,
			nomorRekening: m.accountNumber ?? null,
			gambarUrl: m.assetUrl ?? null,
			instruksi: m.instructions ?? null
		}));
}

export type HasilTopupManual =
	| { ok: true; id: string }
	| {
			ok: false;
			alasan: 'paket_tidak_sah' | 'metode_tidak_sah' | 'bukti_kosong' | 'catatan_panjang';
	  };

/**
 * Mencatat permintaan top up manual. TIDAK menambah saldo.
 *
 * @param paket paket yang SUDAH diambil dari katalog server — bukan dari form.
 */
export async function buatPermintaanManual(
	db: D1Database,
	input: {
		userId: string;
		paket: { id: string; name: string; amountRupiah: number; coinAmount: number } | null;
		metodeId: string;
		buktiUrl: string;
		catatan?: string;
	}
): Promise<HasilTopupManual> {
	if (!input.paket) return { ok: false, alasan: 'paket_tidak_sah' };

	const bukti = input.buktiUrl.trim();
	if (!bukti) return { ok: false, alasan: 'bukti_kosong' };

	const catatan = (input.catatan ?? '').trim();
	if (catatan.length > MAKS_CATATAN) return { ok: false, alasan: 'catatan_panjang' };

	// Metode wajib salah satu yang aktif di database.
	const metode = (await metodeManualAktif(db)).find((m) => m.id === input.metodeId);
	if (!metode) return { ok: false, alasan: 'metode_tidak_sah' };

	const id = `manual-${crypto.randomUUID()}`;
	const sekarang = new Date().toISOString();

	const label = `[MANUAL][${metode.nama}][PAKET: ${input.paket.name}]`;
	const userNote = catatan ? `${label} ${catatan}` : label;

	await db
		.prepare(
			`INSERT INTO coin_topup_requests
			   (id, user_id, amount_rupiah, coin_amount, proof_url, user_note,
			    status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
		)
		.bind(
			id,
			input.userId,
			// Nominal & jumlah coin diambil dari paket server.
			input.paket.amountRupiah,
			input.paket.coinAmount,
			bukti,
			userNote,
			sekarang,
			sekarang
		)
		.run();

	return { ok: true, id };
}

/** Riwayat permintaan manual milik seorang pengguna. */
export async function permintaanManualSaya(
	db: D1Database,
	userId: string,
	batas = 10
): Promise<
	{
		id: string;
		amountRupiah: number;
		coinAmount: number;
		status: 'pending' | 'approved' | 'rejected';
		adminNote: string | null;
		createdAt: string;
	}[]
> {
	const { results } = await db
		.prepare(
			`SELECT id, amount_rupiah, coin_amount, status, admin_note, created_at
			   FROM coin_topup_requests
			  WHERE user_id = ? AND id LIKE 'manual-%'
			  ORDER BY created_at DESC
			  LIMIT ?`
		)
		.bind(userId, batas)
		.all<{
			id: string;
			amount_rupiah: number;
			coin_amount: number;
			status: 'pending' | 'approved' | 'rejected';
			admin_note: string | null;
			created_at: string;
		}>();

	return (results ?? []).map((r) => ({
		id: r.id,
		amountRupiah: r.amount_rupiah,
		coinAmount: r.coin_amount,
		status: r.status,
		adminNote: r.admin_note,
		createdAt: r.created_at
	}));
}
