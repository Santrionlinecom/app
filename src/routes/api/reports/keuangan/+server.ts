import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureOrgSchema, getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { ensureUmmahTables } from '$lib/server/ummah';

const allowedRoles = new Set(['admin', 'tamir', 'bendahara']);

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
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

const parseDateRange = (url: URL) => {
	const startRaw = url.searchParams.get('start');
	const endRaw = url.searchParams.get('end');
	let startTs: number | null = null;
	let endTs: number | null = null;
	if (startRaw) {
		startTs = Date.parse(`${startRaw}T00:00:00`);
		if (!Number.isFinite(startTs)) {
			throw error(400, 'Tanggal mulai tidak valid');
		}
	}
	if (endRaw) {
		endTs = Date.parse(`${endRaw}T23:59:59.999`);
		if (!Number.isFinite(endTs)) {
			throw error(400, 'Tanggal akhir tidak valid');
		}
	}
	if (startTs && endTs && endTs < startTs) {
		throw error(400, 'Rentang tanggal tidak valid');
	}
	return { startTs, endTs, startRaw, endRaw };
};

const parseSohibul = (value: string | null) => {
	if (!value) return '-';
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return parsed.map((item) => `${item}`).join(', ');
		return `${parsed}`;
	} catch {
		return value;
	}
};

export const GET: RequestHandler = async ({ locals, url }) => {
	ensureAuth(locals);
	const role = locals.user?.role ?? '';
	if (!allowedRoles.has(role)) {
		throw error(403, 'Tidak memiliki akses');
	}

	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	if (!orgId || isSystemAdmin) {
		throw error(403, 'Organisasi belum ditentukan');
	}

	const type = `${url.searchParams.get('type') ?? ''}`.trim();
	if (!type || !['kas', 'zakat', 'qurban'].includes(type)) {
		throw error(400, 'Jenis laporan tidak valid');
	}

	const db = locals.db!;
	await ensureOrgSchema(db);
	await ensureUmmahTables(db);

	const org = await getOrganizationById(db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	const { startTs, endTs, startRaw, endRaw } = parseDateRange(url);
	const params: Array<string | number> = [];

	let csvRows: string[][] = [];
	let header: string[] = [];
	let filenamePrefix = '';

	if (type === 'kas') {
		if (org.type !== 'masjid' && org.type !== 'musholla') {
			throw error(400, 'Laporan kas hanya untuk masjid atau musholla');
		}
		const conditions = ['km.organization_id = ?'];
		params.push(orgId);
		if (startTs != null) {
			conditions.push('km.tanggal >= ?');
			params.push(startTs);
		}
		if (endTs != null) {
			conditions.push('km.tanggal <= ?');
			params.push(endTs);
		}

		const { results } = await db
			.prepare(
				`SELECT km.tanggal,
					km.tipe,
					km.kategori,
					km.keterangan,
					km.nominal,
					km.created_at as createdAt,
					u.username,
					u.email
				 FROM kas_masjid km
				 LEFT JOIN users u ON u.id = km.created_by
				 WHERE ${conditions.join(' AND ')}
				 ORDER BY km.tanggal DESC, km.created_at DESC`
			)
			.bind(...params)
			.all<{
				tanggal: number;
				tipe: string;
				kategori: string;
				keterangan: string | null;
				nominal: number;
				createdAt: number;
				username: string | null;
				email: string | null;
			}>();

		header = ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal', 'Input Oleh', 'Dibuat Pada'];
		csvRows = (results ?? []).map((row) => [
			formatDate(row.tanggal),
			row.tipe,
			row.kategori,
			row.keterangan ?? '-',
			row.nominal.toString(),
			row.username || row.email || '-',
			formatDate(row.createdAt)
		]);
		filenamePrefix = 'kas';
	}

	if (type === 'zakat') {
		const conditions = ['pa.organization_id = ?'];
		params.push(orgId);
		if (startTs != null) {
			conditions.push('tz.created_at >= ?');
			params.push(startTs);
		}
		if (endTs != null) {
			conditions.push('tz.created_at <= ?');
			params.push(endTs);
		}

		const { results } = await db
			.prepare(
				`SELECT tz.nama_muzakki as namaMuzakki,
					tz.jumlah_jiwa as jumlahJiwa,
					tz.jenis_bayar as jenisBayar,
					tz.nominal,
					tz.diterima_oleh as diterimaOleh,
					tz.created_at as createdAt,
					pa.nama_program as namaProgram
				 FROM transaksi_zakat tz
				 JOIN program_amal pa ON pa.id = tz.program_id
				 WHERE ${conditions.join(' AND ')}
				 ORDER BY tz.created_at DESC`
			)
			.bind(...params)
			.all<{
				namaMuzakki: string;
				jumlahJiwa: number;
				jenisBayar: string;
				nominal: number;
				diterimaOleh: string;
				createdAt: number;
				namaProgram: string;
			}>();

		header = ['Tanggal', 'Program', 'Nama Muzakki', 'Jumlah Jiwa', 'Jenis Bayar', 'Nominal', 'Diterima Oleh'];
		csvRows = (results ?? []).map((row) => [
			formatDate(row.createdAt),
			row.namaProgram,
			row.namaMuzakki,
			row.jumlahJiwa.toString(),
			row.jenisBayar,
			row.nominal.toString(),
			row.diterimaOleh
		]);
		filenamePrefix = 'zakat';
	}

	if (type === 'qurban') {
		const conditions = ['pa.organization_id = ?'];
		params.push(orgId);
		if (startTs != null) {
			conditions.push('dq.created_at >= ?');
			params.push(startTs);
		}
		if (endTs != null) {
			conditions.push('dq.created_at <= ?');
			params.push(endTs);
		}

		const { results } = await db
			.prepare(
				`SELECT dq.jenis_hewan as jenisHewan,
					dq.status_hewan as statusHewan,
					dq.nama_sohibul_qurban as namaSohibulQurban,
					dq.created_at as createdAt,
					pa.nama_program as namaProgram
				 FROM data_qurban dq
				 JOIN program_amal pa ON pa.id = dq.program_id
				 WHERE ${conditions.join(' AND ')}
				 ORDER BY dq.created_at DESC`
			)
			.bind(...params)
			.all<{
				jenisHewan: string;
				statusHewan: string;
				namaSohibulQurban: string | null;
				createdAt: number;
				namaProgram: string;
			}>();

		header = ['Tanggal', 'Program', 'Jenis Hewan', 'Status Hewan', 'Nama Sohibul Qurban'];
		csvRows = (results ?? []).map((row) => [
			formatDate(row.createdAt),
			row.namaProgram,
			row.jenisHewan,
			row.statusHewan,
			parseSohibul(row.namaSohibulQurban)
		]);
		filenamePrefix = 'qurban';
	}

	const csv = [header, ...csvRows].map((line) => line.map(escapeCsv).join(',')).join('\n');
	const rangeLabel =
		startRaw || endRaw ? `-${startRaw ?? 'awal'}-${endRaw ?? 'akhir'}` : '';
	const dateStamp = new Date().toISOString().slice(0, 10);
	const filename = `laporan-${filenamePrefix}-${org.slug}${rangeLabel}-${dateStamp}.csv`;

	return new Response(`\ufeff${csv}`, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
