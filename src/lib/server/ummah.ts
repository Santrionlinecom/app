import type { D1Database } from '@cloudflare/workers-types';

export const ensureUmmahTables = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS program_amal (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				nama_program TEXT NOT NULL,
				tahun INTEGER NOT NULL,
				status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
				created_by TEXT NOT NULL REFERENCES users(id),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_program_amal_org ON program_amal(organization_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_program_amal_status ON program_amal(status)').run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS transaksi_zakat (
				id TEXT PRIMARY KEY,
				program_id TEXT NOT NULL REFERENCES program_amal(id) ON DELETE CASCADE,
				nama_muzakki TEXT NOT NULL,
				jumlah_jiwa INTEGER NOT NULL DEFAULT 1,
				jenis_bayar TEXT NOT NULL CHECK (jenis_bayar IN ('beras', 'uang')),
				nominal INTEGER NOT NULL,
				diterima_oleh TEXT NOT NULL,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_transaksi_zakat_program ON transaksi_zakat(program_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_transaksi_zakat_jenis ON transaksi_zakat(jenis_bayar)')
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS data_qurban (
				id TEXT PRIMARY KEY,
				program_id TEXT NOT NULL REFERENCES program_amal(id) ON DELETE CASCADE,
				jenis_hewan TEXT NOT NULL,
				nama_sohibul_qurban TEXT NOT NULL,
				status_hewan TEXT NOT NULL DEFAULT 'hidup' CHECK (status_hewan IN ('hidup', 'sembelih', 'bagi')),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_data_qurban_program ON data_qurban(program_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_data_qurban_status ON data_qurban(status_hewan)').run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS kas_masjid (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				tanggal INTEGER NOT NULL,
				tipe TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
				kategori TEXT NOT NULL,
				keterangan TEXT,
				nominal INTEGER NOT NULL,
				created_by TEXT NOT NULL REFERENCES users(id),
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kas_masjid_org ON kas_masjid(organization_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kas_masjid_tanggal ON kas_masjid(tanggal)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_kas_masjid_tipe ON kas_masjid(tipe)').run();
};

export type OrgFinanceSummary = {
	kas: {
		masuk: number;
		keluar: number;
		saldo: number;
		updatedAt: number | null;
		entries: {
			tanggal: number;
			tipe: string;
			kategori: string;
			keterangan: string | null;
			nominal: number;
		}[];
	};
	zakat: {
		beras: number;
		uang: number;
		jiwa: number;
		updatedAt: number | null;
	};
	qurban: {
		total: number;
		status: { hidup: number; sembelih: number; bagi: number };
		jenis: { jenis: string; total: number }[];
		updatedAt: number | null;
	};
};

export const getOrgFinanceSummary = async (db: D1Database, orgId: string): Promise<OrgFinanceSummary> => {
	await ensureUmmahTables(db);

	const { results: kasSummaryRows } = await db
		.prepare(
			`SELECT tipe,
				SUM(nominal) as totalNominal,
				MAX(tanggal) as lastTanggal
			 FROM kas_masjid
			 WHERE organization_id = ?
			 GROUP BY tipe`
		)
		.bind(orgId)
		.all<{ tipe: string; totalNominal: number | null; lastTanggal: number | null }>();

	const kas = {
		masuk: 0,
		keluar: 0,
		saldo: 0,
		updatedAt: null as number | null,
		entries: [] as {
			tanggal: number;
			tipe: string;
			kategori: string;
			keterangan: string | null;
			nominal: number;
		}[]
	};

	for (const row of kasSummaryRows ?? []) {
		const nominal = row.totalNominal ?? 0;
		if (row.tipe === 'masuk') {
			kas.masuk = nominal;
		} else if (row.tipe === 'keluar') {
			kas.keluar = nominal;
		}
		if (row.lastTanggal && (!kas.updatedAt || row.lastTanggal > kas.updatedAt)) {
			kas.updatedAt = row.lastTanggal;
		}
	}
	kas.saldo = kas.masuk - kas.keluar;

	const { results: kasRows } = await db
		.prepare(
			`SELECT tanggal, tipe, kategori, keterangan, nominal
			 FROM kas_masjid
			 WHERE organization_id = ?
			 ORDER BY tanggal DESC, created_at DESC
			 LIMIT 10`
		)
		.bind(orgId)
		.all<{
			tanggal: number;
			tipe: string;
			kategori: string;
			keterangan: string | null;
			nominal: number;
		}>();

	kas.entries = (kasRows ?? []) as typeof kas.entries;

	const { results: zakatSummaryRows } = await db
		.prepare(
			`SELECT tz.jenis_bayar as jenisBayar,
				SUM(tz.nominal) as totalNominal,
				SUM(tz.jumlah_jiwa) as totalJiwa,
				MAX(tz.created_at) as lastUpdated
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
			lastUpdated: number | null;
		}>();

	const zakat = {
		beras: 0,
		uang: 0,
		jiwa: 0,
		updatedAt: null as number | null
	};

	for (const row of zakatSummaryRows ?? []) {
		const nominal = row.totalNominal ?? 0;
		const jiwa = row.totalJiwa ?? 0;
		if (row.jenisBayar === 'beras') {
			zakat.beras = nominal;
		} else if (row.jenisBayar === 'uang') {
			zakat.uang = nominal;
		}
		zakat.jiwa += jiwa;
		if (row.lastUpdated && (!zakat.updatedAt || row.lastUpdated > zakat.updatedAt)) {
			zakat.updatedAt = row.lastUpdated;
		}
	}

	const { results: qurbanRows } = await db
		.prepare(
			`SELECT dq.status_hewan as statusHewan,
				dq.jenis_hewan as jenisHewan,
				COUNT(*) as total,
				MAX(dq.created_at) as lastUpdated
			 FROM data_qurban dq
			 JOIN program_amal pa ON pa.id = dq.program_id
			 WHERE pa.organization_id = ?
			 GROUP BY dq.status_hewan, dq.jenis_hewan`
		)
		.bind(orgId)
		.all<{
			statusHewan: string;
			jenisHewan: string;
			total: number | null;
			lastUpdated: number | null;
		}>();

	const qurbanStatus: Record<string, number> = { hidup: 0, sembelih: 0, bagi: 0 };
	const qurbanJenisMap = new Map<string, number>();
	let qurbanTotal = 0;
	let qurbanUpdated: number | null = null;

	for (const row of qurbanRows ?? []) {
		const total = row.total ?? 0;
		qurbanTotal += total;
		if (row.statusHewan in qurbanStatus) {
			qurbanStatus[row.statusHewan] = (qurbanStatus[row.statusHewan] ?? 0) + total;
		}
		if (row.jenisHewan) {
			qurbanJenisMap.set(row.jenisHewan, (qurbanJenisMap.get(row.jenisHewan) ?? 0) + total);
		}
		if (row.lastUpdated && (!qurbanUpdated || row.lastUpdated > qurbanUpdated)) {
			qurbanUpdated = row.lastUpdated;
		}
	}

	const qurbanJenis = Array.from(qurbanJenisMap.entries()).map(([jenis, total]) => ({ jenis, total }));

	return {
		kas,
		zakat,
		qurban: {
			total: qurbanTotal,
			status: qurbanStatus,
			jenis: qurbanJenis,
			updatedAt: qurbanUpdated
		}
	};
};
