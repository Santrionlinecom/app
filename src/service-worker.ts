/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

// Service worker SantriOnline.
//
// SvelteKit otomatis membangun berkas ini menjadi service worker dan
// mendaftarkannya. Tugasnya sekarang hanya menerima Web Push dan membuka
// halaman yang tepat saat notifikasi diketuk.
//
// Sengaja TIDAK melakukan caching offline dulu: cache yang salah lebih
// berbahaya daripada tidak ada cache, karena santri bisa melihat materi
// kedaluwarsa tanpa sadar.

// Pola resmi SvelteKit: `self` di service worker bertipe ServiceWorkerGlobalScope,
// bukan Window. Cast lewat unknown karena keduanya tidak tumpang tindih.
const sw = self as unknown as ServiceWorkerGlobalScope;

type MuatanNotifikasi = {
	title?: string;
	body?: string;
	url?: string;
	tag?: string;
};

const JUDUL_BAWAAN = 'SantriOnline';
const IKON = '/pwa-192x192.png';
const LENCANA = '/pwa-192x192.png';

// Service worker baru langsung mengambil alih supaya perbaikan notifikasi
// tidak menunggu semua tab lama ditutup.
sw.addEventListener('install', () => {
	sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(sw.clients.claim());
});

sw.addEventListener('push', (event: PushEvent) => {
	// Push tanpa payload tetap harus memunculkan notifikasi: beberapa push
	// service mengirim ping kosong, dan browser akan menampilkan notifikasi
	// generik sendiri bila kita diam.
	let muatan: MuatanNotifikasi = {};
	try {
		muatan = event.data ? (event.data.json() as MuatanNotifikasi) : {};
	} catch {
		muatan = { body: event.data?.text() };
	}

	const judul = muatan.title?.trim() || JUDUL_BAWAAN;
	const opsi: NotificationOptions = {
		body: muatan.body?.trim() || 'Ada pembaruan untukmu di SantriOnline.',
		icon: IKON,
		badge: LENCANA,
		// tag membuat notifikasi sejenis saling menimpa, bukan menumpuk.
		tag: muatan.tag || 'santrionline',
		data: { url: muatan.url || '/' }
	};

	event.waitUntil(sw.registration.showNotification(judul, opsi));
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();
	const tujuan = (event.notification.data as { url?: string } | undefined)?.url || '/';

	event.waitUntil(
		(async () => {
			const daftar = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });

			// Kalau aplikasi sudah terbuka, fokuskan tab itu daripada membuka
			// jendela baru yang membingungkan.
			for (const klien of daftar) {
				if ('focus' in klien) {
					await klien.focus();
					if ('navigate' in klien && new URL(klien.url).pathname !== tujuan) {
						await klien.navigate(tujuan).catch(() => undefined);
					}
					return;
				}
			}

			await sw.clients.openWindow(tujuan);
		})()
	);
});
