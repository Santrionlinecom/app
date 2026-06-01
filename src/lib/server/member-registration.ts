import { fail, redirect } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';
import type { OrgType } from '$lib/server/organizations';

type LoggedInMemberParams = {
	db: D1Database;
	user: App.Locals['user'];
	org: {
		id: string;
		name: string;
		type: OrgType;
	};
	role: string;
	source: string;
	request: Request;
	platform?: App.Platform;
};

export const registerLoggedInMember = async ({
	db,
	user,
	org,
	role,
	source,
	request,
	platform
}: LoggedInMemberParams) => {
	if (!user) return null;

	const currentOrgId = user.orgId ?? null;
	if (currentOrgId === org.id) {
		throw redirect(302, user.orgStatus === 'pending' ? '/menunggu' : '/dashboard');
	}
	if (currentOrgId) {
		return fail(400, { error: 'Akun ini sudah terdaftar di lembaga lain.' });
	}

	await db
		.prepare(
			`UPDATE users
			 SET org_id = ?, org_status = ?, role = ?
			 WHERE id = ? AND (org_id IS NULL OR org_id = '')`
		)
		.bind(org.id, 'pending', role, user.id)
		.run();

	await logActivity(db, {
		userId: user.id,
		action: 'REGISTER',
		metadata: { orgId: org.id, orgName: org.name, orgType: org.type, role, source }
	});
	logSystemActivity(db, 'REGISTER', {
		userId: user.id,
		userEmail: user.email,
		ipAddress: getRequestIp(request) ?? null,
		metadata: { orgId: org.id, orgName: org.name, orgType: org.type, role, source },
		waitUntil: platform?.context?.waitUntil
	});

	throw redirect(302, '/menunggu');
};
