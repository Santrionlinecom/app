/**
 * Sumber santri untuk pencatatan setoran.
 *
 * Ada dua asal santri yang harus sama-sama bisa disetorkan:
 *
 *  1. `santri`  — hasil pendataan TPQ (tahap 1), tanpa akun login. Inilah
 *                 jalur normal untuk anak usia 5-12 tahun.
 *  2. `users`   — santri lama yang terlanjur dibuatkan akun login.
 *
 * Skema lama memaksa `santri_user_id NOT NULL REFERENCES users(id)` sehingga
 * santri hasil pendataan mustahil dicatat setorannya. Kini setiap setoran
 * menunjuk tepat satu di antara `santri_id` atau `santri_user_id`.
 */

export type SantriSumber = 'santri' | 'users';

export type SantriOption = {
	id: string;
	nama: string;
	sumber: SantriSumber;
	kelas: string | null;
};

export type SetoranSantriResult =
	| { ok: true; value: { santriId: string | null; santriUserId: string | null } }
	| { ok: false; error: string };

/**
 * Menggabungkan santri hasil pendataan dengan santri berakun lama menjadi satu
 * daftar pilihan, diurutkan menurut nama agar pengajar tidak perlu tahu asal
 * datanya.
 */
export const buildSantriOptions = (
	dariTabelSantri: SantriOption[],
	dariUsers: SantriOption[]
): SantriOption[] =>
	[...dariTabelSantri, ...dariUsers].sort((a, b) =>
		a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
	);

/**
 * Menentukan kolom tujuan berdasarkan asal santri.
 *
 * Keamanan: `daftar` hanya berisi santri milik lembaga aktif, sehingga id yang
 * tidak ada di dalamnya berarti percobaan mencatat setoran untuk santri
 * lembaga lain dan wajib ditolak.
 */
export const resolveSetoranSantri = (
	santriIdRaw: string,
	daftar: SantriOption[]
): SetoranSantriResult => {
	const id = typeof santriIdRaw === 'string' ? santriIdRaw.trim() : '';
	if (!id) {
		return { ok: false, error: 'Santri wajib dipilih.' };
	}

	const target = daftar.find((s) => s.id === id);
	if (!target) {
		return { ok: false, error: 'Santri tidak berada dalam scope pengajaran Anda.' };
	}

	return {
		ok: true,
		value:
			target.sumber === 'santri'
				? { santriId: target.id, santriUserId: null }
				: { santriId: null, santriUserId: target.id }
	};
};
