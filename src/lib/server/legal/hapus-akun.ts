// src/lib/server/legal/hapus-akun.ts
// Penghapusan akun mandiri — hak subjek data (UU 27/2022).
//
// KEPUTUSAN PENTING: akun DIANONIMKAN, bukan dihapus barisnya.
//
// Ada 45 tabel yang mereferensikan users, sebagian besar ON DELETE CASCADE.
// Menjalankan DELETE akan ikut menghapus 394 baris progres hafalan, riwayat
// transaksi, dan setoran — padahal itu bukan cuma milik si pengguna:
//   • rekap hafalan adalah catatan pembinaan LEMBAGA;
//   • riwayat transaksi wajib disimpan untuk audit keuangan;
//   • setoran yang dinilai seorang ustadz adalah data milik SANTRI-nya.
//
// Yang menjadi data pribadi adalah IDENTITAS-nya: email, nama, WhatsApp,
// bio, handle, avatar. Begitu semuanya dikosongkan, baris yang tersisa tidak
// lagi menunjuk orang tertentu — tujuan perlindungan tercapai tanpa merusak
// catatan pihak lain.

export const ALASAN_TOLAK = {
	EMAIL_TIDAK_COCOK: 'EMAIL_TIDAK_COCOK',
	ADMIN_TUNGGAL: 'ADMIN_TUNGGAL',
	SUDAH_DIHAPUS: 'SUDAH_DIHAPUS'
} as const;

export type AlasanTolak = (typeof ALASAN_TOLAK)[keyof typeof ALASAN_TOLAK];

export const PESAN_TOLAK: Record<AlasanTolak, string> = {
	EMAIL_TIDAK_COCOK: 'Email yang Anda ketik tidak cocok dengan email akun ini.',
	ADMIN_TUNGGAL:
		'Anda satu-satunya admin lembaga ini. Angkat admin lain terlebih dahulu, atau hubungi kami untuk menutup lembaga.',
	SUDAH_DIHAPUS: 'Akun ini sudah dihapus.'
};

export type HasilHapus =
	| { ok: true }
	| { ok: false; alasan: AlasanTolak; pesan: string };

type DbLike = {
	prepare(sql: string): {
		bind(...args: unknown[]): {
			first<T>(): Promise<T | null>;
			all<T>(): Promise<{ results: T[] }>;
			run(): Promise<unknown>;
		};
	};
};

function tolak(alasan: AlasanTolak): HasilHapus {
	return { ok: false, alasan, pesan: PESAN_TOLAK[alasan] };
}

/**
 * Menghapus akun atas permintaan pemiliknya sendiri.
 *
 * Konfirmasi memakai email — pengguna harus mengetik ulang emailnya. Tombol
 * "yakin?" terlalu mudah tertekan untuk tindakan yang tidak bisa dibatalkan.
 */
export async function hapusAkunMandiri(
	db: DbLike,
	opsi: { userId: string; konfirmasiEmail: string }
): Promise<HasilHapus> {
	const akun = await db
		.prepare('SELECT id, email, org_id, dihapus_at FROM users WHERE id = ?')
		.bind(opsi.userId)
		.first<{ id: string; email: string; org_id: string | null; dihapus_at: number | null }>();

	// Akun tak dikenal dan email tak cocok dijawab SAMA — supaya jawaban ini
	// tidak bisa dipakai menebak-nebak akun mana yang ada.
	if (!akun) return tolak(ALASAN_TOLAK.EMAIL_TIDAK_COCOK);
	if (akun.dihapus_at) return tolak(ALASAN_TOLAK.SUDAH_DIHAPUS);

	const diketik = opsi.konfirmasiEmail.trim().toLowerCase();
	const sebenarnya = (akun.email ?? '').trim().toLowerCase();
	if (!diketik || diketik !== sebenarnya) {
		return tolak(ALASAN_TOLAK.EMAIL_TIDAK_COCOK);
	}

	// Lembaga tidak boleh ditinggalkan tanpa admin — santri dan wali di
	// dalamnya akan kehilangan pengelola tanpa mereka tahu sebabnya.
	if (akun.org_id) {
		const lembaga = await db
			.prepare('SELECT id FROM organizations WHERE id = ? AND akun_admin_id = ?')
			.bind(akun.org_id, akun.id)
			.first<{ id: string }>();

		if (lembaga) {
			const adminLain = await db
				.prepare(
					`SELECT COUNT(*) AS n FROM users
					  WHERE org_id = ? AND id <> ? AND role = 'admin' AND dihapus_at IS NULL`
				)
				.bind(akun.org_id, akun.id)
				.first<{ n: number }>();

			if (!adminLain || Number(adminLain.n) === 0) {
				return tolak(ALASAN_TOLAK.ADMIN_TUNGGAL);
			}
		}
	}

	const waktu = Date.now();
	// Email pengganti wajib unik: kolom email UNIQUE, dan bisa ada banyak
	// akun terhapus. Domain .invalid dijamin tidak pernah bisa dikirimi surel.
	const emailPengganti = `dihapus-${akun.id}@dihapus.invalid`;

	await db
		.prepare(
			`UPDATE users SET
				email = ?, username = NULL, whatsapp = NULL, bio = NULL,
				public_handle = NULL, avatar_url = NULL,
				password_hash = NULL, googleId = NULL,
				org_id = NULL, org_status = 'deleted',
				dihapus_at = ?
			 WHERE id = ?`
		)
		.bind(emailPengganti, waktu, akun.id)
		.run();

	// Cabut semua sesi. Tanpa ini, tab yang masih terbuka tetap bisa dipakai.
	await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(akun.id).run();

	// Jejak audit — sengaja TIDAK menyimpan ulang email yang baru dihapus,
	// karena itu berarti data pribadinya hidup lagi di tempat lain.
	await db
		.prepare(
			`INSERT INTO activity_logs (id, user_id, action, metadata, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(
			`hapus-${akun.id}-${waktu}`,
			akun.id,
			'HAPUS_AKUN_MANDIRI',
			JSON.stringify({ atasPermintaan: 'pemilik akun', waktu }),
			waktu
		)
		.run();

	return { ok: true };
}
