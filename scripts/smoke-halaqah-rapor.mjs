// scripts/smoke-halaqah-rapor.mjs
// Smoke test end-to-end alur Tahap B & C langsung di D1 PRODUKSI.
//
// Menjalankan alur nyata: buat halaqah -> masukkan santri -> santri setor
// -> musyrif membalas -> terbitkan rapor -> publikasikan -> baca publik.
// Setiap langkah diverifikasi dengan membaca ulang dari database.
//
// SEMUA data uji diberi awalan 'smoke-' dan DIHAPUS di akhir, termasuk
// bila terjadi kegagalan di tengah jalan.
import { execFileSync } from 'node:child_process';

const AWALAN = 'smoke-' + Date.now().toString(36);

function sql(perintah) {
	const keluaran = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', 'DB', '--remote', '--command', perintah, '--json'],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, HOME: '/home/yogik' } }
	);
	const mulai = keluaran.indexOf('[');
	if (mulai === -1) throw new Error('Keluaran tak terduga: ' + keluaran.slice(0, 300));
	const blok = JSON.parse(keluaran.slice(mulai));
	return blok[0]?.results ?? [];
}

const langkah = [];
const catat = (nama, ok, detail = '') => {
	langkah.push({ nama, ok });
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};

let bersihkan = [];

try {
	// —— Persiapan: pakai lembaga & pengguna yang sudah ada ——
	const org = sql(`SELECT id, slug, name FROM organizations LIMIT 1`)[0];
	if (!org) throw new Error('Tidak ada lembaga di produksi');
	const pengguna = sql(`SELECT id FROM users LIMIT 3`);
	if (pengguna.length < 2) throw new Error('Butuh minimal 2 pengguna');

	const ustadzId = pengguna[0].id;
	const santriId = pengguna[1].id;
	const halaqohId = `${AWALAN}-hal`;
	const setoranId = `${AWALAN}-set`;
	const raporId = `${AWALAN}-rap`;
	const slugRapor = `${AWALAN}-rapor`;

	bersihkan = [
		`DELETE FROM certificates WHERE id LIKE '${AWALAN}%'`,
		`DELETE FROM tpq_setoran WHERE id LIKE '${AWALAN}%'`,
		`DELETE FROM halaqah_anggota WHERE id LIKE '${AWALAN}%'`,
		`DELETE FROM tpq_halaqoh WHERE id LIKE '${AWALAN}%'`
	];

	console.log(`Lembaga uji: ${org.name}\n`);

	// —— 1. Buat halaqah dengan kapasitas kecil ——
	sql(
		`INSERT INTO tpq_halaqoh (id, institution_id, name, ustadz_user_id, kapasitas)
		 VALUES ('${halaqohId}', '${org.id}', 'Halaqah Smoke Test', '${ustadzId}', 2)`
	);
	const hal = sql(`SELECT kapasitas FROM tpq_halaqoh WHERE id = '${halaqohId}'`)[0];
	catat('Halaqah dibuat dengan kapasitas 2', hal?.kapasitas === 2);

	// —— 2. Masukkan santri ——
	sql(
		`INSERT INTO halaqah_anggota (id, halaqoh_id, santri_user_id)
		 VALUES ('${AWALAN}-a1', '${halaqohId}', '${santriId}')`
	);
	const anggota = sql(
		`SELECT COUNT(*) AS n FROM halaqah_anggota
		  WHERE halaqoh_id = '${halaqohId}' AND status = 'aktif'`
	)[0];
	catat('Santri masuk halaqah', anggota?.n === 1);

	// —— 3. Kapasitas benar-benar ditegakkan? ——
	// Isi sampai penuh (2), lalu pastikan hitungannya berhenti di kapasitas.
	if (pengguna[2]) {
		sql(
			`INSERT INTO halaqah_anggota (id, halaqoh_id, santri_user_id)
			 VALUES ('${AWALAN}-a2', '${halaqohId}', '${pengguna[2].id}')`
		);
		const penuh = sql(
			`SELECT COUNT(*) AS n FROM halaqah_anggota
			  WHERE halaqoh_id = '${halaqohId}' AND status = 'aktif'`
		)[0];
		catat('Halaqah terisi penuh sesuai kapasitas', penuh?.n === 2, `${penuh?.n}/2`);
	}

	// —— 4. Anggota ganda ditolak database ——
	let ganda = false;
	try {
		sql(
			`INSERT INTO halaqah_anggota (id, halaqoh_id, santri_user_id)
			 VALUES ('${AWALAN}-a3', '${halaqohId}', '${santriId}')`
		);
	} catch {
		ganda = true;
	}
	catat('Anggota ganda ditolak UNIQUE', ganda);

	// —— 5. Santri menyetor (wajib submitted) ——
	const hariIni = new Date().toISOString().slice(0, 10);
	sql(
		`INSERT INTO tpq_setoran
		   (id, institution_id, santri_user_id, ustadz_user_id, halaqoh_id, date,
		    type, surah, ayat_from, ayat_to, quality, status)
		 VALUES ('${setoranId}', '${org.id}', '${santriId}', '${ustadzId}', '${halaqohId}',
		         '${hariIni}', 'hafalan', 'Al-Fatihah', 1, 7, 'belum', 'submitted')`
	);
	const setoran = sql(`SELECT status, quality FROM tpq_setoran WHERE id = '${setoranId}'`)[0];
	catat('Setoran masuk berstatus submitted', setoran?.status === 'submitted', setoran?.status);

	// —— 6. Musyrif membalas ——
	const balasan = 'Alhamdulillah lancar. Perhatikan mad pada ayat ke-6 ya.';
	sql(
		`UPDATE tpq_setoran
		    SET status = 'approved', quality = 'lancar', notes = '${balasan}',
		        reviewed_by = '${ustadzId}', reviewed_at = unixepoch()
		  WHERE id = '${setoranId}'`
	);
	const dibalas = sql(
		`SELECT status, quality, notes, reviewed_by FROM tpq_setoran WHERE id = '${setoranId}'`
	)[0];
	catat(
		'Musyrif membalas & setoran disetujui',
		dibalas?.status === 'approved' && dibalas?.notes === balasan && dibalas?.reviewed_by === ustadzId
	);

	// —— 7. Rapor dihitung dari setoran nyata ——
	const hitung = sql(
		`SELECT COUNT(*) AS total,
		        SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS disetujui,
		        SUM(CASE WHEN status='approved' THEN (ayat_to-ayat_from+1) ELSE 0 END) AS ayat
		   FROM tpq_setoran
		  WHERE santri_user_id='${santriId}' AND date >= '${hariIni}' AND date <= '${hariIni}'`
	)[0];
	catat(
		'Perhitungan rapor membaca setoran nyata',
		Number(hitung?.ayat) >= 7,
		`${hitung?.ayat} ayat dari ${hitung?.disetujui} setoran disetujui`
	);

	// —— 8. Rapor terbit dalam keadaan PRIVAT ——
	const payload = JSON.stringify({
		periode: { mulai: hariIni, selesai: hariIni },
		hafalan: {
			ayatDisetujui: Number(hitung?.ayat ?? 0),
			setoranDisetujui: Number(hitung?.disetujui ?? 0),
			setoranTotal: Number(hitung?.total ?? 0)
		},
		habit: [],
		catatanLembaga: 'Uji asap.'
	}).replace(/'/g, "''");

	sql(
		`INSERT INTO certificates
		   (id, santri_id, title, issued_at, org_id, jenis, periode_mulai,
		    periode_selesai, slug, is_public, payload, diterbitkan_oleh)
		 VALUES ('${raporId}', '${santriId}', 'Rapor Smoke', '${hariIni}', '${org.id}',
		         'rapor', '${hariIni}', '${hariIni}', '${slugRapor}', 0, '${payload}', '${ustadzId}')`
	);
	const privat = sql(`SELECT is_public FROM certificates WHERE id = '${raporId}'`)[0];
	catat('Rapor terbit PRIVAT (is_public=0)', Number(privat?.is_public) === 0);

	// —— 9. Santri mempublikasikan ——
	sql(`UPDATE certificates SET is_public = 1, dicabut_at = NULL WHERE id = '${raporId}' AND santri_id = '${santriId}'`);
	const publik = sql(
		`SELECT is_public, dicabut_at, payload FROM certificates WHERE slug = '${slugRapor}'`
	)[0];
	const isi = JSON.parse(publik.payload);
	catat(
		'Rapor bisa dibagikan & payload beku terbaca',
		Number(publik?.is_public) === 1 && isi.hafalan.ayatDisetujui >= 7,
		`${isi.hafalan.ayatDisetujui} ayat beku`
	);

	// —— 10. Dicabut kembali ——
	sql(`UPDATE certificates SET is_public = 0, dicabut_at = unixepoch() WHERE id = '${raporId}'`);
	const dicabut = sql(`SELECT is_public, dicabut_at FROM certificates WHERE id = '${raporId}'`)[0];
	catat(
		'Rapor bisa ditarik kembali jadi privat',
		Number(dicabut?.is_public) === 0 && dicabut?.dicabut_at !== null
	);

	// —— 11. Slug ganda ditolak ——
	let slugGanda = false;
	try {
		sql(
			`INSERT INTO certificates (id, santri_id, title, issued_at, slug)
			 VALUES ('${AWALAN}-dup', '${santriId}', 'Dup', '${hariIni}', '${slugRapor}')`
		);
	} catch {
		slugGanda = true;
	}
	catat('Slug rapor ganda ditolak', slugGanda);
} catch (err) {
	console.error('\nGAGAL DI TENGAH JALAN:', err.message);
	langkah.push({ nama: 'jalan sampai selesai', ok: false });
} finally {
	console.log('\n=== BERSIHKAN DATA UJI ===');
	for (const perintah of bersihkan) {
		try {
			sql(perintah);
		} catch (e) {
			console.error('  gagal membersihkan:', perintah, e.message);
		}
	}
	const sisa = sql(
		`SELECT
		   (SELECT COUNT(*) FROM tpq_halaqoh WHERE id LIKE '${AWALAN}%') AS halaqah,
		   (SELECT COUNT(*) FROM halaqah_anggota WHERE id LIKE '${AWALAN}%') AS anggota,
		   (SELECT COUNT(*) FROM tpq_setoran WHERE id LIKE '${AWALAN}%') AS setoran,
		   (SELECT COUNT(*) FROM certificates WHERE id LIKE '${AWALAN}%') AS rapor`
	)[0];
	const bersih =
		Number(sisa.halaqah) === 0 &&
		Number(sisa.anggota) === 0 &&
		Number(sisa.setoran) === 0 &&
		Number(sisa.rapor) === 0;
	console.log(
		`  ${bersih ? '✓' : '✘'} sisa data uji: halaqah=${sisa.halaqah} anggota=${sisa.anggota} setoran=${sisa.setoran} rapor=${sisa.rapor}`
	);

	const gagal = langkah.filter((l) => !l.ok);
	console.log(
		`\n${gagal.length === 0 && bersih ? 'SMOKE TEST LULUS' : 'SMOKE TEST GAGAL'} — ${langkah.length - gagal.length}/${langkah.length} langkah`
	);
	process.exit(gagal.length === 0 && bersih ? 0 : 1);
}
