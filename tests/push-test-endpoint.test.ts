import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const rute = readFileSync('src/routes/api/push/test/+server.ts', 'utf8');
const tombol = readFileSync('src/lib/components/PushNotificationToggle.svelte', 'utf8');

// Uji coba notifikasi hanya boleh mengirim ke diri sendiri. Tanpa penjaga ini
// endpoint bisa dipakai mengirim notifikasi ke pengguna lain.
test('endpoint uji wajib menolak tamu dan mengirim ke locals.user sendiri', () => {
	assert.match(rute, /if \(!locals\.user\)/, 'wajib menolak yang belum masuk');
	assert.match(rute, /userId: locals\.user\.id/, 'wajib mengirim ke diri sendiri');
	assert.doesNotMatch(rute, /body\.userId|params\.userId/, 'user tujuan tidak boleh dari klien');
});

test('endpoint uji memakai pengirim push yang sudah teruji', () => {
	assert.match(rute, /sendPushToUser/, 'wajib memakai push-sender, bukan fetch mentah');
});

test('hasil pengiriman dilaporkan apa adanya ke pemanggil', () => {
	// Supaya kegagalan terlihat, bukan disembunyikan sebagai sukses palsu.
	assert.match(rute, /results|hasil/, 'wajib mengembalikan hasil pengiriman');
});

test('tombol uji coba tersedia setelah pengingat aktif', () => {
	assert.match(tombol, /\/api\/push\/test/, 'komponen wajib memanggil endpoint uji');
	assert.match(tombol, /uji/i, 'wajib ada label uji coba untuk pengguna');
});
