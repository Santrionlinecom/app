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
};
