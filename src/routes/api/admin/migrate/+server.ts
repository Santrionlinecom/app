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
import { ensureMediaSchema } from '$lib/server/media';
import { ensureSantriUstadzSchema } from '$lib/server/santri-ustadz';
import { ensureTarawihScheduleTable } from '$lib/server/tarawih';
import { ensureImamScheduleTable } from '$lib/server/jadwal-imam';
import { ensureKhotibScheduleTable } from '$lib/server/jadwal-khotib';
import { ensureSystemLogsTable } from '$lib/server/system-logs';

const assertAuthorized = (locals: App.Locals, secret: string | undefined, token: string | null) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'SUPER_ADMIN')) {
		throw error(403, 'Forbidden');
	}
	if (secret && token !== secret) {
		throw error(403, 'Invalid migrate token');
	}
};

export const POST: RequestHandler = async ({ locals, platform, request, url }) => {
	const db = locals.db ?? platform?.env.DB;
	if (!db) throw error(500, 'Database tidak tersedia');

	const secret = platform?.env?.MIGRATE_SECRET as string | undefined;
	const token = request.headers.get('x-migrate-secret') ?? url.searchParams.get('token');
	assertAuthorized(locals, secret, token);

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
	await ensureMediaSchema(db);

	return json({
		ok: true,
		durationMs: Date.now() - startedAt,
		note: 'Jika tabel dasar (users/sessions/organizations) belum ada, jalankan schema.sql atau migrasi Wrangler terlebih dahulu.'
	});
};
