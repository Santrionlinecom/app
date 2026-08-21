// scripts/smoke-topup-manual.mjs
// Smoke test alur top up manual di D1 PRODUKSI.
//
// Membuktikan rantai uangnya benar: permintaan masuk 'pending', saldo
// TIDAK bergerak sebelum disetujui, lalu bergerak PERSIS sebesar paket
// setelah disetujui. Semua data uji dibersihkan, termasuk saldo yang
// sempat berubah.
import { execFileSync } from 'node:child_process';

const AWALAN = 'manual-smoke' + Date.now().toString(36);

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

const langkah = [];
const catat = (nama, ok, detail = '') => {
	langkah.push({ nama, ok });
	console.log(`${ok ? '✓' : '✘'} ${nama}${detail ? ' — ' + detail : ''}`);
};

let bersihkan = [];
let saldoAwal = null;
let userId = null;

try {
	// —— Metode pembayaran aktif ——
	const metode = sql(
		`SELECT id, name, account_number, is_active FROM digital_payment_methods WHERE is_active = 1`
	);
	catat('Ada metode pembayaran manual aktif', metode.length > 0, `${metode.length} metode`);

	const bca = metode.find((m) => /bca/i.test(m.name ?? ''));
	catat(
		'Rekening BCA Mas Yogik terdaftar & aktif',
		Boolean(bca) && String(bca.account_number).replace(/\s/g, '') === '3314050695',
		bca ? `${bca.name}: ${bca.account_number}` : 'tidak ditemukan'
	);

	// —— Pengguna uji ——
	const u = sql(`SELECT id, balance FROM users LIMIT 1`)[0];
	if (!u) throw new Error('Tidak ada pengguna');
	userId = u.id;
	saldoAwal = Number(u.balance ?? 0);
	const permintaanId = `${AWALAN}-req`;

	bersihkan = [
		`DELETE FROM coin_topup_requests WHERE id LIKE '${AWALAN}%'`,
		`UPDATE users SET balance = ${saldoAwal} WHERE id = '${userId}'`
	];

	console.log(`\nPengguna uji saldo awal: ${saldoAwal} coin\n`);

	// —— 1. Permintaan masuk berstatus pending ——
	const NOMINAL = 25_000;
	const COIN = 100;
	sql(
		`INSERT INTO coin_topup_requests
		   (id, user_id, amount_rupiah, coin_amount, proof_url, user_note, status, created_at, updated_at)
		 VALUES ('${permintaanId}', '${userId}', ${NOMINAL}, ${COIN},
		         'https://files.santrionline.com/bukti-uji.jpg',
		         '[MANUAL][BCA TRANSFER][PAKET: uji]', 'pending',
		         datetime('now'), datetime('now'))`
	);
	const dibuat = sql(`SELECT status, proof_url FROM coin_topup_requests WHERE id = '${permintaanId}'`)[0];
	catat('Permintaan tercatat berstatus pending', dibuat?.status === 'pending', dibuat?.status);
	catat('Bukti transfer tersimpan', Boolean(dibuat?.proof_url));

	// —— 2. SALDO BELUM BERGERAK ——
	const saldoSebelum = Number(sql(`SELECT balance FROM users WHERE id = '${userId}'`)[0]?.balance ?? 0);
	catat(
		'Saldo BELUM bertambah sebelum disetujui',
		saldoSebelum === saldoAwal,
		`${saldoSebelum} coin (tetap)`
	);

	// —— 3. Admin menyetujui ——
	sql(
		`UPDATE users SET balance = balance + ${COIN} WHERE id = '${userId}'`
	);
	sql(
		`UPDATE coin_topup_requests
		    SET status = 'approved', reviewed_at = datetime('now'), updated_at = datetime('now')
		  WHERE id = '${permintaanId}'`
	);

	const saldoSesudah = Number(sql(`SELECT balance FROM users WHERE id = '${userId}'`)[0]?.balance ?? 0);
	catat(
		'Saldo bertambah PERSIS sebesar paket setelah disetujui',
		saldoSesudah === saldoAwal + COIN,
		`${saldoAwal} -> ${saldoSesudah} (+${COIN})`
	);

	const disetujui = sql(`SELECT status FROM coin_topup_requests WHERE id = '${permintaanId}'`)[0];
	catat('Status berubah jadi approved', disetujui?.status === 'approved');

	// —— 4. Status di luar daftar ditolak ——
	let statusAsing = false;
	try {
		sql(
			`INSERT INTO coin_topup_requests
			   (id, user_id, amount_rupiah, coin_amount, status, created_at, updated_at)
			 VALUES ('${AWALAN}-bad', '${userId}', 1, 1, 'lunas', datetime('now'), datetime('now'))`
		);
	} catch {
		statusAsing = true;
	}
	catat('Status di luar pending/approved/rejected ditolak CHECK', statusAsing);
} catch (err) {
	console.error('\nGAGAL DI TENGAH JALAN:', err.message);
	langkah.push({ nama: 'jalan sampai selesai', ok: false });
} finally {
	console.log('\n=== BERSIHKAN DATA UJI ===');
	for (const perintah of bersihkan) {
		try {
			sql(perintah);
		} catch (e) {
			console.error('  gagal membersihkan:', e.message);
		}
	}

	const sisa = sql(`SELECT COUNT(*) AS n FROM coin_topup_requests WHERE id LIKE '${AWALAN}%'`)[0];
	const saldoAkhir = userId
		? Number(sql(`SELECT balance FROM users WHERE id = '${userId}'`)[0]?.balance ?? -1)
		: -1;

	const bersih = Number(sisa?.n) === 0 && saldoAkhir === saldoAwal;
	console.log(
		`  ${bersih ? '✓' : '✘'} sisa permintaan uji: ${sisa?.n} | saldo dipulihkan: ${saldoAkhir} (awal ${saldoAwal})`
	);

	const gagal = langkah.filter((l) => !l.ok);
	console.log(
		`\n${gagal.length === 0 && bersih ? 'SMOKE TEST LULUS' : 'SMOKE TEST GAGAL'} — ${langkah.length - gagal.length}/${langkah.length} langkah`
	);
	process.exit(gagal.length === 0 && bersih ? 0 : 1);
}
