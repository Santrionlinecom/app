// src/routes/(app)/dashboard/halaqoh/+page.server.ts
// Ringkasan halaqoh lembaga — data nyata, bukan placeholder.
//
// Sebelumnya halaman ini hanya menampilkan strip '-' dengan catatan
// "Integrasikan data halaqoh di sini". Angka palsu di dashboard lebih
// berbahaya daripada halaman kosong: pengurus mengira sistemnya belum
// jalan, padahal datanya ada.
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	const orgId = assertOrgMember(user);
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const hariIni = new Date().toISOString().slice(0, 10);

	const [ringkasan, daftar, setoranHariIni] = await Promise.all([
		locals.db
			.prepare(
				`SELECT COUNT(*) AS halaqah_aktif,
				        COALESCE(SUM(
				          (SELECT COUNT(*) FROM halaqah_anggota ha
				            WHERE ha.halaqoh_id = h.id AND ha.status = 'aktif')
				        ), 0) AS total_santri
				   FROM tpq_halaqoh h
				  WHERE h.institution_id = ?`
			)
			.bind(orgId)
			.first<{ halaqah_aktif: number; total_santri: number }>(),

		locals.db
			.prepare(
				`SELECT h.id, h.name AS nama, h.kapasitas,
				        COALESCE(u.username, u.email) AS ustadz_nama,
				        (SELECT COUNT(*) FROM halaqah_anggota ha
				          WHERE ha.halaqoh_id = h.id AND ha.status = 'aktif') AS jumlah,
				        (SELECT COUNT(*) FROM tpq_setoran s
				          WHERE s.halaqoh_id = h.id AND s.status = 'submitted') AS menunggu
				   FROM tpq_halaqoh h
				   LEFT JOIN users u ON u.id = h.ustadz_user_id
				  WHERE h.institution_id = ?
				  ORDER BY h.name`
			)
			.bind(orgId)
			.all<{
				id: string;
				nama: string;
				kapasitas: number;
				ustadz_nama: string | null;
				jumlah: number;
				menunggu: number;
			}>(),

		locals.db
			.prepare(
				`SELECT COUNT(*) AS n FROM tpq_setoran
				  WHERE institution_id = ? AND date = ?`
			)
			.bind(orgId, hariIni)
			.first<{ n: number }>()
	]);

	return {
		halaqahAktif: ringkasan?.halaqah_aktif ?? 0,
		totalSantri: ringkasan?.total_santri ?? 0,
		setoranHariIni: setoranHariIni?.n ?? 0,
		daftar: daftar.results ?? []
	};
};
