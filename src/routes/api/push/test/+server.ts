import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushToUser } from '$lib/server/notifications/push-sender';

// Uji coba notifikasi.
//
// Sengaja HANYA mengirim ke locals.user.id — id tujuan tidak pernah diambil
// dari badan permintaan. Kalau klien boleh menentukan tujuan, endpoint ini
// berubah menjadi alat mengirim notifikasi ke pengguna lain.
export const POST: RequestHandler = async ({ locals, platform, fetch }) => {
	if (!locals.user) throw error(401, 'Silakan masuk terlebih dahulu.');
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia.');

	const results = await sendPushToUser({
		db: locals.db,
		fetchFn: fetch,
		env: platform?.env ?? {},
		userId: locals.user.id,
		message: {
			title: 'Uji coba berhasil',
			body: 'Pengingat SantriOnline sudah aktif di perangkat ini.',
			url: '/akun',
			tag: 'uji-coba'
		}
	});

	// Hasil dilaporkan apa adanya supaya kegagalan terlihat, bukan
	// disembunyikan sebagai sukses palsu.
	return json({
		terkirim: results.filter((r) => r.status === 'sent').length,
		kedaluwarsa: results.filter((r) => r.status === 'expired').length,
		gagal: results.filter((r) => r.status === 'failed').length,
		results
	});
};
