import { error } from '@sveltejs/kit';
import { assertOrgMember } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';

/**
 * Layar pendataan santri TPQ.
 *
 * Terpisah dari `kelola-santri` yang membuat akun login dan dipakai bersama
 * untuk jamaah masjid. Anak TPQ usia 5-12 tahun didata tanpa akun.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Silakan login terlebih dahulu.');
	}

	// Memastikan halaman hanya terbuka untuk anggota lembaga aktif.
	const lembagaId = assertOrgMember(locals.user);

	return {
		lembagaId,
		lembagaNama: locals.activeOrg?.org_name ?? null,
		orgType: locals.orgType
	};
};
