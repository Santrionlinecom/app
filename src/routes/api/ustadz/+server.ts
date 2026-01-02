import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import { isEducationalOrgType } from '$lib/server/utils';
import { assignSantriTeacher, getSantriTeacherId, listOrgTeachers } from '$lib/server/santri-ustadz';

const ensureSantri = async (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	if (locals.user.role !== 'santri') {
		throw error(403, 'Forbidden');
	}
	if (!locals.user.orgId) {
		throw error(400, 'Organisasi belum ditentukan');
	}
	const org = await getOrganizationById(locals.db, locals.user.orgId);
	if (!isEducationalOrgType(org?.type)) {
		throw error(403, 'Fitur ustadz hanya untuk pondok/TPQ/rumah tahfidz');
	}
	return { db: locals.db, orgId: locals.user.orgId, org };
};

export const GET: RequestHandler = async ({ locals }) => {
	const { db, orgId, org } = await ensureSantri(locals);
	const teachers = await listOrgTeachers(db, orgId);
	const selectedTeacherId = await getSantriTeacherId(db, locals.user!.id);
	return json({
		orgType: org?.type ?? null,
		teachers,
		selectedTeacherId
	});
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, orgId } = await ensureSantri(locals);
	const body = await request.json().catch(() => ({}));
	const ustadzId = typeof body.ustadzId === 'string' ? body.ustadzId.trim() : '';

	if (!ustadzId) {
		throw error(400, 'Ustadz wajib dipilih');
	}

	const target = await db
		.prepare(
			`SELECT id, role, org_id as orgId
			 FROM users
			 WHERE id = ?
			   AND (org_status IS NULL OR org_status = 'active')`
		)
		.bind(ustadzId)
		.first<{ id: string; role: string; orgId: string | null }>();

	if (!target || target.orgId !== orgId) {
		throw error(404, 'Ustadz tidak ditemukan di lembaga ini');
	}
	if (!['ustadz', 'ustadzah', 'admin'].includes(target.role)) {
		throw error(400, 'Role guru tidak valid');
	}

	const assignment = await assignSantriTeacher(db, {
		santriId: locals.user!.id,
		ustadzId,
		orgId
	});

	return json({ ok: true, assignment });
};
