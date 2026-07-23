import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { assertFeature, assertLoggedIn, isSystemAdmin } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	// Super Admin without institution context can still open the page shell.
	if (isSystemAdmin(user.role) && !user.orgId) {
		return {
			org: null,
			ready: false,
			note: 'Pilih/impersonate lembaga dulu untuk data ujian per lembaga.'
		};
	}

	const orgId = user.orgId ?? null;
	if (!orgId) {
		throw error(403, 'Akun belum terhubung ke lembaga. Hubungkan lembaga dari menu Lembaga/Dashboard.');
	}

	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertFeature(org.type, user.role, 'ujian');
	return {
		org: { id: org.id, name: org.name, type: org.type },
		ready: false,
		note: 'Modul ujian tahfidz masih disiapkan. Gunakan setoran/review sementara.'
	};
};
