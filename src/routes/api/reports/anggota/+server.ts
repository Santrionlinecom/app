import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrgScope, getOrganizationById, memberRoleByType } from '$lib/server/organizations';

const managerRoles = ['admin', 'SUPER_ADMIN', 'ustadz', 'ustadzah', 'tamir', 'bendahara'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

const escapeCsv = (value: unknown) => {
	const text = value == null ? '' : String(value);
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
};

const formatDate = (value?: number | string | null) => {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const GET: RequestHandler = async ({ locals, url }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}

	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');

	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const requestOrgId = url.searchParams.get('orgId');
	const targetOrgId = isSystemAdmin ? requestOrgId ?? orgId : orgId;

	if (!targetOrgId) {
		throw error(400, 'Organisasi belum ditentukan');
	}

	if (!isSystemAdmin && orgId && targetOrgId !== orgId) {
		throw error(403, 'Tidak boleh akses lembaga lain');
	}

	const org = await getOrganizationById(db, targetOrgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	const memberRole = memberRoleByType[org.type];
	const { results } = await db
		.prepare(
			`SELECT u.id,
					u.username,
					u.email,
					u.role,
					u.org_status as orgStatus,
					u.created_at as createdAt,
					SUM(CASE WHEN hp.status = 'setor' THEN 1 ELSE 0 END) as totalSetor,
					SUM(CASE WHEN hp.status = 'disetujui' THEN 1 ELSE 0 END) as totalDisetujui,
					MAX(hp.tanggal_setor) as lastSetor,
					MAX(hp.tanggal_approve) as lastApprove
			 FROM users u
			 LEFT JOIN hafalan_progress hp ON hp.user_id = u.id
			 WHERE u.org_id = ?
			   AND u.role = ?
			 GROUP BY u.id, u.username, u.email, u.role, u.org_status, u.created_at
			 ORDER BY u.created_at DESC`
		)
		.bind(targetOrgId, memberRole)
		.all<{
			id: string;
			username: string | null;
			email: string;
			role: string;
			orgStatus: string | null;
			createdAt: number | string;
			totalSetor: number | null;
			totalDisetujui: number | null;
			lastSetor: string | null;
			lastApprove: string | null;
		}>();

	const rows = (results ?? []).map((row) => [
		row.username || '-',
		row.email,
		row.role,
		row.orgStatus ?? 'active',
		formatDate(row.createdAt),
		Number(row.totalSetor ?? 0),
		Number(row.totalDisetujui ?? 0),
		formatDate(row.lastSetor),
		formatDate(row.lastApprove)
	]);

	const header = [
		'Nama',
		'Email',
		'Role',
		'Status',
		'Terdaftar',
		'Total Setoran',
		'Total Disetujui',
		'Setoran Terakhir',
		'Disetujui Terakhir'
	];

	const csv = [header, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
	const dateStamp = new Date().toISOString().slice(0, 10);
	const filename = `laporan-${memberRole}-${org.slug}-${dateStamp}.csv`;

	return new Response(`\ufeff${csv}`, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
