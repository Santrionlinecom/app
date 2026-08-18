import { json } from '@sveltejs/kit';
import { clearActiveOrgCookie, loadMemberships, setActiveOrgCookie } from '$lib/server/active-org';
import type { RequestHandler } from './$types';

/**
 * Menyimpan pilihan lembaga aktif di sisi server.
 *
 * Sebelumnya LembagaSwitcher hanya mengubah store di browser, sehingga server
 * tetap melayani lembaga lama. Pilihan kini disimpan dalam cookie httpOnly dan
 * dibaca kembali oleh hooks pada setiap permintaan.
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	if (!locals.db) {
		return json({ error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	let orgId = '';
	try {
		const body = (await request.json()) as { orgId?: unknown };
		orgId = typeof body?.orgId === 'string' ? body.orgId.trim() : '';
	} catch {
		return json({ error: 'Permintaan tidak valid.' }, { status: 400 });
	}

	if (!orgId) {
		return json({ error: 'Lembaga wajib dipilih.' }, { status: 400 });
	}

	// Wajib divalidasi terhadap keanggotaan: tanpa ini siapa pun bisa menyetel
	// cookie ke lembaga milik orang lain dan membaca datanya.
	const memberships = await loadMemberships(locals.db, locals.user.id);
	const target = memberships.find((m) => m.org_id === orgId && m.is_active);

	if (!target) {
		return json({ error: 'Anda tidak punya akses ke lembaga tersebut.' }, { status: 403 });
	}

	setActiveOrgCookie(cookies, target.org_id);

	return json({
		ok: true,
		lembaga: {
			id: target.org_id,
			name: target.org_name ?? null,
			type: target.org_type,
			role: target.role
		}
	});
};

/** Menghapus pilihan lembaga aktif (kembali ke bawaan). */
export const DELETE: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	clearActiveOrgCookie(cookies);
	return json({ ok: true });
};
