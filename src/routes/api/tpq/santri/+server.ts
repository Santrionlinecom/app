import { error, json } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { assertCanAddSantri } from '$lib/server/addons';
import { assertOrgMember } from '$lib/server/auth/rbac';
import { requirePermission } from '$lib/rbac/helpers';
import { normalizeSantriInput } from '$lib/server/domains/tpq/santri-data';
import type { RequestHandler } from './$types';

/**
 * Pendataan santri TPQ tanpa akun login.
 *
 * Terpisah dari `/api/santri` yang membuat baris `users` — endpoint itu juga
 * dipakai untuk mendaftarkan ustadz dan admin, jadi tidak diubah.
 *
 * Lembaga selalu diambil dari sesi (lembaga aktif), tidak pernah dari isian
 * pengguna, supaya pengurus tidak bisa menulis ke lembaga milik orang lain.
 */

const ensureUser = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Silakan login terlebih dahulu.');
	}
	return locals.user;
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = ensureUser(locals);
	requirePermission(locals, 'student.read');

	const db = locals.db;
	if (!db) throw error(500, 'Layanan data tidak tersedia.');

	const lembagaId = assertOrgMember(user);

	const limitRaw = Number(url.searchParams.get('limit') ?? '50');
	const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 50;
	const pageRaw = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

	const { results } = await db
		.prepare(
			`SELECT id, nama, nis, kelas, wali_nama AS waliNama, wali_hp AS waliHp,
			        is_aktif AS isAktif, user_id AS userId, created_at AS createdAt
			 FROM santri
			 WHERE lembaga_id = ?
			 ORDER BY is_aktif DESC, nama COLLATE NOCASE ASC
			 LIMIT ? OFFSET ?`
		)
		.bind(lembagaId, limit, (page - 1) * limit)
		.all();

	const total = await db
		.prepare('SELECT COUNT(1) AS n FROM santri WHERE lembaga_id = ?')
		.bind(lembagaId)
		.first<{ n: number }>();

	return json({
		santri: results ?? [],
		pagination: { page, limit, totalCount: Number(total?.n ?? 0) }
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = ensureUser(locals);
	requirePermission(locals, 'student.write');

	const db = locals.db;
	if (!db) throw error(500, 'Layanan data tidak tersedia.');

	const lembagaId = assertOrgMember(user);

	const body = await request.json().catch(() => ({}));
	const hasil = normalizeSantriInput(body);
	if (!hasil.ok) {
		throw error(400, hasil.error);
	}

	const kuota = await assertCanAddSantri(db, lembagaId);
	if (!kuota.canAdd) {
		throw error(403, kuota.error ?? 'Batas santri gratis tercapai.');
	}

	const id = generateId(15);
	const { nama, nis, kelas, waliNama, waliHp, isAktif } = hasil.value;

	await db
		.prepare(
			`INSERT INTO santri (id, lembaga_id, user_id, nama, nis, kelas, wali_nama, wali_hp, is_aktif, created_at)
			 VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(id, lembagaId, nama, nis, kelas, waliNama, waliHp, isAktif, Date.now())
		.run();

	return json(
		{
			id,
			nama,
			nis,
			kelas,
			waliNama,
			waliHp,
			kuota: { used: kuota.used + 1, limit: kuota.limit, unlimited: kuota.unlimited }
		},
		{ status: 201 }
	);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = ensureUser(locals);
	requirePermission(locals, 'student.write');

	const db = locals.db;
	if (!db) throw error(500, 'Layanan data tidak tersedia.');

	const lembagaId = assertOrgMember(user);

	const body = await request.json().catch(() => ({}));
	const id = typeof body?.id === 'string' ? body.id.trim() : '';
	if (!id) throw error(400, 'ID santri wajib diisi.');

	// Penyaring lembaga_id mencegah pengurus menghapus santri lembaga lain.
	const hasil = await db
		.prepare('DELETE FROM santri WHERE id = ? AND lembaga_id = ?')
		.bind(id, lembagaId)
		.run();

	if (!hasil.meta?.changes) {
		throw error(404, 'Santri tidak ditemukan di lembaga ini.');
	}

	return json({ ok: true });
};
