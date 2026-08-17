import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isSuperAdminUser } from '$lib/auth/session-user';
import { bersihkanHtml } from '$lib/server/domains/kursus/format-materi';

/**
 * Suntingan langsung (inline) halaman kursus oleh Super Admin.
 *
 * Dipakai tombol "Edit Halaman" di /kursus/[slug]: judul, ringkasan, dan isi
 * materi diedit di tempat lalu disimpan ke D1 tanpa berpindah halaman.
 * Hanya Super Admin; peserta biasa ditolak 403.
 */

type Payload = {
	kursusId?: string;
	judul?: string;
	ringkasan?: string;
	materi?: Array<{ id: string; judul?: string; isi?: string }>;
};

const teks = (v: unknown, maks = 500) =>
	typeof v === 'string' ? v.trim().slice(0, maks) : undefined;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		return json({ ok: false, pesan: 'Hanya Super Admin yang boleh menyunting.' }, { status: 403 });
	}
	const db = locals.db;
	if (!db) return json({ ok: false, pesan: 'Layanan data tidak tersedia.' }, { status: 500 });

	let body: Payload;
	try {
		body = (await request.json()) as Payload;
	} catch {
		return json({ ok: false, pesan: 'Permintaan tidak valid.' }, { status: 400 });
	}

	const kursusId = teks(body.kursusId, 64);
	if (!kursusId) return json({ ok: false, pesan: 'kursusId wajib.' }, { status: 400 });

	const ada = await db
		.prepare('SELECT id FROM kursus WHERE id = ? LIMIT 1')
		.bind(kursusId)
		.first<{ id: string }>();
	if (!ada?.id) return json({ ok: false, pesan: 'Kursus tidak ditemukan.' }, { status: 404 });

	// Perbarui atribut kursus bila dikirim.
	const judul = teks(body.judul, 300);
	const ringkasan = teks(body.ringkasan, 1000);
	if (judul !== undefined || ringkasan !== undefined) {
		const sets: string[] = [];
		const vals: string[] = [];
		if (judul) {
			sets.push('judul = ?');
			vals.push(judul);
		}
		if (ringkasan !== undefined) {
			sets.push('ringkasan = ?');
			vals.push(ringkasan);
		}
		if (sets.length) {
			vals.push(kursusId);
			await db.prepare(`UPDATE kursus SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
		}
	}

	// Perbarui materi (judul dan/atau isi HTML) bila dikirim.
	let materiDiperbarui = 0;
	for (const m of body.materi ?? []) {
		const id = teks(m.id, 64);
		if (!id) continue;
		const judulMateri = teks(m.judul, 300);
		const isiHtml = typeof m.isi === 'string' ? bersihkanHtml(m.isi).slice(0, 200_000) : undefined;

		const sets: string[] = [];
		const vals: string[] = [];
		if (judulMateri) {
			sets.push('judul = ?');
			vals.push(judulMateri);
		}
		if (isiHtml !== undefined) {
			sets.push('isi = ?', "format = 'html'");
			vals.push(isiHtml);
		}
		if (!sets.length) continue;

		vals.push(id, kursusId);
		const res = await db
			.prepare(`UPDATE kursus_materi SET ${sets.join(', ')} WHERE id = ? AND kursus_id = ?`)
			.bind(...vals)
			.run();
		if (res.meta.changes > 0) materiDiperbarui += 1;
	}

	return json({ ok: true, materiDiperbarui });
};
