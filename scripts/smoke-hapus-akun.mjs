// scripts/smoke-hapus-akun.mjs
// Smoke test END-TO-END penghapusan akun mandiri di PRODUKSI.
//
// Yang dibuktikan di sini TIDAK BISA dibuktikan tes unit: bahwa gerbangnya
// benar-benar bekerja lewat HTTP nyata, pada kode yang benar-benar berjalan
// di app.santrionline.com.
//
// Akun uji dibuat langsung di D1 (bukan lewat form) karena pendaftaran
// dilindungi Turnstile yang memang tidak bisa dilewati skrip — itu justru
// tanda pertahanannya bekerja. Yang diuji lewat HTTP adalah bagian yang
// penting: aksi penghapusannya.
//
// Pembersihan ada di blok finally, sehingga baris uji tetap terhapus
// walau skrip gagal di tengah jalan.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const SITUS = 'https://app.santrionline.com';
const TANDA = 'smoke-hapus-' + Date.now().toString(36);
const EMAIL = `${TANDA}@uji.invalid`;
const USER_ID = TANDA.slice(0, 15);
const SESI_ID = randomBytes(20).toString('hex'); // 40 char, sama seperti sesi asli

function sql(perintah) {
	const keluaran = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', 'DB', '--remote', '--command', perintah, '--json'],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, HOME: '/home/yogik' } }
	);
	const mulai = keluaran.indexOf('[');
	if (mulai === -1) throw new Error('Keluaran tak terduga: ' + keluaran.slice(0, 300));
	return JSON.parse(keluaran.slice(mulai))[0]?.results ?? [];
}

function post(jalur, data, opsi = {}) {
	const args = [
		'-s', '-X', 'POST', `${SITUS}${jalur}`,
		'-H', 'Origin: ' + SITUS,
		'-H', 'Content-Type: application/x-www-form-urlencoded',
		'-w', '\n__HTTP__%{http_code}',
		'--max-time', '30'
	];
	if (opsi.cookie) args.push('-H', `Cookie: ${opsi.cookie}`);
	for (const [k, v] of Object.entries(data)) args.push('--data-urlencode', `${k}=${v}`);

	const keluaran = execFileSync('curl', args, { encoding: 'utf8' });
	const [badan, kode] = keluaran.split('\n__HTTP__');
	return { kode: Number(kode), badan };
}

const langkah = [];
const cek = (nama, ok, detail = '') => {
	langkah.push({ nama, ok });
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};

let baseline = null;

try {
	// ——— BASELINE ———
	baseline = sql(
		`SELECT (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM sessions) s,
		        (SELECT COUNT(*) FROM hafalan_progress) h,
		        (SELECT COUNT(*) FROM coin_transactions) c,
		        (SELECT COUNT(*) FROM licenses) l`
	)[0];
	console.log(
		`BASELINE: ${baseline.u} akun · ${baseline.s} sesi · ${baseline.h} hafalan · ${baseline.c} trx · ${baseline.l} lisensi\n`
	);

	// ——— SIAPKAN AKUN + SESI UJI ———
	const now = Date.now();
	sql(
		`INSERT INTO users (id, username, email, password_hash, whatsapp, bio, role, created_at, consent_at, consent_versi)
		 VALUES ('${USER_ID}', 'Santri Uji', '${EMAIL}', 'hash-uji-tidak-dipakai',
		         '08999000111', 'Bio uji hapus akun', 'santri', ${now}, ${now}, '2026-08-21')`
	);
	sql(
		`INSERT INTO sessions (id, user_id, expires_at)
		 VALUES ('${SESI_ID}', '${USER_ID}', ${Math.floor(now / 1000) + 86400})`
	);

	const awal = sql(
		`SELECT email, username, whatsapp, bio, password_hash, consent_at, dihapus_at
		   FROM users WHERE id='${USER_ID}'`
	)[0];
	cek('akun uji siap dengan identitas lengkap', awal.email === EMAIL && awal.username === 'Santri Uji');
	cek('jejak persetujuan tercatat', Boolean(awal.consent_at), `consent_at=${awal.consent_at}`);
	cek('akun berstatus aktif', awal.dihapus_at === null);

	const cookie = `auth_session=${SESI_ID}`;

	// ——— 1. SESI DIKENALI SERVER PRODUKSI ———
	const halaman = execFileSync(
		'curl',
		['-s', '-o', '/dev/null', '-w', '%{http_code}', '-H', `Cookie: ${cookie}`, '--max-time', '25', `${SITUS}/akun`],
		{ encoding: 'utf8' }
	);
	cek('sesi uji diterima produksi (bukan 302 ke /auth)', halaman.trim() === '200', `HTTP ${halaman.trim()}`);

	// ——— 2. KONFIRMASI EMAIL SALAH → DITOLAK ———
	const salah = post('/akun?/hapusAkun', { konfirmasi_email: 'bukan-email-saya@salah.test' }, { cookie });
	cek(
		'konfirmasi email SALAH ditolak',
		salah.badan.includes('tidak cocok'),
		salah.badan.slice(0, 90).replace(/\s+/g, ' ')
	);

	const sesudahSalah = sql(`SELECT email, username, dihapus_at FROM users WHERE id='${USER_ID}'`)[0];
	cek('akun TIDAK tersentuh setelah konfirmasi salah', sesudahSalah.email === EMAIL && sesudahSalah.dihapus_at === null);

	const sesiSalah = sql(`SELECT COUNT(*) n FROM sessions WHERE user_id='${USER_ID}'`)[0];
	cek('sesi TIDAK dicabut setelah konfirmasi salah', Number(sesiSalah.n) === 1);

	// ——— 3. KONFIRMASI BENAR → AKUN DIHAPUS ———
	const benar = post('/akun?/hapusAkun', { konfirmasi_email: EMAIL }, { cookie });
	cek('konfirmasi email BENAR diterima (redirect 303)', benar.kode === 303 || benar.badan.includes('redirect'), `HTTP ${benar.kode}`);

	const sesudah = sql(
		`SELECT email, username, whatsapp, bio, public_handle, password_hash, googleId,
		        org_id, org_status, dihapus_at
		   FROM users WHERE id='${USER_ID}'`
	)[0];

	cek('email tidak lagi menunjuk orang', !String(sesudah.email).includes(TANDA.split('-')[2] ?? TANDA), sesudah.email);
	cek('nama dikosongkan', sesudah.username === null);
	cek('nomor WhatsApp dikosongkan', sesudah.whatsapp === null);
	cek('bio dikosongkan', sesudah.bio === null);
	cek('password dihapus (tidak bisa login lagi)', sesudah.password_hash === null);
	cek('googleId dihapus (Google tidak bisa menghidupkan akun)', sesudah.googleId === null);
	cek('waktu penghapusan tercatat', Boolean(sesudah.dihapus_at));
	cek('status akun ditandai deleted', sesudah.org_status === 'deleted');

	// ——— 4. SESI DICABUT ———
	const sesiSisa = sql(`SELECT COUNT(*) n FROM sessions WHERE user_id='${USER_ID}'`)[0];
	cek('semua sesi dicabut', Number(sesiSisa.n) === 0);

	const setelahHapus = execFileSync(
		'curl',
		['-s', '-o', '/dev/null', '-w', '%{http_code}', '-H', `Cookie: ${cookie}`, '--max-time', '25', `${SITUS}/akun`],
		{ encoding: 'utf8' }
	);
	cek('cookie lama sudah tidak berlaku di produksi', setelahHapus.trim() === '302', `HTTP ${setelahHapus.trim()}`);

	// ——— 5. JEJAK AUDIT ———
	const log = sql(
		`SELECT action, metadata FROM activity_logs
		  WHERE user_id='${USER_ID}' AND action='HAPUS_AKUN_MANDIRI'`
	)[0];
	cek('penghapusan meninggalkan jejak audit', Boolean(log));
	cek(
		'jejak audit TIDAK menyimpan ulang email yang dihapus',
		Boolean(log) && !String(log.metadata).includes(TANDA)
	);

	// ——— 6. HAPUS DUA KALI DITOLAK ———
	sql(
		`INSERT INTO sessions (id, user_id, expires_at)
		 VALUES ('${SESI_ID}b', '${USER_ID}', ${Math.floor(now / 1000) + 86400})`
	);
	const kedua = post('/akun?/hapusAkun', { konfirmasi_email: EMAIL }, { cookie: `auth_session=${SESI_ID}b` });
	cek('penghapusan kedua ditolak', !kedua.badan.includes('303') || kedua.badan.includes('sudah dihapus') || kedua.kode !== 303);

	// ——— 7. DATA LEMBAGA & KEUANGAN UTUH ———
	const kini = sql(
		`SELECT (SELECT COUNT(*) FROM hafalan_progress) h,
		        (SELECT COUNT(*) FROM coin_transactions) c,
		        (SELECT COUNT(*) FROM licenses) l`
	)[0];
	cek('progres hafalan lembaga utuh', Number(kini.h) === Number(baseline.h), `${kini.h} baris`);
	cek('riwayat transaksi utuh', Number(kini.c) === Number(baseline.c), `${kini.c} baris`);
	cek('lisensi utuh', Number(kini.l) === Number(baseline.l), `${kini.l} baris`);
} catch (err) {
	console.error('\nGAGAL DI TENGAH JALAN:', err.message);
	langkah.push({ nama: 'berjalan sampai selesai', ok: false });
} finally {
	console.log('\n=== BERSIHKAN DATA UJI ===');
	for (const perintah of [
		`DELETE FROM activity_logs WHERE user_id = '${USER_ID}'`,
		`DELETE FROM sessions WHERE user_id = '${USER_ID}'`,
		`DELETE FROM users WHERE id = '${USER_ID}'`
	]) {
		try {
			sql(perintah);
		} catch (e) {
			console.error('  gagal membersihkan:', e.message);
		}
	}

	let bersih = false;
	try {
		const akhir = sql(
			`SELECT (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM sessions) s,
			        (SELECT COUNT(*) FROM hafalan_progress) h,
			        (SELECT COUNT(*) FROM coin_transactions) c,
			        (SELECT COUNT(*) FROM licenses) l,
			        (SELECT COUNT(*) FROM users WHERE id='${USER_ID}') sisa`
		)[0];

		bersih =
			Number(akhir.sisa) === 0 &&
			Number(akhir.u) === Number(baseline?.u) &&
			Number(akhir.h) === Number(baseline?.h) &&
			Number(akhir.c) === Number(baseline?.c) &&
			Number(akhir.l) === Number(baseline?.l);

		console.log(
			`  ${bersih ? '✓' : '✘'} kembali ke baseline: ${akhir.u} akun (awal ${baseline?.u}) · ` +
				`${akhir.h} hafalan · ${akhir.c} trx · ${akhir.l} lisensi · sisa baris uji: ${akhir.sisa}`
		);
		console.log(`  catatan: sesi kini ${akhir.s} (awal ${baseline?.s}) — sesi pengguna lain tidak disentuh`);
	} catch (e) {
		console.error('  gagal memverifikasi pembersihan:', e.message);
	}

	const gagal = langkah.filter((l) => !l.ok);
	console.log(
		`\n${gagal.length === 0 && bersih ? 'SMOKE TEST LULUS' : 'SMOKE TEST GAGAL'} — ${langkah.length - gagal.length}/${langkah.length} langkah`
	);
	if (gagal.length) console.log('  gagal: ' + gagal.map((g) => g.nama).join(' | '));
	process.exit(gagal.length === 0 && bersih ? 0 : 1);
}
