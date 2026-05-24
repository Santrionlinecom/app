import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureOrgSchema } from '$lib/server/organizations';
import { ensureOrgMediaSchema } from '$lib/server/org-media';
import { ensureOrgAssetsTable } from '$lib/server/org-assets';
import { ensureUserOptionalColumns } from '$lib/server/users';
import { ensureHafalanTable, ensureHafalanSurahChecksTable } from '$lib/server/hafalan';
import { ensureCalendarTable, ensureMurojaTable } from '$lib/server/calendar';
import { ensureCertificateTable } from '$lib/server/certificates';
import { ensureTrafficTable } from '$lib/server/traffic';
import { ensureUmmahTables } from '$lib/server/ummah';
import { ensureChatTable } from '$lib/server/chat';
import { ensureCmsSchema } from '$lib/server/cms';
import { ensureDigitalCommerceSchema } from '$lib/server/digital-commerce';
import { ensureMediaSchema } from '$lib/server/media';
import { ensureSantriUstadzSchema } from '$lib/server/santri-ustadz';
import { ensureTarawihScheduleTable } from '$lib/server/tarawih';
import { ensureImamScheduleTable } from '$lib/server/jadwal-imam';
import { ensureKhotibScheduleTable } from '$lib/server/jadwal-khotib';
import { ensureSystemLogsTable } from '$lib/server/system-logs';
import { ensureApiRateLimitTable } from '$lib/server/rate-limit';
import { ensureStreamerLicenseTables } from '$lib/server/license/streamer-db';
import { ensureBukuAccessSchema } from '$lib/server/buku-access';
import { ensureBukuLibrarySchema } from '$lib/server/buku-library';
import { ensureBukuWalletSchema } from '$lib/server/buku-wallet';
import { ensureDrmSchema } from '$lib/server/drm';
import { ensureHafalanRaporSchema } from '$lib/server/db-hafalan';
import { ensureKitabReferenceSchema } from '$lib/server/rag';
import { requireMaintenanceAccess } from '$lib/server/admin-maintenance';
import { getRequestIp, logActivity } from '$lib/server/logger';

export const POST: RequestHandler = async ({ locals, platform, request, url }) => {
	const db = locals.db ?? platform?.env.DB;
	if (!db) throw error(500, 'Layanan data tidak tersedia');

	const secret = platform?.env?.MIGRATE_SECRET as string | undefined;
	const token = request.headers.get('x-migrate-secret') ?? url.searchParams.get('token');
	const { user } = requireMaintenanceAccess({
		locals: { ...locals, db },
		secret,
		token,
		secretName: 'MIGRATE_SECRET'
	});

	const startedAt = Date.now();
	await ensureOrgSchema(db);
	await ensureUserOptionalColumns(db);
	await ensureOrgMediaSchema(db);
	await ensureOrgAssetsTable(db);
	await ensureHafalanTable(db);
	await ensureHafalanSurahChecksTable(db);
	await ensureCalendarTable(db);
	await ensureMurojaTable(db);
	await ensureCertificateTable(db);
	await ensureSantriUstadzSchema(db);
	await ensureTrafficTable(db);
	await ensureSystemLogsTable(db);
	await ensureUmmahTables(db);
	await ensureTarawihScheduleTable(db);
	await ensureImamScheduleTable(db);
	await ensureKhotibScheduleTable(db);
	await ensureChatTable(db);
	await ensureCmsSchema(db);
	await ensureDigitalCommerceSchema(db);
	await ensureMediaSchema(db);
	await ensureApiRateLimitTable(db);
	await ensureStreamerLicenseTables(db);
	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuWalletSchema(db);
	await ensureDrmSchema(db);
	await ensureHafalanRaporSchema(db);
	await ensureKitabReferenceSchema(db);

	logActivity(db, 'ADMIN_MIGRATE_SCHEMA', {
		userId: user.id,
		userEmail: user.email,
		ipAddress: getRequestIp(request),
		metadata: {
			durationMs: Date.now() - startedAt
		},
		waitUntil: platform?.context?.waitUntil
	});

	return json({
		ok: true,
		durationMs: Date.now() - startedAt,
		note: 'Jika data dasar belum tersedia, jalankan pembaruan skema melalui panel super admin.'
	});
};
