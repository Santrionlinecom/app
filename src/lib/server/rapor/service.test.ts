// src/lib/server/rapor/service.test.ts
// Penjaga aturan rapor: privasi bawaan dan pembekuan angka.
import assert from 'node:assert/strict';
import test from 'node:test';
import { bentukSlug, potonganAcak, raporPublik, terbitkanRapor, ubahPublikasi } from './service.ts';

function buatDbTiruan(handler: (sql: string, params: unknown[]) => unknown) {
	const jejak: { sql: string; params: unknown[] }[] = [];
	const db = {
		jejak,
		prepare(sql: string) {
			let terikat: unknown[] = [];
			const stmt = {
				bind(...params: unknown[]) {
					terikat = params;
					return stmt;
				},
				async first<T>() {
					jejak.push({ sql, params: terikat });
					return (handler(sql, terikat) ?? null) as T | null;
				},
				async all<T>() {
					jejak.push({ sql, params: terikat });
					return { results: (handler(sql, terikat) ?? []) as T[] };
				},
				async run() {
					jejak.push({ sql, params: terikat });
					return { success: true, meta: { changes: 1 } };
				}
			};
			return stmt;
		}
	};
	return db as unknown as Parameters<typeof raporPublik>[0] & { jejak: typeof jejak };
}

const payloadContoh = JSON.stringify({
	periode: { mulai: '2026-01-01', selesai: '2026-06-30' },
	hafalan: { ayatDisetujui: 120, setoranDisetujui: 30, setoranTotal: 33 },
	habit: [],
	catatanLembaga: 'Alhamdulillah istiqamah.'
});

test('slug memuat lembaga, nama, dan potongan acak', () => {
	const slug = bentukSlug('tpq-alhidayah', 'Zaid Abdullah');
	assert.match(slug, /^tpq-alhidayah-zaid-abdullah-[a-z2-9]{4}$/);
});

test('slug aman dari karakter aneh pada nama', () => {
	const slug = bentukSlug('tpq/../rahasia', 'Zaid <script>');
	assert.doesNotMatch(slug, /[<>/.]/, 'slug tidak boleh memuat karakter path atau HTML');
});

test('potongan acak tidak memakai huruf yang mudah tertukar', () => {
	for (let i = 0; i < 200; i += 1) {
		assert.doesNotMatch(potonganAcak(), /[01oil]/);
	}
});

test('rapor BAWAANNYA privat saat diterbitkan', async () => {
	const db = buatDbTiruan((sql) => {
		if (sql.includes('SELECT id FROM certificates WHERE slug')) return null;
		if (sql.includes('FROM habit_streaks')) return []; // .all() harus array
		if (sql.includes('FROM tpq_setoran')) return { total: 0, disetujui: 0, ayat: 0 };
		return null;
	});

	await terbitkanRapor(db, {
		santriUserId: 'santri-1',
		orgId: 'org-1',
		orgSlug: 'tpq-alhidayah',
		santriNama: 'Zaid',
		judul: 'Rapor Semester 1',
		mulai: '2026-01-01',
		selesai: '2026-06-30',
		diterbitkanOleh: 'admin-1'
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO certificates'));
	assert.ok(insert, 'rapor tidak tersimpan');

	// Periksa NILAI yang ditulis, bukan bentuk teks SQL-nya.
	const kolom = insert.sql
		.slice(insert.sql.indexOf('(') + 1, insert.sql.indexOf(')'))
		.split(',')
		.map((k) => k.trim());
	const posisiPublic = kolom.indexOf('is_public');

	// is_public ditulis literal 0 di dalam VALUES, bukan lewat parameter.
	assert.ok(posisiPublic >= 0, 'kolom is_public tidak ada di INSERT');
	assert.match(
		insert.sql,
		/VALUES\s*\([^)]*,\s*0\s*,/,
		'rapor baru wajib privat: is_public harus ditulis 0'
	);
	assert.ok(
		!insert.params.includes(1),
		'tidak boleh ada parameter bernilai 1 yang bisa membuat rapor langsung publik'
	);
});

test('angka rapor DIBEKUKAN sebagai payload JSON, bukan dihitung ulang', async () => {
	const db = buatDbTiruan((sql) => {
		if (sql.includes('SELECT id FROM certificates WHERE slug')) return null;
		if (sql.includes('FROM tpq_setoran')) return { total: 33, disetujui: 30, ayat: 120 };
		return null;
	});

	await terbitkanRapor(db, {
		santriUserId: 'santri-1',
		orgId: 'org-1',
		orgSlug: 'tpq',
		santriNama: 'Zaid',
		judul: 'Rapor',
		mulai: '2026-01-01',
		selesai: '2026-06-30',
		diterbitkanOleh: 'admin-1'
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO certificates'));
	assert.ok(insert);
	const payloadParam = insert.params.find(
		(p) => typeof p === 'string' && p.startsWith('{') && p.includes('hafalan')
	);
	assert.ok(payloadParam, 'payload snapshot tidak ditulis');

	const beku = JSON.parse(String(payloadParam));
	assert.equal(beku.hafalan.ayatDisetujui, 120, 'angka harus dibekukan saat terbit');
	assert.equal(beku.hafalan.setoranDisetujui, 30);
});

test('rapor privat dibalas null (pemanggil membalas 404)', async () => {
	const db = buatDbTiruan(() => ({
		slug: 's1',
		title: 'Rapor',
		issued_at: '2026-08-21',
		payload: payloadContoh,
		is_public: 0,
		dicabut_at: null,
		santri_nama: 'Zaid',
		lembaga_nama: 'TPQ'
	}));

	assert.equal(await raporPublik(db, 's1'), null, 'rapor privat tidak boleh terbaca publik');
});

test('rapor yang dicabut tidak lagi terbaca meski is_public masih 1', async () => {
	const db = buatDbTiruan(() => ({
		slug: 's1',
		title: 'Rapor',
		issued_at: '2026-08-21',
		payload: payloadContoh,
		is_public: 1,
		dicabut_at: 1_700_000_000,
		santri_nama: 'Zaid',
		lembaga_nama: 'TPQ'
	}));

	assert.equal(await raporPublik(db, 's1'), null, 'rapor yang dicabut harus tertutup');
});

test('rapor publik yang sah terbaca lengkap', async () => {
	const db = buatDbTiruan(() => ({
		slug: 's1',
		title: 'Rapor Semester 1',
		issued_at: '2026-08-21',
		payload: payloadContoh,
		is_public: 1,
		dicabut_at: null,
		santri_nama: 'Zaid',
		lembaga_nama: 'TPQ Al-Hidayah'
	}));

	const hasil = await raporPublik(db, 's1');
	assert.ok(hasil);
	assert.equal(hasil.santriNama, 'Zaid');
	assert.equal(hasil.payload.hafalan.ayatDisetujui, 120);
});

test('payload rusak tidak menjatuhkan halaman publik', async () => {
	const db = buatDbTiruan(() => ({
		slug: 's1',
		title: 'Rapor',
		issued_at: '2026-08-21',
		payload: '{bukan json',
		is_public: 1,
		dicabut_at: null,
		santri_nama: 'Zaid',
		lembaga_nama: null
	}));

	assert.equal(await raporPublik(db, 's1'), null);
});

test('publikasi hanya bisa diubah oleh pemilik rapor', async () => {
	const db = buatDbTiruan(() => null);
	await ubahPublikasi(db, { raporId: 'r1', pemilikUserId: 'santri-1', publik: true });

	const update = db.jejak.find((j) => j.sql.includes('UPDATE certificates'));
	assert.ok(update);
	assert.match(
		update.sql,
		/santri_id\s*=\s*\?/,
		'perubahan publikasi wajib dibatasi pada pemilik rapor'
	);
});
