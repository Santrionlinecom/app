// src/lib/server/halaqah/service.test.ts
// Penjaga aturan halaqah & setoran.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
	assertAnggotaHalaqah,
	balasSetoran,
	bersihkanTeks,
	kirimSetoran,
	tambahAnggota
} from './service.ts';

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
		},
		async batch(s: unknown[]) {
			return s.map(() => ({ success: true }));
		}
	};
	return db as unknown as Parameters<typeof tambahAnggota>[0] & { jejak: typeof jejak };
}

test('bersihkanTeks membuang karakter kendali dan memotong panjang', () => {
	assert.equal(bersihkanTeks('halo\u0000dunia', 100), 'halo dunia');
	assert.equal(bersihkanTeks('  spasi  ', 100), 'spasi');
	assert.equal(bersihkanTeks('abcdef', 3), 'abc');
});

test('bukan anggota halaqah ditolak', async () => {
	const db = buatDbTiruan(() => null);
	await assert.rejects(
		() => assertAnggotaHalaqah(db, 'hal-1', 'orang-asing'),
		/BUKAN_ANGGOTA_HALAQAH/
	);
});

test('kueri keanggotaan menyaring status aktif', async () => {
	const db = buatDbTiruan(() => ({ id: 'a1' }));
	await assertAnggotaHalaqah(db, 'hal-1', 'santri-1');
	const jejak = db.jejak.at(-1);
	assert.ok(jejak);
	assert.match(jejak.sql, /status\s*=\s*'aktif'/, 'lupa menyaring anggota aktif');
});

test('halaqah yang penuh menolak anggota baru', async () => {
	const db = buatDbTiruan((sql) => {
		if (sql.includes('FROM tpq_halaqoh')) return { id: 'hal-1', kapasitas: 12 };
		if (sql.includes('FROM halaqah_anggota') && sql.includes('COUNT')) return { n: 12 };
		return null; // belum jadi anggota
	});

	const hasil = await tambahAnggota(db, 'hal-1', 'santri-baru');
	assert.deepEqual(hasil, { ok: false, alasan: 'penuh' });
});

test('halaqah yang masih lapang menerima anggota', async () => {
	const db = buatDbTiruan((sql) => {
		if (sql.includes('FROM tpq_halaqoh')) return { id: 'hal-1', kapasitas: 12 };
		if (sql.includes('FROM halaqah_anggota') && sql.includes('COUNT')) return { n: 5 };
		return null;
	});

	const hasil = await tambahAnggota(db, 'hal-1', 'santri-baru');
	assert.deepEqual(hasil, { ok: true });
});

test('anggota yang sudah terdaftar tidak digandakan', async () => {
	const db = buatDbTiruan((sql) => {
		if (sql.includes('FROM tpq_halaqoh')) return { id: 'hal-1', kapasitas: 12 };
		if (sql.includes('FROM halaqah_anggota') && !sql.includes('COUNT')) return { id: 'ada' };
		return null;
	});

	const hasil = await tambahAnggota(db, 'hal-1', 'santri-1');
	assert.deepEqual(hasil, { ok: false, alasan: 'sudah_anggota' });
});

test('setoran santri SELALU berstatus submitted', async () => {
	let sqlInsert = '';
	const db = buatDbTiruan((sql) => {
		if (sql.includes('FROM halaqah_anggota')) return { id: 'a1' };
		if (sql.includes('FROM tpq_halaqoh')) return { institution_id: 'org-1', ustadz_user_id: 'ust-1' };
		if (sql.includes('INSERT INTO tpq_setoran')) sqlInsert = sql;
		return null;
	});

	await kirimSetoran(db, {
		halaqohId: 'hal-1',
		santriUserId: 'santri-1',
		jenis: 'hafalan',
		surah: 'Al-Baqarah',
		ayatDari: 1,
		ayatSampai: 5
	});

	const insert = db.jejak.find((j) => j.sql.includes('INSERT INTO tpq_setoran'));
	assert.ok(insert, 'setoran tidak tersimpan');
	assert.match(
		insert.sql,
		/'submitted'/,
		'setoran santri harus submitted — santri tidak boleh meluluskan dirinya sendiri'
	);
	assert.doesNotMatch(insert.sql, /'approved'/, 'setoran tidak boleh langsung approved');
});

test('setoran dari bukan anggota ditolak sebelum menyentuh tabel setoran', async () => {
	const db = buatDbTiruan(() => null); // bukan anggota

	await assert.rejects(
		() =>
			kirimSetoran(db, {
				halaqohId: 'hal-1',
				santriUserId: 'orang-asing',
				jenis: 'hafalan',
				surah: 'Al-Fatihah',
				ayatDari: 1,
				ayatSampai: 7
			}),
		/BUKAN_ANGGOTA_HALAQAH/
	);

	assert.ok(
		!db.jejak.some((j) => j.sql.includes('INSERT INTO tpq_setoran')),
		'tidak boleh ada penulisan setoran untuk bukan anggota'
	);
});

test('rentang ayat terbalik ditolak', async () => {
	const db = buatDbTiruan((sql) => (sql.includes('FROM halaqah_anggota') ? { id: 'a1' } : null));

	await assert.rejects(
		() =>
			kirimSetoran(db, {
				halaqohId: 'hal-1',
				santriUserId: 'santri-1',
				jenis: 'hafalan',
				surah: 'Yasin',
				ayatDari: 10,
				ayatSampai: 3
			}),
		/AYAT_TIDAK_SAH/
	);
});

test('balasan musyrif tidak boleh kosong', async () => {
	const db = buatDbTiruan(() => ({ id: 's1' }));

	await assert.rejects(
		() =>
			balasSetoran(db, {
				setoranId: 's1',
				ustadzUserId: 'ust-1',
				mutu: 'lancar',
				balasan: '  ',
				disetujui: true
			}),
		/BALASAN_KOSONG/
	);
});

test('hanya musyrif halaqah terkait yang boleh membalas', async () => {
	const db = buatDbTiruan(() => null); // bukan musyrif halaqah ini

	await assert.rejects(
		() =>
			balasSetoran(db, {
				setoranId: 's1',
				ustadzUserId: 'ustadz-lain',
				mutu: 'lancar',
				balasan: 'Alhamdulillah, lancar. Lanjutkan ya.',
				disetujui: true
			}),
		/BUKAN_MUSYRIF_SETORAN_INI/
	);
});

test('kueri hak balas mencocokkan ustadz halaqah, bukan sekadar id setoran', async () => {
	const db = buatDbTiruan(() => ({ id: 's1' }));
	await balasSetoran(db, {
		setoranId: 's1',
		ustadzUserId: 'ust-1',
		mutu: 'lancar',
		balasan: 'Bagus, pertahankan.',
		disetujui: true
	});

	const cek = db.jejak.find((j) => j.sql.includes('JOIN tpq_halaqoh'));
	assert.ok(cek, 'tidak ada pemeriksaan kepemilikan halaqah');
	assert.match(cek.sql, /h\.ustadz_user_id\s*=\s*\?/, 'lupa mencocokkan musyrif halaqah');
});
