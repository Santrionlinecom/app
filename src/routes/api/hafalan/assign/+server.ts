import { json, error } from '@sveltejs/kit';
import { submitSurahForUser } from '$lib/server/progress';
import { isTeacherForSantri } from '$lib/server/santri-ustadz';
import { assertFeature, assertLoggedIn, assertOrgMember, isSystemAdmin } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'DB not available');
	}
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertFeature(org.type, user.role, 'setoran');
	// Hanya admin atau ustadz/ustadzah yang boleh assign setoran
	if (user.role !== 'admin' && user.role !== 'ustadz' && user.role !== 'ustadzah') {
		throw error(403, 'Forbidden');
	}

	const body = await request.json().catch(() => ({}));
	const { userId, surahNumber, status, qualityStatus, startAyah, endAyah } = body as {
		userId?: string;
		surahNumber?: number;
		status?: 'belum' | 'setor' | 'disetujui';
		qualityStatus?: 'merah' | 'kuning' | 'hijau';
		startAyah?: number;
		endAyah?: number;
	};

	if (!userId || typeof surahNumber !== 'number') {
		throw error(400, 'userId dan surahNumber wajib diisi');
	}
	if (user.role === 'ustadz' || user.role === 'ustadzah') {
		const allowed = await isTeacherForSantri(locals.db!, {
			santriId: userId,
			ustadzId: user.id
		});
		if (!allowed) {
			throw error(403, 'Santri belum memilih ustadz ini');
		}
	}
	if (!isSystemAdmin(user.role)) {
		const target = await locals.db!
			.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
			.bind(userId)
			.first<{ orgId: string | null }>();
		if (!target?.orgId || target.orgId !== orgId) {
			throw error(403, 'Tidak boleh mengelola santri lembaga lain');
		}
	}

	try {
		await submitSurahForUser(locals.db!, {
			userId,
			surahNumber,
			status: status ?? 'setor',
			qualityStatus,
			startAyah,
			endAyah
		});

		return json({ ok: true });
	} catch (err: any) {
		console.error('assign setoran error', err);
		return json({ error: err?.message ?? 'Gagal assign setoran' }, { status: 500 });
	}
};
