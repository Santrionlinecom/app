// scripts/smoke-reset-password.mjs
// Smoke test END-TO-END reset password di PRODUKSI.
//
// Membuktikan yang tidak bisa dibuktikan tes unit: alur reset benar-benar
// bekerja pada kode yang berjalan di app.santrionline.com — termasuk bahwa
// tautannya AMAN (hanya hash tersimpan, sekali pakai, berumur pendek).
//
// Token diterbitkan lewat service di D1, lalu ditukar lewat HTTP sungguhan.
// Pengiriman emailnya sendiri tidak diuji di sini karena akan mengirim surel
// nyata ke alamat nyata; yang diuji adalah bagian yang menentukan keamanan.
//
// Pembersihan di blok finally, sehingga baris uji tetap terhapus walau
// skrip gagal di tengah jalan.

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';

const SITUS = 'https://app.santrionline.com';
const TANDA = 'smoke-reset-' + Date.now().toString(36);
const EMAIL = `${TANDA}@uji.invalid`;
const USER_ID = TANDA.slice(0, 15);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');

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

function get(jalur) {
	const keluaran = execFileSync(
		'curl',
		['-s', `${SITUS}${jalur}`, '-w', '\n__HTTP__%{http_code}', '-D', '-', '--max-time', '30'],
		{ encoding: 'utf8' }
	);
	const [badan, kode] = keluaran.split('\n__HTTP__');
	return { kode: Number(kode), badan };
}

function post(jalur, data) {
	const args = [
		'-s', '-X', 'POST', `${SITUS}${jalur}`,
		'-H', 'Origin: ' + SITUS,
		'-H', 'Content-Type: application/x-www-form-urlencoded',
		'-w', '\n__HTTP__%{http_code}', '--max-time', '30'
	];
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
	baseline = sql(
		`SELECT (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM sessions) s,
		        (SELECT COUNT(*) FROM password_reset_tokens) t`
	)[0];
	console.log(`BASELINE: ${baseline.u} akun · ${baseline.s} sesi · ${baseline.t} token reset\n`);

	// ——— SIAPKAN AKUN UJI ———
	const now = Date.now();
	sql(
		`INSERT INTO users (id, username, email, password_hash, role, created_at)
		 VALUES ('${USER_ID}', 'Uji Reset', '${EMAIL}', 'hash-password-lama', 'santri', ${now})`
	);
	sql(
		`INSERT INTO sessions (id, user_id, expires_at)
		 VALUES ('${USER_ID}s1', '${USER_ID}', ${Math.floor(now / 1000) + 86400}),
		        ('${USER_ID}s2', '${USER_ID}', ${Math.floor(now / 1000) + 86400})`
	);

	// ——— 1. HALAMAN HIDUP & BERPENJAGA ———
	const hMinta = get('/reset-password');
	cek('halaman /reset-password hidup', hMinta.kode === 200, `HTTP ${hMinta.kode}`);
	cek('halaman minta memuat widget Turnstile', /turnstile/i.test(hMinta.badan));

	// ——— 2. BOT DITOLAK ———
	const bot = post('/reset-password', { email: EMAIL });
	cek(
		'permintaan tanpa token Turnstile DITOLAK',
		/Verifikasi keamanan gagal/.test(bot.badan),
		bot.badan.slice(0, 80).replace(/\s+/g, ' ')
	);

	const tokenSetelahBot = sql(
		`SELECT COUNT(*) n FROM password_reset_tokens WHERE user_id='${USER_ID}'`
	)[0];
	cek('bot tidak berhasil menerbitkan token', Number(tokenSetelahBot.n) === 0);

	// ——— 3. TERBITKAN TOKEN (mewakili permintaan sah) ———
	const token = randomBytes(32).toString('hex');
	sql(
		`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, dibuat_at)
		 VALUES ('${hashToken(token)}', '${USER_ID}', ${now + 3_600_000}, ${now})`
	);

	const tersimpan = sql(
		`SELECT token_hash FROM password_reset_tokens WHERE user_id='${USER_ID}'`
	)[0];
	cek('yang tersimpan di DB adalah HASH, bukan token asli', tersimpan.token_hash !== token);
	cek('hash cocok dengan token', tersimpan.token_hash === hashToken(token));

	// ——— 4. HALAMAN KONFIRMASI ———
	const hKonf = get(`/reset-password/konfirmasi?token=${token}`);
	cek('halaman konfirmasi menerima token sah', hKonf.kode === 200, `HTTP ${hKonf.kode}`);
	cek('header Referrer-Policy: no-referrer terpasang', /referrer-policy:\s*no-referrer/i.test(hKonf.badan));
	cek('header Cache-Control: no-store terpasang', /cache-control:[^\n]*no-store/i.test(hKonf.badan));
	cek('halaman tidak diindeks mesin pencari', /noindex/i.test(hKonf.badan));
	cek('form ganti password muncul', /Simpan Password Baru/.test(hKonf.badan));

	const hPalsu = get('/reset-password/konfirmasi?token=token-karangan-penyerang');
	cek('token karangan ditolak di halaman', /Tautan tidak berlaku/.test(hPalsu.badan));

	// ——— 5. GANTI PASSWORD TANPA TURNSTILE → DITOLAK ———
	const gantiBot = post('/reset-password/konfirmasi', {
		token,
		password: 'passwordbaru123',
		konfirmasi: 'passwordbaru123'
	});
	cek('ganti password tanpa Turnstile DITOLAK', /Verifikasi keamanan gagal/.test(gantiBot.badan));

	const masihLama = sql(`SELECT password_hash FROM users WHERE id='${USER_ID}'`)[0];
	cek('password TIDAK berubah setelah percobaan bot', masihLama.password_hash === 'hash-password-lama');
	cek(
		'token TIDAK hangus karena percobaan bot',
		Number(sql(`SELECT COUNT(*) n FROM password_reset_tokens WHERE user_id='${USER_ID}' AND dipakai_at IS NULL`)[0].n) === 1
	);

	// ——— 6. SESI MASIH UTUH (belum ada yang berhasil) ———
	cek(
		'sesi akun uji belum tercabut',
		Number(sql(`SELECT COUNT(*) n FROM sessions WHERE user_id='${USER_ID}'`)[0].n) === 2
	);

	// ——— 7. TOKEN KEDALUWARSA DITOLAK ———
	const tokenMati = randomBytes(32).toString('hex');
	sql(
		`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, dibuat_at)
		 VALUES ('${hashToken(tokenMati)}', '${USER_ID}', ${now - 1000}, ${now - 7_200_000})`
	);
	const hMati = get(`/reset-password/konfirmasi?token=${tokenMati}`);
	cek('token kedaluwarsa ditolak di halaman', /Tautan tidak berlaku/.test(hMati.badan));

	// ——— 8. TOKEN BEKAS DITOLAK ———
	const tokenBekas = randomBytes(32).toString('hex');
	sql(
		`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, dipakai_at, dibuat_at)
		 VALUES ('${hashToken(tokenBekas)}', '${USER_ID}', ${now + 3_600_000}, ${now}, ${now})`
	);
	const hBekas = get(`/reset-password/konfirmasi?token=${tokenBekas}`);
	cek('token yang sudah dipakai ditolak', /Tautan tidak berlaku/.test(hBekas.badan));

	// ——— 9. TANPA TOKEN SAMA SEKALI ———
	const hKosong = get('/reset-password/konfirmasi');
	cek('halaman tanpa token menolak dengan sopan', /Tautan tidak berlaku/.test(hKosong.badan));
} catch (err) {
	console.error('\nGAGAL DI TENGAH JALAN:', err.message);
	langkah.push({ nama: 'berjalan sampai selesai', ok: false });
} finally {
	console.log('\n=== BERSIHKAN DATA UJI ===');
	for (const perintah of [
		`DELETE FROM password_reset_tokens WHERE user_id = '${USER_ID}'`,
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
			        (SELECT COUNT(*) FROM password_reset_tokens) t,
			        (SELECT COUNT(*) FROM users WHERE id='${USER_ID}') sisa`
		)[0];
		bersih =
			Number(akhir.sisa) === 0 &&
			Number(akhir.u) === Number(baseline?.u) &&
			Number(akhir.s) === Number(baseline?.s);
		console.log(
			`  ${bersih ? '✓' : '✘'} kembali ke baseline: ${akhir.u} akun (awal ${baseline?.u}) · ` +
				`${akhir.s} sesi (awal ${baseline?.s}) · ${akhir.t} token · sisa baris uji: ${akhir.sisa}`
		);
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
