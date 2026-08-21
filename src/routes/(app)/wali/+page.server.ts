// src/routes/(app)/wali/+page.server.ts
// Beranda wali: daftar anak yang berhak dipantau.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { daftarAnak, tukarUndangan } from '$lib/server/wali/service';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const anak = await daftarAnak(locals.db, user.id);
	return { anak };
};

const PESAN_GAGAL: Record<string, string> = {
	tidak_ditemukan: 'Kode tidak dikenali. Periksa kembali huruf dan angkanya.',
	kedaluwarsa: 'Kode ini sudah kedaluwarsa. Mintalah kode baru ke lembaga.',
	sudah_dipakai: 'Kode ini sudah pernah dipakai. Mintalah kode baru.',
	diri_sendiri: 'Kode ini untuk akun Anda sendiri, bukan untuk memantau anak.',
	sudah_terhubung: 'Anda sudah terhubung dengan santri ini.'
};

export const actions: Actions = {
	hubungkan: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const kode = String(data.get('kode') ?? '').trim();

		if (!kode) return fail(400, { pesan: 'Masukkan kode undangan lebih dulu.' });

		const hasil = await tukarUndangan(locals.db, kode, user.id);

		if (!hasil.ok) {
			// Semua kegagalan memakai status 400 yang sama supaya tidak bisa
			// dipakai menebak keberadaan akun santri tertentu.
			return fail(400, { pesan: PESAN_GAGAL[hasil.alasan] ?? 'Kode tidak dapat digunakan.' });
		}

		return { sukses: true };
	}
};
