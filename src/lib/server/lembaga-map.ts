import type { D1Database } from '@cloudflare/workers-types';

export type LembagaMapRow = {
	id: string;
	nama: string;
	tipe: string;
	kota: string | null;
	provinsi: string | null;
	latitude: number | null;
	longitude: number | null;
	status: string;
};

export type LembagaMapStats = {
	total: number;
	aktif: number;
	pending: number;
};

const normalizeStatus = (status: string | null | undefined) =>
	(status ?? '').trim().replace(/[-\s]+/g, '_').toLowerCase();

export const getLembagaMapData = async (db: D1Database) => {
	const { results } = await db
		.prepare(
			`SELECT
				id,
				name as nama,
				type as tipe,
				COALESCE(NULLIF(TRIM(kota), ''), city) as kota,
				provinsi,
				latitude,
				longitude,
				status
			 FROM organizations
			 WHERE latitude IS NOT NULL
			   AND longitude IS NOT NULL
			 ORDER BY
				CASE
					WHEN LOWER(COALESCE(status, '')) IN ('active', 'aktif') THEN 0
					WHEN LOWER(COALESCE(status, '')) = 'pending' THEN 1
					ELSE 2
				END,
				name COLLATE NOCASE ASC`
		)
		.all<LembagaMapRow>();

	const lembaga = (results ?? []).map((row) => ({
		id: row.id,
		nama: row.nama,
		tipe: row.tipe,
		kota: row.kota,
		provinsi: row.provinsi,
		latitude: row.latitude == null ? null : Number(row.latitude),
		longitude: row.longitude == null ? null : Number(row.longitude),
		status: row.status
	}));

	const stats = lembaga.reduce<LembagaMapStats>(
		(acc, item) => {
			acc.total += 1;
			const status = normalizeStatus(item.status);
			if (status === 'active' || status === 'aktif') acc.aktif += 1;
			if (status === 'pending') acc.pending += 1;
			return acc;
		},
		{ total: 0, aktif: 0, pending: 0 }
	);

	return { lembaga, stats };
};
