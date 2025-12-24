import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureUmmahTables } from '$lib/server/ummah';
import { getOrgScope, getOrganizationBySlug } from '$lib/server/organizations';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);

const requireOrgContext = async (locals: App.Locals, slug: string) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const role = locals.user.role ?? '';
	if (!orgId || isSystemAdmin || !allowedRoles.has(role)) {
		throw error(403, 'Tidak memiliki akses');
	}

	const org = await getOrganizationBySlug(locals.db, slug);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	if (org.id !== orgId) {
		throw error(403, 'Akses organisasi tidak sesuai');
	}

	return { db: locals.db, orgId, user: locals.user, org };
};

const parseSohibul = (value: string | null) => {
	if (!value) return [] as string[];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map((item) => `${item}`) : [`${parsed}`];
	} catch {
		return [value];
	}
};

export const load: PageServerLoad = async ({ locals, params }) => {
	const { db, orgId, user, org } = await requireOrgContext(locals, params.slug);
	await ensureUmmahTables(db);
	const canManageKas = org.type === 'masjid' || org.type === 'musholla';

	const { results: programRows } = await db
		.prepare(
			`SELECT id, nama_program as namaProgram, tahun, status, created_by as createdBy, created_at as createdAt
			 FROM program_amal
			 WHERE organization_id = ?
			 ORDER BY created_at DESC`
		)
		.bind(orgId)
		.all<{
			id: string;
			namaProgram: string;
			tahun: number;
			status: string;
			createdBy: string;
			createdAt: number;
		}>();

	const programs = (programRows ?? []) as {
		id: string;
		namaProgram: string;
		tahun: number;
		status: string;
		createdBy: string;
		createdAt: number;
	}[];
	const activeProgramId = programs.find((program) => program.status === 'open')?.id ?? programs[0]?.id ?? null;

	const { results: zakatRows } = await db
		.prepare(
			`SELECT tz.id,
				tz.nama_muzakki as namaMuzakki,
				tz.jumlah_jiwa as jumlahJiwa,
				tz.jenis_bayar as jenisBayar,
				tz.nominal,
				tz.diterima_oleh as diterimaOleh,
				tz.created_at as createdAt,
				pa.nama_program as namaProgram
			 FROM transaksi_zakat tz
			 JOIN program_amal pa ON pa.id = tz.program_id
			 WHERE pa.organization_id = ?
			 ORDER BY tz.created_at DESC
			 LIMIT 30`
		)
		.bind(orgId)
		.all<{
			id: string;
			namaMuzakki: string;
			jumlahJiwa: number;
			jenisBayar: string;
			nominal: number;
			diterimaOleh: string;
			createdAt: number;
			namaProgram: string;
		}>();

	const { results: qurbanRows } = await db
		.prepare(
			`SELECT dq.id,
				dq.jenis_hewan as jenisHewan,
				dq.nama_sohibul_qurban as namaSohibulQurban,
				dq.status_hewan as statusHewan,
				dq.created_at as createdAt,
				pa.nama_program as namaProgram
			 FROM data_qurban dq
			 JOIN program_amal pa ON pa.id = dq.program_id
			 WHERE pa.organization_id = ?
			 ORDER BY dq.created_at DESC
			 LIMIT 30`
		)
		.bind(orgId)
		.all<{
			id: string;
			jenisHewan: string;
			namaSohibulQurban: string;
			statusHewan: string;
			createdAt: number;
			namaProgram: string;
		}>();

	const zakat = (zakatRows ?? []) as {
		id: string;
		namaMuzakki: string;
		jumlahJiwa: number;
		jenisBayar: string;
		nominal: number;
		diterimaOleh: string;
		createdAt: number;
		namaProgram: string;
	}[];

	const qurban = (qurbanRows ?? []).map((row) => ({
		...row,
		namaSohibulQurban: parseSohibul(row.namaSohibulQurban)
	}));

	const { results: summaryRows } = await db
		.prepare(
			`SELECT tz.jenis_bayar as jenisBayar,
				SUM(tz.nominal) as totalNominal,
				SUM(tz.jumlah_jiwa) as totalJiwa
			 FROM transaksi_zakat tz
			 JOIN program_amal pa ON pa.id = tz.program_id
			 WHERE pa.organization_id = ?
			 GROUP BY tz.jenis_bayar`
		)
		.bind(orgId)
		.all<{
			jenisBayar: string;
			totalNominal: number | null;
			totalJiwa: number | null;
		}>();

	const totals = {
		beras: 0,
		uang: 0,
		jiwa: 0
	};
	for (const row of summaryRows ?? []) {
		const nominal = row.totalNominal ?? 0;
		const jiwa = row.totalJiwa ?? 0;
		if (row.jenisBayar === 'beras') {
			totals.beras = nominal;
		} else if (row.jenisBayar === 'uang') {
			totals.uang = nominal;
		}
		totals.jiwa += jiwa;
	}

	let kasSummary = { masuk: 0, keluar: 0, saldo: 0 };
	let kasEntries: {
		id: string;
		tanggal: number;
		tipe: string;
		kategori: string;
		keterangan: string | null;
		nominal: number;
		createdAt: number;
	}[] = [];

	if (canManageKas) {
		const { results: kasSummaryRows } = await db
			.prepare(
				`SELECT tipe,
					SUM(nominal) as totalNominal
				 FROM kas_masjid
				 WHERE organization_id = ?
				 GROUP BY tipe`
			)
			.bind(orgId)
			.all<{ tipe: string; totalNominal: number | null }>();

		for (const row of kasSummaryRows ?? []) {
			const nominal = row.totalNominal ?? 0;
			if (row.tipe === 'masuk') {
				kasSummary.masuk = nominal;
			} else if (row.tipe === 'keluar') {
				kasSummary.keluar = nominal;
			}
		}
		kasSummary.saldo = kasSummary.masuk - kasSummary.keluar;

		const { results: kasRows } = await db
			.prepare(
				`SELECT id,
					tanggal,
					tipe,
					kategori,
					keterangan,
					nominal,
					created_at as createdAt
				 FROM kas_masjid
				 WHERE organization_id = ?
				 ORDER BY tanggal DESC, created_at DESC
				 LIMIT 30`
			)
			.bind(orgId)
			.all<{
				id: string;
				tanggal: number;
				tipe: string;
				kategori: string;
				keterangan: string | null;
				nominal: number;
				createdAt: number;
			}>();

		kasEntries = (kasRows ?? []) as typeof kasEntries;
	}

	return {
		org,
		programs,
		activeProgramId,
		zakat,
		qurban,
		totals,
		canManageKas,
		kasSummary,
		kasEntries,
		currentUser: user
	};
};

export const actions: Actions = {
	createProgram: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		const role = locals.user.role ?? '';
		if (!orgId || isSystemAdmin || !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationBySlug(locals.db, params.slug);
		if (!org || org.id !== orgId) {
			return fail(403, { error: 'Akses organisasi tidak sesuai' });
		}

		await ensureUmmahTables(locals.db);

		const data = await request.formData();
		const namaProgram = `${data.get('namaProgram') ?? ''}`.trim();
		const tahunRaw = `${data.get('tahun') ?? ''}`.trim();
		const status = `${data.get('status') ?? 'open'}`.trim();

		const tahun = Number(tahunRaw);
		if (!namaProgram || !Number.isFinite(tahun)) {
			return fail(400, { error: 'Nama program dan tahun wajib diisi' });
		}
		if (status !== 'open' && status !== 'closed') {
			return fail(400, { error: 'Status tidak valid' });
		}

		await locals.db
			.prepare(
				`INSERT INTO program_amal (id, organization_id, nama_program, tahun, status, created_by, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), orgId, namaProgram, tahun, status, locals.user.id, Date.now())
			.run();

		return { success: true };
	},

	addZakat: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		const role = locals.user.role ?? '';
		if (!orgId || isSystemAdmin || !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationBySlug(locals.db, params.slug);
		if (!org || org.id !== orgId) {
			return fail(403, { error: 'Akses organisasi tidak sesuai' });
		}

		await ensureUmmahTables(locals.db);

		const data = await request.formData();
		const programId = `${data.get('programId') ?? ''}`.trim();
		const namaMuzakki = `${data.get('namaMuzakki') ?? ''}`.trim();
		const jumlahJiwaRaw = `${data.get('jumlahJiwa') ?? ''}`.trim();
		const jenisBayar = `${data.get('jenisBayar') ?? ''}`.trim();
		const nominalRaw = `${data.get('nominal') ?? ''}`.trim();
		const diterimaOleh = `${data.get('diterimaOleh') ?? ''}`.trim();

		const jumlahJiwa = Number(jumlahJiwaRaw || '1');
		const nominal = Number(nominalRaw);

		if (!programId || !namaMuzakki || !diterimaOleh || !Number.isFinite(nominal)) {
			return fail(400, { error: 'Data transaksi belum lengkap' });
		}
		if (!Number.isFinite(jumlahJiwa) || jumlahJiwa < 1) {
			return fail(400, { error: 'Jumlah jiwa tidak valid' });
		}
		if (jenisBayar !== 'beras' && jenisBayar !== 'uang') {
			return fail(400, { error: 'Jenis bayar tidak valid' });
		}

		const program = await locals.db
			.prepare('SELECT id FROM program_amal WHERE id = ? AND organization_id = ?')
			.bind(programId, orgId)
			.first<{ id: string }>();
		if (!program) {
			return fail(404, { error: 'Program tidak ditemukan' });
		}

		await locals.db
			.prepare(
				`INSERT INTO transaksi_zakat (id, program_id, nama_muzakki, jumlah_jiwa, jenis_bayar, nominal, diterima_oleh, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				crypto.randomUUID(),
				programId,
				namaMuzakki,
				Math.floor(jumlahJiwa),
				jenisBayar,
				Math.floor(nominal),
				diterimaOleh,
				Date.now()
			)
			.run();

		return { success: true };
	},

	addQurban: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		const role = locals.user.role ?? '';
		if (!orgId || isSystemAdmin || !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationBySlug(locals.db, params.slug);
		if (!org || org.id !== orgId) {
			return fail(403, { error: 'Akses organisasi tidak sesuai' });
		}

		await ensureUmmahTables(locals.db);

		const data = await request.formData();
		const programId = `${data.get('programId') ?? ''}`.trim();
		const jenisHewan = `${data.get('jenisHewan') ?? ''}`.trim();
		const namaSohibulRaw = `${data.get('namaSohibul') ?? ''}`.trim();
		const statusHewan = `${data.get('statusHewan') ?? ''}`.trim();

		if (!programId || !jenisHewan || !namaSohibulRaw) {
			return fail(400, { error: 'Data qurban belum lengkap' });
		}
		if (statusHewan !== 'hidup' && statusHewan !== 'sembelih' && statusHewan !== 'bagi') {
			return fail(400, { error: 'Status hewan tidak valid' });
		}

		const program = await locals.db
			.prepare('SELECT id FROM program_amal WHERE id = ? AND organization_id = ?')
			.bind(programId, orgId)
			.first<{ id: string }>();
		if (!program) {
			return fail(404, { error: 'Program tidak ditemukan' });
		}

		const sohibulList = namaSohibulRaw
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
		const namaSohibulQurban = JSON.stringify(sohibulList.length ? sohibulList : [namaSohibulRaw]);

		await locals.db
			.prepare(
				`INSERT INTO data_qurban (id, program_id, jenis_hewan, nama_sohibul_qurban, status_hewan, created_at)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), programId, jenisHewan, namaSohibulQurban, statusHewan, Date.now())
			.run();

		return { success: true };
	},

	addKas: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Tidak terautentikasi' });
		if (!locals.db) return fail(500, { error: 'Database tidak tersedia' });

		const { orgId, isSystemAdmin } = getOrgScope(locals.user);
		const role = locals.user.role ?? '';
		if (!orgId || isSystemAdmin || !allowedRoles.has(role)) {
			return fail(403, { error: 'Tidak memiliki akses' });
		}

		const org = await getOrganizationBySlug(locals.db, params.slug);
		if (!org || org.id !== orgId) {
			return fail(403, { error: 'Akses organisasi tidak sesuai' });
		}
		if (org.type !== 'masjid' && org.type !== 'musholla') {
			return fail(400, { error: 'Fitur keuangan hanya untuk masjid atau musholla' });
		}

		await ensureUmmahTables(locals.db);

		const data = await request.formData();
		const tanggalRaw = `${data.get('tanggal') ?? ''}`.trim();
		const tipe = `${data.get('tipe') ?? ''}`.trim();
		const kategori = `${data.get('kategori') ?? ''}`.trim();
		const keterangan = `${data.get('keterangan') ?? ''}`.trim();
		const nominalRaw = `${data.get('nominal') ?? ''}`.trim();

		const nominal = Number(nominalRaw);
		const tanggalValue = Date.parse(`${tanggalRaw}T00:00:00`);

		if (!tanggalRaw || !Number.isFinite(tanggalValue)) {
			return fail(400, { error: 'Tanggal tidak valid' });
		}
		if (tipe !== 'masuk' && tipe !== 'keluar') {
			return fail(400, { error: 'Tipe transaksi tidak valid' });
		}
		if (!kategori) {
			return fail(400, { error: 'Kategori wajib diisi' });
		}
		if (!Number.isFinite(nominal) || nominal <= 0) {
			return fail(400, { error: 'Nominal harus lebih dari 0' });
		}

		await locals.db
			.prepare(
				`INSERT INTO kas_masjid (id, organization_id, tanggal, tipe, kategori, keterangan, nominal, created_by, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				crypto.randomUUID(),
				orgId,
				tanggalValue,
				tipe,
				kategori,
				keterangan || null,
				nominal,
				locals.user.id,
				Date.now()
			)
			.run();

		return { success: true };
	}
};
