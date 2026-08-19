/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

import { bolehDisimpanDiCache, bersifatKekal } from '$lib/service-worker-policy';

// Service worker SantriOnline.
//
// Dua tugas:
//   1. Menerima Web Push dan membuka halaman yang tepat saat diketuk.
//   2. Melayani aset statis dari perangkat supaya perpindahan halaman tidak
//      menunggu jaringan.
//
// Yang TIDAK dilakukan: menyimpan balasan API atau halaman HTML. Aplikasi ini
// memakai sesi login dan satu perangkat sering dipakai bergantian, sehingga
// data akun sebelumnya bisa tersaji ke akun berikutnya. Aturan lengkapnya ada
// di src/lib/service-worker-policy.ts dan diuji di
// tests/service-worker-cache.test.ts.

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

// Nama cache mengandung versi build, sehingga rilis baru memakai cache baru
// dan cache lama dibuang saat aktivasi.
const NAMA_CACHE = `santrionline-aset-${version}`;

// Hanya berkas hasil build yang di-precache. Isi static/ tidak ikut karena
// ada 23 MB PDF kitab di dalamnya; berkas seperti itu cukup disimpan saat
// benar-benar dibuka.
const PRECACHE = build;

sw.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(NAMA_CACHE);
			// Satu berkas gagal diunduh tidak boleh menggagalkan pemasangan
			// service worker secara keseluruhan.
			await Promise.allSettled(PRECACHE.map((jalur) => cache.add(jalur)));
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
			for (const nama of await caches.keys()) {
				// Buang cache versi lama, termasuk peninggalan Workbox
				// (santri-pages, santri-api-data, dan sejenisnya) yang dulu
				// sempat menyimpan balasan API.
				if (nama !== NAMA_CACHE) await caches.delete(nama);
			}
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event: FetchEvent) => {
	const permintaan = event.request;

	if (permintaan.method !== 'GET') return;
	if (!bolehDisimpanDiCache(permintaan.url, sw.location.origin)) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(NAMA_CACHE);
			const tersimpan = await cache.match(permintaan);

			// Berkas build memakai nama ber-hash, jadi isinya tidak akan pernah
			// berubah. Langsung sajikan tanpa menyentuh jaringan.
			if (tersimpan && bersifatKekal(permintaan.url)) return tersimpan;

			// Aset lain: sajikan salinan lama lebih dulu, perbarui diam-diam.
			const pembaruan = fetch(permintaan)
				.then((balasan) => {
					if (balasan.ok && balasan.status === 200) {
						void cache.put(permintaan, balasan.clone());
					}
					return balasan;
				})
				.catch(() => undefined);

			if (tersimpan) {
				void pembaruan;
				return tersimpan;
			}

			const balasan = await pembaruan;
			// Bila jaringan mati dan tidak ada salinan, teruskan ke penanganan
			// bawaan browser alih-alih memaksa halaman galat.
			return balasan ?? fetch(permintaan);
		})()
	);
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

// `files` sengaja tidak dipakai untuk precache (isi static/ mencapai 23 MB),
// tetapi tetap diimpor agar SvelteKit menghitung ulang `version` ketika isi
// static/ berubah.
void files;
